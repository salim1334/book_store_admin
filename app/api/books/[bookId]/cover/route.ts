import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db';
import { uploadImage, deleteFile } from '@/lib/file-upload';

export async function POST(
  request: NextRequest,
  { params }: { params: { bookId: string } }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const book = await prisma.book.findUnique({
      where: { id: params.bookId },
    });

    if (!book || book.deletedAt) {
      return NextResponse.json({ error: 'Book not found' }, { status: 404 });
    }

    if (session.user.role !== 'SUPER_ADMIN' && book.authorId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get('coverImage') as File;

    if (!file) {
      return NextResponse.json({ error: 'Image file is required' }, { status: 400 });
    }

    // Delete old cover image if it exists
    if (book.coverImage) {
      await deleteFile(book.coverImage);
    }

    // Upload new image
    const uploadResult = await uploadImage(file, params.bookId, 'cover');
    if (!uploadResult.success) {
      return NextResponse.json({ error: uploadResult.error }, { status: 400 });
    }

    // Update book with new cover image path
    const updatedBook = await prisma.book.update({
      where: { id: params.bookId },
      data: {
        coverImage: uploadResult.filePath!,
        version: { increment: 1 },
      },
    });

    // Mark for republishing if it was published
    if (book.status === 'PUBLISHED') {
      await prisma.book.update({
        where: { id: params.bookId },
        data: { status: 'UNPUBLISHED_CHANGES' },
      });
    }

    return NextResponse.json({ coverImage: updatedBook.coverImage });
  } catch (error) {
    console.error('Error uploading cover image:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
