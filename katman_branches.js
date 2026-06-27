// katman_branches.js
// Dallanma ve Seçim Etki Analizi
// node katman_branches.js [--episode EP01] [--full]

import fs   from 'fs';
import path from 'path';

const BASE = path.resolve(process.cwd(), 'src', 'data', 'episodes');
const ENDING_FILES = {
  episode_18: path.join(BASE, 'episode-18.json'),
  episode_19: path.join(BASE, 'episode-19.json'),
  episode_20: path.join(BASE, 'episode-20.json'),
};

function loadData() {
  const raw = JSON.parse(fs.readFileSync(path.join(BASE,'merged_story.json'),'utf-8'));
  const nodes={}, puzzles={...(raw.puzzles||{})};
  for (const [id,val] of Object.entries(raw.nodes||{}))
    if (val&&typeof val==='object'&&!Array.isArray(val)) nodes[id]=val;
  for (const [,file] of Object.entries(ENDING_FILES)) {
    if (!fs.existsSync(file)) continue;
    const ep=JSON.parse(fs.readFileSync(file,'utf-8'));
    for (const [id,val] of Object.entries(ep.nodes||{}))
      if (val&&typeof val==='object'&&!Array.isArray(val)) nodes[id]=val;
    Object.assign(puzzles,ep.puzzles||{});
  }
  return {nodes, puzzles, startId: raw.startNodeId||'ep01_n01'};
}

// ─── Bir node'dan BFS ile erişilebilen node seti (max depth) ──────────────────
function bfsFrom(startId, nodes, maxDepth=30, stopAtChoice=true) {
  const visited=new Set(), order=[];
  const queue=[{id:startId, depth:0}];
  visited.add(startId);
  while (queue.length>0) {
    const {id,depth}=queue.shift();
    if (!nodes[id]) continue;
    order.push(id);
    if (depth>=maxDepth) continue;
    const node=nodes[id];
    // Seçim noktasına gelince dur (bottleneck bulmak için)
    const isChoice = node.choices?.length>1;
    if (isChoice && stopAtChoice && id!==startId) continue;
    const nexts=[];
    if (node.choices?.length>0) nexts.push(...node.choices.map(c=>c.nextNodeId).filter(Boolean));
    else if (node.nextNodeId) nexts.push(node.nextNodeId);
    const puzzEv=node.events?.find(e=>e.type==='puzzle');
    if (puzzEv) {
      const p=nodes[puzzEv.puzzleId]||{};
      if (puzzEv.puzzleId && nodes[puzzEv.puzzleId]===undefined) {
        // puzzle ref — successNodeId/failureNodeId
      }
    }
    for (const nxt of nexts) {
      if (!visited.has(nxt)&&nxt) { visited.add(nxt); queue.push({id:nxt,depth:depth+1}); }
    }
  }
  return {visited, order};
}

// ─── İki path'in kesişim noktasını bul ───────────────────────────────────────
function findConvergence(pathA, pathB, nodes, maxDepth=25) {
  const visitedA=new Set(), visitedB=new Set();
  const qA=[pathA], qB=[pathB];
  visitedA.add(pathA); visitedB.add(pathB);

  const followPath = (startId, visited, max) => {
    const q=[{id:startId,d:0}];
    while (q.length>0) {
      const {id,d}=q.shift();
      if (d>=max||!nodes[id]) continue;
      const node=nodes[id];
      const nexts=[];
      if (node.choices?.length>0) nexts.push(...node.choices.map(c=>c.nextNodeId).filter(Boolean));
      else if (node.nextNodeId) nexts.push(node.nextNodeId);
      const puz=node.events?.find(e=>e.type==='puzzle');
      if (puz) {
        const pdata=Object.values(nodes).find(n=>
          n.events?.some(ev=>ev.type==='puzzle'&&ev.puzzleId===puz.puzzleId)
        );
        // skip complex puzzle routing for now
      }
      for (const n of nexts)
        if (!visited.has(n)&&n) { visited.add(n); q.push({id:n,d:d+1}); }
    }
    return visited;
  };

  const setA=followPath(pathA, visitedA, maxDepth);
  const setB=followPath(pathB, visitedB, maxDepth);

  // Kesişim
  const common=[...setA].filter(id=>setB.has(id));
  // Topological order'da ilk ortak node = convergence point
  // Yaklaşık: prefix similarity
  const onlyA=[...setA].filter(id=>!setB.has(id));
  const onlyB=[...setB].filter(id=>!setA.has(id));

  return { common, onlyA, onlyB, convergence: common[0]||null };
}

