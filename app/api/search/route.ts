import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

    if (!query || query.length < 2) {
      return NextResponse.json({ error: 'Query must be at least 2 characters' }, { status: 400 });
    }

    const userId = session.user.id;
    const userRole = session.user.role;

    const whereClause = userRole === 'SUPER_ADMIN'
      ? { deletedAt: null }
      : { authorId: userId, deletedAt: null };

    // Search for books
    const books = await prisma.book.findMany({
      where: {
        ...whereClause,
        OR: [
          { title: { contains: query } },
          { title: { contains: query.toLowerCase() } },
          { title: { contains: query.charAt(0).toUpperCase() + query.slice(1) } },
        ],
      },
      select: {
        id: true,
        title: true,
      },
      take: 10,
    });

    // Search for chapters
    const chapters = await prisma.chapter.findMany({
      where: {
        ...whereClause,
        OR: [
          { title: { contains: query } },
          { title: { contains: query.toLowerCase() } },
          { title: { contains: query.charAt(0).toUpperCase() + query.slice(1) } },
        ],
      },
      include: {
        book: {
          select: {
            id: true,
            title: true,
          },
        },
      },
      take: 10,
    });

    const results = [
      ...books.map(book => ({ ...book, type: 'book' as const })),
      ...chapters.map(chapter => ({
        id: chapter.id,
        title: chapter.title,
        type: 'chapter' as const,
        bookId: chapter.book.id,
        bookTitle: chapter.book.title,
      })),
    ];

    // Sort and limit final results
    const sortedResults = results.sort((a, b) => a.title.localeCompare(b.title)).slice(0, 15);

    return NextResponse.json(sortedResults);
  } catch (error) {
    console.error('Search API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
