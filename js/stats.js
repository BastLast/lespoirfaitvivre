/**
 * Unified single-pass computation over draws.
 * Returns { freq, chanceFreq, retards, chanceRetards } in O(N).
 */
export function computeAllStats(draws) {
    const freq = {};
    for (let i = 1; i <= 49; i++) freq[i] = 0;
    const chanceFreq = {};
    for (let i = 1; i <= 10; i++) chanceFreq[i] = 0;
    const lastSeen = {};
    for (let i = 1; i <= 49; i++) lastSeen[i] = -1;
    const lastSeenCh = {};
    for (let i = 1; i <= 10; i++) lastSeenCh[i] = -1;

    draws.forEach((d, idx) => {
        d.balls.forEach(b => { freq[b]++; lastSeen[b] = idx; });
        chanceFreq[d.chance]++;
        lastSeenCh[d.chance] = idx;
    });

    const len = draws.length;
    const retards = {};
    for (let i = 1; i <= 49; i++) retards[i] = lastSeen[i] === -1 ? len : (len - 1 - lastSeen[i]);
    const chanceRetards = {};
    for (let i = 1; i <= 10; i++) chanceRetards[i] = lastSeenCh[i] === -1 ? len : (len - 1 - lastSeenCh[i]);

    return { freq, chanceFreq, retards, chanceRetards };
}

export function computeFrequencies(draws) {
    const freq = {};
    for (let i = 1; i <= 49; i++) freq[i] = 0;
    draws.forEach(d => d.balls.forEach(b => freq[b]++));
    return freq;
}

export function computeChanceFreq(draws) {
    const freq = {};
    for (let i = 1; i <= 10; i++) freq[i] = 0;
    draws.forEach(d => freq[d.chance]++);
    return freq;
}

export function computeRetards(draws) {
    const ret = {};
    const len = draws.length;
    for (let i = 1; i <= 49; i++) ret[i] = len;
    for (let idx = len - 1; idx >= 0; idx--) {
        draws[idx].balls.forEach(b => {
            const r = len - 1 - idx;
            if (r < ret[b]) ret[b] = r;
        });
    }
    return ret;
}

export function computeChanceRetards(draws) {
    const ret = {};
    const len = draws.length;
    for (let i = 1; i <= 10; i++) ret[i] = len;
    for (let idx = len - 1; idx >= 0; idx--) {
        const r = len - 1 - idx;
        if (r < ret[draws[idx].chance]) ret[draws[idx].chance] = r;
    }
    return ret;
}

export function computeMaxRetards(draws) {
    const maxRet = {};
    const lastSeen = {};
    for (let i = 1; i <= 49; i++) { maxRet[i] = 0; lastSeen[i] = -1; }
    draws.forEach((d, idx) => {
        d.balls.forEach(b => {
            if (lastSeen[b] >= 0) {
                const gap = idx - lastSeen[b];
                if (gap > maxRet[b]) maxRet[b] = gap;
            }
            lastSeen[b] = idx;
        });
    });
    for (let i = 1; i <= 49; i++) {
        const finalRetard = draws.length - 1 - lastSeen[i];
        if (lastSeen[i] === -1) maxRet[i] = draws.length;
        else if (finalRetard > maxRet[i]) maxRet[i] = finalRetard;
    }
    return maxRet;
}

export function computePairs(draws) {
    const pairs = {};
    draws.forEach(d => {
        for (let i = 0; i < d.balls.length; i++) {
            for (let j = i + 1; j < d.balls.length; j++) {
                const key = `${d.balls[i]}-${d.balls[j]}`;
                pairs[key] = (pairs[key] || 0) + 1;
            }
        }
    });
    return pairs;
}

export function computeTriplets(draws) {
    const trips = {};
    draws.forEach(d => {
        for (let i = 0; i < d.balls.length; i++) {
            for (let j = i + 1; j < d.balls.length; j++) {
                for (let k = j + 1; k < d.balls.length; k++) {
                    const key = `${d.balls[i]}-${d.balls[j]}-${d.balls[k]}`;
                    trips[key] = (trips[key] || 0) + 1;
                }
            }
        }
    });
    return trips;
}
