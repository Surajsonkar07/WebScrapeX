import { NextRequest, NextResponse } from 'next/server';
import { supabase, supabaseAdmin } from '@/lib/supabase';
import { createServerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
        return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    // Verify Session
    const cookieStore = await cookies();
    const supabaseAuth = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get(name: string) {
                    return cookieStore.get(name)?.value;
                },
                set(name: string, value: string, options: any) {
                    cookieStore.set({ name, value, ...options });
                },
                remove(name: string, options: any) {
                    cookieStore.set({ name, value: '', ...options });
                },
            },
        }
    );
    const { data: { session } } = await supabaseAuth.auth.getSession();

    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const client = (supabaseAdmin || supabase) as any;

        // Check ownership first
        const { data: website, error: webError } = await (supabase as any)
            .from('websites')
            .select('url, user_id')
            .eq('id', id)
            .single();

        if (webError || !website) {
            return NextResponse.json({ error: 'Website not found' }, { status: 404 });
        }

        if (website.user_id !== session.user.id) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // Fetch Metadata
        const { data: metadata, error: metaError } = await client
            .from('metadata')
            .select('*')
            .eq('website_id', id)
            .single();

        if (metaError || !metadata) {
            console.error('Supabase Fetch Error:', metaError);
            return NextResponse.json({ error: 'Content not found' }, { status: 404 });
        }

        // Reconstruct the ScrapeResult shape as best as possible from DB
        const result = {
            url: website?.url || '',
            metadata: {
                title: metadata.title || '',
                description: metadata.description || '',
                keywords: metadata.keywords || [],
                favicon: metadata.favicon || ''
            },
            colors: metadata.color_palette || [],
            fonts: metadata.fonts || [],
            images: (metadata.images || []).map((url: string) => ({ url })),
            technologies: metadata.technologies || [],
            // These fields might be empty if not stored in DB, but this prevents the 500 crash
            cssFiles: [],
            jsFiles: [],
            html: '',
            links: [],
            rawAssets: []
        };

        return NextResponse.json(result);

    } catch (error) {
        console.error('Content API Error:', error);
        return NextResponse.json({ error: 'Failed to retrieve content' }, { status: 500 });
    }
}
