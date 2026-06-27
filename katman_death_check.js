// katman_death_check.js
// Ölüm Sistemi Tam Denetimi
// node katman_death_check.js

import fs   from 'fs';
import path from 'path';

const BASE = path.resolve(process.cwd(), 'src', 'data', 'episodes');
const ENDING_FILES = {
  episode_18: path.join(BASE,'episode-18.json'),
  episode_19: path.join(BASE,'episode-19.json'),
  episode_20: path.join(BASE,'episode-20.json'),
};

function loadData() {
  const raw=JSON.parse(fs.readFileSync(path.join(BASE,'merged_story.json'),'utf-8'));
  const nodes={}, puzzles={...(raw.puzzles||{})};
  for (const [id,val] of Object.entries(raw.nodes||{}))
    if (val&&typeof val==='object'&&!Array.isArray(val)) nodes[id]=val;
  for (const [,file] of Object.entries(ENDING_FILES)) {
    if (!fs.existsSync(file)) continue;
    const ep=JSON.parse(fs.readFileSync(file,'utf-8'));
    for (const [id,val] of Object.entries(ep.nodes||{}))
      if (val&&typeof val==='object'&&!Array.isArray(val)) nodes[id]=val;
    Object.assign(puzzles, ep.puzzles||{});
  }
  return {nodes, puzzles};
}

// ═══════════════════════════════════════════════════════════════
// 1. ÖLÜM NODELARİNİ BUL VE SINIFLANDIR
// ═══════════════════════════════════════════════════════════════
function findDeathNodes(nodes) {
  console.log('\n'+'═'.repeat(60));
  console.log('1. ÖLÜM NODELARİ');
  console.log('═'.repeat(60));

  const deaths=[];
  for (const [nid,node] of Object.entries(nodes)) {
    const hasLoopReset = node.events?.some(e=>e.type==='loopReset');
    const isDeathNode  = nid.endsWith('_death_node') || nid.includes('_hard_fail');
    if (!hasLoopReset && !isDeathNode) continue;

    const type = nid.endsWith('_death_node') ? 'ÖLÜM TUZAĞI'
               : nid.includes('_hard_fail')  ? 'PUZZLE FAIL'
               : 'LOOP RESET';

    deaths.push({id:nid, node, type});
  }

  console.log(`\nToplam ölüm node: ${deaths.length}\n`);
  for (const d of deaths) {
    console.log(`  [${d.type}] ${d.id}`);
  }
  return deaths;
}

