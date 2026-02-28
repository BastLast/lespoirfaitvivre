import { allDraws, filteredDraws, charts, setAllDraws, setFilteredDraws, FDJ_ZIP_URL, CACHE_KEY, CACHE_TS_KEY, CACHE_TTL } from './state.js';

export function parseCSV(csvText) {
    const lines = csvText.split('\n').filter(l => l.trim());
    if (lines.length < 2) return [];
    const draws = [];
    for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(';');
        if (cols.length < 10) continue;
        try {
            const id = cols[0].trim();
            const day = cols[1].trim();
            const date = cols[2].trim();
            const balls = [
                parseInt(cols[4].trim()),
                parseInt(cols[5].trim()),
                parseInt(cols[6].trim()),
                parseInt(cols[7].trim()),
                parseInt(cols[8].trim()),
            ].sort((a, b) => a - b);
            const chance = parseInt(cols[9].trim());
            if (balls.some(isNaN) || isNaN(chance)) continue;
            draws.push({ id, day, date, balls, chance });
        } catch (e) { continue; }
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

    // 1) Try cache first
    const cachedTs = localStorage.getItem(CACHE_TS_KEY);
    const cached = localStorage.getItem(CACHE_KEY);
    const cacheValid = cached && cachedTs && (Date.now() - parseInt(cachedTs)) < CACHE_TTL;

    if (cacheValid) {
        try {
            setAllDraws(JSON.parse(cached));
            setFilteredDraws([...allDraws]);
            initCallback();
            showStatus(`${allDraws.length} tirages (cache). Vérification des mises à jour...`);
        } catch (e) { /* cache corrupted, continue */ }
    }

    // 2) Try to load from bundled JSON as fallback
    if (!allDraws.length) {
        try {
            const resp = await fetch('data/loto_data.json');
            if (resp.ok) {
                setAllDraws(await resp.json());
                setFilteredDraws([...allDraws]);
                initCallback();
                showStatus(`${allDraws.length} tirages chargés (fichier local). Mise à jour en cours...`);
            }
        } catch (e) { /* no local file, continue */ }
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
                } catch (e) { /* localStorage full */ }

                initCallback();
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
