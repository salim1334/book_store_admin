import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db';
import { uploadImage } from '@/lib/file-upload';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ chapterId: string }> },
) {
  const { chapterId } = await params;

  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const chapter = await prisma.chapter.findUnique({
      where: { id: chapterId },
      include: {
        book: true,
        pages: {
          orderBy: { orderIndex: 'asc' },
        },
        texts: {
          orderBy: { orderIndex: 'asc' },
        },
      },
    });

    if (!chapter || chapter.deletedAt) {
      return NextResponse.json({ error: 'Chapter not found' }, { status: 404 });
    }

    // Check authorization
    if (
      session.user.role !== 'SUPER_ADMIN' &&
      chapter.authorId !== session.user.id
    ) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Return appropriate pages based on book type
    const pages = chapter.book.type === 'IMAGE' ? chapter.pages : chapter.texts;

    return NextResponse.json({ pages, bookType: chapter.book.type });
  } catch (error) {
    console.error('Error fetching pages:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ chapterId: string }> },
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
      include: {
        book: true,
        pages: {
          orderBy: { orderIndex: 'desc' },
          take: 1,
        },
        texts: {
          orderBy: { orderIndex: 'desc' },
          take: 1,
        },
      },
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

    const bookType = chapter.book.type;

    if (bookType === 'IMAGE') {
      // Handle image upload
      const formData = await request.formData();
      const file = formData.get('image') as File;

      if (!file) {
        return NextResponse.json(
          { error: 'Image file is required' },
          { status: 400 },
        );
      }

      // Upload image
      const uploadResult = await uploadImage(file, chapter.bookId, chapterId);

      if (!uploadResult.success) {
        return NextResponse.json(
          { error: uploadResult.error },
          { status: 400 },
        );
      }

      // Get next order index
      const nextOrderIndex =
        chapter.pages.length > 0 ? chapter.pages[0].orderIndex + 1 : 0;

      // Create ChapterPage
      const page = await prisma.chapterPage.create({
        data: {
          chapterId: chapterId,
          authorId: session.user.id,
          imagePath: uploadResult.filePath!,
          orderIndex: nextOrderIndex,
          swipeDirection: chapter.book.swipeDirection,
        },
      });

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

      return NextResponse.json(page, { status: 201 });
    } else {
      // Handle text content
      const body = await request.json();
      const { content } = body;

      if (!content || !content.trim()) {
        return NextResponse.json(
          { error: 'Content is required' },
          { status: 400 },
        );
      }

      // Get next order index
      const nextOrderIndex =
        chapter.texts.length > 0 ? chapter.texts[0].orderIndex + 1 : 0;

      // Create ChapterText
      const textPage = await prisma.chapterText.create({
        data: {
          chapterId: chapterId,
          authorId: session.user.id,
          content: content.trim(),
          orderIndex: nextOrderIndex,
          swipeDirection: chapter.book.swipeDirection,
        },
      });

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

      return NextResponse.json(textPage, { status: 201 });
    }
  } catch (error) {
    console.error('Error creating page:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