// ─── Bir node'daki mesaj sayısı ───────────────────────────────────────────────
function countMessages(nodeId, nodes) {
  const n=nodes[nodeId];
  if (!n) return 0;
  return (n.events||[]).filter(e=>e.type==='message').length;
}

// ─── Stat değişimlerini topla ─────────────────────────────────────────────────
function sumStatChanges(nodeIds, nodes) {
  const totals={};
  for (const nid of nodeIds) {
    const node=nodes[nid];
    if (!node) continue;
    for (const ev of (node.events||[])) {
      if (ev.type!=='statChange') continue;
      for (const [k,v] of Object.entries(ev.changes||{}))
        if (typeof v==='number') totals[k]=(totals[k]||0)+v;
    }
  }
  return totals;
}

// ─── Episode grupla ───────────────────────────────────────────────────────────
function groupByEpisode(nodes) {
  const eps={};
  for (const id of Object.keys(nodes)) {
    const ep=id.split('_')[0];
    if (!eps[ep]) eps[ep]=[];
    eps[ep].push(id);
  }
  return eps;
}

// ═════════════════════════════════════════════════════════════════════════════
// ANALİZ 1: SEÇİM ETKİ ANALİZİ
// ═════════════════════════════════════════════════════════════════════════════
function analyzeChoices(nodes, puzzles, filterEp=null) {
  console.log('\n'+'═'.repeat(60));
  console.log('1. SEÇİM ETKİ ANALİZİ');
  console.log('═'.repeat(60));
  console.log('Her seçim için: kaç unique node var, stat farkı ne, ne zaman birleşiyor\n');

  const results=[];
  let deadCount=0, aliveCount=0;

  for (const [nid,node] of Object.entries(nodes)) {
    if (filterEp && !nid.startsWith(filterEp.toLowerCase())) continue;
    const choices=node.choices||[];
    if (choices.length<2) continue;

    const c0=choices[0], c1=choices[1];
    const n0=c0.nextNodeId, n1=c1.nextNodeId;
    if (!n0||!n1) continue;

    // Ölü seçim kontrolü
    const isDead = (c0.nextEpisodeId===c1.nextEpisodeId) &&
                   (n0===n1 || (!n0&&!n1));
    if (isDead||n0===n1) { deadCount++; continue; }

    // Path analizi
    const conv=findConvergence(n0, n1, nodes, 20);
    const uniqueA=conv.onlyA.length;
    const uniqueB=conv.onlyB.length;
    const depth=Math.max(uniqueA,uniqueB);

    // İçerik farkı (mesaj sayısı)
    const msgA=conv.onlyA.reduce((s,id)=>s+countMessages(id,nodes),0);
    const msgB=conv.onlyB.reduce((s,id)=>s+countMessages(id,nodes),0);

    // Stat farkı
    const statsA=sumStatChanges(conv.onlyA,nodes);
    const statsB=sumStatChanges(conv.onlyB,nodes);
    const statDiff={};
    const allKeys=new Set([...Object.keys(statsA),...Object.keys(statsB)]);
    for (const k of allKeys) {
      const d=(statsA[k]||0)-(statsB[k]||0);
      if (d!==0) statDiff[k]=d;
    }

    aliveCount++;
    results.push({
      nodeId:nid, choices:[c0,c1],
      uniqueA, uniqueB, depth, msgA, msgB,
      statDiff, convergence:conv.convergence,
      episode:nid.split('_')[0]
    });
  }

  // Episode bazında özetle
  const byEp={};
  for (const r of results) {
    if (!byEp[r.episode]) byEp[r.episode]={choices:[],totalDepth:0,deadChoices:0};
    byEp[r.episode].choices.push(r);
    byEp[r.episode].totalDepth+=r.depth;
  }

  // Detaylı çıktı
  for (const [ep,data] of Object.entries(byEp).sort()) {
    const epLabel=ep.toUpperCase();
    console.log(`─── ${epLabel} ${'─'.repeat(50-epLabel.length)}`);
    for (const r of data.choices) {
      const label0=(r.choices[0].text||r.choices[0].id||'?').slice(0,35);
      const label1=(r.choices[1].text||r.choices[1].id||'?').slice(0,35);
      const depthBar='█'.repeat(Math.min(r.depth,15));
      console.log(`  [${r.nodeId}]`);
      console.log(`    A: "${label0}"`);
      console.log(`    B: "${label1}"`);
      console.log(`    Unique node: A=${r.uniqueA}  B=${r.uniqueB}  Depth=${r.depth}  ${depthBar}`);
      console.log(`    Mesaj farkı: A=${r.msgA} B=${r.msgB}`);
      if (Object.keys(r.statDiff).length>0) {
        const diffs=Object.entries(r.statDiff)
          .map(([k,v])=>`${k}:${v>0?'+':''}${v}`).join('  ');
        console.log(`    Stat farkı: ${diffs}`);
      }
      if (r.convergence) console.log(`    Birleşme: ${r.convergence}`);
      console.log('');
    }
  }

  // Özet istatistikler
  const avgDepth=results.reduce((s,r)=>s+r.depth,0)/(results.length||1);
  const deepChoices=results.filter(r=>r.depth>=5).length;
  const shallowChoices=results.filter(r=>r.depth<3).length;

  console.log('─'.repeat(60));
  console.log(`Anlamlı seçim:  ${aliveCount}`);
  console.log(`Ölü seçim:      ${deadCount}`);
  console.log(`Ort. dal derinliği: ${avgDepth.toFixed(1)} node`);
  console.log(`Derin dal (≥5):     ${deepChoices}`);
  console.log(`Sığ dal (<3):       ${shallowChoices}`);

  return results;
}

