import { createClient } from '@supabase/supabase-js'
import { Database } from './types'

// Fallback to a valid URL format to prevent build crashes if env vars are missing
const envUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseUrl = (envUrl && envUrl.startsWith('http')) ? envUrl : 'https://placeholder.supabase.co'
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'

console.log('Supabase URL init:', supabaseUrl)

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    console.warn('⚠️ Missing Supabase environment variables. Using placeholders to prevent build crash.')
}

export const supabase = createClient<Database>(supabaseUrl, supabaseKey)
