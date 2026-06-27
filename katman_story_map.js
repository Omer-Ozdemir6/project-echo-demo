// katman_story_map.js
// Hikaye haritası — bölüm geçişleri, ölümler, not zinciri
// node katman_story_map.js

import fs   from 'fs';
import path from 'path';

const BASE = path.resolve(process.cwd(), 'src', 'data', 'episodes');

const EP_FILES = {
  merged:      path.join(BASE, 'merged_story.json'),
  episode_18:  path.join(BASE, 'episode-18.json'),
  episode_19:  path.join(BASE, 'episode-19.json'),
  episode_20:  path.join(BASE, 'episode-20.json'),
};

// ─── Yükle ────────────────────────────────────────────────────────────────────
function loadAll() {
  const raw    = JSON.parse(fs.readFileSync(EP_FILES.merged, 'utf-8'));
  const nodes  = {};
  const puzzles= { ...(raw.puzzles||{}) };

  for (const [id,val] of Object.entries(raw.nodes||{}))
    if (val && typeof val==='object' && !Array.isArray(val)) nodes[id]=val;

  for (const [epId, file] of Object.entries(EP_FILES)) {
    if (epId==='merged') continue;
    if (!fs.existsSync(file)) continue;
    const ep = JSON.parse(fs.readFileSync(file,'utf-8'));
    for (const [id,val] of Object.entries(ep.nodes||{}))
      if (val && typeof val==='object' && !Array.isArray(val)) nodes[id]=val;
    Object.assign(puzzles, ep.puzzles||{});
  }
  return { nodes, puzzles };
}

// ─── İlk mesajı çek ───────────────────────────────────────────────────────────
function firstMsg(node, maxLen=60) {
  if (!node) return '(node yok)';
  const ev = (node.events||[]).find(e=>e.type==='message'||e.type==='systemAlert');
  const text = ev?.text || ev?.message || '';
  return text.slice(0, maxLen) + (text.length>maxLen?'…':'');
}

// ─── Bir node'a hangi node'lar yönlendiriyor ─────────────────────────────────
function whoPointsTo(targetId, nodes) {
  const refs = [];
  for (const [nid, node] of Object.entries(nodes)) {
    const inChoices = (node.choices||[]).some(c=>c.nextNodeId===targetId);
    const inNext    = node.nextNodeId === targetId;
    const inPuzzle  = (node.events||[]).some(e=>
      e.type==='puzzle' &&
      (e.successNodeId===targetId || e.failureNodeId===targetId)
    );
    if (inChoices||inNext||inPuzzle) refs.push(nid);
  }
  return refs;
}

// ════════════════════════════════════════════════════════════════════════════
// 1. BÖLÜM GEÇİŞLERİ
// ════════════════════════════════════════════════════════════════════════════
function analyzeTransitions(nodes) {
  console.log('\n' + '═'.repeat(68));
  console.log('1. BÖLÜM GEÇİŞLERİ — Nerede bitiyor, nerede başlıyor?');
  console.log('═'.repeat(68));

  // ep_son node'larını bul
  const sonNodes = Object.entries(nodes)
    .filter(([id]) => id.endsWith('_son') || id.endsWith('_bitis'))
    .sort(([a],[b]) => a.localeCompare(b));

  for (const [nid, node] of sonNodes) {
    const ep = nid.split('_')[0];

    // characterBusy event
    const busy = (node.events||[]).find(e=>e.type==='characterBusy');
    // Son seçim
    const finalChoice = (node.choices||[]).find(c=>c.nextEpisodeId||c.nextNodeId);

    const nextEp    = finalChoice?.nextEpisodeId || busy?.returnNodeId?.split('_')[0] || '?';
    const nextNode  = finalChoice?.nextNodeId || busy?.returnNodeId || '?';
    const choiceText= (finalChoice?.text||'').slice(0,55);
    const busyStatus= (busy?.status||'').slice(0,50);
    const busyMsg   = (busy?.message||'').slice(0,50);
    const waitMin   = busy?.durationMs ? Math.round(busy.durationMs/60000) : null;

    // Son mesajı bul
    const lastMsgEv = [...(node.events||[])].reverse()
      .find(e=>e.type==='message' && e.speaker==='JONES');
    const lastMsg = (lastMsgEv?.text||'').slice(0,60);

    // Bir sonraki bölümün ilk node'u
    const nextNodeObj = nodes[nextNode];
    const nextFirstMsg = firstMsg(nextNodeObj, 60);

    console.log(`\n  ── ${ep.toUpperCase()} → ${nextEp?.toUpperCase()||'?'} ────────────────────────────────`);
    console.log(`  Son node:     ${nid}`);
    if (lastMsg)     console.log(`  Son mesaj:    "${lastMsg}"`);
    if (busyStatus)  console.log(`  Bekleme:      ${busyStatus}`);
    if (waitMin)     console.log(`  Süre:         ~${waitMin} dakika`);
    if (choiceText)  console.log(`  Seçim:        "${choiceText}"`);
    console.log(`  ↓`);
    console.log(`  Açılan node:  ${nextNode}`);
    if (nextFirstMsg) console.log(`  İlk içerik:   "${nextFirstMsg}"`);
  }
}

