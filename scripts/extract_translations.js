import fs from 'fs';
import path from 'path';

const EPISODES_DIR = './src/data/episodes';
const REACT_FILES = [
    { path: './src/components/StartScreen.jsx', name: 'StartScreen.json' },
    { path: './src/components/SettingsModal.jsx', name: 'SettingsModal.json' },
    { path: './src/components/OperatorBriefing.jsx', name: 'OperatorBriefing.json' },
    { path: './src/components/BootSequence.jsx', name: 'BootSequence.json' },
    { path: './src/components/ContinueLoadingScreen.jsx', name: 'ContinueLoadingScreen.json' },
    { path: './src/components/RebootConfirmScreen.jsx', name: 'RebootConfirmScreen.json' }
];

const LANGUAGES = [
    { code: 'tr', localeDir: './src/locales/tr', masterFile: './src/locales/master_tr.json' },
    { code: 'en', localeDir: './src/locales/en', masterFile: './src/locales/master_en.json' }
];

let masterTranslations = { tr: {}, en: {} };

LANGUAGES.forEach(lang => {
    if (!fs.existsSync(lang.localeDir)) fs.mkdirSync(lang.localeDir, { recursive: true });
});

// Yardımcı: Metni tüm dillere ve master'a işler
function saveTranslations(fileName, translations) {
    if (Object.keys(translations).length === 0) return;
    
    LANGUAGES.forEach(lang => {
        const localeFilePath = path.join(lang.localeDir, fileName);
        // Var olanı oku veya boş obje başlat
        let existing = {};
        if (fs.existsSync(localeFilePath)) {
            existing = JSON.parse(fs.readFileSync(localeFilePath, 'utf-8'));
        }
        const updated = { ...existing, ...translations };
        fs.writeFileSync(localeFilePath, JSON.stringify(updated, null, 2), 'utf-8');
        
        // Master'a ekle
        Object.assign(masterTranslations[lang.code], updated);
    });
    console.log(`✓ İşlendi: ${fileName}`);
}

function processJsxFile(fileObj) {
    if (!fs.existsSync(fileObj.path)) return;

    const content = fs.readFileSync(fileObj.path, 'utf-8');
    
    // Gelişmiş Regex: Hem anahtarı hem de değeri yakalar
    // Bu Regex: getGameText("key", "değer") kalıbını arar
    const regex = /getGameText\(\s*['"`]([^'"`]+)['"`]\s*,\s*['"`]([^'"`]+)['"`]/g;
    
    let match;
    const translations = {};
    let foundCount = 0;

    while ((match = regex.exec(content)) !== null) {
        // match[1] = anahtar (key), match[2] = varsayılan değer (değer)
        translations[match[1]] = match[2]; 
        foundCount++;
    }

    if (foundCount > 0) {
        console.log(`✓ Tarandı: ${fileObj.name} (${foundCount} metin bulundu)`);
        saveTranslations(fileObj.name, translations);
    }
}

function processEpisodeFile(filePath, fileName) {
    const rawData = fs.readFileSync(filePath, 'utf-8');
    const data = JSON.parse(rawData);
    const translations = {};

    if (data.nodes) {
        for (const [nodeId, node] of Object.entries(data.nodes)) {
            if (node.events) node.events.forEach((e, i) => {
                if (e.text) translations[`${nodeId}_event_${i}_text`] = e.text;
                // ... diğer alanlar (trueText, falseText vs) eklenebilir
            });
            if (node.choices) node.choices.forEach((c, i) => {
                if (c.text) translations[`${nodeId}_choice_${c.id || i}`] = c.text;
            });
        }
    }
    saveTranslations(fileName, translations);
}

// --- ANA İŞLEM ---
console.log("--- ÇEVİRİ METİNLERİ AYIKLANIYOR ---");

// GÜNCELLEME: Sadece 'episode-' ile başlayan ve '.json' ile biten ham dosyaları al, merged_story'i yoksay
const files = fs.readdirSync(EPISODES_DIR)
    .filter(f => f.startsWith('episode-') && f.endsWith('.json'));

files.forEach(f => processEpisodeFile(path.join(EPISODES_DIR, f), f));

REACT_FILES.forEach(f => {
    if (fs.existsSync(f.path)) processJsxFile(f);
    else console.warn(`⚠ Dosya bulunamadı: ${f.path}`);
});

LANGUAGES.forEach(lang => {
    fs.writeFileSync(lang.masterFile, JSON.stringify(masterTranslations[lang.code], null, 2), 'utf-8');
});

console.log(`\n🎉 Tüm metinler başarıyla ayrıştırıldı.`);