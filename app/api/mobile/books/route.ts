import { type NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { validateMobileApiKey } from '@/lib/mobile-auth';

export async function GET(request: NextRequest) {
  const auth = validateMobileApiKey(request);
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { authorId } = auth;

  try {
    const books = await prisma.book.findMany({
      where: {
        authorId,
        deletedAt: null,
        status: 'PUBLISHED',
        isHidden: false,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            chapters: { where: { deletedAt: null } },
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    return NextResponse.json(books);
  } catch (error) {
    console.error('Error fetching mobile books:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
