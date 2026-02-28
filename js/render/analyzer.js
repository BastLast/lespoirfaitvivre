import { allDraws } from '../state.js';
import { makeChart } from '../charts.js';
import { computeFrequencies, computeRetards, computeMaxRetards, computeChanceFreq, computeChanceRetards } from '../stats.js';

let analyzerDone = false;

export function initAnalyzer() {
    if (analyzerDone) return;
    analyzerDone = true;

    const btn = document.getElementById('analyzerBtn');
    const resultDiv = document.getElementById('analyzerResults');
    const inputs = [];
    for (let i = 1; i <= 5; i++) inputs.push(document.getElementById(`anaBall${i}`));
    const chanceInput = document.getElementById('anaChance');

    btn.addEventListener('click', () => {
        const balls = inputs.map(inp => parseInt(inp.value));
        const chance = parseInt(chanceInput.value);

        // Validate
        const errors = [];
        balls.forEach((b, i) => {
            if (isNaN(b) || b < 1 || b > 49) errors.push(`Boule ${i + 1} doit être entre 1 et 49`);
        });
        if (isNaN(chance) || chance < 1 || chance > 10) errors.push('N° Chance doit être entre 1 et 10');
        const uniqueBalls = new Set(balls);
        if (uniqueBalls.size < 5 && errors.length === 0) errors.push('Les 5 boules doivent être différentes');

        if (errors.length > 0) {
            resultDiv.innerHTML = `<div class="chart-container" style="border-color:var(--red)"><p style="color:var(--red)">⚠️ ${errors.join(' • ')}</p></div>`;
            resultDiv.style.display = 'block';
            return;
        }

        balls.sort((a, b) => a - b);
        runAnalysis(balls, chance, resultDiv);
    });
}

