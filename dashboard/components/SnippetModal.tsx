"use client";
import { useState } from "react";
import { Copy, Check, X } from "lucide-react";
export default function SnippetModal({ repo, onClose }: { repo: string; onClose: () => void }) {
  const [copiedSnippet, setCopiedSnippet] = useState(false);
  const [copiedWf, setCopiedWf] = useState(false);
  const snippet = `<!-- DEVLENS:START -->\n<!-- DEVLENS:END -->`;
  const workflow = `name: DevLens Health Check\non:\n  push:\n    branches: [main]\n  schedule:\n    - cron: '0 8 * * 1'\npermissions:\n  contents: write\njobs:\n  devlens:\n    runs-on: ubuntu-latest\n    steps:\n      - uses: actions/checkout@v4\n      - uses: SamoTech/devlens@v1\n        with:\n          github_token: \${{ secrets.GITHUB_TOKEN }}\n          groq_api_key: \${{ secrets.GROQ_API_KEY }}`;
  function copy(text: string, which: "s"|"w") {
    navigator.clipboard.writeText(text);
    if (which==="s") { setCopiedSnippet(true); setTimeout(()=>setCopiedSnippet(false),2000); }
    else { setCopiedWf(true); setTimeout(()=>setCopiedWf(false),2000); }
  }
  return (
    <div style={{ position:"fixed",inset:0,zIndex:100,background:"oklch(0.1 0 0/.6)",display:"flex",alignItems:"center",justifyContent:"center",padding:"var(--space-4)" }} onClick={onClose}>
      <div style={{ background:"var(--surface)",border:"1px solid var(--border)",borderRadius:"var(--radius-xl)",padding:"var(--space-8)",maxWidth:"600px",width:"100%",boxShadow:"var(--shadow-lg)",display:"flex",flexDirection:"column",gap:"var(--space-6)" }} onClick={e=>e.stopPropagation()}>
        <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center" }}>
          <h2 style={{ fontFamily:"var(--font-display)",fontSize:"var(--text-lg)",fontWeight:800 }}>Add DevLens to {repo}</h2>
          <button onClick={onClose} style={{ color:"var(--text-muted)",padding:"var(--space-1)" }}><X size={18}/></button>
        </div>
        <div style={{ display:"flex",flexDirection:"column",gap:"var(--space-2)" }}>
          <p style={{ fontWeight:600,fontSize:"var(--text-sm)" }}>Step 1 — Add to README.md</p>
          <div style={{ background:"var(--surface-off)",borderRadius:"var(--radius-md)",padding:"var(--space-3) var(--space-4)",fontFamily:"monospace",fontSize:"var(--text-sm)",color:"var(--text)",position:"relative" }}>
            <pre style={{ whiteSpace:"pre-wrap",wordBreak:"break-all" }}>{snippet}</pre>
            <button onClick={()=>copy(snippet,"s")} style={{ position:"absolute",top:"var(--space-2)",right:"var(--space-2)",color:"var(--text-muted)",padding:"var(--space-1)" }} aria-label="Copy snippet">
              {copiedSnippet ? <Check size={14} color="var(--success)"/> : <Copy size={14}/>}
            </button>
          </div>
        </div>
        <div style={{ display:"flex",flexDirection:"column",gap:"var(--space-2)" }}>
          <p style={{ fontWeight:600,fontSize:"var(--text-sm)" }}>Step 2 — Create .github/workflows/devlens.yml</p>
          <div style={{ background:"var(--surface-off)",borderRadius:"var(--radius-md)",padding:"var(--space-3) var(--space-4)",fontFamily:"monospace",fontSize:"var(--text-xs)",color:"var(--text)",position:"relative",maxHeight:"220px",overflowY:"auto" }}>
            <pre style={{ whiteSpace:"pre" }}>{workflow}</pre>
            <button onClick={()=>copy(workflow,"w")} style={{ position:"absolute",top:"var(--space-2)",right:"var(--space-2)",color:"var(--text-muted)",padding:"var(--space-1)" }} aria-label="Copy workflow">
              {copiedWf ? <Check size={14} color="var(--success)"/> : <Copy size={14}/>}
            </button>
          </div>
        </div>
        <p style={{ fontSize:"var(--text-xs)",color:"var(--text-faint)" }}>After pushing, DevLens auto-injects the 7-row health table between the markers on every push.</p>
      </div>
    </div>
  );
}