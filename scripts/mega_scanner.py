#!/usr/bin/env python3
"""
DevLens Mega Security Scanner
Chains: GitHub Security APIs + OSV.dev + Semgrep + TruffleHog + Nuclei + Trivy
Outputs: Unified JSON report with severity breakdown

Usage:
  python mega_scanner.py owner/repo
  python mega_scanner.py owner/repo --url https://myapp.vercel.app
  python mega_scanner.py owner/repo --modules dependabot osv license
  python mega_scanner.py owner/repo --output report.json
"""

import subprocess, json, os, sys, shutil, urllib.request
from datetime import datetime, timezone

GITHUB_TOKEN = os.environ.get("GITHUB_TOKEN", "")
HEADERS = {
    "Accept": "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
}
if GITHUB_TOKEN:
    HEADERS["Authorization"] = f"Bearer {GITHUB_TOKEN}"

SEV_ORDER = {"CRITICAL": 0, "HIGH": 1, "MEDIUM": 2, "LOW": 3, "INFO": 4, "UNKNOWN": 5}

# ── Helpers ─────────────────────────────────────────────────────────────────

def gh_get(path: str):
    req = urllib.request.Request(f"https://api.github.com{path}", headers=HEADERS)
    try:
        with urllib.request.urlopen(req, timeout=15) as r:
            return json.loads(r.read())
    except Exception as e:
        return {"_error": str(e)}

def gh_graphql(query: str, variables: dict) -> dict:
    payload = json.dumps({"query": query, "variables": variables}).encode()
    req = urllib.request.Request(
        "https://api.github.com/graphql",
        data=payload,
        headers={**HEADERS, "Content-Type": "application/json"},
    )
    try:
        with urllib.request.urlopen(req, timeout=15) as r:
            return json.loads(r.read())
    except Exception as e:
        return {"errors": [{"message": str(e)}]}

def osv_query(package: str, version: str, ecosystem: str) -> list:
    payload = json.dumps({"version": version, "package": {"name": package, "ecosystem": ecosystem}}).encode()
    req = urllib.request.Request(
        "https://api.osv.dev/v1/query", data=payload,
        headers={"Content-Type": "application/json"},
    )
    try:
        with urllib.request.urlopen(req, timeout=10) as r:
            return json.loads(r.read()).get("vulns", [])
    except Exception:
        return []

def tool_available(name: str) -> bool:
    return shutil.which(name) is not None

def run_cmd(cmd: list, cwd: str = None, timeout: int = 120):
    try:
        r = subprocess.run(cmd, cwd=cwd, capture_output=True, text=True, timeout=timeout)
        return r.returncode, r.stdout, r.stderr
    except subprocess.TimeoutExpired:
        return -1, "", "timeout"
    except Exception as e:
        return -1, "", str(e)

def sev_sort(items, key="severity"):
    return sorted(items, key=lambda x: SEV_ORDER.get(x.get(key, "UNKNOWN").upper(), 5))

# ── Module 1: Dependabot ─────────────────────────────────────────────────────

def scan_dependabot(owner: str, repo: str) -> dict:
    alerts = gh_get(f"/repos/{owner}/{repo}/dependabot/alerts?state=open&per_page=100")
    if isinstance(alerts, dict) and "_error" in alerts:
        return {"enabled": False, "error": alerts["_error"], "findings": [], "counts": {}}
    counts = {}
    findings = []
    for a in (alerts or []):
        sev = a.get("security_advisory", {}).get("severity", "UNKNOWN").upper()
        counts[sev] = counts.get(sev, 0) + 1
        pkg = a.get("dependency", {}).get("package", {})
        adv = a.get("security_advisory", {})
        findings.append({
            "id": adv.get("ghsa_id", ""), "cve": adv.get("cve_id", ""),
            "package": pkg.get("name", ""), "ecosystem": pkg.get("ecosystem", ""),
            "severity": sev, "summary": adv.get("summary", ""),
            "fixed_in": ((a.get("security_vulnerability", {}).get("first_patched_version") or {}).get("identifier", "N/A")),
            "url": a.get("html_url", ""),
        })
    return {"enabled": True, "findings": sev_sort(findings), "counts": counts, "total": len(findings)}

