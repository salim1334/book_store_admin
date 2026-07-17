'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
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
import { ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

export default function NewBookPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'TEXT' as 'TEXT' | 'IMAGE',
    swipeDirection: 'RTL' as 'RTL' | 'LTR',
    isBundled: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/books', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const book = await response.json();
        toast.success('Book created successfully!');
        router.push(`/dashboard/books/${book.id}`);
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to create book');
      }
    } catch (error) {
      console.error('Error creating book:', error);
      toast.error('An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/books">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Create New Book</h1>
          <p className="text-gray-500 mt-1">
            Add a new book to your collection
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Book Details</CardTitle>
          <CardDescription>
            Enter the basic information about your book
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Book Title *</Label>
              <Input
                id="title"
                placeholder="Enter book title"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                required
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <textarea
                id="description"
                className="flex min-h-[120px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Enter book description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label>Book Type *</Label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, type: 'TEXT' })}
                  disabled={loading}
                  className={`p-4 border-2 rounded-lg text-left transition-all ${
                    formData.type === 'TEXT'
                      ? 'border-green-600 bg-green-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="font-semibold mb-1">Text Book</div>
                  <div className="text-sm text-gray-500">
                    Chapters contain written text content
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, type: 'IMAGE' })}
                  disabled={loading}
                  className={`p-4 border-2 rounded-lg text-left transition-all ${
                    formData.type === 'IMAGE'
                      ? 'border-green-600 bg-green-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="font-semibold mb-1">Image Book</div>
                  <div className="text-sm text-gray-500">
                    Chapters contain page images
                  </div>
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Swipe Direction *</Label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() =>
                    setFormData({ ...formData, swipeDirection: 'RTL' })
                  }
                  disabled={loading}
                  className={`p-4 border-2 rounded-lg text-left transition-all ${
                    formData.swipeDirection === 'RTL'
                      ? 'border-green-600 bg-green-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="font-semibold mb-1">Right to Left (RTL)</div>
                  <div className="text-sm text-gray-500">
                    For Arabic, Hebrew, and other RTL languages
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setFormData({ ...formData, swipeDirection: 'LTR' })
                  }
                  disabled={loading}
                  className={`p-4 border-2 rounded-lg text-left transition-all ${
                    formData.swipeDirection === 'LTR'
                      ? 'border-green-600 bg-green-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="font-semibold mb-1">Left to Right (LTR)</div>
                  <div className="text-sm text-gray-500">
                    For English, Amharic, and other LTR languages
                  </div>
                </button>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              {/* Hide this input */}
              <input
                type="hidden"
                id="isBundled"
                checked={formData.isBundled}
                onChange={(e) =>
                  setFormData({ ...formData, isBundled: e.target.checked })
                }
                disabled={loading}
                className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
              />
            </div>

            <div className="flex gap-3 pt-4 border-t">
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Book'
                )}
              </Button>
              <Link href="/dashboard/books">
                <Button type="button" variant="outline" disabled={loading}>
                  Cancel
                </Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
