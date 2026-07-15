'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  BookOpen,
  LayoutDashboard,
  Users,
  Settings,
  LogOut,
  FileText,
  Shield,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SidebarProps {
  userRole: string;
  onLogout: () => void;
}

export function Sidebar({ userRole, onLogout }: SidebarProps) {
  const pathname = usePathname();

  const authorNavItems = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/dashboard/books', label: 'My Books', icon: BookOpen },
    { href: '/dashboard/settings', label: 'Settings', icon: Settings },
  ];

  const superAdminNavItems = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/dashboard/authors', label: 'Authors', icon: Users },
    { href: '/dashboard/all-books', label: 'All Books', icon: FileText },
    { href: '/dashboard/settings', label: 'Settings', icon: Settings },
  ];

  const navItems =
    userRole === 'SUPER_ADMIN' ? superAdminNavItems : authorNavItems;

  return (
    <aside className="flex h-full w-64 flex-col bg-white border-r border-gray-200">
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 border-b border-gray-200 px-6">
        <div className=" bg-emerald-600 p-2 shadow-sm">
          <BookOpen className="h-6 w-6 text-white" />
        </div>

        <div>
          <h1 className="text-lg font-bold text-gray-900">Book Store</h1>
          <p className="text-xs text-gray-500">Admin Panel</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-2 px-4 py-5">
        {navItems.map((item) => {
          const Icon = item.icon;

          const isActive =
            pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded px-4 py-3 text-sm font-medium transition-all duration-200',
                isActive
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-100 shadow-sm border-l-4'
                  : 'text-gray-600 hover:bg-emerald-50 hover:text-emerald-700 border'
              )}
            >
              <Icon className="h-5 w-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Super Admin Badge */}
      {userRole === 'SUPER_ADMIN' && (
        <div className="border-t border-gray-200 px-4 py-4">
          <div className="flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-100 px-3 py-3">
            <Shield className="h-4 w-4 text-emerald-600" />
            <span className="text-sm font-medium text-emerald-700">
              Super Admin
            </span>
          </div>
        </div>
      )}

      {/* Logout */}
      <div className="border-t border-gray-200 p-4">
        <Button
          variant="ghost"
          onClick={onLogout}
          className="w-full justify-start rounded-xl text-red-600 hover:bg-red-50 hover:text-red-600"
        >
          <LogOut className="mr-3 h-5 w-5" />
          Sign Out
        </Button>
      </div>
    </aside>
  );
}