# ── Module 2: Secret Scanning ─────────────────────────────────────────────────

def scan_secrets_github(owner: str, repo: str) -> dict:
    alerts = gh_get(f"/repos/{owner}/{repo}/secret-scanning/alerts?state=open&per_page=100")
    if isinstance(alerts, dict) and "_error" in alerts:
        return {"enabled": False, "error": alerts["_error"], "findings": []}
    findings = [{
        "type": a.get("secret_type_display_name", a.get("secret_type", "")),
        "state": a.get("state", ""),
        "created_at": a.get("created_at", ""),
        "url": a.get("html_url", ""),
    } for a in (alerts or [])]
    return {"enabled": True, "findings": findings, "total": len(findings)}

# ── Module 3: Code Scanning (SAST) ───────────────────────────────────────────

def scan_code_scanning(owner: str, repo: str) -> dict:
    alerts = gh_get(f"/repos/{owner}/{repo}/code-scanning/alerts?state=open&per_page=100")
    if isinstance(alerts, dict) and "_error" in alerts:
        return {"enabled": False, "error": alerts["_error"], "findings": []}
    counts, findings, tools = {}, [], set()
    for a in (alerts or []):
        sev = (a.get("rule", {}).get("security_severity_level") or
               a.get("rule", {}).get("severity") or "UNKNOWN").upper()
        counts[sev] = counts.get(sev, 0) + 1
        tool = a.get("tool", {}).get("name", "unknown")
        tools.add(tool)
        findings.append({
            "rule": a.get("rule", {}).get("id", ""),
            "description": a.get("rule", {}).get("description", ""),
            "severity": sev, "tool": tool,
            "file": a.get("most_recent_instance", {}).get("location", {}).get("path", ""),
            "line": a.get("most_recent_instance", {}).get("location", {}).get("start_line", ""),
            "url": a.get("html_url", ""),
        })
    return {"enabled": True, "tools": list(tools), "findings": sev_sort(findings), "counts": counts, "total": len(findings)}

# ── Module 4: OSV.dev ────────────────────────────────────────────────────────

def scan_osv(owner: str, repo: str) -> dict:
    import base64
    findings, checked = [], 0

    pkg_json = gh_get(f"/repos/{owner}/{repo}/contents/package.json")
    if isinstance(pkg_json, dict) and "content" in pkg_json:
        try:
            content = json.loads(base64.b64decode(pkg_json["content"]).decode())
            deps = {**content.get("dependencies", {}), **content.get("devDependencies", {})}
            for name, ver_raw in list(deps.items())[:50]:
                ver = ver_raw.lstrip("^~>=< ").split(" ")[0]
                for v in osv_query(name, ver, "npm"):
                    checked += 1
                    sev = "UNKNOWN"
                    for s in v.get("severity", []):
                        if s.get("type") == "CVSS_V3":
                            score = float(s.get("score", "0"))
                            sev = "CRITICAL" if score >= 9 else "HIGH" if score >= 7 else "MEDIUM" if score >= 4 else "LOW"
                    findings.append({"id": v.get("id", ""), "package": name, "version": ver,
                                     "ecosystem": "npm", "severity": sev, "summary": v.get("summary", ""),
                                     "url": f"https://osv.dev/vulnerability/{v.get('id', '')}"})
        except Exception:
            pass

    req_txt = gh_get(f"/repos/{owner}/{repo}/contents/requirements.txt")
    if isinstance(req_txt, dict) and "content" in req_txt:
        try:
            lines = base64.b64decode(req_txt["content"]).decode().splitlines()
            for line in lines[:50]:
                line = line.strip()
                if not line or line.startswith("#"): continue
                parts = line.replace("==", "@").replace(">=", "@").split("@")
                name, ver = parts[0].strip(), (parts[1].strip() if len(parts) > 1 else "")
                if not ver: continue
                for v in osv_query(name, ver, "PyPI"):
                    checked += 1
                    findings.append({"id": v.get("id", ""), "package": name, "version": ver,
                                     "ecosystem": "PyPI", "severity": "UNKNOWN", "summary": v.get("summary", ""),
                                     "url": f"https://osv.dev/vulnerability/{v.get('id', '')}"})
        except Exception:
            pass

    counts = {}
    for f in findings:
        counts[f["severity"]] = counts.get(f["severity"], 0) + 1
    return {"packages_checked": checked, "findings": sev_sort(findings), "counts": counts, "total": len(findings)}

