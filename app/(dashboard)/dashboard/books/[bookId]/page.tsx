import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { BookEditor } from '@/components/books/book-editor';

async function getBook(bookId: string, userId: string, userRole: string) {
  const book = await prisma.book.findUnique({
    where: { id: bookId },
    include: {
      author: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      chapters: {
        where: { deletedAt: null },
        orderBy: { orderIndex: 'asc' },
        include: {
          pages: {
            orderBy: { orderIndex: 'asc' },
          },
          texts: true,
          audios: true,
        },
      },
    },
  });

  if (!book) {
    return null;
  }

  // Check authorization
  if (userRole !== 'SUPER_ADMIN' && book.authorId !== userId) {
    return null;
  }

  return book;
}

export default async function BookEditPage({
  params: { bookId },
}: {
  params: { bookId: string };
}) {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  const book = await getBook(bookId, session.user.id, session.user.role);

  if (!book) {
    redirect('/dashboard/books');
  }

  return <BookEditor book={book} />;
}
