'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { MegaScanReport } from '@/lib/security-types';

// ── Severity config ───────────────────────────────────────────────────────────
const SEV: Record<string, { color: string; bg: string; label: string; icon: string }> = {
  CRITICAL: { color: '#ff3b5c', bg: 'rgba(255,59,92,0.12)', label: 'CRITICAL', icon: '💀' },
  HIGH:     { color: '#ff7c2a', bg: 'rgba(255,124,42,0.12)', label: 'HIGH',     icon: '🔴' },
  MEDIUM:   { color: '#f5c518', bg: 'rgba(245,197,24,0.12)', label: 'MEDIUM',   icon: '🟡' },
  LOW:      { color: '#4fc3f7', bg: 'rgba(79,195,247,0.12)', label: 'LOW',      icon: '🔵' },
  UNKNOWN:  { color: '#78909c', bg: 'rgba(120,144,156,0.12)', label: 'UNKNOWN', icon: '⚪' },
};

function SevBadge({ sev }: { sev: string }) {
  const s = SEV[sev] ?? SEV.UNKNOWN;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 9px',
                   borderRadius: 4, fontSize: 10, fontWeight: 800, fontFamily: 'var(--font-mono, monospace)',
                   letterSpacing: '0.08em', background: s.bg, color: s.color, border: `1px solid ${s.color}44` }}>
      {s.icon} {s.label}
    </span>
  );
}

// ── Animated terminal typewriter ─────────────────────────────────────────────
function TerminalLine({ text, delay = 0, color = '#4ade80' }: { text: string; delay?: number; color?: string }) {
  const [shown, setShown] = useState('');
  useEffect(() => {
    let i = 0;
    const t = setTimeout(() => {
      const iv = setInterval(() => {
        setShown(text.slice(0, ++i));
        if (i >= text.length) clearInterval(iv);
      }, 18);
      return () => clearInterval(iv);
    }, delay);
    return () => clearTimeout(t);
  }, [text, delay]);
  return <div style={{ color, fontFamily: 'var(--font-mono, monospace)', fontSize: 12, lineHeight: 1.7 }}>{shown}<span style={{ opacity: shown.length < text.length ? 1 : 0 }}>█</span></div>;
}

// ── Score ring ────────────────────────────────────────────────────────────────
function ScoreRing({ score, grade }: { score: number; grade: string }) {
  const color = score >= 90 ? '#4ade80' : score >= 75 ? '#4fc3f7' : score >= 60 ? '#f5c518' : score >= 40 ? '#ff7c2a' : '#ff3b5c';
  const r = 54; const circ = 2 * Math.PI * r;
  const dash = circ * (score / 100);
  return (
    <div style={{ position: 'relative', width: 140, height: 140, flexShrink: 0 }}>
      <svg width="140" height="140" style={{ transform: 'rotate(-90deg)' }}>
        <circle cx="70" cy="70" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="10" />
        <circle cx="70" cy="70" r={r} fill="none" stroke={color} strokeWidth="10"
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 1.2s cubic-bezier(.4,0,.2,1)', filter: `drop-shadow(0 0 8px ${color}88)` }} />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center', gap: 2 }}>
        <span style={{ fontSize: 32, fontWeight: 800, color, fontFamily: 'var(--font-mono, monospace)', lineHeight: 1 }}>{score}</span>
        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.1em' }}>/ 100</span>
        <span style={{ fontSize: 14, fontWeight: 700, color, padding: '1px 8px',
                       borderRadius: 4, background: `${color}18`, border: `1px solid ${color}44`,
                       fontFamily: 'var(--font-mono, monospace)', marginTop: 2 }}>Grade {grade}</span>
      </div>
    </div>
  );
}

