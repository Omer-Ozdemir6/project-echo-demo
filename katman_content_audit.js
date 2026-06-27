// katman_content_audit.js
// İçerik kalite denetimi — 4 alan
// node katman_content_audit.js [--episode EP01]

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
  for(const[id,val]of Object.entries(raw.nodes||{}))
    if(val&&typeof val==='object'&&!Array.isArray(val))nodes[id]=val;
  for(const[,file]of Object.entries(ENDING_FILES)){
    if(!fs.existsSync(file))continue;
    const ep=JSON.parse(fs.readFileSync(file,'utf-8'));
    for(const[id,val]of Object.entries(ep.nodes||{}))
      if(val&&typeof val==='object'&&!Array.isArray(val))nodes[id]=val;
    Object.assign(puzzles,ep.puzzles||{});
  }
  return{nodes,puzzles,startId:raw.startNodeId||'ep01_n01'};
}

function groupByEp(nodes){
  const eps={};
  for(const id of Object.keys(nodes)){
    const ep=id.split('_')[0];
    if(!eps[ep])eps[ep]=[];
    eps[ep].push(id);
  }
  return eps;
}

// ═══════════════════════════════════════════════════════════
// 1. SEÇİM SIKLIĞI — 4-5 mesajdan fazla konuşan nodelar
// ═══════════════════════════════════════════════════════════
function auditChoiceDensity(nodes, filterEp) {
  console.log('\n'+'═'.repeat(64));
  console.log('1. SEÇİM SIKLIĞI — Jones çok mu uzun konuşuyor?');
  console.log('   4+ mesajdan sonra seçim gelmeyen node\'lar');
  console.log('═'.repeat(64));

  const eps = groupByEp(nodes);
  const problems = [];

  for(const[ep,nodeList]of Object.entries(eps).sort()){
    if(!ep.startsWith('ep'))continue;
    if(filterEp&&ep!==filterEp.toLowerCase())continue;

    for(const nid of nodeList){
      const node=nodes[nid];
      if(!node)continue;
      const evs=node.events||[];
      const msgCount=evs.filter(e=>e.type==='message'&&e.speaker!=='SİSTEM').length;
      const hasChoice=(node.choices||[]).length>0;
      const hasPuzzle=evs.some(e=>e.type==='puzzle');
      const isTerminal=!hasChoice&&!hasPuzzle&&!node.nextNodeId&&
        !nid.includes('hard_fail')&&!nid.includes('death_node');

      if(msgCount>=4){
        problems.push({ep,nid,msgCount,hasChoice,hasPuzzle,isTerminal});
      }
    }
  }

  // Episode bazında özet
  const byEp={};
  for(const p of problems){
    if(!byEp[p.ep])byEp[p.ep]={total:0,withChoice:0,withoutChoice:0,worst:0,worstNode:''};
    byEp[p.ep].total++;
    if(p.hasChoice||p.hasPuzzle)byEp[p.ep].withChoice++;
    else byEp[p.ep].withoutChoice++;
    if(p.msgCount>byEp[p.ep].worst){byEp[p.ep].worst=p.msgCount;byEp[p.ep].worstNode=p.nid;}
  }

  console.log('\n  EP      Uzun node  Seçimsiz  En kötü');
  console.log('  ──────────────────────────────────────────────');
  for(const[ep,d]of Object.entries(byEp).sort()){
    const bar='█'.repeat(d.withoutChoice);
    console.log(`  ${ep.padEnd(8)} ${String(d.total).padStart(4)} node  ${String(d.withoutChoice).padStart(4)} sorunlu  ${d.worst} msg (${d.worstNode})`);
  }

  // Detaylı sorunlar
  const topProblems=problems
    .filter(p=>!p.hasChoice&&!p.hasPuzzle)
    .sort((a,b)=>b.msgCount-a.msgCount)
    .slice(0,20);

  if(topProblems.length>0){
    console.log('\n  EN UZUN SEÇİMSİZ NODE\'LAR (düzeltilmeli):');
    for(const p of topProblems){
      console.log(`  ✗ [${p.ep.toUpperCase()}] ${p.nid.padEnd(40)} ${p.msgCount} mesaj`);
    }
  }

  return{problems,byEp};
}

