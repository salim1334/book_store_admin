import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const authorId = searchParams.get('authorId');

    // Super admin can view all books or filter by author
    // Authors can only view their own books
    const where =
      session.user.role === 'SUPER_ADMIN' && authorId
        ? { authorId, deletedAt: null }
        : session.user.role === 'SUPER_ADMIN'
          ? { deletedAt: null }
          : { authorId: session.user.id, deletedAt: null };

    const books = await prisma.book.findMany({
      where,
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
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

    return NextResponse.json(books);
  } catch (error) {
    console.error('Error fetching books:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { title, description, type, swipeDirection, isBundled } = body;

    if (!title || !type) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 },
      );
    }

    if (!['TEXT', 'IMAGE'].includes(type)) {
      return NextResponse.json({ error: 'Invalid book type' }, { status: 400 });
    }

    const validSwipeDirection = ['RTL', 'LTR'].includes(swipeDirection)
      ? swipeDirection
      : 'RTL';

    const book = await prisma.book.create({
      data: {
        title,
        description,
        type,
        swipeDirection: validSwipeDirection,
        isBundled: isBundled || false,
        authorId: session.user.id,
        status: 'DRAFT',
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json(book, { status: 201 });
  } catch (error) {
    console.error('Error creating book:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
