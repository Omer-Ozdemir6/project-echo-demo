import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_FILE = path.join(__dirname, '..', 'src', 'data', 'episodes', 'merged_story.json');

const { nodes } = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));

function inspectNode(nodeId) {
    const node = nodes[nodeId];
    if (!node) {
        console.log(`\n!!! ${nodeId} DÜĞÜMÜ JSON'DA YOK !!!`);
        return;
    }
    console.log(`\n--- ${nodeId} İNCELEMESİ ---`);
    console.log("Choices:", node.choices ? node.choices.length : "Yok");
    console.log("NextNodeId:", node.nextNodeId || "Yok");
    console.log("Events:", node.events ? node.events.map(e => e.type) : "Yok");
}

inspectNode("ep01_n04_breath_puzzle");
inspectNode("ep02_n11_arsiv_oda");