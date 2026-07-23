import { validateAudioTimings } from './audio-timing';
import { MAX_TEXT_PAGE_CHARS } from './config/upload-limits';

interface PublishTextPage {
  content: string | null;
  audioStartTime?: number | null;
  audioEndTime?: number | null;
}

interface PublishImagePage {
  imagePath: string | null;
  audioStartTime?: number | null;
  audioEndTime?: number | null;
}

interface PublishChapter {
  title: string;
  pages: PublishImagePage[];
  texts: PublishTextPage[];
  audios: { audioPath: string | null }[];
}

interface PublishBook {
  title: string;
  type: 'IMAGE' | 'TEXT' | string;
  coverImage: string | null;
  chapters: PublishChapter[];
}

/**
 * Validates a book before publishing.
 * Returns a list of human-readable issues; an empty list means the book
 * is ready to publish.
 */
export function validateBookForPublish(book: PublishBook): string[] {
  const issues: string[] = [];

  if (!book.title?.trim()) {
    issues.push('Book must have a title.');
  }

  if (!book.chapters || book.chapters.length === 0) {
    issues.push('Book must have at least one chapter.');
    return issues;
  }

  book.chapters.forEach((chapter, chapterIndex) => {
    const label = `Chapter ${chapterIndex + 1} ("${chapter.title}")`;
    const pages = book.type === 'IMAGE' ? chapter.pages : chapter.texts;

    if (!pages || pages.length === 0) {
      issues.push(`${label} has no pages.`);
      return;
    }

    if (book.type === 'TEXT') {
      chapter.texts.forEach((page, pageIndex) => {
        const content = page.content?.trim() ?? '';
        if (!content) {
          issues.push(`${label}, page ${pageIndex + 1} is empty.`);
        } else if (content.length > MAX_TEXT_PAGE_CHARS) {
          issues.push(
            `${label}, page ${pageIndex + 1} exceeds the ${MAX_TEXT_PAGE_CHARS} character limit. Move the extra text to an additional page.`,
          );
        }
      });
    } else {
      chapter.pages.forEach((page, pageIndex) => {
        if (!page.imagePath) {
          issues.push(`${label}, page ${pageIndex + 1} is missing its image.`);
        }
      });
    }

    const hasAudio = !!chapter.audios?.[0]?.audioPath;
    const timingError = validateAudioTimings(pages, hasAudio);
    if (timingError) {
      issues.push(`${label}: ${timingError}`);
    }
  });

  return issues;
}
