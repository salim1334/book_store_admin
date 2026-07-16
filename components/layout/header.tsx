'use client';

import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { GlobalSearch } from './global-search';

interface HeaderProps {
  userName: string;
  userEmail: string;
  onMenuClick?: () => void;
}

export function Header({ userName, userEmail, onMenuClick }: HeaderProps) {
  return (
    <header className="sticky top-0 z-10 flex h-16 items-center gap-3 border-b bg-background px-4 md:px-6">
      {onMenuClick && (
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden shrink-0"
          onClick={onMenuClick}
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </Button>
      )}

      <div className="flex-1 min-w-0">
        <GlobalSearch />
      </div>

      <div className="flex items-center gap-3 shrink-0">
        <div className="hidden md:flex md:flex-col md:items-end md:leading-tight">
          <p className="text-sm font-medium">{userName}</p>
          <p className="text-xs text-muted-foreground">{userEmail}</p>
        </div>
        <div className="h-9 w-9 md:h-10 md:w-10 rounded-full bg-linear-to-br from-emerald-500 to-green-600 flex items-center justify-center text-white font-semibold shadow-sm">
          {userName.charAt(0).toUpperCase()}
        </div>
      </div>
    </header>
  );
}