// ═══════════════════════════════════════════════════════════
// 2. ZİNCİR NOT SİSTEMİ — Tamamlanabilir setler
// ═══════════════════════════════════════════════════════════
function auditNoteChains(nodes) {
  console.log('\n'+'═'.repeat(64));
  console.log('2. ZİNCİR NOT SİSTEMİ — Outlast tarzı veri bankası');
  console.log('   İlgili notlar birleşince Jones yorumu açılsın');
  console.log('═'.repeat(64));

  const allNotes=[];
  for(const[nid,node]of Object.entries(nodes)){
    const ep=nid.split('_')[0];
    for(const ev of(node.events||[])){
      if(!['file','log'].includes(ev.type)&&ev.fileType!=='log')continue;
      allNotes.push({nodeId:nid,ep,
        fileId:ev.fileId||ev.id||'?',
        title:ev.title||'',
        tags:ev.tags||[],
        correlationTags:ev.correlationTags||[],
        content:(ev.content||'').slice(0,80),
      });
    }
  }

  // Mevcut etiket zincirleri
  const tagMap={};
  for(const n of allNotes)
    for(const t of n.tags){
      if(!tagMap[t])tagMap[t]=[];
      tagMap[t].push(n);
    }

  const chains=Object.entries(tagMap)
    .filter(([,ns])=>ns.length>=2)
    .sort((a,b)=>b[1].length-a[1].length);

  console.log('\n  MEVCUT ZİNCİRLER (etiket bazlı):');
  for(const[tag,notes]of chains){
    const eps=[...new Set(notes.map(n=>n.ep))].join(' → ');
    console.log(`\n  #${tag} (${notes.length} not — ${eps})`);
    for(const n of notes)
      console.log(`    [${n.ep}] ${n.fileId}: "${n.title}"`);
  }

  // Önerilen yeni zincirler + Jones yorumu
  const proposedChains=[
    {
      id:'CHAIN_DONGU',
      title:'DÖNGÜ ZİNCİRİ',
      description:'Jones\'un döngüyü fark etme süreci',
      requiredTags:['dongu','jones_el_yazisi'],
      requiredEps:['ep08','ep12','ep13'],
      missingIn:['ep05','ep09','ep10'],
      jonesCommentary:`Hepsi benim el yazım. Farklı zamanlarda, farklı Jones'lar. 
Ama hepsi aynı şeyi söylüyor: "Gitme. Gidersen unutursun."
Biri bunu öğrendi. Ben de öğrendim. Sonraki de öğrenecek.
Bu bir uyarı değil artık. Bu bir kronoloji.`,
      priority:'YÜKSEK'
    },
    {
      id:'CHAIN_GUNES',
      title:'GÜNEŞ YILDIZ ZİNCİRİ',
      description:'1987\'den beri burada — hafıza sıfırlama durdu',
      requiredTags:['gunes','gunes_yildiz','1987'],
      requiredEps:['ep03','ep11','ep13'],
      missingIn:['ep07','ep10'],
      jonesCommentary:`Güneş Yıldız. 1987. 39 yıl.
Ben her seferinde döngüden çıkmaya çalışıyorum.
O ise çıkmayı bıraktı. Ve hafızası dondu.
Belki kurtuluş bu değil. Belki kurtuluş kalmak.
Ama Emre hâlâ içeride.`,
      priority:'YÜKSEK'
    },
    {
      id:'CHAIN_EMRE_DEGISIM',
      title:'EMRE DÖNÜŞÜM ZİNCİRİ',
      description:'Emre\'nin kim olduğunu kaybetmesi — belge zinciri',
      requiredTags:['emre','degisim','emre_notu'],
      requiredEps:['ep01','ep05','ep08','ep14'],
      missingIn:['ep09','ep11'],
      jonesCommentary:`Emre'nin ses kayıtları: Birincisi endişeli ama net.
İkincisi: cümleler yarıda kalıyor.
Üçüncüsü: beni "sen" diye kastediyor ama kim olduğumu sormuyor.
Dördüncüsü: sadece ben miyim diye soruyor. Ben mi sordum?
Beşincisi yok. Ya da ben duyamadım.`,
      priority:'ORTA'
    },
    {
      id:'CHAIN_432HZ',
      title:'432 HZ ZİNCİRİ',
      description:'Frekansın kaynağı ve ONLAR ile bağlantısı',
      requiredTags:['frekans','432','onlar'],
      requiredEps:['ep06','ep07','ep10'],
      missingIn:['ep03','ep09','ep14'],
      jonesCommentary:`432 Hz. Frekans analizi tamamlandı.
Bu frekans doğal değil. Yapay kaynak. Derinlerde bir jeneratör.
ONLAR bu frekansı üretmiyor. Bu frekans ONLAR'ı çekiyor.
Ya da ONLAR bu frekansı besliyor.
Her ikisi de mümkün. Her ikisi de kötü.`,
      priority:'ORTA'
    },
  ];

  console.log('\n\n  ÖNERİLEN YENİ ZİNCİRLER (Jones yorumu ile):');
  for(const chain of proposedChains){
    const icon=chain.priority==='YÜKSEK'?'🔴':'🟡';
    console.log(`\n  ${icon} [${chain.id}] — ${chain.title}`);
    console.log(`     Açıklama: ${chain.description}`);
    console.log(`     Gerekli EP'ler: ${chain.requiredEps.join(' → ')}`);
    console.log(`     Eksik not: ${chain.missingIn.join(', ')}`);
    console.log(`     Jones yorumu (önizleme): "${chain.jonesCommentary.split('\n')[0]}..."`);
  }

  return{allNotes,chains,proposedChains};
}

