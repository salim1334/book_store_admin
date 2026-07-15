'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { BookOpen, Edit, Trash2, Loader2 } from 'lucide-react';
import { getBookStatusBadge, formatDate } from '@/lib/utils';

export function BookCard({ book }: { book: any }) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const statusBadge = getBookStatusBadge(book.status);

  const handleDelete = async () => {
    toast(`Are you sure you want to delete "${book.title}"?`, {
      action: {
        label: 'Delete',
        onClick: async () => {
          setIsDeleting(true);
          try {
            const response = await fetch(`/api/books/${book.id}`, {
              method: 'DELETE',
            });

            if (response.ok) {
              toast.success('Book deleted successfully.');
              router.refresh();
            } else {
              const error = await response.json();
              toast.error(error.error || 'Failed to delete book.');
            }
          } catch (error) {
            console.error('Error deleting book:', error);
            toast.error('An error occurred while deleting the book.');
          } finally {
            setIsDeleting(false);
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

  return (
    <Card
      key={book.id}
      className="overflow-hidden hover:shadow-lg transition-shadow"
    >
      <div className="aspect-3/4 bg-linear-to-br from-gray-100 to-gray-300 relative">
        {book.coverImage ? (
          <img
            src={book.coverImage}
            alt={book.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <BookOpen className="h-16 w-16 text-gray-400" />
          </div>
        )}
        <div className="absolute top-3 right-3">
          <Badge className={statusBadge.className}>{statusBadge.label}</Badge>
        </div>
      </div>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="line-clamp-1">{book.title}</CardTitle>
            <CardDescription className="line-clamp-2 mt-1">
              {book.description || 'No description'}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">Type:</span>
            <span className="font-medium">{book.type}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">Chapters:</span>
            <span className="font-medium">{book._count.chapters}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">Updated:</span>
            <span className="font-medium">{formatDate(book.updatedAt)}</span>
          </div>

          {book.author && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Author:</span>
              <span className="font-medium">{book.author.name}</span>
            </div>
          )}

          <div className="flex gap-2 pt-3 border-t">
            <Link href={`/dashboard/books/${book.id}`} className="flex-1">
              <Button variant="outline" className="w-full" size="sm">
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </Button>
            </Link>
            <Button
              variant="outline"
              size="sm"
              className="text-red-600 hover:text-red-700"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
