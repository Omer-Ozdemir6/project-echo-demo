// katman_explorer.js  v6
// node katman_explorer.js [--explore] [--sim] [--debug] [--runs N]
//
// v6 değişiklikleri:
// - StatChange'ler her node için yalnızca BİR KEZ uygulanır (visitedForStats seti)
//   Ölüm → checkpoint sonrası aynı noddan geçince stats iki kez artmaz.
// - BFS endings sayacı düzeltildi: ep18/19/20 nodları doğru sayılır.

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
// Ending episode'larının başlangıç node'ları
const ENDING_STARTS = {
  ep18: 'episode_18',
  ep19: 'episode_19',
  ep20: 'episode_20',
};

const INITIAL_STATS = {
  trust:0, humanity:0, fear:0, curiosity:0, emreBaglantisi:0,
  riskPattern:0, emreDeğişim:0, selinTrust:0, onlarFarkındalığı:0,
  mentalStability:0, timesNearDeath:0,
};
const PUZZLE_SUCCESS = 0.75;

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
  const startId = raw.startNodeId || 'ep01_n01';
  console.log(`✓ ${Object.keys(nodes).length} node, ${Object.keys(puzzles).length} puzzle | start: ${startId}`);
  return { nodes, puzzles, startId };
}

// ─── Yardımcılar ──────────────────────────────────────────────────────────────
function isEndingEp(ep)  { return !!ENDING_NAMES[ep]; }

// Node ID'sinden ending episode'unu çıkar (ep18_xxx → 'episode_18')
function nodeToEndingEp(nodeId) {
  for (const [prefix, ep] of Object.entries(ENDING_STARTS)) {
    if (nodeId.startsWith(prefix)) return ep;
  }
  return null;
}

function resolveNext(c) {
  const ep=c.nextEpisodeId, nid=c.nextNodeId;
  if (ep && isEndingEp(ep))    return { ending: ep };
  if (nid) {
    const endEp = nodeToEndingEp(nid);
    if (endEp) return { ending: endEp };  // nextNodeId direkt ending başlangıcı
    return { nextNode: nid };
  }
  return {};
}

// StatChange'leri uygula — yalnızca FIRST_VISIT modunda çalışır
function applyEvents(events=[], stats, visitedForStats, nodeId) {
  if (visitedForStats && visitedForStats.has(nodeId)) return stats; // daha önce uygulandı
  if (visitedForStats) visitedForStats.add(nodeId);
  const s={...stats};
  for (const ev of events) {
    if (ev.type!=='statChange') continue;
    for (const [k,v] of Object.entries(ev.changes||{}))
      if (typeof v==='number') s[k]=(s[k]||0)+v;
  }
  return s;
}

function applyEffects(eff={}, stats) {
  const s={...stats};
  for (const [k,v] of Object.entries(eff||{}))
    if (typeof v==='number') s[k]=(s[k]||0)+v;
  return s;
}

function resolveRoute(routes=[], stats) {
  const sorted=[...routes].sort((a,b)=>(a.priority||99)-(b.priority||99));
  for (const r of sorted) {
    if (r.default) return r;
    const ok=Object.entries(r.conditions||{}).every(([stat,cond])=>{
      const v=stats[stat]||0;
      if (cond.gte!==undefined && v<cond.gte) return false;
      if (cond.lte!==undefined && v>cond.lte) return false;
      return true;
    });
    if (ok) return r;
  }
  return sorted[sorted.length-1];
}