// ═══════════════════════════════════════════════════════════════
// 2. ÖLÜM AKIŞINI DOĞRULA
// ═══════════════════════════════════════════════════════════════
function validateDeathFlow(deaths, nodes) {
  console.log('\n'+'═'.repeat(60));
  console.log('2. ÖLÜM AKIŞ DOĞRULAMASI');
  console.log('   Tetikleyici → Ölüm → Checkpoint → Devam');
  console.log('═'.repeat(60));

  const nodeIds=new Set(Object.keys(nodes));
  const results=[];

  for (const {id,node,type} of deaths) {
    const issues=[];
    const checks={};

    // 1. loopReset var mı?
    checks.hasLoopReset = node.events?.some(e=>e.type==='loopReset') || false;
    if (!checks.hasLoopReset) issues.push('loopReset event eksik');

    // 2. Ölüm mesajı var mı? (JONES AYDIN HAYATINI KAYBETTİ)
    const hasDeathMsg = node.events?.some(e=>
      e.type==='systemAlert' &&
      (e.text?.includes('HAYAT')|| e.text?.includes('KAY'))
    ) || node.events?.some(e=>
      e.type==='corruptMessage'||e.type==='glitch'
    );
    checks.hasDeathMessage = hasDeathMsg;
    if (!hasDeathMsg) issues.push('Ölüm mesajı/efekti yok');

    // 3. Choices var mı?
    const choices=node.choices||[];
    checks.hasChoices = choices.length>0;
    if (!checks.hasChoices) issues.push('Seçim yok — oyuncu takılır!');

    // 4. Checkpoint seçeneği var mı?
    const cpChoice=choices.find(c=>c.restoreCheckpoint||c.text?.includes('kayıt')||c.text?.includes('devam'));
    checks.hasCheckpointChoice = !!cpChoice;
    if (!checks.hasCheckpointChoice) issues.push('Checkpoint\'e dönüş seçeneği yok');

    // 5. Checkpoint node'u var mı?
    let checkpointTarget=null;
    if (cpChoice) {
      checkpointTarget=cpChoice.restoreCheckpoint||cpChoice.nextNodeId;
      checks.checkpointExists = !!checkpointTarget && nodeIds.has(checkpointTarget);
      if (!checks.checkpointExists)
        issues.push(`Checkpoint "${checkpointTarget}" bulunamadı`);
    }

    // 6. "Baştan başla" seçeneği var mı?
    const restartChoice=choices.find(c=>
      c.nextNodeId==='ep01_n01'||c.text?.includes('baştan')||c.text?.includes('başla')
    );
    checks.hasRestartChoice = !!restartChoice;

    // 7. Kim tetikliyor? (bu node'a kim yönlendiriyor)
    const triggers=[];
    for (const [tid,tn] of Object.entries(nodes)) {
      const pointsHere=(tn.choices||[]).some(c=>c.nextNodeId===id)||tn.nextNodeId===id;
      const puzzlePointsHere=Object.values(nodes).some(n=>
        n.events?.some(e=>e.type==='puzzle'&&
          (e.failureNodeId===id||e.successNodeId===id))
      );
      if (pointsHere) triggers.push(tid);
    }
    // Puzzle trigger
    for (const [pid,p] of Object.entries(nodes).flatMap(([,n])=>
      (n.events||[]).filter(e=>e.type==='puzzle').map(e=>[e.puzzleId,e])
    )) {
      // skip complex
    }

    const status=issues.length===0?'✓ ÇALIŞIYOR':'✗ SORUNLU';
    results.push({id,type,checks,issues,checkpointTarget,triggers,status});

    console.log(`\n  ${status}  [${type}] ${id}`);
    if (checkpointTarget) console.log(`    Checkpoint: ${checkpointTarget}`);
    if (triggers.length>0) console.log(`    Tetikleyen: ${triggers.slice(0,3).join(', ')}`);

    // Check sonuçları
    const checkLabels={
      hasLoopReset:        'loopReset event',
      hasDeathMessage:     'Ölüm efekti/mesajı',
      hasChoices:          'Seçim mevcut',
      hasCheckpointChoice: 'Checkpoint seçeneği',
      checkpointExists:    'Checkpoint node geçerli',
      hasRestartChoice:    'Baştan başla seçeneği',
    };
    for (const [k,v] of Object.entries(checks)) {
      const icon=v===true?'  ✓':v===false?'  ✗':'  ─';
      console.log(`  ${icon} ${checkLabels[k]||k}`);
    }
    if (issues.length>0) {
      issues.forEach(i=>console.log(`    ⚠  ${i}`));
    }
  }

  const ok=results.filter(r=>r.issues.length===0).length;
  const fail=results.filter(r=>r.issues.length>0).length;
  console.log(`\n─── Özet: ${ok} düzgün çalışıyor, ${fail} sorunlu ───`);
  return results;
}

// ═══════════════════════════════════════════════════════════════
// 3. CHECKPOINT SİSTEMİ DOĞRULAMA
// ═══════════════════════════════════════════════════════════════
function validateCheckpoints(nodes) {
  console.log('\n'+'═'.repeat(60));
  console.log('3. CHECKPOINT SİSTEMİ');
  console.log('═'.repeat(60));

  const checkpoints=[];
  for (const [nid,node] of Object.entries(nodes)) {
    const cpEv=node.events?.find(e=>e.type==='checkpoint');
    if (!cpEv) continue;
    checkpoints.push({id:nid, node, ep:nid.split('_')[0]});
  }

  console.log(`\nToplam checkpoint: ${checkpoints.length}`);
  console.log('\nEpisode bazında checkpoint\'ler:');

  const byEp={};
  for (const cp of checkpoints) {
    if (!byEp[cp.ep]) byEp[cp.ep]=[];
    byEp[cp.ep].push(cp.id);
  }
  for (const [ep,cps] of Object.entries(byEp).sort()) {
    console.log(`  ${ep.replace('ep','EP').padEnd(6)} ${cps.join(', ')}`);
  }

  // Checkpoint'ler arası mesafe (node sayısı)
  console.log('\nCheckpoint arası ortalama mesafe:');
  const epList=Object.keys(byEp).sort();
  for (const ep of epList) {
    const epNodes=Object.keys(nodes).filter(id=>id.startsWith(ep));
    const epCps=byEp[ep]||[];
    const nodesPerCp=epCps.length>0?Math.round(epNodes.length/epCps.length):epNodes.length;
    const bar='█'.repeat(Math.min(nodesPerCp,20));
    console.log(`  ${ep.replace('ep','EP').padEnd(6)} ${String(epNodes.length).padStart(3)} node / ${epCps.length} CP = ~${nodesPerCp} node/CP  ${bar}`);
  }

  // Checkpoint'siz uzun bölüm uyarısı
  const nodeIds=new Set(Object.keys(nodes));
  const noCheckpointEps=epList.filter(ep=>!byEp[ep]||byEp[ep].length===0);
  if (noCheckpointEps.length>0) {
    console.log(`\n⚠  Checkpoint yok: ${noCheckpointEps.join(', ')}`);
    console.log('   Bu bölümlerde ölünce bölüm başına dönülür!');
  } else {
    console.log('\n✓ Tüm episode\'larda checkpoint var');
  }

  return {checkpoints, byEp};
}

