"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { SpikeDocsLogo } from '@/components/brand/SpikeDocsLogo';
import {
  FolderTree,
  Zap,
  ArrowLeftRight,
  Edit3,
  ShieldCheck,
  Sparkles,
  Home,
  Compass,
  Menu,
  X,
  User,
} from 'lucide-react';

export function Sidebar({ isOpen, setIsOpen }: { isOpen: boolean; setIsOpen: (val: boolean) => void }) {
  const pathname = usePathname();

  const navItems = [
    { name: 'Home', href: '/', icon: Home },
    { name: 'Organize', href: '/?category=organize', icon: FolderTree },
    { name: 'Optimize', href: '/?category=optimize', icon: Zap },
    { name: 'Convert', href: '/?category=convert', icon: ArrowLeftRight },
    { name: 'Edit', href: '/?category=edit', icon: Edit3 },
    { name: 'Security', href: '/?category=security', icon: ShieldCheck },
    { name: 'AI & OCR', href: '/?category=intelligence', icon: Sparkles },
    { name: 'Resources', href: '/resources', icon: Compass },
  ];

  return (
    <>
      {/* Mobile Backdrop with Smooth Fade Transition */}
      <div
        className={`fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40 lg:hidden transition-opacity duration-300 ease-in-out ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setIsOpen(false)}
      />

      {/* Sidebar Container with Smooth Cubic-Bezier Slide Transition */}
      <aside
        className={`fixed top-0 left-0 bottom-0 z-50 w-64 bg-white border-r border-slate-200 shadow-2xl lg:shadow-none transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] flex flex-col ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="h-16 flex items-center justify-between px-5 border-b border-slate-100">
          <Link href="/" onClick={() => setIsOpen(false)}>
            <SpikeDocsLogo />
          </Link>
          <button
            onClick={() => setIsOpen(false)}
            className="lg:hidden p-2 rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors"
            aria-label="Close navigation"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-red-50 text-red-600 font-semibold'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-red-600' : 'text-slate-400'}`} />
                {item.name}
              </Link>
            );
          })}
        </div>

        {/* Upgrade Banner */}
        <div className="p-4 border-t border-slate-100">
          <div className="p-3.5 bg-gradient-to-br from-red-500 to-red-600 rounded-2xl text-white shadow-md shadow-red-500/20">
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="w-4 h-4" />
              <span className="font-bold text-xs uppercase tracking-wide">SpikeDocs Pro</span>
            </div>
            <p className="text-xs text-red-100 mb-3">
              Unlock unlimited batch files, AI translation, and large size files (&gt;50MB).
            </p>
            <Link
              href="/pricing"
              className="block w-full text-center py-1.5 bg-white text-red-600 font-bold text-xs rounded-lg shadow-xs hover:bg-red-50 transition-colors"
            >
              Upgrade Now
            </Link>
          </div>
        </div>
      </aside>
    </>
  );
}

export function BottomNav() {
  const pathname = usePathname();

  const items = [
    { name: 'Home', href: '/', icon: Home },
    { name: 'Discover', href: '/resources', icon: Compass },
    { name: 'Pricing', href: '/pricing', icon: Sparkles },
    { name: 'Account', href: '/auth/signin', icon: User },
  ];

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-slate-200 z-40 px-6 flex items-center justify-between shadow-lg">
      {items.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.name}
            href={item.href}
            className={`flex flex-col items-center gap-1 transition-colors duration-200 ${
              isActive ? 'text-red-600 font-semibold' : 'text-slate-500'
            }`}
          >
            <Icon className="w-5 h-5" />
            <span className="text-[10px]">{item.name}</span>
          </Link>
        );
      })}
    </div>
  );
}

export function Header({ onOpenSidebar }: { onOpenSidebar: () => void }) {
  return (
    <header className="sticky top-0 z-30 h-16 bg-white/80 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-8 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenSidebar}
          className="lg:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors"
          aria-label="Open Navigation"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="lg:hidden">
          <SpikeDocsLogo />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Link
          href="/pricing"
          className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 rounded-full transition-colors"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Go Pro</span>
        </Link>
        <Link
          href="/auth/signin"
          className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
        >
          Sign In
        </Link>
      </div>
    </header>
  );
}
