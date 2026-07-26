import { NextResponse } from 'next/server';
import { runAnalysisPipeline } from '@/lib/ai/analysis';

export async function POST(request: Request) {
  // AGENTS.md Section 15 Rule: Admin Secret protection
  const adminSecretHeader = request.headers.get('x-biasly-admin-secret');
  const expectedSecret = process.env.BIASLY_ADMIN_SECRET;

  if (!expectedSecret || adminSecretHeader !== expectedSecret) {
    return NextResponse.json(
      { error: 'Unauthorized: missing or invalid admin secret' },
      { status: 401 }
    );
  }

  try {
    let body: { limit?: number; articleIds?: string[] } = {};
    try {
      body = await request.json();
    } catch {
      // Body is optional
    }

    const { limit, articleIds } = body;

    const summary = await runAnalysisPipeline({
      limit: typeof limit === 'number' && limit > 0 ? limit : undefined,
      articleIds: Array.isArray(articleIds) && articleIds.length > 0 ? articleIds : undefined,
    });

    return NextResponse.json(summary, { status: 200 });
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error('[API /api/analyze] Internal server error:', errorMsg);

    return NextResponse.json(
      { error: 'Failed to run AI analysis pipeline', details: errorMsg },
      { status: 500 }
    );
  }
}