// ═══════════════════════════════════════════════════════════════
// 4. ÖLÜM TETİKLEYİCİLERİ — OYUNCU NE YAPARSA ÖLÜR?
// ═══════════════════════════════════════════════════════════════
function findDeathTriggers(nodes, puzzles) {
  console.log('\n'+'═'.repeat(60));
  console.log('4. ÖLÜM TETİKLEYİCİLERİ — Oyuncu ne yaparsa ölür?');
  console.log('═'.repeat(60));

  const triggers=[];

  // A) Doğrudan death_node'a giden seçimler
  for (const [nid,node] of Object.entries(nodes)) {
    for (const c of (node.choices||[])) {
      const target=c.nextNodeId;
      if (!target) continue;
      const targetNode=nodes[target];
      const isDeathTarget = target.endsWith('_death_node') ||
        targetNode?.events?.some(e=>e.type==='loopReset');
      if (!isDeathTarget) continue;

      // Uyarı sayısını bul (bu seçimden önce kaç uyarı verildi?)
      triggers.push({
        type:      'SEÇİM',
        from:      nid,
        choice:    (c.text||c.id||'?').slice(0,60),
        leadsTo:   target,
        episode:   nid.split('_')[0],
      });
    }
  }

  // B) Puzzle fail → death
  for (const [nid,node] of Object.entries(nodes)) {
    const puzzEv=node.events?.find(e=>e.type==='puzzle');
    if (!puzzEv) continue;
    const p=puzzles[puzzEv.puzzleId];
    if (!p) continue;
    const failNode=nodes[p.failureNodeId];
    const isDeathFail = p.failureNodeId?.includes('hard_fail') ||
      failNode?.events?.some(e=>e.type==='loopReset');
    if (!isDeathFail) continue;
    triggers.push({
      type:    'PUZZLE FAIL',
      from:    nid,
      choice:  `Puzzle başarısız: ${puzzEv.puzzleId}`,
      leadsTo: p.failureNodeId,
      episode: nid.split('_')[0],
    });
  }

  // Episode bazında grupla
  const byEp={};
  for (const t of triggers) {
    if (!byEp[t.episode]) byEp[t.episode]=[];
    byEp[t.episode].push(t);
  }

  console.log(`\nToplam ölüm tetikleyicisi: ${triggers.length}\n`);

  for (const [ep,epTriggers] of Object.entries(byEp).sort()) {
    console.log(`  ─── ${ep.replace('ep','EP')} ───`);
    for (const t of epTriggers) {
      const icon=t.type==='SEÇİM'?'🎯':'🧩';
      console.log(`  ${icon} [${t.type}] "${t.choice}"`);
      console.log(`      → ${t.leadsTo}`);
    }
    console.log('');
  }

  // 3 uyarı sistemi kontrolü
  console.log('─── 3 UYARI SİSTEMİ KONTROLÜ ───');
  console.log('Ölüm tuzağı olan seçimlerde önce kaç uyarı veriliyor?\n');

  for (const t of triggers.filter(t=>t.type==='SEÇİM')) {
    const fromNode=nodes[t.from];
    if (!fromNode) continue;
    // Bu node'dan önce gelen node'larda uyarı var mı? (basit geriye bakış)
    // Uyarı = systemAlert veya spesifik mesaj içeren event
    const nodeEvents=fromNode.events||[];
    const hasPriorWarning=nodeEvents.some(e=>
      e.type==='systemAlert'||
      (e.type==='message'&&(e.text?.includes('uyar')||e.text?.includes('tehlik')))
    );
    const icon=hasPriorWarning?'✓':'⚠ ';
    console.log(`  ${icon} ${t.episode.toUpperCase()}: "${t.choice.slice(0,50)}"`);
    if (!hasPriorWarning)
      console.log('      Uyarı bulunamadı — oyuncu sürpriz ölümle karşılaşabilir');
  }

  return triggers;
}

