import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_FILE = path.join(__dirname, '..', 'src', 'data', 'episodes', 'merged_story.json');
const { nodes, puzzles } = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));

function validate() {
    console.log("--- TEST BAŞLIYOR: KAPSAMLI ANALİZ ---");
    let errorCount = 0;
    let deadEndCount = 0;

    Object.entries(nodes).forEach(([id, node]) => {
        // GÜNCELLEME: Eğer bu bir nesne değilse veya ID alanı yoksa atla (sahte düğümleri engelle)
        if (typeof node !== 'object' || !id || id === 'choices') return;

        // 1.next/choice bağlantılarını kontrol et
        const hasNext = node.nextNodeId;
        const hasChoices = node.choices && node.choices.length > 0;
        const hasPuzzle = node.events?.some(e => e.type === 'puzzle');

        // FİLTRE: Final düğümlerini uyarı listesinden çıkar
        const isFinalNode = id.includes('kapanış') || id.includes('son_gecis') || id.includes('hard_fail');

        // KÖR NOKTA ANALİZİ: Çıkışı olmayan düğümleri bul
        if (!hasNext && !hasChoices && !hasPuzzle && !isFinalNode) {
            console.warn(`[UYARI] Düğüm ${id}: Çıkış yolu (nextNodeId, choices veya puzzle) yok!`);
            deadEndCount++;
        }

        // 2. nextNodeId Kontrolü
        if (node.nextNodeId && !nodes[node.nextNodeId]) {
            console.error(`[HATA] Düğüm ${id}: nextNodeId '${node.nextNodeId}' bulunamadı!`);
            errorCount++;
        }

        // 3. Choices Kontrolü
        if (node.choices) {
            node.choices.forEach(c => {
                if (c.nextNodeId && !nodes[c.nextNodeId]) {
                    console.error(`[HATA] Düğüm ${id} -> Seçim: '${c.text}' hedefi '${c.nextNodeId}' bulunamadı!`);
                    errorCount++;
                }
            });
        }

        // 4. Puzzle Kontrolü
        const puzzleEvent = node.events?.find(e => e.type === 'puzzle');
        if (puzzleEvent) {
            const pid = puzzleEvent.puzzleId || puzzleEvent.puzzleType;
            const pData = puzzles[pid];
            if (!pData) {
                console.error(`[HATA] Düğüm ${id}: Tanımsız puzzle ID: ${pid}`);
                errorCount++;
            } else {
                if (pData.successNodeId && !nodes[pData.successNodeId]) {
                    console.error(`[HATA] Puzzle ${pid}: successNodeId '${pData.successNodeId}' bulunamadı!`);
                    errorCount++;
                }
            }
        }
    });

    console.log(`\n--- TEST TAMAMLANDI ---`);
    console.log(`Hata: ${errorCount} | Çıkmaz Sokak (Dead-end): ${deadEndCount}`);
}

validate();