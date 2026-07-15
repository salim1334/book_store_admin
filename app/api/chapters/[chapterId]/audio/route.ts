import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db';
import { uploadAudio, deleteFile } from '@/lib/file-upload';

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
      include: {
        book: true,
        audios: {
          orderBy: { createdAt: 'desc' },
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

    // Handle audio upload
    const formData = await request.formData();
    const file = formData.get('audio') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'Audio file is required' },
        { status: 400 }
      );
    }

    // Upload audio
    const uploadResult = await uploadAudio(
      file,
      chapter.bookId,
      chapterId
    );

    if (!uploadResult.success) {
      return NextResponse.json({ error: uploadResult.error }, { status: 400 });
    }

    // If audio already exists, delete old file and update
    if (chapter.audios.length > 0) {
      const existingAudio = chapter.audios[0];
      await deleteFile(existingAudio.audioPath);

      const updatedAudio = await prisma.chapterAudio.update({
        where: { id: existingAudio.id },
        data: {
          audioPath: uploadResult.filePath!,
          version: existingAudio.version + 1,
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

      return NextResponse.json(updatedAudio);
    }

    // Create new audio
    const audio = await prisma.chapterAudio.create({
      data: {
        chapterId: chapterId,
        authorId: session.user.id,
        audioPath: uploadResult.filePath!,
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

    return NextResponse.json(audio, { status: 201 });
  } catch (error) {
    console.error('Error uploading audio:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
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
      include: {
        book: true,
        audios: {
          orderBy: { createdAt: 'desc' },
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

    if (chapter.audios.length === 0) {
      return NextResponse.json({ error: 'No audio found' }, { status: 404 });
    }

    const audio = chapter.audios[0];

    // Delete audio file
    await deleteFile(audio.audioPath);

    // Delete audio from database
    await prisma.chapterAudio.delete({
      where: { id: audio.id },
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

    return NextResponse.json({ message: 'Audio deleted successfully' });
  } catch (error) {
    console.error('Error deleting audio:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
