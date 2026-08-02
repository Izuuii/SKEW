import { NextResponse } from 'next/server';
import { syncOxylabsSchedules } from '@/lib/scraping/scheduler';
import { getActiveSchedules } from '@/lib/supabase/db';

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
    const summary = await syncOxylabsSchedules();
    return NextResponse.json(summary, { status: 200 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('API Error in POST /api/oxylabs/schedules:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET() {
  try {
    const schedules = await getActiveSchedules();
    return NextResponse.json({ schedules }, { status: 200 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('API Error in GET /api/oxylabs/schedules:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
