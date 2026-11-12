export function relativeTime(iso: string | null | undefined, now = Date.now()): string {
    if (!iso) return '—';
    const diff = Math.round((now - Date.parse(iso)) / 1000);
    if (diff < 45) return 'just now';
    const units: Array<[number, Intl.RelativeTimeFormatUnit]> = [
        [60, 'minute'],
        [3600, 'hour'],
        [86400, 'day'],
        [604800, 'week'],
        [2629800, 'month'],
        [31557600, 'year'],
    ];
    const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
    let unit: Intl.RelativeTimeFormatUnit = 'minute';
    let size = 60;
    for (const [s, u] of units) {
        if (diff >= s) {
            size = s;
            unit = u;
        }
    }
    return rtf.format(-Math.round(diff / size), unit);
}

export function formatDate(iso: string | null | undefined): string {
    if (!iso) return '—';
    return new Intl.DateTimeFormat('en', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(iso));
}

export function formatBytes(n: number): string {
    if (n < 1024) return `${n} B`;
    if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
    return `${(n / 1024 / 1024).toFixed(2)} MB`;
}

export function formatMs(ms: number): string {
    return ms < 1000 ? `${ms} ms` : `${(ms / 1000).toFixed(1)} s`;
}

export function hostOf(url: string): string {
    try {
        return new URL(url).host.replace(/^www\./, '');
    } catch {
        return url;
    }
}
