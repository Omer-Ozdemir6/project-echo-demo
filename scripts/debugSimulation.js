import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_FILE = path.join(__dirname, '..', 'src', 'data', 'episodes', 'merged_story.json');
const { nodes } = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));

function debugSimulation() {
    let currentId = "ep01_n01";
    let history = [];
    let steps = 0;

    console.log("--- SİMÜLASYON YOL HARİTASI ---");

    while (nodes[currentId] && steps < 100) {
        history.push(currentId);
        const node = nodes[currentId];
        
        // Bir sonraki adımı belirle
        let next = node.nextNodeId || (node.choices ? node.choices[0].nextNodeId : null);
        
        console.log(`Adım ${steps}: ${currentId} -> ${next || "SON"}`);
        
        if (!next) break;
        currentId = next;
        steps++;
    }

    console.log("\nSon izlenen yol:", history.join(" -> "));
}

debugSimulation();