// ═════════════════════════════════════════════════════════════════════════════
// ANALİZ 2: EPISODE DALLANMA ORANLARI
// ═════════════════════════════════════════════════════════════════════════════
function analyzeBranchRatios(nodes) {
  console.log('\n'+'═'.repeat(60));
  console.log('2. EPISODE DALLANMA ORANLARI');
  console.log('═'.repeat(60));
  console.log('Her episode\'da içeriğin kaçta kaçı dallarda (tekrar oynanışta keşfedilir)\n');

  const epGroups=groupByEpisode(nodes);
  const summary=[];

  for (const [ep,nodeList] of Object.entries(epGroups).sort()) {
    if (!ep.startsWith('ep')) continue;
    const total=nodeList.length;
    // Seçim noktası sayısı
    const choiceNodes=nodeList.filter(id=>(nodes[id]?.choices?.length||0)>=2);
    // Ortalama dal derinliği bu episode için
    let totalBranchNodes=0;
    let uniqueContentNodes=0;

    for (const nid of choiceNodes) {
      const node=nodes[nid];
      const choices=node.choices||[];
      if (choices.length<2) continue;
      const n0=choices[0]?.nextNodeId, n1=choices[1]?.nextNodeId;
      if (!n0||!n1||n0===n1) continue;
      const conv=findConvergence(n0,n1,nodes,15);
      totalBranchNodes+=conv.onlyA.length+conv.onlyB.length;
      uniqueContentNodes+=Math.max(conv.onlyA.length,conv.onlyB.length);
    }

    const branchRatio=total>0?(totalBranchNodes/total*100).toFixed(0):0;
    const bar='█'.repeat(Math.min(Math.floor(branchRatio/5),20));
    const epNum=ep.replace('ep','EP');
    summary.push({ep:epNum,total,choices:choiceNodes.length,branchRatio:+branchRatio});
    console.log(`  ${epNum.padEnd(6)} ${String(total).padStart(3)} node  ${String(choiceNodes.length).padStart(2)} seçim  dal:%${String(branchRatio).padStart(3)}  ${bar}`);
  }

  const avgBranch=summary.reduce((s,r)=>s+r.branchRatio,0)/(summary.length||1);
  console.log(`\n  Ortalama dallanma oranı: %${avgBranch.toFixed(0)}`);
  console.log('  (Yüksek = o bölümde çok "gizli" içerik var)');

  return summary;
}

