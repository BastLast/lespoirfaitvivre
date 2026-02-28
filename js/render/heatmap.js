import { filteredDraws } from '../state.js';
import { computePairs } from '../stats.js';
import { heatColor } from '../charts.js';

export function renderHeatmap() {
    const pairs = computePairs(filteredDraws);
    const maxPairVal = Math.max(...Object.values(pairs));

    let html = '<table class="heatmap-table"><tr><th></th>';
    for (let i = 1; i <= 49; i++) html += `<th>${i}</th>`;
    html += '</tr>';

    for (let i = 1; i <= 49; i++) {
        html += `<tr><th>${i}</th>`;
        for (let j = 1; j <= 49; j++) {
            if (i === j) {
                html += '<td style="background:#2a2d3a">—</td>';
            } else {
                const key = i < j ? `${i}-${j}` : `${j}-${i}`;
                const val = pairs[key] || 0;
                html += `<td style="background:${heatColor(val, maxPairVal)};color:${val > maxPairVal * 0.5 ? '#fff' : '#666'}" title="Paire ${key}: ${val}×">${val}</td>`;
            }
        }
        html += '</tr>';
    }
    html += '</table>';
    document.getElementById('heatmapDiv').innerHTML = html;
}
