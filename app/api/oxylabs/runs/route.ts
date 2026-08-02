import { NextResponse } from 'next/server';
import { getOxylabsScheduleRunsList } from '@/lib/scraping/scheduler';

export async function GET() {
  try {
    const runs = await getOxylabsScheduleRunsList();
    return NextResponse.json({ runs }, { status: 200 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('API Error in GET /api/oxylabs/runs:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
