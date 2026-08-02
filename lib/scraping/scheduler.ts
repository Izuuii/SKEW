import {
  getActiveSources,
  upsertSchedule,
  getActiveSchedules,
  insertArticles,
  getExistingArticleUrls,
  createLog,
  recordScheduleRun,
  getSourceById,
  getExistingScheduleRunIds,
} from '../supabase/db';
import type { ArticleInsert, OxylabsSchedule, OxylabsScheduleRun, Source } from '../supabase/types';
import { fetchPageHtml } from './oxylabs';
import { extractCandidateUrls, parseArticleDetail, validateArticleContent } from './parser';
import { createServerClient } from '../supabase/server';

/**
 * Safely parses JSON response containing large 64-bit integer IDs
 * by converting numbers in ID fields to strings before JSON.parse to prevent precision loss.
 */
function parseJsonWithBigIntIds<T = unknown>(jsonText: string): T {
  const sanitized = jsonText.replace(
    /"(id|schedule_id|job_id|run_id)"\s*:\s*(\d+)/g,
    '"$1": "$2"'
  );
  return JSON.parse(sanitized) as T;
}

function getOxylabsAuthHeader(): string {
  const username = process.env.OXY_WSA_USERNAME;
  const password = process.env.OXY_WSA_PASSWORD;
  if (!username || !password) {
    throw new Error(
      'Oxylabs credentials missing: OXY_WSA_USERNAME and OXY_WSA_PASSWORD environment variables are required.'
    );
  }
  return `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`;
}

export interface SyncSchedulesSummary {
  status: 'success' | 'failed';
  activeSourcesCount: number;
  schedulesCreated: number;
  schedulesExisting: number;
  orphansDeactivated: number;
  schedules: OxylabsSchedule[];
}

/**
 * Syncs active source homepages with Oxylabs Scheduler.
 * Creates an hourly schedule for any active source missing a schedule,
 * and deactivates orphan Oxylabs schedules not present in DB.
 */
export async function syncOxylabsSchedules(): Promise<SyncSchedulesSummary> {
  console.log('====================================================');
  console.log('[Oxylabs Scheduler] Syncing active source schedules...');

  const authHeader = getOxylabsAuthHeader();
  const activeSources = await getActiveSources();
  const existingSchedules = await getActiveSchedules();
  const existingSourceMap = new Map<string, OxylabsSchedule>();
  for (const sched of existingSchedules) {
    if (sched.source_id) {
      existingSourceMap.set(sched.source_id, sched);
    }
  }

  let schedulesCreated = 0;
  let schedulesExisting = 0;
  const validScheduleIds: string[] = [];

  // Set schedule end_time to 1 year in the future
  const futureDate = new Date();
  futureDate.setFullYear(futureDate.getFullYear() + 1);
  const endTime = futureDate.toISOString().slice(0, 19).replace('T', ' ');

  for (const source of activeSources) {
    if (existingSourceMap.has(source.id)) {
      const existing = existingSourceMap.get(source.id)!;
      validScheduleIds.push(existing.schedule_id);
      schedulesExisting++;
      console.log(`[Oxylabs Scheduler] Schedule already exists for source ${source.name} (${existing.schedule_id})`);
      continue;
    }

    console.log(`[Oxylabs Scheduler] Creating new schedule for source ${source.name} (${source.listing_url})...`);
    try {
      const res = await fetch('https://data.oxylabs.io/v1/schedules', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: authHeader,
        },
        body: JSON.stringify({
          cron: '0 * * * *',
          items: [
            {
              source: 'universal',
              url: source.listing_url,
            },
          ],
          end_time: endTime,
        }),
      });

      const resText = await res.text();
      if (!res.ok) {
        console.error(`[Oxylabs Scheduler] Failed creating schedule for ${source.name}: ${res.status} ${resText}`);
        continue;
      }

      const resData = parseJsonWithBigIntIds<{ id?: string; schedule_id?: string }>(resText);
      const scheduleId = String(resData.schedule_id || resData.id);

      if (!scheduleId || scheduleId === 'undefined') {
        console.error(`[Oxylabs Scheduler] Could not extract valid schedule ID from response: ${resText}`);
        continue;
      }

      const savedSchedule = await upsertSchedule(source.id, scheduleId, 'active');
      validScheduleIds.push(savedSchedule.schedule_id);
      schedulesCreated++;
      console.log(`[Oxylabs Scheduler] Successfully created schedule ${scheduleId} for source ${source.name}`);
    } catch (err: unknown) {
      console.error(`[Oxylabs Scheduler] Error creating schedule for ${source.name}:`, err);
    }
  }

  // Deactivate remote orphan schedules
  let orphansDeactivated = 0;
  try {
    const listRes = await fetch('https://data.oxylabs.io/v1/schedules', {
      method: 'GET',
      headers: { Authorization: authHeader },
    });

    if (listRes.ok) {
      const listText = await listRes.text();
      type OxylabsListResponse = { schedules?: string[] } | string[];
      const remoteData = parseJsonWithBigIntIds<OxylabsListResponse>(listText);
      const remoteList = Array.isArray(remoteData)
        ? remoteData.map((item: any) => String(typeof item === 'object' ? item.id || item.schedule_id : item))
        : (remoteData.schedules || []).map(String);

      const validSet = new Set(validScheduleIds);

      for (const remoteId of remoteList) {
        if (remoteId && !validSet.has(remoteId)) {
          console.log(`[Oxylabs Scheduler] Deactivating orphan remote schedule ${remoteId}...`);
          const deactivateRes = await fetch(`https://data.oxylabs.io/v1/schedules/${remoteId}/state`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              Authorization: authHeader,
            },
            body: JSON.stringify({ active: false }),
          });

          if (deactivateRes.ok) {
            orphansDeactivated++;
            console.log(`[Oxylabs Scheduler] Deactivated orphan schedule ${remoteId}`);
          } else {
            console.error(`[Oxylabs Scheduler] Failed deactivating orphan schedule ${remoteId}: ${deactivateRes.status}`);
          }
        }
      }
    }
  } catch (orphanErr) {
    console.error('[Oxylabs Scheduler] Error cleaning remote orphan schedules:', orphanErr);
  }

  const updatedSchedules = await getActiveSchedules();
  const summary: SyncSchedulesSummary = {
    status: 'success',
    activeSourcesCount: activeSources.length,
    schedulesCreated,
    schedulesExisting,
    orphansDeactivated,
    schedules: updatedSchedules,
  };

  await createLog('info', 'Oxylabs schedules synced', { ...summary });
  console.log('[Oxylabs Scheduler] Sync completed:', summary);
  console.log('====================================================\n');

  return summary;
}

