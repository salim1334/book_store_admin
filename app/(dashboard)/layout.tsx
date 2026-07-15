import { redirect } from 'next/navigation';
import { auth, signOut } from '@/auth';
import { SidebarProvider } from '@/components/layout/sidebar-provider';

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
    <SidebarProvider
      userRole={session.user.role}
      userName={session.user.name}
      userEmail={session.user.email}
      onLogout={handleLogout}
    >
      {children}
    </SidebarProvider>
  );
}
