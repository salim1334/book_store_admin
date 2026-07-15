import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, BookOpen } from 'lucide-react';
import { BookCard } from '@/components/books/book-card';

async function getBooks(userId: string) {
  return prisma.book.findMany({
    where: {
      authorId: userId,
      deletedAt: null,
    },
    include: {
      _count: {
        select: {
          chapters: true,
        },
      },
    },
    orderBy: {
      updatedAt: 'desc',
    },
  });
}

export default async function BooksPage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  const books = await getBooks(session.user.id);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Books</h1>
          <p className="text-gray-500 mt-1">
            Create and manage your book collection
          </p>
        </div>
        <Link href="/dashboard/books/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Create Book
          </Button>
        </Link>
      </div>

      {books.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="rounded-full bg-blue-100 p-6 mb-4">
              <BookOpen className="h-12 w-12 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2">No books yet</h3>
            <p className="text-gray-500 text-center max-w-md mb-6">
              Get started by creating your first book. You can add chapters, content, images, and audio to bring your story to life.
            </p>
            <Link href="/dashboard/books/new">
              <Button size="lg">
                <Plus className="mr-2 h-5 w-5" />
                Create Your First Book
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {books.map((book) => (
            <BookCard key={book.id} book={book} />
          ))}
        </div>
      )}
    </div>
  );
}
