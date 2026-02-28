import { filteredDraws } from '../state.js';
import { computeChanceFreq, computeChanceRetards } from '../stats.js';
import { makeChart } from '../charts.js';

export function renderChance() {
    const chanceFreq = computeChanceFreq(filteredDraws);
    const chanceRetards = computeChanceRetards(filteredDraws);

    const labels = Array.from({ length: 10 }, (_, i) => `N°${i + 1}`);
    const values = Array.from({ length: 10 }, (_, i) => chanceFreq[i + 1]);
    const colors = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899', '#14b8a6', '#f59e0b', '#6366f1'];

    makeChart('chartChance', {
        type: 'bar',
        data: {
            labels,
            datasets: [{
                label: 'Sorties',
                data: values,
                backgroundColor: colors,
                borderRadius: 6,
            }]
        },
        options: {
            responsive: true,
            plugins: { legend: { display: false } },
            scales: {
                y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#9ca3af' } },
                x: { grid: { display: false }, ticks: { color: '#9ca3af' } }
            }
        }
    });

    makeChart('chartChancePie', {
        type: 'doughnut',
        data: {
            labels,
            datasets: [{
                data: values,
                backgroundColor: colors,
                borderColor: '#1a1d29',
                borderWidth: 2,
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { position: 'right', labels: { color: '#9ca3af' } },
                tooltip: {
                    callbacks: {
                        label: (ctx) => `${ctx.label}: ${ctx.parsed} (${((ctx.parsed / filteredDraws.length) * 100).toFixed(1)}%)`
                    }
                }
            }
        }
    });

    const retLabels = Array.from({ length: 10 }, (_, i) => `N°${i + 1}`);
    const retValues = Array.from({ length: 10 }, (_, i) => chanceRetards[i + 1]);
    makeChart('chartChanceRetard', {
        type: 'bar',
        data: {
            labels: retLabels,
            datasets: [{
                label: 'Retard actuel',
                data: retValues,
                backgroundColor: retValues.map(v => v > 15 ? '#ef4444' : v > 10 ? '#f97316' : '#22c55e'),
                borderRadius: 6,
            }]
        },
        options: {
            responsive: true,
            plugins: { legend: { display: false } },
            scales: {
                y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#9ca3af' } },
                x: { grid: { display: false }, ticks: { color: '#9ca3af' } }
            }
        }
    });
}
