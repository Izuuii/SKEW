import * as cheerio from 'cheerio';
import type { Source } from '../supabase/types';

export interface ExtractedArticleData {
  title: string;
  canonicalUrl: string;
  publishedAt: string | null;
  imageUrl: string | null;
  rawText: string;
  paragraphCount: number;
  characterCount: number;
}

export interface ValidationResult {
  isValid: boolean;
  reason?: string;
  data?: ExtractedArticleData;
}

// Canonical non-article keyword pattern list (AGENTS.md Section 9)
const NON_ARTICLE_URL_PATTERNS = [
  /\/category\//i,
  /\/categories\//i,
  /\/section\//i,
  /\/sections\//i,
  /\/topic\//i,
  /\/topics\//i,
  /\/tag\//i,
  /\/tags\//i,
  /\/author\//i,
  /\/authors\//i,
  /\/profile\//i,
  /\/search\//i,
  /\/show\//i,
  /\/shows\//i,
  /\/program\//i,
  /\/programs\//i,
  /\/podcast\//i,
  /\/podcasts\//i,
  /\/live\//i,
  /\/live-news\//i,
  /\/game\//i,
  /\/games\//i,
  /\/product\//i,
  /\/products\//i,
  /\/review\//i,
  /\/reviews\//i,
  /\/shopping\//i,
  /\/shop\//i,
  /\/store\//i,
  /\/about\//i,
  /\/contact\//i,
  /\/help\//i,
  /\/privacy\//i,
  /\/terms\//i,
  /\/newsletter\//i,
  /\/newsletters\//i,
  /\/subscribe\//i,
  /\/subscription\//i,
  /\/video\//i,
  /\/videos\//i,
  /\/watch\//i,
  /\/audio\//i,
  /\/listen\//i,
];

/**
 * Normalizes candidate URL: converts relative to absolute, strips hash & tracking params.
 */
export function normalizeUrl(rawUrl: string, baseUrl: string): string | null {
  try {
    if (!rawUrl || rawUrl.startsWith('#') || rawUrl.startsWith('javascript:') || rawUrl.startsWith('mailto:')) {
      return null;
    }
    const absolute = new URL(rawUrl, baseUrl);
    // Strip hash
    absolute.hash = '';
    // Strip tracking parameters
    const paramsToKeep = new URLSearchParams();
    absolute.searchParams.forEach((val, key) => {
      if (!key.startsWith('utm_') && !key.startsWith('fbclid') && !key.startsWith('gclid')) {
        paramsToKeep.append(key, val);
      }
    });
    absolute.search = paramsToKeep.toString();
    return absolute.toString();
  } catch {
    return null;
  }
}

/**
 * Source-specific candidate link filter (AGENTS.md Section 11 & 12)
 */
export function isCandidateArticleUrl(url: string, source: Source): boolean {
  try {
    const parsed = new URL(url);
    const pathname = parsed.pathname;

    // Reject homepage itself
    if (pathname === '/' || pathname === '') return false;

    // Check non-article pattern list
    for (const pattern of NON_ARTICLE_URL_PATTERNS) {
      if (pattern.test(pathname)) return false;
    }

    const strategy = source.parser_strategy || '';

    // Strategy-specific matching rules
    if (strategy === 'reuters') {
      // Reuters article URLs typically contain a slug with dates or specific article identifiers like 2026-07-25 or -202...
      // Reject category hubs like /world, /world/africa, /business, /legal
      if (pathname.split('/').filter(Boolean).length < 2) return false;
      const isArticleSlug = /-\d{4}-\d{2}-\d{2}\/?$/i.test(pathname) || /-[a-f0-9]{10,}\/?$/i.test(pathname) || /\d{4}-\d{2}-\d{2}/.test(pathname);
      return isArticleSlug;
    }

    if (strategy === 'npr') {
      // NPR article URLs usually contain /yyyy/mm/dd/
      const nprDatePattern = /\/\d{4}\/\d{2}\/\d{2}\//;
      return nprDatePattern.test(pathname);
    }

    if (strategy === 'bbc') {
      // BBC articles match /news/articles/c... or /articles/c... or /news/world-... with a specific ID
      const bbcArticlePattern = /\/(news\/)?articles\/[a-z0-9]+/i;
      const bbcLegacyPattern = /\/news\/[a-z0-9-]+-\d+/i;
      return bbcArticlePattern.test(pathname) || bbcLegacyPattern.test(pathname);
    }

    if (strategy === 'guardian') {
      // Guardian articles match /<section>/2026/<month>/<day>/<slug>
      const guardianDatePattern = /\/\d{4}\/[a-z]{3}\/\d{1,2}\//i;
      return guardianDatePattern.test(pathname);
    }

    if (strategy === 'foxnews') {
      // Fox News articles match /<category>/<slug> (e.g. /politics/congress-debates-bill) but not section indexes
      const segments = pathname.split('/').filter(Boolean);
      if (segments.length < 2) return false;
      const lastSegment = segments[segments.length - 1];
      // Article slugs in Fox are long hyphenated titles
      return lastSegment.includes('-') && lastSegment.length > 15;
    }

    // Default heuristic for generic sources:
    // Needs at least 2 path segments and a long final slug with hyphens or numbers
    const segments = pathname.split('/').filter(Boolean);
    if (segments.length < 1) return false;
    const lastSegment = segments[segments.length - 1];
    return lastSegment.length > 15 && (lastSegment.includes('-') || /\d/.test(lastSegment));
  } catch {
    return false;
  }
}

