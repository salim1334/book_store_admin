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
  ChevronLeft,
  ChevronRight,
  Book,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SidebarProps {
  userRole: string;
  onLogout: () => void;
  collapsed: boolean;
  onToggle: () => void;
  mobileOpen: boolean;
  onMobileClose: () => void;
}

export function Sidebar({
  userRole,
  onLogout,
  collapsed,
  onToggle,
  mobileOpen,
  onMobileClose,
}: SidebarProps) {
  const pathname = usePathname();

  const authorNavItems = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/dashboard/books', label: 'My Books', icon: BookOpen },
    // {
    //   href: '/dashboard/guide#preparing-images',
    //   label: 'Content Guide',
    //   icon: Book,
    // },
    { href: '/dashboard/settings', label: 'Settings', icon: Settings },
  ];

  const superAdminNavItems = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/dashboard/authors', label: 'Authors', icon: Users },
    { href: '/dashboard/all-books', label: 'All Books', icon: FileText },
    // {
    //   href: '/dashboard/guide#preparing-images',
    //   label: 'Content Guide',
    //   icon: Book,
    // },
    { href: '/dashboard/settings', label: 'Settings', icon: Settings },
  ];

  const navItems =
    userRole === 'SUPER_ADMIN' ? superAdminNavItems : authorNavItems;

  return (
    <>
      <aside
        className={cn(
          'fixed left-0 top-0 z-50 flex h-full flex-col bg-white border-r border-gray-200 transition-transform duration-300 md:transition-all',
          mobileOpen
            ? 'translate-x-0 w-64'
            : '-translate-x-full w-64 md:translate-x-0',
          collapsed ? 'md:w-14' : 'md:w-64',
        )}
      >
        <div className="flex h-16 items-center gap-3 border-b border-gray-200 px-3">
          <div className="bg-emerald-600 p-2 shadow-sm shrink-0">
            <BookOpen className="h-6 w-6 text-white" />
          </div>
          {!collapsed && (
            <div className="overflow-hidden">
              <h1 className="text-lg font-bold text-gray-900">Book Store</h1>
              <p className="text-xs text-gray-500">Admin Panel</p>
            </div>
          )}
        </div>

        <nav className="flex-1 space-y-2 px-2 py-5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onMobileClose}
                className={cn(
                  'flex items-center gap-3 rounded px-4 py-3 text-sm font-medium transition-all duration-200',
                  isActive
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-100 shadow-sm border-l-4'
                    : 'text-gray-600 hover:bg-emerald-50 hover:text-emerald-700 border',
                  collapsed && 'justify-center px-2',
                )}
                title={collapsed ? item.label : undefined}
              >
                <Icon
                  className={cn('h-5 w-5 shrink-0', collapsed && 'h-5 w-5')}
                />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {userRole === 'SUPER_ADMIN' && !collapsed && (
          <div className="border-t border-gray-200 px-4 py-4">
            <div className="flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-100 px-3 py-3">
              <Shield className="h-4 w-4 text-emerald-600" />
              <span className="text-sm font-medium text-emerald-700">
                Super Admin
              </span>
            </div>
          </div>
        )}

        <div className="border-t border-gray-200 p-2">
          <Button
            variant="ghost"
            onClick={onToggle}
            className="w-full justify-center rounded-xl text-gray-500 hover:bg-gray-100"
            size="sm"
          >
            {collapsed ? (
              <ChevronRight className="h-5 w-5" />
            ) : (
              <>
                <ChevronLeft className="h-5 w-5" />
                <span className="ml-2">Collapse</span>
              </>
            )}
          </Button>
        </div>

        <div className="border-t border-gray-200 p-2">
          <Button
            variant="ghost"
            onClick={onLogout}
            className={cn(
              'w-full rounded-xl text-red-600 hover:bg-red-50 hover:text-red-600',
              collapsed ? 'justify-center px-2' : 'justify-start',
            )}
            title={collapsed ? 'Sign Out' : undefined}
          >
            <LogOut className={cn('h-5 w-5 shrink-0', !collapsed && 'mr-3')} />
            {!collapsed && 'Sign Out'}
          </Button>
        </div>
      </aside>
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20 md:hidden"
          onClick={onMobileClose}
          aria-hidden="true"
        />
      )}
    </>
  );
}
