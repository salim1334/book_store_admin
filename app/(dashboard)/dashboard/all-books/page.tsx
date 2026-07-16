import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { BookCard } from '@/components/books/book-card';

async function getAllBooks() {
  return prisma.book.findMany({
    where: {
      deletedAt: null,
    },
    include: {
      author: {
        select: {
          name: true,
        },
      },
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

export default async function AllBooksPage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  if (session.user.role !== 'SUPER_ADMIN') {
    redirect('/dashboard');
  }

  const books = await getAllBooks();

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
            All Books
          </h1>
          <p className="text-gray-500 mt-1">
            A collection of all books from all authors on the platform.
          </p>
        </div>
      </div>

      {books.length === 0 ? (
        <p>No books have been created yet.</p>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {books.map((book) => (
            <BookCard key={book.id} book={book} />
          ))}
        </div>
      )}
    </div>
  );
}
