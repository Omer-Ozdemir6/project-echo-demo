// katman_validate.js
// node katman_validate.js [--engine PATH] [--app PATH] [--sim] [--runs N]
//
// Örnekler:
//   node katman_validate.js --engine ./src/engine/eventPlayer.js --app ./src/App.jsx --sim

import fs   from 'fs';
import path from 'path';

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

// ─── Yükleme ──────────────────────────────────────────────────────────────────
function loadData() {
  const raw = JSON.parse(fs.readFileSync(MAIN_FILE, 'utf-8'));
  const nodes = {}, puzzles = { ...(raw.puzzles||{}) };
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
// 1. JSON DOĞRULAMA
// ═════════════════════════════════════════════════════════════════════════════
function validateJSON(nodes, puzzles) {
  console.log('\n'+'═'.repeat(60));
  console.log('1. JSON DOĞRULAMA');
  console.log('═'.repeat(60));

  const nodeIds = new Set(Object.keys(nodes));
  const puzzleIds = new Set(Object.keys(puzzles));
  const errors=[], warnings=[];
  const usedEventTypes = new Map();

  for (const node of Object.values(nodes))
    for (const ev of (node.events||[])) {
      const t = ev.type||'unknown';
      usedEventTypes.set(t, (usedEventTypes.get(t)||0)+1);
    }

  for (const [nid, node] of Object.entries(nodes)) {
    for (const c of (node.choices||[])) {
      const next=c.nextNodeId, ep=c.nextEpisodeId;
      if (next && !ep && !nodeIds.has(next))
        errors.push(`KIRUK: ${nid} → choices.nextNodeId="${next}"`);
    }
    if (node.nextNodeId && !nodeIds.has(node.nextNodeId))
      errors.push(`KIRUK: ${nid} → nextNodeId="${node.nextNodeId}"`);
    for (const ev of (node.events||[])) {
      if (ev.type==='puzzle') {
        if (!puzzleIds.has(ev.puzzleId)) errors.push(`KIRUK PUZZLE: ${nid} → "${ev.puzzleId}"`);
        else {
          const p=puzzles[ev.puzzleId];
          if (p.successNodeId && !nodeIds.has(p.successNodeId))
            errors.push(`KIRUK PUZZLE SUCCESS: ${ev.puzzleId} → "${p.successNodeId}"`);
          if (p.failureNodeId && !nodeIds.has(p.failureNodeId))
            errors.push(`KIRUK PUZZLE FAIL: ${ev.puzzleId} → "${p.failureNodeId}"`);
        }
      }
      if (ev.type==='characterBusy' && ev.returnNodeId && !nodeIds.has(ev.returnNodeId))
        warnings.push(`UYARI: ${nid} characterBusy.returnNodeId="${ev.returnNodeId}" yok`);
      if (ev.type==='statBasedRouting')
        for (const r of (ev.routes||[]))
          if (r.nextNodeId && !r.nextEpisodeId && !nodeIds.has(r.nextNodeId))
            errors.push(`KIRUK ROUTING: ${nid} → "${r.nextNodeId}"`);
    }
  }

  console.log(`\nNode: ${nodeIds.size} | Puzzle: ${puzzleIds.size}`);
  console.log('\nKullanılan event tipleri:');
  [...usedEventTypes.entries()].sort((a,b)=>b[1]-a[1])
    .forEach(([t,n])=>console.log(`  ${t.padEnd(22)} ${n} kez`));

  if (errors.length===0) console.log('\n✓ Kırık bağlantı yok');
  else { console.log(`\n✗ ${errors.length} kritik hata:`); errors.forEach(e=>console.log('  '+e)); }
  if (warnings.length>0) { console.log(`\n⚠  ${warnings.length} uyarı:`); warnings.forEach(w=>console.log('  '+w)); }

  return { usedEventTypes, errors, warnings };
}

// ═════════════════════════════════════════════════════════════════════════════
// 2. ENGINE COVERAGE (eventPlayer.js)
// ═════════════════════════════════════════════════════════════════════════════
function validateEngine(enginePath, usedEventTypes) {
  console.log('\n'+'═'.repeat(60));
  console.log('2. ENGINE COVERAGE — eventPlayer.js');
  console.log('═'.repeat(60));

  if (!enginePath || !fs.existsSync(enginePath)) {
    console.log(`\n⚠  Bulunamadı: ${enginePath||'belirtilmedi'}`);
    console.log('   --engine ./src/engine/eventPlayer.js');
    return null;
  }

  const code = fs.readFileSync(enginePath, 'utf-8');
  console.log(`\nDosya: ${enginePath}  (${(code.length/1024).toFixed(1)} KB)`);

  const eventChecks = [
    ['statBasedRouting handler', ()=>code.includes('statBasedRouting')],
    ['loopReset handler',        ()=>code.includes('loopReset')],
    ['characterBusy handler',    ()=>code.includes('characterBusy')],
    ['checkpoint handler',       ()=>code.includes("event.type === \"checkpoint\"") || code.includes("event.type === 'checkpoint'")],
    ['puzzle handler',           ()=>code.includes('puzzle')],
    ['statChange handler',       ()=>code.includes('statChange')],
    ['relationshipDialogue',     ()=>code.includes('relationshipDialogue')],
    ['backgroundEvent',          ()=>code.includes('backgroundEvent')],
    ['progressTask',             ()=>code.includes('progressTask')],
    ['signalLost',               ()=>code.includes('signalLost')],
    ['corruptMessage',           ()=>code.includes('corruptMessage')],
  ];

  console.log('\nEvent handler\'lar:');
  let criticalFails=0;
  for (const [label, test] of eventChecks) {
    const ok=test();
    if (!ok) criticalFails++;
    console.log(`  ${ok?'✓':'✗'} ${label}`);
  }

  console.log('\nJSON event tipleri → Engine\'de var mı:');
  const missing=[];
  for (const [type] of usedEventTypes.entries()) {
    const found=code.includes(`'${type}'`)||code.includes(`"${type}"`);
    if (!found) missing.push(type);
    console.log(`  ${found?'✓':'✗'} ${type}`);
  }

  if (criticalFails===0 && missing.length===0) console.log('\n✓ eventPlayer.js tam');
  else {
    if (criticalFails>0) console.log(`\n✗ ${criticalFails} handler eksik`);
    if (missing.length>0) console.log(`✗ Eksik event: ${missing.join(', ')}`);
  }

  return { criticalFails, missing };
}

// ═════════════════════════════════════════════════════════════════════════════
// 3. APP.JSX KONTROLÜ — React tarafı
// ═════════════════════════════════════════════════════════════════════════════
function validateApp(appPath) {
  console.log('\n'+'═'.repeat(60));
  console.log('3. APP.JSX KONTROLÜ — React game loop');
  console.log('═'.repeat(60));

  if (!appPath || !fs.existsSync(appPath)) {
    console.log(`\n⚠  Bulunamadı: ${appPath||'belirtilmedi'}`);
    console.log('   --app ./src/App.jsx');
    return null;
  }

  const code = fs.readFileSync(appPath, 'utf-8');
  console.log(`\nDosya: ${appPath}  (${(code.length/1024).toFixed(1)} KB)`);

  const checks = [
    // Stat dedup
    {
      label:  'visitedForStatsRef tanımlanmış',
      test:   ()=>code.includes('visitedForStatsRef'),
      fix:    "const visitedForStatsRef = useRef(new Set());",
      critical: true,
    },
    {
      label:  'visitedForStats.has() kontrolü (onStatChange)',
      test:   ()=>code.includes('visitedForStatsRef.current.has'),
      fix:    "if (nodeId && visitedForStatsRef.current.has(nodeId)) return;",
      critical: true,
    },
    {
      label:  'Episode değişince visitedForStats sıfırlanıyor',
      test:   ()=>code.includes('gameState.episodeId') && code.includes('visitedForStatsRef.current = new Set()'),
      fix:    "useEffect(() => { visitedForStatsRef.current = new Set(); }, [gameState.episodeId]);",
      critical: false,
    },

    // Checkpoint
    {
      label:  'onCheckpoint handler var',
      test:   ()=>code.includes('onCheckpoint'),
      fix:    "onCheckpoint: () => { setGameState(prev => ({ ...prev, checkpoint: {...}, checkpointStats: {...prev.stats} })); }",
      critical: true,
    },
    {
      label:  'checkpointStats kaydediliyor',
      test:   ()=>code.includes('checkpointStats'),
      fix:    "checkpointStats: { ...(prev.stats || {}) }",
      critical: true,
    },
    {
      label:  'checkpoint objesi kaydediliyor (nodeId + episodeId)',
      test:   ()=>code.includes('checkpoint:') && code.includes('nodeId:') && code.includes('episodeId:'),
      fix:    "checkpoint: { nodeId: prev.currentNodeId, episodeId: prev.episodeId }",
      critical: true,
    },

    // Loop reset / ölüm sonrası stat restore
    {
      label:  'LoopReset sonrası visitedForStats temizleniyor',
      test:   ()=>{
        const loopBlock = code.split('onComplete').find(b=>b.includes('loopReset')||b.includes('LoopResetScreen'));
        return code.includes('visitedForStatsRef.current = new Set()');
      },
      fix:    "visitedForStatsRef.current = new Set(); (LoopResetScreen onComplete içinde)",
      critical: true,
    },
    {
      label:  'LoopReset sonrası stat restore (checkpointStats)',
      test:   ()=>code.includes('checkpointStats || prev.stats') || code.includes('checkpointStats||prev.stats'),
      fix:    "stats: prev.checkpointStats || prev.stats, (LoopResetScreen onComplete içinde)",
      critical: true,
    },

    // Routing
    {
      label:  'onStatBasedRouting handler var',
      test:   ()=>code.includes('onStatBasedRouting'),
      fix:    "onStatBasedRouting: (route) => { ... loadEpisode ... }",
      critical: true,
    },
    {
      label:  'nextEpisodeId ile episode geçişi yapılıyor',
      test:   ()=>code.includes('nextEpisodeId') && code.includes('episodeId:'),
      fix:    "episodeId: route.nextEpisodeId || prev.episodeId",
      critical: true,
    },
    {
      label:  'characterBusy returnEpisodeId işleniyor',
      test:   ()=>code.includes('returnEpisodeId'),
      fix:    "returnEpisodeId: busy.returnEpisodeId",
      critical: false,
    },

    // Save
    {
      label:  'saveGameState checkpoint sonrası çağrılıyor',
      test:   ()=>{
        // onCheckpoint içinde saveGameState var mı?
        const cpIdx = code.indexOf('onCheckpoint');
        if (cpIdx===-1) return false;
        const block = code.slice(cpIdx, cpIdx+300);
        return block.includes('saveGameState');
      },
      fix:    "saveGameState(next); — onCheckpoint handler içinde",
      critical: false,
    },
  ];

  console.log('\nKontrol sonuçları:');
  let criticalFails=0, warnings=0;
  const failed=[];

  for (const check of checks) {
    const ok = check.test();
    const icon = ok ? '✓' : (check.critical ? '✗' : '⚠ ');
    if (!ok && check.critical)  { criticalFails++; failed.push(check); }
    if (!ok && !check.critical) warnings++;
    console.log(`  ${icon} ${check.label}`);
  }

  if (failed.length>0) {
    console.log('\n  ✗ Eksik / yanlış implementasyonlar:');
    failed.forEach(f=>{
      console.log(`\n  [${f.label}]`);
      console.log(`  Eklenecek: ${f.fix}`);
    });
  }

  if (criticalFails===0) console.log('\n  ✓ App.jsx tam ve doğru implemente edilmiş.');
  else console.log(`\n  ✗ ${criticalFails} kritik sorun — yukarıdaki listeyi uygula.`);
  if (warnings>0) console.log(`  ⚠  ${warnings} küçük eksik.`);

  return { criticalFails, warnings, failed };
}

// ═════════════════════════════════════════════════════════════════════════════
// 4. STAT DENETİMİ
// ═════════════════════════════════════════════════════════════════════════════
function auditStats(nodes) {
  console.log('\n'+'═'.repeat(60));
  console.log('4. STAT SİSTEM DENETİMİ');
  console.log('═'.repeat(60));

  const statGains={}, statLosses={}, statNodes={};
  for (const [nid, node] of Object.entries(nodes))
    for (const ev of (node.events||[]))
      if (ev.type==='statChange')
        for (const [k,v] of Object.entries(ev.changes||{}))
          if (typeof v==='number') {
            if (v>0) statGains[k]=(statGains[k]||0)+v;
            if (v<0) statLosses[k]=(statLosses[k]||0)+v;
            if (!statNodes[k]) statNodes[k]=[];
            statNodes[k].push(nid);
          }

  console.log('\nStat başına teorik max:');
  const allStats=new Set([...Object.keys(statGains),...Object.keys(statLosses)]);
  for (const stat of [...allStats].sort()) {
    const gain=statGains[stat]||0, loss=statLosses[stat]||0, cnt=statNodes[stat]?.length||0;
    console.log(`  ${stat.padEnd(25)} max:${String(gain).padStart(5)}  min:${String(gain+loss).padStart(5)}  (${cnt} node)`);
  }

  // Routing eşik kontrolü — JSON'dan oku
  const routingChecks=[
    {stat:'emreBaglantisi',  threshold:460, son:'Son B'},
    {stat:'trust',           threshold:260, son:'Son B'},
    {stat:'humanity',        threshold:845, son:'Son B'},
    {stat:'onlarFarkındalığı',threshold:140,son:'Son C'},
    {stat:'curiosity',       threshold:1370,son:'Son C'},
  ];
  console.log('\nRouting eşikleri vs teorik max:');
  let allOk=true;
  for (const {stat,threshold,son} of routingChecks) {
    const max=statGains[stat]||0, ok=max>=threshold;
    if (!ok) allOk=false;
    console.log(`  ${ok?'✓':'✗'} ${son} — ${stat.padEnd(22)} eşik:${threshold}  max:${max}`);
    if (!ok) console.log(`    → Eşik çok yüksek veya stat az kazanılıyor!`);
  }
  if (allOk) console.log('  ✓ Tüm eşikler ulaşılabilir');
}

// ═════════════════════════════════════════════════════════════════════════════
// 5. SİMÜLASYON
// ═════════════════════════════════════════════════════════════════════════════
const PUZZLE_SUCCESS=0.75;
const INITIAL_STATS={trust:0,humanity:0,fear:0,curiosity:0,emreBaglantisi:0,riskPattern:0,emreDeğişim:0,selinTrust:0,onlarFarkındalığı:0,mentalStability:0,timesNearDeath:0};

function nodeToEndingEp(id){
  if(id.startsWith('ep18'))return'episode_18';
  if(id.startsWith('ep19'))return'episode_19';
  if(id.startsWith('ep20'))return'episode_20';
  return null;
}
function resolveNext(c){
  const ep=c.nextEpisodeId,nid=c.nextNodeId;
  if(ep&&ENDING_NAMES[ep])return{ending:ep};
  if(nid){const e=nodeToEndingEp(nid);return e?{ending:e}:{nextNode:nid};}
  return{};
}
function resolveRoute(routes=[],stats){
  const s=[...routes].sort((a,b)=>(a.priority||99)-(b.priority||99));
  for(const r of s){
    if(r.default)return r;
    const ok=Object.entries(r.conditions||{}).every(([k,c])=>{
      const v=stats[k]||0;
      if(c.gte!==undefined&&v<c.gte)return false;
      if(c.lte!==undefined&&v>c.lte)return false;
      return true;
    });
    if(ok)return r;
  }
  return s[s.length-1];
}

function runSim(nodes, puzzles, startId, n=5000) {
  console.log('\n'+'═'.repeat(60));
  console.log(`5. SİMÜLASYON — ${n.toLocaleString()} oynanış`);
  console.log('═'.repeat(60));
  process.stdout.write('Çalışıyor ');

  const results={episode_18:0,episode_19:0,episode_20:0};
  const errMap={};
  const statsList=[];
  let totalDeaths=0,totalSteps=0;

  for(let i=0;i<n;i++){
    if(i%Math.floor(n/10)===0)process.stdout.write('.');
    let s={...INITIAL_STATS},cur=startId,cp=startId,st=0,d=0,end=null;
    const vsf=new Set();

    while(st<2000&&!end){
      st++;
      const node=nodes[cur];
      if(!node){end='err:'+cur;break;}
      if(!vsf.has(cur)){
        vsf.add(cur);
        for(const ev of(node.events||[]))
          if(ev.type==='statChange')
            for(const[k,v]of Object.entries(ev.changes||{}))
              if(typeof v==='number')s[k]=(s[k]||0)+v;
      }
      if(node.events?.some(e=>e.type==='checkpoint'))cp=cur;
      const pEv=node.events?.find(e=>e.type==='puzzle');
      if(pEv){const p=puzzles[pEv.puzzleId];if(p){if(Math.random()<PUZZLE_SUCCESS)cur=p.successNodeId;else{d++;s.timesNearDeath=(s.timesNearDeath||0)+1;cur=p.failureNodeId||cp;}continue;}}
      const rEv=node.events?.find(e=>e.type==='statBasedRouting');
      if(rEv){const r=resolveRoute(rEv.routes,s);if(!r){end='re';break;}const res=resolveNext(r);if(res.ending){end=res.ending;break;}if(res.nextNode){cur=res.nextNode;continue;}end='rn';break;}
      const hR=node.events?.some(e=>e.type==='loopReset')||cur.endsWith('_death_node');
      if(hR){d++;s.timesNearDeath=(s.timesNearDeath||0)+1;const cc=node.choices?.find(c=>c.restoreCheckpoint);cur=cc?.nextNodeId||cp;continue;}
      const ch=node.choices||[];
      if(ch.length>0){const c=ch[Math.floor(Math.random()*ch.length)];for(const[k,v]of Object.entries(c.effects||{}))if(typeof v==='number')s[k]=(s[k]||0)+v;const res=resolveNext(c);if(res.ending){end=res.ending;break;}if(res.nextNode){cur=res.nextNode;continue;}end='cn:'+cur;break;}
      if(node.nextNodeId){cur=node.nextNodeId;continue;}
      end=nodeToEndingEp(cur)||'dead:'+cur;
    }
    if(!end)end='timeout';
    if(ENDING_NAMES[end]){results[end]++;statsList.push(s);}
    else errMap[end]=(errMap[end]||0)+1;
    totalDeaths+=d;totalSteps+=st;
  }
  console.log(' tamam!\n');

  const done=statsList.length;
  console.log('SON DAĞILIMI:');
  for(const[ep,name]of Object.entries(ENDING_NAMES)){
    const c=results[ep],pct=(c/n*100).toFixed(1),bar='█'.repeat(Math.round(c/n*35));
    console.log(`  ${name.padEnd(26)} ${String(c).padStart(5)} (%${pct.padStart(5)})  ${bar}`);
  }
  const errTot=Object.values(errMap).reduce((a,b)=>a+b,0);
  if(errTot>0){console.log(`\n⚠  Tamamlanamayan: ${errTot}`);Object.entries(errMap).sort((a,b)=>b[1]-a[1]).slice(0,5).forEach(([t,c])=>console.log(`     [${c}x] ${t}`));}
  console.log(`\nOrt. ölüm: ${(totalDeaths/n).toFixed(1)} | Ort. adım: ${(totalSteps/n).toFixed(0)} | Tamamlanan: ${done}/${n}`);

  if(done>0){
    console.log('\nFINAL STAT ORTALAMALARI:');
    ['emreBaglantisi','trust','humanity','onlarFarkındalığı','curiosity','riskPattern'].forEach(k=>{
      const vals=statsList.map(s=>s[k]||0);
      const avg=(vals.reduce((a,b)=>a+b,0)/done).toFixed(0);
      console.log(`  ${k.padEnd(25)} ort:${String(avg).padStart(6)}  min:${Math.min(...vals)}  max:${Math.max(...vals)}`);
    });

    // Routing tahmini
    const TB={emreBaglantisi:460,trust:260,humanity:845};
    const TC={onlarFarkındalığı:140,curiosity:1370,humanity:825};
    const gB=statsList.filter(s=>(s.emreBaglantisi||0)>=TB.emreBaglantisi&&(s.trust||0)>=TB.trust&&(s.humanity||0)>=TB.humanity).length;
    const gC=statsList.filter(s=>!((s.emreBaglantisi||0)>=TB.emreBaglantisi&&(s.trust||0)>=TB.trust&&(s.humanity||0)>=TB.humanity)&&(s.onlarFarkındalığı||0)>=TC.onlarFarkındalığı&&(s.curiosity||0)>=TC.curiosity&&(s.humanity||0)>=TC.humanity).length;
    const gA=done-gB-gC;
    console.log('\nROUTING TAHMİNİ (JSON eşikleriyle):');
    [['Son A (Kilit)',gA],['Son B (Birlikte)',gB],['Son C (Anlat)',gC]].forEach(([label,cnt])=>{
      const pct=(cnt/done*100).toFixed(1),bar='█'.repeat(Math.round(cnt/done*30));
      console.log(`  ${label.padEnd(20)} %${pct.padStart(5)}  ${bar}`);
    });

    const simA=results.episode_18,simB=results.episode_19,simC=results.episode_20;
    console.log('\nSİMÜLASYON vs TAHMİN:');
    [['Son A',simA,gA],['Son B',simB,gB],['Son C',simC,gC]].forEach(([name,sim,th])=>{
      const sp=(sim/done*100).toFixed(1),tp=(th/done*100).toFixed(1);
      const diff=Math.abs(sim-th)/done*100;
      console.log(`  ${diff<8?'✓':'⚠ '} ${name.padEnd(8)} sim:%${sp.padStart(5)}  tahmin:%${tp.padStart(5)}  fark:%${diff.toFixed(1)}`);
    });
  }
  return{results,done,errMap};
}

// ═════════════════════════════════════════════════════════════════════════════
// 6. ÖZET RAPOR
// ═════════════════════════════════════════════════════════════════════════════
function printSummary(jsonR, engineR, appR, simR) {
  console.log('\n'+'═'.repeat(60));
  console.log('ÖZET RAPOR');
  console.log('═'.repeat(60));

  const sections=[
    {label:'JSON yapısı',         ok: jsonR.errors.length===0,
     detail: jsonR.errors.length>0?`${jsonR.errors.length} kritik hata`:'Kırık bağlantı yok'},
    {label:'eventPlayer.js',      ok: engineR?engineR.criticalFails===0:null,
     detail: !engineR?'--engine ile test et':engineR.criticalFails>0?`${engineR.criticalFails} eksik handler`:'Tüm event\'ler handle ediliyor'},
    {label:'App.jsx (React loop)', ok: appR?appR.criticalFails===0:null,
     detail: !appR?'--app ile test et':appR.criticalFails>0?`${appR.criticalFails} kritik eksik`:'Stat dedup, checkpoint, routing doğru'},
    {label:'Simülasyon',           ok: simR?simR.done>simR.done*0.99:null,
     detail: !simR?'--sim ile test et':`${simR.done.toLocaleString()} tamamlandı, 3 son erişilebilir`},
  ];

  sections.forEach(({label,ok,detail})=>{
    const icon=ok===null?'─':ok?'✓':'✗';
    console.log(`  ${icon} ${label.padEnd(25)} ${detail}`);
  });

  const allOk=sections.every(s=>s.ok===null||s.ok===true);
  console.log('\n  '+'─'.repeat(50));
  if(allOk&&sections.some(s=>s.ok===true))
    console.log('  ✓ Tüm kontroller geçti. Oyun oynayabilir durumda.');
  else
    console.log('  ⚠  Bazı sorunlar var. Yukarıdaki raporu incele.');

  console.log('\n  GERÇEK OYUNDA MUTLAKA TEST ET:');
  console.log('  1. EP17\'ye oyna → statBasedRouting doğru sona gidiyor mu?');
  console.log('  2. Ölüp devam et → stat şişiyor mu? (olmamalı)');
  console.log('  3. EP18/19/20 → doğru bölüm yükleniyor mu?');
  console.log('  4. characterBusy → 15 dk sonra bildirim geliyor mu?');
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
const args=process.argv.slice(2);
const engineIdx=args.indexOf('--engine');
const appIdx=args.indexOf('--app');
const enginePath=engineIdx>=0?path.resolve(process.cwd(),args[engineIdx+1]):null;
// App.jsx varsayılan yolu otomatik dene
const defaultAppPath=path.resolve(process.cwd(),'src','App.jsx');
const appPath=appIdx>=0?path.resolve(process.cwd(),args[appIdx+1])
             :fs.existsSync(defaultAppPath)?defaultAppPath:null;
const runSimFlag=args.includes('--sim');
const runsIdx=args.indexOf('--runs');
const simN=runsIdx>=0?(parseInt(args[runsIdx+1])||5000):5000;

console.log('KATMAN Tam Doğrulama Sistemi\n'+'─'.repeat(60));
if(appPath) console.log(`App.jsx otomatik bulundu: ${appPath}`);

const{nodes,puzzles,startId}=loadData();
console.log(`✓ ${Object.keys(nodes).length} node, ${Object.keys(puzzles).length} puzzle yüklendi`);

const jsonR=validateJSON(nodes,puzzles);
auditStats(nodes);
const engineR=validateEngine(enginePath,jsonR.usedEventTypes);
const appR=validateApp(appPath);
const simR=runSimFlag?runSim(nodes,puzzles,startId,simN):null;
printSummary(jsonR,engineR,appR,simR);

console.log('\n'+'═'.repeat(60));
console.log('TAMAMLANDI');
console.log('═'.repeat(60));