/**
 * Extracts visible story card candidate links from homepage HTML (AGENTS.md Section 11)
 */
export function extractCandidateUrls(html: string, source: Source): string[] {
  const $ = cheerio.load(html);
  const candidatesSet = new Set<string>();

  // Scope link extraction to main content containers where possible, avoiding headers/nav/footer
  $('header, nav, footer, [role="navigation"], .site-footer, .site-header, #nav, #header, #footer').remove();

  $('a[href]').each((_, el) => {
    const href = $(el).attr('href');
    if (!href) return;

    const normalized = normalizeUrl(href, source.listing_url);
    if (!normalized) return;

    // Check domain matches target source host (avoid offsite links)
    try {
      const sourceHost = new URL(source.listing_url).hostname.replace(/^www\./, '');
      const candidateHost = new URL(normalized).hostname.replace(/^www\./, '');
      if (!candidateHost.includes(sourceHost) && !sourceHost.includes(candidateHost)) {
        return;
      }
    } catch {
      return;
    }

    if (isCandidateArticleUrl(normalized, source)) {
      candidatesSet.add(normalized);
    }
  });

  return Array.from(candidatesSet);
}

/**
 * Cleans extracted article raw text (AGENTS.md Section 13)
 */
export function cleanArticleText(rawText: string): string {
  if (!rawText) return '';

  return rawText
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Parses article detail HTML to extract title, image_url, published_at, canonical_url, and body text.
 */
export function parseArticleDetail(
  html: string,
  articleUrl: string,
  _source: Source
): ExtractedArticleData {
  const $ = cheerio.load(html);

  // 1. Title Extraction
  let title =
    $('meta[property="og:title"]').attr('content') ||
    $('meta[name="twitter:title"]').attr('content') ||
    $('h1').first().text().trim() ||
    $('title').text().trim() ||
    '';

  // Clean title suffix (e.g. " | Reuters", " - NPR")
  title = title
    .replace(/\s*[\|-]\s*(Reuters|NPR|BBC News|BBC|The Guardian|Fox News|Fox).*$/i, '')
    .trim();

  // 2. Canonical URL
  const canonicalUrl =
    $('link[rel="canonical"]').attr('href') ||
    $('meta[property="og:url"]').attr('content') ||
    articleUrl;

  // 3. Image URL Extraction (Required by schema/AGENTS.md)
  let imageUrl =
    $('meta[property="og:image"]').attr('content') ||
    $('meta[name="twitter:image"]').attr('content') ||
    $('meta[name="twitter:image:src"]').attr('content') ||
    $('link[rel="image_src"]').attr('href') ||
    '';

  if (imageUrl) {
    const normalizedImage = normalizeUrl(imageUrl, articleUrl);
    if (normalizedImage) imageUrl = normalizedImage;
    // Guardian images have HMAC signatures in query params that cause 401s if expired
    if (imageUrl && imageUrl.includes('i.guim.co.uk')) {
      imageUrl = imageUrl.split('?')[0];
    }
  }

  // Fallback to first large article image if og:image is missing
  if (!imageUrl) {
    const articleImg = $('article img[src], main img[src], [itemprop="articleBody"] img[src]').first().attr('src');
    if (articleImg) {
      const normalizedImg = normalizeUrl(articleImg, articleUrl);
      if (normalizedImg) imageUrl = normalizedImg;
    }
  }

  // 4. Published Date Extraction (Required by schema/AGENTS.md)
  let publishedAt: string | null = null;
  const rawDateStr =
    $('meta[property="article:published_time"]').attr('content') ||
    $('meta[name="parsely-pub-date"]').attr('content') ||
    $('meta[name="publish-date"]').attr('content') ||
    $('meta[name="DC.date.issued"]').attr('content') ||
    $('time[datetime]').first().attr('datetime') ||
    $('time[itemprop="datePublished"]').first().attr('datetime') ||
    '';

  if (rawDateStr) {
    try {
      const parsedDate = new Date(rawDateStr);
      if (!isNaN(parsedDate.getTime())) {
        publishedAt = parsedDate.toISOString();
      }
    } catch {
      publishedAt = null;
    }
  }

  // Try JSON-LD script for datePublished & image fallback if missing
  if (!publishedAt || !imageUrl) {
    $('script[type="application/ld+json"]').each((_, el) => {
      try {
        const jsonText = $(el).html();
        if (!jsonText) return;
        const json = JSON.parse(jsonText);
        const items = Array.isArray(json) ? json : [json];
        for (const item of items) {
          if (item['@type'] === 'NewsArticle' || item['@type'] === 'Article') {
            if (!publishedAt && item.datePublished) {
              const d = new Date(item.datePublished);
              if (!isNaN(d.getTime())) publishedAt = d.toISOString();
            }
            if (!imageUrl && item.image) {
              const img = typeof item.image === 'string' ? item.image : item.image.url;
              if (img) {
                const norm = normalizeUrl(img, articleUrl);
                if (norm) imageUrl = norm;
              }
            }
          }
        }
      } catch {
        // ignore JSON parse errors
      }
    });
  }

  // 5. Body Text Extraction & Cleanup
  // Remove clutter elements before pulling paragraph text
  $(
    'header, nav, footer, script, style, iframe, noscript, svg, .ad, .ads, .advertisement, .social-share, .newsletter, .subscription, .related-articles, .most-popular, .comments'
  ).remove();

  const paragraphTexts: string[] = [];

  // Selector targets article container
  const bodyContainers = $('article, [itemprop="articleBody"], main, .article-body, .story-body');
  const targetScope = bodyContainers.length > 0 ? bodyContainers : $('body');

  targetScope.find('p').each((_, el) => {
    const pText = cleanArticleText($(el).text());
    // Filter out short noise, captions, or social prompts
    if (
      pText.length > 25 &&
      !pText.toLowerCase().startsWith('photo:') &&
      !pText.toLowerCase().startsWith('caption:') &&
      !pText.toLowerCase().includes('all rights reserved') &&
      !pText.toLowerCase().includes('subscribe to our')
    ) {
      paragraphTexts.push(pText);
    }
  });

  // If text extraction returned one large paragraph or no <p> tags, split by sentence or block text
  let rawText = paragraphTexts.join('\n\n');
  if (paragraphTexts.length <= 1 && targetScope.text().length > 300) {
    const cleanFull = cleanArticleText(targetScope.text());
    if (cleanFull.length >= 300) {
      rawText = cleanFull;
    }
  }

  const paragraphCount = paragraphTexts.length > 0 ? paragraphTexts.length : (rawText ? 1 : 0);
  const characterCount = rawText.length;

  return {
    title,
    canonicalUrl,
    publishedAt,
    imageUrl: imageUrl || null,
    rawText,
    paragraphCount,
    characterCount,
  };
}

/**
 * Enforces Article Content Gate (AGENTS.md Section 13)
 */
export function validateArticleContent(
  data: ExtractedArticleData,
  _articleUrl: string
): ValidationResult {
  if (!data.title || data.title.length < 10) {
    return { isValid: false, reason: 'Title missing or too short' };
  }

  if (!data.imageUrl) {
    return { isValid: false, reason: 'Image URL missing' };
  }

  if (!data.publishedAt) {
    return { isValid: false, reason: 'Published date missing' };
  }

  if (!data.rawText || data.characterCount < 150) {
    return { isValid: false, reason: 'Body text missing or insufficient' };
  }

  // Quality gate check: >= 3 paragraphs OR >= 900 characters
  const satisfiesQualityGate = data.paragraphCount >= 3 || data.characterCount >= 900;
  if (!satisfiesQualityGate) {
    return {
      isValid: false,
      reason: `Body quality failed: has ${data.paragraphCount} paragraph(s) and ${data.characterCount} character(s) (requires >= 3 paragraphs or >= 900 chars)`,
    };
  }

  return { isValid: true, data };
}
