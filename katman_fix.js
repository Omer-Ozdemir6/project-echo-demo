// katman_fix.js
// Proje kökünden çalıştır: node katman_fix.js
// JSON sorunlarını tespit eder ve düzeltilmiş dosya üretir.

import fs   from 'fs';
import path from 'path';

const BASE      = path.resolve(process.cwd(), 'src', 'data', 'episodes');
const MAIN_FILE = path.join(BASE, 'merged_story.json');
const OUT_FILE  = path.join(BASE, 'merged_story_fixed.json');

const raw     = JSON.parse(fs.readFileSync(MAIN_FILE, 'utf-8'));
const nodes   = raw.nodes   || {};
const puzzles = raw.puzzles || {};

console.log('═'.repeat(60));
console.log('KATMAN JSON FIXER');
console.log('═'.repeat(60));

const fixes   = [];
const manual  = [];   // Otomatik düzeltilemeyenler

// ─── FIX 1: "choices" ARRAY NODE ─────────────────────────────────────────────
// JSON merge sırasında bir node'un choices array'i üst seviyeye sızdı.
// İçerik: EP02 seçimleri (c_pc, c_dolap)
// Çözüm: "choices" node'unu sil + sahibi EP02 node'unu bul ve choices'ı geri ekle

if (Array.isArray(nodes['choices'])) {
  const leakedChoices = nodes['choices'];
  console.log('\n[FIX 1] "choices" array node bulundu — siliniyor...');
  console.log('  İçerik:', JSON.stringify(leakedChoices).slice(0, 150));

  // Bu choices'ları kullanan node'u bul (nextNodeId'lerden geri takip)
  const targetIds = leakedChoices.map(c => c.nextNodeId).filter(Boolean);
  console.log('  Bu choices şu node\'lara gidiyor:', targetIds);

  // Hangi EP02 node'u bu choices'ı kayıp?
  // Muhtemelen "choices" string'ine nextNodeId olarak bağlı bir node var
  const orphanSource = Object.entries(nodes).find(
    ([id, n]) => n?.choices?.some?.(c => c.nextNodeId === 'choices')
  );
  if (orphanSource) {
    const [srcId, srcNode] = orphanSource;
    console.log(`  Sahip node bulundu: ${srcId}`);
    console.log('  Mevcut choices:', srcNode.choices);
    // Düzelt: o node'un choices'ını leaked choices ile değiştir
    nodes[srcId].choices = leakedChoices;
    fixes.push(`"choices" array → ${srcId}.choices olarak taşındı`);
  } else {
    // Manuel müdahale gerekebilir — hangi EP02 node'u choices'sız?
    console.log('  ⚠  Sahip node otomatik bulunamadı. Candidates:');
    const candidates = Object.entries(nodes).filter(([id, n]) =>
      id.startsWith('ep02') &&
      n?.events?.length > 0 &&
      (!n.choices || n.choices.length === 0) &&
      !n.nextNodeId
    );
    candidates.slice(0, 5).forEach(([id]) => console.log(`     ${id}`));
    manual.push('FIX 1: "choices" node sahibini manuel bul ve choices\'ları ekle');
  }

  // Her halükarda "choices" node'unu sil
  delete nodes['choices'];
  fixes.push('"choices" sahte node silindi');
}

// ─── FIX 2: BROKEN CHECKPOINT REFERENCES ─────────────────────────────────────
// ep06_cp01, ep07_cp01, ep08_cp01, ep10_cp01, ep12_cp01 var olmayan node'lar.
// Bu ID'lere bağlı hard_fail node'ları gerçek checkpoint node'una işaret etmeli.

const nodeIds = new Set(Object.keys(nodes));

// Her episode'da gerçek checkpoint event'ini içeren node'u bul
console.log('\n[FIX 2] Broken checkpoint references düzeltiliyor...');

const FAKE_CHECKPOINTS = [
  'ep06_cp01', 'ep07_cp01', 'ep08_cp01', 'ep10_cp01', 'ep12_cp01'
];

// Her fake checkpoint için gerçek karşılığını bul
const checkpointMap = {};
for (const fakeId of FAKE_CHECKPOINTS) {
  const epPrefix = fakeId.replace('_cp01', '');
  // O episode'da checkpoint event'i olan node'u bul
  const realCp = Object.entries(nodes).find(([nid, node]) =>
    nid.startsWith(epPrefix) &&
    node?.events?.some(e => e.type === 'checkpoint')
  );
  if (realCp) {
    checkpointMap[fakeId] = realCp[0];
    console.log(`  ${fakeId}  →  ${realCp[0]}  ✓`);
  } else {
    // Checkpoint event yok, birinci node'u bul
    const firstNode = Object.keys(nodes)
      .filter(id => id.startsWith(epPrefix))
      .sort()[0];
    if (firstNode) {
      checkpointMap[fakeId] = firstNode;
      console.log(`  ${fakeId}  →  ${firstNode}  (ilk node, checkpoint yok)`);
    } else {
      console.log(`  ${fakeId}  →  ✗ bulunamadı`);
      manual.push(`FIX 2: ${fakeId} için gerçek checkpoint ID'sini bul`);
    }
  }
}