# ── Module 5: TruffleHog ─────────────────────────────────────────────────────

def scan_trufflehog(owner: str, repo: str) -> dict:
    if not tool_available("trufflehog"):
        return {"available": False, "message": "trufflehog not installed — pip install trufflehog3 or brew install trufflehog", "findings": []}
    code, out, _ = run_cmd(["trufflehog", "git", f"https://github.com/{owner}/{repo}.git", "--json", "--no-update"], timeout=180)
    findings = []
    for line in out.splitlines():
        try:
            item = json.loads(line)
            findings.append({
                "detector": item.get("DetectorName", ""),
                "verified": item.get("Verified", False),
                "file": item.get("SourceMetadata", {}).get("Data", {}).get("Git", {}).get("file", ""),
                "commit": item.get("SourceMetadata", {}).get("Data", {}).get("Git", {}).get("commit", "")[:8],
                "severity": "CRITICAL" if item.get("Verified") else "HIGH",
            })
        except Exception:
            pass
    return {"available": True, "findings": findings, "total": len(findings)}

# ── Module 6: Semgrep ────────────────────────────────────────────────────────

def scan_semgrep(owner: str, repo: str, clone_dir: str = None) -> dict:
    if not tool_available("semgrep"):
        return {"available": False, "message": "semgrep not installed — pip install semgrep", "findings": []}
    if not clone_dir:
        return {"available": True, "message": "No local clone dir — pass --clone-dir", "findings": []}
    code, out, _ = run_cmd(["semgrep", "--config=auto", "--json", "--quiet", "."], cwd=clone_dir, timeout=300)
    findings, counts = [], {}
    try:
        for r in json.loads(out).get("results", []):
            sev_map = {"ERROR": "HIGH", "WARNING": "MEDIUM", "INFO": "LOW"}
            sev = sev_map.get(r.get("extra", {}).get("severity", "WARNING").upper(), "MEDIUM")
            counts[sev] = counts.get(sev, 0) + 1
            findings.append({"rule": r.get("check_id", ""), "message": r.get("extra", {}).get("message", ""),
                             "severity": sev, "file": r.get("path", ""), "line": r.get("start", {}).get("line", "")})
    except Exception:
        pass
    return {"available": True, "findings": sev_sort(findings), "counts": counts, "total": len(findings)}

# ── Module 7: Nuclei ─────────────────────────────────────────────────────────

def scan_nuclei(target_url: str) -> dict:
    if not target_url:
        return {"available": False, "message": "No target URL provided", "findings": []}
    if not tool_available("nuclei"):
        return {"available": False, "message": "nuclei not installed — go install github.com/projectdiscovery/nuclei/v3/cmd/nuclei@latest", "findings": []}
    code, out, _ = run_cmd(["nuclei", "-u", target_url, "-severity", "critical,high,medium", "-json", "-silent"], timeout=300)
    findings, counts = [], {}
    for line in out.splitlines():
        try:
            item = json.loads(line)
            sev = item.get("info", {}).get("severity", "unknown").upper()
            counts[sev] = counts.get(sev, 0) + 1
            findings.append({"template": item.get("template-id", ""), "name": item.get("info", {}).get("name", ""),
                             "severity": sev, "url": item.get("matched-at", target_url),
                             "description": item.get("info", {}).get("description", "")})
        except Exception:
            pass
    return {"available": True, "target": target_url, "findings": sev_sort(findings), "counts": counts, "total": len(findings)}

# ── Module 8: Trivy ──────────────────────────────────────────────────────────

