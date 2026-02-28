import { allDraws, filteredDraws, retroDone, setFilteredDraws } from './state.js';
import { loadData } from './data.js';
import { renderAll, renderLastDraw } from './render/summary.js';
import { renderFrequency } from './render/frequency.js';
import { renderEvolution } from './render/evolution.js';
import { runRetroAnalysis } from './render/retroanalysis.js';
import { initAnalyzer } from './render/analyzer.js';

function init() {
    document.getElementById('totalDraws').textContent = allDraws.length;
    document.getElementById('dateRange').textContent =
        `${allDraws[0].date} au ${allDraws[allDraws.length - 1].date}`;
    document.getElementById('statTotal').textContent = allDraws.length;

    renderLastDraw();

    // Setup tabs
    document.querySelectorAll('#mainTabs button').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('#mainTabs button').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
            btn.classList.add('active');
            document.getElementById('tab-' + btn.dataset.tab).classList.add('active');
            if (btn.dataset.tab === 'retroanalyse' && !retroDone) {
                setTimeout(() => runRetroAnalysis(), 50);
            }
            if (btn.dataset.tab === 'analyzer') {
                initAnalyzer();
            }
        });
    });

    // Setup evo number selector
    const evoSel = document.getElementById('evoNumber');
    if (evoSel.options.length <= 1) {
        for (let i = 1; i <= 49; i++) {
            const opt = document.createElement('option');
            opt.value = i; opt.textContent = `Boule ${i}`;
            evoSel.appendChild(opt);
        }
    }
    evoSel.addEventListener('change', () => renderEvolution());

    // Setup filters
    document.getElementById('filterPeriod').addEventListener('change', () => updateFilter());
    document.getElementById('filterSort').addEventListener('change', () => renderFrequency());

    updateFilter();
}

function updateFilter() {
    const period = document.getElementById('filterPeriod').value;
    if (period === 'all') {
        setFilteredDraws([...allDraws]);
    } else {
        const n = parseInt(period);
        if (n <= 100) {
            setFilteredDraws(allDraws.slice(-n));
        } else {
            const cutoff = new Date();
            cutoff.setDate(cutoff.getDate() - n);
            setFilteredDraws(allDraws.filter(d => {
                const [dd, mm, yy] = d.date.split('/');
                return new Date(yy, mm - 1, dd) >= cutoff;
            }));
        }
    }
    renderAll();
}

// Bootstrap
loadData(init);
