'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import ThemeToggle from './ThemeToggle';

export default function Nav() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', fn);
    return () => window.removeEventListener('scroll', fn);
  }, []);

  return (
    <nav
      className="sticky top-0 z-50 px-6 py-3 flex items-center justify-between transition-shadow"
      style={{
        background: 'var(--color-surface)',
        borderBottom: '1px solid var(--color-border)',
        boxShadow: scrolled ? '0 2px 12px rgba(0,0,0,0.07)' : 'none'
      }}
    >
      <Link href="/" className="flex items-center gap-2 font-bold text-lg" style={{ color: 'var(--color-primary)' }}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
          <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          <path d="M11 8v6M8 11h6" strokeLinecap="round"/>
        </svg>
        DevLens
      </Link>
      <div className="flex items-center gap-1 sm:gap-3">
        {[
          { href: '/compare', label: 'Compare' },
          { href: '/docs',    label: 'Docs' },
          { href: '/faq',     label: 'FAQ' },
          { href: '/sponsor', label: '💛 Sponsor' },
        ].map(({ href, label }) => (
          <Link key={href} href={href}
            className="px-2 py-1 rounded-lg text-sm transition-colors"
            style={{ color: 'var(--color-text-muted)' }}>
            {label}
          </Link>
        ))}
        <Link href="https://github.com/SamoTech/devlens" target="_blank" rel="noopener noreferrer"
          className="px-2 py-1 rounded-lg text-sm"
          style={{ color: 'var(--color-text-muted)' }}>
          GitHub
        </Link>
        <ThemeToggle />
      </div>
    </nav>
  );
}
