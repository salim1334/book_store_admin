// Centralized upload limits/config shared by server + client.
// Values are derived from environment variables with sensible fallbacks.

export type UploadLimits = {
  imageMaxSizeMb: number;
  audioMaxSizeMb: number;
  supportedImageTypes: string[];
  supportedAudioTypes: string[];
  textPageMaxChars: number;
  imageOptimizeMaxWidth: number;
  imageOptimizeMaxHeight: number;
  imageOptimizeQuality: number;
};

function parsePositiveNumber(value: string | undefined, fallback: number) {
  if (!value) return fallback;
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

export const uploadLimits: UploadLimits = {
  // NEXT_PUBLIC_* values are used by the browser; non-public values are used by the server.
  imageMaxSizeMb: parsePositiveNumber(
    process.env.NEXT_PUBLIC_IMAGE_MAX_SIZE_MB ?? process.env.IMAGE_MAX_SIZE_MB,
    2,
  ),
  audioMaxSizeMb: parsePositiveNumber(
    process.env.NEXT_PUBLIC_AUDIO_MAX_SIZE_MB ?? process.env.AUDIO_MAX_SIZE_MB,
    25,
  ),
  supportedImageTypes: (
    process.env.NEXT_PUBLIC_SUPPORTED_IMAGE_TYPES ??
    process.env.SUPPORTED_IMAGE_TYPES ??
    'image/jpeg,image/png,image/webp'
  )
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),
  // Spec mentions AAC alongside MP3/M4A, so we include it by default.
  supportedAudioTypes: (
    process.env.NEXT_PUBLIC_SUPPORTED_AUDIO_TYPES ??
    process.env.SUPPORTED_AUDIO_TYPES ??
    'audio/mpeg,audio/mp4,audio/x-m4a,audio/aac'
  )
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),
  // Maximum characters allowed in a single text page (hard server-side cap).
  textPageMaxChars: parsePositiveNumber(
    process.env.NEXT_PUBLIC_TEXT_PAGE_MAX_CHARS ??
      process.env.TEXT_PAGE_MAX_CHARS,
    5000,
  ),
  // Optional server-side image optimization (resize + compress) settings.
  imageOptimizeMaxWidth: parsePositiveNumber(
    process.env.IMAGE_OPTIMIZE_MAX_WIDTH,
    1080,
  ),
  imageOptimizeMaxHeight: parsePositiveNumber(
    process.env.IMAGE_OPTIMIZE_MAX_HEIGHT,
    1920,
  ),
  imageOptimizeQuality: parsePositiveNumber(
    process.env.IMAGE_OPTIMIZE_QUALITY,
    80,
  ),
};

export const MAX_IMAGE_SIZE_BYTES = Math.round(
  uploadLimits.imageMaxSizeMb * 1024 * 1024,
);

export const MAX_AUDIO_SIZE_BYTES = Math.round(
  uploadLimits.audioMaxSizeMb * 1024 * 1024,
);

export const MAX_TEXT_PAGE_CHARS = uploadLimits.textPageMaxChars;

export function isSupportedImageType(mimeType: string) {
  return uploadLimits.supportedImageTypes.includes(mimeType);
}

export function isSupportedAudioType(mimeType: string) {
  return uploadLimits.supportedAudioTypes.includes(mimeType);
}
