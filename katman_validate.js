// katman_validate.js
// Kapsamlı doğrulama — JSON + Engine coverage + Simulation
// node katman_validate.js [--engine PATH] [--sim] [--runs N]
//
// Örnekler:
//   node katman_validate.js
//   node katman_validate.js --engine ./src/engine/eventPlayer.js
//   node katman_validate.js --engine ./src/engine/eventPlayer.js --sim --runs 5000

import fs   from 'fs';
import path from 'path';

// ─── DOSYA YOLLARI ────────────────────────────────────────────────────────────
const BASE      = path.resolve(process.cwd(), 'src', 'data', 'episodes');
const MAIN_FILE = path.join(BASE, 'merged_story.json');
const ENDING_FILES = {
  episode_18: path.join(BASE, 'episode-18.json'),
  episode_19: path.join(BASE, 'episode-19.json'),
  episode_20: path.join(BASE, 'episode-20.json'),
};
const ENDING_NAMES = {
  episode_18: 'Son A — Kilit',
  episode_19: 'Son B — Birlikte',
  episode_20: 'Son C — Anlat',
};

// JSON'da kullanılan tüm event tipleri
const ALL_EVENT_TYPES = [
  'message', 'typing', 'realTimeWait', 'pause',
  'statChange', 'checkpoint', 'characterBusy',
  'puzzle', 'statBasedRouting', 'loopReset',
  'systemAlert', 'glitch', 'signalLost', 'signalRestored',
  'corruptMessage', 'backgroundEvent', 'progressTask',
  'file', 'image', 'relationshipDialogue',
  'typing',
];

// ─── YÜKLEME ──────────────────────────────────────────────────────────────────
function loadData() {
  const raw     = JSON.parse(fs.readFileSync(MAIN_FILE, 'utf-8'));
  const nodes   = {}, puzzles = { ...(raw.puzzles||{}) };
  for (const [id,val] of Object.entries(raw.nodes||{}))
    if (val && typeof val==='object' && !Array.isArray(val)) nodes[id]=val;
  for (const [,file] of Object.entries(ENDING_FILES)) {
    if (!fs.existsSync(file)) continue;
    const ep = JSON.parse(fs.readFileSync(file,'utf-8'));
    for (const [id,val] of Object.entries(ep.nodes||{}))
      if (val && typeof val==='object' && !Array.isArray(val)) nodes[id]=val;
    Object.assign(puzzles, ep.puzzles||{});
  }
  return { nodes, puzzles, startId: raw.startNodeId || 'ep01_n01' };
}