// ── Threat level banner ───────────────────────────────────────────────────────
function ThreatBanner({ score, repo }: { score: number; repo: string }) {
  const levels = [
    { min: 90, label: 'LOW RISK',      color: '#4ade80', bg: 'rgba(74,222,128,0.07)',  border: 'rgba(74,222,128,0.2)',  icon: '🛡️', msg: `${repo} has a strong security posture. No critical threats detected. Maintain regular scans and dependency updates.` },
    { min: 75, label: 'MODERATE RISK', color: '#4fc3f7', bg: 'rgba(79,195,247,0.07)', border: 'rgba(79,195,247,0.2)', icon: '⚠️', msg: `${repo} has minor vulnerabilities that should be patched. No active exploitation vectors detected, but prompt remediation is advised.` },
    { min: 60, label: 'ELEVATED RISK', color: '#f5c518', bg: 'rgba(245,197,24,0.07)', border: 'rgba(245,197,24,0.2)', icon: '🔶', msg: `${repo} has several unpatched vulnerabilities. An attacker with knowledge of these issues could potentially exploit the codebase. Immediate action recommended.` },
    { min: 40, label: 'HIGH RISK',     color: '#ff7c2a', bg: 'rgba(255,124,42,0.07)', border: 'rgba(255,124,42,0.2)', icon: '🚨', msg: `${repo} is at significant risk. Multiple high-severity vulnerabilities exist that are likely known to threat actors. Patch within 24 hours.` },
    { min: 0,  label: 'CRITICAL RISK', color: '#ff3b5c', bg: 'rgba(255,59,92,0.08)',  border: 'rgba(255,59,92,0.25)', icon: '💀', msg: `${repo} is severely compromised. Critical vulnerabilities expose the system to remote exploitation. STOP deployment and remediate immediately.` },
  ];
  const level = levels.find(l => score >= l.min) ?? levels[4];
  return (
    <div style={{ background: level.bg, border: `1px solid ${level.border}`, borderRadius: 12,
                  padding: '1.25rem 1.5rem', marginBottom: '1.5rem', display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
      <span style={{ fontSize: 28, flexShrink: 0 }}>{level.icon}</span>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
          <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.12em',
                         fontFamily: 'var(--font-mono, monospace)', color: level.color,
                         padding: '2px 8px', borderRadius: 4,
                         border: `1px solid ${level.border}`, background: level.bg }}>THREAT LEVEL: {level.label}</span>
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', fontFamily: 'var(--font-mono, monospace)' }}>
            ANALYST: DevLens Security Intelligence Engine v2.0
          </span>
        </div>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)', lineHeight: 1.7, margin: 0 }}>{level.msg}</p>
      </div>
    </div>
  );
}

// ── Scan module progress row ──────────────────────────────────────────────────
function ScanProgress({ scanning, done }: { scanning: boolean; done: boolean }) {
  const modules = [
    { id: 'dep',   label: 'Dependabot CVE Feed',         icon: '📦', delay: 0   },
    { id: 'sec',   label: 'Secret Leak Detection',        icon: '🔑', delay: 400 },
    { id: 'sast',  label: 'Code Scanning (SAST/CodeQL)', icon: '🧬', delay: 800 },
    { id: 'osv',   label: 'OSV.dev Vulnerability DB',    icon: '🌐', delay: 1200 },
    { id: 'lic',   label: 'License & Compliance Check',  icon: '⚖️', delay: 1600 },
  ];
  const [active, setActive] = useState<Set<string>>(new Set());
  const [completed, setCompleted] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!scanning) { setActive(new Set()); setCompleted(new Set()); return; }
    const timers: ReturnType<typeof setTimeout>[] = [];
    modules.forEach(m => {
      timers.push(setTimeout(() => setActive(a => new Set([...a, m.id])), m.delay));
      timers.push(setTimeout(() => {
        setActive(a => { const s = new Set(a); s.delete(m.id); return s; });
        setCompleted(c => new Set([...c, m.id]));
      }, m.delay + 1800));
    });
    return () => timers.forEach(clearTimeout);
  }, [scanning]);

  if (!scanning && !done) return null;

  return (
    <div style={{ background: '#0a0e14', border: '1px solid rgba(74,222,128,0.2)', borderRadius: 12,
                  padding: '1.25rem 1.5rem', marginBottom: '1.5rem', fontFamily: 'var(--font-mono, monospace)' }}>
      <div style={{ fontSize: 11, color: 'rgba(74,222,128,0.6)', letterSpacing: '0.1em', marginBottom: '1rem' }}>
        ▶ DEVLENS SECURITY INTELLIGENCE ENGINE — SCAN IN PROGRESS
      </div>
      {modules.map(m => {
        const isActive = active.has(m.id);
        const isDone = completed.has(m.id) || done;
        return (
          <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 10,
                                   padding: '0.35rem 0', fontSize: 12,
                                   color: isDone ? '#4ade80' : isActive ? '#f5c518' : 'rgba(255,255,255,0.25)' }}>
            <span style={{ width: 16, display: 'inline-block' }}>
              {isDone ? '✓' : isActive ? '⟳' : '○'}
            </span>
            <span>{m.icon}</span>
            <span>{m.label}</span>
            {isActive && <span style={{ color: '#f5c518', animation: 'pulse 1s infinite' }}>…scanning</span>}
            {isDone && !scanning && <span style={{ color: 'rgba(74,222,128,0.5)', fontSize: 10 }}>done</span>}
          </div>
        );
      })}
    </div>
  );
}

