import { filteredDraws } from '../state.js';
import { computeFrequencies } from '../stats.js';
import { freqColor } from '../charts.js';
import { makeChart } from '../charts.js';

export function renderFrequency() {
    const freq = computeFrequencies(filteredDraws);
    const sortType = document.getElementById('filterSort').value;

    let labels, values;
    if (sortType === 'num') {
        labels = Array.from({ length: 49 }, (_, i) => i + 1);
        values = labels.map(l => freq[l]);
    } else if (sortType === 'asc') {
        const sorted = Object.entries(freq).sort((a, b) => a[1] - b[1]);
        labels = sorted.map(s => s[0]);
        values = sorted.map(s => s[1]);
    } else {
        const sorted = Object.entries(freq).sort((a, b) => b[1] - a[1]);
        labels = sorted.map(s => s[0]);
        values = sorted.map(s => s[1]);
    }

    const minV = Math.min(...values);
    const maxV = Math.max(...values);
    const avg = values.reduce((a, b) => a + b, 0) / values.length;

    makeChart('chartFreq', {
        type: 'bar',
        data: {
            labels: labels.map(l => `N°${l}`),
            datasets: [{
                label: 'Nombre de sorties',
                data: values,
                backgroundColor: values.map(v => freqColor(v, minV, maxV)),
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
                            const pct = ((ctx.parsed.y / filteredDraws.length) * 100).toFixed(1);
                            return `${pct}% des tirages\nMoyenne: ${avg.toFixed(1)}`;
                        }
                    }
                },
                annotation: undefined
            },
            scales: {
                y: {
                    grid: { color: 'rgba(255,255,255,0.05)' },
                    ticks: { color: '#9ca3af' }
                },
                x: {
                    grid: { display: false },
                    ticks: { color: '#9ca3af', maxRotation: 90, font: { size: 10 } }
                }
            }
        }
    });

    // Number grid
    const grid = document.getElementById('numberGrid');
    grid.innerHTML = '';
    const sorted = Object.entries(freq).sort((a, b) => a[1] - b[1]);
    sorted.forEach(([num, count]) => {
        const cell = document.createElement('div');
        cell.className = 'number-cell';
        cell.style.background = freqColor(count, minV, maxV);
        cell.style.color = 'white';
        cell.innerHTML = `${num}<span class="count">${count}×</span>`;
        cell.title = `Boule ${num}: ${count} sorties (${((count / filteredDraws.length) * 100).toFixed(1)}%)`;
        grid.appendChild(cell);
    });
}
