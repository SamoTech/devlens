import Link from 'next/link';

const links = [
  { group: 'Product',   items: [{ href: '/', label: 'Analyze' }, { href: '/compare', label: 'Compare' }, { href: '/docs', label: 'Docs' }, { href: '/changelog', label: 'Changelog' }] },
  { group: 'Community', items: [{ href: '/sponsor', label: '💛 Sponsor' }, { href: 'https://github.com/SamoTech/devlens', label: 'GitHub' }, { href: 'https://github.com/SamoTech/devlens/issues', label: 'Issues' }] },
  { group: 'Legal',     items: [{ href: '/about', label: 'About' }, { href: '/privacy', label: 'Privacy' }, { href: '/terms', label: 'Terms' }, { href: '/cookies', label: 'Cookies' }] },
  { group: 'Help',      items: [{ href: '/faq', label: 'FAQ' }, { href: 'mailto:samo.hossam@gmail.com', label: 'Contact' }] },
];

export default function Footer() {
  return (
    <footer style={{ borderTop: '1px solid var(--color-border)', background: 'var(--color-surface)', marginTop: 'auto' }}>
      <div className="max-w-5xl mx-auto px-6 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
          {links.map(({ group, items }) => (
            <div key={group}>
              <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--color-text-muted)' }}>{group}</p>
              <ul className="space-y-2">
                {items.map(({ href, label }) => (
                  <li key={href}>
                    <Link href={href}
                      {...(href.startsWith('http') || href.startsWith('mailto') ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                      className="text-sm hover:underline"
                      style={{ color: 'var(--color-text-muted)' }}>
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-6" style={{ borderTop: '1px solid var(--color-border)' }}>
          <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
            © {new Date().getFullYear()} <Link href="https://github.com/SamoTech" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-primary)' }}>SamoTech</Link>. MIT License. Free forever.
          </p>
          <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Built with Next.js · Powered by GitHub API</p>
        </div>
      </div>
    </footer>
  );
}