// ── Finding card ──────────────────────────────────────────────────────────────
function FindingRow({ sev, id, pkg, summary, fix, source, url }: {
  sev: string; id: string; pkg: string; summary: string; fix: string; source: string; url?: string;
}) {
  const s = SEV[sev] ?? SEV.UNKNOWN;
  return (
    <div style={{ background: '#0d1117', border: `1px solid ${s.color}28`,
                  borderLeft: `3px solid ${s.color}`, borderRadius: 8,
                  padding: '0.9rem 1.1rem', marginBottom: '0.6rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 6 }}>
        <SevBadge sev={sev} />
        <code style={{ fontSize: 11, color: s.color, background: s.bg,
                       padding: '2px 7px', borderRadius: 4 }}>{id || '—'}</code>
        <code style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)', background: 'rgba(255,255,255,0.06)',
                       padding: '2px 7px', borderRadius: 4 }}>{pkg}</code>
        <span style={{ marginLeft: 'auto', fontSize: 10, color: 'rgba(255,255,255,0.3)',
                       background: 'rgba(255,255,255,0.05)', padding: '2px 7px', borderRadius: 4 }}>{source}</span>
      </div>
      <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', margin: '0 0 0.5rem', lineHeight: 1.6 }}>{summary}</p>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        {fix && fix !== 'N/A' && (
          <span style={{ fontSize: 11, color: '#4ade80', fontFamily: 'var(--font-mono, monospace)' }}>
            ✓ Fix available: <strong>{fix}</strong>
          </span>
        )}
        {url && (
          <a href={url} target="_blank" rel="noopener noreferrer"
             style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', textDecoration: 'none' }}>
            View advisory ↗
          </a>
        )}
      </div>
    </div>
  );
}

