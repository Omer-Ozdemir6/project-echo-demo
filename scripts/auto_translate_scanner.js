import fs from 'fs';
import path from 'path';

// Tüm dosyaları gez ve metinleri bulup çevir
function walkDir(dir) {
    if (!fs.existsSync(dir)) return;
    fs.readdirSync(dir).forEach(file => {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            walkDir(fullPath);
        } else if (file.endsWith('.jsx')) {
            autoTranslateFile(fullPath);
        }
    });
}

function autoTranslateFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf-8');
    let modified = false;

    // Regex: HTML etiketleri arasındaki metni yakalar (>Metin<)
    // getGameText içinde olmayanları hedefler
    const textRegex = />([^<>{]+)</g;

    content = content.replace(textRegex, (match, p1) => {
        const text = p1.trim();
        // Sadece anlamlı ve "{}" içermeyen metinleri çevir
        if (text.length > 3 && !text.includes('{') && !text.includes('}')) {
            const key = text.toLowerCase().replace(/[^a-z0-9]/g, '.').substring(0, 20).replace(/^\.|\.$/g, '');
            modified = true;
            // DÜZELTME: Süslü parantez eklenerek JSX yapısı korundu
            return `>{getGameText("${key}", "${text}")}<`;
        }
        return match;
    });

    if (modified) {
        // Eğer import yoksa ekle
        if (!content.includes("from '../i18n/gameText'")) {
            content = "import { getGameText } from '../i18n/gameText';\n" + content;
        }
        fs.writeFileSync(filePath, content, 'utf-8');
        console.log(`✓ Güncellendi: ${filePath}`);
    }
}

console.log("--- OTOMATİK ÇEVİRİ DÖNÜŞÜMÜ BAŞLADI ---");
walkDir('./src/components');
console.log("--- DÖNÜŞÜM TAMAMLANDI ---");