import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db';
import { validateBookForPublish } from '@/lib/publish-validation';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ bookId: string }> },
) {
  const { bookId } = await params;
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

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
            _count: {
              select: {
                pages: true,
                texts: true,
                audios: true,
              },
            },
          },
        },
      },
    });

    if (!book) {
      return NextResponse.json({ error: 'Book not found' }, { status: 404 });
    }

    // Check authorization
    if (
      session.user.role !== 'SUPER_ADMIN' &&
      book.authorId !== session.user.id
    ) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json(book);
  } catch (error) {
    console.error('Error fetching book:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ bookId: string }> },
) {
  const { bookId } = await params;
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const book = await prisma.book.findUnique({
      where: { id: bookId },
    });

    if (!book) {
      return NextResponse.json({ error: 'Book not found' }, { status: 404 });
    }

    // Check authorization
    if (
      session.user.role !== 'SUPER_ADMIN' &&
      book.authorId !== session.user.id
    ) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { title, description, coverImage, isHidden, status, swipeDirection } =
      body;

    // Pre-publish validation: block publishing incomplete books
    if (status === 'PUBLISHED') {
      const bookForValidation = await prisma.book.findUnique({
        where: { id: bookId },
        include: {
          chapters: {
            where: { deletedAt: null },
            orderBy: { orderIndex: 'asc' },
            include: {
              pages: { orderBy: { orderIndex: 'asc' } },
              texts: { orderBy: { orderIndex: 'asc' } },
              audios: true,
            },
          },
        },
      });

      const issues = validateBookForPublish(bookForValidation!);
      if (issues.length > 0) {
        return NextResponse.json(
          {
            error: 'Book is not ready to publish. Please fix the issues below.',
            issues,
          },
          { status: 400 },
        );
      }
    }

    // If book is published and being edited, create unpublished changes status
    const newStatus =
      book.status === 'PUBLISHED' &&
      (title || description || coverImage || swipeDirection)
        ? 'UNPUBLISHED_CHANGES'
        : status || book.status;

    const updatedBook = await prisma.book.update({
      where: { id: bookId },
      data: {
        ...(title && { title }),
        ...(description !== undefined && { description }),
        ...(coverImage !== undefined && { coverImage }),
        ...(isHidden !== undefined && { isHidden }),
        ...(swipeDirection &&
          ['RTL', 'LTR'].includes(swipeDirection) && { swipeDirection }),
        status: newStatus,
        ...(newStatus === 'PUBLISHED' && { publishedAt: new Date() }),
        version: book.version + 1,
      },
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
            _count: {
              select: {
                pages: true,
                texts: true,
                audios: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json(updatedBook);
  } catch (error) {
    console.error('Error updating book:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ bookId: string }> },
) {
  const { bookId } = await params;
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const book = await prisma.book.findUnique({
      where: { id: bookId },
    });

    if (!book) {
      return NextResponse.json({ error: 'Book not found' }, { status: 404 });
    }

    // Check authorization
    if (
      session.user.role !== 'SUPER_ADMIN' &&
      book.authorId !== session.user.id
    ) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Soft delete
    await prisma.book.update({
      where: { id: bookId },
      data: {
        deletedAt: new Date(),
      },
    });

    return NextResponse.json({ message: 'Book deleted successfully' });
  } catch (error) {
    console.error('Error deleting book:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
