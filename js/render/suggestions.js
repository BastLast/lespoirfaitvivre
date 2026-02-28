import { filteredDraws } from '../state.js';
import { computeFrequencies, computeRetards, computeChanceRetards, computeChanceFreq } from '../stats.js';
import { makeChart } from '../charts.js';

function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

export function renderSuggestions() {
    if (!filteredDraws.length) return;
    const freq = computeFrequencies(filteredDraws);
    const retards = computeRetards(filteredDraws);
    const chanceRetards = computeChanceRetards(filteredDraws);
    const chanceFreq = computeChanceFreq(filteredDraws);
    const avgFreq = filteredDraws.length * 5 / 49;

    // Cold numbers: highest retard
    const sortedRetard = Object.entries(retards).sort((a, b) => b[1] - a[1]);
    const coldNumbers = sortedRetard.slice(0, 5).map(e => parseInt(e[0]));
    const coldChance = Object.entries(chanceRetards).sort((a, b) => b[1] - a[1])[0];

    document.getElementById('coldSuggestion').innerHTML = `
        <h4>Les 5 boules avec le plus grand retard + N° Chance le plus en retard</h4>
        <div class="suggestion-numbers">
            ${coldNumbers.sort((a, b) => a - b).map(n => `<div class="ball">${n}</div>`).join('')}
            <div class="ball chance-ball">${coldChance[0]}</div>
        </div>
        <p class="info-text">Retards: ${sortedRetard.slice(0, 5).map(e => `N°${e[0]}=${e[1]} tirages`).join(', ')} | Chance N°${coldChance[0]}=${coldChance[1]} tirages</p>
    `;

    // Frozen: lowest frequency
    const sortedFreq = Object.entries(freq).sort((a, b) => a[1] - b[1]);
    const frozenNumbers = sortedFreq.slice(0, 5).map(e => parseInt(e[0]));
    const frozenChance = Object.entries(chanceFreq).sort((a, b) => a[1] - b[1])[0];

    document.getElementById('frozenSuggestion').innerHTML = `
        <h4>Les 5 boules les moins souvent tirées + N° Chance le moins tiré</h4>
        <div class="suggestion-numbers">
            ${frozenNumbers.sort((a, b) => a - b).map(n => `<div class="ball">${n}</div>`).join('')}
            <div class="ball chance-ball">${frozenChance[0]}</div>
        </div>
        <p class="info-text">Fréquences: ${sortedFreq.slice(0, 5).map(e => `N°${e[0]}=${e[1]}× (moy: ${avgFreq.toFixed(1)})`).join(', ')} | Chance N°${frozenChance[0]}=${frozenChance[1]}×</p>
    `;

    // Combo: weighted score
    const scores = {};
    for (let i = 1; i <= 49; i++) {
        const deficit = avgFreq - freq[i];
        scores[i] = retards[i] * 2 + Math.max(0, deficit * 3);
    }
    const bestCombo = Object.entries(scores).sort((a, b) => b[1] - a[1]).slice(0, 5).map(e => parseInt(e[0]));
    const bestChance = Object.entries(chanceRetards).sort((a, b) => {
        const cDef = (filteredDraws.length / 10) - chanceFreq[a[0]];
        const dDef = (filteredDraws.length / 10) - chanceFreq[b[0]];
        return (b[1] * 2 + Math.max(0, dDef * 3)) - (a[1] * 2 + Math.max(0, cDef * 3));
    })[0];

    document.getElementById('comboSuggestion').innerHTML = `
        <h4>Grille "Score combiné" (retard × 2 + déficit de fréquence × 3)</h4>
        <div class="suggestion-numbers">
            ${bestCombo.sort((a, b) => a - b).map(n => `<div class="ball">${n}</div>`).join('')}
            <div class="ball chance-ball">${bestChance[0]}</div>
        </div>
        <p class="info-text">Score = retard_actuel × 2 + max(0, (moyenne - fréquence) × 3). Plus le score est élevé, plus le numéro est "en retard" statistiquement.</p>
    `;

    // Mix suggestions: 5 grids
    const sortedByFreqAll = Object.entries(freq).sort((a, b) => a[1] - b[1]);
    const totalNums = sortedByFreqAll.length;

    const coldPool = sortedByFreqAll.slice(0, Math.ceil(totalNums * 0.2)).map(([n]) => parseInt(n));
    const hotPool = sortedByFreqAll.slice(-Math.ceil(totalNums * 0.2)).map(([n]) => parseInt(n));

    const middleAll = sortedByFreqAll.slice(Math.ceil(totalNums * 0.2), -Math.ceil(totalNums * 0.2));
    const tierSize = Math.ceil(middleAll.length / 3);
    const tierLow = middleAll.slice(0, tierSize).map(([n]) => parseInt(n));
    const tierMid = middleAll.slice(tierSize, tierSize * 2).map(([n]) => parseInt(n));
    const tierHigh = middleAll.slice(tierSize * 2).map(([n]) => parseInt(n));

    const avgChanceFreq = filteredDraws.length / 10;
    const chanceSortedMix = Object.entries(chanceFreq)
        .map(([n, c]) => ({ num: parseInt(n), diff: Math.abs(c - avgChanceFreq) }))
        .sort((a, b) => a.diff - b.diff);

    const usedGrids = new Set();
    const mixGrids = [];
    let attempts = 0;
    while (mixGrids.length < 5 && attempts < 200) {
        attempts++;
        const cold = shuffle(coldPool)[0];
        const hot = shuffle(hotPool)[0];
        const low = shuffle(tierLow)[0];
        const mid = shuffle(tierMid)[0];
        const high = shuffle(tierHigh)[0];
        const nums = [cold, low, mid, high, hot].sort((a, b) => a - b);
        const key = nums.join('-');
        if (usedGrids.has(key)) continue;
        if (new Set(nums).size !== 5) continue;
        usedGrids.add(key);
        const chIdx = mixGrids.length % chanceSortedMix.length;
        mixGrids.push({ nums, cold, hot, low, mid, high, chance: chanceSortedMix[chIdx].num });
    }

    let mixHTML = '';
    mixGrids.forEach((grid, idx) => {
        mixHTML += `
        <h4>Grille ${idx + 1}</h4>
        <div class="suggestion-numbers">
            ${grid.nums.map(n => {
                let bg, label, title;
                if (n === grid.cold) {
                    bg = 'linear-gradient(135deg, #3b82f6, #1d4ed8)'; label = '❄️'; title = `Froid (${freq[n]}×)`;
                } else if (n === grid.hot) {
                    bg = 'linear-gradient(135deg, #ef4444, #dc2626)'; label = '🔥'; title = `Chaud (${freq[n]}×)`;
                } else if (n === grid.low) {
                    bg = 'linear-gradient(135deg, #6366f1, #4f46e5)'; label = ''; title = `Basse-moy (${freq[n]}×)`;
                } else if (n === grid.mid) {
                    bg = 'linear-gradient(135deg, var(--accent), var(--accent2))'; label = ''; title = `Moyenne (${freq[n]}×)`;
                } else {
                    bg = 'linear-gradient(135deg, #f59e0b, #d97706)'; label = ''; title = `Haute-moy (${freq[n]}×)`;
                }
                return `<div class="ball" style="background:${bg}" title="${title}">${label}${n}</div>`;
            }).join('')}
            <div class="ball chance-ball">${grid.chance}</div>
        </div>
        <p class="info-text" style="margin-bottom:16px">
            ❄️ N°${grid.cold}=${freq[grid.cold]}× |
            <span style="color:#818cf8">▸</span> N°${grid.low}=${freq[grid.low]}× (basse-moy) |
            <span style="color:#f59e0b">▸</span> N°${grid.mid}=${freq[grid.mid]}× (moy) |
            <span style="color:#fbbf24">▸</span> N°${grid.high}=${freq[grid.high]}× (haute-moy) |
            🔥 N°${grid.hot}=${freq[grid.hot]}× |
            Chance: ${grid.chance}
        </p>`;
    });

    mixHTML += `<p class="info-text" style="margin-top:8px">Tranches: froid (&lt;${freq[coldPool[coldPool.length - 1]]}×) | basse-moy (${freq[tierLow[0]]}–${freq[tierLow[tierLow.length - 1]]}×) | moy (${freq[tierMid[0]]}–${freq[tierMid[tierMid.length - 1]]}×) | haute-moy (${freq[tierHigh[0]]}–${freq[tierHigh[tierHigh.length - 1]]}×) | chaud (&gt;${freq[hotPool[0]]}×)</p>`;

    document.getElementById('mixSuggestion').innerHTML = mixHTML;

    // Deviation chart
    const deviations = [];
    const devLabels = [];
    for (let i = 1; i <= 49; i++) {
        devLabels.push(`N°${i}`);
        deviations.push(freq[i] - avgFreq);
    }

    makeChart('chartDeviation', {
        type: 'bar',
        data: {
            labels: devLabels,
            datasets: [{
                label: 'Écart à la moyenne',
                data: deviations,
                backgroundColor: deviations.map(d => d < 0 ? '#ef4444' : '#22c55e'),
                borderRadius: 4,
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        afterLabel: (ctx) => {
                            const num = ctx.dataIndex + 1;
                            return `Sorties: ${freq[num]}\nMoyenne attendue: ${avgFreq.toFixed(1)}\nÉcart: ${deviations[ctx.dataIndex] > 0 ? '+' : ''}${deviations[ctx.dataIndex].toFixed(1)}`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    grid: { color: 'rgba(255,255,255,0.05)' },
                    ticks: { color: '#9ca3af' },
                },
                x: { grid: { display: false }, ticks: { color: '#9ca3af', maxRotation: 90, font: { size: 10 } } }
            }
        }
    });
}
