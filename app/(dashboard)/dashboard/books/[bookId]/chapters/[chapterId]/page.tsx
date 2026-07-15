import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { ChapterEditor } from '@/components/chapters/chapter-editor';

export default async function ChapterEditPage({
  params,
}: {
  params: Promise<{ bookId: string; chapterId: string }>;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  // Await params in Next.js 15
  const { chapterId } = await params;

  return <ChapterEditor chapterId={chapterId} />;
}
