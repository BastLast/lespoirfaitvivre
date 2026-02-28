import { allDraws, filteredDraws } from '../state.js';
import { computeAllStats } from '../stats.js';
import { renderFrequency } from './frequency.js';
import { renderRetards } from './retards.js';
import { renderChance } from './chance.js';
import { renderPairs } from './pairs.js';
import { renderHeatmap } from './heatmap.js';
import { renderEvolution } from './evolution.js';
import { renderRepartition } from './repartition.js';
import { renderSuggestions } from './suggestions.js';

// Map tab names to their render functions
const tabRenderers = {
    freq: renderFrequency,
    retard: renderRetards,
    chance: renderChance,
    pairs: renderPairs,
    heatmap: renderHeatmap,
    evolution: renderEvolution,
    repartition: renderRepartition,
    suggestions: renderSuggestions,
    // retroanalyse and analyzer handled separately (on-demand)
};

// Track which tabs need re-rendering after a filter change
const tabDirty = {};

function markAllTabsDirty() {
    for (const tab of Object.keys(tabRenderers)) {
        tabDirty[tab] = true;
    }
}

function getActiveTab() {
    const activeBtn = document.querySelector('#mainTabs button.active');
    return activeBtn ? activeBtn.dataset.tab : 'freq';
}

export function renderActiveTab() {
    const tab = getActiveTab();
    const renderer = tabRenderers[tab];
    if (renderer) {
        renderer();
        tabDirty[tab] = false;
    }
}

export function renderTabIfDirty(tabName) {
    if (tabDirty[tabName] && tabRenderers[tabName]) {
        tabRenderers[tabName]();
        tabDirty[tabName] = false;
    }
}

export function renderLastDraw() {
    if (!allDraws.length) return;
    const last = allDraws[allDraws.length - 1];
    const dayLabel = last.day.charAt(0).toUpperCase() + last.day.slice(1).toLowerCase();
    document.getElementById('lastDrawDate').textContent = `${dayLabel} ${last.date}`;
    const ballsHTML = last.balls.map(b => `<div class="big-ball">${b}</div>`).join('')
        + '<span class="separator">+</span>'
        + `<div class="big-ball chance">${last.chance}</div>`;
    document.getElementById('lastDrawBalls').innerHTML = ballsHTML;
    document.getElementById('lastDrawSection').style.display = '';
}

export function updateSummaryStats() {
    if (!filteredDraws.length) return;
    const { freq, chanceFreq, retards } = computeAllStats(filteredDraws);

    const sortedByFreq = Object.entries(freq).sort((a, b) => b[1] - a[1]);
    const sortedByRetard = Object.entries(retards).sort((a, b) => b[1] - a[1]);
    const sortedChance = Object.entries(chanceFreq).sort((a, b) => b[1] - a[1]);

    document.getElementById('statMostCommon').textContent = `N°${sortedByFreq[0][0]} (${sortedByFreq[0][1]}×)`;
    document.getElementById('statLeastCommon').textContent = `N°${sortedByFreq[sortedByFreq.length - 1][0]} (${sortedByFreq[sortedByFreq.length - 1][1]}×)`;
    document.getElementById('statMaxRetard').textContent = `N°${sortedByRetard[0][0]} (${sortedByRetard[0][1]} tirages)`;
    document.getElementById('statChance').textContent = `N°${sortedChance[0][0]} (${sortedChance[0][1]}×)`;
}

export function renderAll() {
    updateSummaryStats();
    // Only render the active tab; mark all others as dirty
    markAllTabsDirty();
    renderActiveTab();
}
