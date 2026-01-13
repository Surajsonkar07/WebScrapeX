import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
        return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    try {
        // Fetch from Supabase instead of local file system
        // We need: metadata, raw website info
        const { data: metadata, error: metaError } = await (supabase as any)
            .from('metadata')
            .select('*')
            .eq('website_id', id)
            .single();

        const { data: website, error: webError } = await (supabase as any)
            .from('websites')
            .select('url')
            .eq('id', id)
            .single();

        if (metaError || webError || !metadata) {
            console.error('Supabase Fetch Error:', metaError, webError);
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
