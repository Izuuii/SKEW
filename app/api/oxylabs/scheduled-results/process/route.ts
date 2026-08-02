import { NextResponse } from 'next/server';
import { processScheduledResults } from '@/lib/scraping/scheduler';

export async function POST(request: Request) {
  const adminSecret = request.headers.get('x-biasly-admin-secret');
  const expectedSecret = process.env.BIASLY_ADMIN_SECRET;

  if (!expectedSecret || adminSecret !== expectedSecret) {
    return NextResponse.json(
      { error: 'Unauthorized: missing or invalid x-biasly-admin-secret header.' },
      { status: 401 }
    );
  }

  try {
    const summary = await processScheduledResults();
    return NextResponse.json(summary, { status: 200 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('API Error in POST /api/oxylabs/scheduled-results/process:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
