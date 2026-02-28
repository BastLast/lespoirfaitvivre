import { allDraws, setRetroDone } from '../state.js';
import { makeChart } from '../charts.js';

export function runRetroAnalysis() {
    setRetroDone(true);

    const MIN_DRAWS = 30;
    const strategies = ['cold', 'frozen', 'combo', 'mix'];
    const stratLabels = {
        cold: '❄️ Froids (retards)',
        frozen: '🧊 Glacés (fréquence)',
        combo: '🎯 Score combiné',
        mix: '🎲 Mix équilibré'
    };

    const results = { cold: [], frozen: [], combo: [], mix: [] };

    // Incremental tracking
    const freq = {};
    for (let i = 1; i <= 49; i++) freq[i] = 0;
    const chFreq = {};
    for (let i = 1; i <= 10; i++) chFreq[i] = 0;
    const lastSeen = {};
    for (let i = 1; i <= 49; i++) lastSeen[i] = -1;
    const lastSeenCh = {};
    for (let i = 1; i <= 10; i++) lastSeenCh[i] = -1;

    for (let i = 0; i < allDraws.length; i++) {
        if (i >= MIN_DRAWS) {
            const n = i;

            const retards = {};
            for (let b = 1; b <= 49; b++) {
                retards[b] = lastSeen[b] === -1 ? n : (i - 1 - lastSeen[b]);
            }
            const chRetards = {};
            for (let c = 1; c <= 10; c++) {
                chRetards[c] = lastSeenCh[c] === -1 ? n : (i - 1 - lastSeenCh[c]);
            }

            const avgF = n * 5 / 49;
            const avgChF = n / 10;

            // COLD: highest retard
            const coldNums = Object.entries(retards)
                .sort((a, b) => b[1] - a[1]).slice(0, 5).map(e => parseInt(e[0]));
            const coldCh = parseInt(Object.entries(chRetards)
                .sort((a, b) => b[1] - a[1])[0][0]);

            // FROZEN: lowest frequency
            const frozenNums = Object.entries(freq)
                .sort((a, b) => a[1] - b[1]).slice(0, 5).map(e => parseInt(e[0]));
            const frozenCh = parseInt(Object.entries(chFreq)
                .sort((a, b) => a[1] - b[1])[0][0]);

            // COMBO: score-based
            const scores = {};
            for (let b = 1; b <= 49; b++) {
                scores[b] = retards[b] * 2 + Math.max(0, (avgF - freq[b]) * 3);
            }
            const comboNums = Object.entries(scores)
                .sort((a, b) => b[1] - a[1]).slice(0, 5).map(e => parseInt(e[0]));
            const comboCh = parseInt(Object.entries(chRetards).sort((a, b) => {
                const dA = avgChF - chFreq[a[0]];
                const dB = avgChF - chFreq[b[0]];
                return (b[1] * 2 + Math.max(0, dB * 3)) - (a[1] * 2 + Math.max(0, dA * 3));
            })[0][0]);

            // MIX: deterministic version
            const sortedAll = Object.entries(freq)
                .map(([k, v]) => ({ num: parseInt(k), count: v }))
                .sort((a, b) => a.count - b.count);
            const poolSize = Math.ceil(49 * 0.2);
            const mixCold = sortedAll[0].num;
            const mixHot = sortedAll[sortedAll.length - 1].num;
            const middle = sortedAll.slice(poolSize, -poolSize);
            const tS = Math.ceil(middle.length / 3);
            const mixLow = middle[Math.floor(tS / 2)]?.num || sortedAll[poolSize].num;
            const mixMid = middle[tS + Math.floor(tS / 2)]?.num || sortedAll[24].num;
            const mixHigh = middle[Math.min(tS * 2 + Math.floor((middle.length - tS * 2) / 2), middle.length - 1)]?.num || sortedAll[38].num;
            let mixNums = [mixCold, mixLow, mixMid, mixHigh, mixHot];
            const mixSet = new Set(mixNums);
            if (mixSet.size < 5) {
                for (const m of middle) {
                    if (mixSet.size >= 5) break;
                    if (!mixSet.has(m.num)) { mixSet.add(m.num); mixNums = [...mixSet]; }
                }
                mixNums = [...mixSet];
            }
            const mixCh = parseInt(Object.entries(chFreq)
                .map(([k, v]) => ({ num: parseInt(k), diff: Math.abs(v - avgChF) }))
                .sort((a, b) => a.diff - b.diff)[0].num);

            // Compare to actual draw i
            const actual = allDraws[i];
            const actualSet = new Set(actual.balls);
            const countM = (arr) => arr.filter(x => actualSet.has(x)).length;

            for (const [key, nums, ch] of [
                ['cold', coldNums, coldCh],
                ['frozen', frozenNums, frozenCh],
                ['combo', comboNums, comboCh],
                ['mix', mixNums, mixCh]
            ]) {
                results[key].push({
                    drawIndex: i,
                    date: actual.date,
                    matches: countM(nums),
                    chanceMatch: actual.chance === ch ? 1 : 0,
                    suggested: [...nums].sort((a, b) => a - b),
                    suggestedChance: ch,
                    actual: actual.balls,
                    actualChance: actual.chance
                });
            }
        }

        // Update incremental stats with draw i
        allDraws[i].balls.forEach(b => { freq[b]++; lastSeen[b] = i; });
        chFreq[allDraws[i].chance]++;
        lastSeenCh[allDraws[i].chance] = i;
    }

    // ===== RENDER RESULTS =====
    const totalAnalyzed = results.cold.length;
    const expectedBalls = 5 * 5 / 49;
    const expectedChance = 1 / 10;

    // Summary cards
    let summaryHTML = '';
    for (const s of strategies) {
        const avgMatch = results[s].reduce((a, r) => a + r.matches, 0) / totalAnalyzed;
        const chanceRate = results[s].reduce((a, r) => a + r.chanceMatch, 0) / totalAnalyzed * 100;
        const maxMatch = Math.max(...results[s].map(r => r.matches));
        const gt1 = results[s].filter(r => r.matches >= 2).length;
        const improvement = ((avgMatch / expectedBalls - 1) * 100).toFixed(1);
        summaryHTML += `
            <div class="stat-card">
                <div class="value" style="font-size:1.5rem">${stratLabels[s]}</div>
                <div class="value" style="color:${avgMatch > expectedBalls ? 'var(--green)' : 'var(--red)'}">${avgMatch.toFixed(3)}</div>
                <div class="label">boules correctes en moy. (${improvement > 0 ? '+' : ''}${improvement}% vs hasard)</div>
                <div style="margin-top:0.5rem;font-size:0.85rem;color:var(--muted)">
                    Chance: ${chanceRate.toFixed(1)}% | Max: ${maxMatch}/5 | ≥2 boules: ${gt1}×
                </div>
            </div>`;
    }
    summaryHTML += `
        <div class="stat-card" style="border-color:var(--red)">
            <div class="value" style="font-size:1.5rem">🎲 Hasard pur</div>
            <div class="value" style="color:var(--muted)">${expectedBalls.toFixed(3)}</div>
            <div class="label">boules correctes en moy. (référence)</div>
            <div style="margin-top:0.5rem;font-size:0.85rem;color:var(--muted)">
                Chance: ${(expectedChance * 100).toFixed(1)}% | ${totalAnalyzed} tirages analysés
            </div>
        </div>`;
    document.getElementById('retroSummary').innerHTML = summaryHTML;

    // Average matches bar chart
    const avgData = strategies.map(s =>
        results[s].reduce((a, r) => a + r.matches, 0) / totalAnalyzed
    );
    makeChart('chartRetroAvg', {
        type: 'bar',
        data: {
            labels: strategies.map(s => stratLabels[s]),
            datasets: [{
                label: 'Moy. boules correctes',
                data: avgData,
                backgroundColor: ['#3b82f6', '#06b6d4', '#f59e0b', '#8b5cf6'],
                borderRadius: 6
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { display: false },
                annotation: undefined
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: { color: '#2a2d3a' },
                    ticks: { color: '#9ca3af' }
                },
                x: { ticks: { color: '#9ca3af', font: { size: 11 } } }
            }
        },
        plugins: [{
            id: 'baseline',
            afterDraw(chart) {
                const yScale = chart.scales.y;
                const ctx = chart.ctx;
                const y = yScale.getPixelForValue(expectedBalls);
                ctx.save();
                ctx.strokeStyle = '#ef4444';
                ctx.lineWidth = 2;
                ctx.setLineDash([6, 4]);
                ctx.beginPath();
                ctx.moveTo(chart.chartArea.left, y);
                ctx.lineTo(chart.chartArea.right, y);
                ctx.stroke();
                ctx.fillStyle = '#ef4444';
                ctx.font = '11px sans-serif';
                ctx.fillText(`Hasard: ${expectedBalls.toFixed(2)}`, chart.chartArea.right - 90, y - 6);
                ctx.restore();
            }
        }]
    });

    // Chance hit rate bar chart
    const chanceData = strategies.map(s =>
        results[s].reduce((a, r) => a + r.chanceMatch, 0) / totalAnalyzed * 100
    );
    makeChart('chartRetroChance', {
        type: 'bar',
        data: {
            labels: strategies.map(s => stratLabels[s]),
            datasets: [{
                label: 'Taux de match Chance (%)',
                data: chanceData,
                backgroundColor: ['#3b82f6', '#06b6d4', '#f59e0b', '#8b5cf6'],
                borderRadius: 6
            }]
        },
        options: {
            responsive: true,
            plugins: { legend: { display: false } },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: { color: '#2a2d3a' },
                    ticks: { color: '#9ca3af', callback: v => v + '%' }
                },
                x: { ticks: { color: '#9ca3af', font: { size: 11 } } }
            }
        },
        plugins: [{
            id: 'chanceBaseline',
            afterDraw(chart) {
                const yScale = chart.scales.y;
                const ctx = chart.ctx;
                const y = yScale.getPixelForValue(10);
                ctx.save();
                ctx.strokeStyle = '#ef4444';
                ctx.lineWidth = 2;
                ctx.setLineDash([6, 4]);
                ctx.beginPath();
                ctx.moveTo(chart.chartArea.left, y);
                ctx.lineTo(chart.chartArea.right, y);
                ctx.stroke();
                ctx.fillStyle = '#ef4444';
                ctx.font = '11px sans-serif';
                ctx.fillText('Hasard: 10%', chart.chartArea.right - 80, y - 6);
                ctx.restore();
            }
        }]
    });

    // Distribution chart (grouped bar)
    const distribData = strategies.map(s => {
        const counts = [0, 0, 0, 0, 0, 0];
        results[s].forEach(r => counts[r.matches]++);
        return counts;
    });
    const distribColors = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6'];
    makeChart('chartRetroDistrib', {
        type: 'bar',
        data: {
            labels: strategies.map(s => stratLabels[s]),
            datasets: [0, 1, 2, 3, 4, 5].map(m => ({
                label: `${m} boule${m > 1 ? 's' : ''}`,
                data: strategies.map((_, si) => distribData[si][m]),
                backgroundColor: distribColors[m],
                borderRadius: 3
            }))
        },
        options: {
            responsive: true,
            plugins: {
                legend: { labels: { color: '#e4e4e7' } },
                tooltip: {
                    callbacks: {
                        afterLabel: (ctx) => {
                            const pct = (ctx.raw / totalAnalyzed * 100).toFixed(1);
                            return `${pct}% des tirages`;
                        }
                    }
                }
            },
            scales: {
                y: { stacked: true, grid: { color: '#2a2d3a' }, ticks: { color: '#9ca3af' } },
                x: { stacked: true, ticks: { color: '#9ca3af', font: { size: 11 } } }
            }
        }
    });

    // Evolution chart (moving average over 50 draws)
    const WINDOW = 50;
    const evoDatasets = [];
    const evoColors = ['#3b82f6', '#06b6d4', '#f59e0b', '#8b5cf6'];
    const evoLabels = [];

    for (let j = WINDOW - 1; j < totalAnalyzed; j++) {
        evoLabels.push(results.cold[j].date);
    }

    strategies.forEach((s, si) => {
        const movingAvg = [];
        for (let j = WINDOW - 1; j < totalAnalyzed; j++) {
            let sum = 0;
            for (let k = j - WINDOW + 1; k <= j; k++) sum += results[s][k].matches;
            movingAvg.push(sum / WINDOW);
        }
        evoDatasets.push({
            label: stratLabels[s],
            data: movingAvg,
            borderColor: evoColors[si],
            backgroundColor: 'transparent',
            borderWidth: 2,
            pointRadius: 0,
            tension: 0.3
        });
    });

    evoDatasets.push({
        label: 'Hasard pur',
        data: Array(evoLabels.length).fill(expectedBalls),
        borderColor: '#ef4444',
        borderDash: [6, 4],
        borderWidth: 2,
        pointRadius: 0,
        backgroundColor: 'transparent'
    });

    makeChart('chartRetroEvo', {
        type: 'line',
        data: { labels: evoLabels, datasets: evoDatasets },
        options: {
            responsive: true,
            plugins: { legend: { labels: { color: '#e4e4e7' } } },
            scales: {
                y: {
                    grid: { color: '#2a2d3a' },
                    ticks: { color: '#9ca3af' },
                    title: { display: true, text: 'Moy. boules correctes (fenêtre 50)', color: '#9ca3af' }
                },
                x: {
                    grid: { display: false },
                    ticks: { color: '#9ca3af', maxTicksLimit: 20, maxRotation: 45 }
                }
            }
        }
    });

    // Best results table
    const bestEntries = [];
    for (const s of strategies) {
        results[s].forEach(r => {
            if (r.matches >= 2) {
                bestEntries.push({ strategy: s, ...r });
            }
        });
    }
    bestEntries.sort((a, b) => (b.matches + b.chanceMatch) - (a.matches + a.chanceMatch) || b.matches - a.matches);

    let tableHTML = '<div style="max-height:500px;overflow-y:auto;border-radius:8px;border:1px solid var(--border)">';
    tableHTML += '<table class="retro-table"><thead><tr>';
    tableHTML += '<th>Date</th><th>Stratégie</th><th>Suggestion</th><th>Tirage réel</th><th>Boules ✓</th><th>Chance ✓</th>';
    tableHTML += '</tr></thead><tbody>';

    const shownEntries = bestEntries.slice(0, 100);
    for (const e of shownEntries) {
        const actualSet = new Set(e.actual);
        const sugBalls = e.suggested.map(n => {
            const hit = actualSet.has(n);
            return `<span class="retro-mini-ball ${hit ? 'hit' : 'miss'}">${n}</span>`;
        }).join('');
        const sugCh = `<span class="retro-mini-ball ${e.chanceMatch ? 'hit' : 'miss'}" style="${e.chanceMatch ? 'background:var(--chance);color:#000' : ''}">${e.suggestedChance}</span>`;

        const actBalls = e.actual.map(n => `<span class="retro-mini-ball" style="background:var(--accent);color:#fff">${n}</span>`).join('');
        const actCh = `<span class="retro-mini-ball" style="background:var(--chance);color:#000">${e.actualChance}</span>`;

        const badge = e.matches >= 4 ? 'amazing' : e.matches >= 3 ? 'great' : 'good';
        tableHTML += `<tr>
            <td>${e.date}</td>
            <td>${stratLabels[e.strategy]}</td>
            <td>${sugBalls} ${sugCh}</td>
            <td>${actBalls} ${actCh}</td>
            <td><span class="retro-badge ${badge}">${e.matches}/5</span></td>
            <td>${e.chanceMatch ? '<span class="retro-badge good">✓</span>' : '<span class="no-match">✗</span>'}</td>
        </tr>`;
    }
    if (bestEntries.length > 100) {
        tableHTML += `<tr><td colspan="6" style="color:var(--muted)">... et ${bestEntries.length - 100} autres résultats</td></tr>`;
    }
    tableHTML += '</tbody></table></div>';
    tableHTML += `<p class="info-text" style="margin-top:0.5rem">${bestEntries.length} tirages avec ≥2 boules correctes sur ${totalAnalyzed} analysés (${(bestEntries.length / totalAnalyzed * 100).toFixed(1)}%)</p>`;

    document.getElementById('retroBestTable').innerHTML = tableHTML;

    // Show results, hide loading
    document.getElementById('retroLoading').style.display = 'none';
    document.getElementById('retroResults').style.display = '';
    document.getElementById('retroChartsContainer').style.display = '';
}
