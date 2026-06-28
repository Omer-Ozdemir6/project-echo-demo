import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_FILE = path.join(__dirname, '..', 'src', 'data', 'episodes', 'merged_story.json');
const rawData = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));

// DÜZELTME: merged_story artık epizotlardan oluşuyor. 
// Tüm node'ları ve puzzle'ları tek bir havuzda birleştiriyoruz.
const nodes = {};
const puzzles = {};

Object.values(rawData).forEach(episode => {
    Object.assign(nodes, episode.nodes || {});
    Object.assign(puzzles, episode.puzzles || {});
});

function validate() {
    console.log("--- TEST BAŞLIYOR: GRAFİK ANALİZİ ---");
    
    const visited = new Set();
    const queue = ["ep01_n01"]; 
    visited.add("ep01_n01");

    // 1. Grafik Gezintisi
    while (queue.length > 0) {
        const id = queue.shift();
        const node = nodes[id];
        if (!node) continue;

        const nextNodes = [];
        if (node.nextNodeId) nextNodes.push(node.nextNodeId);
        
        // Choice'lardaki nextNodeId ve nextEpisodeId geçişlerini topla
        if (node.choices) node.choices.forEach(c => {
            if (c.nextNodeId) nextNodes.push(c.nextNodeId);
        });
        
        // Puzzle bağlantıları
        node.events?.filter(e => e.type === 'puzzle').forEach(e => {
            const p = puzzles[e.puzzleId || e.puzzleType];
            if (p) {
                if (p.successNodeId) nextNodes.push(p.successNodeId);
                if (p.failureNodeId) nextNodes.push(p.failureNodeId);
            }
        });

        nextNodes.forEach(nextId => {
            if (nextId && nodes[nextId] && !visited.has(nextId)) {
                visited.add(nextId);
                queue.push(nextId);
            }
        });
    }

    // 2. Yetim Düğüm Tespiti
    let errorCount = 0;
    Object.keys(nodes).forEach(id => {
        if (id === 'choices' || id.includes('hard_fail')) return;

        if (!visited.has(id)) {
            const isFinalNode = id.includes('kapanış') || nodes[id].isFinalNode;
            
            if (!isFinalNode) {
                console.error(`[YETİM] Düğüm ${id} hiçbir yoldan ulaşılamaz!`);
                errorCount++;
            }
        }
    });

    console.log(`\n--- TEST TAMAMLANDI ---`);
    console.log(`Grafik Analizi: ${errorCount} yetim düğüm bulundu.`);
}

validate();