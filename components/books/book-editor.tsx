'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, 
  Save, 
  Eye, 
  Upload, 
  Plus, 
  GripVertical,
  Edit,
  Trash2,
  Loader2,
  CheckCircle2,
  FileText,
  Image as ImageIcon,
  Music
} from 'lucide-react';
import { toast } from 'sonner';
import { getBookStatusBadge } from '@/lib/utils';

interface BookEditorProps {
  book: any;
}

export function BookEditor({ book: initialBook }: BookEditorProps) {
  const router = useRouter();
  const [book, setBook] = useState(initialBook);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [coverImageLoading, setCoverImageLoading] = useState(false);
  const coverImageInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    title: book.title,
    description: book.description || '',
  });

  const statusBadge = getBookStatusBadge(book.status);

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch(`/api/books/${book.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const updatedBook = await response.json();
        setBook(updatedBook);
        setLastSaved(new Date());
        toast.success('Book details saved!');
      } else {
        toast.error('Failed to save book details.');
      }
    } catch (error) {
      console.error('Error saving book:', error);
      toast.error('An error occurred while saving.');
    } finally {
      setSaving(false);
    }
  };

  const handleCoverImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCoverImageLoading(true);
    try {
      const formData = new FormData();
      formData.append('coverImage', file);

      const response = await fetch(`/api/books/${book.id}/cover`, {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        setBook((prevBook: any) => ({ ...prevBook, coverImage: result.coverImage }));
        router.refresh(); // To update server components if needed
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to upload cover image.');
      }
    } catch (error) {
      console.error('Error uploading cover image:', error);
      toast.error('An error occurred during upload.');
    } finally {
      setCoverImageLoading(false);
      // Reset file input
      if (coverImageInputRef.current) {
        coverImageInputRef.current.value = '';
      }
    }
  };

  const handlePublish = async () => {
    toast('Are you sure you want to publish this book?', {
      description: 'It will become available to all readers.',
      action: {
        label: 'Publish',
        onClick: async () => {
          setSaving(true);
          try {
            const response = await fetch(`/api/books/${book.id}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ status: 'PUBLISHED' }),
            });

            if (response.ok) {
              const updatedBook = await response.json();
              setBook(updatedBook);
              toast.success('Book published successfully!');
              router.refresh();
            } else {
              toast.error('Failed to publish book.');
            }
          } catch (error) {
            console.error('Error publishing book:', error);
            toast.error('An error occurred during publishing.');
          } finally {
            setSaving(false);
          }
        },
      },
      cancel: {
        label: 'Cancel',
        onClick: () => {},
      },
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/books">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight">{book.title}</h1>
              <Badge className={statusBadge.className}>
                {statusBadge.label}
              </Badge>
            </div>
            <p className="text-gray-500 mt-1">
              {book.type} Book • {book.chapters ? book.chapters.length : 0} chapters
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {lastSaved && (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              Saved {lastSaved.toLocaleTimeString()}
            </div>
          )}
          <Button variant="outline" onClick={handleSave} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save
              </>
            )}
          </Button>
          <Link href={`/dashboard/books/${book.id}/preview`}>
            <Button variant="outline">
              <Eye className="mr-2 h-4 w-4" />
              Preview
            </Button>
          </Link>
          {book.status !== 'PUBLISHED' && (
            <Button onClick={handlePublish} disabled={saving}>
              Publish Book
            </Button>
          )}
          {book.status === 'UNPUBLISHED_CHANGES' && (
            <Button onClick={handlePublish} disabled={saving}>
              Republish Changes
            </Button>
          )}
        </div>
      </div>

      {/* Book Details */}
      <Card>
        <CardHeader>
          <CardTitle>Book Details</CardTitle>
          <CardDescription>Basic information about your book</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Type</Label>
              <Input value={book.type} disabled />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <textarea
              id="description"
              className="flex min-h-[100px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>Cover Image</Label>
            <div className="flex items-center gap-4">
              {book.coverImage ? (
                <img src={book.coverImage} alt="Cover" className="h-32 w-24 object-cover rounded" />
              ) : (
                <div className="h-32 w-24 bg-gray-100 rounded flex items-center justify-center">
                  <ImageIcon className="h-8 w-8 text-gray-400" />
                </div>
              )}
              <div>
                <Button 
                  variant="outline"
                  onClick={() => coverImageInputRef.current?.click()}
                  disabled={coverImageLoading}
                >
                  {coverImageLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      Upload Cover
                    </>
                  )}
                </Button>
                <input 
                  type="file"
                  ref={coverImageInputRef}
                  onChange={handleCoverImageUpload}
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                />
                <p className="text-xs text-gray-500 mt-2">Recommended: 3:4 ratio, &lt;1MB</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Chapters */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Chapters</CardTitle>
              <CardDescription>
                Manage your book chapters and content
              </CardDescription>
            </div>
            <Link href={`/dashboard/books/${book.id}/chapters/new`}>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Chapter
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {!book.chapters || book.chapters.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-4 text-lg font-medium text-gray-900">No chapters yet</h3>
              <p className="mt-2 text-sm text-gray-500">
                Get started by adding your first chapter.
              </p>
              <Link href={`/dashboard/books/${book.id}/chapters/new`}>
                <Button className="mt-4">
                  <Plus className="mr-2 h-4 w-4" />
                  Add First Chapter
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {book.chapters?.map((chapter: any, index: number) => (
                <div
                  key={chapter.id}
                  className="flex items-center gap-3 p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <GripVertical className="h-5 w-5 text-gray-400 cursor-move" />
                  <div className="flex-1">
                    <div className="font-medium">{chapter.title}</div>
                    <div className="text-sm text-gray-500">
                      Chapter {index + 1}
                      {book.type === 'IMAGE' && chapter.pages && ` • ${chapter.pages.length} pages`}
                      {book.type === 'TEXT' && chapter.texts && chapter.texts.length > 0 && ' • Has content'}
                      {chapter.audios && chapter.audios.length > 0 && ' • Has audio'}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {chapter.audios && chapter.audios.length > 0 && (
                      <Music className="h-4 w-4 text-blue-600" />
                    )}
                    <Link href={`/dashboard/books/${book.id}/chapters/${chapter.id}`}>
                      <Button variant="outline" size="sm">
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </Button>
                    </Link>
                    <Button variant="outline" size="sm" className="text-red-600">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Publishing Guidelines */}
      {book.status === 'DRAFT' && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="text-blue-900">Pre-Publish Checklist</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-blue-800">
              <li className="flex items-center gap-2">
                <CheckCircle2 className={`h-4 w-4 ${book.title ? 'text-green-600' : 'text-gray-400'}`} />
                Book has a title
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className={`h-4 w-4 ${book.chapters && book.chapters.length > 0 ? 'text-green-600' : 'text-gray-400'}`} />
                Book has at least one chapter
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className={`h-4 w-4 ${book.coverImage ? 'text-green-600' : 'text-gray-400'}`} />
                Book has a cover image (recommended)
              </li>
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
