import { redirect } from 'next/navigation';
import { auth, signOut } from '@/auth';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  const handleLogout = async () => {
    'use server';
    await signOut({ redirectTo: '/login' });
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar userRole={session.user.role} onLogout={handleLogout} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header userName={session.user.name} userEmail={session.user.email} />
        <main className="flex-1 overflow-y-auto bg-background p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
