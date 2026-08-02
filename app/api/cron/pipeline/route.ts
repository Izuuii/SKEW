import { NextResponse } from 'next/server';
import { processScheduledResults } from '@/lib/scraping/scheduler';
import { runAnalysisPipeline } from '@/lib/ai/analysis';

export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  const isProd = process.env.NODE_ENV === 'production';

  // In production / when CRON_SECRET is defined, verify Authorization header
  if (cronSecret || isProd) {
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized: missing or invalid CRON_SECRET authorization.' },
        { status: 401 }
      );
    }
  }

  console.log('====================================================');
  console.log('[Cron Pipeline] Triggering automatic hourly pipeline...');

  let scrapingSummary = null;
  let scrapingError = null;

  // Step 1: Process scheduled Oxylabs results
  try {
    console.log('[Cron Pipeline] Step 1: Processing scheduled scraping results...');
    scrapingSummary = await processScheduledResults();
  } catch (err: unknown) {
    scrapingError = err instanceof Error ? err.message : 'Unknown error during scraping';
    console.error('[Cron Pipeline] ⚠️ Step 1 failed:', err);
  }

  // Step 2: Run AI analysis on pending articles (must run even if Step 1 failed)
  let aiSummary = null;
  let aiError = null;
  try {
    console.log('[Cron Pipeline] Step 2: Running AI analysis on pending articles...');
    aiSummary = await runAnalysisPipeline();
  } catch (err: unknown) {
    aiError = err instanceof Error ? err.message : 'Unknown error during AI analysis';
    console.error('[Cron Pipeline] ⚠️ Step 2 failed:', err);
  }

  console.log('[Cron Pipeline] Hourly pipeline completed.');
  console.log('====================================================\n');

  return NextResponse.json(
    {
      status: scrapingError || aiError ? 'partial' : 'completed',
      timestamp: new Date().toISOString(),
      scraping: {
        summary: scrapingSummary,
        error: scrapingError,
      },
      aiAnalysis: {
        summary: aiSummary,
        error: aiError,
      },
    },
    { status: 200 }
  );
}
