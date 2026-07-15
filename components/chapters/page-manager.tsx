'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import {
  Trash2,
  ChevronUp,
  ChevronDown,
  Plus,
  FileText,
  Image as ImageIcon,
  Upload,
  Loader2,
} from 'lucide-react';

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
  // onUpdate now expects a data object with the new pages array
  onUpdate: (data: { pages: Page[] }) => void;
}

export function PageManager({
  bookType,
  pages: initialPages,
  chapterId,
  hasAudio,
  onUpdate,
}: PageManagerProps) {
  // Local state for instant UI updates
  const [pages, setPages] = useState<Page[]>(initialPages);
  const [loading, setLoading] = useState<string | null>(null);
  const [editingPageId, setEditingPageId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');

  const handleTimeChange = (pageId: string, field: 'audioStartTime' | 'audioEndTime', value: string) => {
    const numericValue = value === '' ? null : parseFloat(value);
    if (value !== '' && isNaN(numericValue!)) return; // Ignore invalid input

    const updatedPages = pages.map(p => 
      p.id === pageId ? { ...p, [field]: numericValue } : p
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
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading('add-image');
    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch(`/api/chapters/${chapterId}/pages`, {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const newPage = await response.json(); // expects { id, imagePath, orderIndex }
        const updatedPages = [...pages, newPage];
        setPages(updatedPages);
        notifyParent(updatedPages);
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to upload image');
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('An error occurred');
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
        }
      );

      if (response.ok) {
        // Update local state
        const updatedPages = pages.map((p) =>
          p.id === pageId ? { ...p, content } : p
        );
        setPages(updatedPages);
        setEditingPageId(null);
        setEditContent('');
        notifyParent(updatedPages);
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
              }
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

  const handleMovePage = async (index: number, direction: 'up' | 'down') => {
    const newPages = [...pages];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newPages.length) return;

    // Swap
    [newPages[index], newPages[targetIndex]] = [
      newPages[targetIndex],
      newPages[index],
    ];

    setLoading('reorder');
    try {
      const pageIds = newPages.map((p) => p.id);
      const response = await fetch(`/api/chapters/${chapterId}/pages/reorder`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pageIds }),
      });

      if (response.ok) {
        // Update local state with the reordered array
        setPages(newPages);
        notifyParent(newPages);
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to reorder pages');
        // Revert to original order (optional)
        setPages(initialPages);
      }
    } catch (error) {
      console.error('Error reordering pages:', error);
      toast.error('An error occurred');
      setPages(initialPages);
    } finally {
      setLoading(null);
    }
  };

  const handleReplaceImage = async (pageId: string, file: File) => {
    setLoading(pageId);
    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch(
        `/api/chapters/${chapterId}/pages/${pageId}`,
        {
          method: 'PATCH',
          body: formData,
        }
      );

      if (response.ok) {
        const updatedPage = await response.json(); // expects { imagePath, ... }
        const updatedPages = pages.map((p) =>
          p.id === pageId ? { ...p, imagePath: updatedPage.imagePath } : p
        );
        setPages(updatedPages);
        notifyParent(updatedPages);
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to replace image');
      }
    } catch (error) {
      console.error('Error replacing image:', error);
      toast.error('An error occurred');
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
            <label htmlFor="first-image-upload" className="inline-block mt-4">
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
                    <Upload className="mr-2 h-4 w-4" /> Upload First Image
                  </>
                )}
              </Button>
              <input
                id="first-image-upload"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleImageUpload}
                className="hidden"
              />
            </label>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {bookType === 'TEXT' ? (
        <>
          {pages.map((page, index) => (
            <Card key={page.id}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-3">
                  <h4 className="font-medium text-sm text-gray-700">
                    Page {index + 1}
                  </h4>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleMovePage(index, 'up')}
                      disabled={index === 0 || loading !== null}
                    >
                      <ChevronUp className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleMovePage(index, 'down')}
                      disabled={index === pages.length - 1 || loading !== null}
                    >
                      <ChevronDown className="h-4 w-4" />
                    </Button>
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
                    <Textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      rows={6}
                      className="font-mono text-sm"
                      disabled={loading === page.id}
                    />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleUpdatePage(page.id, editContent)}
                        disabled={loading === page.id || !editContent.trim()}
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
                    <p className="whitespace-pre-wrap text-sm">
                      {page.content}
                    </p>
                  </div>
                )}

                {hasAudio && (
                  <div className="mt-4 pt-4 border-t">
                    <h5 className="text-sm font-medium mb-2">Audio Timing (seconds)</h5>
                    <div className="flex items-center gap-4">
                      <div className="flex-1 space-y-1">
                        <Label htmlFor={`start-time-${page.id}`} className="text-xs">Start Time</Label>
                        <Input 
                          id={`start-time-${page.id}`}
                          type="number"
                          step="0.1"
                          placeholder="e.g., 0.0"
                          value={page.audioStartTime ?? ''}
                          onChange={(e) => handleTimeChange(page.id, 'audioStartTime', e.target.value)}
                        />
                      </div>
                      <div className="flex-1 space-y-1">
                        <Label htmlFor={`end-time-${page.id}`} className="text-xs">End Time</Label>
                        <Input 
                          id={`end-time-${page.id}`}
                          type="number"
                          step="0.1"
                          placeholder="e.g., 5.5"
                          value={page.audioEndTime ?? ''}
                          onChange={(e) => handleTimeChange(page.id, 'audioEndTime', e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}

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
          <div className="grid grid-cols-3 gap-4">
            {pages.map((page, index) => (
              <div key={page.id} className="relative group">
                <div className="aspect-3/4 bg-gray-100 rounded-lg border overflow-hidden">
                  <img
                    src={page.imagePath}
                    alt={`Page ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    className="bg-white"
                    onClick={() => handleMovePage(index, 'up')}
                    disabled={index === 0 || loading !== null}
                  >
                    <ChevronUp className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="bg-white"
                    onClick={() => handleMovePage(index, 'down')}
                    disabled={index === pages.length - 1 || loading !== null}
                  >
                    <ChevronDown className="h-3 w-3" />
                  </Button>
                  <label htmlFor={`replace-${page.id}`}>
                    <Button
                      variant="outline"
                      size="sm"
                      className="bg-white"
                      onClick={() =>
                        document.getElementById(`replace-${page.id}`)?.click()
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
                      accept="image/jpeg,image/png,image/webp"
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
                        <Label htmlFor={`start-time-${page.id}`} className="text-xs sr-only">Start Time</Label>
                        <Input 
                          id={`start-time-${page.id}`}
                          type="number"
                          step="0.1"
                          placeholder="Start (s)"
                          value={page.audioStartTime ?? ''}
                          onChange={(e) => handleTimeChange(page.id, 'audioStartTime', e.target.value)}
                          className="h-8 text-xs"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor={`end-time-${page.id}`} className="text-xs sr-only">End Time</Label>
                        <Input 
                          id={`end-time-${page.id}`}
                          type="number"
                          step="0.1"
                          placeholder="End (s)"
                          value={page.audioEndTime ?? ''}
                          onChange={(e) => handleTimeChange(page.id, 'audioEndTime', e.target.value)}
                          className="h-8 text-xs"
                        />
                      </div>
                  </div>
                )}
              </div>
            ))}
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
                  <Plus className="mr-2 h-4 w-4" /> Add Image
                </>
              )}
            </Button>
            <input
              id="add-image-upload"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleImageUpload}
              className="hidden"
            />
          </label>
        </>
      )}
    </div>
  );
}
