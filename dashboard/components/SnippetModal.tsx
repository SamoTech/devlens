'use client';
import { useState } from 'react';

export default function SnippetModal({ repo, onClose }: { repo: string; onClose: () => void }) {
  const [copied, setCopied] = useState<'readme' | 'workflow' | null>(null);

  const readmeSnippet = `<!-- DEVLENS:START -->\n<!-- DEVLENS:END -->`;
  const workflowSnippet = `name: DevLens Health Check\non:\n  push:\n    branches: [main]\n  schedule:\n    - cron: '0 8 * * 1'\npermissions:\n  contents: write\njobs:\n  devlens:\n    runs-on: ubuntu-latest\n    steps:\n      - uses: actions/checkout@v4\n      - uses: SamoTech/devlens@main\n        with:\n          github_token: \${{ secrets.GITHUB_TOKEN }}\n          groq_api_key: \${{ secrets.GROQ_API_KEY }}`;

  const copy = (text: string, which: 'readme' | 'workflow') => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(which);
      setTimeout(() => setCopied(null), 2000);
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.5)' }} onClick={onClose}>
      <div className="rounded-2xl p-6 w-full max-w-lg" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
        onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-bold text-lg" style={{ color: 'var(--color-text)' }}>Add DevLens to <code style={{ color: 'var(--color-primary)' }}>{repo}</code></h2>
          <button onClick={onClose} style={{ color: 'var(--color-text-muted)' }}>✕</button>
        </div>

        <div className="mb-4">
          <p className="text-sm font-semibold mb-2" style={{ color: 'var(--color-text-muted)' }}>Step 1 — Add to README.md</p>
          <pre className="text-xs p-3 rounded-lg overflow-x-auto" style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }}>{readmeSnippet}</pre>
          <button onClick={() => copy(readmeSnippet, 'readme')}
            className="mt-2 px-4 py-1.5 rounded-lg text-sm font-medium text-white"
            style={{ background: copied === 'readme' ? 'var(--color-success)' : 'var(--color-primary)' }}>
            {copied === 'readme' ? '✓ Copied!' : 'Copy'}
          </button>
        </div>

        <div>
          <p className="text-sm font-semibold mb-2" style={{ color: 'var(--color-text-muted)' }}>Step 2 — Create .github/workflows/devlens.yml</p>
          <pre className="text-xs p-3 rounded-lg overflow-x-auto" style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)', color: 'var(--color-text)', maxHeight: 180 }}>{workflowSnippet}</pre>
          <button onClick={() => copy(workflowSnippet, 'workflow')}
            className="mt-2 px-4 py-1.5 rounded-lg text-sm font-medium text-white"
            style={{ background: copied === 'workflow' ? 'var(--color-success)' : 'var(--color-primary)' }}>
            {copied === 'workflow' ? '✓ Copied!' : 'Copy'}
          </button>
        </div>
      </div>
    </div>
  );
}
