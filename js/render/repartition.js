import { filteredDraws } from '../state.js';
import { makeChart } from '../charts.js';

export function renderRepartition() {
    if (!filteredDraws.length) return;
    // By decade
    const decades = { '1-9': 0, '10-19': 0, '20-29': 0, '30-39': 0, '40-49': 0 };
    filteredDraws.forEach(d => {
        d.balls.forEach(b => {
            if (b <= 9) decades['1-9']++;
            else if (b <= 19) decades['10-19']++;
            else if (b <= 29) decades['20-29']++;
            else if (b <= 39) decades['30-39']++;
            else decades['40-49']++;
        });
    });

    makeChart('chartDecades', {
        type: 'bar',
        data: {
            labels: Object.keys(decades),
            datasets: [{
                label: 'Sorties',
                data: Object.values(decades),
                backgroundColor: ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6'],
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

    // Parity
    const parityDist = {};
    filteredDraws.forEach(d => {
        const odd = d.balls.filter(b => b % 2 !== 0).length;
        const key = `${odd} impairs / ${5 - odd} pairs`;
        parityDist[key] = (parityDist[key] || 0) + 1;
    });
    const parityLabels = Object.keys(parityDist).sort();
    makeChart('chartParite', {
        type: 'bar',
        data: {
            labels: parityLabels,
            datasets: [{
                label: 'Nombre de tirages',
                data: parityLabels.map(l => parityDist[l]),
                backgroundColor: '#8b5cf6',
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

    // Sum distribution
    const sums = {};
    filteredDraws.forEach(d => {
        const s = d.balls.reduce((a, b) => a + b, 0);
        const bucket = Math.floor(s / 10) * 10;
        const key = `${bucket}-${bucket + 9}`;
        sums[key] = (sums[key] || 0) + 1;
    });
    const sumLabels = Object.keys(sums).sort((a, b) => parseInt(a) - parseInt(b));
    makeChart('chartSomme', {
        type: 'bar',
        data: {
            labels: sumLabels,
            datasets: [{
                label: 'Nombre de tirages',
                data: sumLabels.map(l => sums[l]),
                backgroundColor: '#3b82f6',
                borderRadius: 4,
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

    // Spread (max - min)
    const spreads = {};
    filteredDraws.forEach(d => {
        const spread = d.balls[d.balls.length - 1] - d.balls[0];
        const bucket = Math.floor(spread / 5) * 5;
        const key = `${bucket}-${bucket + 4}`;
        spreads[key] = (spreads[key] || 0) + 1;
    });
    const spreadLabels = Object.keys(spreads).sort((a, b) => parseInt(a) - parseInt(b));
    makeChart('chartEcart', {
        type: 'bar',
        data: {
            labels: spreadLabels,
            datasets: [{
                label: 'Nombre de tirages',
                data: spreadLabels.map(l => spreads[l]),
                backgroundColor: '#f97316',
                borderRadius: 4,
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

    // By day of week
    const days = {};
    filteredDraws.forEach(d => {
        days[d.day] = (days[d.day] || 0) + 1;
    });
    makeChart('chartJours', {
        type: 'bar',
        data: {
            labels: Object.keys(days),
            datasets: [{
                label: 'Nombre de tirages',
                data: Object.values(days),
                backgroundColor: ['#3b82f6', '#22c55e', '#eab308', '#ef4444', '#8b5cf6', '#f97316', '#ec4899'],
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