def scan_trivy(owner: str, repo: str) -> dict:
    if not tool_available("trivy"):
        return {"available": False, "message": "trivy not installed — brew install trivy / apt install trivy", "findings": []}
    code, out, _ = run_cmd(["trivy", "repo", "--format", "json", "--quiet", f"https://github.com/{owner}/{repo}"], timeout=300)
    findings, counts = [], {}
    try:
        for result in json.loads(out).get("Results", []):
            for vuln in result.get("Vulnerabilities", []):
                sev = vuln.get("Severity", "UNKNOWN").upper()
                counts[sev] = counts.get(sev, 0) + 1
                findings.append({"id": vuln.get("VulnerabilityID", ""), "package": vuln.get("PkgName", ""),
                                 "installed_version": vuln.get("InstalledVersion", ""), "fixed_version": vuln.get("FixedVersion", "N/A"),
                                 "severity": sev, "title": vuln.get("Title", ""), "url": vuln.get("PrimaryURL", ""),
                                 "target": result.get("Target", "")})
    except Exception:
        pass
    return {"available": True, "findings": sev_sort(findings), "counts": counts, "total": len(findings)}

# ── Module 9: License & Policy ───────────────────────────────────────────────

COPYLEFT   = {"AGPL-3.0", "GPL-2.0", "GPL-3.0", "LGPL-2.1", "LGPL-3.0", "EUPL-1.2", "SSPL-1.0"}
PERMISSIVE = {"MIT", "Apache-2.0", "BSD-2-Clause", "BSD-3-Clause", "ISC", "0BSD", "Unlicense"}

def scan_license(owner: str, repo: str) -> dict:
    data = gh_get(f"/repos/{owner}/{repo}/license")
    if isinstance(data, dict) and "_error" in data:
        return {"found": False, "spdx": None, "risk": "unknown"}
    spdx = (data.get("license") or {}).get("spdx_id", "NOASSERTION")
    risk = "low" if spdx in PERMISSIVE else "high" if spdx in COPYLEFT else "medium"
    return {"found": True, "spdx": spdx, "risk": risk, "url": data.get("html_url", "")}

# ── Score Calculator ─────────────────────────────────────────────────────────

def calculate_score(report: dict) -> dict:
    score, deductions = 100, []

    def deduct(pts, reason):
        nonlocal score
        score -= pts
        deductions.append({"points": pts, "reason": reason})

    for sev, pts in [("CRITICAL", 10), ("HIGH", 5), ("MEDIUM", 2), ("LOW", 1)]:
        n = report.get("dependabot", {}).get("counts", {}).get(sev, 0)
        if n: deduct(min(pts * n, pts * 3), f"{n} {sev} Dependabot alert(s)")

    sec_total = report.get("secrets_github", {}).get("total", 0)
    if sec_total: deduct(min(sec_total * 8, 25), f"{sec_total} exposed secret(s) in repo")

    verified = sum(1 for f in report.get("trufflehog", {}).get("findings", []) if f.get("verified"))
    if verified: deduct(min(verified * 10, 20), f"{verified} verified secret(s) in git history")

    for sev, pts in [("CRITICAL", 8), ("HIGH", 4), ("MEDIUM", 2)]:
        n = report.get("code_scanning", {}).get("counts", {}).get(sev, 0)
        if n: deduct(min(pts * n, pts * 3), f"{n} {sev} code scanning finding(s)")

    for module in ["osv", "trivy"]:
        for sev, pts in [("CRITICAL", 6), ("HIGH", 3), ("MEDIUM", 1)]:
            n = report.get(module, {}).get("counts", {}).get(sev, 0)
            if n: deduct(min(pts * n, pts * 4), f"{n} {sev} {module.upper()} finding(s)")

    for sev, pts in [("CRITICAL", 10), ("HIGH", 5), ("MEDIUM", 2)]:
        n = report.get("nuclei", {}).get("counts", {}).get(sev, 0)
        if n: deduct(min(pts * n, pts * 3), f"{n} {sev} Nuclei live finding(s)")

    for sev, pts in [("HIGH", 4), ("MEDIUM", 2), ("LOW", 1)]:
        n = report.get("semgrep", {}).get("counts", {}).get(sev, 0)
        if n: deduct(min(pts * n, pts * 4), f"{n} {sev} Semgrep SAST finding(s)")

    if report.get("license", {}).get("risk") == "high":
        deduct(5, f"Copyleft license: {report['license'].get('spdx')}")
    if not report.get("has_security_md"):
        deduct(3, "Missing SECURITY.md")

    score = max(0, score)
    grade = "A" if score >= 90 else "B" if score >= 75 else "C" if score >= 60 else "D" if score >= 40 else "F"
    return {"score": score, "grade": grade, "deductions": deductions, "max_score": 100}

