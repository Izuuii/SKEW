import { NextResponse } from 'next/server';
import { getRelatedArticles } from '@/lib/supabase/queries/articles';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Missing article ID' },
        { status: 400 }
      );
    }

    const relatedArticles = await getRelatedArticles(id);

    return NextResponse.json({
      success: true,
      data: relatedArticles,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[API /api/articles/[id]/related] Error:', errorMessage);
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}
