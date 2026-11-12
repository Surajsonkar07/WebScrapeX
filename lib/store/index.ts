import 'server-only';
import { supabaseEnabled } from '@/lib/env';
import { localStore } from './local';
import { supabaseStore } from './supabase';
import type { Store } from './types';

export function getStore(): Store {
    return supabaseEnabled ? supabaseStore : localStore;
}

export * from './types';
