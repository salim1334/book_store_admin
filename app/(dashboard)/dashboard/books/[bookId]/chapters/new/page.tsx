'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Loader2 } from 'lucide-react';

export default function NewChapterPage() {
  const router = useRouter();
  const params = useParams();
  const bookId = params.bookId as string;
  
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      alert('Please enter a chapter title');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/chapters', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bookId,
          title: title.trim(),
        }),
      });

      if (response.ok) {
        const chapter = await response.json();
        router.push(`/dashboard/books/${bookId}/chapters/${chapter.id}`);
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to create chapter');
      }
    } catch (error) {
      console.error('Error creating chapter:', error);
      alert('An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/dashboard/books/${bookId}`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Add New Chapter</h1>
          <p className="text-gray-500 mt-1">Create a new chapter for your book</p>
        </div>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Chapter Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Chapter Title *</Label>
              <Input
                id="title"
                placeholder="e.g., Chapter 1: Introduction"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                disabled={loading}
                autoFocus
              />
              <p className="text-xs text-gray-500">
                Give your chapter a descriptive title
              </p>
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Chapter'
                )}
              </Button>
              <Link href={`/dashboard/books/${bookId}`}>
                <Button type="button" variant="outline" disabled={loading}>
                  Cancel
                </Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="max-w-2xl border-blue-200 bg-blue-50">
        <CardContent className="pt-6">
          <h3 className="font-medium text-blue-900 mb-2">What happens next?</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• The chapter will be created and added to your book</li>
            <li>• You'll be redirected to the chapter editor to add content</li>
            <li>• You can add text, images, or audio depending on your book type</li>
            <li>• The chapter will be saved as a draft until you publish the book</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