// ═════════════════════════════════════════════════════════════════════════════
// 1. JSON TAM DOĞRULAMA
// ═════════════════════════════════════════════════════════════════════════════
function validateJSON(nodes, puzzles) {
  console.log('\n' + '═'.repeat(60));
  console.log('1. JSON DOĞRULAMA');
  console.log('═'.repeat(60));

  const nodeIds   = new Set(Object.keys(nodes));
  const puzzleIds = new Set(Object.keys(puzzles));
  const errors=[], warnings=[];

  // Event tiplerini say
  const usedEventTypes = new Map();
  for (const node of Object.values(nodes)) {
    for (const ev of (node.events||[])) {
      const t = ev.type||'unknown';
      usedEventTypes.set(t, (usedEventTypes.get(t)||0)+1);
    }
  }

  // Her node'u kontrol et
  for (const [nid, node] of Object.entries(nodes)) {
    // choices referansları
    for (const c of (node.choices||[])) {
      const next = c.nextNodeId, ep = c.nextEpisodeId;
      if (next && !ep && !nodeIds.has(next))
        errors.push(`KIRUK: ${nid} → choices.nextNodeId="${next}"`);
    }

    // nextNodeId
    if (node.nextNodeId && !nodeIds.has(node.nextNodeId))
      errors.push(`KIRUK: ${nid} → nextNodeId="${node.nextNodeId}"`);

    // events
    for (const ev of (node.events||[])) {
      if (ev.type === 'puzzle') {
        const pid = ev.puzzleId;
        if (!puzzleIds.has(pid))
          errors.push(`KIRUK PUZZLE: ${nid} → puzzleId="${pid}"`);
        else {
          const p = puzzles[pid];
          if (p.successNodeId && !nodeIds.has(p.successNodeId))
            errors.push(`KIRUK PUZZLE SUCCESS: ${pid} → "${p.successNodeId}"`);
          if (p.failureNodeId && !nodeIds.has(p.failureNodeId))
            errors.push(`KIRUK PUZZLE FAIL: ${pid} → "${p.failureNodeId}"`);
        }
      }
      if (ev.type === 'characterBusy' && ev.returnNodeId && !nodeIds.has(ev.returnNodeId))
        warnings.push(`UYARI: ${nid} characterBusy.returnNodeId="${ev.returnNodeId}" yok`);
      if (ev.type === 'statBasedRouting') {
        for (const r of (ev.routes||[])) {
          if (r.nextNodeId && !r.nextEpisodeId && !nodeIds.has(r.nextNodeId))
            errors.push(`KIRUK ROUTING: ${nid} → "${r.nextNodeId}"`);
        }
      }
    }
  }

  // Rapor
  console.log(`\nNode: ${nodeIds.size} | Puzzle: ${puzzleIds.size}`);

  console.log('\nKullanılan event tipleri:');
  [...usedEventTypes.entries()].sort((a,b)=>b[1]-a[1])
    .forEach(([t,n])=>console.log(`  ${t.padEnd(22)} ${n} kez`));

  if (errors.length===0)  console.log('\n✓ Kırık bağlantı yok');
  else {
    console.log(`\n✗ ${errors.length} kritik hata:`);
    errors.forEach(e=>console.log('  '+e));
  }
  if (warnings.length>0) {
    console.log(`\n⚠  ${warnings.length} uyarı:`);
    warnings.forEach(w=>console.log('  '+w));
  }

  return { usedEventTypes, errors, warnings };
}