// ═════════════════════════════════════════════════════════════════════════════
// ANALİZ 3: TEKRARDAKİ KEŞİF (Replayability)
// ═════════════════════════════════════════════════════════════════════════════
function analyzeReplayability(nodes, puzzles, startId, runs=200) {
  console.log('\n'+'═'.repeat(60));
  console.log('3. TEKRARDAKİ KEŞİF (Replayability)');
  console.log('═'.repeat(60));
  console.log(`${runs} rastgele oynanış — tek oynanışta kaç farklı node görülür?\n`);

  const allNodeIds=new Set(Object.keys(nodes));
  const totalNodes=allNodeIds.size;

  // Her oynanışta ziyaret edilen node'ları topla
  const perRunVisited=[];
  const allVisitedAcrossRuns=new Set();

  for (let run=0;run<runs;run++) {
    const visited=new Set();
    let cur=startId, steps=0;
    while (steps<500&&cur&&nodes[cur]) {
      steps++;
      visited.add(cur);
      allVisitedAcrossRuns.add(cur);
      const node=nodes[cur];
      const puzzEv=node.events?.find(e=>e.type==='puzzle');
      if (puzzEv) {
        const p=puzzles[puzzEv.puzzleId];
        cur=p?(Math.random()<0.75?p.successNodeId:p.failureNodeId||cur):null;
        continue;
      }
      const rEv=node.events?.find(e=>e.type==='statBasedRouting');
      if (rEv) {
        const r=rEv.routes?.[rEv.routes.length-1];
        cur=r?.nextNodeId||null; break;
      }
      const ch=node.choices||[];
      if (ch.length>0) {
        const c=ch[Math.floor(Math.random()*ch.length)];
        cur=c.nextNodeId;
        continue;
      }
      cur=node.nextNodeId||null;
    }
    perRunVisited.push(visited.size);
  }

  const avgVisited=perRunVisited.reduce((a,b)=>a+b,0)/runs;
  const minVisited=Math.min(...perRunVisited);
  const maxVisited=Math.max(...perRunVisited);
  const totalReachable=allVisitedAcrossRuns.size;
  const hiddenContent=totalReachable-avgVisited;
  const replayCoverage=(hiddenContent/totalReachable*100).toFixed(0);
  const singleRunCoverage=(avgVisited/totalReachable*100).toFixed(0);

  console.log(`  Toplam node:              ${totalNodes}`);
  console.log(`  Tek oynanışta görülen:    ort ${avgVisited.toFixed(0)}  (min:${minVisited}  max:${maxVisited})`);
  console.log(`  Tüm oynanışlarda toplam:  ${totalReachable}`);
  console.log(`  Tek geçişte kapsam:       %${singleRunCoverage}`);
  console.log(`  Tekrar oynanışta keşif:   %${replayCoverage} (birden fazla oynanış gerektirir)`);

  // Episode bazında dağılım
  console.log('\n  Episode bazında tek geçiş kapsam tahmini:');
  const epGroups=groupByEpisode(nodes);
  for (const [ep,list] of Object.entries(epGroups).sort()) {
    if (!ep.startsWith('ep')) continue;
    const epVisited=[...allVisitedAcrossRuns].filter(id=>id.startsWith(ep)).length;
    const epNodes=list.length;
    if (epNodes<3) continue;
    const coverage=(Math.min(avgVisited,epVisited)/epNodes*100);
    const bar='█'.repeat(Math.min(Math.floor(coverage/5),20));
    console.log(`    ${ep.replace('ep','EP').padEnd(6)} ${String(epNodes).padStart(3)} node  ~%${coverage.toFixed(0).padStart(3)}  ${bar}`);
  }

  return {avgVisited, singleRunCoverage:+singleRunCoverage, replayCoverage:+replayCoverage};
}

