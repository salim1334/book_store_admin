import { type NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { validateMobileApiKey } from '@/lib/mobile-auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ chapterId: string }> },
) {
  const auth = validateMobileApiKey(request);
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { authorId } = auth;
  const { chapterId } = await params;

  try {
    const chapter = await prisma.chapter.findUnique({
      where: { id: chapterId },
      include: {
        book: true,
        pages: { orderBy: { orderIndex: 'asc' } },
        texts: { orderBy: { orderIndex: 'asc' } },
        audios: {
          select: {
            id: true,
            chapterId: true,
            audioPath: true,
            duration: true,
            version: true,
          },
        },
      },
    });

    if (!chapter) {
      return NextResponse.json({ error: 'Chapter not found' }, { status: 404 });
    }

    if (
      chapter.authorId !== authorId ||
      chapter.deletedAt ||
      chapter.book.authorId !== authorId ||
      chapter.book.deletedAt ||
      chapter.book.isHidden ||
      chapter.book.status !== 'PUBLISHED'
    ) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json(chapter);
  } catch (error) {
    console.error('Error fetching mobile chapter:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