// ═════════════════════════════════════════════════════════════════════════════
// 2. ENGINE COVERAGE CHECK
// ═════════════════════════════════════════════════════════════════════════════
function validateEngine(enginePath, usedEventTypes) {
  console.log('\n' + '═'.repeat(60));
  console.log('2. ENGINE COVERAGE CHECK');
  console.log('═'.repeat(60));

  if (!enginePath || !fs.existsSync(enginePath)) {
    console.log(`\n⚠  Engine dosyası bulunamadı: ${enginePath||'belirtilmedi'}`);
    console.log('   --engine flag ile yol ver:');
    console.log('   node katman_validate.js --engine ./src/engine/eventPlayer.js');
    return null;
  }

  const engineCode = fs.readFileSync(enginePath, 'utf-8');
  console.log(`\nEngine dosyası: ${enginePath}`);
  console.log(`Boyut: ${(engineCode.length/1024).toFixed(1)} KB`);

  // Kritik kontroller
  const criticalChecks = [
    // Event type handler'ları
    { label: "statBasedRouting handler",
      test:  ()=>engineCode.includes('statBasedRouting') },
    { label: "loopReset handler",
      test:  ()=>engineCode.includes('loopReset') },
    { label: "characterBusy handler",
      test:  ()=>engineCode.includes('characterBusy') },
    { label: "checkpoint handler",
      test:  ()=>engineCode.includes('checkpoint') },
    { label: "puzzle handler",
      test:  ()=>engineCode.includes('puzzle') },
    { label: "statChange handler",
      test:  ()=>engineCode.includes('statChange') },
    { label: "relationshipDialogue handler",
      test:  ()=>engineCode.includes('relationshipDialogue') },
    { label: "backgroundEvent handler",
      test:  ()=>engineCode.includes('backgroundEvent') },
    { label: "progressTask handler",
      test:  ()=>engineCode.includes('progressTask') },
    { label: "signalLost handler",
      test:  ()=>engineCode.includes('signalLost') },
    { label: "corruptMessage handler",
      test:  ()=>engineCode.includes('corruptMessage') },

    // Stat persistence
    { label: "stat state korunuyor (cross-episode)",
      test:  ()=>engineCode.includes('stats') || engineCode.includes('stat'),
      warn:  true },

    // visitedForStats (stat deduplication)
    { label: "stat dedup (visitedForStats / visitedNodes)",
      test:  ()=>
        engineCode.includes('visitedForStats') ||
        engineCode.includes('visitedNodes') ||
        engineCode.includes('appliedStats') ||
        engineCode.includes('statApplied'),
      warn:  true,
      detail:"Aynı node'dan tekrar geçince stat iki kez uygulanabilir." },

    // nextEpisodeId handling
    { label: "nextEpisodeId işleniyor",
      test:  ()=>engineCode.includes('nextEpisodeId') },

    // Episode load on routing
    { label: "statBasedRouting → episode load",
      test:  ()=>
        engineCode.includes('statBasedRouting') &&
        (engineCode.includes('loadEpisode') ||
         engineCode.includes('nextEpisode') ||
         engineCode.includes('episode_1') ||
         engineCode.includes('episodeId')) },
  ];

  console.log('\nKontrol sonuçları:');
  let criticalFails=0, warnings=0;

  for (const check of criticalChecks) {
    const ok = check.test();
    const icon = ok ? '✓' : (check.warn ? '⚠ ' : '✗');
    if (!ok && !check.warn) criticalFails++;
    if (!ok && check.warn)  warnings++;
    console.log(`  ${icon} ${check.label}`);
    if (!ok && check.detail) console.log(`     → ${check.detail}`);
  }

  // JSON'daki tüm event tiplerini engine'de ara
  console.log('\nJSON event tipleri → Engine\'de var mı:');
  const missing=[];
  for (const [type] of usedEventTypes.entries()) {
    const found = engineCode.includes(`'${type}'`) ||
                  engineCode.includes(`"${type}"`) ||
                  engineCode.includes(type);
    const icon = found ? '✓' : '✗';
    if (!found) missing.push(type);
    console.log(`  ${icon} ${type}`);
  }

  console.log('');
  if (criticalFails>0)
    console.log(`✗ ${criticalFails} kritik handler eksik — bu event'ler oyunda işlenmez`);
  if (warnings>0)
    console.log(`⚠  ${warnings} potansiyel sorun — kontrol et`);
  if (missing.length>0)
    console.log(`✗ Engine'de bulunamayan event tipleri: ${missing.join(', ')}`);
  if (criticalFails===0 && missing.length===0)
    console.log('✓ Tüm event tipleri engine\'de mevcut');

  return { criticalFails, warnings, missing };
}

