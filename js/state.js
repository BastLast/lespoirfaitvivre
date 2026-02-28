// Shared application state
// Note: ES Module live bindings are used intentionally here.
// Mutations happen only through the setter functions below.
// Do NOT reassign these exports directly from other modules.
export let allDraws = [];
export let filteredDraws = [];
export const charts = {};
export let retroDone = false;

export const FDJ_ZIP_URL = 'https://www.sto.api.fdj.fr/anonymous/service-draw-info/v3/documentations/1a2b3c4d-9876-4562-b3fc-2c963f66afp6';
export const CACHE_KEY = 'loto_draws_cache';
export const CACHE_TS_KEY = 'loto_cache_ts';
export const CACHE_TTL = 6 * 60 * 60 * 1000; // 6h

export function setAllDraws(draws) {
    allDraws = draws;
}

export function setFilteredDraws(draws) {
    filteredDraws = draws;
}

export function setRetroDone(val) {
    retroDone = val;
}
