---
name: ai-analysis-resilience
description: Standard resilience, non-blocking retries, per-request 20s timeouts, and multi-level JSON parsing fallbacks for AI analysis pipelines. Use when developers need non-blocking AI pipeline execution, handling free model timeouts, or preventing pipeline stalls.
---

# AI Analysis Pipeline Resilience & Fallback Protocol

This skill provides guidelines and implementation standards for maintaining a robust, non-blocking AI Analysis pipeline when consuming LLMs or free router endpoints (such as OpenRouter, Atomesus, or OpenAI proxies).

---

## 1. Core Principles

1. **Strict Per-Request Timeouts**: Every LLM call MUST use an `AbortController` signal capped at **20 seconds max**. No request is permitted to hang indefinitely.
2. **Multi-Level Parsing Fallback**: If structured mode (`generateObject`) is unsupported or returns unparseable content, the pipeline MUST fall back to `generateText` with regex JSON pattern matching (`/\{[\s\S]*\}/`).
3. **Non-Blocking Retries**: Attempt limits are capped at **2 attempts max** per article with low backoff delays (500ms for standard errors, 3000ms for 429 rate limits).
4. **Isolated Article Failure**: An error on one article MUST NOT crash or block the processing loop of subsequent articles in the batch.
5. **Clear Terminal Console Logging**: Server console MUST log start, per-article status, retry reason, fallback activation, and final summary.

---

## 2. Standard Code Pattern

```ts
import { generateObject, generateText } from 'ai';

export async function analyzeArticleTextWithResilience(article, attempt = 1) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 20000);

  try {
    let output;
    // Primary: Structured generateObject
    try {
      const res = await generateObject({
        model,
        schema,
        system: systemPrompt,
        prompt: userPrompt,
        temperature: 0.2,
        abortSignal: controller.signal,
      });
      output = res.object;
    } catch (_err) {
      // Fallback: generateText + regex JSON extraction
      const fallbackController = new AbortController();
      const fallbackTimeout = setTimeout(() => fallbackController.abort(), 20000);
      try {
        const res = await generateText({
          model,
          system: systemPrompt + '\nRespond ONLY with a valid JSON object matching the requested schema.',
          prompt: userPrompt,
          temperature: 0.2,
          abortSignal: fallbackController.signal,
        });
        const jsonMatch = res.text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) throw new Error('No JSON object found in model output');
        output = schema.parse(JSON.parse(jsonMatch[0]));
      } finally {
        clearTimeout(fallbackTimeout);
      }
    }
    return output;
  } catch (err) {
    if (attempt < 2) {
      const delayMs = err.message?.includes('429') ? 3000 : 500;
      await new Promise(r => setTimeout(r, delayMs));
      return analyzeArticleTextWithResilience(article, attempt + 1);
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}
```

---

## 3. When to Apply This Skill

- Applying dynamic models on OpenRouter, Groq, or third-party proxies.
- Handling unhandled reference errors or missing exports.
- Eliminating 5+ minute pipeline stalls on individual news articles.