function runAnalysis(balls, chance, container) {
    container.style.display = 'block';
    container.innerHTML = '<p style="color:var(--muted);text-align:center;padding:1rem">⏳ Analyse en cours...</p>';

    setTimeout(() => {
        const freq = computeFrequencies(allDraws);
        const retards = computeRetards(allDraws);
        const maxRetards = computeMaxRetards(allDraws);
        const chFreq = computeChanceFreq(allDraws);
        const chRetards = computeChanceRetards(allDraws);
        const total = allDraws.length;
        const avgFreq = total * 5 / 49;
        const avgChFreq = total / 10;

        let html = '';

        // ========== 1. User combo display ==========
        html += `<div class="chart-container ana-combo-display">
            <h3>🎯 Votre combinaison</h3>
            <div class="suggestion-numbers" style="justify-content:center;margin:1rem 0">
                ${balls.map(b => `<span class="ball">${b}</span>`).join('')}
                <span style="font-size:1.5rem;color:var(--muted);display:flex;align-items:center">+</span>
                <span class="ball chance-ball">${chance}</span>
            </div>
        </div>`;

        // ========== 2. Identity card for each number ==========
        html += `<div class="chart-container">
            <h3>📋 Fiche d'identité de chaque numéro</h3>
            <p class="info-text">Statistiques individuelles de chaque numéro de votre combinaison sur ${total} tirages.</p>
            <div style="overflow-x:auto;margin-top:1rem">
            <table class="retro-table">
                <thead><tr>
                    <th>Numéro</th><th>Fréquence</th><th>Écart moy.</th><th>Retard actuel</th><th>Retard max</th><th>Dernière sortie</th><th>Statut</th>
                </tr></thead><tbody>`;

        for (const b of balls) {
            const f = freq[b];
            const r = retards[b];
            const mr = maxRetards[b];
            const pct = ((f / avgFreq - 1) * 100).toFixed(1);
            const status = f < avgFreq * 0.9 ? '<span style="color:var(--red)">❄️ Froid</span>'
                : f > avgFreq * 1.1 ? '<span style="color:var(--green)">🔥 Chaud</span>'
                    : '<span style="color:var(--yellow)">😐 Normal</span>';
            const lastDate = findLastDate(b, 'ball');
            const avgGap = (total / Math.max(f, 1)).toFixed(1);
            html += `<tr>
                <td><span class="retro-mini-ball hit" style="width:34px;height:34px;font-size:0.9rem">${b}</span></td>
                <td><strong>${f}×</strong> <span style="color:${pct >= 0 ? 'var(--green)' : 'var(--red)'}; font-size:0.8rem">(${pct > 0 ? '+' : ''}${pct}%)</span></td>
                <td>${avgGap} tirages</td>
                <td style="color:${r > avgGap * 1.5 ? 'var(--red)' : r > avgGap ? 'var(--orange)' : 'var(--green)'}">${r} tirages</td>
                <td>${mr} tirages</td>
                <td>${lastDate}</td>
                <td>${status}</td>
            </tr>`;
        }
        // Chance row
        const chF = chFreq[chance];
        const chR = chRetards[chance];
        const chPct = ((chF / avgChFreq - 1) * 100).toFixed(1);
        const chStatus = chF < avgChFreq * 0.9 ? '<span style="color:var(--red)">❄️ Froid</span>'
            : chF > avgChFreq * 1.1 ? '<span style="color:var(--green)">🔥 Chaud</span>'
                : '<span style="color:var(--yellow)">😐 Normal</span>';
        const chLastDate = findLastDate(chance, 'chance');
        const chAvgGap = (total / Math.max(chF, 1)).toFixed(1);

        html += `<tr style="border-top:2px solid var(--chance)">
            <td><span class="retro-mini-ball" style="background:var(--chance);color:#000;width:34px;height:34px;font-size:0.9rem">${chance}</span></td>
            <td><strong>${chF}×</strong> <span style="color:${chPct >= 0 ? 'var(--green)' : 'var(--red)'}; font-size:0.8rem">(${chPct > 0 ? '+' : ''}${chPct}%)</span></td>
            <td>${chAvgGap} tirages</td>
            <td>${chR} tirages</td>
            <td>—</td>
            <td>${chLastDate}</td>
            <td>${chStatus}</td>
        </tr>`;
        html += '</tbody></table></div></div>';

        // ========== 3. Score global ==========
        const freqScore = balls.reduce((s, b) => s + (avgFreq - freq[b]) / avgFreq, 0) / 5;
        const retardScore = balls.reduce((s, b) => s + retards[b], 0) / 5 / total;
        const globalScore = Math.min(100, Math.max(0, Math.round(50 + freqScore * 30 + retardScore * 20)));
        const sumBalls = balls.reduce((a, b) => a + b, 0);
        const spread = balls[4] - balls[0];
        const oddCount = balls.filter(b => b % 2 !== 0).length;
        const decades = [0, 0, 0, 0, 0];
        balls.forEach(b => decades[Math.min(Math.floor((b - 1) / 10), 4)]++);
        const decadesUsed = decades.filter(d => d > 0).length;

        html += `<div class="chart-container">
            <h3>📊 Profil de votre combinaison</h3>
            <div class="stats-summary" style="margin-top:1rem">
                <div class="stat-card">
                    <div class="value" style="color:${sumBalls >= 100 && sumBalls <= 150 ? 'var(--green)' : 'var(--orange)'}">${sumBalls}</div>
                    <div class="label">Somme des boules</div>
                    <div style="font-size:0.75rem;color:var(--muted)">Moyenne historique : ${getAvgSum()}</div>
                </div>
                <div class="stat-card">
                    <div class="value" style="color:${spread >= 25 ? 'var(--green)' : 'var(--orange)'}">${spread}</div>
                    <div class="label">Écart max-min</div>
                    <div style="font-size:0.75rem;color:var(--muted)">Moyenne historique : ${getAvgSpread()}</div>
                </div>
                <div class="stat-card">
                    <div class="value">${oddCount} / ${5 - oddCount}</div>
                    <div class="label">Impairs / Pairs</div>
                    <div style="font-size:0.75rem;color:var(--muted)">Équilibre idéal : 2-3 / 2-3</div>
                </div>
                <div class="stat-card">
                    <div class="value">${decadesUsed}/5</div>
                    <div class="label">Dizaines couvertes</div>
                    <div style="font-size:0.75rem;color:var(--muted)">${decades.map((d, i) => `${i * 10 + 1}-${Math.min((i + 1) * 10, 49)}: ${d}`).join(' | ')}</div>
                </div>
            </div>
        </div>`;

        // ========== 4. Pair analysis ==========
        const pairData = [];
        for (let i = 0; i < balls.length; i++) {
            for (let j = i + 1; j < balls.length; j++) {
                const a = Math.min(balls[i], balls[j]);
                const b = Math.max(balls[i], balls[j]);
                let count = 0;
                allDraws.forEach(d => {
                    if (d.balls.includes(a) && d.balls.includes(b)) count++;
                });
                pairData.push({ pair: `${a}-${b}`, count });
            }
        }
        pairData.sort((a, b) => a.count - b.count);
        const avgPairFreq = total * (5 * 4 / 2) / (49 * 48 / 2);

        html += `<div class="chart-container">
            <h3>🔗 Analyse des paires</h3>
            <p class="info-text">Combien de fois chaque paire de votre combinaison est sortie ensemble. Fréquence attendue par hasard : ${avgPairFreq.toFixed(1)}×</p>
            <canvas id="chartAnaPairs"></canvas>
        </div>`;

        // ========== 5. Triplet analysis ==========
        const tripletData = [];
        for (let i = 0; i < balls.length; i++) {
            for (let j = i + 1; j < balls.length; j++) {
                for (let k = j + 1; k < balls.length; k++) {
                    const nums = [balls[i], balls[j], balls[k]].sort((a, b) => a - b);
                    let count = 0;
                    allDraws.forEach(d => {
                        if (d.balls.includes(nums[0]) && d.balls.includes(nums[1]) && d.balls.includes(nums[2])) count++;
                    });
                    tripletData.push({ triplet: nums.join('-'), count });
                }
            }
        }
        tripletData.sort((a, b) => a.count - b.count);

        html += `<div class="chart-container">
            <h3>🔺 Analyse des triplets</h3>
            <p class="info-text">Combien de fois chaque triplet de votre combinaison est sorti ensemble.</p>
            <canvas id="chartAnaTriplets"></canvas>
        </div>`;

        // ========== 6. Historical performance ==========
        const matchDist = [0, 0, 0, 0, 0, 0];
        let chanceHits = 0;
        const bestMatches = [];
        const matchHistory = [];
        const ballSet = new Set(balls);

        allDraws.forEach((d, idx) => {
            const matches = d.balls.filter(b => ballSet.has(b)).length;
            const chMatch = d.chance === chance ? 1 : 0;
            matchDist[matches]++;
            if (chMatch) chanceHits++;
            matchHistory.push({ date: d.date, matches, chMatch });
            if (matches >= 2) {
                bestMatches.push({ date: d.date, matches, chMatch, actual: d.balls, actualChance: d.chance, index: idx });
            }
        });

        const avgMatch = matchHistory.reduce((s, m) => s + m.matches, 0) / total;
        const expectedMatch = 5 * 5 / 49;
        const matchImprovement = ((avgMatch / expectedMatch - 1) * 100).toFixed(1);

        html += `<div class="chart-container">
            <h3>📈 Performance historique — Si vous aviez joué cette grille à chaque tirage</h3>
            <p class="info-text">Sur ${total} tirages, combien de boules auraient correspondu à chaque fois.</p>
            <div class="stats-summary" style="margin-top:1rem">
                <div class="stat-card">
                    <div class="value" style="color:${avgMatch > expectedMatch ? 'var(--green)' : 'var(--red)'}">${avgMatch.toFixed(3)}</div>
                    <div class="label">Boules correctes en moy.</div>
                    <div style="font-size:0.75rem;color:var(--muted)">${matchImprovement > 0 ? '+' : ''}${matchImprovement}% vs hasard (${expectedMatch.toFixed(3)})</div>
                </div>
                <div class="stat-card">
                    <div class="value">${(chanceHits / total * 100).toFixed(1)}%</div>
                    <div class="label">Taux N° Chance correct</div>
                    <div style="font-size:0.75rem;color:var(--muted)">Hasard : 10%</div>
                </div>
                <div class="stat-card">
                    <div class="value" style="color:var(--accent)">${Math.max(...matchDist.map((_, i) => matchDist[i] > 0 ? i : 0))}/5</div>
                    <div class="label">Meilleur match</div>
                </div>
                <div class="stat-card">
                    <div class="value">${bestMatches.length}</div>
                    <div class="label">Tirages avec ≥ 2 boules</div>
                    <div style="font-size:0.75rem;color:var(--muted)">${(bestMatches.length / total * 100).toFixed(1)}% des tirages</div>
                </div>
            </div>
        </div>`;

        // ========== 7. Distribution chart ==========
        html += `<div class="grid-2">
            <div class="chart-container">
                <h3>📊 Distribution des correspondances</h3>
                <p class="info-text">Répartition du nombre de boules correctes sur tous les tirages.</p>
                <canvas id="chartAnaDistrib"></canvas>
            </div>
            <div class="chart-container">
                <h3>📈 Fréquence de vos numéros vs moyenne</h3>
                <p class="info-text">Comparaison de la fréquence de chaque numéro vs la fréquence moyenne attendue.</p>
                <canvas id="chartAnaFreqCompare"></canvas>
            </div>
        </div>`;

        // ========== 8. Evolution chart ==========
        html += `<div class="chart-container">
            <h3>📉 Évolution des correspondances dans le temps</h3>
            <p class="info-text">Moyenne glissante sur 50 tirages du nombre de boules correctes.</p>
            <canvas id="chartAnaEvo"></canvas>
        </div>`;

        // ========== 9. Frequency radar ==========
        html += `<div class="grid-2">
            <div class="chart-container">
                <h3>🎯 Radar — Profil de vos numéros</h3>
                <p class="info-text">Vue multi-critères : fréquence, retard, retard max, régularité.</p>
                <canvas id="chartAnaRadar"></canvas>
            </div>
            <div class="chart-container">
                <h3>📅 Dernières apparitions de vos numéros</h3>
                <p class="info-text">Timeline montrant quand chaque numéro est sorti pour la dernière fois.</p>
                <canvas id="chartAnaTimeline"></canvas>
            </div>
        </div>`;

        // ========== 10. Best matches table ==========
        bestMatches.sort((a, b) => (b.matches + b.chMatch) - (a.matches + a.chMatch));
        html += `<div class="chart-container">
            <h3>🏆 Meilleurs résultats historiques</h3>
            <p class="info-text">Tirages où votre combinaison aurait eu au moins 2 boules correctes.</p>`;

        if (bestMatches.length === 0) {
            html += '<p style="color:var(--muted);text-align:center;padding:1rem">Aucun tirage avec ≥ 2 boules correctes.</p>';
        } else {
            html += `<div style="max-height:400px;overflow-y:auto;border-radius:8px;border:1px solid var(--border);margin-top:1rem">
                <table class="retro-table"><thead><tr>
                    <th>Date</th><th>Votre grille</th><th>Tirage réel</th><th>Boules ✓</th><th>Chance ✓</th>
                </tr></thead><tbody>`;

            const shown = bestMatches.slice(0, 80);
            for (const e of shown) {
                const actualSet = new Set(e.actual);
                const sugBalls = balls.map(n =>
                    `<span class="retro-mini-ball ${actualSet.has(n) ? 'hit' : 'miss'}">${n}</span>`
                ).join('');
                const sugCh = `<span class="retro-mini-ball ${e.chMatch ? 'hit' : 'miss'}" style="${e.chMatch ? 'background:var(--chance);color:#000' : ''}">${chance}</span>`;
                const actBalls = e.actual.map(n =>
                    `<span class="retro-mini-ball" style="background:${ballSet.has(n) ? 'var(--green)' : 'var(--accent)'};color:#fff">${n}</span>`
                ).join('');
                const actCh = `<span class="retro-mini-ball" style="background:var(--chance);color:#000">${e.actualChance}</span>`;
                const badge = e.matches >= 4 ? 'amazing' : e.matches >= 3 ? 'great' : 'good';

                html += `<tr>
                    <td>${e.date}</td>
                    <td>${sugBalls} ${sugCh}</td>
                    <td>${actBalls} ${actCh}</td>
                    <td><span class="retro-badge ${badge}">${e.matches}/5</span></td>
                    <td>${e.chMatch ? '<span class="retro-badge good">✓</span>' : '<span class="no-match">✗</span>'}</td>
                </tr>`;
            }
            if (bestMatches.length > 80) {
                html += `<tr><td colspan="5" style="color:var(--muted)">... et ${bestMatches.length - 80} autres résultats</td></tr>`;
            }
            html += '</tbody></table></div>';
        }
        html += '</div>';

        // Render HTML
        container.innerHTML = html;

        // ========== Render charts ==========
        // Pairs chart
        makeChart('chartAnaPairs', {
            type: 'bar',
            data: {
                labels: pairData.map(p => p.pair),
                datasets: [{
                    label: 'Apparitions ensemble',
                    data: pairData.map(p => p.count),
                    backgroundColor: pairData.map(p =>
                        p.count < avgPairFreq * 0.7 ? '#ef4444'
                            : p.count < avgPairFreq ? '#f97316'
                                : p.count < avgPairFreq * 1.3 ? '#22c55e'
                                    : '#3b82f6'
                    ),
                    borderRadius: 4
                }]
            },
            options: {
                responsive: true,
                plugins: { legend: { display: false } },
                scales: {
                    y: { beginAtZero: true, grid: { color: '#2a2d3a' }, ticks: { color: '#9ca3af' } },
                    x: { ticks: { color: '#9ca3af', font: { size: 11 } } }
                }
            },
            plugins: [{
                id: 'pairBaseline',
                afterDraw(chart) {
                    const y = chart.scales.y.getPixelForValue(avgPairFreq);
                    const ctx = chart.ctx;
                    ctx.save();
                    ctx.strokeStyle = '#9ca3af';
                    ctx.lineWidth = 1.5;
                    ctx.setLineDash([5, 3]);
                    ctx.beginPath();
                    ctx.moveTo(chart.chartArea.left, y);
                    ctx.lineTo(chart.chartArea.right, y);
                    ctx.stroke();
                    ctx.fillStyle = '#9ca3af';
                    ctx.font = '10px sans-serif';
                    ctx.fillText(`Moy: ${avgPairFreq.toFixed(1)}`, chart.chartArea.right - 60, y - 5);
                    ctx.restore();
                }
            }]
        });

        // Triplets chart
        makeChart('chartAnaTriplets', {
            type: 'bar',
            data: {
                labels: tripletData.map(t => t.triplet),
                datasets: [{
                    label: 'Apparitions ensemble',
                    data: tripletData.map(t => t.count),
                    backgroundColor: tripletData.map(t =>
                        t.count === 0 ? '#ef4444' : t.count <= 1 ? '#f97316' : '#22c55e'
                    ),
                    borderRadius: 4
                }]
            },
            options: {
                responsive: true,
                plugins: { legend: { display: false } },
                scales: {
                    y: { beginAtZero: true, grid: { color: '#2a2d3a' }, ticks: { color: '#9ca3af', stepSize: 1 } },
                    x: { ticks: { color: '#9ca3af', font: { size: 10 }, maxRotation: 90 } }
                }
            }
        });

        // Distribution chart
        const distribColors = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6'];
        makeChart('chartAnaDistrib', {
            type: 'bar',
            data: {
                labels: ['0 boule', '1 boule', '2 boules', '3 boules', '4 boules', '5 boules'],
                datasets: [{
                    label: 'Nombre de tirages',
                    data: matchDist,
                    backgroundColor: distribColors,
                    borderRadius: 6
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            afterLabel: (ctx) => `${(ctx.raw / total * 100).toFixed(1)}% des tirages`
                        }
                    }
                },
                scales: {
                    y: { beginAtZero: true, grid: { color: '#2a2d3a' }, ticks: { color: '#9ca3af' } },
                    x: { ticks: { color: '#9ca3af' } }
                }
            }
        });

        // Freq comparison chart
        makeChart('chartAnaFreqCompare', {
            type: 'bar',
            data: {
                labels: [...balls.map(b => `N°${b}`), `Chance ${chance}`],
                datasets: [
                    {
                        label: 'Votre numéro',
                        data: [...balls.map(b => freq[b]), chFreq[chance]],
                        backgroundColor: '#3b82f6',
                        borderRadius: 4
                    },
                    {
                        label: 'Moyenne attendue',
                        data: [...balls.map(() => avgFreq), avgChFreq],
                        backgroundColor: '#4b5563',
                        borderRadius: 4
                    }
                ]
            },
            options: {
                responsive: true,
                plugins: { legend: { labels: { color: '#e4e4e7' } } },
                scales: {
                    y: { beginAtZero: true, grid: { color: '#2a2d3a' }, ticks: { color: '#9ca3af' } },
                    x: { ticks: { color: '#9ca3af' } }
                }
            }
        });

        // Evolution chart (moving average)
        const WINDOW = 50;
        const evoLabels = [];
        const evoData = [];
        for (let j = WINDOW - 1; j < total; j++) {
            evoLabels.push(matchHistory[j].date);
            let sum = 0;
            for (let k = j - WINDOW + 1; k <= j; k++) sum += matchHistory[k].matches;
            evoData.push(sum / WINDOW);
        }

        makeChart('chartAnaEvo', {
            type: 'line',
            data: {
                labels: evoLabels,
                datasets: [
                    {
                        label: 'Votre combinaison (moy. glissante 50)',
                        data: evoData,
                        borderColor: '#3b82f6',
                        backgroundColor: 'transparent',
                        borderWidth: 2,
                        pointRadius: 0,
                        tension: 0.3
                    },
                    {
                        label: 'Hasard pur',
                        data: Array(evoLabels.length).fill(expectedMatch),
                        borderColor: '#ef4444',
                        borderDash: [6, 4],
                        borderWidth: 2,
                        pointRadius: 0,
                        backgroundColor: 'transparent'
                    }
                ]
            },
            options: {
                responsive: true,
                plugins: { legend: { labels: { color: '#e4e4e7' } } },
                scales: {
                    y: { grid: { color: '#2a2d3a' }, ticks: { color: '#9ca3af' } },
                    x: { grid: { display: false }, ticks: { color: '#9ca3af', maxTicksLimit: 20, maxRotation: 45 } }
                }
            }
        });

        // Radar chart
        const maxFreq = Math.max(...Object.values(freq));
        const maxRetard = Math.max(...Object.values(retards));
        const maxMaxRetard = Math.max(...Object.values(maxRetards));

        const radarBallData = balls.map(b => ({
            freq: freq[b] / maxFreq * 100,
            retard: retards[b] / maxRetard * 100,
            maxRet: maxRetards[b] / maxMaxRetard * 100,
            regularity: 100 - Math.abs(freq[b] - avgFreq) / avgFreq * 100
        }));

        makeChart('chartAnaRadar', {
            type: 'radar',
            data: {
                labels: ['Fréquence', 'Retard actuel', 'Retard max', 'Régularité'],
                datasets: balls.map((b, i) => ({
                    label: `N°${b}`,
                    data: [radarBallData[i].freq, radarBallData[i].retard, radarBallData[i].maxRet, radarBallData[i].regularity],
                    borderColor: ['#3b82f6', '#06b6d4', '#f59e0b', '#8b5cf6', '#ec4899'][i],
                    backgroundColor: ['rgba(59,130,246,0.1)', 'rgba(6,182,212,0.1)', 'rgba(245,158,11,0.1)', 'rgba(139,92,246,0.1)', 'rgba(236,72,153,0.1)'][i],
                    borderWidth: 2,
                    pointRadius: 3
                }))
            },
            options: {
                responsive: true,
                plugins: { legend: { labels: { color: '#e4e4e7' } } },
                scales: {
                    r: {
                        grid: { color: '#2a2d3a' },
                        angleLines: { color: '#2a2d3a' },
                        pointLabels: { color: '#9ca3af' },
                        ticks: { display: false },
                        beginAtZero: true,
                        max: 100
                    }
                }
            }
        });

        // Timeline chart (horizontal bar showing retard for each number)
        makeChart('chartAnaTimeline', {
            type: 'bar',
            data: {
                labels: [...balls.map(b => `N°${b}`), `Chance ${chance}`],
                datasets: [{
                    label: 'Retard actuel (tirages)',
                    data: [...balls.map(b => retards[b]), chRetards[chance]],
                    backgroundColor: [...balls.map(b => {
                        const avgGap = total / Math.max(freq[b], 1);
                        return retards[b] > avgGap * 1.5 ? '#ef4444'
                            : retards[b] > avgGap ? '#f97316'
                                : '#22c55e';
                    }), chRetards[chance] > total / Math.max(chFreq[chance], 1) ? '#ef4444' : '#22c55e'],
                    borderRadius: 6
                }]
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                plugins: { legend: { display: false } },
                scales: {
                    x: { beginAtZero: true, grid: { color: '#2a2d3a' }, ticks: { color: '#9ca3af' } },
                    y: { ticks: { color: '#9ca3af' } }
                }
            }
        });

    }, 50);
}

function findLastDate(num, type) {
    for (let i = allDraws.length - 1; i >= 0; i--) {
        if (type === 'ball' && allDraws[i].balls.includes(num)) return allDraws[i].date;
        if (type === 'chance' && allDraws[i].chance === num) return allDraws[i].date;
    }
    return 'Jamais';
}

function getAvgSum() {
    const total = allDraws.length;
    const sum = allDraws.reduce((s, d) => s + d.balls.reduce((a, b) => a + b, 0), 0);
    return (sum / total).toFixed(0);
}

function getAvgSpread() {
    const total = allDraws.length;
    const sum = allDraws.reduce((s, d) => {
        const sorted = [...d.balls].sort((a, b) => a - b);
        return s + (sorted[4] - sorted[0]);
    }, 0);
    return (sum / total).toFixed(0);
}
