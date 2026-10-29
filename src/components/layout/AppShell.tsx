"use client";

import React, { useState } from 'react';
import { Sidebar, BottomNav, Header } from '@/components/layout/Navbar';
import Link from 'next/link';
import { Plus } from 'lucide-react';

export function AppShell({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col antialiased">
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />

      <div className="lg:pl-64 flex-1 flex flex-col min-h-screen pb-16 lg:pb-0">
        <Header onOpenSidebar={() => setIsSidebarOpen(true)} />
        <main className="flex-1">{children}</main>

        {/* Floating Quick Action Button */}
        <Link
          href="/merge-pdf"
          className="fixed bottom-20 right-5 lg:bottom-8 lg:right-8 z-40 bg-red-600 hover:bg-red-700 text-white p-3.5 rounded-full shadow-lg shadow-red-500/30 transition-all transform hover:scale-105 active:scale-95 flex items-center gap-2 group"
          title="Quick Upload & Convert"
        >
          <Plus className="w-6 h-6" />
          <span className="max-w-0 overflow-hidden whitespace-nowrap group-hover:max-w-xs transition-all duration-300 text-xs font-bold pr-1">
            Quick Convert
          </span>
        </Link>

        <BottomNav />
      </div>
    </div>
  );
}
