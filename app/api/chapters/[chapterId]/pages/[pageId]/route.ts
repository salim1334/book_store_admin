import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db';
import { uploadImage, deleteFile } from '@/lib/file-upload';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ chapterId: string; pageId: string }> }
) {
  const { chapterId, pageId } = await params;
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

    const bookType = chapter.book.type;

    if (bookType === 'IMAGE') {
      // Check if it's an image upload (FormData) or just metadata update
      const contentType = request.headers.get('content-type');

      if (contentType?.includes('multipart/form-data')) {
        // Handle image replacement
        const formData = await request.formData();
        const file = formData.get('image') as File;

        if (!file) {
          return NextResponse.json(
            { error: 'Image file is required' },
            { status: 400 }
          );
        }

        // Get existing page
        const existingPage = await prisma.chapterPage.findUnique({
          where: { id: pageId },
        });

        if (!existingPage) {
          return NextResponse.json(
            { error: 'Page not found' },
            { status: 404 }
          );
        }

        // Upload new image
        const uploadResult = await uploadImage(file, chapter.bookId, chapterId);

        if (!uploadResult.success) {
          return NextResponse.json(
            { error: uploadResult.error },
            { status: 400 }
          );
        }

        // Delete old image
        await deleteFile(existingPage.imagePath);

        // Update page
        const updatedPage = await prisma.chapterPage.update({
          where: { id: pageId },
          data: {
            imagePath: uploadResult.filePath!,
            version: existingPage.version + 1,
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

        return NextResponse.json(updatedPage);
      } else {
        return NextResponse.json(
          { error: 'Invalid request format' },
          { status: 400 }
        );
      }
    } else {
      // Handle text content update
      const body = await request.json();
      const { content } = body;

      if (!content || !content.trim()) {
        return NextResponse.json(
          { error: 'Content is required' },
          { status: 400 }
        );
      }

      const existingText = await prisma.chapterText.findUnique({
        where: { id: pageId },
      });

      if (!existingText) {
        return NextResponse.json({ error: 'Page not found' }, { status: 404 });
      }

      // Update text content
      const updatedText = await prisma.chapterText.update({
        where: { id: pageId },
        data: {
          content: content.trim(),
          version: existingText.version + 1,
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

      return NextResponse.json(updatedText);
    }
  } catch (error) {
    console.error('Error updating page:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ chapterId: string; pageId: string }> }
) {
  const { chapterId, pageId } = await params;

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

    const bookType = chapter.book.type;

    if (bookType === 'IMAGE') {
      // Delete image page
      const page = await prisma.chapterPage.findUnique({
        where: { id: pageId },
      });

      if (!page) {
        return NextResponse.json({ error: 'Page not found' }, { status: 404 });
      }

      // Delete image file
      await deleteFile(page.imagePath);

      // Delete page from database
      await prisma.chapterPage.delete({
        where: { id: pageId },
      });
    } else {
      // Delete text page
      const textPage = await prisma.chapterText.findUnique({
        where: { id: pageId },
      });

      if (!textPage) {
        return NextResponse.json({ error: 'Page not found' }, { status: 404 });
      }

      // Delete page from database
      await prisma.chapterText.delete({
        where: { id: pageId },
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

    return NextResponse.json({ message: 'Page deleted successfully' });
  } catch (error) {
    console.error('Error deleting page:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
