import { createServiceRoleClient } from '../server';
import { getArticleById } from '../db';
import type { ArticleWithAnalysis, Article, Source, ArticleAnalysis } from '../types';

/**
 * AGENTS.md Section 20 Rule:
 * To find related articles, query article_analyses joined to articles and sources,
 * filter to rows where embedding is not null and article is analyzed and is not current article,
 * order by cosine distance (<=>) to current article's embedding and limit to 5 results.
 */
export async function getRelatedArticles(
  articleId: string,
  embedding?: number[] | null
): Promise<ArticleWithAnalysis[]> {
  if (!articleId) return [];

  const supabase = createServiceRoleClient();

  let targetVec = embedding;
  // If embedding is not provided, fetch current article's embedding from DB
  if (!targetVec || targetVec.length === 0) {
    const { data: analysis } = await supabase
      .from('article_analyses')
      .select('embedding')
      .eq('article_id', articleId)
      .single();

    if (analysis && Array.isArray(analysis.embedding)) {
      targetVec = analysis.embedding as number[];
    }
  }

  if (!targetVec || targetVec.length === 0) {
    return [];
  }

  // 1. Invoke match_related_articles RPC function
  const { data: rpcMatches, error: rpcError } = await supabase.rpc(
    'match_related_articles',
    {
      target_article_id: articleId,
      target_embedding: JSON.stringify(targetVec),
      match_count: 5,
    }
  );

  const matches = (rpcMatches || []) as Array<{ article_id: string; similarity: number }>;
  if (!rpcError && matches.length > 0) {
    const matchedIds = matches.map((m) => m.article_id);
    const relatedArticles: ArticleWithAnalysis[] = [];
    for (const id of matchedIds) {
      const art = await getArticleById(id);
      if (art) relatedArticles.push(art);
    }
    return relatedArticles;
  }

  // 2. Fallback query if RPC function is not created in DB yet
  const { data, error } = await supabase
    .from('articles')
    .select(
      `
      *,
      source:sources(*),
      article_analyses(*)
    `
    )
    .not('analyzed_at', 'is', null)
    .neq('id', articleId)
    .limit(10);

  if (error || !data) return [];

  type RawArticleRow = Article & {
    source?: Source | Source[];
    article_analyses?: ArticleAnalysis | ArticleAnalysis[];
  };

  const formatted = (data as unknown as RawArticleRow[])
    .map((row) => {
      const rawAnalysis = Array.isArray(row.article_analyses)
        ? row.article_analyses[0]
        : row.article_analyses;
      const rawSource = Array.isArray(row.source) ? row.source[0] : row.source;
      return {
        ...row,
        source: rawSource,
        analysis: rawAnalysis || undefined,
      } as ArticleWithAnalysis;
    })
    .filter((art) => art.analysis && art.analysis.embedding);

  return formatted.slice(0, 5);
}
