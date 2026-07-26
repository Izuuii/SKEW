import { createServiceRoleClient, createServerClient } from './server';
import type {
  Source,
  SourceInsert,
  Article,
  ArticleInsert,
  ArticleAnalysis,
  ArticleAnalysisInsert,
  ArticleWithAnalysis,
  Log,
  LogLevel,
  OxylabsSchedule,
  OxylabsScheduleRun,
  OxylabsScheduleRunInsert,
  BiasLabel,
} from './types';

// ==========================================
// SOURCES DATA ACCESS
// ==========================================

export async function getActiveSources(): Promise<Source[]> {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from('sources')
    .select('*')
    .eq('is_active', true)
    .order('name');

  if (error) {
    console.error('Error fetching active sources:', error);
    throw new Error(`Failed to fetch active sources: ${error.message}`);
  }

  const rawSources = (data || []) as Source[];
  const seen = new Set<string>();
  const uniqueSources: Source[] = [];

  for (const s of rawSources) {
    const key = (s.listing_url || s.name).toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      uniqueSources.push(s);
    }
  }

  return uniqueSources;
}

export async function getAllSources(): Promise<Source[]> {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from('sources')
    .select('*')
    .order('name');

  if (error) {
    console.error('Error fetching all sources:', error);
    throw new Error(`Failed to fetch sources: ${error.message}`);
  }

  return (data || []) as Source[];
}

export async function getSourceById(id: string): Promise<Source | null> {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from('sources')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // Not found
    console.error('Error fetching source by ID:', error);
    throw error;
  }

  return data as Source;
}

export async function createSource(source: SourceInsert): Promise<Source> {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from('sources')
    .insert(source)
    .select()
    .single();

  if (error) {
    console.error('Error creating source:', error);
    throw new Error(`Failed to create source: ${error.message}`);
  }

  return data as Source;
}

// ==========================================
// ARTICLES DATA ACCESS
// ==========================================

export async function getExistingArticleUrls(urls: string[]): Promise<Set<string>> {
  if (!urls.length) return new Set();

  const supabase = createServerClient();
  const existingUrls = new Set<string>();

  // AGENTS.md Section 9 Rule: Query in small chunks of max 15 URLs per .in() filter
  const CHUNK_SIZE = 15;
  for (let i = 0; i < urls.length; i += CHUNK_SIZE) {
    const chunk = urls.slice(i, i + CHUNK_SIZE);
    const { data, error } = await supabase
      .from('articles')
      .select('original_url')
      .in('original_url', chunk);

    if (error) {
      console.error('Error checking existing article URLs:', error);
      continue;
    }

    if (data) {
      for (const row of data as Array<{ original_url: string }>) {
        existingUrls.add(row.original_url);
      }
    }
  }

  return existingUrls;
}

export async function insertArticles(articles: ArticleInsert[]): Promise<Article[]> {
  if (!articles.length) return [];

  // Deduplicate array in memory by original_url before inserting
  const uniqueMap = new Map<string, ArticleInsert>();
  for (const art of articles) {
    if (!uniqueMap.has(art.original_url)) {
      uniqueMap.set(art.original_url, art);
    }
  }
  const uniqueArticles = Array.from(uniqueMap.values());

  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from('articles')
    .upsert(uniqueArticles, { onConflict: 'original_url', ignoreDuplicates: true })
    .select();

  if (error) {
    console.error('Error inserting articles:', error);
    throw new Error(`Failed to insert articles: ${error.message}`);
  }

  return (data || []) as Article[];
}

export async function getArticlesWithAnalysis(options?: {
  sourceId?: string;
  biasLabel?: BiasLabel;
  limit?: number;
  offset?: number;
}): Promise<{ articles: ArticleWithAnalysis[]; totalCount: number }> {
  const supabase = createServerClient();
  const limit = options?.limit || 20;
  const offset = options?.offset || 0;

  let query = supabase
    .from('articles')
    .select(
      `
      *,
      source:sources(*),
      article_analyses(*)
    `,
      { count: 'exact' }
    )
    .not('analyzed_at', 'is', null)
    .order('published_at', { ascending: false });

  if (options?.sourceId) {
    query = query.eq('source_id', options.sourceId);
  }

  const { data, error, count } = await query.range(offset, offset + limit - 1);

  if (error) {
    console.error('Error fetching articles with analysis:', error);
    throw new Error(`Failed to fetch articles: ${error.message}`);
  }

  type RawArticleRow = Article & {
    source?: Source | Source[];
    article_analyses?: ArticleAnalysis | ArticleAnalysis[];
  };

  let formatted = ((data || []) as unknown as RawArticleRow[]).map((row) => {
    const rawAnalysis = Array.isArray(row.article_analyses)
      ? row.article_analyses[0]
      : row.article_analyses;

    const rawSource = Array.isArray(row.source)
      ? row.source[0]
      : row.source;

    return {
      ...row,
      source: rawSource,
      analysis: rawAnalysis || undefined,
    } as ArticleWithAnalysis;
  });

  if (options?.biasLabel) {
    formatted = formatted.filter(
      (art) => art.analysis && art.analysis.bias_label === options.biasLabel
    );
  }

  return {
    articles: formatted,
    totalCount: count || formatted.length,
  };
}