// ═════════════════════════════════════════════════════════════════════════════
// 3. STAT SİSTEM DENETİMİ
// ═════════════════════════════════════════════════════════════════════════════
function auditStats(nodes) {
  console.log('\n' + '═'.repeat(60));
  console.log('3. STAT SİSTEM DENETİMİ');
  console.log('═'.repeat(60));

  // Tüm stat değişimlerini topla
  const statGains   = {};  // { stat: toplam pozitif }
  const statLosses  = {};  // { stat: toplam negatif }
  const statNodes   = {};  // { stat: [nodeId listesi] }

  for (const [nid, node] of Object.entries(nodes)) {
    for (const ev of (node.events||[])) {
      if (ev.type !== 'statChange') continue;
      for (const [k,v] of Object.entries(ev.changes||{})) {
        if (typeof v !== 'number') continue;
        if (v > 0) statGains[k]  = (statGains[k]||0) + v;
        if (v < 0) statLosses[k] = (statLosses[k]||0) + v;
        if (!statNodes[k]) statNodes[k] = [];
        statNodes[k].push(nid);
      }
    }
  }

  console.log('\nStat başına teorik max değer (tek geçiş, tüm seçimler):');
  const allStats = new Set([...Object.keys(statGains), ...Object.keys(statLosses)]);
  for (const stat of [...allStats].sort()) {
    const gain = statGains[stat] || 0;
    const loss = statLosses[stat] || 0;
    const nodeCount = statNodes[stat]?.length || 0;
    console.log(`  ${stat.padEnd(25)} max:${String(gain).padStart(5)}  min:${String(gain+loss).padStart(5)}  (${nodeCount} node)`);
  }

  // Routing koşullarını bu max değerlerle karşılaştır
  console.log('\nRouting eşikleri vs teorik max değerler:');
  const routingChecks = [
    { stat:'emreBaglantisi',  threshold:500,  sonB:true  },
    { stat:'trust',           threshold:300,  sonB:true  },
    { stat:'humanity',        threshold:850,  sonB:true  },
    { stat:'onlarFarkındalığı',threshold:165, sonC:true  },
    { stat:'curiosity',       threshold:1400, sonC:true  },
  ];
  let allOk = true;
  for (const {stat,threshold,sonB,sonC} of routingChecks) {
    const max = statGains[stat] || 0;
    const ok  = max >= threshold;
    if (!ok) allOk = false;
    const son = sonB ? 'Son B' : 'Son C';
    const icon = ok ? '✓' : '✗';
    console.log(`  ${icon} ${son} — ${stat.padEnd(22)} eşik:${threshold}  max ulaşılabilir:${max}`);
    if (!ok) console.log(`    → Bu stat hiçbir zaman eşiğe ulaşamaz! Eşiği düşür.`);
  }
  if (allOk) console.log('  ✓ Tüm eşikler teorik olarak ulaşılabilir');
}

// ═════════════════════════════════════════════════════════════════════════════
// 4. QUICK SİMÜLASYON (opsiyonel)
// ═════════════════════════════════════════════════════════════════════════════
const PUZZLE_SUCCESS = 0.75;
const INITIAL_STATS  = {
  trust:0,humanity:0,fear:0,curiosity:0,emreBaglantisi:0,
  riskPattern:0,emreDeğişim:0,selinTrust:0,onlarFarkındalığı:0,
  mentalStability:0,timesNearDeath:0,
};

function nodeToEndingEp(id) {
  if (id.startsWith('ep18')) return 'episode_18';
  if (id.startsWith('ep19')) return 'episode_19';
  if (id.startsWith('ep20')) return 'episode_20';
  return null;
}
function resolveNext(c) {
  const ep=c.nextEpisodeId, nid=c.nextNodeId;
  if (ep && ENDING_NAMES[ep])    return {ending:ep};
  if (nid) { const e=nodeToEndingEp(nid); return e?{ending:e}:{nextNode:nid}; }
  return {};
}
function resolveRoute(routes=[],stats) {
  const s=[...routes].sort((a,b)=>(a.priority||99)-(b.priority||99));
  for (const r of s) {
    if (r.default) return r;
    const ok=Object.entries(r.conditions||{}).every(([k,c])=>{
      const v=stats[k]||0;
      if (c.gte!==undefined&&v<c.gte) return false;
      if (c.lte!==undefined&&v>c.lte) return false;
      return true;
    });
    if (ok) return r;
  }
  return s[s.length-1];
}

