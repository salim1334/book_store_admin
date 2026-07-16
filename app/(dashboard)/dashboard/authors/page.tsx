'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  Plus,
  UserX,
  UserCheck,
  Loader2,
  Users as UsersIcon,
} from 'lucide-react';
import { formatDate } from '@/lib/utils';
import Link from 'next/link';
import { ResetPasswordDialog } from '@/components/authors/reset-password-dialog';

interface Author {
  id: string;
  name: string;
  email: string;
  isActive: boolean;
  createdAt: Date;
  _count: {
    books: number;
  };
}

export default function AuthorsPage() {
  const [authors, setAuthors] = useState<Author[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null);

  const fetchAuthors = async () => {
    try {
      const response = await fetch('/api/authors');
      if (response.ok) {
        const data = await response.json();
        setAuthors(data);
      }
    } catch (error) {
      console.error('Error fetching authors:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (
    authorId: string,
    authorName: string,
    currentStatus: boolean,
  ) => {
    const action = currentStatus ? 'suspend' : 'activate';

    toast(`Are you sure you want to ${action} ${authorName}?`, {
      action: {
        label: 'Confirm',
        onClick: async () => {
          setUpdatingStatusId(authorId);
          try {
            const response = await fetch(`/api/users/${authorId}/status`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ isActive: !currentStatus }),
            });

            if (response.ok) {
              setAuthors(
                authors.map((author) =>
                  author.id === authorId
                    ? { ...author, isActive: !currentStatus }
                    : author,
                ),
              );
              toast.success(`Author ${action}ed successfully.`);
            } else {
              const error = await response.json();
              toast.error(error.error || `Failed to ${action} author.`);
            }
          } catch (error) {
            console.error(
              `Error toggling status for author ${authorId}:`,
              error,
            );
            toast.error(
              `An error occurred while trying to ${action} the author.`,
            );
          } finally {
            setUpdatingStatusId(null);
          }
        },
      },
      cancel: {
        label: 'Cancel',
        onClick: () => {},
      },
    });
  };

  useEffect(() => {
    fetchAuthors();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading authors...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
            Authors
          </h1>
          <p className="text-gray-500 mt-1">
            Manage author accounts and permissions
          </p>
        </div>
        <Link href="/dashboard/authors/new" className="w-full md:w-auto">
          <Button className="w-full md:w-auto">
            <Plus className="mr-2 h-4 w-4" />
            Create Author
          </Button>
        </Link>
      </div>

      {authors.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="rounded-full bg-blue-100 p-6 mb-4">
              <UsersIcon className="h-12 w-12 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2">No authors yet</h3>
            <p className="text-gray-500 text-center max-w-md mb-6">
              Get started by creating your first author account. They will
              receive an invite email to set up their password.
            </p>
            <Link href="/dashboard/authors/new">
              <Button>
                <Plus className="mr-2 h-5 w-5" />
                Create First Author
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {authors.map((author) => (
            <Card key={author.id}>
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-4 min-w-0 flex-1">
                    <div className="h-12 w-12 shrink-0 rounded-full bg-linear-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-lg">
                      {author.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-lg truncate">
                          {author.name}
                        </h3>
                        {author.isActive ? (
                          <Badge className="bg-green-100 text-green-800 border-green-300">
                            Active
                          </Badge>
                        ) : (
                          <Badge className="bg-red-100 text-red-800 border-red-300">
                            Suspended
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 truncate">
                        {author.email}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        Joined {formatDate(author.createdAt)} •{' '}
                        {author._count.books} books
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <ResetPasswordDialog
                      authorId={author.id}
                      authorName={author.name}
                      authorEmail={author.email}
                      onSuccess={fetchAuthors}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      className={
                        author.isActive ? 'text-red-600' : 'text-green-600'
                      }
                      onClick={() =>
                        handleToggleStatus(
                          author.id,
                          author.name,
                          author.isActive,
                        )
                      }
                      disabled={updatingStatusId === author.id}
                    >
                      {updatingStatusId === author.id ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : author.isActive ? (
                        <UserX className="mr-2 h-4 w-4" />
                      ) : (
                        <UserCheck className="mr-2 h-4 w-4" />
                      )}
                      {author.isActive ? 'Suspend' : 'Activate'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
