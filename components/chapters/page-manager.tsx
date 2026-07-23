'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import {
  Trash2,
  Plus,
  FileText,
  Image as ImageIcon,
  Upload,
  Loader2,
  GripVertical,
  Heading1,
  Heading2,
  Timer,
} from 'lucide-react';
import {
  uploadLimits,
  MAX_IMAGE_SIZE_BYTES,
  MAX_TEXT_PAGE_CHARS,
  isSupportedImageType,
} from '@/lib/config/upload-limits';
import {
  xhrUpload,
  formatBytes,
  formatEta,
  type UploadProgress,
} from '@/lib/upload/xhr-upload';

interface Page {
  id: string;
  content?: string;
  imagePath?: string;
  orderIndex: number;
  audioStartTime?: number | null;
  audioEndTime?: number | null;
}

interface PageManagerProps {
  bookType: 'TEXT' | 'IMAGE';
  pages: Page[];
  chapterId: string;
  hasAudio: boolean;
  audioPath?: string | null;
  // onUpdate now expects a data object with the new pages array
  onUpdate: (data: { pages: Page[] }) => void;
}

const imageTypeLabels: Record<string, string> = {
  'image/jpeg': 'JPEG',
  'image/png': 'PNG',
  'image/webp': 'WebP',
};

// Renders page content with lightweight formatting:
// lines starting with "# " are titles, "## " are subtitles.
function renderContentPreview(content?: string) {
  const lines = (content || '').split('\n');
  return lines.map((line, i) => {
    if (line.startsWith('## ')) {
      return (
        <p key={i} className="text-base font-semibold text-gray-800">
          {line.slice(3)}
        </p>
      );
    }
    if (line.startsWith('# ')) {
      return (
        <p key={i} className="text-xl font-bold text-gray-900">
          {line.slice(2)}
        </p>
      );
    }
    return (
      <p key={i} className="whitespace-pre-wrap text-sm min-h-[1.25em]">
        {line}
      </p>
    );
  });
}

function SortablePage({
  id,
  className,
  children,
}: {
  id: string;
  className?: string;
  children: (drag: {
    attributes: Record<string, any>;
    listeners: Record<string, any> | undefined;
  }) => React.ReactNode;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : undefined,
    opacity: isDragging ? 0.5 : 1,
    position: 'relative',
  };

  return (
    <div ref={setNodeRef} style={style} className={className}>
      {children({ attributes, listeners })}
    </div>
  );
}