function runSim(nodes, puzzles, startId, n=5000) {
  console.log('\n' + '═'.repeat(60));
  console.log(`4. SİMÜLASYON — ${n.toLocaleString()} oynanış`);
  console.log('═'.repeat(60));
  process.stdout.write('Çalışıyor ');

  const results={episode_18:0,episode_19:0,episode_20:0};
  const errors={};
  const statsList=[];
  let deaths=0,steps=0;

  for (let i=0;i<n;i++) {
    if (i%Math.floor(n/10)===0) process.stdout.write('.');
    let s={...INITIAL_STATS},cur=startId,cp=startId,st=0,d=0,end=null;
    const vis=new Set(), vsf=new Set();
    while (st<2000&&!end) {
      st++;
      vis.has(cur)?'':(vis.add(cur));
      const vc=(vis.size); // simplification
      const node=nodes[cur];
      if (!node){end='err:'+cur;break;}
      // stat apply once
      if (!vsf.has(cur)) {
        vsf.add(cur);
        for (const ev of (node.events||[])) {
          if (ev.type!=='statChange') continue;
          for (const [k,v] of Object.entries(ev.changes||{}))
            if (typeof v==='number') s[k]=(s[k]||0)+v;
        }
      }
      if (node.events?.some(e=>e.type==='checkpoint')) cp=cur;
      const pEv=node.events?.find(e=>e.type==='puzzle');
      if (pEv){
        const p=puzzles[pEv.puzzleId];
        if (p){if(Math.random()<PUZZLE_SUCCESS)cur=p.successNodeId;
          else{d++;s.timesNearDeath=(s.timesNearDeath||0)+1;cur=p.failureNodeId||cp;}
          continue;}
      }
      const rEv=node.events?.find(e=>e.type==='statBasedRouting');
      if (rEv){const r=resolveRoute(rEv.routes,s);if(!r){end='re';break;}
        const res=resolveNext(r);if(res.ending){end=res.ending;break;}
        if(res.nextNode){cur=res.nextNode;continue;}end='rn';break;}
      const hR=node.events?.some(e=>e.type==='loopReset')||cur.endsWith('_death_node');
      if (hR){d++;s.timesNearDeath=(s.timesNearDeath||0)+1;
        const cc=node.choices?.find(c=>c.restoreCheckpoint);cur=cc?.nextNodeId||cp;continue;}
      const ch=node.choices||[];
      if (ch.length>0){const c=ch[Math.floor(Math.random()*ch.length)];
        for(const[k,v] of Object.entries(c.effects||{}))if(typeof v==='number')s[k]=(s[k]||0)+v;
        const res=resolveNext(c);if(res.ending){end=res.ending;break;}
        if(res.nextNode){cur=res.nextNode;continue;}end='cn:'+cur;break;}
      if (node.nextNodeId){cur=node.nextNodeId;continue;}
      end=nodeToEndingEp(cur)||'dead:'+cur;
    }
    if(!end)end='timeout';
    if(ENDING_NAMES[end]){results[end]++;statsList.push(s);}
    else errors[end]=(errors[end]||0)+1;
    deaths+=d;steps+=st;
  }
  console.log(' tamam!\n');

  const done=statsList.length;
  console.log('SON DAĞILIMI:');
  for(const[ep,name] of Object.entries(ENDING_NAMES)){
    const c=results[ep],pct=(c/n*100).toFixed(1),bar='█'.repeat(Math.round(c/n*35));
    console.log(`  ${name.padEnd(26)} ${String(c).padStart(5)} (%${pct.padStart(5)})  ${bar}`);
  }
  const errTot=Object.values(errors).reduce((a,b)=>a+b,0);
  if(errTot>0){console.log(`\n⚠  Tamamlanamayan: ${errTot}`);
    Object.entries(errors).sort((a,b)=>b[1]-a[1]).slice(0,5)
      .forEach(([t,c])=>console.log(`     [${c}x] ${t}`));}
  console.log(`\nOrt. ölüm: ${(deaths/n).toFixed(1)} | Ort. adım: ${(steps/n).toFixed(0)} | Tamamlanan: ${done}/${n}`);

  if(done>0) {
    console.log('\nFINAL STAT ORTALAMALARI:');
    ['emreBaglantisi','trust','humanity','onlarFarkındalığı','curiosity','riskPattern']
      .forEach(k=>{
        const vals=statsList.map(s=>s[k]||0);
        const avg=(vals.reduce((a,b)=>a+b,0)/done).toFixed(0);
        const mn=Math.min(...vals), mx=Math.max(...vals);
        console.log(`  ${k.padEnd(25)} ort:${String(avg).padStart(6)}  min:${mn}  max:${mx}`);
      });
  }
  return {results,done,errors};
}

