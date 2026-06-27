import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_FILE = path.join(__dirname, '..', 'src', 'data', 'episodes', 'merged_story.json');

const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
const nodes = data.nodes;

let fixedCount = 0;

console.log("--- İÇERİK MİMARI: OTOMATİK DÜZELTME VE DALLANMA BAŞLADI ---");

// Helper: Eksik CP oluştur
function ensureCheckpointExists(cpId) {
    if (!nodes[cpId]) {
        const episodePrefix = cpId.split('_')[0];
        nodes[cpId] = {
            id: cpId,
            speaker: "SYSTEM",
            events: [{ type: "message", text: "Frekans stabilize ediliyor...", speaker: "SYSTEM" }],
            nextNodeId: episodePrefix + "_n01"
        };
        console.log(`✓ Eksik düğüm oluşturuldu: ${cpId}`);
        fixedCount++;
    }
}

// 1. Dallanma Oluşturucu: Eğer düğümün çıkışı yoksa otomatik seçimler ekle
Object.entries(nodes).forEach(([id, node]) => {
    // Sadece "n" ile biten hikaye düğümlerini tarıyoruz
    if (id.includes('_n') && !node.choices && !node.nextNodeId && !node.events?.some(e => e.type === 'puzzle')) {
        console.log(`✓ Dallanma eklendi: ${id} artık bir seçim noktası.`);
        node.choices = [
            { id: "c1", text: "İncelemeye devam et.", nextNodeId: id.replace('n', 'n_next') },
            { id: "c2", text: "Geri dön.", nextNodeId: id.replace('n', 'n_prev') }
        ];
        fixedCount++;
    }

    // 2. CP / HardFail düzeltmeleri (Önceki mantık)
    if (node.choices) {
        node.choices.forEach(c => {
            if (c.nextNodeId?.includes('_cp') && !nodes[c.nextNodeId]) ensureCheckpointExists(c.nextNodeId);
        });
    }
    
    if (id.includes('hard_fail')) {
        const targetCp = id.replace('_hard_fail', '_cp01');
        ensureCheckpointExists(targetCp);
    }
});

// 3. Puzzle Hatasını Düzelt
if (!data.puzzles['breath_control']) {
    data.puzzles['breath_control'] = {
        id: "breath_control",
        type: "breath_control",
        successNodeId: "ep01_n04_bekle_dogru",
        failureNodeId: "ep01_n05_hard_fail"
    };
    fixedCount++;
}

if (fixedCount > 0) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
    console.log(`\nBAŞARILI: ${fixedCount} düğüm onarıldı veya dallandırıldı.`);
} else {
    console.log("Düzenlenecek bir şey bulunamadı.");
}