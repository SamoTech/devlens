# Security Policy

## Supported Versions

The latest DevLens release is supported with security fixes.

## Reporting a Vulnerability

Please report vulnerabilities privately through GitHub Security Advisories:

https://github.com/SamoTech/devlens/security/advisories/new

You may also contact the project maintainer at samo.hossam@gmail.com.

Include the affected file, reproduction steps, impact, and any proof of concept that helps reproduce the issue.

## Security Model

DevLens is a GitHub Action. It executes inside the user's GitHub Actions runner and uses the token supplied to the Action.

The Action does not require a DevLens-hosted database, Redis instance, Vercel project, or OAuth application.

Users should follow GitHub's least-privilege guidance for workflow permissions and review third-party Action permissions before enabling write access.
