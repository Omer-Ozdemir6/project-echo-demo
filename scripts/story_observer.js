import fs from 'fs';
const { nodes, puzzles } = JSON.parse(fs.readFileSync('./src/data/episodes/merged_story.json', 'utf-8'));

function runObservation() {
    console.log("--- TAM KAPSAMLI KEŞİF BAŞLIYOR (TÜM YOLLAR) ---");
    const report = {
        totalPathsFound: 0,
        unreachableNodes: [],
        endings: { loyal: 0, betrayal: 0, true: 0, deadEnd: 0 }
    };

    // Yolları keşfetmek için yığın (Stack) yapısı
    const stack = [{ id: "ep01_n01", stats: { humanity: 50, emreBaglantisi: 0, trust: 50, fear: 0 }, visited: new Set() }];

    while (stack.length > 0) {
        const { id, stats, visited } = stack.pop();
        const node = nodes[id];

        if (!node || visited.has(id)) continue;
        visited.add(id);

        // 1. Puzzle - Her iki yolu da keşfet
        if (node.events?.find(e => e.type === 'puzzle')) {
            const p = puzzles[node.events.find(e => e.type === 'puzzle').puzzleId];
            stack.push({ id: p.successNodeId, stats: { ...stats }, visited: new Set(visited) });
            stack.push({ id: p.failureNodeId, stats: { ...stats }, visited: new Set(visited) });
            continue;
        }

        // 2. Choices - Tüm seçenekleri keşfet
        if (node.choices) {
            node.choices.forEach(c => {
                const newStats = { ...stats };
                if (c.effects) Object.assign(newStats, c.effects);
                stack.push({ id: c.nextNodeId, stats: newStats, visited: new Set(visited) });
            });
            continue;
        }

        // 3. Routing - Tüm rotaları keşfet
        const routing = node.events?.find(e => e.type === 'statBasedRouting');
        if (routing) {
            routing.routes.forEach(r => {
                stack.push({ id: r.nextNodeId, stats: { ...stats }, visited: new Set(visited) });
            });
            continue;
        }

        // 4. Final Kontrolü
        if (!node.nextNodeId) {
            report.totalPathsFound++;
            if (id.includes('loyal')) report.endings.loyal++;
            else if (id.includes('betrayal')) report.endings.betrayal++;
            else if (id.includes('hard_fail')) report.endings.deadEnd++;
            else report.endings.true++;
        } else {
            stack.push({ id: node.nextNodeId, stats: { ...stats }, visited: new Set(visited) });
        }
    }

    console.table({
        "Toplam Keşfedilen Yol": report.totalPathsFound,
        "Ölü Yol (Dead Ends)": report.endings.deadEnd
    });
    console.table(report.endings);
}

runObservation();