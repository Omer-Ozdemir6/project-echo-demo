import fs from 'fs';
const { nodes, puzzles } = JSON.parse(fs.readFileSync('./src/data/episodes/merged_story.json', 'utf-8'));

function simulate(iterations) {
    const stats = { trust: 50, fear: 0 };
    const results = {};

    for (let i = 0; i < iterations; i++) {
        let currentId = "ep01_n01";
        for (let step = 0; step < 200; step++) {
            const node = nodes[currentId];
            if (!node) break;

            // Simüle edilen Engine Event İşleyicisi
            node.events?.forEach(e => {
                if (e.type === 'statChange') Object.assign(stats, e.changes);
                if (e.type === 'characterBusy') currentId = e.returnNodeId;
            });

            // Puzzle mantığı (Auto Success/Fail)
            const puzzle = node.events?.find(e => e.type === 'puzzle');
            if (puzzle) {
                const p = puzzles[puzzle.puzzleId || puzzle.puzzleType];
                currentId = (Math.random() > 0.2) ? p.successNodeId : p.failureNodeId;
                continue;
            }

            // Stat Routing (Kullanıcı için kritik özellik)
            if (node.routes) {
                const route = node.routes.find(r => stats[r.stat] >= r.value);
                if (route) { currentId = route.nextNodeId; continue; }
            }

            // Seçim ve Otomatik Geçiş
            if (node.choices) {
                currentId = node.choices[Math.floor(Math.random() * node.choices.length)].nextNodeId;
            } else if (node.nextNodeId) {
                currentId = node.nextNodeId;
            } else {
                results[currentId] = (results[currentId] || 0) + 1;
                break;
            }
        }
    }
    console.table(results);
}

simulate(1000);