#!/usr/bin/env python3
"""DevLens - Core Analysis Engine v1.1"""
import os, json, re, math, requests
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
    """Score README quality across 10 criteria (max 100)."""
    try:
        content = repo.get_readme().decoded_content.decode()
        lower   = content.lower()
        s = 0

        # Length tiers (0-20)
        if len(content) > 500:   s += 10
        if len(content) > 1500:  s += 5
        if len(content) > 3000:  s += 5

        # Essential sections (0-36) — 6 keywords × 6 pts each
        for kw in ["install", "usage", "license", "contribut", "feature", "example"]:
            if kw in lower: s += 6

        # Formatting quality (0-22)
        if "```"   in content: s += 8   # code blocks
        if "!["    in content: s += 6   # images/badges
        if "## "   in content: s += 4   # section headings
        if "- ["   in content or "- [x" in content: s += 4  # checklist/TOC

        # Supplementary signals (0-22)
        if "<!-- devlens" in lower:  s += 6   # DevLens integrated
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
        if not closed_i and open_i == 0: return 50
        total = open_i + len(closed_i)
        if total == 0: return 50
        return int(len(closed_i) / total * 100)
    except: return 50

def score_community():
    return min(int(math.log1p(repo.stargazers_count)*15)+int(math.log1p(repo.forks_count)*10), 100)

weights = {"readme":0.20,"activity":0.20,"freshness":0.15,"docs":0.15,"ci":0.15,"issues":0.10,"community":0.05}
scores  = {"readme":score_readme(),"activity":score_activity(),"freshness":score_freshness(),
           "docs":score_docs(),"ci":score_ci(),"issues":score_issues(),"community":score_community()}

health = int(sum(scores[k]*weights[k] for k in weights))

def badge_color(s):
    if s >= 80: return "brightgreen"
    if s >= 60: return "green"
    if s >= 40: return "yellow"
    return "red"

badge_url = (f"https://img.shields.io/badge/DevLens%20Health-{health}%2F100"
             f"-{badge_color(health)}?style={BADGE_STYLE}&logo=github")

report = {"repo":REPO_NAME,"health_score":health,"scores":scores,
          "badge_url":badge_url,"generated_at":now.isoformat()}

print(json.dumps(report, indent=2))

with open(os.environ.get("GITHUB_OUTPUT","/dev/null"),"a") as f:
    f.write(f"health_score={health}\n")
    f.write(f"badge_url={badge_url}\n")
    f.write(f"report_json={json.dumps(report)}\n")

def ai_section():
    if not GROQ_API_KEY: return None
    resp = requests.post(
        "https://api.groq.com/openai/v1/chat/completions",
        headers={"Authorization":f"Bearer {GROQ_API_KEY}","Content-Type":"application/json"},
        json={"model": GROQ_MODEL,
              "messages":[{"role":"user","content":
              f"Write a 3-line ## Repo Health README section. Include badge: ![DevLens Health]({badge_url}) and 1-sentence summary. Data: {json.dumps(report)}. Output ONLY markdown."}],
              "max_tokens":200})
    if resp.status_code == 200:
        return resp.json()["choices"][0]["message"]["content"].strip()
    print(f"Groq error ({resp.status_code}): {resp.text}")
    return None

if UPDATE_README:
    try:
        rf = repo.get_readme()
        content = rf.decoded_content.decode()
        s_tag, e_tag = "<!-- DEVLENS:START -->", "<!-- DEVLENS:END -->"
        ai = ai_section()
        scores_list = "\n".join(f"- **{k}**: {v}" for k, v in scores.items())
        block = f"{s_tag}\n{ai}\n{e_tag}" if ai else (
            f"{s_tag}\n## Repository Health\n"
            f"![DevLens Health]({badge_url})\n"
            f"This repository has a health score of {health}.\n\n"
            f"**Repo Status:** \n{scores_list}\n{e_tag}")
        if s_tag in content:
            new = re.sub(f"{re.escape(s_tag)}.*?{re.escape(e_tag)}",block,content,flags=re.DOTALL)
        else:
            new = content + "\n\n" + block + "\n"
        if new != content:
            repo.update_file(rf.path,f"docs: update DevLens health score {health}/100",new,rf.sha)
            print(f"README updated. Score: {health}/100")
    except Exception as e:
        print(f"README update skipped: {e}")

if DISCORD_WH:
    try:
        color = 0x2ecc71 if health>=80 else 0xe67e22 if health>=60 else 0xe74c3c
        requests.post(DISCORD_WH, json={"embeds":[{
            "title":f"DevLens Weekly Report — {REPO_NAME}",
            "description":f"Overall health: **{health}/100**",
            "color":color,
            "fields":[{"name":k.replace('_',' ').title(),"value":f"{v}/100","inline":True} for k,v in scores.items()],
            "footer":{"text":"Powered by DevLens · github.com/SamoTech/devlens"},
            "timestamp":now.isoformat()}]})
        print("Discord digest sent.")
    except Exception as e:
        print(f"Discord failed: {e}")
