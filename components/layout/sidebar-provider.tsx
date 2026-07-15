'use client';

import { useState, createContext, useContext, useEffect } from 'react';
import { Sidebar } from './sidebar';
import { Header } from './header';
import { cn } from '@/lib/utils';

interface SidebarContextType {
  collapsed: boolean;
  toggleCollapsed: () => void;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (!context)
    throw new Error('useSidebar must be used within SidebarProvider');
  return context;
};

interface SidebarProviderProps {
  children: React.ReactNode;
  userRole: string;
  userName?: string | null;
  userEmail?: string | null;
  onLogout: () => void;
}

export function SidebarProvider({
  children,
  userRole,
  userName,
  userEmail,
  onLogout,
}: SidebarProviderProps) {
  const [collapsed, setCollapsed] = useState(false);

  // On component mount, read the collapsed state from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('sidebar-collapsed');
    if (saved !== null) {
      setCollapsed(JSON.parse(saved));
    }
  }, []);

  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      const newState = !prev;
      localStorage.setItem('sidebar-collapsed', JSON.stringify(newState));
      return newState;
    });
  };

  return (
    <SidebarContext.Provider value={{ collapsed, toggleCollapsed }}>
      <div className="flex h-screen overflow-hidden">
        <Sidebar
          userRole={userRole}
          onLogout={onLogout}
          collapsed={collapsed}
          onToggle={toggleCollapsed}
        />
        <div
          className={cn(
            'flex flex-1 flex-col overflow-hidden transition-all duration-300',
            collapsed ? 'ml-16' : 'ml-64' // adjust for sidebar width
          )}
        >
          <Header userName={userName!} userEmail={userEmail!} />
          <main className="flex-1 overflow-y-auto bg-background p-6">
            {children}
          </main>
        </div>
      </div>
    </SidebarContext.Provider>
  );
}
