import { filteredDraws } from '../state.js';
import { computePairs, computeTriplets } from '../stats.js';
import { makeChart } from '../charts.js';

function computeRetard(draws, size) {
    const lastSeen = {};
    draws.forEach((d, idx) => {
        const balls = d.balls;
        if (size === 2) {
            for (let i = 0; i < balls.length; i++)
                for (let j = i + 1; j < balls.length; j++)
                    lastSeen[`${balls[i]}-${balls[j]}`] = idx;
        } else {
            for (let i = 0; i < balls.length; i++)
                for (let j = i + 1; j < balls.length; j++)
                    for (let k = j + 1; k < balls.length; k++)
                        lastSeen[`${balls[i]}-${balls[j]}-${balls[k]}`] = idx;
        }
    });
    const total = draws.length;
    const retard = {};
    for (const [key, lastIdx] of Object.entries(lastSeen)) {
        retard[key] = total - 1 - lastIdx;
    }
    return retard;
}

export function renderPairs() {
    if (!filteredDraws.length) return;
    const pairs = computePairs(filteredDraws);
    const triplets = computeTriplets(filteredDraws);
    const pairsRetard = computeRetard(filteredDraws, 2);
    const totalDraws = filteredDraws.length;

    // === PAIRS STATS ===
    const totalPossiblePairs = 49 * 48 / 2; // 1176
    const distinctPairs = Object.keys(pairs).length;
    const missingPairs = totalPossiblePairs - distinctPairs;
    const pairValues = Object.values(pairs);
    const avgPairFreq = (pairValues.reduce((a, b) => a + b, 0) / pairValues.length).toFixed(1);
    const maxPairFreq = Math.max(...pairValues);
    const minPairFreq = Math.min(...pairValues);

    document.getElementById('pairsStatsInfo').innerHTML = `
        <div class="stats-summary">
            <div class="stat-card"><div class="value">${totalPossiblePairs}</div><div class="label">Paires possibles</div></div>
            <div class="stat-card"><div class="value" style="color:var(--green)">${distinctPairs}</div><div class="label">Paires tirées</div>
                <div style="font-size:0.75rem;color:var(--muted)">${(distinctPairs / totalPossiblePairs * 100).toFixed(1)}% de couverture</div></div>
            <div class="stat-card"><div class="value" style="color:var(--red)">${missingPairs}</div><div class="label">Jamais tirées</div></div>
            <div class="stat-card"><div class="value">${avgPairFreq}</div><div class="label">Fréquence moyenne</div>
                <div style="font-size:0.75rem;color:var(--muted)">Min: ${minPairFreq} — Max: ${maxPairFreq}</div></div>
        </div>`;

    // Pairs retard chart (top 15 most overdue)
    const topPairsRetard = Object.entries(pairsRetard).sort((a, b) => b[1] - a[1]).slice(0, 15);
    makeChart('chartPairsRetard', {
        type: 'bar',
        data: {
            labels: topPairsRetard.map(p => p[0]),
            datasets: [{
                label: 'Tirages depuis dernière sortie',
                data: topPairsRetard.map(p => p[1]),
                backgroundColor: '#ef4444',
                borderRadius: 4,
            }]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            plugins: { legend: { display: false } },
            scales: {
                x: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#9ca3af' } },
                y: { grid: { display: false }, ticks: { color: '#e4e4e7', font: { size: 11 } } }
            }
        }
    });

    // Top 15 pairs (most frequent)
    const topPairs = Object.entries(pairs).sort((a, b) => b[1] - a[1]).slice(0, 15);
    makeChart('chartTopPairs', {
        type: 'bar',
        data: {
            labels: topPairs.map(p => p[0]),
            datasets: [{
                label: 'Sorties ensemble',
                data: topPairs.map(p => p[1]),
                backgroundColor: '#3b82f6',
                borderRadius: 4,
            }]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            plugins: { legend: { display: false } },
            scales: {
                x: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#9ca3af' } },
                y: { grid: { display: false }, ticks: { color: '#e4e4e7', font: { size: 11 } } }
            }
        }
    });

    // === TRIPLETS STATS ===
    const totalPossibleTrips = 49 * 48 * 47 / 6; // 18424
    const distinctTrips = Object.keys(triplets).length;
    const missingTrips = totalPossibleTrips - distinctTrips;
    const tripValues = Object.values(triplets);
    const avgTripFreq = (tripValues.reduce((a, b) => a + b, 0) / tripValues.length).toFixed(1);
    const maxTripFreq = Math.max(...tripValues);

    document.getElementById('tripletsStatsInfo').innerHTML = `
        <div class="stats-summary">
            <div class="stat-card"><div class="value">${totalPossibleTrips.toLocaleString()}</div><div class="label">Triplets possibles</div></div>
            <div class="stat-card"><div class="value" style="color:var(--green)">${distinctTrips.toLocaleString()}</div><div class="label">Triplets tirés</div>
                <div style="font-size:0.75rem;color:var(--muted)">${(distinctTrips / totalPossibleTrips * 100).toFixed(1)}% de couverture</div></div>
            <div class="stat-card"><div class="value" style="color:var(--red)">${missingTrips.toLocaleString()}</div><div class="label">Jamais tirés</div></div>
            <div class="stat-card"><div class="value">${avgTripFreq}</div><div class="label">Fréquence moyenne</div>
                <div style="font-size:0.75rem;color:var(--muted)">Max: ${maxTripFreq}</div></div>
        </div>`;

    // Top 15 triplets (most frequent)
    const topTrips = Object.entries(triplets).sort((a, b) => b[1] - a[1]).slice(0, 15);
    makeChart('chartTopTriplets', {
        type: 'bar',
        data: {
            labels: topTrips.map(p => p[0]),
            datasets: [{
                label: 'Sorties ensemble',
                data: topTrips.map(p => p[1]),
                backgroundColor: '#8b5cf6',
                borderRadius: 4,
            }]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            plugins: { legend: { display: false } },
            scales: {
                x: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#9ca3af' } },
                y: { grid: { display: false }, ticks: { color: '#e4e4e7', font: { size: 10 } } }
            }
        }
    });

    // ===== Decade clustering analysis =====
    const decadeLabels = ['1-10', '11-20', '21-30', '31-40', '41-49'];
    const getDecade = (n) => Math.min(Math.floor((n - 1) / 10), 4);

    // Count draws with 3+ numbers in the same decade
    const clusterCounts = { 3: 0, 4: 0, 5: 0 };
    const decadeClusterCounts = [0, 0, 0, 0, 0]; // per decade: how many times 3+ happened
    const decadeClusterDraws = [[], [], [], [], []]; // sample draws per decade

    filteredDraws.forEach(d => {
        const decCounts = [0, 0, 0, 0, 0];
        d.balls.forEach(b => decCounts[getDecade(b)]++);
        let maxCluster = Math.max(...decCounts);
        if (maxCluster >= 3) {
            clusterCounts[Math.min(maxCluster, 5)]++;
            decCounts.forEach((c, di) => {
                if (c >= 3) {
                    decadeClusterCounts[di]++;
                    if (decadeClusterDraws[di].length < 3) {
                        decadeClusterDraws[di].push({ date: d.date, balls: d.balls, cluster: c });
                    }
                }
            });
        }
    });

    const totalClusters = clusterCounts[3] + clusterCounts[4] + clusterCounts[5];

    // Bar chart: cluster frequency (3, 4, 5 in same decade)
    makeChart('chartDecadeClusters', {
        type: 'bar',
        data: {
            labels: ['3 numéros', '4 numéros', '5 numéros'],
            datasets: [{
                label: 'Tirages concernés',
                data: [clusterCounts[3], clusterCounts[4], clusterCounts[5]],
                backgroundColor: ['#f59e0b', '#ef4444', '#8b5cf6'],
                borderRadius: 6
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        afterLabel: (ctx) => `${(ctx.raw / totalDraws * 100).toFixed(1)}% des tirages`
                    }
                }
            },
            scales: {
                y: { beginAtZero: true, grid: { color: '#2a2d3a' }, ticks: { color: '#9ca3af' } },
                x: { ticks: { color: '#9ca3af' } }
            }
        }
    });

    // Bar chart: which decade has the most clusters
    makeChart('chartDecadeDetail', {
        type: 'bar',
        data: {
            labels: decadeLabels,
            datasets: [{
                label: 'Regroupements (≥3)',
                data: decadeClusterCounts,
                backgroundColor: ['#3b82f6', '#06b6d4', '#22c55e', '#f59e0b', '#ec4899'],
                borderRadius: 6
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        afterLabel: (ctx) => `${(ctx.raw / totalDraws * 100).toFixed(1)}% des tirages`
                    }
                }
            },
            scales: {
                y: { beginAtZero: true, grid: { color: '#2a2d3a' }, ticks: { color: '#9ca3af' } },
                x: { ticks: { color: '#9ca3af' } }
            }
        }
    });

    // Info summary
    let infoHTML = `<div class="stats-summary">
        <div class="stat-card">
            <div class="value" style="color:var(--yellow)">${totalClusters}</div>
            <div class="label">Tirages avec 3+ dans la même dizaine</div>
            <div style="font-size:0.75rem;color:var(--muted)">${(totalClusters / totalDraws * 100).toFixed(1)}% des tirages</div>
        </div>
        <div class="stat-card">
            <div class="value">${clusterCounts[3]}</div>
            <div class="label">Avec exactement 3</div>
        </div>
        <div class="stat-card">
            <div class="value" style="color:var(--red)">${clusterCounts[4]}</div>
            <div class="label">Avec exactement 4</div>
        </div>
        <div class="stat-card">
            <div class="value" style="color:var(--accent2)">${clusterCounts[5]}</div>
            <div class="label">Avec 5 (tous !)</div>
        </div>
    </div>`;

    // Show example draws per decade
    const mostClusteredDecade = decadeClusterCounts.indexOf(Math.max(...decadeClusterCounts));
    infoHTML += `<p class="info-text" style="margin-top:0.5rem">La dizaine <strong>${decadeLabels[mostClusteredDecade]}</strong> est la plus sujette aux regroupements avec ${decadeClusterCounts[mostClusteredDecade]} occurrences.</p>`;

    document.getElementById('decadeClusterInfo').innerHTML = infoHTML;
}