// Tüm node'larda bu referansları değiştir
let refFixed = 0;
function fixRefs(obj) {
  if (typeof obj !== 'object' || obj === null) return obj;
  if (Array.isArray(obj)) return obj.map(fixRefs);
  const result = {};
  for (const [k, v] of Object.entries(obj)) {
    if (typeof v === 'string' && checkpointMap[v]) {
      result[k] = checkpointMap[v];
      refFixed++;
    } else {
      result[k] = fixRefs(v);
    }
  }
  return result;
}
const fixedNodes = fixRefs(nodes);
if (refFixed > 0) {
  fixes.push(`${refFixed} broken checkpoint referansı düzeltildi`);
}

// ─── FIX 3: startNodeId EKLE ────────────────────────────────────────────────
console.log('\n[FIX 3] startNodeId ekleniyor...');
raw.startNodeId = 'ep01_n01';
fixes.push('startNodeId: "ep01_n01" eklendi');
console.log('  ✓ startNodeId: "ep01_n01"');

// ─── FIX 4: TERMINAL NODE RAPORU ─────────────────────────────────────────────
// Hiç choices ve nextNodeId'si olmayan node'lar — story gereksiz yerde ölüyor
console.log('\n[FIX 4] Terminal node\'lar (story burada duruyor):');

const terminalNodes = Object.entries(fixedNodes).filter(([nid, node]) => {
  if (!node || typeof node !== 'object') return false;
  const hasChoices  = node.choices?.length > 0;
  const hasNext     = !!node.nextNodeId;
  const hasPuzzle   = node.events?.some(e => e.type === 'puzzle');
  const hasRouting  = node.events?.some(e => e.type === 'statBasedRouting');
  const isBusy      = node.events?.some(e => e.type === 'characterBusy');
  const isEndingNode = nid.includes('kapan') || nid.includes('ep18') ||
                       nid.includes('ep19') || nid.includes('ep20');
  return !hasChoices && !hasNext && !hasPuzzle && !hasRouting && !isBusy && !isEndingNode;
});

if (terminalNodes.length === 0) {
  console.log('  ✓ Terminal node yok');
} else {
  console.log(`  ✗ ${terminalNodes.length} terminal node (bunlara dikkat et):`);
  terminalNodes.forEach(([nid]) => {
    // Bu node'a kim referans veriyor?
    const refs = Object.entries(fixedNodes)
      .filter(([, n]) => n?.choices?.some(c => c.nextNodeId === nid) || n?.nextNodeId === nid)
      .map(([id]) => id);
    console.log(`    ${nid}  ←  (${refs.join(', ') || 'hiçbir referans yok'})`);
  });
  manual.push(`FIX 4: ${terminalNodes.length} terminal node'a nextNodeId veya choices ekle`);
}

// ─── FIX 5: DEAD CHOICES ─────────────────────────────────────────────────────
console.log('\n[FIX 5] Dead choices (iki seçenek aynı yere gidiyor):');
const deadChoices = Object.entries(fixedNodes).filter(([, node]) => {
  const ch = node?.choices;
  if (!ch || ch.length < 2) return false;
  const targets = ch.map(c => c.nextNodeId + (c.nextEpisodeId || ''));
  return new Set(targets).size === 1;
});

if (deadChoices.length === 0) {
  console.log('  ✓ Dead choice yok');
} else {
  deadChoices.forEach(([nid, node]) => {
    console.log(`  ✗ ${nid}  → her iki seçenek de: ${node.choices[0].nextNodeId}`);
  });
  manual.push(`FIX 5: ${deadChoices.length} dead choice düzeltilmeli`);
}

// ─── ÇIKTI DOSYASI ────────────────────────────────────────────────────────────
const output = {
  ...raw,
  nodes:   fixedNodes,
  puzzles: puzzles,
};

fs.writeFileSync(OUT_FILE, JSON.stringify(output, null, 2), 'utf-8');

console.log('\n' + '═'.repeat(60));
console.log('ÖZET');
console.log('═'.repeat(60));
console.log(`\nOtomatik düzeltmeler (${fixes.length}):`);
fixes.forEach(f => console.log(`  ✓ ${f}`));

if (manual.length > 0) {
  console.log(`\nManuel müdahale gereken (${manual.length}):`);
  manual.forEach(m => console.log(`  ⚠  ${m}`));
}

console.log(`\nDüzeltilmiş dosya: ${OUT_FILE}`);
console.log('Kontrol ettikten sonra merged_story.json ile değiştir.');
console.log('\nSonraki adım:');
console.log('  node katman_explorer.js');