// ════════════════════════════════════════════════════════════════════════════
// 1. BFS KEŞİF
// ════════════════════════════════════════════════════════════════════════════
function explore(nodes, puzzles, startId) {
  console.log('\n'+'═'.repeat(60)+'\nTAM KEŞİF MODU (BFS)\n'+'═'.repeat(60));

  const visited=new Set();
  const endings={episode_18:0,episode_19:0,episode_20:0};
  const dead=[], errs=[];
  const queue=[startId];
  visited.add(startId);

  while (queue.length>0) {
    const id=queue.shift();
    const n=nodes[id];
    if (!n){errs.push(id);continue;}

    // Ending episode node'unu ziyaret edince say
    const endEp=nodeToEndingEp(id);
    if (endEp && id.endsWith('_n01')) { endings[endEp]++; }

    const enq=(nid)=>{ if(nid&&!visited.has(nid)){visited.add(nid);queue.push(nid);} };

    const puzzEv=n.events?.find(e=>e.type==='puzzle');
    if (puzzEv) {
      const p=puzzles[puzzEv.puzzleId];
      if (p){enq(p.successNodeId);enq(p.failureNodeId);}
      continue;
    }

    const routEv=n.events?.find(e=>e.type==='statBasedRouting');
    if (routEv) {
      for (const r of (routEv.routes||[])) {
        const res=resolveNext(r);
        if (res.ending) { endings[res.ending]++; enq(r.nextNodeId); }
        else if (res.nextNode) enq(res.nextNode);
      }
      continue;
    }

    if (n.choices?.length>0) {
      for (const c of n.choices) {
        const res=resolveNext(c);
        if (res.ending) { endings[res.ending]++; if(c.nextNodeId) enq(c.nextNodeId); }
        else if (res.nextNode) enq(res.nextNode);
      }
      continue;
    }

    if (n.nextNodeId){enq(n.nextNodeId);continue;}

    // Terminal — ending değilse dead end
    const isEnd=nodeToEndingEp(id)||id.includes('kapan');
    if (!isEnd) dead.push(id);
  }

  const unreach=Object.keys(nodes).filter(id=>!visited.has(id)&&!id.includes('kapan'));

  console.log(`\nZiyaret: ${visited.size} / ${Object.keys(nodes).length}`);
  console.log('\nSON DAĞILIMI (erişilebilen yollar):');
  for (const [ep,name] of Object.entries(ENDING_NAMES))
    console.log(`  ${name.padEnd(26)} ${endings[ep]} yol`);

  if (errs.length)  console.log(`\n✗ Kırık ref (${errs.length}): ${errs.join(', ')}`);
  if (dead.length)  console.log(`⚠  Dead end (${dead.length}): ${dead.join(', ')}`);
  if (unreach.length) {
    console.log(`✗ Erişilemeyen (${unreach.length}):`);
    unreach.slice(0,10).forEach(n=>console.log(`   ${n}`));
    if (unreach.length>10) console.log(`   ... ve ${unreach.length-10} tane daha`);
  } else {
    console.log('\n✓ Tüm node\'lara ulaşıldı');
  }
}

