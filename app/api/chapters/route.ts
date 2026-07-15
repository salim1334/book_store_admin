import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { bookId, title } = body;

    if (!bookId || !title) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Verify book ownership
    const book = await prisma.book.findUnique({
      where: { id: bookId },
      include: {
        chapters: {
          where: { deletedAt: null },
          orderBy: { orderIndex: 'desc' },
          take: 1,
        },
      },
    });

    if (!book) {
      return NextResponse.json({ error: 'Book not found' }, { status: 404 });
    }

    if (session.user.role !== 'SUPER_ADMIN' && book.authorId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get the next order index
    const nextOrderIndex = book.chapters.length > 0 ? book.chapters[0].orderIndex + 1 : 0;

    const chapter = await prisma.chapter.create({
      data: {
        title,
        bookId,
        authorId: session.user.id,
        orderIndex: nextOrderIndex,
      },
    });

    // Update book version if published
    if (book.status === 'PUBLISHED') {
      await prisma.book.update({
        where: { id: bookId },
        data: {
          status: 'UNPUBLISHED_CHANGES',
          version: book.version + 1,
        },
      });
    }

    return NextResponse.json(chapter, { status: 201 });
  } catch (error) {
    console.error('Error creating chapter:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
