import { filteredDraws } from '../state.js';
import { computePairs, computeTriplets } from '../stats.js';
import { makeChart } from '../charts.js';

export function renderPairs() {
    const pairs = computePairs(filteredDraws);
    const triplets = computeTriplets(filteredDraws);

    // Top 15 pairs (most)
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

    // Top 15 least frequent pairs
    const leastPairs = Object.entries(pairs).sort((a, b) => a[1] - b[1]).slice(0, 15);
    makeChart('chartLeastPairs', {
        type: 'bar',
        data: {
            labels: leastPairs.map(p => p[0]),
            datasets: [{
                label: 'Sorties ensemble',
                data: leastPairs.map(p => p[1]),
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

    // Triplets
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

    const leastTrips = Object.entries(triplets).sort((a, b) => a[1] - b[1]).slice(0, 15);
    makeChart('chartLeastTriplets', {
        type: 'bar',
        data: {
            labels: leastTrips.map(p => p[0]),
            datasets: [{
                label: 'Sorties ensemble',
                data: leastTrips.map(p => p[1]),
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
                y: { grid: { display: false }, ticks: { color: '#e4e4e7', font: { size: 10 } } }
            }
        }
    });
}
