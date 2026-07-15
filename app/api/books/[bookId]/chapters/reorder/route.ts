import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { auth } from '@/auth';

export async function PATCH(
  req: Request,
  { params }: { params: { bookId: string } }
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const userId = session.user.id;
    const { bookId } = params;
    const { chapterIds } = await req.json();

    if (!chapterIds || !Array.isArray(chapterIds)) {
      return new NextResponse('Invalid request body', { status: 400 });
    }

    const bookOwner = await prisma.book.findUnique({
      where: {
        id: bookId,
        authorId: userId,
      },
    });

    if (!bookOwner) {
      return new NextResponse('Not found', { status: 404 });
    }

    await prisma.$transaction(async (tx) => {
      for (let i = 0; i < chapterIds.length; i++) {
        await tx.chapter.update({
          where: {
            id: chapterIds[i],
            bookId: bookId,
          },
          data: {
            orderIndex: i,
          },
        });
      }
    });

    return new NextResponse('Success', { status: 200 });

  } catch (error) {
    console.error('[REORDER_CHAPTERS]', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
