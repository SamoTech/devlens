#!/usr/bin/env python3
"""DevLens - Core Analysis Engine"""
import os, json, re, math, requests
from datetime import datetime, timezone
from github import Github, Auth

GITHUB_TOKEN  = os.environ["GITHUB_TOKEN"]
GROQ_API_KEY  = os.environ.get("GROQ_API_KEY", "")
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
        s = 0
        if len(content) > 300:  s += 20
        if len(content) > 1000: s += 10
        for kw in ["install","usage","license","contribut","feature"]:
            if kw in content.lower(): s += 6
        if "```" in content: s += 8
        if "![" in content:  s += 6
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
    key_files = ["LICENSE","CONTRIBUTING.md","CHANGELOG.md","CODE_OF_CONDUCT.md","SECURITY.md","docs/"]
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

def ai_section():
    if not GROQ_API_KEY: return None
    resp = requests.post(
        "https://api.groq.com/openai/v1/chat/completions",
        headers={"Authorization":f"Bearer {GROQ_API_KEY}","Content-Type":"application/json"},
        json={"model":"llama3-8b-8192",
              "messages":[{"role":"user","content":
              f"Write a 3-line ## Repo Health README section. Include badge: ![DevLens Health]({badge_url}) and 1-sentence summary. Data: {json.dumps(report)}. Output ONLY markdown."}],
              "max_tokens":200})
    if resp.status_code == 200:
        return resp.json()["choices"][0]["message"]["content"].strip()
    return None

if UPDATE_README:
    try:
        rf = repo.get_readme()
        content = rf.decoded_content.decode()
        s_tag, e_tag = "<!-- DEVLENS:START -->", "<!-- DEVLENS:END -->"
        ai = ai_section()
        block = f"{s_tag}\n{ai}\n{e_tag}" if ai else (
            f"{s_tag}\n## Repo Health\n"
            f"![DevLens Health]({badge_url})\n"
            f"**Score: {health}/100** — [DevLens](https://github.com/SamoTech/devlens)\n{e_tag}")
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
        color = 0x2ecc71 if health>=60 else 0xe67e22 if health>=40 else 0xe74c3c
        requests.post(DISCORD_WH, json={"embeds":[{
            "title":f"DevLens Weekly Report — {REPO_NAME}","color":color,
            "fields":[{"name":k.capitalize(),"value":f"{v}/100","inline":True} for k,v in scores.items()],
            "footer":{"text":"Powered by DevLens · github.com/SamoTech/devlens"},
            "timestamp":now.isoformat()}]})
        print("Discord digest sent.")
    except Exception as e:
        print(f"Discord failed: {e}")
