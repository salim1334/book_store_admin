import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db';
import { validateAudioTimings } from '@/lib/audio-timing';
import type { ChapterText, ChapterPage } from '@prisma/client';

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
        texts: true,
        audios: true,
      },
    });

    if (!chapter) {
      return NextResponse.json({ error: 'Chapter not found' }, { status: 404 });
    }

    // Check authorization
    if (
      session.user.role !== 'SUPER_ADMIN' &&
      chapter.authorId !== session.user.id
    ) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json(chapter);
  } catch (error) {
    console.error('Error fetching chapter:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}

export async function PUT(
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
      include: { book: true },
    });

    if (!chapter) {
      return NextResponse.json({ error: 'Chapter not found' }, { status: 404 });
    }

    if (
      session.user.role !== 'SUPER_ADMIN' &&
      chapter.authorId !== session.user.id
    ) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { title, pages, audioPath } = body;

    const hasAudio = !!audioPath;
    const timingError = validateAudioTimings(pages, hasAudio);
    if (timingError) {
      return NextResponse.json({ error: timingError }, { status: 400 });
    }

    // Use a transaction to ensure all updates are atomic
    const updatedChapter = await prisma.$transaction(async (tx) => {
      // 1. Update Chapter Title
      const newChapter = await tx.chapter.update({
        where: { id: chapterId },
        data: {
          title: title.trim(),
          version: { increment: 1 },
        },
        include: { book: true },
      });

      // 2. Update Pages (Text or Image) in a type-safe way
      const incomingPageIds = new Set(pages.map((p: { id: string }) => p.id));

      if (newChapter.book.type === 'TEXT') {
        const existingPages = await tx.chapterText.findMany({
          where: { chapterId },
        });
        const pagesToDelete = existingPages.filter(
          (p) => !incomingPageIds.has(p.id),
        );

        for (const page of pagesToDelete) {
          await tx.chapterText.delete({ where: { id: page.id } });
        }

        for (let i = 0; i < pages.length; i++) {
          const pageData = pages[i];
          await tx.chapterText.upsert({
            where: { id: pageData.id },
            create: {
              id: pageData.id,
              content: pageData.content || '',
              orderIndex: i,
              chapterId: chapterId,
              authorId: session.user.id,
              audioStartTime: hasAudio ? pageData.audioStartTime : null,
              audioEndTime: hasAudio ? pageData.audioEndTime : null,
            },
            update: {
              content: pageData.content || '',
              orderIndex: i,
              audioStartTime: hasAudio ? pageData.audioStartTime : null,
              audioEndTime: hasAudio ? pageData.audioEndTime : null,
            },
          });
        }
      } else if (newChapter.book.type === 'IMAGE') {
        const existingPages = await tx.chapterPage.findMany({
          where: { chapterId },
        });
        const pagesToDelete = existingPages.filter(
          (p) => !incomingPageIds.has(p.id),
        );

        for (const page of pagesToDelete) {
          await tx.chapterPage.delete({ where: { id: page.id } });
        }

        for (let i = 0; i < pages.length; i++) {
          const pageData = pages[i];
          await tx.chapterPage.upsert({
            where: { id: pageData.id },
            create: {
              id: pageData.id,
              imagePath: pageData.imagePath || '',
              orderIndex: i,
              chapterId: chapterId,
              authorId: session.user.id,
              audioStartTime: hasAudio ? pageData.audioStartTime : null,
              audioEndTime: hasAudio ? pageData.audioEndTime : null,
            },
            update: {
              imagePath: pageData.imagePath || '',
              orderIndex: i,
              audioStartTime: hasAudio ? pageData.audioStartTime : null,
              audioEndTime: hasAudio ? pageData.audioEndTime : null,
            },
          });
        }
      }

      // 3. Update Audio
      const existingAudio = await tx.chapterAudio.findFirst({
        where: { chapterId: chapterId },
      });

      if (audioPath) {
        if (existingAudio) {
          await tx.chapterAudio.update({
            where: { id: existingAudio.id },
            data: { audioPath },
          });
        } else {
          await tx.chapterAudio.create({
            data: {
              chapterId: chapterId,
              authorId: session.user.id,
              audioPath,
            },
          });
        }
      } else if (existingAudio) {
        await tx.chapterAudio.delete({ where: { id: existingAudio.id } });
      }

      // 4. Update Book Status if needed
      if (newChapter.book.status === 'PUBLISHED') {
        await tx.book.update({
          where: { id: newChapter.bookId },
          data: {
            status: 'UNPUBLISHED_CHANGES',
            version: { increment: 1 },
          },
        });
      }

      return newChapter;
    });

    // Refetch the full chapter data to return to the client
    const finalChapter = await prisma.chapter.findUnique({
      where: { id: chapterId },
      include: {
        book: true,
        pages: { orderBy: { orderIndex: 'asc' } },
        texts: { orderBy: { orderIndex: 'asc' } },
        audios: true,
      },
    });

    return NextResponse.json(finalChapter);
  } catch (error) {
    console.error('Error saving chapter:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}

export async function PATCH(
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
      include: { book: true },
    });

    if (!chapter) {
      return NextResponse.json({ error: 'Chapter not found' }, { status: 404 });
    }

    // Check authorization
    if (
      session.user.role !== 'SUPER_ADMIN' &&
      chapter.authorId !== session.user.id
    ) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { title, orderIndex } = body;

    const updatedChapter = await prisma.chapter.update({
      where: { id: chapterId },
      data: {
        ...(title && { title }),
        ...(orderIndex !== undefined && { orderIndex }),
        version: chapter.version + 1,
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

    return NextResponse.json(updatedChapter);
  } catch (error) {
    console.error('Error updating chapter:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}

export async function DELETE(
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
      include: { book: true },
    });

    if (!chapter) {
      return NextResponse.json({ error: 'Chapter not found' }, { status: 404 });
    }

    // Check authorization
    if (
      session.user.role !== 'SUPER_ADMIN' &&
      chapter.authorId !== session.user.id
    ) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Soft delete
    await prisma.chapter.update({
      where: { id: chapterId },
      data: {
        deletedAt: new Date(),
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

    return NextResponse.json({ message: 'Chapter deleted successfully' });
  } catch (error) {
    console.error('Error deleting chapter:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
