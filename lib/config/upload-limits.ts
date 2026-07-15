// Centralized upload limits/config shared by server + client.
// Values are derived from environment variables with sensible fallbacks.

export type UploadLimits = {
  imageMaxSizeMb: number;
  audioMaxSizeMb: number;
  supportedImageTypes: string[];
  supportedAudioTypes: string[];
};

function parsePositiveNumber(value: string | undefined, fallback: number) {
  if (!value) return fallback;
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

export const uploadLimits: UploadLimits = {
  imageMaxSizeMb: parsePositiveNumber(process.env.IMAGE_MAX_SIZE_MB, 10),
  audioMaxSizeMb: parsePositiveNumber(process.env.AUDIO_MAX_SIZE_MB, 1),
  supportedImageTypes: (
    process.env.SUPPORTED_IMAGE_TYPES ?? 'image/jpeg,image/png,image/webp'
  )
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),
  // Spec mentions AAC alongside MP3/M4A, so we include it by default.
  supportedAudioTypes: (
    process.env.SUPPORTED_AUDIO_TYPES ??
    'audio/mpeg,audio/mp4,audio/wav,audio/x-m4a,audio/aac'
  )
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),
};

export const MAX_IMAGE_SIZE_BYTES = Math.round(
  uploadLimits.imageMaxSizeMb * 1024 * 1024
);

export const MAX_AUDIO_SIZE_BYTES = Math.round(
  uploadLimits.audioMaxSizeMb * 1024 * 1024
);

export function isSupportedImageType(mimeType: string) {
  return uploadLimits.supportedImageTypes.includes(mimeType);
}

export function isSupportedAudioType(mimeType: string) {
  return uploadLimits.supportedAudioTypes.includes(mimeType);
}