export function PageManager({
  bookType,
  pages: initialPages,
  chapterId,
  hasAudio,
  audioPath,
  onUpdate,
}: PageManagerProps) {
  // Local state for instant UI updates
  const [pages, setPages] = useState<Page[]>(initialPages);
  const [loading, setLoading] = useState<string | null>(null);
  const [editingPageId, setEditingPageId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [uploadProgress, setUploadProgress] = useState<
    (UploadProgress & { label: string }) | null
  >(null);
  const [uploadError, setUploadError] = useState<{
    message: string;
    guideHref: string;
  } | null>(null);
  const [optimizeImages, setOptimizeImages] = useState(true);
  const editTextareaRef = useRef<HTMLTextAreaElement>(null);
  const audioPlayerRef = useRef<HTMLAudioElement>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const supportedImageLabels = uploadLimits.supportedImageTypes
    .map((t) => imageTypeLabels[t] || t)
    .join(', ');
  const maxImageLabel = `${uploadLimits.imageMaxSizeMb}MB`;
  const acceptImageTypes = uploadLimits.supportedImageTypes.join(',');

  const clearUploadFeedback = () => {
    setUploadProgress(null);
    setUploadError(null);
  };

  const handleTimeChange = (
    pageId: string,
    field: 'audioStartTime' | 'audioEndTime',
    value: string,
  ) => {
    const numericValue = value === '' ? null : parseFloat(value);
    if (value !== '' && isNaN(numericValue!)) return; // Ignore invalid input

    const updatedPages = pages.map((p) =>
      p.id === pageId ? { ...p, [field]: numericValue } : p,
    );
    setPages(updatedPages);
    notifyParent(updatedPages);
  };

  // Sync local state when parent updates the pages prop
  useEffect(() => {
    setPages(initialPages);
  }, [initialPages]);

  // Helper: call onUpdate with the current pages array
  const notifyParent = (newPages: Page[]) => {
    onUpdate({ pages: newPages });
  };

  const validateImageFile = (file: File): string | null => {
    if (!isSupportedImageType(file.type)) {
      return `Invalid file type (${file.type}). Supported: ${supportedImageLabels}`;
    }
    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      return `File too large (${formatBytes(file.size)}). Max: ${maxImageLabel}`;
    }
    return null;
  };

  const handleAddPage = async () => {
    if (bookType === 'TEXT') {
      setLoading('add-text');
      try {
        const response = await fetch(`/api/chapters/${chapterId}/pages`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: 'New page content...' }),
        });

        if (response.ok) {
          const newPage = await response.json(); // expects { id, content, orderIndex }
          // Optimistically add the new page to local state
          const updatedPages = [...pages, newPage];
          setPages(updatedPages);
          notifyParent(updatedPages);
          toast.success('Page added successfully.');
        } else {
          const error = await response.json();
          toast.error(error.error || 'Failed to add page');
        }
      } catch (error) {
        console.error('Error adding page:', error);
        toast.error('An error occurred');
      } finally {
        setLoading(null);
      }
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    clearUploadFeedback();
    for (const file of files) {
      const validationError = validateImageFile(file);
      if (validationError) {
        setUploadError({
          message: `${file.name}: ${validationError}`,
          guideHref: '/dashboard/guide#preparing-images',
        });
        toast.error(validationError);
        e.target.value = '';
        return;
      }
    }

    // Upload in filename order so multi-selects keep their page order
    const sortedFiles = [...files].sort((a, b) =>
      a.name.localeCompare(b.name, undefined, { numeric: true }),
    );

    setLoading('add-image');
    let updatedPages = [...pages];
    try {
      for (let i = 0; i < sortedFiles.length; i++) {
        const file = sortedFiles[i];
        const label =
          sortedFiles.length > 1
            ? `${file.name} (${i + 1}/${sortedFiles.length})`
            : file.name;
        setUploadProgress({
          percent: 0,
          loaded: 0,
          total: file.size,
          etaSeconds: 0,
          label,
        });
        const newPage = await xhrUpload<Page>({
          method: 'POST',
          endpoint: `/api/chapters/${chapterId}/pages`,
          file,
          fieldName: 'image',
          extraFields: { optimize: optimizeImages ? 'true' : 'false' },
          onProgress: (p) => setUploadProgress({ ...p, label }),
        });
        updatedPages = [...updatedPages, newPage];
        setPages(updatedPages);
        notifyParent(updatedPages);
      }
      toast.success(
        sortedFiles.length > 1
          ? `${sortedFiles.length} pages added successfully.`
          : 'Page added successfully.',
      );
      clearUploadFeedback();
    } catch (error: any) {
      console.error('Error uploading image:', error);
      const message = error?.message || 'Failed to upload image';
      setUploadError({
        message,
        guideHref: '/dashboard/guide#preparing-images',
      });
      toast.error(message);
    } finally {
      setLoading(null);
      e.target.value = '';
    }
  };

  const handleUpdatePage = async (pageId: string, content: string) => {
    setLoading(pageId);
    try {
      const response = await fetch(
        `/api/chapters/${chapterId}/pages/${pageId}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content }),
        },
      );

      if (response.ok) {
        // Update local state
        const updatedPages = pages.map((p) =>
          p.id === pageId ? { ...p, content } : p,
        );
        setPages(updatedPages);
        setEditingPageId(null);
        setEditContent('');
        notifyParent(updatedPages);
        toast.success('Page updated successfully.');
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to update page');
      }
    } catch (error) {
      console.error('Error updating page:', error);
      toast.error('An error occurred');
    } finally {
      setLoading(null);
    }
  };

  const handleDeletePage = (pageId: string) => {
    toast('Are you sure you want to delete this page?', {
      action: {
        label: 'Delete',
        onClick: async () => {
          setLoading(pageId);
          try {
            const response = await fetch(
              `/api/chapters/${chapterId}/pages/${pageId}`,
              {
                method: 'DELETE',
              },
            );

            if (response.ok) {
              const updatedPages = pages.filter((p) => p.id !== pageId);
              setPages(updatedPages);
              notifyParent(updatedPages);
              toast.success('Page deleted successfully.');
            } else {
              const error = await response.json();
              toast.error(error.error || 'Failed to delete page');
            }
          } catch (error) {
            console.error('Error deleting page:', error);
            toast.error('An error occurred');
          } finally {
            setLoading(null);
          }
        },
      },
      cancel: {
        label: 'Cancel',
        onClick: () => {},
      },
      classNames: {
        actionButton: 'bg-red-600 text-white',
      },
    });
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = pages.findIndex((p) => p.id === active.id);
    const newIndex = pages.findIndex((p) => p.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const previousPages = pages;
    const newPages = arrayMove(pages, oldIndex, newIndex);
    setPages(newPages);

    setLoading('reorder');
    try {
      const pageIds = newPages.map((p) => p.id);
      const response = await fetch(`/api/chapters/${chapterId}/pages/reorder`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pageIds }),
      });

      if (response.ok) {
        notifyParent(newPages);
        toast.success('Pages reordered successfully.');
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to reorder pages');
        setPages(previousPages);
      }
    } catch (error) {
      console.error('Error reordering pages:', error);
      toast.error('An error occurred');
      setPages(previousPages);
    } finally {
      setLoading(null);
    }
  };

  // Toggle a "# " (title) or "## " (subtitle) prefix on the line the cursor is on
  const toggleLinePrefix = (prefix: '# ' | '## ') => {
    const textarea = editTextareaRef.current;
    const value = editContent;
    const cursor = textarea ? textarea.selectionStart : value.length;
    const lineStart = value.lastIndexOf('\n', cursor - 1) + 1;
    const lineEndIndex = value.indexOf('\n', lineStart);
    const lineEnd = lineEndIndex === -1 ? value.length : lineEndIndex;
    const line = value.slice(lineStart, lineEnd);
    const currentPrefix = line.startsWith('## ')
      ? '## '
      : line.startsWith('# ')
        ? '# '
        : '';
    const stripped = line.slice(currentPrefix.length);
    const newLine = currentPrefix === prefix ? stripped : prefix + stripped;
    setEditContent(value.slice(0, lineStart) + newLine + value.slice(lineEnd));
    textarea?.focus();
  };

  // Capture the audio player's current position into a page timing field
  const setTimeFromPlayer = (
    pageId: string,
    field: 'audioStartTime' | 'audioEndTime',
  ) => {
    const player = audioPlayerRef.current;
    if (!player) {
      toast.error('Audio player is not available.');
      return;
    }
    const time = Math.round(player.currentTime * 10) / 10;
    handleTimeChange(pageId, field, time.toString());
  };

  const handleReplaceImage = async (pageId: string, file: File) => {
    clearUploadFeedback();
    const validationError = validateImageFile(file);
    if (validationError) {
      setUploadError({
        message: validationError,
        guideHref: '/dashboard/guide#preparing-images',
      });
      toast.error(validationError);
      return;
    }

    setLoading(pageId);
    setUploadProgress({
      percent: 0,
      loaded: 0,
      total: file.size,
      etaSeconds: 0,
      label: file.name,
    });

    try {
      const updatedPage = await xhrUpload<{ imagePath: string }>({
        method: 'PATCH',
        endpoint: `/api/chapters/${chapterId}/pages/${pageId}`,
        file,
        fieldName: 'image',
        extraFields: { optimize: optimizeImages ? 'true' : 'false' },
        onProgress: (p) => setUploadProgress({ ...p, label: file.name }),
      });
      const updatedPages = pages.map((p) =>
        p.id === pageId ? { ...p, imagePath: updatedPage.imagePath } : p,
      );
      setPages(updatedPages);
      notifyParent(updatedPages);
      toast.success('Image changed successfully.');
      clearUploadFeedback();
    } catch (error: any) {
      console.error('Error changing image:', error);
      const message = error?.message || 'Failed to change image';
      setUploadError({
        message,
        guideHref: '/dashboard/guide#preparing-images',
      });
      toast.error(message);
    } finally {
      setLoading(null);
    }
  };

  const startEditing = (page: Page) => {
    setEditingPageId(page.id);
    setEditContent(page.content || '');
  };

  const cancelEditing = () => {
    setEditingPageId(null);
    setEditContent('');
  };

  // ---- Render logic (unchanged) ----
  if (pages.length === 0) {
    return (
      <div className="space-y-4">
        {uploadError && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4">
            <p className="text-sm font-medium text-red-800">
              {uploadError.message}
            </p>
            <p className="mt-1 text-sm text-red-700">
              Try compressing or re-exporting the file, then{' '}
              <Link href={uploadError.guideHref} className="underline">
                check the Content Guide
              </Link>{' '}
              for recommended tools and tips.
            </p>
          </div>
        )}

        {uploadProgress && (
          <div className="rounded-lg border p-4 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium truncate">
                {uploadProgress.label}
              </span>
              <span className="text-gray-500">{uploadProgress.percent}%</span>
            </div>
            <div className="h-2 w-full rounded-full bg-gray-200 overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all"
                style={{ width: `${uploadProgress.percent}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>
                {formatBytes(uploadProgress.loaded)} /{' '}
                {formatBytes(uploadProgress.total)}
              </span>
              <span>~{formatEta(uploadProgress.etaSeconds)} left</span>
            </div>
          </div>
        )}

        <div className="text-center py-8 border-2 border-dashed rounded-lg">
          {bookType === 'TEXT' ? (
            <>
              <FileText className="mx-auto h-10 w-10 text-gray-400" />
              <p className="mt-2 text-sm text-gray-500">No pages yet</p>
              <Button
                onClick={handleAddPage}
                disabled={loading === 'add-text'}
                className="mt-4"
              >
                {loading === 'add-text' ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Adding...
                  </>
                ) : (
                  <>
                    <Plus className="mr-2 h-4 w-4" /> Add First Page
                  </>
                )}
              </Button>
            </>
          ) : (
            <>
              <ImageIcon className="mx-auto h-10 w-10 text-gray-400" />
              <p className="mt-2 text-sm text-gray-500">No images yet</p>
              <p className="text-xs text-gray-400 mt-1">
                Supported formats: {supportedImageLabels} (max {maxImageLabel})
              </p>
              <p className="text-xs text-gray-400 mt-2">
                Tip: If your files are big, enable optimization below to resize
                and compress automatically on upload.
              </p>
              <div className="flex items-center justify-center gap-2 mt-3 text-sm">
                <input
                  id="optimize-images-empty"
                  type="checkbox"
                  checked={optimizeImages}
                  onChange={(e) => setOptimizeImages(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                />
                <Label
                  htmlFor="optimize-images-empty"
                  className="text-xs text-gray-500 font-normal cursor-pointer"
                >
                  Optimize images on upload
                </Label>
              </div>
              <label htmlFor="first-image-upload" className="inline-block mt-3">
                <Button
                  onClick={() =>
                    document.getElementById('first-image-upload')?.click()
                  }
                  disabled={loading === 'add-image'}
                  type="button"
                >
                  {loading === 'add-image' ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />{' '}
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" /> Upload First Images
                    </>
                  )}
                </Button>
                <input
                  id="first-image-upload"
                  type="file"
                  accept={acceptImageTypes}
                  multiple
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </label>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {uploadError && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-sm font-medium text-red-800">
            {uploadError.message}
          </p>
          <p className="mt-1 text-sm text-red-700">
            Try compressing or re-exporting the file, then{' '}
            <Link href={uploadError.guideHref} className="underline">
              check the Content Guide
            </Link>{' '}
            for recommended tools and tips.
          </p>
        </div>
      )}

      {uploadProgress && (
        <div className="rounded-lg border p-4 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium truncate">{uploadProgress.label}</span>
            <span className="text-gray-500">{uploadProgress.percent}%</span>
          </div>
          <div className="h-2 w-full rounded-full bg-gray-200 overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all"
              style={{ width: `${uploadProgress.percent}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>
              {formatBytes(uploadProgress.loaded)} /{' '}
              {formatBytes(uploadProgress.total)}
            </span>
            <span>~{formatEta(uploadProgress.etaSeconds)} left</span>
          </div>
        </div>
      )}

      {hasAudio && audioPath && (
        <div className="rounded-lg border bg-gray-50 p-3 space-y-2">
          <p className="text-xs text-gray-600">
            Timing helper: play or pause the audio at the right moment, then use
            the <Timer className="inline h-3 w-3" /> buttons on each page to
            capture the current position.
          </p>
          <audio
            ref={audioPlayerRef}
            src={audioPath}
            controls
            className="w-full"
          />
        </div>
      )}

      {bookType === 'TEXT' ? (
        <>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={pages.map((p) => p.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-4">
                {pages.map((page, index) => (
                  <SortablePage key={page.id} id={page.id}>
                    {({ attributes, listeners }) => (
                      <Card>
                        <CardContent className="pt-6">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <span
                                {...attributes}
                                {...listeners}
                                className="cursor-move text-gray-400 hover:text-gray-600"
                                title="Drag to reorder"
                              >
                                <GripVertical className="h-4 w-4" />
                              </span>
                              <h4 className="font-medium text-sm text-gray-700">
                                Page {index + 1}
                              </h4>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeletePage(page.id)}
                                disabled={loading === page.id}
                                className="text-red-600 hover:text-red-700"
                              >
                                {loading === page.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Trash2 className="h-4 w-4" />
                                )}
                              </Button>
                            </div>
                          </div>

                          {editingPageId === page.id ? (
                            <div className="space-y-2">
                              <div className="flex flex-wrap items-center gap-1">
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="outline"
                                  onClick={() => toggleLinePrefix('# ')}
                                  title="Make the current line a title"
                                >
                                  <Heading1 className="mr-1 h-4 w-4" /> Title
                                </Button>
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="outline"
                                  onClick={() => toggleLinePrefix('## ')}
                                  title="Make the current line a subtitle"
                                >
                                  <Heading2 className="mr-1 h-4 w-4" /> Subtitle
                                </Button>
                                <span className="text-xs text-gray-400 ml-2">
                                  Start a line with &quot;# &quot; for a title
                                  or &quot;## &quot; for a subtitle.
                                </span>
                              </div>
                              <Textarea
                                ref={editTextareaRef}
                                value={editContent}
                                onChange={(e) => setEditContent(e.target.value)}
                                rows={8}
                                className="font-mono text-sm"
                                disabled={loading === page.id}
                              />
                              <div className="flex items-center justify-between text-xs">
                                <span
                                  className={
                                    editContent.trim().length >
                                    MAX_TEXT_PAGE_CHARS
                                      ? 'text-red-600 font-medium'
                                      : 'text-gray-500'
                                  }
                                >
                                  {editContent.length.toLocaleString()} /{' '}
                                  {MAX_TEXT_PAGE_CHARS.toLocaleString()}{' '}
                                  characters
                                </span>
                              </div>
                              {editContent.trim().length >
                                MAX_TEXT_PAGE_CHARS && (
                                <p className="text-xs text-red-600">
                                  This page is over the{' '}
                                  {MAX_TEXT_PAGE_CHARS.toLocaleString()}{' '}
                                  character limit. Please move the extra text to
                                  an additional page.
                                </p>
                              )}
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  onClick={() =>
                                    handleUpdatePage(page.id, editContent)
                                  }
                                  disabled={
                                    loading === page.id ||
                                    !editContent.trim() ||
                                    editContent.trim().length >
                                      MAX_TEXT_PAGE_CHARS
                                  }
                                >
                                  {loading === page.id ? (
                                    <>
                                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />{' '}
                                      Saving...
                                    </>
                                  ) : (
                                    'Save'
                                  )}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={cancelEditing}
                                  disabled={loading === page.id}
                                >
                                  Cancel
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <div
                              className="prose prose-sm max-w-none cursor-pointer hover:bg-gray-50 p-3 rounded border"
                              onClick={() => startEditing(page)}
                            >
                              {renderContentPreview(page.content)}
                            </div>
                          )}

                          {hasAudio && (
                            <div className="mt-4 pt-4 border-t">
                              <h5 className="text-sm font-medium mb-2">
                                Audio Timing (seconds)
                              </h5>
                              <div className="flex items-center gap-4">
                                <div className="flex-1 space-y-1">
                                  <Label
                                    htmlFor={`start-time-${page.id}`}
                                    className="text-xs"
                                  >
                                    Start Time
                                  </Label>
                                  <div className="flex gap-1">
                                    <Input
                                      id={`start-time-${page.id}`}
                                      type="number"
                                      step="0.1"
                                      placeholder="e.g., 0.0"
                                      value={page.audioStartTime ?? ''}
                                      onChange={(e) =>
                                        handleTimeChange(
                                          page.id,
                                          'audioStartTime',
                                          e.target.value,
                                        )
                                      }
                                    />
                                    {audioPath && (
                                      <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        title="Set from player position"
                                        onClick={() =>
                                          setTimeFromPlayer(
                                            page.id,
                                            'audioStartTime',
                                          )
                                        }
                                      >
                                        <Timer className="h-3 w-3" />
                                      </Button>
                                    )}
                                  </div>
                                </div>
                                <div className="flex-1 space-y-1">
                                  <Label
                                    htmlFor={`end-time-${page.id}`}
                                    className="text-xs"
                                  >
                                    End Time
                                  </Label>
                                  <div className="flex gap-1">
                                    <Input
                                      id={`end-time-${page.id}`}
                                      type="number"
                                      step="0.1"
                                      placeholder="e.g., 5.5"
                                      value={page.audioEndTime ?? ''}
                                      onChange={(e) =>
                                        handleTimeChange(
                                          page.id,
                                          'audioEndTime',
                                          e.target.value,
                                        )
                                      }
                                    />
                                    {audioPath && (
                                      <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        title="Set from player position"
                                        onClick={() =>
                                          setTimeFromPlayer(
                                            page.id,
                                            'audioEndTime',
                                          )
                                        }
                                      >
                                        <Timer className="h-3 w-3" />
                                      </Button>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    )}
                  </SortablePage>
                ))}
              </div>
            </SortableContext>
          </DndContext>

          <Button
            onClick={handleAddPage}
            disabled={loading === 'add-text'}
            variant="outline"
            className="w-full"
          >
            {loading === 'add-text' ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Adding...
              </>
            ) : (
              <>
                <Plus className="mr-2 h-4 w-4" /> Add Page
              </>
            )}
          </Button>
        </>
      ) : (
        <>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={pages.map((p) => p.id)}
              strategy={rectSortingStrategy}
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {pages.map((page, index) => (
                  <SortablePage key={page.id} id={page.id} className="group">
                    {({ attributes, listeners }) => (
                      <div className="relative">
                        <div className="aspect-3/4 bg-gray-100 rounded-lg border overflow-hidden">
                          <img
                            src={page.imagePath}
                            alt={`Page ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex flex-wrap justify-end gap-1 max-w-[calc(100%-0.5rem)]">
                          <span
                            {...attributes}
                            {...listeners}
                            className="cursor-move inline-flex items-center justify-center h-8 w-8 rounded-md border bg-white text-gray-500 hover:text-gray-700"
                            title="Drag to reorder"
                          >
                            <GripVertical className="h-3 w-3" />
                          </span>
                          <label htmlFor={`replace-${page.id}`}>
                            <Button
                              variant="outline"
                              size="sm"
                              className="bg-white"
                              onClick={() =>
                                document
                                  .getElementById(`replace-${page.id}`)
                                  ?.click()
                              }
                              disabled={loading === page.id}
                              type="button"
                            >
                              {loading === page.id ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <Upload className="h-3 w-3" />
                              )}
                            </Button>
                            <input
                              id={`replace-${page.id}`}
                              type="file"
                              accept={acceptImageTypes}
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  handleReplaceImage(page.id, file);
                                }
                                e.target.value = '';
                              }}
                              className="hidden"
                            />
                          </label>
                          <Button
                            variant="outline"
                            size="sm"
                            className="bg-white"
                            onClick={() => handleDeletePage(page.id)}
                            disabled={loading === page.id}
                          >
                            <Trash2 className="h-3 w-3 text-red-600" />
                          </Button>
                        </div>
                        <p className="text-xs text-gray-500 mt-1 text-center">
                          Page {index + 1}
                        </p>
                        {hasAudio && (
                          <div className="mt-2 space-y-2">
                            <div className="space-y-1">
                              <Label
                                htmlFor={`start-time-${page.id}`}
                                className="text-xs sr-only"
                              >
                                Start Time
                              </Label>
                              <div className="flex gap-1">
                                <Input
                                  id={`start-time-${page.id}`}
                                  type="number"
                                  step="0.1"
                                  placeholder="Start (s)"
                                  value={page.audioStartTime ?? ''}
                                  onChange={(e) =>
                                    handleTimeChange(
                                      page.id,
                                      'audioStartTime',
                                      e.target.value,
                                    )
                                  }
                                  className="h-8 text-xs"
                                />
                                {audioPath && (
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="h-8 px-2"
                                    title="Set from player position"
                                    onClick={() =>
                                      setTimeFromPlayer(
                                        page.id,
                                        'audioStartTime',
                                      )
                                    }
                                  >
                                    <Timer className="h-3 w-3" />
                                  </Button>
                                )}
                              </div>
                            </div>
                            <div className="space-y-1">
                              <Label
                                htmlFor={`end-time-${page.id}`}
                                className="text-xs sr-only"
                              >
                                End Time
                              </Label>
                              <div className="flex gap-1">
                                <Input
                                  id={`end-time-${page.id}`}
                                  type="number"
                                  step="0.1"
                                  placeholder="End (s)"
                                  value={page.audioEndTime ?? ''}
                                  onChange={(e) =>
                                    handleTimeChange(
                                      page.id,
                                      'audioEndTime',
                                      e.target.value,
                                    )
                                  }
                                  className="h-8 text-xs"
                                />
                                {audioPath && (
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="h-8 px-2"
                                    title="Set from player position"
                                    onClick={() =>
                                      setTimeFromPlayer(page.id, 'audioEndTime')
                                    }
                                  >
                                    <Timer className="h-3 w-3" />
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </SortablePage>
                ))}
              </div>
            </SortableContext>
          </DndContext>

          <div className="flex items-center gap-2 text-sm">
            <input
              id="optimize-images"
              type="checkbox"
              checked={optimizeImages}
              onChange={(e) => setOptimizeImages(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
            />
            <Label
              htmlFor="optimize-images"
              className="text-xs text-gray-500 font-normal cursor-pointer"
            >
              Optimize images on upload (resize to{' '}
              {uploadLimits.imageOptimizeMaxWidth}×
              {uploadLimits.imageOptimizeMaxHeight}, WebP, quality{' '}
              {uploadLimits.imageOptimizeQuality})
            </Label>
          </div>

          <label htmlFor="add-image-upload">
            <Button
              onClick={() =>
                document.getElementById('add-image-upload')?.click()
              }
              disabled={loading === 'add-image'}
              variant="outline"
              className="w-full"
              type="button"
            >
              {loading === 'add-image' ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Uploading...
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" /> Add Images
                </>
              )}
            </Button>
            <input
              id="add-image-upload"
              type="file"
              accept={acceptImageTypes}
              multiple
              onChange={handleImageUpload}
              className="hidden"
            />
          </label>
        </>
      )}
    </div>
  );
}
