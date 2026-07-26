import { generateObject, generateText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { z } from 'zod';
import {
  getPendingAnalysisArticles,
  saveArticleAnalysis,
  getArticleById,
  createLog,
} from '../supabase/db';
import type { Article, ArticleAnalysisInsert, SentimentLabel, BiasLabel } from '../supabase/types';

function getAIModel() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY environment variable is missing.');
  }

  const openai = createOpenAI({
    apiKey,
    ...(process.env.OPENAI_BASE_URL ? { baseURL: process.env.OPENAI_BASE_URL } : {}),
  });
  const modelName = process.env.OPENAI_MODEL || 'openrouter/free';
  return { model: openai.chat(modelName), modelName };
}

export const ArticleAnalysisSchema = z.object({
  summary: z
    .string()
    .describe('A neutral, objective summary of the main news content (2-4 sentences).'),
  sentimentScore: z
    .number()
    .min(-1)
    .max(1)
    .describe('Overall sentiment score from -1.0 (very negative) to 1.0 (very positive).'),
  sentimentLabel: z
    .enum(['positive', 'neutral', 'negative'])
    .describe('Sentiment category.'),
  leftPercentage: z
    .number()
    .min(0)
    .max(100)
    .describe('Estimated percentage of left-leaning political framing or tone (0-100).'),
  centerPercentage: z
    .number()
    .min(0)
    .max(100)
    .describe('Estimated percentage of neutral/center political framing or tone (0-100).'),
  rightPercentage: z
    .number()
    .min(0)
    .max(100)
    .describe('Estimated percentage of right-leaning political framing or tone (0-100).'),
  politicalFramingLabel: z
    .enum(['left', 'center', 'right', 'mixed', 'unclear'])
    .describe('Overall AI-estimated political framing classification.'),
  confidence: z
    .number()
    .min(0)
    .max(1)
    .describe('Confidence level in the analysis from 0.0 to 1.0.'),
  framingNotes: z
    .string()
    .describe('Detailed narrative explanation of framing indicators, tone, and context.'),
  loadedTerms: z
    .array(z.string())
    .describe('List of emotionally charged, partisan, or loaded words/phrases found in the text.'),
  disclaimer: z
    .string()
    .describe(
      'Standard disclaimer: AI-estimated political framing based on article text content. AI estimates may be flawed or biased.'
    ),
});

export type RawAnalysisOutput = z.infer<typeof ArticleAnalysisSchema>;

/**
 * Normalizes framing percentages to ensure their sum is exactly 100.
 */
function normalizePercentages(left: number, center: number, right: number): {
  left: number;
  center: number;
  right: number;
} {
  let l = Math.round(Math.max(0, Math.min(100, left)));
  let c = Math.round(Math.max(0, Math.min(100, center)));
  let r = Math.round(Math.max(0, Math.min(100, right)));

  const total = l + c + r;
  if (total === 100) return { left: l, center: c, right: r };
  if (total === 0) return { left: 0, center: 100, right: 0 };

  l = Math.round((l / total) * 100);
  c = Math.round((c / total) * 100);
  r = 100 - (l + c);

  if (r < 0) {
    c += r;
    r = 0;
  }
  return { left: l, center: c, right: r };
}

/**
 * Analyzes a single article text using Google Gemini via Vercel AI SDK.
 */