// ═════════════════════════════════════════════════════════════════════════════
// ANALİZ 4: OYUNCU MEMNUNİYETİ SKORU
// ═════════════════════════════════════════════════════════════════════════════
function calculateSatisfactionScore(choiceResults, branchData, replayData) {
  console.log('\n'+'═'.repeat(60));
  console.log('4. OYUNCU MEMNUNİYETİ TAHMİN SKORU');
  console.log('═'.repeat(60));

  const totalChoices=choiceResults.length;
  const deepChoices=choiceResults.filter(r=>r.depth>=5).length;
  const mediumChoices=choiceResults.filter(r=>r.depth>=3&&r.depth<5).length;
  const shallowChoices=choiceResults.filter(r=>r.depth<3).length;
  const avgDepth=choiceResults.reduce((s,r)=>s+r.depth,0)/(totalChoices||1);

  // Skorlar (0-10)
  const scores={};

  // 1. Seçim Anlamlılığı: derin seçimler yüksek puan
  scores.choiceMeaningfulness = Math.min(10,
    (deepChoices*3 + mediumChoices*1.5 + shallowChoices*0) / (totalChoices||1) * 10
  );

  // 2. Dal Derinliği: ortalama depth
  scores.branchDepth = Math.min(10, avgDepth * 1.5);

  // 3. İçerik Çeşitliliği: replayability
  scores.contentVariety = (replayData.replayCoverage / 100) * 10;

  // 4. Tek Geçiş Tatmini: tek oynanışta ne kadar görülür
  scores.singleRunSatisfaction = (replayData.singleRunCoverage / 100) * 10;

  // 5. Dal Dengesi: dalların yaklaşık eşit olup olmadığı
  const balancedChoices=choiceResults.filter(r=>
    r.uniqueA>0&&r.uniqueB>0&&
    Math.abs(r.uniqueA-r.uniqueB)<=3
  ).length;
  scores.branchBalance = totalChoices>0 ? (balancedChoices/totalChoices)*10 : 5;

  const overallScore=Object.values(scores).reduce((a,b)=>a+b,0)/Object.keys(scores).length;

  console.log('\n  DETAYLI PUANLAR (10 üzerinden):');
  const labels={
    choiceMeaningfulness: 'Seçim anlamlılığı  ',
    branchDepth:          'Dal derinliği       ',
    contentVariety:       'İçerik çeşitliliği ',
    singleRunSatisfaction:'Tek geçiş tatmini  ',
    branchBalance:        'Dal dengesi         ',
  };
  for (const [k,v] of Object.entries(scores)) {
    const stars='★'.repeat(Math.round(v))+'☆'.repeat(10-Math.round(v));
    console.log(`  ${labels[k]} ${v.toFixed(1).padStart(4)}/10  ${stars}`);
  }

  console.log(`\n  GENEL SKOR: ${overallScore.toFixed(1)}/10`);

  // Değerlendirme
  const level = overallScore>=8?'Mükemmel':overallScore>=6?'İyi':overallScore>=4?'Orta':'Zayıf';
  console.log(`  DEĞERLENDİRME: ${level}`);

  // Öneriler
  console.log('\n  ÖNERİLER:');
  if (scores.choiceMeaningfulness<6)
    console.log('  ⚠  Seçimlerin büyük kısmı çok sığ (1-2 node). Daha uzun dallar ekle.');
  else
    console.log('  ✓  Seçim anlamlılığı iyi seviyede.');

  if (scores.branchDepth<5)
    console.log('  ⚠  Dal derinliği düşük. Ortalama 5+ node hedefle.');
  else
    console.log('  ✓  Dal derinliği tatmin edici.');

  if (scores.contentVariety>4)
    console.log('  ✓  Tekrar oynanışta keşfedilecek içerik var.');
  else
    console.log('  ⚠  Çoğu içerik tek oynanışta görülüyor. Replay value düşük.');

  if (scores.branchBalance<5)
    console.log('  ⚠  Dallar dengesiz: bir seçenek diğerinden çok daha uzun.');
  else
    console.log('  ✓  Dallar makul ölçüde dengeli.');

  return {scores, overallScore};
}

// ═════════════════════════════════════════════════════════════════════════════
// MAIN
// ═════════════════════════════════════════════════════════════════════════════
const args=process.argv.slice(2);
const epIdx=args.indexOf('--episode');
const filterEp=epIdx>=0?args[epIdx+1]:null;
const fullMode=args.includes('--full');

console.log('KATMAN Dallanma & Seçim Etki Analizi\n'+'─'.repeat(60));
if (filterEp) console.log(`Filtre: ${filterEp}\n`);

const {nodes,puzzles,startId}=loadData();
console.log(`✓ ${Object.keys(nodes).length} node yüklendi`);

const choiceResults  = analyzeChoices(nodes, puzzles, filterEp);
const branchData     = analyzeBranchRatios(nodes);
const replayData     = analyzeReplayability(nodes, puzzles, startId, fullMode?500:150);
const satisfaction   = calculateSatisfactionScore(choiceResults, branchData, replayData);

console.log('\n'+'═'.repeat(60));
console.log('TAMAMLANDI');
console.log('═'.repeat(60));