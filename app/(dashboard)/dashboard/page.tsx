import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen, FileText, Users, TrendingUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { getBookStatusBadge } from '@/lib/utils';

async function getDashboardStats(userId: string, role: string) {
  if (role === 'SUPER_ADMIN') {
    const [totalAuthors, totalBooks, publishedBooks, draftBooks] = await Promise.all([
      prisma.user.count({ where: { role: 'AUTHOR', isActive: true } }),
      prisma.book.count({ where: { deletedAt: null } }),
      prisma.book.count({ where: { status: 'PUBLISHED', deletedAt: null } }),
      prisma.book.count({ where: { status: 'DRAFT', deletedAt: null } }),
    ]);

    return {
      totalAuthors,
      totalBooks,
      publishedBooks,
      draftBooks,
    };
  } else {
    const [totalBooks, publishedBooks, draftBooks, totalChapters] = await Promise.all([
      prisma.book.count({ where: { authorId: userId, deletedAt: null } }),
      prisma.book.count({ where: { authorId: userId, status: 'PUBLISHED', deletedAt: null } }),
      prisma.book.count({ where: { authorId: userId, status: 'DRAFT', deletedAt: null } }),
      prisma.chapter.count({ where: { authorId: userId, deletedAt: null } }),
    ]);

    return {
      totalBooks,
      publishedBooks,
      draftBooks,
      totalChapters,
    };
  }
}

async function getRecentBooks(userId: string, role: string) {
  const where = role === 'SUPER_ADMIN' 
    ? { deletedAt: null }
    : { authorId: userId, deletedAt: null };

  return prisma.book.findMany({
    where,
    include: {
      author: {
        select: {
          name: true,
          email: true,
        },
      },
      _count: {
        select: {
          chapters: true,
        },
      },
    },
    orderBy: {
      updatedAt: 'desc',
    },
    take: 5,
  });
}

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  const stats = await getDashboardStats(session.user.id, session.user.role);
  const recentBooks = await getRecentBooks(session.user.id, session.user.role);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-gray-500 mt-1">
          Welcome back, {session.user.name}.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {session.user.role === 'SUPER_ADMIN' ? (
          <>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Authors</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalAuthors}</div>
                <p className="text-xs text-muted-foreground">Active author accounts</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Books</CardTitle>
                <BookOpen className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalBooks}</div>
                <p className="text-xs text-muted-foreground">Across all authors</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Published</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.publishedBooks}</div>
                <p className="text-xs text-muted-foreground">Live books</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Drafts</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.draftBooks}</div>
                <p className="text-xs text-muted-foreground">In progress</p>
              </CardContent>
            </Card>
          </>
        ) : (
          <>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">My Books</CardTitle>
                <BookOpen className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalBooks}</div>
                <p className="text-xs text-muted-foreground">Total books created</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Published</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.publishedBooks}</div>
                <p className="text-xs text-muted-foreground">Live books</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Drafts</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.draftBooks}</div>
                <p className="text-xs text-muted-foreground">In progress</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Chapters</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalChapters}</div>
                <p className="text-xs text-muted-foreground">Total chapters</p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      <Card>
        <CardHeader>
          {session.user.role === 'SUPER_ADMIN' ? (
            <>
            <CardTitle>Recent Books</CardTitle>
            <CardDescription>Most recently updated books by Authors</CardDescription>
            </>
          ) : (
            <>
              <CardTitle>My Books</CardTitle>
              <CardDescription>Your most recently updated books</CardDescription>
            </>
          )}
        </CardHeader>
        <CardContent>
          {recentBooks.length === 0 ? (
            <div className="text-center py-12">
              <BookOpen className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-4 text-lg font-medium text-gray-900">No books yet</h3>
              <p className="mt-2 text-sm text-gray-500">
                Get started by creating your first book.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {recentBooks.map((book) => {
                const statusBadge = getBookStatusBadge(book.status);
                return (
                  <div
                    key={book.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-16 w-12 bg-linear-to-br from-blue-500 to-purple-600 rounded flex items-center justify-center text-white font-bold">
                        {book.title.charAt(0)}
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">
                          {book.title}
                        </h4>
                        <p className="text-sm text-gray-500">
                          {book._count.chapters} chapters • {book.type}
                          {session.user.role === 'SUPER_ADMIN' &&
                            ` • by ${book.author.name}`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge className={statusBadge.className}>
                        {statusBadge.label}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
