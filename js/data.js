import { allDraws, filteredDraws, charts, setAllDraws, setFilteredDraws, FDJ_ZIP_URL, CACHE_KEY, CACHE_TS_KEY, CACHE_TTL } from './state.js';

export function parseCSV(csvText) {
    const lines = csvText.split('\n').filter(l => l.trim());
    if (lines.length < 2) return [];

    // Dynamic header detection instead of hardcoded column indices
    const headerCols = lines[0].split(';').map(h => h.trim().toLowerCase());
    const colIndex = {
        id: headerCols.indexOf('annee_numero_de_tirage'),
        day: headerCols.indexOf('jour_de_tirage'),
        date: headerCols.indexOf('date_de_tirage'),
        boule1: headerCols.indexOf('boule_1'),
        boule2: headerCols.indexOf('boule_2'),
        boule3: headerCols.indexOf('boule_3'),
        boule4: headerCols.indexOf('boule_4'),
        boule5: headerCols.indexOf('boule_5'),
        chance: headerCols.indexOf('numero_chance'),
    };

    // Validate that all required columns were found
    const missingCols = Object.entries(colIndex).filter(([, idx]) => idx === -1).map(([name]) => name);
    if (missingCols.length > 0) {
        console.warn(`CSV parsing: colonnes manquantes: ${missingCols.join(', ')}. Headers trouvés: ${headerCols.join(', ')}`);
        return [];
    }

    const minCols = Math.max(...Object.values(colIndex)) + 1;
    const draws = [];
    let skippedCount = 0;
    for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(';');
        if (cols.length < minCols) { skippedCount++; continue; }
        try {
            const id = cols[colIndex.id].trim();
            const day = cols[colIndex.day].trim();
            const date = cols[colIndex.date].trim();
            const balls = [
                parseInt(cols[colIndex.boule1].trim()),
                parseInt(cols[colIndex.boule2].trim()),
                parseInt(cols[colIndex.boule3].trim()),
                parseInt(cols[colIndex.boule4].trim()),
                parseInt(cols[colIndex.boule5].trim()),
            ].sort((a, b) => a - b);
            const chance = parseInt(cols[colIndex.chance].trim());
            if (balls.some(isNaN) || isNaN(chance)) { skippedCount++; continue; }
            draws.push({ id, day, date, balls, chance });
        } catch (e) {
            skippedCount++;
            console.warn(`CSV parsing: ligne ${i} ignorée:`, e.message);
            continue;
        }
    }
    if (skippedCount > 0) {
        console.warn(`CSV parsing: ${skippedCount} ligne(s) ignorée(s) sur ${lines.length - 1}`);
    }
    draws.sort((a, b) => {
        const [ad, am, ay] = a.date.split('/');
        const [bd, bm, by] = b.date.split('/');
        return `${ay}${am}${ad}`.localeCompare(`${by}${bm}${bd}`);
    });
    return draws;
}

export function showStatus(msg) {
    const el = document.getElementById('updateStatus');
    if (el) el.textContent = msg;
}

export async function loadData(initCallback) {
    showStatus('Chargement des données...');

    // Guard against multiple initCallback invocations (P0 fix)
    let initialized = false;
    function safeInit() {
        if (initialized) return;
        initialized = true;
        initCallback();
    }

    // 1) Try cache first
    const cachedTs = localStorage.getItem(CACHE_TS_KEY);
    const cached = localStorage.getItem(CACHE_KEY);
    const cacheValid = cached && cachedTs && (Date.now() - parseInt(cachedTs)) < CACHE_TTL;

    if (cacheValid) {
        try {
            setAllDraws(JSON.parse(cached));
            setFilteredDraws([...allDraws]);
            safeInit();
            showStatus(`${allDraws.length} tirages (cache). Vérification des mises à jour...`);
        } catch (e) {
            console.warn('Cache corrompu, ignoré:', e.message);
        }
    }

    // 2) Try to load from bundled JSON as fallback
    if (!allDraws.length) {
        try {
            const resp = await fetch('data/loto_data.json');
            if (resp.ok) {
                setAllDraws(await resp.json());
                setFilteredDraws([...allDraws]);
                safeInit();
                showStatus(`${allDraws.length} tirages chargés (fichier local). Mise à jour en cours...`);
            }
        } catch (e) {
            console.warn('Chargement JSON local échoué:', e.message);
        }
    }

    // 3) Try to fetch fresh data from FDJ
    try {
        showStatus(allDraws.length ? `${allDraws.length} tirages. Vérification FDJ...` : 'Téléchargement depuis FDJ...');
        const resp = await fetch(FDJ_ZIP_URL);
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);

        const blob = await resp.blob();
        const zip = await JSZip.loadAsync(blob);

        let csvText = null;
        for (const filename of Object.keys(zip.files)) {
            if (filename.endsWith('.csv')) {
                csvText = await zip.files[filename].async('text');
                break;
            }
        }

        if (csvText) {
            const freshDraws = parseCSV(csvText);
            if (freshDraws.length > 0) {
                const oldCount = allDraws.length;
                setAllDraws(freshDraws);
                setFilteredDraws([...allDraws]);

                try {
                    localStorage.setItem(CACHE_KEY, JSON.stringify(allDraws));
                    localStorage.setItem(CACHE_TS_KEY, Date.now().toString());
                } catch (e) {
                    console.warn('Impossible de mettre en cache (localStorage plein):', e.message);
                }

                // After FDJ refresh, re-render (but don't re-attach listeners)
                if (initialized) {
                    // Data updated after init: just re-render active tab
                    const { renderActiveTab, updateSummaryStats } = await import('./render/summary.js');
                    updateSummaryStats();
                    renderActiveTab();
                } else {
                    safeInit();
                }
                const diff = allDraws.length - oldCount;
                if (diff > 0 && oldCount > 0) {
                    showStatus(`✅ Mis à jour ! ${allDraws.length} tirages (+${diff} nouveaux)`);
                } else {
                    showStatus(`✅ ${allDraws.length} tirages — Données à jour`);
                }
            }
        }
    } catch (e) {
        console.warn('FDJ fetch failed:', e);
        if (allDraws.length) {
            showStatus(`⚠️ ${allDraws.length} tirages (dernière mise à jour locale). La FDJ n'est pas accessible actuellement.`);
        } else {
            showStatus('❌ Impossible de charger les données. Rechargez la page.');
        }
    }
}
