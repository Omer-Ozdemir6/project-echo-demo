// katman_diagnose.js
// Proje kökünden çalıştır: node katman_diagnose.js
// JSON yapısını analiz eder, sorunları tespit eder

import fs from 'fs';
import path from 'path';

const BASE      = path.resolve(process.cwd(), 'src', 'data', 'episodes');
const MAIN_FILE = path.join(BASE, 'merged_story.json');

const ENDING_FILES = {
  episode_18: path.join(BASE, 'episode-18.json'),
  episode_19: path.join(BASE, 'episode-19.json'),
  episode_20: path.join(BASE, 'episode-20.json'),
};

// ─── Yükle ────────────────────────────────────────────────────────────────────
const raw     = JSON.parse(fs.readFileSync(MAIN_FILE, 'utf-8'));
const nodes   = raw.nodes   || {};
const puzzles = raw.puzzles || {};

const allNodes = { ...nodes };
for (const [id, file] of Object.entries(ENDING_FILES)) {
  if (fs.existsSync(file)) {
    const ep = JSON.parse(fs.readFileSync(file, 'utf-8'));
    Object.assign(allNodes, ep.nodes || {});
    Object.assign(puzzles,  ep.puzzles || {});
  }
}

const nodeIds = new Set(Object.keys(allNodes));

console.log('═'.repeat(60));
console.log('KATMAN TANI SİSTEMİ');
console.log('═'.repeat(60));
console.log(`Toplam node:   ${nodeIds.size}`);
console.log(`Toplam puzzle: ${Object.keys(puzzles).length}`);

// ─── 1. JSON ÜST YAPI ─────────────────────────────────────────────────────────
console.log('\n1. JSON ÜST YAPI (merged_story.json anahtarları):');
console.log('  ', Object.keys(raw));
console.log('  startNodeId:', raw.startNodeId || '(yok)');

// ─── 2. İLK NODE İNCELEMESİ ──────────────────────────────────────────────────
const startId = raw.startNodeId || 'ep01_n01';
console.log(`\n2. BAŞLANGIÇ NODE'U: ${startId}`);
const startNode = allNodes[startId];
if (!startNode) {
  console.log('  ✗ BULUNAMADI!');
} else {
  console.log('  Keys:', Object.keys(startNode));
  console.log('  Choices:', startNode.choices?.length ?? 0);
  console.log('  Events:', startNode.events?.map(e => e.type) ?? []);
  console.log('  nextNodeId:', startNode.nextNodeId ?? '(yok)');
  if (startNode.choices?.length) {
    console.log('  Choice hedefleri:');
    startNode.choices.forEach(c => {
      console.log(`    → nextNodeId: ${c.nextNodeId}  nextEpisodeId: ${c.nextEpisodeId ?? '-'}`);
    });
  }
}

// ─── 3. KIRUK BAĞLANTILAR ─────────────────────────────────────────────────────
console.log('\n3. KIRUK BAĞLANTILAR (referans var ama node yok):');
const broken = [];
for (const [nid, node] of Object.entries(allNodes)) {
  // choices
  for (const c of (node.choices || [])) {
    const t = c.nextNodeId;
    if (t && !nodeIds.has(t) && !c.nextEpisodeId) {
      broken.push({ from: nid, to: t, via: 'choice' });
    }
  }
  // node.nextNodeId
  if (node.nextNodeId && !nodeIds.has(node.nextNodeId)) {
    broken.push({ from: nid, to: node.nextNodeId, via: 'nextNodeId' });
  }
  // events
  for (const ev of (node.events || [])) {
    if (ev.type === 'puzzle') {
      const p = puzzles[ev.puzzleId];
      if (p) {
        if (p.successNodeId && !nodeIds.has(p.successNodeId))
          broken.push({ from: nid, to: p.successNodeId, via: `puzzle(${ev.puzzleId}).success` });
        if (p.failureNodeId && !nodeIds.has(p.failureNodeId))
          broken.push({ from: nid, to: p.failureNodeId, via: `puzzle(${ev.puzzleId}).failure` });
      }
    }
    if (ev.type === 'statBasedRouting') {
      for (const r of (ev.routes || [])) {
        if (r.nextNodeId && !nodeIds.has(r.nextNodeId) && !r.nextEpisodeId) {
          broken.push({ from: nid, to: r.nextNodeId, via: 'statBasedRouting' });
        }
      }
    }
    if (ev.type === 'characterBusy' && ev.returnNodeId && !nodeIds.has(ev.returnNodeId)) {
      broken.push({ from: nid, to: ev.returnNodeId, via: 'characterBusy.returnNodeId' });
    }
  }
}

