'use client';

import { useCallback, useSyncExternalStore } from 'react';

/** Per-browser scrape defaults (Settings → Scrape defaults). */
export interface ScrapeDefaults {
    mode?: string;
    engine?: string;
}

const KEY = 'wsx:defaults';
const EVENT = 'wsx:defaults-change';

function subscribe(cb: () => void) {
    window.addEventListener('storage', cb);
    window.addEventListener(EVENT, cb);
    return () => {
        window.removeEventListener('storage', cb);
        window.removeEventListener(EVENT, cb);
    };
}

const read = () => {
    try {
        return localStorage.getItem(KEY) ?? '{}';
    } catch {
        return '{}';
    }
};

export function readDefaults(): ScrapeDefaults {
    try {
        return JSON.parse(read());
    } catch {
        return {};
    }
}

export function useScrapeDefaults(): [ScrapeDefaults, (patch: ScrapeDefaults) => void] {
    const raw = useSyncExternalStore(subscribe, read, () => '{}');
    let value: ScrapeDefaults = {};
    try {
        value = JSON.parse(raw);
    } catch {
        /* keep empty */
    }
    const save = useCallback((patch: ScrapeDefaults) => {
        try {
            localStorage.setItem(KEY, JSON.stringify({ ...readDefaults(), ...patch }));
            window.dispatchEvent(new Event(EVENT));
        } catch {
            /* storage unavailable */
        }
    }, []);
    return [value, save];
}
