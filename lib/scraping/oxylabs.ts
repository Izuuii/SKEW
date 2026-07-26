/**
 * Oxylabs Web Scraper API client wrapper
 * Uses HTTP Basic Auth with OXY_WSA_USERNAME and OXY_WSA_PASSWORD env variables.
 */

export interface OxylabsFetchResult {
  html: string;
  statusCode: number;
  url: string;
}

export async function fetchPageHtml(url: string): Promise<OxylabsFetchResult> {
  const username = process.env.OXY_WSA_USERNAME;
  const password = process.env.OXY_WSA_PASSWORD;

  if (!username || !password) {
    throw new Error(
      'Oxylabs credentials missing: OXY_WSA_USERNAME and OXY_WSA_PASSWORD environment variables are required.'
    );
  }

  const credentials = Buffer.from(`${username}:${password}`).toString('base64');

  const response = await fetch('https://realtime.oxylabs.io/v1/queries', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Basic ${credentials}`,
    },
    body: JSON.stringify({
      source: 'universal',
      url,
    }),
    signal: AbortSignal.timeout(30000),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => '');
    if (response.status === 401) {
      throw new Error(`Oxylabs Authentication failed (401): ${errorText}`);
    }
    if (response.status === 429) {
      throw new Error(`Oxylabs Rate limit exceeded (429): ${errorText}`);
    }
    throw new Error(
      `Oxylabs API returned HTTP ${response.status}: ${errorText || response.statusText}`
    );
  }

  const data = await response.json();

  if (!data.results || !data.results.length) {
    throw new Error(`Oxylabs returned empty results array for URL: ${url}`);
  }

  const firstResult = data.results[0];
  const statusCode = firstResult.status_code || 200;
  const html = firstResult.content || '';
  const finalUrl = firstResult.url || url;

  if (statusCode >= 400) {
    throw new Error(`Target page returned HTTP ${statusCode} for URL: ${url}`);
  }

  return {
    html,
    statusCode,
    url: finalUrl,
  };
}
