import { NextRequest, NextResponse } from 'next/server';
import { runScrapingPipeline } from '@/lib/scraping/pipeline';

export async function POST(req: NextRequest) {
  // AGENTS.md Section 15 Rule:
  // Required admin secret sent via x-biasly-admin-secret header. Store in BIASLY_ADMIN_SECRET env var.
  const reqSecret = req.headers.get('x-biasly-admin-secret');
  const expectedSecret = process.env.BIASLY_ADMIN_SECRET;

  if (!expectedSecret || !reqSecret || reqSecret !== expectedSecret) {
    return NextResponse.json(
      { error: 'Unauthorized: missing or invalid x-biasly-admin-secret header' },
      { status: 401 }
    );
  }

  try {
    let body: { sourceIds?: string[]; limitPerSource?: number } = {};
    try {
      body = await req.json();
    } catch {
      // Body is optional
    }

    const summary = await runScrapingPipeline({
      sourceIds: body.sourceIds,
      limitPerSource: body.limitPerSource,
    });

    return NextResponse.json(summary, { status: 200 });
  } catch (err: unknown) {
    console.error('Error executing POST /api/scrape:', err);
    const errorMessage = err instanceof Error ? err.message : 'Internal server error running scraping pipeline';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