// ════════════════════════════════════════════════════════════════════════════
// 2. ÖLÜM ANALİZİ
// ════════════════════════════════════════════════════════════════════════════
function analyzeDeaths(nodes, puzzles) {
  console.log('\n' + '═'.repeat(68));
  console.log('2. ÖLÜM ANALİZİ — Ne oluyor, nasıl gidiliyor?');
  console.log('═'.repeat(68));

  const deathNodes = Object.entries(nodes).filter(([nid, node]) =>
    nid.endsWith('_death_node') ||
    nid.includes('_hard_fail')  ||
    (node.events||[]).some(e=>e.type==='loopReset')
  );

  let totalDeathPaths = 0;

  for (const [nid, node] of deathNodes.sort(([a],[b])=>a.localeCompare(b))) {
    const ep = nid.split('_')[0];

    // Bu node'a kim nasıl geliyor?
    const incomers = whoPointsTo(nid, nodes);

    // Trigger mesajları
    const triggerDetails = [];
    for (const inc of incomers) {
      const incNode = nodes[inc];
      if (!incNode) continue;

      // Choice trigger
      for (const c of (incNode.choices||[])) {
        if (c.nextNodeId===nid) {
          triggerDetails.push({
            type: 'SEÇİM',
            from: inc,
            text: (c.text||'').slice(0,65),
          });
        }
      }
      // Puzzle trigger
      for (const ev of (incNode.events||[])) {
        if (ev.type==='puzzle') {
          const p = puzzles[ev.puzzleId];
          if (p?.failureNodeId===nid) {
            triggerDetails.push({
              type:  'PUZZLE FAIL',
              from:  inc,
              text:  `Puzzle başarısız → ${ev.puzzleId}`,
              puzzle: ev.puzzleId,
            });
          }
          if (p?.successNodeId===nid) {
            triggerDetails.push({
              type:  'PUZZLE SUCCESS',
              from:  inc,
              text:  `Puzzle başarılı → ${ev.puzzleId}`,
              puzzle: ev.puzzleId,
            });
          }
        }
      }
      // nextNodeId trigger
      if (incNode.nextNodeId===nid) {
        triggerDetails.push({ type:'OTOMATİK', from:inc, text:'nextNodeId (otomatik)' });
      }
    }

    totalDeathPaths += triggerDetails.length;

    // Ölüm sahnesi — ne oluyor?
    const deathEvents = (node.events||[])
      .filter(e=>['glitch','corruptMessage','systemAlert','loopReset'].includes(e.type))
      .map(e=>e.type);

    // Checkpoint — nereye dönüyor?
    const loopEv    = (node.events||[]).find(e=>e.type==='loopReset');
    const cpChoice  = (node.choices||[]).find(c=>c.restoreCheckpoint||c.nextNodeId?.includes('cp'));
    const returnDest= cpChoice?.restoreCheckpoint || cpChoice?.nextNodeId || '?';

    // Kontrol: bu node'da loopReset var mı, yoksa sadece adı mı ölüm?
    const hasLoopReset = (node.events||[]).some(e=>e.type==='loopReset');

    console.log(`\n  ── [${ep.toUpperCase()}] ${nid} ────────────────────────────`);
    console.log(`  Tip:          ${nid.endsWith('_death_node')?'ÖLÜM TUZAĞI':nid.includes('_hard_fail')?'PUZZLE FAIL':'LOOP RESET'}`);
    console.log(`  loopReset:    ${hasLoopReset?'✓':'✗'}`);
    console.log(`  Ölüm efekti:  ${deathEvents.join(' → ')}`);
    console.log(`  Geri dönüş:   ${returnDest}`);

    if (triggerDetails.length > 0) {
      console.log(`  Tetikleyiciler (${triggerDetails.length}):`);
      for (const t of triggerDetails) {
        const icon = t.type==='SEÇİM'?'🎯':t.type==='PUZZLE FAIL'?'🧩':'⚡';
        console.log(`    ${icon} [${t.type}] "${t.text}"`);
        console.log(`       ← kaynak: ${t.from}`);
      }
    } else {
      console.log(`  Tetikleyici:  ⚠  referans bulunamadı`);
    }
  }

  console.log(`\n  ─── ÖZET ───────────────────────────────────────────────`);
  console.log(`  Toplam ölüm node:  ${deathNodes.length}`);
  console.log(`  Toplam ölüm yolu:  ${totalDeathPaths}`);
}