def aggregate_counts(report: dict) -> dict:
    agg = {"CRITICAL": 0, "HIGH": 0, "MEDIUM": 0, "LOW": 0}
    for mod in ["dependabot", "code_scanning", "osv", "trivy", "nuclei", "semgrep"]:
        for sev in agg:
            agg[sev] += report.get(mod, {}).get("counts", {}).get(sev, 0)
    agg["TOTAL"] = sum(agg.values())
    agg["SECRETS"] = (report.get("secrets_github", {}).get("total", 0) +
                      len(report.get("trufflehog", {}).get("findings", [])))
    return agg

# ── Main Entry ───────────────────────────────────────────────────────────────

def mega_scan(owner: str, repo: str, target_url: str = None, clone_dir: str = None, modules: list = None) -> dict:
    """
    Run the full DevLens Mega Security Scan.
    Returns a unified JSON report dict with scoring.
    """
    ALL = ["dependabot", "secrets", "code_scanning", "osv", "trufflehog", "semgrep", "nuclei", "trivy", "license"]
    active = set(modules or ALL)
    print(f"[DevLens MegaScan] Scanning {owner}/{repo} ({len(active)} modules) ...")

    report = {"meta": {"owner": owner, "repo": repo, "target_url": target_url,
                       "scanned_at": datetime.now(timezone.utc).isoformat(), "modules": list(active)}}

    steps = [
        ("dependabot",    "Dependabot alerts",         lambda: scan_dependabot(owner, repo)),
        ("secrets",       "Secret Scanning",            lambda: scan_secrets_github(owner, repo)),
        ("code_scanning", "Code Scanning (SAST)",       lambda: scan_code_scanning(owner, repo)),
        ("osv",           "OSV.dev dependency check",   lambda: scan_osv(owner, repo)),
        ("trufflehog",    "TruffleHog git history",     lambda: scan_trufflehog(owner, repo)),
        ("semgrep",       "Semgrep SAST",               lambda: scan_semgrep(owner, repo, clone_dir)),
        ("nuclei",        "Nuclei DAST",                lambda: scan_nuclei(target_url)),
        ("trivy",         "Trivy repo scan",            lambda: scan_trivy(owner, repo)),
        ("license",       "License & policy",           lambda: scan_license(owner, repo)),
    ]

    for i, (key, label, fn) in enumerate(steps, 1):
        if key in active:
            print(f"  [{i}/9] {label} ...")
            report[key] = fn()

    sm = gh_get(f"/repos/{owner}/{repo}/contents/SECURITY.md")
    report["has_security_md"] = isinstance(sm, dict) and "content" in sm
    report["totals"]  = aggregate_counts(report)
    report["scoring"] = calculate_score(report)

    sc = report["scoring"]
    print(f"\n[DevLens MegaScan] Complete — Score: {sc['score']}/100  Grade: {sc['grade']}")
    print(f"  Findings: {report['totals']['TOTAL']}  |  Secrets: {report['totals']['SECRETS']}")
    return report

# ── CLI ──────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    import argparse
    p = argparse.ArgumentParser(description="DevLens Mega Security Scanner")
    p.add_argument("repo", help="owner/repo")
    p.add_argument("--url",       default=None, help="Live URL for Nuclei DAST")
    p.add_argument("--clone-dir", default=None, help="Local clone path for Semgrep")
    p.add_argument("--modules",   nargs="+", choices=["dependabot","secrets","code_scanning","osv",
                                                       "trufflehog","semgrep","nuclei","trivy","license"])
    p.add_argument("--output",    default=None, help="Save JSON report to file")
    args = p.parse_args()

    parts = args.repo.split("/")
    if len(parts) != 2:
        print("Error: use owner/repo format"); sys.exit(1)

    result = mega_scan(parts[0], parts[1], target_url=args.url, clone_dir=args.clone_dir, modules=args.modules)

    if args.output:
        with open(args.output, "w") as f:
            json.dump(result, f, indent=2)
        print(f"Report saved → {args.output}")
    else:
        print(json.dumps(result, indent=2))