export interface ProcessScheduledResultsSummary {
  status: 'success' | 'partial' | 'failed';
  schedulesChecked: number;
  runsProcessed: number;
  candidatesFound: number;
  duplicatesSkipped: number;
  articlesInserted: number;
  articlesRejected: number;
  durationMs: number;
}

/**
 * Processes completed scheduled scraper runs.
 * Fetches completed HTML from Oxylabs `/runs`, extracts story card URLs,
 * checks existence in Supabase, scrapes detail pages, validates, and inserts valid articles.
 */
export async function processScheduledResults(): Promise<ProcessScheduledResultsSummary> {
  const startTime = Date.now();
  console.log('====================================================');
  console.log('[Oxylabs Scheduler] Processing scheduled results...');

  const authHeader = getOxylabsAuthHeader();
  const activeSchedules = await getActiveSchedules();

  let totalRunsProcessed = 0;
  let totalCandidatesFound = 0;
  let totalDuplicatesSkipped = 0;
  let totalArticlesInserted = 0;
  let totalArticlesRejected = 0;

  for (const schedule of activeSchedules) {
    let source: Source | null = null;
    if (schedule.source_id) {
      source = await getSourceById(schedule.source_id);
    }
    if (!source || !source.is_active) {
      console.log(`[Oxylabs Scheduler] Skipping schedule ${schedule.schedule_id} (inactive or unknown source)`);
      continue;
    }

    console.log(`\n[Oxylabs Scheduler] Checking runs for schedule ${schedule.schedule_id} (${source.name})...`);

    try {
      // AGENTS.md Rule: Use /runs not /jobs for processing! Filter result_status === 'done'
      const runsRes = await fetch(`https://data.oxylabs.io/v1/schedules/${schedule.schedule_id}/runs`, {
        method: 'GET',
        headers: { Authorization: authHeader },
      });

      if (!runsRes.ok) {
        const errText = await runsRes.text();
        console.error(`[Oxylabs Scheduler] Failed to fetch runs for schedule ${schedule.schedule_id}: ${runsRes.status} ${errText}`);
        continue;
      }

      const runsText = await runsRes.text();
      type OxylabsJobItem = {
        id?: string;
        job_id?: string;
        result_status?: string;
        status?: string;
        created_at?: string;
      };
      type OxylabsRunItem = {
        run_id?: string | number;
        jobs?: OxylabsJobItem[];
        result_status?: string;
        status?: string;
      };
      const runsData = parseJsonWithBigIntIds<OxylabsRunItem[] | { runs?: OxylabsRunItem[] }>(runsText);
      const runsList = Array.isArray(runsData) ? runsData : runsData.runs || [];

      // Extract all completed jobs across runs
      const candidateJobs: Array<{ jobId: string }> = [];
      for (const run of runsList) {
        if (run.jobs && Array.isArray(run.jobs)) {
          for (const job of run.jobs) {
            const status = job.result_status || job.status;
            const jId = String(job.id || job.job_id || '');
            if (status === 'done' && jId) {
              candidateJobs.push({ jobId: jId });
            }
          }
        } else if ((run.result_status || run.status) === 'done') {
          const jId = String(run.job_id || run.run_id || '');
          if (jId) candidateJobs.push({ jobId: jId });
        }
      }

      // Check existing run IDs in DB to prevent re-processing
      const existingRunIds = await getExistingScheduleRunIds(candidateJobs.map((j) => j.jobId));
      const doneJobs = candidateJobs.filter((j) => !existingRunIds.has(j.jobId));

      console.log(`[Oxylabs Scheduler] Found ${doneJobs.length} new completed job(s) for ${source.name}`);

      for (const { jobId } of doneJobs) {
        if (!jobId || jobId === 'undefined') continue;

        console.log(`[Oxylabs Scheduler] Fetching results for job ${jobId}...`);
        const resultsRes = await fetch(`https://data.oxylabs.io/v1/queries/${jobId}/results`, {
          method: 'GET',
          headers: { Authorization: authHeader },
        });

        if (!resultsRes.ok) {
          console.error(`[Oxylabs Scheduler] Failed fetching results for job ${jobId}: ${resultsRes.status}`);
          continue;
        }

        const resultsData = await resultsRes.json();
        const firstResult = resultsData.results?.[0];
        const homepageHtml = firstResult?.content || '';

        if (!homepageHtml) {
          console.warn(`[Oxylabs Scheduler] Empty homepage HTML returned for job ${jobId}`);
          continue;
        }

        totalRunsProcessed++;

        // Scrape-to-insert pipeline execution on scheduled homepage HTML
        const candidateUrls = extractCandidateUrls(homepageHtml, source);
        totalCandidatesFound += candidateUrls.length;
        console.log(`[Oxylabs Scheduler] Found ${candidateUrls.length} candidate links on scheduled ${source.name} homepage.`);

        if (!candidateUrls.length) continue;

        // Dedupe candidate URLs using 15-item chunk filter (AGENTS.md Section 9)
        const existingUrls = await getExistingArticleUrls(candidateUrls);
        const newCandidateUrls = candidateUrls.filter((url) => !existingUrls.has(url));
        totalDuplicatesSkipped += existingUrls.size;

        console.log(
          `[Oxylabs Scheduler] Source ${source.name}: ${existingUrls.size} duplicates skipped, ${newCandidateUrls.length} new URLs to detail scrape.`
        );

        const articlesToInsert: ArticleInsert[] = [];
        const urlsToScrape = newCandidateUrls.slice(0, 5); // Default limit 5 per source

        for (const articleUrl of urlsToScrape) {
          try {
            const detailResult = await fetchPageHtml(articleUrl);
            const parsedData = parseArticleDetail(detailResult.html, articleUrl, source);
            const validation = validateArticleContent(parsedData, articleUrl);

            if (!validation.isValid) {
              totalArticlesRejected++;
              console.log(`[Oxylabs Scheduler] ❌ Article REJECTED (${articleUrl}): ${validation.reason}`);
              continue;
            }

            const validData = validation.data!;
            articlesToInsert.push({
              source_id: source.id,
              original_url: articleUrl,
              canonical_url: validData.canonicalUrl,
              title: validData.title,
              image_url: validData.imageUrl!,
              published_at: validData.publishedAt!,
              raw_text: validData.rawText,
              scraped_at: new Date().toISOString(),
              analyzed_at: null,
            });

            console.log(`[Oxylabs Scheduler] ✅ Article VALIDATED: "${validData.title}"`);
          } catch (detailErr: unknown) {
            console.error(`[Oxylabs Scheduler] Error detail scraping ${articleUrl}:`, detailErr);
          }
        }

        if (articlesToInsert.length > 0) {
          const inserted = await insertArticles(articlesToInsert);
          totalArticlesInserted += inserted.length;
          console.log(`[Oxylabs Scheduler] Successfully inserted ${inserted.length} articles from scheduled job ${jobId}`);
        }

        // Record run execution in DB
        await recordScheduleRun({
          schedule_id: schedule.schedule_id,
          run_id: jobId,
          status: 'done',
          completed_at: new Date().toISOString(),
        });
      }
    } catch (schedErr) {
      console.error(`[Oxylabs Scheduler] Error processing schedule ${schedule.schedule_id}:`, schedErr);
    }
  }

  const durationMs = Date.now() - startTime;
  const summary: ProcessScheduledResultsSummary = {
    status: totalArticlesInserted > 0 ? 'success' : 'partial',
    schedulesChecked: activeSchedules.length,
    runsProcessed: totalRunsProcessed,
    candidatesFound: totalCandidatesFound,
    duplicatesSkipped: totalDuplicatesSkipped,
    articlesInserted: totalArticlesInserted,
    articlesRejected: totalArticlesRejected,
    durationMs,
  };

  await createLog('info', 'Scheduled results processed', { ...summary });
  console.log('[Oxylabs Scheduler] Processing finished:', summary);
  console.log('====================================================\n');

  return summary;
}

/**
 * Returns recorded schedule runs from Supabase database.
 */
import { createServiceRoleClient } from '../supabase/server';

export async function getOxylabsScheduleRunsList(limit = 50): Promise<OxylabsScheduleRun[]> {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from('oxylabs_schedule_runs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching Oxylabs schedule runs:', error);
    return [];
  }

  return (data || []) as OxylabsScheduleRun[];
}