// ════════════════════════════════════════════════════════════════════════════
// 3. NOT/DÖKÜMAN ZİNCİRİ
// ════════════════════════════════════════════════════════════════════════════
function analyzeNotes(nodes) {
  console.log('\n' + '═'.repeat(68));
  console.log('3. NOT/DÖKÜMAN ZİNCİRİ — Bölümler arası bağlantı var mı?');
  console.log('═'.repeat(68));

  // Tüm file/log eventlerini topla
  const allNotes = [];

  for (const [nid, node] of Object.entries(nodes)) {
    const ep = nid.split('_')[0];
    for (const ev of (node.events||[])) {
      if (!['file','log'].includes(ev.type) && ev.fileType!=='log') continue;
      allNotes.push({
        nodeId:  nid,
        ep:      ep,
        fileId:  ev.fileId||ev.id||'?',
        title:   ev.title||'(başlık yok)',
        content: (ev.content||'').slice(0, 120),
        tags:    ev.tags||[],
        source:  ev.source||'',
        caption: ev.caption||'',
        raw:     ev,
      });
    }
  }

  console.log(`\nToplam not/döküman: ${allNotes.length}\n`);

  // Episode bazında listele
  const byEp = {};
  for (const n of allNotes) {
    if (!byEp[n.ep]) byEp[n.ep]=[];
    byEp[n.ep].push(n);
  }

  for (const [ep, epNotes] of Object.entries(byEp).sort()) {
    console.log(`  ── ${ep.toUpperCase()} ─────────────────────────────────────────`);
    for (const n of epNotes) {
      console.log(`  [${n.fileId}]  "${n.title}"`);
      if (n.content)  console.log(`    İçerik:  "${n.content.replace(/\n/g,' ')}"`);
      if (n.tags.length>0) console.log(`    Etiket:  ${n.tags.join(', ')}`);
      if (n.source)   console.log(`    Kaynak:  ${n.source}`);
    }
    console.log('');
  }

  // Zincir tespiti — aynı etiket veya anahtar kelime farklı bölümlerde geçiyor mu?
  console.log('─── ZİNCİR ANALİZİ ─────────────────────────────────────────────');
  console.log('Birden fazla bölümde geçen etiket/anahtar kelimeler:\n');

  // Tüm etiketleri topla
  const tagEpMap = {};
  for (const n of allNotes) {
    for (const tag of n.tags) {
      if (!tagEpMap[tag]) tagEpMap[tag]=[];
      if (!tagEpMap[tag].includes(n.ep)) tagEpMap[tag].push(n.ep);
    }
  }

  const chainTags = Object.entries(tagEpMap).filter(([,eps])=>eps.length>1);
  if (chainTags.length>0) {
    console.log('  ETİKET ZİNCİRLERİ (birden fazla bölümde):');
    for (const [tag, eps] of chainTags.sort()) {
      const chain = eps.join(' → ');
      console.log(`  #${tag.padEnd(28)} ${chain}`);
    }
  } else {
    console.log('  ⚠  Etiket zincirleri bulunamadı.');
  }

  // İçerik anahtar kelime analizi
  console.log('\n  ANAHTAR KELİME ZİNCİRLERİ (not içeriğinde geçen isimler):');
  const keywords = ['güneş','emre','jones','1987','döngü','loop','hafıza','not','kahve','432','onlar','operatör'];
  for (const kw of keywords) {
    const matching = allNotes.filter(n=>
      (n.content+n.title+n.tags.join(' ')+n.caption).toLowerCase().includes(kw)
    );
    if (matching.length>=2) {
      const eps=[...new Set(matching.map(m=>m.ep))].join(' → ');
      console.log(`  "${kw.padEnd(14)}" geçiyor: ${eps}  (${matching.length} not)`);
    }
  }

  // Eksik zincir uyarısı
  console.log('\n─── EKSİK ZİNCİR TESPİTİ ──────────────────────────────────────');
  console.log('Not: "Parçalanmış not" sistemi varsa etiketler birbiriyle bağlantılı olmalı.\n');

  // Tek bölümde kalan önemli notlar
  const singleEpNotes = allNotes.filter(n=>
    n.tags.some(t=>['dongu','loop','gunes_yildiz','emre_notu','jones_el_yazisi'].includes(t))
  );

  if (singleEpNotes.length>0) {
    const singles = singleEpNotes.filter(n=>{
      const matchTags=n.tags.filter(t=>tagEpMap[t]&&tagEpMap[t].length===1);
      return matchTags.length>0;
    });
    if (singles.length>0) {
      console.log('  Bu notlar önemli etiketlere sahip ama sadece 1 bölümde görünüyor:');
      for (const n of singles) {
        console.log(`  ⚠  [${n.ep}] ${n.fileId} — "${n.title}"`);
        console.log(`     Etiketler: ${n.tags.join(', ')}`);
      }
      console.log('\n  → Bunların devam notlarını diğer bölümlere eklemek sistemi zenginleştirir.');
    } else {
      console.log('  ✓ Tespit edilen zincirsiz kritik not yok.');
    }
  }

  // Önerilen zincirler
  console.log('\n─── ÖNERİLEN NOT ZİNCİRLERİ ───────────────────────────────────');
  console.log('(Mevcut notlardan oluşturulabilecek zincirler)\n');

  const noteChains = [
    { title: "DÖNGÜ ZİNCİRİ",      kw:'döngü',   description:"Jones'un döngüyü fark etme süreci" },
    { title: "GÜNEŞ YILDIZ ZİNCİRİ",kw:'güneş',  description:"1987'den beri buradasın, hafıza dondu" },
    { title: "EMRE DEĞİŞİM ZİNCİRİ",kw:'emre',   description:"Emre'nin psikolojik değişim belgeleri" },
    { title: "JONES EL YAZISI ZİNCİRİ",kw:'jones',description:"Jones'un kendine bıraktığı notlar" },
  ];

  for (const chain of noteChains) {
    const matching=allNotes.filter(n=>
      (n.content+n.title+n.tags.join(' ')).toLowerCase().includes(chain.kw)
    );
    if (matching.length<2) {
      console.log(`  [${chain.title}]`);
      console.log(`   ⚠  Yeterli not yok (${matching.length} adet). Zincir oluşturulamaz.`);
    } else {
      const eps=[...new Set(matching.map(m=>m.ep))].sort();
      console.log(`  [${chain.title}]  ← ${chain.description}`);
      console.log(`   Bölümler: ${eps.join(' → ')}`);
      for (const m of matching) {
        console.log(`   ${m.ep.toUpperCase()}: "${m.title}"`);
      }
    }
    console.log('');
  }

  return allNotes;
}

