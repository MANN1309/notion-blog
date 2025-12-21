'use client';

import Link from 'next/link';
import ThemeToggle from './ThemeToggle';

export default function Header() {
  return (
    <header className="border-b border-theme-header bg-theme-header sticky top-0 z-50 transition-colors">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <Link href="/" className="text-2xl font-bold text-theme-primary hover:opacity-80 transition-opacity">
          WooSM's Blog
        </Link>
        <nav className="flex items-center gap-4">
          <Link 
            href="/about" 
            className="text-theme-secondary hover:text-theme-primary transition-colors"
          >
            About
          </Link>
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}

