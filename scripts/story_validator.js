import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_FILE = path.join(__dirname, '..', 'src', 'data', 'episodes', 'merged_story.json');
const { nodes, puzzles } = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));

function validate() {
    console.log("--- TEST BAŞLIYOR: GRAFİK ANALİZİ ---");
    
    const visited = new Set();
    const queue = ["ep01_n01"]; // Başlangıç noktan
    visited.add("ep01_n01");

    // 1. Grafik Gezintisi (Reachability Analysis)
    while (queue.length > 0) {
        const id = queue.shift();
        const node = nodes[id];
        if (!node) continue;

        // Olası tüm çıkış yollarını topla
        const nextNodes = [];
        if (node.nextNodeId) nextNodes.push(node.nextNodeId);
        if (node.choices) node.choices.forEach(c => nextNodes.push(c.nextNodeId));
        
        // Puzzle bağlantılarını ekle
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
        // HATA GİDERME: choice veya sistem düğümlerini analiz dışı bırak
        if (id === 'choices' || id.includes('hard_fail')) return;

        if (!visited.has(id)) {
            // Eğer düğümün isminde 'kapanış' varsa veya 'isFinalNode' true ise yetim sayma
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