// ═══════════════════════════════════════════════════════════
// 3. HAVADA KALAN KONULAR — Cevapsız sorular
// ═══════════════════════════════════════════════════════════
function auditOpenThreads(nodes) {
  console.log('\n'+'═'.repeat(64));
  console.log('3. HAVADA KALAN KONULAR — Cevapsız sorular ve boşluklar');
  console.log('═'.repeat(64));

  const threads=[
    // Kasıtlı cevapsız kalmalı (oyuncu çözsün)
    {
      topic:"ONLAR'ın gerçek doğası nedir?",
      status:'KASITLI_AÇIK',
      episodes:['ep05','ep10','ep14'],
      note:"Negatif boşluk, 432 Hz — tam tanım verilmemeli. Oyuncu yorumlasın.",
      action:'Bırak'
    },
    {
      topic:"Güneş Yıldız neden çıkmak istemedi?",
      status:'KASITLI_AÇIK',
      episodes:['ep11','ep13'],
      note:"İpuçları var ama tam cevap verilmemeli. EP13'teki 'hâlâ' kelimesi yeterli.",
      action:'Bırak'
    },
    {
      topic:"Önceki Jones'ların akıbeti?",
      status:'KASITLI_AÇIK',
      episodes:['ep12','ep13'],
      note:"Not zinciri ipuç verir ama son cevap yok. Oyuncu tamamlar.",
      action:'Bırak'
    },

    // Düzeltilmeli
    {
      topic:"Selin'in gerçek motivasyonu EP08'den sonra kayboldu",
      status:'EKSIK',
      episodes:['ep08','ep09','ep15'],
      note:"EP08'de Selin bağlantısı kesildi, EP15'te kısa veda. Arada EP09-14 boşluk var.",
      action:'EP10 veya EP11\'e Selin notu ekle'
    },
    {
      topic:"'Biz seni bekliyorduk' — Kim bu 'biz'?",
      status:'EKSIK',
      episodes:['ep12','ep13'],
      note:"Not EP12'de ortaya çıktı ama EP13'te Güneş açıklamıyor. Jones sormadı.",
      action:'EP13\'te Jones\'a bu soruyu sordur, Güneş belirsiz cevap versin'
    },
    {
      topic:"EP09 — Emre ile buluşma sahnesinin ağırlığı eksik",
      status:'ZAYIF',
      episodes:['ep09'],
      note:"Emre ile ilk gerçek karşılaşma ama Jones çok pasif. Emre'nin değişimini daha çok göster.",
      action:'EP09\'da Jones\'un gözlem detaylarını artır'
    },
    {
      topic:"'Kahve söz veriyorum' EP04\'te geçti, EP16\'da bitti. EP19\'da ne oldu?",
      status:'EKSIK',
      episodes:['ep04','ep16','ep19'],
      note:"EP19 (Son B) Birlikte sonunda kahve kapanışı yok. Throughline tamamlanmamış.",
      action:"EP19'a kahve sahnesi ekle"
    },
    {
      topic:"Pirinç anahtar 4B — kullanılmadı",
      status:'EKSIK',
      episodes:['ep11'],
      note:"EP11'de 4B anahtarı bulundu. Bu anahtar sonrasında bir kapı açmadı.",
      action:'EP12\'de anahtar kullanımını göster veya EP11\'den çıkar'
    },
  ];

  console.log('\n  KASITLI AÇIK BIRAKILAN KONULAR (oyuncu çözsün):');
  for(const t of threads.filter(t=>t.status==='KASITLI_AÇIK'))
    console.log(`  ✓ "${t.topic}"\n    Neden: ${t.note}\n`);

  console.log('\n  DÜZELTİLMESİ GEREKEN KONULAR:');
  for(const t of threads.filter(t=>t.status!=='KASITLI_AÇIK')){
    const icon=t.status==='EKSIK'?'✗':'⚠ ';
    console.log(`  ${icon} "${t.topic}"`);
    console.log(`     EP: ${t.episodes.join(', ')}`);
    console.log(`     Sorun: ${t.note}`);
    console.log(`     Çözüm: ${t.action}\n`);
  }

  return threads.filter(t=>t.status!=='KASITLI_AÇIK');
}