// ════════════════════════════════════════════════════════════════════════════
// MAIN
// ════════════════════════════════════════════════════════════════════════════
console.log('KATMAN HİKAYE HARİTASI\n' + '─'.repeat(68));
const { nodes, puzzles } = loadAll();
console.log(`✓ ${Object.keys(nodes).length} node yüklendi`);

analyzeTransitions(nodes);
analyzeDeaths(nodes, puzzles);
const notes = analyzeNotes(nodes);

console.log('\n' + '═'.repeat(68));
console.log('ÖZET');
console.log('═'.repeat(68));

// Geçiş sayısı
const sonCount = Object.keys(nodes).filter(id=>id.endsWith('_son')).length;
// Ölüm sayısı
const deathCount = Object.keys(nodes).filter(id=>
  id.endsWith('_death_node')||id.includes('_hard_fail')||
  (nodes[id].events||[]).some(e=>e.type==='loopReset')
).length;

console.log(`  Bölüm geçişi (son node):  ${sonCount}`);
console.log(`  Ölüm node'ları:           ${deathCount}`);
console.log(`  Not/döküman:              ${notes.length}`);
console.log(`  Zincirli not etiket:      ${Object.values({}).filter(v=>v>1).length}`);
console.log('\n' + '═'.repeat(68));
console.log('TAMAMLANDI');
console.log('═'.repeat(68));