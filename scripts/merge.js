import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const DATA_DIR = path.join(process.cwd(), 'src', 'data', 'episodes');
const outputFile = path.join(DATA_DIR, 'merged_story.json');

// 1. Bölümleri isme göre sırala (01, 02... sırasını korur)
const files = fs.readdirSync(DATA_DIR)
    .filter(f => f.startsWith('episode-') && f.endsWith('.json'))
    .sort(); 

let masterData = {}; // Artık bölümleri anahtarlayan bir obje olacak

console.log(`--- MERGE İŞLEMİ BAŞLADI: ${files.length} bölüm ---`);

files.forEach((file) => {
    const filePath = path.join(DATA_DIR, file);
    const content = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    
    // Dosya isminden episode_01 gibi anahtar oluştur
    const episodeId = file.replace('episode-', '').replace('.json', '');
    const fullEpisodeId = `episode_${episodeId}`;

    // Validasyon: Bölümün başlangıç düğümü var mı?
    if (!content.startNodeId) {
        console.error(`❌ HATA: '${file}' dosyasında 'startNodeId' eksik!`);
        process.exit(1);
    }

    // Epizot objesini masterData içine ekle
    masterData[fullEpisodeId] = {
        id: fullEpisodeId,
        startNodeId: content.startNodeId,
        nodes: content.nodes || {},
        puzzles: content.puzzles || {}
    };

    console.log(`✓ Epizot eklendi: ${fullEpisodeId}`);
});

// JSON dosyasını kaydet
fs.writeFileSync(outputFile, JSON.stringify(masterData, null, 2));
console.log(`\n🎉 ${files.length} bölüm başarıyla birleştirildi: ${outputFile}`);

// --- OTOMATİK VALIDASYON ---
try {
    console.log("--- VALIDASYON BAŞLATILIYOR ---");
    execSync('node scripts/story_validator.js', { stdio: 'inherit' });
    console.log("\n✅ MERGE VE VALIDASYON BAŞARILI! Oyun build için hazır.");
} catch (error) {
    console.error("\n❌ HATA: Validasyon başarısız oldu. Lütfen yukarıdaki hataları incele.");
    process.exit(1);
}