/**
 * KATMAN Geliştirme Araçları
 * node scripts/katman_devtools.js --validate --stats
 */
const fs = require('fs');
const path = require('path');

// Proje kök dizinini ve veri yolunu ayarla
const PROJECT_ROOT = path.join(__dirname, '..');
const DATA_FILE = path.join(PROJECT_ROOT, 'data', 'merged_story.json');

function loadData() {
    if (!fs.existsSync(DATA_FILE)) {
        console.error(`HATA: ${DATA_FILE} bulunamadı!`);
        process.exit(1);
    }
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
}

function validateStory(allNodes) {
    console.log("\n--- STORY VALIDATOR ---");
    let errors = 0;
    Object.entries(allNodes).forEach(([id, node]) => {
        (node.choices || []).forEach(choice => {
            if (choice.nextNodeId && !allNodes[choice.nextNodeId]) {
                console.log(`[HATA] ${id} -> ${choice.nextNodeId} (Bulunamadı)`);
                errors++;
            }
        });
    });
    if (errors === 0) console.log("✓ Tüm bağlantılar sağlıklı.");
}

function dialogueStats(allNodes) {
    console.log("\n--- DIALOGUE STATISTICS ---");
    const stats = {};
    Object.values(allNodes).forEach(node => {
        (node.events || []).forEach(e => {
            if (e.type === 'message') {
                stats[e.speaker] = (stats[e.speaker] || 0) + 1;
            }
        });
    });
    console.table(stats);
}

const { nodes } = loadData();
const args = process.argv.slice(2);

if (args.includes('--validate') || args.length === 0) validateStory(nodes);
if (args.includes('--stats') || args.length === 0) dialogueStats(nodes);