import { charts } from './state.js';

export function freqColor(val, min, max) {
    const ratio = (val - min) / (max - min || 1);
    if (ratio < 0.2) return '#ef4444';
    if (ratio < 0.4) return '#f97316';
    if (ratio < 0.6) return '#eab308';
    if (ratio < 0.8) return '#22c55e';
    return '#3b82f6';
}

export function heatColor(val, maxVal) {
    if (val === 0) return '#1a1d29';
    const ratio = val / maxVal;
    const r = Math.round(30 + ratio * 100);
    const g = Math.round(30 + ratio * 100);
    const b = Math.round(60 + ratio * 196);
    return `rgb(${r},${g},${b})`;
}

export function makeChart(id, config) {
    if (charts[id]) charts[id].destroy();
    charts[id] = new Chart(document.getElementById(id), config);
    return charts[id];
}
