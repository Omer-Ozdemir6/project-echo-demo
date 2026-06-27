import fs from 'fs';
import path from 'path';

// Klasör Yolları
const EPISODES_DIR = './src/data/episodes';
const REACT_FILES = [
    './src/components/StartScreen.jsx',
    './src/components/SettingsModal.jsx',
    './src/components/OperatorBriefing.jsx',
    './src/components/BootSequence.jsx'
];

// DİLLER (Buraya yeni dil ekleyebilirsin)
const LANGUAGES = [
    { code: 'tr', localeDir: './src/locales/tr', masterFile: './src/locales/master_tr.json' },
    { code: 'en', localeDir: './src/locales/en', masterFile: './src/locales/master_en.json' }
];

// Çeviri hazırlığı
let masterTranslations = { tr: {}, en: {} };

// Klasörleri hazırla
LANGUAGES.forEach(lang => {
    if (!fs.existsSync(lang.localeDir)) {
        fs.mkdirSync(lang.localeDir, { recursive: true });
    }
});

// Metin Çıkarma Fonksiyonları
function extractTextFromNode(nodeId, node, translations) {
    if (node.events) {
        node.events.forEach((event, idx) => {
            const baseKey = `${nodeId}_event_${idx}`;
            if (event.text) translations[`${baseKey}_text`] = event.text;
            if (event.trueText) translations[`${baseKey}_trueText`] = event.trueText;
            if (event.falseText) translations[`${baseKey}_falseText`] = event.falseText;
            if (event.loaderMessage) translations[`${baseKey}_loaderMessage`] = event.loaderMessage;
            if (event.subMessage) translations[`${baseKey}_subMessage`] = event.subMessage;
            if (event.characterBusyMessage) translations[`${baseKey}_characterBusyMessage`] = event.characterBusyMessage;
        });
    }
    if (node.choices) {
        node.choices.forEach((choice, idx) => {
            if (choice.text) {
                const choiceKey = choice.id || `c${idx}`;
                translations[`${nodeId}_choice_${choiceKey}`] = choice.text;
            }
        });
    }
}

function extractTextFromPuzzles(puzzleId, puzzle, translations) {
    if (puzzle.echoLabel) {
        translations[`puzzle_${puzzleId}_echoLabel`] = puzzle.echoLabel;
    }
}

function processJsxFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf-8');
    // getGameText("key", "default_text") desenini yakalar
    const regex = /getGameText\(\s*["']([^"']+)["']\s*,\s*["']([^"']+)["']/g;
    let match;

    while ((match = regex.exec(content)) !== null) {
        const [_, key, value] = match;
        // Her iki dil için de varsayılan değer olarak İngilizce/Türkçe metni ata
        masterTranslations.tr[key] = value;
        masterTranslations.en[key] = value; 
    }
    console.log(`✓ JSX Tarandı: ${path.basename(filePath)}`);
}

function processEpisodeFile(filePath, fileName) {
    const rawData = fs.readFileSync(filePath, 'utf-8');
    const data = JSON.parse(rawData);
    const fileTranslations = {};

    if (data.nodes) {
        for (const [nodeId, node] of Object.entries(data.nodes)) {
            extractTextFromNode(nodeId, node, fileTranslations);
        }
    }
    if (data.puzzles) {
        for (const [puzzleId, puzzle] of Object.entries(data.puzzles)) {
            extractTextFromPuzzles(puzzleId, puzzle, fileTranslations);
        }
    }

    if (Object.keys(fileTranslations).length > 0) {
        // Her dil için kaydet
        LANGUAGES.forEach(lang => {
            const localeFilePath = path.join(lang.localeDir, fileName);
            fs.writeFileSync(localeFilePath, JSON.stringify(fileTranslations, null, 2), 'utf-8');
            Object.assign(masterTranslations[lang.code], fileTranslations);
        });
        console.log(`✓ Çıkartıldı: ${fileName}`);
    }
}

// --- ANA İŞLEM ---
console.log("--- ÇEVİRİ METİNLERİ AYIKLANIYOR ---");

// 1. JSON Bölümleri tara
const files = fs.readdirSync(EPISODES_DIR).filter(file => file.endsWith('.json') && file.startsWith('episode-'));
files.forEach(file => processEpisodeFile(path.join(EPISODES_DIR, file), file));

// 2. React bileşenlerini tara
REACT_FILES.forEach(file => {
    if (fs.existsSync(file)) processJsxFile(file);
    else console.warn(`⚠ Dosya bulunamadı: ${file}`);
});

// 3. Master Dosyaları Kaydet
LANGUAGES.forEach(lang => {
    fs.writeFileSync(lang.masterFile, JSON.stringify(masterTranslations[lang.code], null, 2), 'utf-8');
    console.log(`✅ ${lang.code.toUpperCase()} Master güncellendi: ${lang.masterFile}`);
});

console.log(`\n🎉 İşlem başarıyla tamamlandı!`);