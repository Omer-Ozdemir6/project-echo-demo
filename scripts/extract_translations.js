import fs from 'fs';
import path from 'path';

const EPISODES_DIR = './src/data/episodes';
const COMPONENTS_DIR = './src/components'; // Artık burayı otomatik tarayacağız

const LANGUAGES = [
    { code: 'tr', localeDir: './src/locales/tr', masterFile: './src/locales/master_tr.json' },
    { code: 'en', localeDir: './src/locales/en', masterFile: './src/locales/master_en.json' }
];

let masterTranslations = { tr: {}, en: {} };

// Klasörleri hazırla
LANGUAGES.forEach(lang => {
    if (!fs.existsSync(lang.localeDir)) fs.mkdirSync(lang.localeDir, { recursive: true });
});

// Otomatik dosya bulucu (alt klasörler dahil)
function getFiles(dir, fileList = []) {
    fs.readdirSync(dir).forEach(file => {
        const filePath = path.join(dir, file);
        if (fs.statSync(filePath).isDirectory()) {
            getFiles(filePath, fileList);
        } else if (file.endsWith('.jsx')) {
            fileList.push({ path: filePath, name: file.replace('.jsx', '.json') });
        }
    });
    return fileList;
}

function saveTranslations(fileName, translations) {
    if (Object.keys(translations).length === 0) return;
    
    LANGUAGES.forEach(lang => {
        const localeFilePath = path.join(lang.localeDir, fileName);
        let existing = {};
        if (fs.existsSync(localeFilePath)) {
            existing = JSON.parse(fs.readFileSync(localeFilePath, 'utf-8'));
        }
        const updated = { ...existing, ...translations };
        fs.writeFileSync(localeFilePath, JSON.stringify(updated, null, 2), 'utf-8');
        Object.assign(masterTranslations[lang.code], updated);
    });
    console.log(`✓ İşlendi: ${fileName}`);
}

function processJsxFile(fileObj) {
    const content = fs.readFileSync(fileObj.path, 'utf-8');
    
    // Regex: getGameText("key", "default") veya getGameText("key") yakalar
    const regex = /getGameText\(\s*['"`]([^'"`]+)['"`](?:\s*,\s*['"`]([^'"`]*)['"`])?/g;
    
    let match;
    const translations = {};
    let foundCount = 0;

    while ((match = regex.exec(content)) !== null) {
        translations[match[1]] = match[2] || ""; 
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
            });
            if (node.choices) node.choices.forEach((c, i) => {
                if (c.text) translations[`${nodeId}_choice_${c.id || i}`] = c.text;
            });
        }
    }
    saveTranslations(fileName, translations);
}

// --- ANA İŞLEM ---
console.log("--- ÇEVİRİ METİNLERİ OTOMATİK AYIKLANIYOR ---");

// 1. Epizotları tara
const files = fs.readdirSync(EPISODES_DIR)
    .filter(f => f.startsWith('episode-') && f.endsWith('.json'));
files.forEach(f => processEpisodeFile(path.join(EPISODES_DIR, f), f));

// 2. Componentleri otomatik tara
const componentFiles = getFiles(COMPONENTS_DIR);
componentFiles.forEach(f => processJsxFile(f));

// 3. Master dosyaları güncelle
LANGUAGES.forEach(lang => {
    fs.writeFileSync(lang.masterFile, JSON.stringify(masterTranslations[lang.code], null, 2), 'utf-8');
});

console.log(`\n🎉 İşlem tamamlandı. Tüm componentler ve epizotlar tarandı.`);