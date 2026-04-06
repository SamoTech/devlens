# Security Policy

## Supported Versions

We actively support the latest release of DevLens with security updates.

| Version | Supported          |
| ------- | ------------------ |
| 1.x     | ✅ Yes             |
| < 1.0   | ❌ No              |

## Reporting a Vulnerability

If you discover a security vulnerability in DevLens, please **do not** open a public GitHub issue.

Instead, report it privately via one of these channels:

- **Email:** samo.hossam@gmail.com
- **GitHub Private Advisory:** [Security Advisories](https://github.com/SamoTech/devlens/security/advisories/new)

### What to include

Please include as much of the following as possible:

- Type of issue (e.g., token exposure, injection, privilege escalation)
- Full paths of affected source files
- Location of the affected source code (tag/branch/commit or direct URL)
- Step-by-step instructions to reproduce the issue
- Proof-of-concept or exploit code (if possible)
- Impact of the issue, including how an attacker might exploit it

### Response timeline

- **Acknowledgement:** Within 48 hours
- **Initial assessment:** Within 5 business days
- **Fix or mitigation:** Within 30 days for critical issues

We follow [responsible disclosure](https://en.wikipedia.org/wiki/Responsible_disclosure) and will credit reporters in the release notes unless you prefer anonymity.

## Security Best Practices for DevLens Users

- Store `GROQ_API_KEY` and `DISCORD_WEBHOOK` as **GitHub Secrets**, never hardcoded
- The `GITHUB_TOKEN` used by DevLens only requires `contents: write` — never grant more permissions than needed
- Review workflow files before running in your repo
