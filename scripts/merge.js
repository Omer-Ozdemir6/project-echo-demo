import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const DATA_DIR = path.join(process.cwd(), 'src', 'data', 'episodes');
const outputFile = path.join(DATA_DIR, 'merged_story.json');

// Dosyaları isme göre sırala (Böylece ep-01, ep-02 diye düzgün birleşir)
const files = fs.readdirSync(DATA_DIR)
    .filter(f => f.startsWith('episode-') && f.endsWith('.json'))
    .sort(); 

let masterData = { nodes: {}, puzzles: {} };
let previousLastNodeId = null;

console.log(`--- MERGE İŞLEMİ BAŞLADI: ${files.length} bölüm ---`);

files.forEach((file) => {
    const filePath = path.join(DATA_DIR, file);
    const content = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    
    // 1. Çakışma Kontrolü
    Object.keys(content.nodes).forEach(id => {
        if (masterData.nodes[id]) {
            console.error(`❌ ÇAKIŞMA: '${id}' düğümü birden fazla dosyada mevcut!`);
            process.exit(1);
        }
    });

    // 2. Otomatik Köprü Kurma (Önceki bölümün sonu -> Mevcut bölümün başı)
    if (previousLastNodeId && content.startNodeId) {
        if (masterData.nodes[previousLastNodeId]) {
            masterData.nodes[previousLastNodeId].nextNodeId = content.startNodeId;
            console.log(`✓ KÖPRÜ KURULDU: ${previousLastNodeId} -> ${content.startNodeId}`);
        }
    }

    // 3. Birleştirme
    masterData.nodes = { ...masterData.nodes, ...content.nodes };
    masterData.puzzles = { ...masterData.puzzles, ...content.puzzles };

    // Bir sonraki iterasyon için bu bölümün son düğümünü bul
    // (Bölüm dosyalarında 'endNodeId' veya '_son' ile biten bir düğüm olduğunu varsayıyoruz)
    const lastNode = Object.keys(content.nodes).find(id => id.endsWith('_son'));
    previousLastNodeId = lastNode || Object.keys(content.nodes).pop(); 
});

fs.writeFileSync(outputFile, JSON.stringify(masterData, null, 2));
console.log(`✓ ${files.length} bölüm birleştirildi.`);

// --- OTOMATİK VALIDASYON ---
try {
    console.log("--- VALIDASYON BAŞLATILIYOR ---");
    execSync('node scripts/story_validator.js', { stdio: 'inherit' });
    console.log("\n✅ MERGE VE VALIDASYON BAŞARILI! Oyun build için hazır.");
} catch (error) {
    console.error("\n❌ HATA: Validasyon başarısız oldu. Lütfen yukarıdaki hataları incele.");
    process.exit(1);
}