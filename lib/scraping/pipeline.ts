import { getActiveSources, getExistingArticleUrls, insertArticles, createLog } from '../supabase/db';
import type { ArticleInsert, Source } from '../supabase/types';
import { fetchPageHtml } from './oxylabs';
import { extractCandidateUrls, parseArticleDetail, validateArticleContent } from './parser';

export interface ScrapingPipelineOptions {
  sourceIds?: string[];
  limitPerSource?: number;
}

export interface ScrapingPipelineSummary {
  status: 'success' | 'failed' | 'partial';
  sourcesChecked: number;
  candidatesFound: number;
  candidatesRejected: number;
  duplicatesSkipped: number;
  detailPagesScraped: number;
  articlesInserted: number;
  articlesRejected: number;
  articlesFailed: number;
  totalDurationMs: number;
  rejectionReasons: Record<string, number>;
  sourceDetails: Array<{
    sourceName: string;
    candidatesFound: number;
    articlesInserted: number;
    error?: string;
  }>;
}

export async function runScrapingPipeline(
  options?: ScrapingPipelineOptions
): Promise<ScrapingPipelineSummary> {
  const startTime = Date.now();
  const limitPerSource = options?.limitPerSource || 5;

  console.log('====================================================');
  console.log('[Scraping Pipeline] Starting manual scrape run...');
  console.log(`[Scraping Pipeline] Limit per source: ${limitPerSource}`);

  await createLog('info', 'Scraping pipeline started', {
    limitPerSource,
    sourceIds: options?.sourceIds || 'all_active',
  });

  // 1. Fetch active sources from Supabase
  let activeSources: Source[] = [];
  try {
    activeSources = await getActiveSources();
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : 'Unknown error';
    console.error('[Scraping Pipeline] Failed to load active sources:', err);
    await createLog('error', 'Failed to load active sources', { error: errMsg });
    return {
      status: 'failed',
      sourcesChecked: 0,
      candidatesFound: 0,
      candidatesRejected: 0,
      duplicatesSkipped: 0,
      detailPagesScraped: 0,
      articlesInserted: 0,
      articlesRejected: 0,
      articlesFailed: 0,
      totalDurationMs: Date.now() - startTime,
      rejectionReasons: { 'Database error loading sources': 1 },
      sourceDetails: [],
    };
  }

  // Filter sources if sourceIds is specified
  if (options?.sourceIds && options.sourceIds.length > 0) {
    const targetSet = new Set(options.sourceIds);
    activeSources = activeSources.filter((s) => targetSet.has(s.id));
  }

  console.log(
    `[Scraping Pipeline] Active sources selected (${activeSources.length}): ${activeSources.map((s) => s.name).join(', ')}`
  );

  let totalCandidatesFound = 0;
  const totalCandidatesRejected = 0;
  let totalDuplicatesSkipped = 0;
  let totalDetailPagesScraped = 0;
  let totalArticlesInserted = 0;
  let totalArticlesRejected = 0;
  let totalArticlesFailed = 0;
  const rejectionReasons: Record<string, number> = {};

  const sourceDetails: ScrapingPipelineSummary['sourceDetails'] = [];
  const articlesToInsert: ArticleInsert[] = [];

  const trackRejection = (reason: string) => {
    rejectionReasons[reason] = (rejectionReasons[reason] || 0) + 1;
  };

  // Process each selected active source
  for (const source of activeSources) {
    console.log(`\n----------------------------------------------------`);
    console.log(`[Scraping Pipeline] Processing source: ${source.name} (${source.listing_url})`);

    let sourceCandidatesFound = 0;
    let sourceInserted = 0;

    try {
      // 2. Fetch homepage via Oxylabs Realtime API
      console.log(`[Scraping Pipeline] Fetching homepage HTML for ${source.name}...`);
      const homepageResult = await fetchPageHtml(source.listing_url);

      // 3. Extract candidate URLs from story cards
      const candidateUrls = extractCandidateUrls(homepageResult.html, source);
      sourceCandidatesFound = candidateUrls.length;
      totalCandidatesFound += candidateUrls.length;

      console.log(
        `[Scraping Pipeline] Found ${candidateUrls.length} article candidate URLs on ${source.name} homepage.`
      );

      if (candidateUrls.length === 0) {
        sourceDetails.push({
          sourceName: source.name,
          candidatesFound: 0,
          articlesInserted: 0,
        });
        continue;
      }

      // 5. Query Supabase to check existing URLs in small 15-item chunks (AGENTS.md Section 9)
      const existingUrls = await getExistingArticleUrls(candidateUrls);
      const newCandidateUrls: string[] = [];

      for (const candidateUrl of candidateUrls) {
        if (existingUrls.has(candidateUrl)) {
          totalDuplicatesSkipped++;
        } else {
          newCandidateUrls.push(candidateUrl);
        }
      }

      console.log(
        `[Scraping Pipeline] Source ${source.name}: ${existingUrls.size} duplicates skipped, ${newCandidateUrls.length} new candidate URLs to process.`
      );

      // Limit candidates per source
      const urlsToScrape = newCandidateUrls.slice(0, limitPerSource);

      // 6. Scrape detail pages
      for (const articleUrl of urlsToScrape) {
        totalDetailPagesScraped++;
        console.log(`[Scraping Pipeline] Detail scraping: ${articleUrl}`);

        try {
          const detailResult = await fetchPageHtml(articleUrl);
          const parsedData = parseArticleDetail(detailResult.html, articleUrl, source);
          const validation = validateArticleContent(parsedData, articleUrl);

          if (!validation.isValid) {
            totalArticlesRejected++;
            const reason = validation.reason || 'Failed content validation';
            trackRejection(reason);
            console.log(
              `[Scraping Pipeline] ❌ Article REJECTED (${articleUrl}): ${reason}`
            );
            continue;
          }

          const validData = validation.data!;
          const articleInsert: ArticleInsert = {
            source_id: source.id,
            original_url: articleUrl,
            canonical_url: validData.canonicalUrl,
            title: validData.title,
            image_url: validData.imageUrl!,
            published_at: validData.publishedAt!,
            raw_text: validData.rawText,
            scraped_at: new Date().toISOString(),
            analyzed_at: null,
          };

          articlesToInsert.push(articleInsert);
          sourceInserted++;
          console.log(`[Scraping Pipeline] ✅ Article VALIDATED: "${validData.title}"`);
        } catch (detailErr: unknown) {
          totalArticlesFailed++;
          const errMsg = detailErr instanceof Error ? detailErr.message : 'Unknown fetch error';
          trackRejection(`Detail fetch error: ${errMsg}`);
          console.error(`[Scraping Pipeline] ⚠️ Detail page scrape failed (${articleUrl}):`, errMsg);
        }
      }

      sourceDetails.push({
        sourceName: source.name,
        candidatesFound: sourceCandidatesFound,
        articlesInserted: sourceInserted,
      });
    } catch (sourceErr: unknown) {
      const errMsg = sourceErr instanceof Error ? sourceErr.message : 'Unknown source error';
      console.error(`[Scraping Pipeline] Error processing source ${source.name}:`, sourceErr);
      sourceDetails.push({
        sourceName: source.name,
        candidatesFound: 0,
        articlesInserted: 0,
        error: errMsg,
      });
    }
  }

  // 8. Insert valid articles into Supabase (append-only)
  if (articlesToInsert.length > 0) {
    console.log(`\n[Scraping Pipeline] Inserting ${articlesToInsert.length} valid articles into Supabase...`);
    try {
      const inserted = await insertArticles(articlesToInsert);
      totalArticlesInserted = inserted.length;
      console.log(`[Scraping Pipeline] Successfully inserted ${inserted.length} articles!`);
    } catch (insertErr: unknown) {
      const errMsg = insertErr instanceof Error ? insertErr.message : 'Unknown insertion error';
      console.error('[Scraping Pipeline] Database insertion error:', insertErr);
      await createLog('error', 'Failed to insert scraped articles', { error: errMsg });
      totalArticlesFailed += articlesToInsert.length;
    }
  } else {
    console.log('\n[Scraping Pipeline] No new valid articles were ready for insertion.');
  }

  const duration = Date.now() - startTime;
  const status: ScrapingPipelineSummary['status'] =
    totalArticlesInserted > 0 ? 'success' : totalArticlesFailed > 0 ? 'partial' : 'success';

  const summary: ScrapingPipelineSummary = {
    status,
    sourcesChecked: activeSources.length,
    candidatesFound: totalCandidatesFound,
    candidatesRejected: totalCandidatesRejected,
    duplicatesSkipped: totalDuplicatesSkipped,
    detailPagesScraped: totalDetailPagesScraped,
    articlesInserted: totalArticlesInserted,
    articlesRejected: totalArticlesRejected,
    articlesFailed: totalArticlesFailed,
    totalDurationMs: duration,
    rejectionReasons,
    sourceDetails,
  };

  console.log('\n====================================================');
  console.log('[Scraping Pipeline] Run Summary:');
  console.log(JSON.stringify(summary, null, 2));
  console.log('====================================================\n');

  await createLog('info', `Scraping pipeline completed with status: ${status}`, {
    ...summary,
  });

  return summary;
}