export async function analyzeArticleText(
  article: Article,
  attempt = 1
): Promise<{ analysisInsert: ArticleAnalysisInsert; modelUsed: string }> {
  const { model, modelName } = getAIModel();

  const systemPrompt = `You are an expert, non-partisan media analyst for Biasly.
Your job is to analyze news articles for political framing, tone, sentiment, loaded language, and media bias.

Strict Guidelines:
1. Base your evaluation STRICTLY on the provided article title and text content. Do NOT infer bias or framing from the news source name or domain.
2. Evaluate the political framing percentages: leftPercentage, centerPercentage, rightPercentage. Their sum MUST equal 100.
3. Determine politicalFramingLabel: 'left', 'center', 'right', 'mixed', or 'unclear'.
   - Use 'unclear' if evidence is weak or balanced, and adjust confidence accordingly.
4. Extract loaded terms or partisan rhetoric present in the text into loadedTerms array.
5. Provide a neutral, objective summary of the article without taking a stance.
6. Rate sentiment from -1.0 (very negative) to 1.0 (very positive).`;

  const userPrompt = `Title: ${article.title}

Article Text:
${article.raw_text}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 20000);

  try {
    let output: z.infer<typeof ArticleAnalysisSchema>;
    try {
      const response = await generateObject({
        model,
        schema: ArticleAnalysisSchema,
        system: systemPrompt,
        prompt: userPrompt,
        temperature: 0.2,
        abortSignal: controller.signal,
      });
      output = response.object;
    } catch (_err) {
      // Fallback for free models on OpenRouter that don't support native json_schema or timeout
      const fallbackController = new AbortController();
      const fallbackTimeout = setTimeout(() => fallbackController.abort(), 20000);
      try {
        const response = await generateText({
          model,
          system: systemPrompt + '\nRespond ONLY with a valid JSON object matching the requested schema.',
          prompt: userPrompt,
          temperature: 0.2,
          abortSignal: fallbackController.signal,
        });
        const jsonMatch = response.text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) throw new Error('No JSON object found in model output: ' + response.text.substring(0, 100));
        output = ArticleAnalysisSchema.parse(JSON.parse(jsonMatch[0]));
      } finally {
        clearTimeout(fallbackTimeout);
      }
    }

    // Normalize percentages to sum to 100
    const percentages = normalizePercentages(
      output.leftPercentage,
      output.centerPercentage,
      output.rightPercentage
    );

    // Derived bias_score formula: (right_percentage - left_percentage) / 100
    const biasScore = (percentages.right - percentages.left) / 100;

    const analysisInsert: ArticleAnalysisInsert = {
      article_id: article.id,
      summary: output.summary,
      sentiment_score: output.sentimentScore,
      sentiment_label: output.sentimentLabel as SentimentLabel,
      bias_score: biasScore,
      bias_label: output.politicalFramingLabel as BiasLabel,
      left_percentage: percentages.left,
      center_percentage: percentages.center,
      right_percentage: percentages.right,
      confidence: output.confidence,
      framing_notes: output.framingNotes,
      loaded_terms: output.loadedTerms,
      disclaimer: output.disclaimer,
      model: modelName,
    };

    return { analysisInsert, modelUsed: modelName };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    if (attempt < 2) {
      const isRateLimit =
        errorMsg.toLowerCase().includes('quota') ||
        errorMsg.toLowerCase().includes('rate limit') ||
        errorMsg.includes('429');
      const delayMs = isRateLimit ? 3000 * attempt : 500;
      console.warn(
        `[AI Analysis] Attempt ${attempt} failed for article "${article.id}": ${errorMsg}. Retrying in ${delayMs}ms...`
      );
      await new Promise((res) => setTimeout(res, delayMs));
      return analyzeArticleText(article, attempt + 1);
    }
    throw new Error(`AI Analysis generation failed after ${attempt} attempts: ${errorMsg}`);
  } finally {
    clearTimeout(timeoutId);
  }
}

export interface AnalysisPipelineOptions {
  limit?: number;
  articleIds?: string[];
}

export interface AnalysisResultSummary {
  articleId: string;
  title: string;
  status: 'success' | 'failed';
  biasLabel?: BiasLabel;
  biasScore?: number;
  error?: string;
}

export interface PipelineSummary {
  status: 'completed' | 'failed';
  totalPending: number;
  analyzed: number;
  skipped: number;
  failed: number;
  durationMs: number;
  results: AnalysisResultSummary[];
}

/**
 * Runs the full AI analysis pipeline on pending or specific articles.
 */
export async function runAnalysisPipeline(
  options?: AnalysisPipelineOptions
): Promise<PipelineSummary> {
  const startTime = Date.now();
  console.log('[AI Analysis Pipeline] Starting AI article analysis run...');

  let targetArticles: Article[] = [];

  if (options?.articleIds && options.articleIds.length > 0) {
    console.log(`[AI Analysis Pipeline] Fetching ${options.articleIds.length} specified article(s)...`);
    for (const id of options.articleIds) {
      const art = await getArticleById(id);
      if (art) targetArticles.push(art);
    }
  } else {
    console.log('[AI Analysis Pipeline] Fetching pending articles using LEFT JOIN query...');
    targetArticles = await getPendingAnalysisArticles(options?.limit);
  }

  const totalPending = targetArticles.length;
  console.log(`[AI Analysis Pipeline] Found ${totalPending} article(s) to analyze.`);

  if (totalPending === 0) {
    const summary: PipelineSummary = {
      status: 'completed',
      totalPending: 0,
      analyzed: 0,
      skipped: 0,
      failed: 0,
      durationMs: Date.now() - startTime,
      results: [],
    };
    await createLog(
      'info',
      'AI analysis pipeline completed: no pending articles found',
      summary as unknown as Record<string, unknown>
    );
    return summary;
  }

  await createLog('info', 'AI analysis pipeline run started', {
    totalPending,
    limitRequested: options?.limit,
    specificArticles: options?.articleIds?.length || 0,
  });

  const results: AnalysisResultSummary[] = [];
  let analyzedCount = 0;
  let failedCount = 0;

  for (let i = 0; i < targetArticles.length; i++) {
    if (i > 0) {
      await new Promise((res) => setTimeout(res, 2000));
    }
    const article = targetArticles[i];
    console.log(
      `[AI Analysis Pipeline] [${i + 1}/${totalPending}] Analyzing article "${article.title}" (${article.id})...`
    );

    try {
      const { analysisInsert, modelUsed } = await analyzeArticleText(article);

      // Save analysis and set analyzed_at
      const savedAnalysis = await saveArticleAnalysis(analysisInsert);

      analyzedCount++;
      console.log(
        `[AI Analysis Pipeline] [${i + 1}/${totalPending}] Successfully analyzed "${article.title}" -> Bias: ${savedAnalysis.bias_label} (${savedAnalysis.bias_score.toFixed(2)}) using ${modelUsed}`
      );

      results.push({
        articleId: article.id,
        title: article.title,
        status: 'success',
        biasLabel: savedAnalysis.bias_label,
        biasScore: savedAnalysis.bias_score,
      });
    } catch (err: unknown) {
      failedCount++;
      const errorMsg = err instanceof Error ? err.message : String(err);
      console.error(
        `[AI Analysis Pipeline] [${i + 1}/${totalPending}] Failed analyzing article "${article.id}":`,
        errorMsg
      );

      results.push({
        articleId: article.id,
        title: article.title,
        status: 'failed',
        error: errorMsg,
      });
    }
  }

  const durationMs = Date.now() - startTime;
  const summary: PipelineSummary = {
    status: 'completed',
    totalPending,
    analyzed: analyzedCount,
    skipped: 0,
    failed: failedCount,
    durationMs,
    results,
  };

  console.log(
    `[AI Analysis Pipeline] Run finished in ${durationMs}ms: ${analyzedCount} analyzed, ${failedCount} failed out of ${totalPending} pending.`
  );

  await createLog('info', 'AI analysis pipeline run completed', {
    analyzedCount,
    failedCount,
    durationMs,
  });

  return summary;
}