// ═══════════════════════════════════════════════════════════
// 4. ÖLÜM KALİTESİ — Her ölüm anlamlı mı?
// ═══════════════════════════════════════════════════════════
function auditDeathQuality(nodes, puzzles) {
  console.log('\n'+'═'.repeat(64));
  console.log('4. ÖLÜM KALİTESİ — Her ölüm anlamlı ve adil mi?');
  console.log('═'.repeat(64));

  const deathNodes=Object.entries(nodes).filter(([nid,node])=>
    nid.endsWith('_death_node')||nid.includes('_hard_fail')||
    (node.events||[]).some(e=>e.type==='loopReset')
  );

  console.log(`\nToplam ölüm node: ${deathNodes.length}`);
  const issues=[];

  for(const[nid,node]of deathNodes){
    const ep=nid.split('_')[0];
    const evs=node.events||[];

    // Ölüm kalitesi kontrolleri
    const hasGlitch=evs.some(e=>e.type==='glitch');
    const hasCorrupt=evs.some(e=>e.type==='corruptMessage');
    const hasAlert=evs.some(e=>e.type==='systemAlert');
    const hasLoopReset=evs.some(e=>e.type==='loopReset');
    const hasDeathMsg=evs.some(e=>
      (e.type==='systemAlert'&&(e.text||'').includes('HAYAT'))||
      e.type==='corruptMessage'
    );
    const choices=node.choices||[];
    const hasCpChoice=choices.some(c=>c.restoreCheckpoint||c.nextNodeId?.includes('cp'));
    const hasRestartChoice=choices.some(c=>c.nextNodeId==='ep01_n01');

    const nodeIssues=[];
    if(!hasGlitch&&!hasCorrupt) nodeIssues.push('Görsel efekt yok (glitch/corrupt)');
    if(!hasLoopReset)           nodeIssues.push('loopReset event yok');
    if(!hasCpChoice)            nodeIssues.push('Checkpoint seçeneği yok');
    if(choices.length===0)      nodeIssues.push('HİÇ seçim yok — oyuncu takılır!');

    if(nodeIssues.length>0) issues.push({nid,ep,issues:nodeIssues});

    const quality=nodeIssues.length===0?'✓':'✗';
    const detail=nodeIssues.length===0?'Tam':`${nodeIssues.join(', ')}`;
    console.log(`  ${quality} [${ep.toUpperCase()}] ${nid.padEnd(35)} ${detail}`);
  }

  if(issues.length===0) console.log('\n  ✓ Tüm ölümler kaliteli.');
  else {
    console.log(`\n  ✗ ${issues.length} sorunlu ölüm:`);
    for(const d of issues){
      console.log(`  [${d.ep.toUpperCase()}] ${d.nid}`);
      d.issues.forEach(i=>console.log(`    - ${i}`));
    }
  }
  return issues;
}

