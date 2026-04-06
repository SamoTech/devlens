#!/usr/bin/env python3
"""DevLens - Core Analysis Engine v1.3"""
import os, json, math, requests
from datetime import datetime, timezone
from github import Github, Auth

GITHUB_TOKEN  = os.environ["GITHUB_TOKEN"]
GROQ_API_KEY  = os.environ.get("GROQ_API_KEY", "")
GROQ_MODEL    = os.environ.get("GROQ_MODEL", "llama-3.1-8b-instant")
BADGE_STYLE   = os.environ.get("BADGE_STYLE", "flat")
UPDATE_README = os.environ.get("UPDATE_README", "true").lower() == "true"
DISCORD_WH    = os.environ.get("DISCORD_WEBHOOK", "")
REPO_NAME     = os.environ.get("REPO", "")

g    = Github(auth=Auth.Token(GITHUB_TOKEN))
repo = g.get_repo(REPO_NAME)
now  = datetime.now(timezone.utc)

def days_since(dt):
    if dt is None: return 9999
    if dt.tzinfo is None: dt = dt.replace(tzinfo=timezone.utc)
    return (now - dt).days

def score_readme():
    try:
        content = repo.get_readme().decoded_content.decode()
        lower   = content.lower()
        s = 0
        if len(content) > 500:   s += 10
        if len(content) > 1500:  s += 5
        if len(content) > 3000:  s += 5
        for kw in ["install", "usage", "license", "contribut", "feature", "example"]:
            if kw in lower: s += 6
        if "```"   in content: s += 8
        if "!["    in content: s += 6
        if "## "   in content: s += 4
        if "- ["   in content: s += 4
        if "<!-- devlens" in lower:  s += 6
        if "setup" in lower:         s += 4
        if "roadmap" in lower:       s += 4
        if "sponsor" in lower or "support" in lower: s += 4
        if "discord" in lower or "slack" in lower:   s += 4
        return min(s, 100)
    except: return 0

def score_activity():
    try:
        month = now.month - 3
        year  = now.year if month > 0 else now.year - 1
        month = month if month > 0 else month + 12
        since = datetime(year, month, now.day, tzinfo=timezone.utc)
        commits = list(repo.get_commits(since=since))
        n = len(commits)
        if n >= 30: return 100
        if n >= 15: return 75
        if n >= 5:  return 50
        if n >= 1:  return 25
        return 0
    except: return 0

def score_freshness():
    d = days_since(repo.pushed_at)
    if d <= 7:   return 100
    if d <= 30:  return 80
    if d <= 90:  return 55
    if d <= 180: return 30
    return 10

def score_docs():
    s = 0
    key_files = ["LICENSE", "CONTRIBUTING.md", "CHANGELOG.md", "CODE_OF_CONDUCT.md", "SECURITY.md", "docs/"]
    try:
        paths = [c.path for c in repo.get_git_tree("HEAD", recursive=True).tree]
        for f in key_files:
            if any(c.startswith(f.rstrip("/")) for c in paths): s += 16
        return min(s, 100)
    except: return 0

def score_ci():
    try:
        wf = list(repo.get_workflows())
        if len(wf) >= 3: return 100
        if len(wf) >= 1: return 60
        return 0
    except: return 0

def score_issues():
    try:
        open_i   = repo.open_issues_count
        closed_i = list(repo.get_issues(state="closed"))[:50]
        if not closed_i and open_i == 0: return 100
        total = open_i + len(closed_i)
        if total == 0: return 100
        return int(len(closed_i) / total * 100)
    except: return 50

def score_community():
    return min(int(math.log1p(repo.stargazers_count)*15)+int(math.log1p(repo.forks_count)*10), 100)

weights = {"readme":0.20,"activity":0.20,"freshness":0.15,"docs":0.15,"ci":0.15,"issues":0.10,"community":0.05}
scores  = {
    "readme":    score_readme(),
    "activity":  score_activity(),
    "freshness": score_freshness(),
    "docs":      score_docs(),
    "ci":        score_ci(),
    "issues":    score_issues(),
    "community": score_community(),
}
health = int(sum(scores[k]*weights[k] for k in weights))

def badge_color(s):
    if s >= 80: return "brightgreen"
    if s >= 60: return "green"
    if s >= 40: return "yellow"
    return "red"

def dim_bar(score):
    filled = round(score / 10)
    return "\u2588" * filled + "\u2591" * (10 - filled)

badge_url = (f"https://img.shields.io/badge/DevLens%20Health-{health}%2F100"
             f"-{badge_color(health)}?style={BADGE_STYLE}&logo=github")

