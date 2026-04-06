import type { Metadata } from "next";
import Link from "next/link";
export const metadata: Metadata = { title: "404 — Page Not Found" };
export default function NotFound() {
  return (
    <div style={{ maxWidth:"480px",margin:"0 auto",padding:"var(--space-16) var(--space-6)",textAlign:"center",display:"flex",flexDirection:"column",alignItems:"center",gap:"var(--space-4)" }}>
      <div style={{ fontSize:"4rem",lineHeight:1 }}>🔭</div>
      <h1 style={{ fontFamily:"var(--font-display)",fontSize:"var(--text-xl)",fontWeight:800 }}>Page not found</h1>
      <p style={{ color:"var(--text-muted)",fontSize:"var(--text-base)" }}>This page doesn&apos;t exist or was moved. Try analyzing a repo instead.</p>
      <Link href="/" style={{ display:"inline-flex",alignItems:"center",gap:"var(--space-2)",padding:"var(--space-3) var(--space-6)",background:"var(--primary)",color:"white",borderRadius:"var(--radius-lg)",fontWeight:600,fontSize:"var(--text-sm)",textDecoration:"none",marginTop:"var(--space-2)" }}>← Back to home</Link>
    </div>
  );
}