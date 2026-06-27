import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_FILE = path.join(__dirname, '..', 'src', 'data', 'episodes', 'merged_story.json');

const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
const nodes = data.nodes;
const puzzles = data.puzzles || {};

function simulate(iterations) {
    console.log(`Gelişmiş oyuncu simülasyonu başlıyor: ${iterations} tur.`);
    const results = {};

    for (let i = 0; i < iterations; i++) {
        let currentId = "ep01_n01";
        let steps = 0;

        while (nodes[currentId] && steps < 500) {
            const node = nodes[currentId];

            // 1. Puzzle Kontrolü
            const puzzleEvent = node.events ? node.events.find(e => e.type === 'puzzle') : null;
            if (puzzleEvent) {
                const pid = puzzleEvent.puzzleId || puzzleEvent.puzzleType;
                if (puzzles[pid]) {
                    const pData = puzzles[pid];
                    const isSuccess = Math.random() > 0.15; 
                    const nextId = isSuccess ? pData.successNodeId : pData.failureNodeId;
                    
                    if (nextId && nodes[nextId]) {
                        currentId = nextId;
                        steps++;
                        continue;
                    }
                }
            }

            // 2. Seçim Kontrolü (Dallanma Kapasitesini Artır)
            if (node.choices && node.choices.length > 0) {
                // Seçim yaparken tamamen rastgele değil, biraz daha "kararlı" bir dağılım
                const choice = node.choices[Math.floor(Math.random() * node.choices.length)];
                
                if (choice.nextNodeId && nodes[choice.nextNodeId]) {
                    currentId = choice.nextNodeId;
                    steps++;
                    continue;
                }
            }

            // 3. Otomatik Geçiş (Eğer hiçbir şey yoksa burası son düğümdür)
            if (node.nextNodeId && nodes[node.nextNodeId]) {
                currentId = node.nextNodeId;
                steps++;
                continue;
            }

            // YOL BİTTİ (Final Düğümü)
            results[currentId] = (results[currentId] || 0) + 1;
            break;
        }
    }
    
    console.log("\n--- SONUÇ DAĞILIMI (DALLANMA ANALİZİ) ---");
    console.table(results);
}

simulate(5000);