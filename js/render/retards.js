import { filteredDraws } from '../state.js';
import { computeRetards, computeMaxRetards } from '../stats.js';
import { makeChart } from '../charts.js';

export function renderRetards() {
    if (!filteredDraws.length) return;
    const retards = computeRetards(filteredDraws);
    const maxRetards = computeMaxRetards(filteredDraws);

    const labels = Array.from({ length: 49 }, (_, i) => `N°${i + 1}`);
    const values = Array.from({ length: 49 }, (_, i) => retards[i + 1]);
    const maxV = Math.max(...values);

    makeChart('chartRetard', {
        type: 'bar',
        data: {
            labels,
            datasets: [{
                label: 'Retard actuel',
                data: values,
                backgroundColor: values.map(v => {
                    const ratio = v / maxV;
                    if (ratio > 0.8) return '#ef4444';
                    if (ratio > 0.6) return '#f97316';
                    if (ratio > 0.4) return '#eab308';
                    return '#22c55e';
                }),
                borderRadius: 4,
            }]
        },
        options: {
            responsive: true,
            plugins: { legend: { display: false } },
            scales: {
                y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#9ca3af' } },
                x: { grid: { display: false }, ticks: { color: '#9ca3af', maxRotation: 90, font: { size: 10 } } }
            }
        }
    });

    // Top 15 retards
    const top15 = Object.entries(retards).sort((a, b) => b[1] - a[1]).slice(0, 15);
    makeChart('chartTopRetard', {
        type: 'bar',
        data: {
            labels: top15.map(t => `N°${t[0]}`),
            datasets: [{
                label: 'Retard',
                data: top15.map(t => t[1]),
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
                y: { grid: { display: false }, ticks: { color: '#e4e4e7' } }
            }
        }
    });

    // Max retards historiques
    const maxLabels = Array.from({ length: 49 }, (_, i) => `N°${i + 1}`);
    const maxValues = Array.from({ length: 49 }, (_, i) => maxRetards[i + 1]);
    makeChart('chartMaxRetard', {
        type: 'bar',
        data: {
            labels: maxLabels,
            datasets: [{
                label: 'Retard max historique',
                data: maxValues,
                backgroundColor: '#8b5cf6',
                borderRadius: 4,
            }]
        },
        options: {
            responsive: true,
            plugins: { legend: { display: false } },
            scales: {
                y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#9ca3af' } },
                x: { grid: { display: false }, ticks: { color: '#9ca3af', maxRotation: 90, font: { size: 9 } } }
            }
        }
    });
}
