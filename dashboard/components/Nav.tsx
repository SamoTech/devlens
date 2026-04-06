"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Github, Menu, X } from "lucide-react";
import ThemeToggle from "./ThemeToggle";
export default function Nav() {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  useEffect(() => setOpen(false), [path]);
  const links = [
    { href: "/", label: "Analyze" },
    { href: "/compare", label: "Compare" },
    { href: "/leaderboard", label: "Leaderboard" },
    { href: "/checked", label: "Checked" },
    { href: "/docs", label: "Docs" },
    { href: "/changelog", label: "Changelog" },
    { href: "/sponsor", label: "Sponsor" },
  ];
  const active = (href: string) => href === "/" ? path === "/" : path.startsWith(href);
  return (
    <header style={{ position:"sticky",top:0,zIndex:50,background:"var(--surface)",borderBottom:"1px solid var(--divider)",backdropFilter:"blur(12px)" }}>
      <div style={{ maxWidth:"1200px",margin:"0 auto",padding:"var(--space-3) var(--space-6)",display:"flex",alignItems:"center",justifyContent:"space-between",gap:"var(--space-4)" }}>
        <Link href="/" style={{ display:"flex",alignItems:"center",gap:"var(--space-2)",textDecoration:"none",color:"var(--text)" }}>
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-label="DevLens logo">
            <rect width="28" height="28" rx="6" fill="var(--primary)"/>
            <circle cx="14" cy="14" r="6" fill="none" stroke="white" strokeWidth="2"/>
            <circle cx="14" cy="14" r="2" fill="white"/>
            <line x1="20" y1="20" x2="24" y2="24" stroke="white" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          <span style={{ fontFamily:"var(--font-display)",fontWeight:800,fontSize:"var(--text-base)" }}>DevLens</span>
        </Link>
        <nav style={{ display:"flex",alignItems:"center",gap:"var(--space-1)" }} className="nav-desktop">
          {links.map(l => (
            <Link key={l.href} href={l.href} style={{ fontSize:"var(--text-sm)",padding:"var(--space-2) var(--space-3)",borderRadius:"var(--radius-md)",textDecoration:"none",color: active(l.href) ? "var(--primary)" : "var(--text-muted)",fontWeight: active(l.href) ? 600 : 400,background: active(l.href) ? "var(--primary-hl)" : "transparent" }}>{l.label}</Link>
          ))}
        </nav>
        <div style={{ display:"flex",alignItems:"center",gap:"var(--space-2)" }}>
          <a href="https://github.com/SamoTech/devlens" target="_blank" rel="noopener noreferrer" style={{ color:"var(--text-muted)",padding:"var(--space-2)",display:"flex" }} aria-label="GitHub"><Github size={18}/></a>
          <ThemeToggle/>
          <button onClick={() => setOpen(o => !o)} className="nav-mobile-btn" aria-label="Toggle menu" style={{ color:"var(--text-muted)",padding:"var(--space-2)",display:"none" }}>
            {open ? <X size={20}/> : <Menu size={20}/>}
          </button>
        </div>
      </div>
      {open && (
        <div style={{ borderTop:"1px solid var(--divider)",background:"var(--surface)",padding:"var(--space-3) var(--space-6) var(--space-4)" }} className="nav-mobile-menu">
          {links.map(l => (
            <Link key={l.href} href={l.href} style={{ display:"block",padding:"var(--space-3) 0",fontSize:"var(--text-base)",color: active(l.href) ? "var(--primary)" : "var(--text)",fontWeight: active(l.href) ? 600 : 400,textDecoration:"none",borderBottom:"1px solid var(--divider)" }}>{l.label}</Link>
          ))}
        </div>
      )}
      <style>{`@media(max-width:640px){.nav-desktop{display:none!important}.nav-mobile-btn{display:flex!important}}`}</style>
    </header>
  );
}