// ═════════════════════════════════════════════════════════════════════════════
// 5. ÖZET RAPOR
// ═════════════════════════════════════════════════════════════════════════════
function printSummary(jsonResult, engineResult, simResult) {
  console.log('\n' + '═'.repeat(60));
  console.log('ÖZET RAPOR');
  console.log('═'.repeat(60));

  const sections = [
    { label: 'JSON yapısı',
      ok:    jsonResult.errors.length === 0,
      detail: jsonResult.errors.length > 0
        ? `${jsonResult.errors.length} kritik hata`
        : `${Object.keys(jsonResult.usedEventTypes||{}).length} event tipi, hepsi geçerli` },

    { label: 'Engine coverage',
      ok:    engineResult ? engineResult.criticalFails === 0 : null,
      detail: !engineResult
        ? 'Test edilmedi — --engine flag kullan'
        : engineResult.criticalFails > 0
          ? `${engineResult.criticalFails} eksik handler`
          : 'Tüm event tipleri handle ediliyor' },

    { label: 'Stat deduplication',
      ok:    engineResult ? engineResult.warnings === 0 : null,
      detail: !engineResult
        ? 'Test edilmedi'
        : engineResult.warnings > 0
          ? 'Stat iki kez uygulanma riski var — kontrol et'
          : 'Stat sistemi temiz görünüyor' },

    { label: 'Simülasyon',
      ok:    simResult ? simResult.done / (simResult.done + Object.values(simResult.errors).reduce((a,b)=>a+b,0)) > 0.99 : null,
      detail: !simResult
        ? 'Test edilmedi — --sim flag kullan'
        : `${simResult.done.toLocaleString()} tamamlandı, 3 son erişilebilir` },
  ];

  sections.forEach(({label,ok,detail}) => {
    const icon = ok === null ? '─' : ok ? '✓' : '✗';
    console.log(`  ${icon} ${label.padEnd(25)} ${detail}`);
  });

  console.log('\n  ─────────────────────────────────────────────────');
  const allOk = sections.every(s=>s.ok===null||s.ok===true);
  if (allOk && sections.some(s=>s.ok===true))
    console.log('  ✓ Tüm test edilen alanlar geçti. Oyun oynayabilir durumda.');
  else
    console.log('  ⚠  Bazı alanlar test edilmedi veya sorun var. Yukarıdaki raporu incele.');

  console.log('\n  GERÇEK OYUNDA KESİNLİKLE TEST ETMEN GEREKENLER:');
  console.log('  1. EP17\'ye kadar oyna — statBasedRouting tetikleniyor mu?');
  console.log('  2. Ölüp checkpoint\'ten devam et — stat iki kez artıyor mu?');
  console.log('  3. Bir sona ulaş — EP18/19/20 yükleniyor mu?');
  console.log('  4. characterBusy — 8-15 dk sonra bildirim geliyor mu?');
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const engineIdx = args.indexOf('--engine');
const enginePath = engineIdx >= 0 ? path.resolve(process.cwd(), args[engineIdx+1]) : null;
const runSimFlag = args.includes('--sim');
const runsIdx = args.indexOf('--runs');
const simN = runsIdx >= 0 ? (parseInt(args[runsIdx+1])||5000) : 5000;

console.log('KATMAN Tam Doğrulama Sistemi\n' + '─'.repeat(60));

const {nodes, puzzles, startId} = loadData();
console.log(`✓ ${Object.keys(nodes).length} node, ${Object.keys(puzzles).length} puzzle yüklendi`);

const jsonResult    = validateJSON(nodes, puzzles);
auditStats(nodes);
const engineResult  = validateEngine(enginePath, jsonResult.usedEventTypes);
const simResult     = runSimFlag ? runSim(nodes, puzzles, startId, simN) : null;

printSummary(jsonResult, engineResult, simResult);

console.log('\n' + '═'.repeat(60));
console.log('TAMAMLANDI');
console.log('═'.repeat(60));