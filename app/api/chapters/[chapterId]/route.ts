import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: { chapterId: string } }
) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const chapter = await prisma.chapter.findUnique({
      where: { id: params.chapterId },
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
    if (session.user.role !== 'SUPER_ADMIN' && chapter.authorId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json(chapter);
  } catch (error) {
    console.error('Error fetching chapter:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { chapterId: string } }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const chapter = await prisma.chapter.findUnique({
      where: { id: params.chapterId },
      include: { book: true },
    });

    if (!chapter) {
      return NextResponse.json({ error: 'Chapter not found' }, { status: 404 });
    }

    if (session.user.role !== 'SUPER_ADMIN' && chapter.authorId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { title, pages, audioPath } = body;

    // Use a transaction to ensure all updates are atomic
    const updatedChapter = await prisma.$transaction(async (tx) => {
      // 1. Update Chapter Title
      const newChapter = await tx.chapter.update({
        where: { id: params.chapterId },
        data: {
          title: title.trim(),
          version: { increment: 1 },
        },
        include: { book: true },
      });

      // 2. Update Pages (Text or Image)
      const pageModel = newChapter.book.type === 'TEXT' ? tx.chapterText : tx.chapterPage;
      const existingPages = await (pageModel as any).findMany({
        where: { chapterId: params.chapterId },
      });

      const incomingPageIds = new Set(pages.map((p: any) => p.id));
      const pagesToDelete = existingPages.filter((p: any) => !incomingPageIds.has(p.id));

      for (const page of pagesToDelete) {
        await (pageModel as any).delete({ where: { id: page.id } });
      }

      for (let i = 0; i < pages.length; i++) {
        const page = pages[i];
        await (pageModel as any).upsert({
          where: { id: page.id },
          create: {
            ...page,
            orderIndex: i,
            chapterId: params.chapterId,
            authorId: session.user.id,
          },
          update: {
            content: page.content,
            imagePath: page.imagePath,
            orderIndex: i,
            audioStartTime: page.audioStartTime,
            audioEndTime: page.audioEndTime,
          },
        });
      }

      // 3. Update Audio
      const existingAudio = await tx.chapterAudio.findFirst({
        where: { chapterId: params.chapterId },
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
              chapterId: params.chapterId,
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
      where: { id: params.chapterId },
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
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { chapterId: string } }
) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const chapter = await prisma.chapter.findUnique({
      where: { id: params.chapterId },
      include: { book: true },
    });

    if (!chapter) {
      return NextResponse.json({ error: 'Chapter not found' }, { status: 404 });
    }

    // Check authorization
    if (session.user.role !== 'SUPER_ADMIN' && chapter.authorId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { title, orderIndex } = body;

    const updatedChapter = await prisma.chapter.update({
      where: { id: params.chapterId },
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
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { chapterId: string } }
) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const chapter = await prisma.chapter.findUnique({
      where: { id: params.chapterId },
      include: { book: true },
    });

    if (!chapter) {
      return NextResponse.json({ error: 'Chapter not found' }, { status: 404 });
    }

    // Check authorization
    if (session.user.role !== 'SUPER_ADMIN' && chapter.authorId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Soft delete
    await prisma.chapter.update({
      where: { id: params.chapterId },
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
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
