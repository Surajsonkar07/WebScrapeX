import 'server-only';
import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { ScrapeError } from '@/lib/scrape/safe-fetch';
import { MigrationNeededError } from '@/lib/store/types';

export const json = (data: unknown, init?: number | ResponseInit) =>
    NextResponse.json(data, typeof init === 'number' ? { status: init } : init);

export const unauthorized = () =>
    json({ error: 'Sign in, or send an API key as “Authorization: Bearer wsx_…”.', code: 'unauthorized' }, 401);

/** Maps thrown errors to clean JSON responses; never leaks stack traces or env values. */
export function apiError(e: unknown) {
    if (e instanceof ZodError) {
        return json({ error: e.issues.map((i) => `${i.path.join('.') || 'body'}: ${i.message}`).join('; '), code: 'invalid_request' }, 400);
    }
    if (e instanceof ScrapeError) return json({ error: e.message, code: e.code }, e.status);
    if (e instanceof MigrationNeededError) return json({ error: e.message, code: 'migration_needed' }, 503);
    const message = e instanceof Error ? e.message : 'Unexpected error';
    console.error('[api]', message);
    return json({ error: message, code: 'server_error' }, 500);
}
