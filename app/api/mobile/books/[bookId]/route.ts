import { type NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { validateMobileApiKey } from '@/lib/mobile-auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ bookId: string }> },
) {
  const auth = validateMobileApiKey(request);
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { authorId } = auth;
  const { bookId } = await params;

  try {
    const book = await prisma.book.findUnique({
      where: {
        id: bookId,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
          },
        },
        chapters: {
          where: { deletedAt: null },
          orderBy: { orderIndex: 'asc' },
          include: {
            _count: {
              select: {
                pages: true,
                texts: true,
                audios: true,
              },
            },
            audios: {
              select: {
                id: true,
                audioPath: true,
                duration: true,
              },
            },
          },
        },
      },
    });

    if (!book) {
      return NextResponse.json({ error: 'Book not found' }, { status: 404 });
    }

    if (book.authorId !== authorId || book.deletedAt || book.isHidden || book.status !== 'PUBLISHED') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json(book);
  } catch (error) {
    console.error('Error fetching mobile book:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