if (broken.length === 0) {
  console.log('  ✓ Kırık bağlantı yok');
} else {
  console.log(`  ✗ ${broken.length} kırık bağlantı:`);
  broken.slice(0, 20).forEach(b =>
    console.log(`    ${b.from}  →  ${b.to}  (${b.via})`)
  );
  if (broken.length > 20) console.log(`    ... ve ${broken.length - 20} tane daha`);
}

// ─── 4. "choices" ANOMALİSİ ───────────────────────────────────────────────────
console.log('\n4. "choices" ANOMALISI:');
if (nodeIds.has('choices')) {
  console.log('  ✗ "choices" adında bir node var — JSON yapı hatası');
  console.log('  İçeriği:', JSON.stringify(allNodes['choices']).slice(0, 200));
} else {
  console.log('  ✓ "choices" node ID olarak yok (normal)');
}

// "choices" string'i içeren bağlantılar
const choicesRefs = [];
for (const [nid, node] of Object.entries(allNodes)) {
  for (const c of (node.choices || [])) {
    if (c.nextNodeId === 'choices') choicesRefs.push(nid);
  }
}
if (choicesRefs.length > 0) {
  console.log('  ✗ "choices" a bağlanan node\'lar:', choicesRefs);
}

// ─── 5. EP17 SON NODE (routing) ───────────────────────────────────────────────
console.log('\n5. EP17 SON NODE (statBasedRouting kontrolü):');
const ep17son = allNodes['ep17_son'];
if (!ep17son) {
  console.log('  ✗ ep17_son bulunamadı!');
  // Benzer node'ları bul
  const ep17nodes = Object.keys(allNodes).filter(n => n.startsWith('ep17'));
  console.log('  ep17 ile başlayan node\'lar:', ep17nodes);
} else {
  const routingEv = ep17son.events?.find(e => e.type === 'statBasedRouting');
  if (!routingEv) {
    console.log('  ✗ ep17_son\'da statBasedRouting event\'i yok!');
    console.log('  Events:', ep17son.events?.map(e => e.type));
    console.log('  choices:', ep17son.choices?.map(c => c.nextNodeId));
  } else {
    console.log('  ✓ statBasedRouting var, rotalar:');
    routingEv.routes.forEach(r => {
      const conds = JSON.stringify(r.conditions || {});
      console.log(`    → ${r.nextEpisodeId || r.nextNodeId}  ${r.default ? '(default)' : conds}`);
    });
  }
}

// ─── 6. LOOP PATIKASI ANALİZİ ────────────────────────────────────────────────
console.log('\n6. LOOP PATİKASI — İlk 30 adım manuel izleme:');
let cur = startId;
const seen = new Set();
for (let i = 0; i < 30; i++) {
  const n = allNodes[cur];
  if (!n) { console.log(`  Step ${i}: ✗ ${cur} BULUNAMADI`); break; }
  if (seen.has(cur)) { console.log(`  Step ${i}: ∞ ${cur} LOOP`); break; }
  seen.add(cur);

  const routingEv = n.events?.find(e => e.type === 'statBasedRouting');
  const choices   = n.choices || [];
  const nextNode  = n.nextNodeId;

  let next = null;
  let how  = '';

  if (routingEv) {
    const r = routingEv.routes.find(r => r.default) || routingEv.routes[0];
    next = r?.nextNodeId;
    how  = `statBasedRouting → ${r?.nextEpisodeId || next}`;
  } else if (choices.length > 0) {
    const c = choices[0]; // ilk seçim
    next = c.nextNodeId;
    how  = `choice[0]: "${c.text?.slice(0,30) || c.id}"`;
  } else if (nextNode) {
    next = nextNode;
    how  = 'nextNodeId';
  } else {
    how = 'TERMINAL';
  }

  console.log(`  ${String(i).padStart(2)}. ${cur.padEnd(35)} ${how}`);
  if (!next) break;
  cur = next;
}

// ─── 7. NODE SAYIM ve EP DAĞILIMI ────────────────────────────────────────────
console.log('\n7. EPISODE BAZLI NODE SAYIMI:');
const epCounts = {};
for (const nid of nodeIds) {
  const ep = nid.split('_')[0];
  epCounts[ep] = (epCounts[ep] || 0) + 1;
}
Object.entries(epCounts).sort().forEach(([ep, cnt]) =>
  console.log(`  ${ep.padEnd(8)} ${cnt} node`)
);

console.log('\n' + '═'.repeat(60));
console.log('TANI TAMAMLANDI');
console.log('═'.repeat(60));