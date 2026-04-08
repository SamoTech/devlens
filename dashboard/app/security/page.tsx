'use client';

import { useState, useEffect, useCallback } from 'react';
import type { MegaScanReport, Severity } from '@/lib/security-types';

// ── Severity helpers ─────────────────────────────────────────────────────────

const SEV_COLOR: Record<string, string> = {
  CRITICAL: '#ff4757', HIGH: '#ff9f43', MEDIUM: '#ffd32a', LOW: '#45aaf2', UNKNOWN: '#7a8494',
};

function SevBadge({ sev }: { sev: string }) {
  const color = SEV_COLOR[sev] ?? SEV_COLOR.UNKNOWN;
  return (
    <span style={{ display:'inline-flex', alignItems:'center', gap:4, padding:'2px 8px',
                   borderRadius:99, fontSize:11, fontWeight:700, fontFamily:'monospace',
                   background:`${color}22`, color }}>
      <span style={{ width:6, height:6, borderRadius:'50%', background:color, display:'inline-block' }} />
      {sev}
    </span>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function SecurityPage() {
  const [repo,    setRepo]    = useState('');
  const [loading, setLoading] = useState(false);
  const [report,  setReport]  = useState<MegaScanReport | null>(null);
  const [error,   setError]   = useState<string | null>(null);
  const [tab,     setTab]     = useState('overview');

  const scan = useCallback(async (force = false) => {
    if (!repo.includes('/')) { setError('Enter owner/repo'); return; }
    setLoading(true); setError(null); setReport(null);
    try {
      const res  = await fetch(`/api/security?repo=${encodeURIComponent(repo)}${force ? '&force=1' : ''}`);
      const data = await res.json() as MegaScanReport;
      if ('error' in data) { setError((data as { error: string }).error); }
      else { setReport(data); setTab('overview'); }
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }, [repo]);

  const exportJson = () => {
    if (!report) return;
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `devlens-security-${report.meta.owner}-${report.meta.repo}.json`;
    a.click();
  };

  const sc = report?.scoring;
  const t  = report?.totals;
  const gradeColor = !sc ? '#7a8494' : sc.score >= 90 ? '#00d4a0' : sc.score >= 75 ? '#45aaf2' : sc.score >= 60 ? '#ff9f43' : sc.score >= 40 ? '#ffd32a' : '#ff4757';

  const TABS = [
    { id: 'overview',      label: 'Overview' },
    { id: 'vulnerabilities', label: `Vulnerabilities ${(report?.dependabot?.total ?? 0) + (report?.osv?.total ?? 0) > 0 ? `(${(report?.dependabot?.total ?? 0) + (report?.osv?.total ?? 0)})` : ''}` },
    { id: 'secrets',       label: `Secrets ${(report?.secrets_github?.total ?? 0) > 0 ? `(${report?.secrets_github?.total})` : ''}` },
    { id: 'sast',          label: `SAST ${(report?.code_scanning?.total ?? 0) > 0 ? `(${report?.code_scanning?.total})` : ''}` },
    { id: 'license',       label: 'License & Policy' },
  ];

  return (
    <div style={{ padding: '2rem', maxWidth: 1200, margin: '0 auto', fontFamily: 'var(--font-sans, system-ui)' }}>

      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 700, letterSpacing: '-0.03em', marginBottom: '0.5rem' }}>
          🔭 Mega Security Scanner
        </h1>
        <p style={{ color: '#7a8494', fontSize: '0.9rem' }}>
          9-module deep scan — GitHub APIs · OSV.dev · TruffleHog · Semgrep · Nuclei · Trivy
        </p>
      </div>

      {/* Input */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <input
          value={repo}
          onChange={e => setRepo(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && scan()}
          placeholder="owner/repo  e.g. SamoTech/devlens"
          style={{ flex: 1, minWidth: 260, padding: '0.65rem 1rem', borderRadius: 8,
                   border: '1px solid #252a33', background: '#131519', color: '#e2e6ed',
                   fontFamily: 'monospace', fontSize: '0.88rem' }}
        />
        <button
          onClick={() => scan()}
          disabled={loading}
          style={{ padding: '0.65rem 1.4rem', borderRadius: 8, background: '#00d4a0',
                   color: '#000', fontWeight: 700, fontSize: '0.88rem', cursor: 'pointer',
                   border: 'none', opacity: loading ? 0.6 : 1 }}
        >
          {loading ? 'Scanning…' : '🔍 Scan'}
        </button>
        {report && (
          <>
            <button onClick={() => scan(true)} style={{ padding: '0.65rem 1rem', borderRadius: 8,
              border: '1px solid #252a33', background: '#131519', color: '#e2e6ed',
              fontSize: '0.82rem', cursor: 'pointer' }}>↺ Rescan</button>
            <button onClick={exportJson} style={{ padding: '0.65rem 1rem', borderRadius: 8,
              background: '#1e2229', border: '1px solid #252a33', color: '#00d4a0',
              fontSize: '0.82rem', cursor: 'pointer' }}>⬇ Export JSON</button>
          </>
        )}
      </div>

      {error && (
        <div style={{ padding: '1rem', borderRadius: 8, background: '#3d0e13', color: '#ff4757',
                      marginBottom: '1rem', fontSize: '0.85rem' }}>
          ⚠ {error}
        </div>
      )}

      {loading && (
        <div style={{ textAlign: 'center', padding: '4rem', color: '#7a8494' }}>
          <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>🔬</div>
          <div>Running 9-module scan on <strong style={{ color: '#e2e6ed' }}>{repo}</strong>…</div>
          <div style={{ fontSize: '0.8rem', marginTop: '0.5rem' }}>Checking Dependabot · Secret Scanning · Code Scanning · OSV.dev · License</div>
        </div>
      )}

      {report && !loading && (
        <>
          {/* Score Row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '1.5rem',
                        background: '#131519', border: '1px solid #252a33', borderRadius: 14,
                        padding: '1.5rem', marginBottom: '1.5rem', alignItems: 'center' }}>
            <div style={{ textAlign: 'center', minWidth: 100 }}>
              <div style={{ fontSize: '3rem', fontWeight: 700, fontFamily: 'monospace',
                            color: gradeColor, lineHeight: 1 }}>{sc!.score}</div>
              <div style={{ fontSize: '0.7rem', color: '#7a8494', textTransform: 'uppercase',
                            letterSpacing: '0.1em', margin: '0.25rem 0' }}>Score</div>
              <div style={{ display: 'inline-block', padding: '0.2rem 0.6rem', borderRadius: 6,
                            background: `${gradeColor}22`, color: gradeColor,
                            fontWeight: 700, fontFamily: 'monospace', fontSize: '0.95rem' }}>Grade {sc!.grade}</div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '0.75rem' }}>
              {[
                { label: 'Critical', val: t!.CRITICAL, color: '#ff4757' },
                { label: 'High',     val: t!.HIGH,     color: '#ff9f43' },
                { label: 'Medium',   val: t!.MEDIUM,   color: '#ffd32a' },
                { label: 'Low',      val: t!.LOW,      color: '#45aaf2' },
                { label: 'Secrets',  val: t!.SECRETS,  color: '#a55eea' },
                { label: 'Total',    val: t!.TOTAL,    color: '#e2e6ed' },
              ].map(s => (
                <div key={s.label} style={{ background: '#1e2229', border: '1px solid #252a33',
                                           borderRadius: 10, padding: '0.75rem', textAlign: 'center' }}>
                  <div style={{ fontSize: '1.6rem', fontWeight: 700, fontFamily: 'monospace',
                                color: s.color, lineHeight: 1 }}>{s.val}</div>
                  <div style={{ fontSize: '0.68rem', color: '#7a8494', marginTop: '0.25rem',
                                textTransform: 'uppercase', letterSpacing: '0.07em' }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', gap: 4, borderBottom: '1px solid #252a33', marginBottom: '1.5rem', overflowX: 'auto' }}>
            {TABS.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)}
                style={{ padding: '0.55rem 1rem', fontSize: '0.82rem', fontWeight: 500, cursor: 'pointer',
                         background: 'none', border: 'none', borderBottom: tab === t.id ? '2px solid #00d4a0' : '2px solid transparent',
                         color: tab === t.id ? '#00d4a0' : '#7a8494', whiteSpace: 'nowrap' }}>
                {t.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          {tab === 'overview' && (
            <div>
              <h3 style={{ fontSize: '0.82rem', fontWeight: 600, color: '#7a8494',
                           textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '1rem' }}>Score Deductions</h3>
              {sc!.deductions.length === 0
                ? <p style={{ color: '#00d4a0', fontSize: '0.85rem' }}>✓ No deductions — perfect score!</p>
                : sc!.deductions.map((d, i) => (
                    <div key={i} style={{ display: 'flex', gap: '0.75rem', padding: '0.5rem 0',
                                         borderBottom: '1px solid #252a33', fontSize: '0.82rem', alignItems: 'center' }}>
                      <span style={{ color: '#ff4757', fontFamily: 'monospace', fontWeight: 700, width: 40 }}>-{d.points}</span>
                      <span style={{ color: '#7a8494' }}>{d.reason}</span>
                    </div>
                  ))
              }
              <p style={{ fontSize: '0.75rem', color: '#404855', marginTop: '1rem' }}>
                Scanned {new Date(report.meta.scanned_at).toLocaleString()} · CLI tools (TruffleHog, Semgrep, Nuclei, Trivy) require local execution via <code>scripts/mega_scanner.py</code>
              </p>
            </div>
          )}

          {tab === 'vulnerabilities' && (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
              <thead>
                <tr style={{ background: '#1e2229' }}>
                  {['Severity','CVE / ID','Package','Summary','Fix','Source'].map(h => (
                    <th key={h} style={{ padding: '0.6rem 0.9rem', textAlign: 'left', fontSize: '0.7rem',
                                         textTransform: 'uppercase', letterSpacing: '0.07em', color: '#7a8494',
                                         borderBottom: '1px solid #252a33' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  ...(report.dependabot?.findings ?? []).map(f => ({ ...f, source: 'Dependabot' })),
                  ...(report.osv?.findings ?? []).map(f => ({ ...f, source: 'OSV.dev', cve: f.id, summary: f.summary, fixed_in: 'Check OSV', url: f.url })),
                ].map((f, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #252a33' }}>
                    <td style={{ padding: '0.6rem 0.9rem' }}><SevBadge sev={f.severity} /></td>
                    <td style={{ padding: '0.6rem 0.9rem', fontFamily: 'monospace', color: '#00d4a0', fontSize: '0.78rem' }}>{f.cve || f.id}</td>
                    <td style={{ padding: '0.6rem 0.9rem', fontFamily: 'monospace', fontSize: '0.78rem' }}>{f.package}</td>
                    <td style={{ padding: '0.6rem 0.9rem', maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.summary}</td>
                    <td style={{ padding: '0.6rem 0.9rem', fontFamily: 'monospace', color: '#00d4a0', fontSize: '0.78rem' }}>{f.fixed_in}</td>
                    <td style={{ padding: '0.6rem 0.9rem' }}><span style={{ background: '#1e2229', borderRadius: 4, padding: '2px 6px', fontSize: '0.7rem' }}>{f.source}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {tab === 'secrets' && (
            (report.secrets_github?.total ?? 0) === 0
              ? <p style={{ color: '#00d4a0', padding: '2rem', textAlign: 'center' }}>✓ No open secret scanning alerts</p>
              : <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                  <thead><tr style={{ background: '#1e2229' }}>
                    {['Type','Created','State','Link'].map(h => <th key={h} style={{ padding: '0.6rem 0.9rem', textAlign: 'left', fontSize: '0.7rem', textTransform: 'uppercase', color: '#7a8494', borderBottom: '1px solid #252a33' }}>{h}</th>)}
                  </tr></thead>
                  <tbody>{(report.secrets_github?.findings ?? []).map((f, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #252a33' }}>
                      <td style={{ padding: '0.6rem 0.9rem' }}>{f.type}</td>
                      <td style={{ padding: '0.6rem 0.9rem', fontFamily: 'monospace', fontSize: '0.78rem' }}>{new Date(f.created_at).toLocaleDateString()}</td>
                      <td style={{ padding: '0.6rem 0.9rem' }}>{f.state}</td>
                      <td style={{ padding: '0.6rem 0.9rem' }}><a href={f.url} target="_blank" rel="noopener noreferrer" style={{ color: '#00d4a0' }}>View ↗</a></td>
                    </tr>
                  ))}</tbody>
                </table>
          )}

          {tab === 'sast' && (
            (report.code_scanning?.total ?? 0) === 0
              ? <p style={{ color: '#00d4a0', padding: '2rem', textAlign: 'center' }}>✓ No open code scanning alerts</p>
              : <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                  <thead><tr style={{ background: '#1e2229' }}>
                    {['Severity','Rule','Description','File','Line','Tool'].map(h => <th key={h} style={{ padding: '0.6rem 0.9rem', textAlign: 'left', fontSize: '0.7rem', textTransform: 'uppercase', color: '#7a8494', borderBottom: '1px solid #252a33' }}>{h}</th>)}
                  </tr></thead>
                  <tbody>{(report.code_scanning?.findings ?? []).map((f, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #252a33' }}>
                      <td style={{ padding: '0.6rem 0.9rem' }}><SevBadge sev={f.severity} /></td>
                      <td style={{ padding: '0.6rem 0.9rem', fontFamily: 'monospace', color: '#00d4a0', fontSize: '0.72rem' }}>{f.rule}</td>
                      <td style={{ padding: '0.6rem 0.9rem', maxWidth: 240, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.description}</td>
                      <td style={{ padding: '0.6rem 0.9rem', fontFamily: 'monospace', fontSize: '0.72rem' }}>{f.file}</td>
                      <td style={{ padding: '0.6rem 0.9rem', fontFamily: 'monospace' }}>{f.line}</td>
                      <td style={{ padding: '0.6rem 0.9rem' }}><span style={{ background: '#1e2229', borderRadius: 4, padding: '2px 6px', fontSize: '0.7rem' }}>{f.tool}</span></td>
                    </tr>
                  ))}</tbody>
                </table>
          )}

          {tab === 'license' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1rem' }}>
              <div style={{ background: '#131519', border: '1px solid #252a33', borderRadius: 12, padding: '1.25rem' }}>
                <div style={{ fontSize: '0.7rem', color: '#7a8494', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '0.5rem' }}>License (SPDX)</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 700, fontFamily: 'monospace', color: '#00d4a0' }}>{report.license?.spdx ?? 'Unknown'}</div>
                <div style={{ fontSize: '0.78rem', marginTop: '0.4rem',
                              color: report.license?.risk === 'low' ? '#00d4a0' : report.license?.risk === 'high' ? '#ff4757' : '#ff9f43' }}>
                  {report.license?.risk === 'low' ? '✓ Permissive — low compliance risk'
                   : report.license?.risk === 'high' ? '⚠ Copyleft — requires open-sourcing derivatives'
                   : '~ Review license terms'}
                </div>
              </div>
              <div style={{ background: '#131519', border: '1px solid #252a33', borderRadius: 12, padding: '1.25rem' }}>
                <div style={{ fontSize: '0.7rem', color: '#7a8494', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '0.5rem' }}>Security Policy</div>
                <div style={{ fontSize: '0.9rem', color: report.has_security_md ? '#00d4a0' : '#ff4757' }}>
                  {report.has_security_md ? '✓ SECURITY.md found' : '✗ SECURITY.md missing'}
                </div>
                {!report.has_security_md && <div style={{ fontSize: '0.76rem', color: '#7a8494', marginTop: '0.5rem' }}>Add a SECURITY.md with your vulnerability disclosure policy to earn +3 score points.</div>}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
