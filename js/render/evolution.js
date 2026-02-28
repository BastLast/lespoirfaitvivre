import { filteredDraws } from '../state.js';
import { makeChart } from '../charts.js';

export function renderEvolution() {
    if (!filteredDraws.length) return;
    const num = parseInt(document.getElementById('evoNumber').value) || 1;

    const cumFreq = [];
    let count = 0;
    const gaps = [];
    let lastIdx = -1;

    filteredDraws.forEach((d, idx) => {
        if (d.balls.includes(num)) {
            count++;
            if (lastIdx >= 0) gaps.push(idx - lastIdx);
            lastIdx = idx;
        }
        cumFreq.push(count);
    });

    const expectedLine = filteredDraws.map((_, idx) => (idx + 1) * 5 / 49);

    makeChart('chartEvolution', {
        type: 'line',
        data: {
            labels: filteredDraws.map(d => d.date),
            datasets: [
                {
                    label: `Fréquence cumulée N°${num}`,
                    data: cumFreq,
                    borderColor: '#3b82f6',
                    backgroundColor: 'rgba(59,130,246,0.1)',
                    fill: true,
                    tension: 0.2,
                    pointRadius: 0,
                },
                {
                    label: 'Fréquence attendue (théorique)',
                    data: expectedLine,
                    borderColor: '#ef4444',
                    borderDash: [5, 5],
                    fill: false,
                    pointRadius: 0,
                }
            ]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { labels: { color: '#9ca3af' } }
            },
            scales: {
                y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#9ca3af' } },
                x: {
                    grid: { display: false },
                    ticks: { color: '#9ca3af', maxTicksLimit: 20, maxRotation: 45 }
                }
            }
        }
    });

    makeChart('chartGaps', {
        type: 'bar',
        data: {
            labels: gaps.map((_, i) => `Écart ${i + 1}`),
            datasets: [{
                label: `Tirages entre 2 sorties du N°${num}`,
                data: gaps,
                backgroundColor: gaps.map(g => g > 20 ? '#ef4444' : g > 10 ? '#f97316' : '#22c55e'),
                borderRadius: 3,
            }]
        },
        options: {
            responsive: true,
            plugins: { legend: { display: false } },
            scales: {
                y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#9ca3af' } },
                x: { grid: { display: false }, ticks: { display: false } }
            }
        }
    });
}