// ═══════════════════════════════════════════════════════════════
// 5. ÖLÜM SİMÜLASYONU — Kaç ölüm normal, ölüm döngüsü var mı?
// ═══════════════════════════════════════════════════════════════
function simulateDeaths(nodes, puzzles) {
  console.log('\n'+'═'.repeat(60));
  console.log('5. ÖLÜM SİMÜLASYONU (1000 oynanış)');
  console.log('   Ölüm dağılımı ve döngü tespiti');
  console.log('═'.repeat(60));

  const deathCounts={};
  const cpRestoreCounts={};
  let totalDeaths=0, loopDeaths=0;
  const RUNS=1000;
  const PUZZLE_SUCCESS=0.75;

  const ENDING_NAMES={episode_18:1,episode_19:1,episode_20:1};
  const nodeToEp=id=>id.startsWith('ep18')?'episode_18':id.startsWith('ep19')?'episode_19':id.startsWith('ep20')?'episode_20':null;
  const resolveNext=c=>{const ep=c.nextEpisodeId,nid=c.nextNodeId;if(ep&&ENDING_NAMES[ep])return{ending:ep};if(nid){const e=nodeToEp(nid);return e?{ending:e}:{nextNode:nid};}return{};};
  const resolveRoute=(routes,stats)=>{const s=[...routes].sort((a,b)=>(a.priority||99)-(b.priority||99));for(const r of s){if(r.default)return r;const ok=Object.entries(r.conditions||{}).every(([k,c])=>{const v=stats[k]||0;if(c.gte!==undefined&&v<c.gte)return false;if(c.lte!==undefined&&v>c.lte)return false;return true;});if(ok)return r;}return s[s.length-1];};

  for (let run=0;run<RUNS;run++) {
    let cur='ep01_n01', cp='ep01_n01';
    let steps=0, runDeaths=0;
    const vsf=new Set();
    const vc={};
    const stats={trust:0,humanity:0,fear:0,curiosity:0,emreBaglantisi:0,riskPattern:0,emreDeğişim:0,selinTrust:0,onlarFarkındalığı:0,mentalStability:0,timesNearDeath:0};
    let done=false;

    while (steps<2000&&!done) {
      steps++;
      vc[cur]=(vc[cur]||0)+1;
      if (vc[cur]>20){loopDeaths++;done=true;break;}
      const node=nodes[cur];
      if (!node){done=true;break;}
      if (!vsf.has(cur)){vsf.add(cur);for(const ev of(node.events||[])){if(ev.type!=='statChange')continue;for(const[k,v] of Object.entries(ev.changes||{}))if(typeof v==='number')stats[k]=(stats[k]||0)+v;}}
      if(node.events?.some(e=>e.type==='checkpoint'))cp=cur;
      const pEv=node.events?.find(e=>e.type==='puzzle');
      if(pEv){const p=puzzles[pEv.puzzleId];if(p){if(Math.random()<PUZZLE_SUCCESS){cur=p.successNodeId;}else{totalDeaths++;runDeaths++;deathCounts[cur]=(deathCounts[cur]||0)+1;cpRestoreCounts[cp]=(cpRestoreCounts[cp]||0)+1;stats.timesNearDeath=(stats.timesNearDeath||0)+1;cur=p.failureNodeId||cp;}continue;}}
      const rEv=node.events?.find(e=>e.type==='statBasedRouting');
      if(rEv){const r=resolveRoute(rEv.routes,stats);if(!r){done=true;break;}const res=resolveNext(r);if(res.ending){done=true;break;}if(res.nextNode){cur=res.nextNode;continue;}done=true;break;}
      const hR=node.events?.some(e=>e.type==='loopReset')||cur.endsWith('_death_node');
      if(hR){totalDeaths++;runDeaths++;deathCounts[cur]=(deathCounts[cur]||0)+1;cpRestoreCounts[cp]=(cpRestoreCounts[cp]||0)+1;stats.timesNearDeath=(stats.timesNearDeath||0)+1;const cpC=node.choices?.find(c=>c.restoreCheckpoint);cur=cpC?.nextNodeId||cp;continue;}
      const ch=node.choices||[];
      if(ch.length>0){const c=ch[Math.floor(Math.random()*ch.length)];for(const[k,v] of Object.entries(c.effects||{}))if(typeof v==='number')stats[k]=(stats[k]||0)+v;const res=resolveNext(c);if(res.ending){done=true;break;}if(res.nextNode){cur=res.nextNode;continue;}done=true;break;}
      if(node.nextNodeId){cur=node.nextNodeId;continue;}
      done=true;
    }
  }

  console.log(`\n${RUNS} oynanışta toplam ölüm: ${totalDeaths}`);
  console.log(`Oynanış başına ortalama: ${(totalDeaths/RUNS).toFixed(1)} ölüm`);
  if(loopDeaths>0)console.log(`⚠  Sonsuz döngü ölümü: ${loopDeaths}`);

  console.log('\nEn çok ölüm yaşanan yerler:');
  const sorted=Object.entries(deathCounts).sort((a,b)=>b[1]-a[1]);
  for(const[nid,cnt] of sorted.slice(0,10)){
    const pct=(cnt/RUNS*100).toFixed(1);
    const bar='█'.repeat(Math.min(Math.round(cnt/RUNS*30),30));
    console.log(`  ${String(cnt).padStart(4)} (%${pct.padStart(5)})  ${nid.padEnd(35)}  ${bar}`);
  }

  console.log('\nEn çok kullanılan checkpoint\'ler (ölüm sonrası dönüş):');
  const cpSorted=Object.entries(cpRestoreCounts).sort((a,b)=>b[1]-a[1]);
  for(const[cpId,cnt] of cpSorted.slice(0,8)){
    const pct=(cnt/totalDeaths*100).toFixed(0);
    console.log(`  ${String(cnt).padStart(4)} (%${pct}%)  ${cpId}`);
  }

  // Sağlıklı mı?
  const avgDeaths=totalDeaths/RUNS;
  console.log('\n─── DEĞERLENDİRME ───');
  if(avgDeaths<5)  console.log('✓ Ölüm sayısı düşük — oyun çok kolay veya puzzle başarı oranı yüksek');
  else if(avgDeaths<=20) console.log('✓ Ölüm sayısı makul (5-20 arası ideal)');
  else console.log('⚠  Ölüm sayısı çok yüksek — oyun çok zor olabilir');

  if(loopDeaths===0) console.log('✓ Sonsuz ölüm döngüsü yok');
  else console.log(`✗ ${loopDeaths} oynanışta sonsuz döngü — kontrol et`);

  return {totalDeaths, avgDeaths:totalDeaths/RUNS, deathCounts, loopDeaths};
}