// ── Remediation advice ────────────────────────────────────────────────────────
function RemediationPanel({ report }: { report: MegaScanReport }) {
  const tips: { icon: string; title: string; body: string; priority: 'urgent' | 'high' | 'medium' }[] = [];

  const critDep = (report.dependabot?.counts?.CRITICAL ?? 0);
  const highDep = (report.dependabot?.counts?.HIGH ?? 0);
  if (critDep > 0) tips.push({ icon: '💀', priority: 'urgent',
    title: `Patch ${critDep} critical dependency CVE${critDep > 1 ? 's' : ''} immediately`,
    body: 'Critical CVEs have public exploits or allow RCE/privilege escalation. Run `npm audit fix --force` or pin to the fixed version listed in each finding.' });
  if (highDep > 0) tips.push({ icon: '🔴', priority: 'high',
    title: `Update ${highDep} high-severity package${highDep > 1 ? 's' : ''}`,
    body: 'High-severity vulnerabilities are actively exploited in the wild. Run `npm audit` or check the advisory links in the Vulnerabilities tab.' });
  if ((report.secrets_github?.total ?? 0) > 0) tips.push({ icon: '🔑', priority: 'urgent',
    title: 'Rotate exposed secrets NOW',
    body: 'Leaked credentials are the #1 cause of supply chain attacks. Immediately revoke and rotate every exposed token, then use GitHub Secrets or a vault service instead of hardcoding.' });
  if ((report.code_scanning?.counts?.CRITICAL ?? 0) > 0) tips.push({ icon: '🧬', priority: 'urgent',
    title: 'Critical SAST findings detected',
    body: 'CodeQL or a similar SAST tool found critical code paths (e.g. SQL injection, XSS, path traversal). Review each finding in the SAST tab and apply the suggested fix.' });
  if (!report.has_security_md) tips.push({ icon: '📋', priority: 'medium',
    title: 'Add a SECURITY.md security policy',
    body: 'A SECURITY.md file tells researchers how to responsibly disclose vulnerabilities. GitHub will surface it automatically on the Security tab. Earns +3 score points.' });
  if (report.license?.risk === 'high') tips.push({ icon: '⚖️', priority: 'high',
    title: `Copyleft license (${report.license.spdx}) detected`,
    body: 'AGPL/GPL licenses require all derivatives to be open-sourced. If this conflicts with your business model, consult legal counsel and consider relicensing.' });
  if (tips.length === 0) tips.push({ icon: '🏆', priority: 'medium',
    title: 'No critical issues — keep it up!',
    body: 'Continue running weekly scans, keep dependencies up to date, and enable Dependabot auto-merge for patch-level updates.' });

  const priColor = { urgent: '#ff3b5c', high: '#ff7c2a', medium: '#f5c518' };
  return (
    <div>
      <h3 style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase',
                   letterSpacing: '0.1em', marginBottom: '1rem', fontFamily: 'var(--font-mono, monospace)' }}>
        ▸ ANALYST REMEDIATION BRIEF
      </h3>
      {tips.map((t, i) => (
        <div key={i} style={{ display: 'flex', gap: '0.85rem', padding: '1rem 1.1rem',
                              background: '#0d1117', border: `1px solid ${priColor[t.priority]}28`,
                              borderLeft: `3px solid ${priColor[t.priority]}`,
                              borderRadius: 8, marginBottom: '0.6rem' }}>
          <span style={{ fontSize: 20, flexShrink: 0 }}>{t.icon}</span>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
              <strong style={{ fontSize: 13, color: 'rgba(255,255,255,0.9)' }}>{t.title}</strong>
              <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.1em',
                             padding: '1px 6px', borderRadius: 3,
                             background: `${priColor[t.priority]}18`, color: priColor[t.priority],
                             fontFamily: 'var(--font-mono, monospace)' }}>{t.priority.toUpperCase()}</span>
            </div>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', margin: 0, lineHeight: 1.7 }}>{t.body}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function SecurityPage() {
  const [repo,    setRepo]    = useState('');
  const [loading, setLoading] = useState(false);
  const [report,  setReport]  = useState<MegaScanReport | null>(null);
  const [error,   setError]   = useState<string | null>(null);
  const [tab,     setTab]     = useState('overview');
  const inputRef = useRef<HTMLInputElement>(null);

  const scan = useCallback(async (force = false) => {
    const target = repo.trim();
    if (!target.includes('/')) { setError('Enter a valid owner/repo  e.g.  vercel/next.js'); return; }
    setLoading(true); setError(null); setReport(null);
    try {
      const res  = await fetch(`/api/security?repo=${encodeURIComponent(target)}${force ? '&force=1' : ''}`);
      const data = await res.json() as MegaScanReport;
      if ('error' in data) setError((data as { error: string }).error);
      else { setReport(data); setTab('overview'); }
    } catch (e) { setError(String(e)); }
    finally { setLoading(false); }
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

  const TABS = [
    { id: 'overview', label: '🔭 Overview' },
    { id: 'remediation', label: '🩹 Remediation' },
    { id: 'vulnerabilities', label: `📦 CVEs${((report?.dependabot?.total ?? 0) + (report?.osv?.total ?? 0)) > 0 ? ` (${(report?.dependabot?.total ?? 0) + (report?.osv?.total ?? 0)})` : ''}` },
    { id: 'secrets',  label: `🔑 Secrets${(report?.secrets_github?.total ?? 0) > 0 ? ` (${report?.secrets_github?.total})` : ''}` },
    { id: 'sast',     label: `🧬 SAST${(report?.code_scanning?.total ?? 0) > 0 ? ` (${report?.code_scanning?.total})` : ''}` },
    { id: 'license',  label: '⚖️ License' },
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#060a0f', color: '#e2e8f0',
                  fontFamily: 'var(--font-body, system-ui)', padding: '2rem',
                  backgroundImage: 'radial-gradient(ellipse 80% 50% at 50% -20%, rgba(74,222,128,0.06), transparent)' }}>
      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        @keyframes scanline { 0%{transform:translateY(-100%)} 100%{transform:translateY(100vh)} }
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
        .scan-input:focus { outline: none; border-color: rgba(74,222,128,0.5) !important; box-shadow: 0 0 0 3px rgba(74,222,128,0.1); }
        .tab-btn:hover { color: rgba(255,255,255,0.8) !important; }
        .finding-row:hover { border-color: rgba(255,255,255,0.12) !important; }
      `}</style>

      <div style={{ maxWidth: 1160, margin: '0 auto' }}>

        {/* ── Header ── */}
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#4ade80',
                          boxShadow: '0 0 8px #4ade80', animation: 'pulse 2s infinite' }} />
            <span style={{ fontSize: 10, fontFamily: 'var(--font-mono, monospace)',
                           color: 'rgba(74,222,128,0.7)', letterSpacing: '0.15em' }}>
              DEVLENS SECURITY INTELLIGENCE ENGINE v2.0 — ONLINE
            </span>
          </div>
          <h1 style={{ fontSize: 'clamp(1.5rem, 3vw, 2.2rem)', fontWeight: 800,
                       background: 'linear-gradient(135deg, #4ade80 0%, #22d3ee 100%)',
                       WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                       letterSpacing: '-0.03em', margin: '0 0 0.4rem' }}>
            Cybersecurity Vulnerability Scanner
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, margin: 0, lineHeight: 1.6 }}>
            Deep threat intelligence across 5 scan modules — Dependabot CVEs · Secret Leak Detection · SAST/CodeQL · OSV.dev · License Compliance
          </p>
        </div>

        {/* ── Input ── */}
        <div style={{ display: 'flex', gap: 10, marginBottom: '1.5rem', flexWrap: 'wrap',
                      background: '#0d1117', border: '1px solid rgba(74,222,128,0.2)',
                      borderRadius: 12, padding: '1rem 1.25rem', alignItems: 'center' }}>
          <span style={{ fontSize: 12, color: 'rgba(74,222,128,0.6)',
                         fontFamily: 'var(--font-mono, monospace)', flexShrink: 0 }}>target $</span>
          <input
            ref={inputRef}
            className="scan-input"
            value={repo}
            onChange={e => setRepo(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && scan()}
            placeholder="owner/repo  —  e.g. vercel/next.js"
            style={{ flex: 1, minWidth: 220, background: 'transparent', border: 'none',
                     color: '#e2e8f0', fontFamily: 'var(--font-mono, monospace)', fontSize: 14,
                     caretColor: '#4ade80' }}
          />
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button onClick={() => scan()} disabled={loading}
              style={{ padding: '0.55rem 1.25rem', borderRadius: 8,
                       background: loading ? 'rgba(74,222,128,0.15)' : 'rgba(74,222,128,0.9)',
                       color: loading ? '#4ade80' : '#000', fontWeight: 700,
                       fontSize: 13, border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
                       transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: 6 }}>
              {loading
                ? <><span style={{ animation: 'pulse 1s infinite' }}>⟳</span> Scanning…</>
                : <>🔍 Run Scan</>}
            </button>
            {report && !loading && (
              <>
                <button onClick={() => scan(true)}
                  style={{ padding: '0.55rem 0.9rem', borderRadius: 8, fontSize: 12,
                           background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.6)',
                           border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer' }}>↺ Rescan</button>
                <button onClick={exportJson}
                  style={{ padding: '0.55rem 0.9rem', borderRadius: 8, fontSize: 12,
                           background: 'rgba(74,222,128,0.1)', color: '#4ade80',
                           border: '1px solid rgba(74,222,128,0.25)', cursor: 'pointer' }}>⬇ Export JSON</button>
              </>
            )}
          </div>
        </div>

        {/* ── Error ── */}
        {error && (
          <div style={{ padding: '0.85rem 1.1rem', borderRadius: 8,
                        background: 'rgba(255,59,92,0.08)', border: '1px solid rgba(255,59,92,0.3)',
                        color: '#ff3b5c', fontSize: 12, marginBottom: '1rem',
                        fontFamily: 'var(--font-mono, monospace)', display: 'flex', gap: 8, alignItems: 'center' }}>
            <span>⚠</span> {error}
          </div>
        )}

        {/* ── Scan progress ── */}
        <ScanProgress scanning={loading} done={!!report} />

        {/* ── Empty state terminal ── */}
        {!loading && !report && !error && (
          <div style={{ background: '#0a0e14', border: '1px solid rgba(74,222,128,0.15)',
                        borderRadius: 12, padding: '2rem 2rem', marginTop: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '1.25rem' }}>
              <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#ff3b5c' }} />
              <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#f5c518' }} />
              <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#4ade80' }} />
              <span style={{ marginLeft: 8, fontSize: 11, color: 'rgba(255,255,255,0.2)',
                             fontFamily: 'var(--font-mono, monospace)' }}>devlens-security — zsh</span>
            </div>
            <TerminalLine text="$ devlens-security --help" delay={200} color="rgba(255,255,255,0.7)" />
            <TerminalLine text="" delay={700} />
            <TerminalLine text="  DevLens Security Intelligence Engine v2.0" delay={800} color="#4ade80" />
            <TerminalLine text="  Multi-module vulnerability scanner for GitHub repositories" delay={1400} color="rgba(255,255,255,0.5)" />
            <TerminalLine text="" delay={1800} />
            <TerminalLine text="  MODULES:" delay={1900} color="#22d3ee" />
            <TerminalLine text="    [1] Dependabot CVE Feed      — CVSS-scored dependency vulnerabilities" delay={2200} color="rgba(255,255,255,0.45)" />
            <TerminalLine text="    [2] Secret Leak Detection    — API keys, tokens, credentials in source" delay={2700} color="rgba(255,255,255,0.45)" />
            <TerminalLine text="    [3] SAST / CodeQL Analysis   — Static code analysis for security flaws" delay={3200} color="rgba(255,255,255,0.45)" />
            <TerminalLine text="    [4] OSV.dev Cross-Reference   — Open Source Vulnerability database" delay={3700} color="rgba(255,255,255,0.45)" />
            <TerminalLine text="    [5] License Compliance       — Copyleft risk and policy check" delay={4200} color="rgba(255,255,255,0.45)" />
            <TerminalLine text="" delay={4600} />
            <TerminalLine text="  USAGE:  Enter owner/repo above and press Run Scan" delay={4700} color="#f5c518" />
            <TerminalLine text="  EXAMPLE: vercel/next.js   |   facebook/react   |   SamoTech/devlens" delay={5400} color="rgba(255,255,255,0.3)" />
            <TerminalLine text="" delay={5900} />
            <TerminalLine text="$ █" delay={6000} color="#4ade80" />
          </div>
        )}

        {/* ── Results ── */}
        {report && !loading && (
          <>
            {/* Threat banner */}
            <ThreatBanner score={sc!.score} repo={`${report.meta.owner}/${report.meta.repo}`} />

            {/* Score row */}
            <div style={{ display: 'flex', gap: '1.25rem', marginBottom: '1.5rem',
                          background: '#0d1117', border: '1px solid rgba(255,255,255,0.07)',
                          borderRadius: 14, padding: '1.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <ScoreRing score={sc!.score} grade={sc!.grade} />
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(90px, 1fr))',
                            gap: 10, flex: 1, minWidth: 240 }}>
                {[
                  { label: 'Critical', val: t!.CRITICAL, color: '#ff3b5c' },
                  { label: 'High',     val: t!.HIGH,     color: '#ff7c2a' },
                  { label: 'Medium',   val: t!.MEDIUM,   color: '#f5c518' },
                  { label: 'Low',      val: t!.LOW,      color: '#4fc3f7' },
                  { label: 'Secrets',  val: t!.SECRETS,  color: '#c084fc' },
                  { label: 'Total',    val: t!.TOTAL,    color: 'rgba(255,255,255,0.7)' },
                ].map(s => (
                  <div key={s.label} style={{ background: '#0a0e14', border: `1px solid ${s.color}28`,
                                             borderRadius: 10, padding: '0.75rem 0.6rem', textAlign: 'center' }}>
                    <div style={{ fontSize: 26, fontWeight: 800, color: s.color,
                                  fontFamily: 'var(--font-mono, monospace)', lineHeight: 1,
                                  filter: s.val > 0 ? `drop-shadow(0 0 6px ${s.color}66)` : 'none' }}>{s.val}</div>
                    <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginTop: 4,
                                  textTransform: 'uppercase', letterSpacing: '0.08em' }}>{s.label}</div>
                  </div>
                ))}
              </div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)', alignSelf: 'flex-end',
                            fontFamily: 'var(--font-mono, monospace)', lineHeight: 1.8 }}>
                <div>Scanned: {new Date(report.meta.scanned_at).toLocaleString()}</div>
                <div>Modules: {report.meta.modules.join(' · ')}</div>
              </div>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: 2, borderBottom: '1px solid rgba(255,255,255,0.07)',
                          marginBottom: '1.5rem', overflowX: 'auto' }}>
              {TABS.map(tb => (
                <button key={tb.id} className="tab-btn" onClick={() => setTab(tb.id)}
                  style={{ padding: '0.55rem 1rem', fontSize: 12, fontWeight: 500, cursor: 'pointer',
                           background: 'none', border: 'none', whiteSpace: 'nowrap', transition: 'all 0.2s',
                           borderBottom: tab === tb.id ? '2px solid #4ade80' : '2px solid transparent',
                           color: tab === tb.id ? '#4ade80' : 'rgba(255,255,255,0.35)' }}>
                  {tb.label}
                </button>
              ))}
            </div>

            {/* ── Tab: Overview ── */}
            {tab === 'overview' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
                {[
                  { title: 'Dependency CVEs',  icon: '📦', total: report.dependabot?.total ?? 0, enabled: report.dependabot?.enabled, counts: report.dependabot?.counts },
                  { title: 'Secret Scanning',  icon: '🔑', total: report.secrets_github?.total ?? 0, enabled: report.secrets_github?.enabled, counts: {} },
                  { title: 'Code Scanning',    icon: '🧬', total: report.code_scanning?.total ?? 0, enabled: report.code_scanning?.enabled, counts: report.code_scanning?.counts },
                  { title: 'OSV.dev',          icon: '🌐', total: report.osv?.total ?? 0, enabled: true, counts: report.osv?.counts },
                ].map(m => (
                  <div key={m.title} style={{ background: '#0d1117', border: '1px solid rgba(255,255,255,0.07)',
                                             borderRadius: 12, padding: '1.1rem 1.2rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                      <span style={{ fontSize: 18 }}>{m.icon}</span>
                      <span style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.8)' }}>{m.title}</span>
                      <span style={{ marginLeft: 'auto', fontSize: 10, padding: '1px 7px', borderRadius: 4,
                                     background: m.enabled ? 'rgba(74,222,128,0.12)' : 'rgba(255,59,92,0.12)',
                                     color: m.enabled ? '#4ade80' : '#ff3b5c',
                                     fontFamily: 'var(--font-mono, monospace)' }}>
                        {m.enabled ? 'ACTIVE' : 'DISABLED'}
                      </span>
                    </div>
                    <div style={{ fontSize: 32, fontWeight: 800, color: m.total > 0 ? '#ff7c2a' : '#4ade80',
                                  fontFamily: 'var(--font-mono, monospace)', marginBottom: 4 }}>{m.total}</div>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>open findings</div>
                    {m.counts && Object.keys(m.counts).length > 0 && (
                      <div style={{ display: 'flex', gap: 6, marginTop: 10, flexWrap: 'wrap' }}>
                        {(['CRITICAL','HIGH','MEDIUM','LOW'] as const).filter(s => (m.counts as Record<string,number>)[s] > 0).map(s => (
                          <span key={s} style={{ fontSize: 10, padding: '2px 7px', borderRadius: 4,
                                                 background: SEV[s].bg, color: SEV[s].color,
                                                 fontFamily: 'var(--font-mono, monospace)', fontWeight: 700 }}>
                            {(m.counts as Record<string,number>)[s]} {s}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
                {/* Deductions */}
                <div style={{ background: '#0d1117', border: '1px solid rgba(255,255,255,0.07)',
                              borderRadius: 12, padding: '1.1rem 1.2rem',
                              gridColumn: 'span 2' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.3)',
                                textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.75rem',
                                fontFamily: 'var(--font-mono, monospace)' }}>▸ Score Deductions</div>
                  {sc!.deductions.length === 0
                    ? <p style={{ color: '#4ade80', fontSize: 12 }}>✓ No deductions — perfect security score!</p>
                    : sc!.deductions.map((d, i) => (
                        <div key={i} style={{ display: 'flex', gap: 12, padding: '0.45rem 0',
                                             borderBottom: '1px solid rgba(255,255,255,0.05)',
                                             fontSize: 12, alignItems: 'center' }}>
                          <span style={{ color: '#ff3b5c', fontFamily: 'var(--font-mono, monospace)',
                                         fontWeight: 700, minWidth: 42, fontSize: 11 }}>-{d.points}pts</span>
                          <span style={{ color: 'rgba(255,255,255,0.5)' }}>{d.reason}</span>
                        </div>
                      ))}
                </div>
              </div>
            )}

            {/* ── Tab: Remediation ── */}
            {tab === 'remediation' && <RemediationPanel report={report} />}

            {/* ── Tab: Vulnerabilities ── */}
            {tab === 'vulnerabilities' && (
              <div>
                {[
                  ...(report.dependabot?.findings ?? []).map(f => ({ ...f, source: 'Dependabot' })),
                  ...(report.osv?.findings ?? []).map(f => ({ sev: f.severity, id: f.id, pkg: f.package, summary: f.summary, fix: 'See OSV.dev', source: 'OSV.dev', url: f.url })),
                ].length === 0
                  ? <p style={{ color: '#4ade80', padding: '2rem', textAlign: 'center', fontSize: 13 }}>✓ No open CVEs or known vulnerabilities detected</p>
                  : [
                      ...(report.dependabot?.findings ?? []).map(f => ({ sev: f.severity, id: f.cve || f.id, pkg: f.package, summary: f.summary, fix: f.fixed_in, source: 'Dependabot', url: f.url })),
                      ...(report.osv?.findings ?? []).map(f => ({ sev: f.severity, id: f.id, pkg: f.package, summary: f.summary, fix: 'See OSV.dev', source: 'OSV.dev', url: f.url })),
                    ].map((f, i) => <FindingRow key={i} {...f} />)
                }
              </div>
            )}

            {/* ── Tab: Secrets ── */}
            {tab === 'secrets' && (
              (report.secrets_github?.total ?? 0) === 0
                ? <div style={{ textAlign: 'center', padding: '3rem', color: '#4ade80', fontSize: 13 }}>
                    <div style={{ fontSize: 36, marginBottom: 12 }}>🔒</div>
                    <div>No leaked secrets detected in this repository</div>
                    <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11, marginTop: 8 }}>GitHub Secret Scanning is monitoring for 200+ secret patterns</div>
                  </div>
                : <div>
                    {(report.secrets_github?.findings ?? []).map((f, i) => (
                      <div key={i} style={{ background: '#0d1117', border: '1px solid rgba(192,132,252,0.2)',
                                           borderLeft: '3px solid #c084fc', borderRadius: 8,
                                           padding: '0.9rem 1.1rem', marginBottom: '0.6rem' }}>
                        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                          <span style={{ fontSize: 11, fontWeight: 700, background: 'rgba(192,132,252,0.12)',
                                         color: '#c084fc', padding: '2px 8px', borderRadius: 4,
                                         fontFamily: 'var(--font-mono, monospace)' }}>🔑 {f.type}</span>
                          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', fontFamily: 'var(--font-mono, monospace)' }}>
                            Detected: {new Date(f.created_at).toLocaleDateString()}
                          </span>
                          <a href={f.url} target="_blank" rel="noopener noreferrer"
                             style={{ marginLeft: 'auto', fontSize: 11, color: '#c084fc', textDecoration: 'none' }}>View ↗</a>
                        </div>
                        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', margin: '8px 0 0', lineHeight: 1.6 }}>
                          ⚠ Rotate this credential immediately. Remove from git history using `git filter-branch` or BFG Repo Cleaner.
                        </p>
                      </div>
                    ))}
                  </div>
            )}

            {/* ── Tab: SAST ── */}
            {tab === 'sast' && (
              (report.code_scanning?.total ?? 0) === 0
                ? <div style={{ textAlign: 'center', padding: '3rem', color: '#4ade80', fontSize: 13 }}>
                    <div style={{ fontSize: 36, marginBottom: 12 }}>🧬</div>
                    <div>No open SAST findings</div>
                    <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11, marginTop: 8 }}>
                      {report.code_scanning?.enabled ? `Tools active: ${report.code_scanning.tools.join(', ')}` : 'Enable CodeQL in GitHub Actions to start SAST scanning'}
                    </div>
                  </div>
                : <div>
                    {(report.code_scanning?.findings ?? []).map((f, i) => (
                      <div key={i} style={{ background: '#0d1117', border: `1px solid ${SEV[f.severity]?.color ?? '#78909c'}28`,
                                           borderLeft: `3px solid ${SEV[f.severity]?.color ?? '#78909c'}`,
                                           borderRadius: 8, padding: '0.9rem 1.1rem', marginBottom: '0.6rem' }}>
                        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', marginBottom: 6 }}>
                          <SevBadge sev={f.severity} />
                          <code style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', background: 'rgba(255,255,255,0.06)',
                                         padding: '2px 7px', borderRadius: 4 }}>{f.rule}</code>
                          <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.05)',
                                         padding: '2px 6px', borderRadius: 4, fontFamily: 'var(--font-mono, monospace)' }}>
                            {f.tool}
                          </span>
                          {f.url && <a href={f.url} target="_blank" rel="noopener noreferrer" style={{ marginLeft: 'auto', fontSize: 11, color: '#22d3ee', textDecoration: 'none' }}>View ↗</a>}
                        </div>
                        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', margin: '0 0 6px', lineHeight: 1.6 }}>{f.description}</p>
                        <code style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)',
                                       fontFamily: 'var(--font-mono, monospace)' }}>{f.file}{f.line ? `:${f.line}` : ''}</code>
                      </div>
                    ))}
                  </div>
            )}

            {/* ── Tab: License ── */}
            {tab === 'license' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
                <div style={{ background: '#0d1117', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: '1.25rem' }}>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase',
                                letterSpacing: '0.1em', marginBottom: 10, fontFamily: 'var(--font-mono, monospace)' }}>License (SPDX)</div>
                  <div style={{ fontSize: 36, fontWeight: 800, fontFamily: 'var(--font-mono, monospace)',
                                color: report.license?.risk === 'low' ? '#4ade80' : report.license?.risk === 'high' ? '#ff3b5c' : '#f5c518',
                                marginBottom: 8 }}>{report.license?.spdx ?? 'Unknown'}</div>
                  <p style={{ fontSize: 12, lineHeight: 1.7, margin: 0,
                              color: report.license?.risk === 'low' ? '#4ade80' : report.license?.risk === 'high' ? '#ff3b5c' : '#f5c518' }}>
                    {report.license?.risk === 'low' ? '✓ Permissive license — low compliance risk. Commercial use is unrestricted.'
                     : report.license?.risk === 'high' ? '⚠ Copyleft license — any derivative work must be released under the same terms. Consult legal counsel before commercial use.'
                     : '~ Non-standard or source-available license. Review terms carefully before use.'}
                  </p>
                </div>
                <div style={{ background: '#0d1117', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: '1.25rem' }}>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase',
                                letterSpacing: '0.1em', marginBottom: 10, fontFamily: 'var(--font-mono, monospace)' }}>Security Policy</div>
                  <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 8,
                                color: report.has_security_md ? '#4ade80' : '#ff3b5c' }}>
                    {report.has_security_md ? '✓ SECURITY.md present' : '✗ SECURITY.md missing'}
                  </div>
                  <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', lineHeight: 1.7, margin: 0 }}>
                    {report.has_security_md
                      ? 'This repository has a vulnerability disclosure policy. Researchers know how to report security issues responsibly.'
                      : 'Without a SECURITY.md, researchers have no official channel to report vulnerabilities. Add one to earn +3 score points and improve trust.'}
                  </p>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