export async function getArticleById(id: string): Promise<ArticleWithAnalysis | null> {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from('articles')
    .select(
      `
      *,
      source:sources(*),
      article_analyses(*)
    `
    )
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    console.error('Error fetching article by ID:', error);
    throw error;
  }

  type RawArticleRow = Article & {
    source?: Source | Source[];
    article_analyses?: ArticleAnalysis | ArticleAnalysis[];
  };

  const row = data as unknown as RawArticleRow;
  const rawAnalysis = Array.isArray(row.article_analyses)
    ? row.article_analyses[0]
    : row.article_analyses;

  const rawSource = Array.isArray(row.source)
    ? row.source[0]
    : row.source;

  return {
    ...row,
    source: rawSource,
    analysis: rawAnalysis || undefined,
  } as ArticleWithAnalysis;
}

/**
 * AGENTS.md Section 19 Rule:
 * Pending-analysis check — detect pending articles by LEFT JOINing articles to article_analyses.
 * Never rely on analyzed_at IS NULL alone.
 * An article is pending when no article_analyses row exists for it.
 */
export async function getPendingAnalysisArticles(limit?: number): Promise<Article[]> {
  const supabase = createServiceRoleClient();

  const { data, error } = await supabase
    .from('articles')
    .select(
      `
      *,
      article_analyses!left(id)
    `
    )
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching pending analysis articles:', error);
    throw new Error(`Failed to fetch pending articles: ${error.message}`);
  }

  type JoinedArticleRow = Article & {
    article_analyses?: { id: string } | Array<{ id: string }> | null;
  };

  const rows = (data || []) as unknown as JoinedArticleRow[];

  // Filter rows where article_analyses is null or empty
  const pending = rows.filter((art) => {
    const analyses = art.article_analyses;
    if (!analyses) return true;
    if (Array.isArray(analyses) && analyses.length === 0) return true;
    return false;
  });

  const finalPending = pending.map((art) => {
    const { article_analyses, ...article } = art;
    return article as Article;
  });

  if (limit && limit > 0) {
    return finalPending.slice(0, limit);
  }

  return finalPending;
}

// ==========================================
// ARTICLE ANALYSES DATA ACCESS
// ==========================================

export async function saveArticleAnalysis(
  analysis: ArticleAnalysisInsert
): Promise<ArticleAnalysis> {
  const supabase = createServiceRoleClient();

  // 1. Insert analysis record
  const { data, error } = await supabase
    .from('article_analyses')
    .upsert(analysis, { onConflict: 'article_id' })
    .select()
    .single();

  if (error) {
    console.error('Error saving article analysis:', error);
    throw new Error(`Failed to save article analysis: ${error.message}`);
  }

  // 2. Mark article as analyzed
  const { error: updateError } = await supabase
    .from('articles')
    .update({ analyzed_at: new Date().toISOString() })
    .eq('id', analysis.article_id);

  if (updateError) {
    console.error('Error updating article analyzed_at:', updateError);
  }

  return data as ArticleAnalysis;
}

// ==========================================
// LOGS DATA ACCESS
// ==========================================

export async function createLog(
  level: LogLevel,
  message: string,
  metadata?: Record<string, unknown>
): Promise<Log> {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from('logs')
    .insert({
      level,
      message,
      metadata: metadata || null,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating log entry:', error);
  }

  return data as Log;
}

export async function getLogs(limit = 50): Promise<Log[]> {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from('logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching logs:', error);
    return [];
  }

  return (data || []) as Log[];
}

// ==========================================
// OXYLABS SCHEDULES DATA ACCESS
// ==========================================

export async function upsertSchedule(
  sourceId: string | null,
  scheduleId: string,
  status = 'active'
): Promise<OxylabsSchedule> {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from('oxylabs_schedules')
    .upsert(
      {
        source_id: sourceId,
        schedule_id: scheduleId,
        status,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'schedule_id' }
    )
    .select()
    .single();

  if (error) {
    console.error('Error upserting Oxylabs schedule:', error);
    throw new Error(`Failed to save schedule: ${error.message}`);
  }

  return data as OxylabsSchedule;
}

export async function getActiveSchedules(): Promise<OxylabsSchedule[]> {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from('oxylabs_schedules')
    .select('*')
    .eq('status', 'active');

  if (error) {
    console.error('Error fetching active schedules:', error);
    return [];
  }

  return (data || []) as OxylabsSchedule[];
}

export async function deleteOrphanSchedules(
  validScheduleIds: string[]
): Promise<void> {
  const supabase = createServiceRoleClient();
  if (!validScheduleIds.length) {
    await supabase.from('oxylabs_schedules').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    return;
  }

  const { error } = await supabase
    .from('oxylabs_schedules')
    .delete()
    .not('schedule_id', 'in', `(${validScheduleIds.map((id) => `"${id}"`).join(',')})`);

  if (error) {
    console.error('Error cleaning orphan schedules in DB:', error);
  }
}

// ==========================================
// OXYLABS SCHEDULE RUNS DATA ACCESS
// ==========================================

export async function recordScheduleRun(
  runData: OxylabsScheduleRunInsert
): Promise<OxylabsScheduleRun> {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from('oxylabs_schedule_runs')
    .insert(runData)
    .select()
    .single();

  if (error) {
    console.error('Error recording schedule run:', error);
    throw new Error(`Failed to record schedule run: ${error.message}`);
  }

  return data as OxylabsScheduleRun;
}

export async function updateScheduleRunStatus(
  id: string,
  status: string,
  completedAt?: string
): Promise<void> {
  const supabase = createServiceRoleClient();
  const { error } = await supabase
    .from('oxylabs_schedule_runs')
    .update({
      status,
      completed_at: completedAt || new Date().toISOString(),
    })
    .eq('id', id);

  if (error) {
    console.error('Error updating schedule run status:', error);
  }
}
