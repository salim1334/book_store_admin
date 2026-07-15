'use client';

import { GlobalSearch } from './global-search';

interface HeaderProps {
  userName: string;
  userEmail: string;
}

export function Header({ userName, userEmail }: HeaderProps) {
  return (
    <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background px-6">
      <div className="flex-1">
        <GlobalSearch />
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3 border-l pl-4">
          <div className="text-right">
            <p className="text-sm font-medium">{userName}</p>
            <p className="text-xs text-muted-foreground">{userEmail}</p>
          </div>
          <div className="h-10 w-10 rounded-full bg-linear-to-br from-emerald-500 to-green-600 flex items-center justify-center text-white font-semibold shadow-sm">
            {userName.charAt(0).toUpperCase()}
          </div>
        </div>
      </div>
    </header>
  );
}