// ─── MAIN ──────────────────────────────────────────────────────
console.log('KATMAN Ölüm Sistemi Denetimi\n'+'─'.repeat(60));
const {nodes,puzzles}=loadData();
console.log(`✓ ${Object.keys(nodes).length} node yüklendi`);

const deathNodes  = findDeathNodes(nodes);
const flowResults = validateDeathFlow(deathNodes, nodes);
const cpResults   = validateCheckpoints(nodes);
const triggers    = findDeathTriggers(nodes, puzzles);
const simResults  = simulateDeaths(nodes, puzzles);

// Özet
console.log('\n'+'═'.repeat(60));
console.log('ÖZET');
console.log('═'.repeat(60));
const ok=flowResults.filter(r=>r.issues.length===0).length;
const fail=flowResults.filter(r=>r.issues.length>0).length;
console.log(`  Ölüm node'ları:          ${deathNodes.length}`);
console.log(`  Düzgün çalışan:          ${ok}`);
console.log(`  Sorunlu:                 ${fail}`);
console.log(`  Checkpoint sayısı:       ${cpResults.checkpoints.length}`);
console.log(`  Ölüm tetikleyici:        ${triggers.length}`);
console.log(`  Ort. ölüm/oynanış:       ${simResults.avgDeaths.toFixed(1)}`);
console.log(`  Sonsuz döngü:            ${simResults.loopDeaths}`);

if(fail===0&&simResults.loopDeaths===0)
  console.log('\n  ✓ Ölüm sistemi sağlıklı çalışıyor.');
else
  console.log('\n  ⚠  Bazı sorunlar var — yukarıdaki raporu incele.');

console.log('\n'+'═'.repeat(60)+'\nTAMAMLANDI\n'+'═'.repeat(60));