report = {"repo":REPO_NAME,"health_score":health,"scores":scores,
          "badge_url":badge_url,"generated_at":now.isoformat()}

print(json.dumps(report, indent=2))

with open(os.environ.get("GITHUB_OUTPUT","/dev/null"),"a") as f:
    f.write(f"health_score={health}\n")
    f.write(f"badge_url={badge_url}\n")
    f.write(f"report_json={json.dumps(report)}\n")

DIM_META = [
    ("readme",    "\U0001f4dd", "README Quality",   "20%"),
    ("activity",  "\U0001f525", "Commit Activity",  "20%"),
    ("freshness", "\U0001f33f", "Repo Freshness",   "15%"),
    ("docs",      "\U0001f4da", "Documentation",    "15%"),
    ("ci",        "\u2699\ufe0f",  "CI/CD Setup",    "15%"),
    ("issues",    "\U0001f3af", "Issue Response",   "10%"),
    ("community", "\u2b50",     "Community Signal",  "5%"),
]

def build_table():
    """Build the full 7-row markdown table. Never truncated by AI."""
    header = (
        f"![DevLens Health]({badge_url}) "
        f"**Overall health: {health}/100** \u2014 "
        f"*Last updated: {now.strftime('%Y-%m-%d')}*\n\n"
        "| Dimension | Progress | Score | Weight |\n"
        "|---|---|---|---|\n"
    )
    rows = ""
    for key, emoji, label, weight in DIM_META:
        s     = scores[key]
        bar   = dim_bar(s)
        color = badge_color(s)
        score_badge = f"https://img.shields.io/badge/{s}-{color}?style=flat-square"
        rows += f"| {emoji} **{label}** | `{bar}` | ![{s}]({score_badge}) | {weight} |\n"
    return header + rows.rstrip()

def get_ai_insight():
    """Ask Groq for ONE sentence of insight. Returns empty string on any failure."""
    if not GROQ_API_KEY:
        return ""
    prompt = (
        f"The DevLens repo health score is {health}/100. "
        f"Scores: {json.dumps(scores)}. "
        "Write exactly ONE short sentence of actionable insight (no markdown, no heading). "
        "Output ONLY that sentence."
    )
    try:
        resp = requests.post(
            "https://api.groq.com/openai/v1/chat/completions",
            headers={"Authorization": f"Bearer {GROQ_API_KEY}", "Content-Type": "application/json"},
            json={"model": GROQ_MODEL, "messages": [{"role": "user", "content": prompt}], "max_tokens": 80},
            timeout=15,
        )
        if resp.status_code == 200:
            sentence = resp.json()["choices"][0]["message"]["content"].strip()
            # Safety: reject anything that contains markdown table syntax
            if "|" in sentence or "```" in sentence or "#" in sentence:
                return ""
            return sentence
    except Exception as e:
        print(f"Groq insight skipped: {e}")
    return ""

if UPDATE_README:
    try:
        rf      = repo.get_readme()
        content = rf.decoded_content.decode()
        S_TAG   = "<!-- DEVLENS:START -->"
        E_TAG   = "<!-- DEVLENS:END -->"

        # Build table first — guaranteed complete
        table   = build_table()
        insight = get_ai_insight()
        body    = table + ("\n\n" + insight if insight else "")
        block   = f"{S_TAG}\n{body}\n{E_TAG}"

        if S_TAG in content and E_TAG in content:
            before = content.split(S_TAG)[0]
            after  = content.split(E_TAG)[1]
            new    = before + block + after
        else:
            new = content + "\n\n" + block + "\n"

        if new != content:
            repo.update_file(
                rf.path,
                f"docs: update DevLens health score {health}/100",
                new, rf.sha
            )
            print(f"README updated. Score: {health}/100")
        else:
            print("README unchanged.")
    except Exception as e:
        print(f"README update failed: {e}")

if DISCORD_WH:
    try:
        color = 0x2ecc71 if health>=80 else 0xe67e22 if health>=60 else 0xe74c3c
        requests.post(DISCORD_WH, json={"embeds":[{
            "title": f"DevLens Weekly Report \u2014 {REPO_NAME}",
            "description": f"Overall health: **{health}/100**",
            "color": color,
            "fields": [{"name": k.replace('_',' ').title(), "value": f"{v}/100", "inline": True} for k,v in scores.items()],
            "footer": {"text": "Powered by DevLens \u00b7 github.com/SamoTech/devlens"},
            "timestamp": now.isoformat()
        }]})
        print("Discord digest sent.")
    except Exception as e:
        print(f"Discord failed: {e}")
