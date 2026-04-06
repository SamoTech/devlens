import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: '404 — Page Not Found' };

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center text-center px-6 py-24">
      <div className="text-8xl font-black mb-4" style={{ color: 'var(--color-border)' }}>404</div>
      <h1 className="text-2xl font-bold mb-2" style={{ color: 'var(--color-text)' }}>Page not found</h1>
      <p className="mb-8 max-w-sm" style={{ color: 'var(--color-text-muted)' }}>
        The page you're looking for doesn't exist. It may have been moved or deleted.
      </p>
      <div className="flex gap-3">
        <Link href="/" className="px-5 py-2.5 rounded-xl font-semibold text-white"
          style={{ background: 'var(--color-primary)' }}>Go home</Link>
        <Link href="/docs" className="px-5 py-2.5 rounded-xl font-semibold"
          style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }}>Read docs</Link>
      </div>
    </div>
  );
}
