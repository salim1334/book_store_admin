import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ chapterId: string }> }
) {
  const { chapterId } = await params;
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify chapter ownership
    const chapter = await prisma.chapter.findUnique({
      where: { id: chapterId },
      include: { book: true },
    });

    if (!chapter || chapter.deletedAt) {
      return NextResponse.json({ error: 'Chapter not found' }, { status: 404 });
    }

    if (
      session.user.role !== 'SUPER_ADMIN' &&
      chapter.authorId !== session.user.id
    ) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { pageIds } = body;

    if (!Array.isArray(pageIds) || pageIds.length === 0) {
      return NextResponse.json({ error: 'Invalid page IDs' }, { status: 400 });
    }

    const bookType = chapter.book.type;

    // Update order indices based on book type
    if (bookType === 'IMAGE') {
      // Update ChapterPage order
      await Promise.all(
        pageIds.map((pageId, index) =>
          prisma.chapterPage.update({
            where: { id: pageId },
            data: { orderIndex: index },
          })
        )
      );
    } else {
      // Update ChapterText order
      await Promise.all(
        pageIds.map((pageId, index) =>
          prisma.chapterText.update({
            where: { id: pageId },
            data: { orderIndex: index },
          })
        )
      );
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

    return NextResponse.json({ message: 'Pages reordered successfully' });
  } catch (error) {
    console.error('Error reordering pages:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
