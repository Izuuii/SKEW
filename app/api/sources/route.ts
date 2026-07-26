import { NextResponse } from 'next/server';
import { getActiveSources, getAllSources } from '@/lib/supabase/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const all = searchParams.get('all') === 'true';

    const sources = all ? await getAllSources() : await getActiveSources();

    return NextResponse.json({
      success: true,
      count: sources.length,
      data: sources,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}
