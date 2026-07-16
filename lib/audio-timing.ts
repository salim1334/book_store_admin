export interface AudioTimingPage {
  audioStartTime?: number | null;
  audioEndTime?: number | null;
}

/**
 * Validates audio timing values for a set of pages.
 *
 * Rules when audio is attached:
 * - Every page must have both a start and end time.
 * - start and end must be numbers; start must be >= 0.
 * - end must be strictly greater than start.
 * - Time ranges must not overlap across pages (adjacent ranges are allowed).
 *
 * Rules when audio is NOT attached:
 * - No page may have audio timing values (they would be stale).
 */
export function validateAudioTimings(
  pages: AudioTimingPage[],
  hasAudio: boolean
): string | null {
  if (!pages || pages.length === 0) {
    return hasAudio ? 'No pages to synchronize with audio.' : null;
  }

  if (hasAudio) {
    for (let i = 0; i < pages.length; i++) {
      const page = pages[i];
      const start = page.audioStartTime;
      const end = page.audioEndTime;

      if (start === null || start === undefined || end === null || end === undefined) {
        return `Page ${i + 1} is missing audio start or end time.`;
      }

      if (typeof start !== 'number' || typeof end !== 'number' || isNaN(start) || isNaN(end)) {
        return `Page ${i + 1} has invalid audio timing values.`;
      }

      if (start < 0) {
        return `Page ${i + 1} audio start time cannot be negative.`;
      }

      if (end <= start) {
        return `Page ${i + 1} audio end time must be greater than the start time.`;
      }
    }

    const timed = pages
      .map((page, index) => ({
        start: page.audioStartTime as number,
        end: page.audioEndTime as number,
        index,
      }))
      .sort((a, b) => a.start - b.start);

    for (let i = 0; i < timed.length - 1; i++) {
      const current = timed[i];
      const next = timed[i + 1];
      if (next.start < current.end) {
        return `Audio timings overlap between page ${current.index + 1} and page ${next.index + 1}.`;
      }
    }
  } else {
    const anyTimed = pages.some(
      (page) => page.audioStartTime != null || page.audioEndTime != null
    );
    if (anyTimed) {
      return 'Audio timing values must be removed when no audio is attached.';
    }
  }

  return null;
}
