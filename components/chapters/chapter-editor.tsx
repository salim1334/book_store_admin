'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { validateAudioTimings } from '@/lib/audio-timing';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { PageManager } from './page-manager';
import { AudioUploader } from './audio-uploader';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Save,
  Trash2,
  Loader2,
  CheckCircle2,
  FileText,
  Image as ImageIcon,
  AlertCircle,
} from 'lucide-react';

interface ChapterEditorProps {
  chapterId: string;
}

export function ChapterEditor({ chapterId }: ChapterEditorProps) {
  const router = useRouter();

  // ---- All hooks at the top ----
  const [chapter, setChapter] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [title, setTitle] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  // Data fetching function (useCallback to keep reference stable)
  const fetchChapterData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/chapters/${chapterId}`);
      if (!res.ok) throw new Error('Failed to fetch chapter data');
      const data = await res.json();
      setChapter(data);
      setTitle(data.title);
      setError(null);
    } catch (err: any) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }, [chapterId]);

  // Fetch on mount and when chapterId changes
  useEffect(() => {
    fetchChapterData();
  }, [fetchChapterData]);

  // Validate function
  const validateChapter = useCallback((): string | null => {
    if (!title.trim()) {
      return 'Chapter title is required';
    }

    // If chapter is not loaded yet, skip validation (will be called after load)
    if (!chapter) return null;

    const pages = chapter.book.type === 'IMAGE' ? chapter.pages : chapter.texts;
    if (pages.length === 0) {
      return `${chapter.book.type} books must have at least one page`;
    }

    if (chapter.book.type === 'TEXT') {
      const hasEmptyPage = pages.some((page: any) => !page.content?.trim());
      if (hasEmptyPage) {
        return 'All text pages must have content';
      }
    }

    const hasAudio = !!chapter.audios?.[0]?.audioPath;
    const timingError = validateAudioTimings(pages, hasAudio);
    if (timingError) {
      return timingError;
    }

    return null;
  }, [title, chapter]);

  // Save handler (only this persists to the server)
  const handleSave = useCallback(async () => {
    const errorMsg = validateChapter();
    if (errorMsg) {
      setValidationError(errorMsg);
      toast.error(errorMsg);
      return;
    }
    setValidationError(null);
    setSaving(true);
    try {
      // Prepare the full payload: title, pages, audio
      const pages =
        chapter.book.type === 'IMAGE' ? chapter.pages : chapter.texts;
      const payload = {
        title: title.trim(),
        pages: pages,
        audioPath: chapter.audios?.[0]?.audioPath || null,
      };

      const response = await fetch(`/api/chapters/${chapter.id}`, {
        method: 'PUT', // or PATCH if you prefer
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error('Failed to save chapter');
      const updatedChapter = await response.json();
      setChapter(updatedChapter);
      setTitle(updatedChapter.title);
      setLastSaved(new Date());
      toast.success('Chapter saved successfully!');
      router.refresh(); // refresh server components if needed
    } catch (error) {
      console.error('Error saving chapter:', error);
      toast.error('Failed to save chapter');
    } finally {
      setSaving(false);
    }
  }, [chapter, title, validateChapter, router]);

  // Delete handler
  const handleDelete = useCallback(() => {
    toast.error('Are you sure you want to delete this chapter?', {
      description:
        'This will also delete all pages and audio. This action cannot be undone.',
      action: {
        label: 'Delete',
        onClick: async () => {
          setDeleting(true);
          try {
            const response = await fetch(`/api/chapters/${chapter.id}`, {
              method: 'DELETE',
            });
            if (response.ok) {
              router.push(`/dashboard/books/${chapter.bookId}`);
              toast.success('Chapter deleted successfully!');
            } else {
              const error = await response.json();
              toast.error(error.error || 'Failed to delete chapter');
            }
          } catch (error) {
            console.error('Error deleting chapter:', error);
            toast.error('An error occurred during deletion');
          } finally {
            setDeleting(false);
          }
        },
      },
      cancel: {
        label: 'Cancel',
        onClick: () => {}, // Does nothing, just dismisses the toast
      },
    });
  }, [chapter, router]);

  // ---- REFRESH HANDLER: updates local state with data from children ----
  const handleRefresh = useCallback(
    (data?: { pages?: any[]; audioPath?: string | null }) => {
      // Update chapter state with the new data (no re‑fetch)
      if (data) {
        setChapter((prev: any) => {
          if (!prev) return prev;
          const newChapter = { ...prev };
          // Update pages
          if (data.pages) {
            if (prev.book.type === 'IMAGE') {
              newChapter.pages = data.pages;
            } else {
              newChapter.texts = data.pages;
            }
          }
          // Update audio
          if (data.audioPath !== undefined) {
            if (data.audioPath === null) {
              newChapter.audios = [];
            } else {
              if (!newChapter.audios) newChapter.audios = [];
              if (newChapter.audios.length === 0) {
                newChapter.audios.push({ audioPath: data.audioPath });
              } else {
                newChapter.audios[0].audioPath = data.audioPath;
              }
            }
          }
          return newChapter;
        });
      }
      // Optionally refresh server components (does not refetch client data)
      router.refresh();
    },
    [router],
  );

  // ---- Now all hooks are defined; we can safely render conditionally ----
  // Loading state
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-red-600">
        <AlertCircle className="h-8 w-8 mb-2" />
        <p>Error loading chapter: {error}</p>
        <Button onClick={() => fetchChapterData()} className="mt-4">
          Try again
        </Button>
      </div>
    );
  }

  // If no chapter (e.g., deleted or not found)
  if (!chapter) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-600">
        <p>Chapter not found</p>
        <Button onClick={() => router.back()} className="mt-4">
          Go back
        </Button>
      </div>
    );
  }

  // ---- Now we have data and can render normally ----
  const pages = chapter.book.type === 'IMAGE' ? chapter.pages : chapter.texts;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <Link href={`/dashboard/books/${chapter.bookId}`}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="min-w-0">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight truncate">
              {chapter.title}
            </h1>
            <p className="text-gray-500 mt-1 truncate">
              {chapter.book.title} • {chapter.book.type} Book
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-3">
          {lastSaved && (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              Saved {lastSaved.toLocaleTimeString()}
            </div>
          )}
          <Button onClick={handleSave} disabled={saving || pages.length === 0}>
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Chapter
              </>
            )}
          </Button>
          <Button
            variant="outline"
            onClick={handleDelete}
            disabled={deleting}
            className="text-red-600 hover:text-red-700"
          >
            {deleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Validation Error */}
      {validationError && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-red-800">
              <AlertCircle className="h-5 w-5" />
              <p className="font-medium">{validationError}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Chapter Title */}
      <Card>
        <CardHeader>
          <CardTitle>Chapter Information</CardTitle>
          <CardDescription>
            Basic information about this chapter
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="title">Chapter Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Chapter 1: The Beginning"
            />
            <p className="text-xs text-gray-500">
              Give your chapter a clear, descriptive title
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Pages Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {chapter.book.type === 'TEXT' ? (
              <FileText className="h-5 w-5" />
            ) : (
              <ImageIcon className="h-5 w-5" />
            )}
            {chapter.book.type === 'TEXT' ? 'Text Pages' : 'Image Pages'}
          </CardTitle>
          <CardDescription>
            {chapter.book.type === 'TEXT'
              ? 'Add and manage text content pages for this chapter'
              : 'Upload and manage images for this chapter'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PageManager
            bookType={chapter.book.type}
            pages={pages}
            chapterId={chapter.id}
            hasAudio={!!chapter.audios?.[0]?.audioPath}
            audioPath={chapter.audios?.[0]?.audioPath || null}
            onUpdate={handleRefresh} // ✅ now passes data
          />
        </CardContent>
      </Card>

      {/* Audio */}
      <AudioUploader
        chapterId={chapter.id}
        audioPath={chapter.audios?.[0]?.audioPath || null}
        onUpdate={handleRefresh} // ✅ now passes data
      />

      {/* Help Card */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="pt-6">
          <h3 className="font-medium text-blue-900 mb-2">
            Tips for creating chapters
          </h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Give your chapter a clear, descriptive title</li>
            <li>
              •{' '}
              {chapter.book.type === 'TEXT'
                ? 'Add multiple text pages to organize your content effectively'
                : 'Upload images in the correct order (WebP or JPEG preferred)'}
            </li>
            <li>• Use the move up/down buttons to reorder pages</li>
            <li>
              • Add optional audio narration to enhance the reading experience
            </li>
            <li>
              • All pages must have content before you can save the chapter
            </li>
            <li>
              • Click **Save Chapter** to persist all changes to the server.
            </li>
          </ul>
          <div className="mt-3 pt-3 border-t border-blue-200">
            <h4 className="font-medium text-blue-900 text-sm mb-1">
              Compression tips for mobile
            </h4>
            <ul className="text-xs text-blue-700 space-y-1">
              <li>
                • Images: Resize to 1080×1920 max, export as WebP (quality 80)
                or JPEG (quality 85). Aim for under 500KB per page.
              </li>
              <li>
                • Audio: Use MP3 or M4A at 64–96 kbps for voice narration. A
                30-minute chapter should be under 15MB.
              </li>
              <li>
                • Avoid WAV — it's 10× larger with no quality benefit for spoken
                word.
              </li>
              <li>
                • See the{' '}
                <Link
                  href="/dashboard/guide#preparing-images"
                  className="underline font-medium"
                >
                  Content Guide
                </Link>{' '}
                for recommended tools.
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
