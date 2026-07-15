import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { authorId: string } }
) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const author = await prisma.user.findUnique({
      where: { id: params.authorId },
    });

    if (!author) {
      return NextResponse.json({ error: 'Author not found' }, { status: 404 });
    }

    if (author.role !== 'AUTHOR') {
      return NextResponse.json({ error: 'User is not an author' }, { status: 400 });
    }

    const body = await request.json();
    const { isActive, name, email } = body;

    const updatedAuthor = await prisma.user.update({
      where: { id: params.authorId },
      data: {
        ...(isActive !== undefined && { isActive }),
        ...(name && { name }),
        ...(email && { email }),
      },
      select: {
        id: true,
        email: true,
        name: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json(updatedAuthor);
  } catch (error) {
    console.error('Error updating author:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { authorId: string } }
) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const author = await prisma.user.findUnique({
      where: { id: params.authorId },
    });

    if (!author) {
      return NextResponse.json({ error: 'Author not found' }, { status: 404 });
    }

    if (author.role !== 'AUTHOR') {
      return NextResponse.json({ error: 'User is not an author' }, { status: 400 });
    }

    // Delete the author (cascade will handle related data)
    await prisma.user.delete({
      where: { id: params.authorId },
    });

    return NextResponse.json({ message: 'Author deleted successfully' });
  } catch (error) {
    console.error('Error deleting author:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
