import { NextResponse } from 'next/server';
import { getArticlesWithAnalysis } from '@/lib/supabase/db';
import type { BiasLabel } from '@/lib/supabase/types';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const sourceId = searchParams.get('sourceId') || undefined;
    const biasLabel = (searchParams.get('biasLabel') as BiasLabel) || undefined;
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    const result = await getArticlesWithAnalysis({
      sourceId,
      biasLabel,
      limit,
      offset,
    });

    return NextResponse.json({
      success: true,
      count: result.articles.length,
      totalCount: result.totalCount,
      data: result.articles,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}
