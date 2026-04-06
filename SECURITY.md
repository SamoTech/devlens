# Security Policy

## Supported Versions

We actively support the latest release of DevLens with security updates.

| Version | Supported |
|---------|----------|
| 0.4.x (latest) | ✅ Yes |
| 0.3.x | ✅ Yes (critical fixes only) |
| < 0.3.0 | ❌ No |

## Reporting a Vulnerability

If you discover a security vulnerability in DevLens, please **do not** open a public GitHub issue.

Instead, report it privately via one of these channels:

- **GitHub Private Advisory:** [Security Advisories](https://github.com/SamoTech/devlens/security/advisories/new) *(preferred)*
- **Email:** samo.hossam@gmail.com

### What to include

Please include as much of the following as possible:

- Type of issue (e.g., token exposure, injection, privilege escalation, data leak)
- Full paths of affected source files
- Location of the affected source code (tag / branch / commit or direct URL)
- Step-by-step instructions to reproduce the issue
- Proof-of-concept or exploit code (if possible)
- Impact of the issue, including how an attacker might exploit it

### Response timeline

- **Acknowledgement:** Within 48 hours
- **Initial assessment:** Within 5 business days
- **Fix or mitigation:** Within 30 days for critical issues

We follow [responsible disclosure](https://en.wikipedia.org/wiki/Responsible_disclosure) and will credit reporters in the release notes unless you prefer anonymity.

---

## Security Architecture

DevLens is a stateless Next.js dashboard deployed on Vercel with an Upstash Redis backend.

**What DevLens stores (Upstash Redis):**
- Public repo slugs, health scores, description, language — for watchlist/leaderboard/stats
- Historical score snapshots per repo (capped at 12)
- Hashed visitor IPs for unique visitor count only
- 15-minute cached analysis results

**What DevLens does NOT store:**
- GitHub OAuth tokens (session-only, encrypted cookie, never written to Redis)
- Private repository data or contents
- Personal user data beyond hashed IPs
- API keys of any kind

---

## Security Best Practices for Self-Hosters

- Generate a strong `AUTH_SECRET`: `openssl rand -base64 32`
- Store `GITHUB_TOKEN` and `UPSTASH_REDIS_REST_TOKEN` as environment secrets — never hardcode them
- Set the GitHub OAuth callback URL to your exact domain (no wildcards)
- The dashboard only reads **public** GitHub API endpoints — never grant write scopes to the OAuth app
- Review `dashboard/app/api/` route handlers before deploying in a sensitive environment
- Keep Next.js updated — CVE-2025-66478 was patched in v15.3.6 (current)
