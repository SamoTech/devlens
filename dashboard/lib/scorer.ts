export interface DimScores {
  readme: number; activity: number; freshness: number;
  docs: number; ci: number; issues: number; community: number;
}
export interface RepoReport {
  repo: string; owner: string; name: string;
  description: string | null; stars: number; forks: number;
  language: string | null; avatar: string; url: string;
  health_score: number; scores: DimScores;
  badge_url: string; generated_at: string;
}
const WEIGHTS: DimScores = { readme:0.20,activity:0.20,freshness:0.15,docs:0.15,ci:0.15,issues:0.10,community:0.05 };
const GH = "https://api.github.com";
const headers = (token?: string) => ({ Accept: "application/vnd.github+json", ...(token ? { Authorization: `Bearer ${token}` } : {}) });
async function ghFetch(url: string, token?: string) {
  const r = await fetch(url, { headers: headers(token), next: { revalidate: 300 } });
  if (!r.ok) throw new Error(`GitHub API error ${r.status}: ${url}`);
  return r.json();
}
function badgeColor(s: number) {
  if (s >= 80) return "brightgreen"; if (s >= 60) return "green";
  if (s >= 40) return "yellow"; return "red";
}
async function scoreReadme(owner: string, name: string, token?: string): Promise<number> {
  try {
    const data = await ghFetch(`${GH}/repos/${owner}/${name}/readme`, token);
    const content = atob(data.content.replace(/\n/g, ""));
    const lower = content.toLowerCase();
    let s = 0;
    if (content.length > 500) s += 10; if (content.length > 1500) s += 5; if (content.length > 3000) s += 5;
    for (const kw of ["install","usage","license","contribut","feature","example"]) if (lower.includes(kw)) s += 6;
    if (content.includes("```")) s += 8; if (content.includes("![")) s += 6;
    if (content.includes("## ")) s += 4; if (content.includes("- [")) s += 4;
    if (lower.includes("<!-- devlens")) s += 6; if (lower.includes("setup")) s += 4;
    if (lower.includes("roadmap")) s += 4;
    if (lower.includes("sponsor")||lower.includes("support")) s += 4;
    if (lower.includes("discord")||lower.includes("slack")) s += 4;
    return Math.min(s, 100);
  } catch { return 0; }
}
async function scoreActivity(owner: string, name: string, token?: string): Promise<number> {
  try {
    const since = new Date(); since.setDate(since.getDate() - 90);
    const data = await ghFetch(`${GH}/repos/${owner}/${name}/commits?since=${since.toISOString()}&per_page=100`, token);
    const n = data.length;
    if (n >= 30) return 100; if (n >= 15) return 75; if (n >= 5) return 50; if (n >= 1) return 25; return 0;
  } catch { return 0; }
}
function scoreFreshness(pushedAt: string): number {
  const days = Math.floor((Date.now() - new Date(pushedAt).getTime()) / 86400000);
  if (days <= 7) return 100; if (days <= 30) return 80; if (days <= 90) return 55; if (days <= 180) return 30; return 10;
}
async function scoreDocs(owner: string, name: string, token?: string): Promise<number> {
  try {
    const tree = await ghFetch(`${GH}/repos/${owner}/${name}/git/trees/HEAD?recursive=1`, token);
    const paths: string[] = tree.tree.map((t: { path: string }) => t.path);
    const keyFiles = ["LICENSE","CONTRIBUTING.md","CHANGELOG.md","CODE_OF_CONDUCT.md","SECURITY.md","docs/"];
    let s = 0;
    for (const f of keyFiles) if (paths.some((p: string) => p.startsWith(f.replace(/\/$/,"")))) s += 16;
    return Math.min(s, 100);
  } catch { return 0; }
}
async function scoreCI(owner: string, name: string, token?: string): Promise<number> {
  try {
    const data = await ghFetch(`${GH}/repos/${owner}/${name}/actions/workflows`, token);
    const n = data.total_count ?? 0;
    if (n >= 3) return 100; if (n >= 1) return 60; return 0;
  } catch { return 0; }
}
async function scoreIssues(owner: string, name: string, openCount: number, token?: string): Promise<number> {
  try {
    const closed = await ghFetch(`${GH}/repos/${owner}/${name}/issues?state=closed&per_page=50`, token);
    const c = closed.length;
    if (!c && openCount === 0) return 100;
    const total = openCount + c;
    if (total === 0) return 100;
    return Math.round((c / total) * 100);
  } catch { return 50; }
}
function scoreCommunity(stars: number, forks: number): number {
  return Math.min(Math.floor(Math.log1p(stars)*15)+Math.floor(Math.log1p(forks)*10), 100);
}
export async function analyzeRepo(owner: string, name: string, token?: string): Promise<RepoReport> {
  const repoData = await ghFetch(`${GH}/repos/${owner}/${name}`, token);
  const [readme, activity, docs, ci, issues] = await Promise.all([
    scoreReadme(owner, name, token),
    scoreActivity(owner, name, token),
    scoreDocs(owner, name, token),
    scoreCI(owner, name, token),
    scoreIssues(owner, name, repoData.open_issues_count, token),
  ]);
  const scores: DimScores = {
    readme, activity, freshness: scoreFreshness(repoData.pushed_at),
    docs, ci, issues, community: scoreCommunity(repoData.stargazers_count, repoData.forks_count),
  };
  const health = Math.round((Object.keys(WEIGHTS) as (keyof DimScores)[]).reduce((sum, k) => sum + scores[k] * WEIGHTS[k], 0));
  const badge_url = `https://img.shields.io/badge/DevLens%20Health-${health}%2F100-${badgeColor(health)}?style=flat-square&logo=github`;
  return {
    repo: `${owner}/${name}`, owner, name,
    description: repoData.description, stars: repoData.stargazers_count, forks: repoData.forks_count,
    language: repoData.language, avatar: repoData.owner.avatar_url, url: repoData.html_url,
    health_score: health, scores, badge_url, generated_at: new Date().toISOString(),
  };
}