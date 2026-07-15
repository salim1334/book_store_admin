import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db';

export async function POST(
  request: NextRequest,
  { params }: { params: { chapterId: string } }
) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { content } = body;

    if (!content) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 });
    }

    // Verify chapter ownership
    const chapter = await prisma.chapter.findUnique({
      where: { id: params.chapterId },
      include: { book: true },
    });

    if (!chapter || chapter.deletedAt) {
      return NextResponse.json({ error: 'Chapter not found' }, { status: 404 });
    }

    if (session.user.role !== 'SUPER_ADMIN' && chapter.authorId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Check if text content already exists
    const existingText = await prisma.chapterText.findFirst({
      where: { chapterId: params.chapterId },
      orderBy: { createdAt: 'desc' },
    });

    let chapterText;

    if (existingText) {
      // Update existing text
      chapterText = await prisma.chapterText.update({
        where: { id: existingText.id },
        data: {
          content,
          version: existingText.version + 1,
        },
      });
    } else {
      // Create new text
      chapterText = await prisma.chapterText.create({
        data: {
          chapterId: params.chapterId,
          authorId: session.user.id,
          content,
        },
      });
    }

    // Update book version if published
    if (chapter.book.status === 'PUBLISHED') {
      await prisma.book.update({
        where: { id: chapter.bookId },
        data: {
          status: 'UNPUBLISHED_CHANGES',
          version: chapter.book.version + 1,
        },
      });
    }

    return NextResponse.json(chapterText);
  } catch (error) {
    console.error('Error updating chapter text:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
