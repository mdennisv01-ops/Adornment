const env = require('../../config/env');
const logger = require('../../config/logger');

/**
 * Thin adapter over whatever external image-generation/try-on API you plug
 * in (e.g. a diffusion-based virtual try-on service). Keeping it isolated
 * here means swapping providers later never touches the rest of the app.
 *
 * Configure AI_PROVIDER_BASE_URL / AI_PROVIDER_API_KEY in .env. Until those
 * are set, this runs in a "stub" mode so the rest of the flow (job
 * creation, status polling) is fully testable without a live provider.
 */
async function generateTryOn({ sourcePhotoUrl, garmentImageUrl, pose, lighting, environment }) {
  if (!env.aiProvider.baseUrl || !env.aiProvider.apiKey) {
    logger.warn('AI_PROVIDER_BASE_URL/AI_PROVIDER_API_KEY not set — running AI Studio in stub mode');
    // Stub result so the job pipeline can be exercised end-to-end in dev.
    return { resultUrl: sourcePhotoUrl };
  }

  const response = await fetch(`${env.aiProvider.baseUrl}/v1/try-on`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${env.aiProvider.apiKey}`,
    },
    body: JSON.stringify({ sourcePhotoUrl, garmentImageUrl, pose, lighting, environment }),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(`AI provider request failed (${response.status}): ${text}`);
  }

  const data = await response.json();
  return { resultUrl: data.resultUrl };
}

module.exports = { generateTryOn };
