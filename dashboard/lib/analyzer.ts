import type { AnalysisResult, DimensionScore } from './types';

const GH = 'https://api.github.com';
const token = process.env.GITHUB_TOKEN;
const headers: Record<string, string> = {
  Accept: 'application/vnd.github+json',
  'X-GitHub-Api-Version': '2022-11-28',
  ...(token ? { Authorization: `Bearer ${token}` } : {})
};

async function gh<T>(path: string): Promise<T> {
  const res = await fetch(`${GH}${path}`, { headers, next: { revalidate: 300 } });
  if (!res.ok) throw new Error(`GitHub API ${res.status}: ${res.statusText} (${path})`);
  return res.json() as Promise<T>;
}

export async function analyzeRepo(repo: string): Promise<AnalysisResult> {
  const [repoData, commits, issues, workflows, contents] = await Promise.allSettled([
    gh<RepoData>(`/repos/${repo}`),
    gh<CommitData[]>(`/repos/${repo}/commits?per_page=100&since=${since90()}`),
    gh<IssueData[]>(`/repos/${repo}/issues?state=all&per_page=100`),
    gh<WorkflowsData>(`/repos/${repo}/actions/workflows`),
    gh<ContentItem[]>(`/repos/${repo}/contents`)
  ]);

  const r = repoData.status === 'fulfilled' ? repoData.value : null;
  if (!r) throw new Error('Repository not found or not accessible');

  const commitList = commits.status === 'fulfilled' ? commits.value : [];
  const issueList = issues.status === 'fulfilled' ? issues.value : [];
  const wfData = workflows.status === 'fulfilled' ? workflows.value : { total_count: 0, workflows: [] };
  const rootFiles = contents.status === 'fulfilled' ? contents.value.map(f => f.name.toLowerCase()) : [];

  // README
  const readmeDim = await scoreReadme(repo, rootFiles);

  // Commit Activity
  const commitScore = Math.min(100, Math.round((commitList.length / 30) * 100));

  // Freshness
  const daysSince = (Date.now() - new Date(r.pushed_at).getTime()) / 86400000;
  const freshScore = daysSince < 7 ? 100 : daysSince < 30 ? 85 : daysSince < 90 ? 65 : daysSince < 180 ? 40 : 15;

  // Docs
  const docFiles = ['license', 'contributing.md', 'changelog.md', 'code_of_conduct.md', 'security.md', 'docs'];
  const docFound = docFiles.filter(d => rootFiles.some(f => f === d || f.startsWith(d)));
  const docsScore = Math.round((docFound.length / docFiles.length) * 100);

  // CI
  const ciScore = wfData.total_count > 0 ? Math.min(100, 60 + wfData.total_count * 10) : 0;

  // Issue Response
  const closed = issueList.filter(i => i.state === 'closed').length;
  const issueScore = issueList.length === 0 ? 100 : Math.round((closed / issueList.length) * 100);

  // Community
  const stars = r.stargazers_count;
  const communityScore = stars === 0 ? 0 : stars < 10 ? 15 : stars < 50 ? 30 : stars < 200 ? 55 : stars < 1000 ? 75 : 100;

  const dimensions: DimensionScore[] = [
    { key: 'readme',    label: 'README Quality',   emoji: '📝', score: readmeDim,    weight: 20, detail: 'Length, sections, badges, code blocks' },
    { key: 'activity',  label: 'Commit Activity',  emoji: '🔥', score: commitScore,  weight: 20, detail: `${commitList.length} commits in last 90 days` },
    { key: 'freshness', label: 'Repo Freshness',   emoji: '🌿', score: freshScore,   weight: 15, detail: `Last push ${Math.round(daysSince)} days ago` },
    { key: 'docs',      label: 'Documentation',    emoji: '📚', score: docsScore,    weight: 15, detail: `${docFound.length}/${docFiles.length} doc files found` },
    { key: 'ci',        label: 'CI/CD Setup',      emoji: '⚙️',  score: ciScore,      weight: 15, detail: `${wfData.total_count} workflow(s) detected` },
    { key: 'issues',    label: 'Issue Response',   emoji: '🎯', score: issueScore,   weight: 10, detail: `${closed}/${issueList.length} issues closed` },
    { key: 'community', label: 'Community Signal', emoji: '⭐', score: communityScore, weight: 5, detail: `${stars} stars` }
  ];

  const score = Math.round(dimensions.reduce((acc, d) => acc + d.score * (d.weight / 100), 0));
  const grade = score >= 90 ? 'Excellent' : score >= 75 ? 'Good' : score >= 50 ? 'Fair' : 'Needs Work';

  return {
    repo,
    score,
    grade,
    dimensions,
    meta: {
      stars: r.stargazers_count,
      forks: r.forks_count,
      language: r.language,
      description: r.description,
      owner: r.owner.login,
      avatar: r.owner.avatar_url,
      updatedAt: r.pushed_at,
      analyzedAt: new Date().toISOString()
    }
  };
}

async function scoreReadme(repo: string, rootFiles: string[]): Promise<number> {
  const hasReadme = rootFiles.some(f => f.startsWith('readme'));
  if (!hasReadme) return 0;
  try {
    const data = await gh<{ content: string }>(`/repos/${repo}/readme`);
    const text = atob(data.content.replace(/\n/g, ''));
    let score = 20;
    if (text.length > 500)  score += 15;
    if (text.length > 2000) score += 10;
    if (text.length > 5000) score += 5;
    if (/##\s/.test(text))         score += 10;
    if (/```/.test(text))          score += 10;
    if (/!\[.*\]\(.*badge/.test(text)) score += 8;
    if (/setup|install|quick start/i.test(text)) score += 8;
    if (/example/i.test(text))     score += 6;
    if (/- \[/.test(text))         score += 4;
    if (/<!-- devlens/i.test(text)) score += 4;
    return Math.min(100, score);
  } catch { return 20; }
}

function since90() {
  const d = new Date();
  d.setDate(d.getDate() - 90);
  return d.toISOString();
}

// Minimal GitHub API types
interface RepoData {
  stargazers_count: number; forks_count: number; language: string | null;
  description: string | null; pushed_at: string;
  owner: { login: string; avatar_url: string };
}
interface CommitData { sha: string; }
interface IssueData { state: string; }
interface WorkflowsData { total_count: number; workflows: unknown[]; }
interface ContentItem { name: string; }