// ═══════════════════════════════════════════════════════════
// ÖZET EYLEM PLANI
// ═══════════════════════════════════════════════════════════
function printActionPlan(choiceR, noteR, threadR, deathR) {
  console.log('\n'+'═'.repeat(64));
  console.log('EYLEM PLANI — Öncelik sırası');
  console.log('═'.repeat(64));

  const choiceProblems=choiceR.problems.filter(p=>!p.hasChoice&&!p.hasPuzzle).length;
  const criticalThreads=threadR.filter(t=>t.status==='EKSIK').length;

  const actions=[
    {
      priority:1,
      label:'SEÇİM SIKLIĞI',
      count:`${choiceProblems} node`,
      desc:'4+ mesaj arası seçim ekle — oyuncu pasif kalıyor',
      time:'Uzun (episode başına ~1 saat)',
      impact:'ÇOK YÜKSEK'
    },
    {
      priority:2,
      label:'ZİNCİR NOT SİSTEMİ',
      count:`${noteR.proposedChains.filter(c=>c.priority==='YÜKSEK').length} kritik zincir`,
      desc:'Jones yorumu ile Outlast tarzı belge sistemi',
      time:'Orta (~2-3 saat)',
      impact:'YÜKSEK'
    },
    {
      priority:3,
      label:'HAVADA KALAN KONULAR',
      count:`${criticalThreads} eksik thread`,
      desc:'Selin boşluğu, "biz" gizemi, kahve throughline',
      time:'Orta (~1-2 saat)',
      impact:'YÜKSEK'
    },
    {
      priority:4,
      label:'ÖLÜM KALİTESİ',
      count:`${deathR.length} sorunlu ölüm`,
      desc:'Eksik efektler ve checkpoint seçenekleri',
      time:'Kısa (~30 dk)',
      impact:deathR.length===0?'YOK — zaten iyi':'ORTA'
    },
    {
      priority:5,
      label:'ÖLÜM BAĞLAMI',
      count:'20 ölüm node',
      desc:'Her ölüm öncesi 3 uyarı sistemi kontrol',
      time:'Orta (~1 saat)',
      impact:'ORTA'
    },
  ];

  for(const a of actions){
    const icon=a.impact==='ÇOK YÜKSEK'?'🔴':a.impact==='YÜKSEK'?'🟡':a.impact==='YOK'?'✅':'⚪';
    console.log(`\n  ${a.priority}. ${icon} ${a.label} (${a.count})`);
    console.log(`     ${a.desc}`);
    console.log(`     Süre: ${a.time} | Etki: ${a.impact}`);
  }

  console.log('\n\n  NEREDEN BAŞLAYALIM?');
  console.log('  a) "seçim" → Seçim sıklığı, episode başına düzeltme');
  console.log('  b) "not"   → Zincir not sistemi tasarımı ve ekleme');
  console.log('  c) "konu"  → Havada kalan konuları kapat');
  console.log('  d) "olum"  → Ölüm kalitesi ve bağlamı');
  console.log('  e) "hepsi" → Tüm analizi göster, sırasıyla düzelt');
}

// ─── MAIN ─────────────────────────────────────────────────
const args=process.argv.slice(2);
const epIdx=args.indexOf('--episode');
const filterEp=epIdx>=0?args[epIdx+1].toLowerCase():null;

console.log('KATMAN İçerik Kalite Denetimi\n'+'─'.repeat(64));
if(filterEp)console.log(`Filtre: ${filterEp.toUpperCase()}`);

const{nodes,puzzles}=loadData();
console.log(`✓ ${Object.keys(nodes).length} node yüklendi`);

const choiceR  = auditChoiceDensity(nodes, filterEp);
const noteR    = auditNoteChains(nodes);
const threadR  = auditOpenThreads(nodes);
const deathR   = auditDeathQuality(nodes, puzzles);
printActionPlan(choiceR, noteR, threadR, deathR);

console.log('\n'+'═'.repeat(64)+'\nTAMAMLANDI\n'+'═'.repeat(64));