// ════════════════════════════════════════════════════════════════════════════
// 2. TEK OYNANMA çekirdeği
// ════════════════════════════════════════════════════════════════════════════
function runOne(nodes, puzzles, startId, verbose=false) {
  let stats={...INITIAL_STATS};
  let cur=startId, checkpoint=startId;
  let steps=0, deaths=0, ending=null;
  const visitCount={};
  const visitedForStats=new Set();  // StatChange'ler sadece 1 kez uygulanır
  const pathLog=[];

  while (steps<2000 && !ending) {
    steps++;

    visitCount[cur]=(visitCount[cur]||0)+1;
    if (visitCount[cur]>20) {
      ending='inf_loop:'+cur;
      if (verbose) {
        console.log(`\n  ∞ SONSUZ DÖNGÜ: ${cur} (${visitCount[cur]} kez)`);
        console.log('  Son 15 adım:');
        pathLog.slice(-15).forEach((p,i)=>console.log(`    ${i+1}. ${p}`));
      }
      break;
    }

    const node=nodes[cur];
    if (!node){ending='err:'+cur;break;}

    if (verbose) {
      const evList=node.events?.map(e=>e.type).join(',') || '';
      const ch=node.choices?.length||0;
      console.log(`  ${String(steps).padStart(4)}. ${cur.padEnd(38)} ev:[${evList}]  ch:${ch}  next:${node.nextNodeId||'-'}`);
    }

    pathLog.push(cur);
    if (pathLog.length>50) pathLog.shift();

    // StatChange — yalnızca ilk ziyarette uygula
    stats=applyEvents(node.events, stats, visitedForStats, cur);

    // Checkpoint kaydet
    if (node.events?.some(e=>e.type==='checkpoint')) checkpoint=cur;

    // ── 1. Puzzle ────────────────────────────────────────────────────────
    const puzzEv=node.events?.find(e=>e.type==='puzzle');
    if (puzzEv) {
      const p=puzzles[puzzEv.puzzleId];
      if (p) {
        const pass=Math.random()<PUZZLE_SUCCESS;
        if (verbose) console.log(`       PUZZLE: ${puzzEv.puzzleId} → ${pass?'BAŞARILI':'BAŞARISIZ'}`);
        if (pass) { cur=p.successNodeId; }
        else {
          deaths++;
          stats.timesNearDeath=(stats.timesNearDeath||0)+1;
          cur=p.failureNodeId||checkpoint;
        }
        continue;
      }
    }

    // ── 2. statBasedRouting (loopReset'ten ÖNCE!) ─────────────────────────
    const routEv=node.events?.find(e=>e.type==='statBasedRouting');
    if (routEv) {
      const r=resolveRoute(routEv.routes,stats);
      if (!r){ending='routing_err';break;}
      const res=resolveNext(r);
      if (verbose) console.log(`       ROUTING → ${r.nextEpisodeId||r.nextNodeId} (${r.default?'default':JSON.stringify(r.conditions)})`);
      if (res.ending){ending=res.ending;break;}
      if (res.nextNode){cur=res.nextNode;continue;}
      ending='routing_no_next'; break;
    }

    // ── 3. loopReset / death ──────────────────────────────────────────────
    const hasReset=node.events?.some(e=>e.type==='loopReset')||cur.endsWith('_death_node');
    if (hasReset) {
      if (verbose) console.log(`       DEATH/RESET → checkpoint: ${checkpoint}`);
      deaths++;
      stats.timesNearDeath=(stats.timesNearDeath||0)+1;
      const cpC=node.choices?.find(c=>c.restoreCheckpoint);
      cur=cpC?.nextNodeId||checkpoint;
      continue;
    }

    // ── 4. Choices ────────────────────────────────────────────────────────
    const choices=node.choices||[];
    if (choices.length>0) {
      const c=choices[Math.floor(Math.random()*choices.length)];
      stats=applyEffects(c.effects,stats);
      const res=resolveNext(c);
      if (verbose) console.log(`       CHOICE: "${(c.text||c.id||'?').slice(0,40)}" → ${res.ending||res.nextNode||'??'}`);
      if (res.ending){ending=res.ending;break;}
      if (res.nextNode){cur=res.nextNode;continue;}
      ending='choice_no_next:'+cur; break;
    }

    // ── 5. Node-level nextNodeId ──────────────────────────────────────────
    if (node.nextNodeId){cur=node.nextNodeId;continue;}

    // ── 6. Terminal ───────────────────────────────────────────────────────
    const epFromNode=nodeToEndingEp(cur);
    ending = epFromNode || 'dead_end:'+cur;
  }

  if (!ending) ending='timeout';
  return {ending, stats, steps, deaths};
}

// ════════════════════════════════════════════════════════════════════════════
// 3. DEBUG MODU
// ════════════════════════════════════════════════════════════════════════════
function debugMode(nodes, puzzles, startId) {
  console.log('\n'+'═'.repeat(60)+'\nDEBUG MODU — 3 Oynanış\n'+'═'.repeat(60));
  for (let i=1;i<=3;i++) {
    console.log(`\n${'─'.repeat(50)}\nOYUNANIŞ ${i}\n${'─'.repeat(50)}`);
    const r=runOne(nodes,puzzles,startId,true);
    console.log(`\n  → Sonuç: ${r.ending} | Adım: ${r.steps} | Ölüm: ${r.deaths}`);
    const key=['emreBaglantisi','trust','humanity','onlarFarkındalığı','curiosity'];
    key.forEach(k=>console.log(`     ${k}: ${(r.stats[k]||0).toFixed(0)}`));
    if (i<3) console.log('\n--- sonraki ---');
  }
}

// ════════════════════════════════════════════════════════════════════════════
// 4. MONTE CARLO SİMÜLASYON
// ════════════════════════════════════════════════════════════════════════════
function simulate(nodes, puzzles, startId, n=10_000) {
  console.log('\n'+'═'.repeat(60));
  console.log(`MONTE CARLO — ${n.toLocaleString()} oynanış  |  puzzle: %${Math.round(PUZZLE_SUCCESS*100)}`);
  console.log('Not: StatChange\'ler her node için yalnızca 1 kez uygulanır.');
  console.log('═'.repeat(60));
  process.stdout.write('Çalışıyor ');

  const results={episode_18:0,episode_19:0,episode_20:0};
  const errMap={};
  const finalStatsList=[];
  let totalDeaths=0, totalSteps=0;

  for (let run=0;run<n;run++) {
    if (run%Math.floor(n/20)===0) process.stdout.write('.');
    const r=runOne(nodes,puzzles,startId,false);
    if (ENDING_NAMES[r.ending]) {
      results[r.ending]++;
      finalStatsList.push(r.stats);
    } else {
      errMap[r.ending]=(errMap[r.ending]||0)+1;
    }
    totalDeaths+=r.deaths;
    totalSteps+=r.steps;
  }
  console.log(' tamam!\n');

  const completed=finalStatsList.length;

  console.log('SON DAĞILIMI:');
  for (const [ep,name] of Object.entries(ENDING_NAMES)) {
    const c=results[ep], pct=(c/n*100).toFixed(1);
    const bar='█'.repeat(Math.round(c/n*40));
    console.log(`  ${name.padEnd(26)} ${String(c).padStart(6)}  (%${pct.padStart(5)})  ${bar}`);
  }

  const errTot=Object.values(errMap).reduce((a,b)=>a+b,0);
  if (errTot>0) {
    console.log(`\n  ⚠  Tamamlanamayan: ${errTot}`);
    Object.entries(errMap).sort((a,b)=>b[1]-a[1]).slice(0,10)
      .forEach(([t,c])=>console.log(`     [${c}x] ${t}`));
  }

  console.log(`\nOrt. ölüm:  ${(totalDeaths/n).toFixed(2)}`);
  console.log(`Ort. adım:  ${(totalSteps/n).toFixed(0)}`);
  console.log(`Tamamlanan: ${completed} / ${n}`);

  if (completed>0) {
    const KEY=['emreBaglantisi','trust','humanity','onlarFarkındalığı','curiosity','riskPattern'];
    console.log('\nFINAL STAT ORTALAMALARI (tek geçiş, death replay yok):');
    KEY.forEach(k=>{
      const vals=finalStatsList.map(s=>s[k]||0);
      const avg=(vals.reduce((a,b)=>a+b,0)/completed).toFixed(1);
      const max=Math.max(...vals);
      const min=Math.min(...vals);
      console.log(`  ${k.padEnd(25)} ort:${String(avg).padStart(7)}  min:${String(min).padStart(5)}  max:${String(max).padStart(5)}`);
    });

    // Eşikler — JSON'daki statBasedRouting conditions ile senkronize tutun
    const TB = { emreBaglantisi: 460, trust: 260, humanity: 845 };
    const TC = { onlarFarkındalığı: 140, curiosity: 1370, humanity: 825 };

    console.log('\nROUTING EŞİK ANALİZİ (JSON koşullarıyla):');
    [
      [`Son B — emreBaglantisi ≥ ${TB.emreBaglantisi}`,   s=>(s.emreBaglantisi||0)>=TB.emreBaglantisi],
      [`Son B — trust ≥ ${TB.trust}`,                      s=>(s.trust||0)>=TB.trust],
      [`Son B — humanity ≥ ${TB.humanity}`,                s=>(s.humanity||0)>=TB.humanity],
      [`Son C — onlarFarkındalığı ≥ ${TC.onlarFarkındalığı}`, s=>(s.onlarFarkındalığı||0)>=TC.onlarFarkındalığı],
      [`Son C — curiosity ≥ ${TC.curiosity}`,              s=>(s.curiosity||0)>=TC.curiosity],
      [`Son C — humanity ≥ ${TC.humanity}`,                s=>(s.humanity||0)>=TC.humanity],
    ].forEach(([label,check])=>{
      const pass=finalStatsList.filter(check).length;
      const pct=(pass/completed*100).toFixed(1);
      const bar='█'.repeat(Math.round(pass/completed*30));
      console.log(`  ${label.padEnd(42)} %${pct.padStart(5)}  ${bar}`);
    });

    console.log('\nROUTING TAHMİNİ (JSON eşikleriyle teorik):');
    const goB=finalStatsList.filter(s=>
      (s.emreBaglantisi||0)>=TB.emreBaglantisi &&
      (s.trust||0)>=TB.trust &&
      (s.humanity||0)>=TB.humanity
    ).length;
    const goC=finalStatsList.filter(s=>
      !((s.emreBaglantisi||0)>=TB.emreBaglantisi &&
        (s.trust||0)>=TB.trust &&
        (s.humanity||0)>=TB.humanity) &&
      (s.onlarFarkındalığı||0)>=TC.onlarFarkındalığı &&
      (s.curiosity||0)>=TC.curiosity &&
      (s.humanity||0)>=TC.humanity
    ).length;
    const goA=completed-goB-goC;

    [['Son A (Kilit)',    goA],
     ['Son B (Birlikte)', goB],
     ['Son C (Anlat)',    goC]].forEach(([label,cnt])=>{
      const pct=(cnt/completed*100).toFixed(1);
      const bar='█'.repeat(Math.round(cnt/completed*30));
      console.log(`  ${label.padEnd(20)} %${pct.padStart(5)}  ${bar}`);
    });

    const simA = results.episode_18, simB = results.episode_19, simC = results.episode_20;
    console.log('\nSİMÜLASYON vs TAHMİN (fark küçükse sistem doğru):');
    [['Son A',simA,goA],['Son B',simB,goB],['Son C',simC,goC]].forEach(([name,sim,th])=>{
      const sp=(sim/completed*100).toFixed(1), tp=(th/completed*100).toFixed(1);
      const diff=Math.abs(sim-th)/completed*100;
      const ok = diff<8 ? '✓' : '⚠ ';
      console.log(`  ${ok} ${name.padEnd(8)} sim:%${sp.padStart(5)}  tahmin:%${tp.padStart(5)}  fark:%${diff.toFixed(1)}`);
    });
  }

  return { results, completed };
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
const args=process.argv.slice(2);
const flagArgs=args.filter(a=>a.startsWith('--')&&a!=='--runs');
const runAll=flagArgs.length===0;
const doDebug  =args.includes('--debug');
const doExplore=(!doDebug&&runAll)||args.includes('--explore');
const doSim    =(!doDebug&&runAll)||args.includes('--sim');
const ri=args.indexOf('--runs');
const simRuns=ri>=0?(parseInt(args[ri+1])||10_000):10_000;

console.log('KATMAN Story Explorer v6\n'+'─'.repeat(60));
const {nodes,puzzles,startId}=loadData();
if (doDebug)   debugMode(nodes,puzzles,startId);
if (doExplore) explore(nodes,puzzles,startId);
if (doSim)     simulate(nodes,puzzles,startId,simRuns);
console.log('\n'+'═'.repeat(60)+'\nTAMAMLANDI\n'+'═'.repeat(60));