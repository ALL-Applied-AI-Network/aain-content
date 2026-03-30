# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability in this repository (e.g., in build scripts, CI workflows, or CDN deployment), please report it responsibly.

**Do not open a public issue.**

Email **security@all-aain.org** with:
- A description of the vulnerability
- Steps to reproduce
- Potential impact

We will acknowledge receipt within 48 hours and provide an estimated timeline for a fix.

## Scope

This is a content repository. The primary security concerns are:
- **Build script integrity** — scripts that generate `manifest.json` and `tree.json`
- **CI/CD pipeline security** — GitHub Actions workflows that deploy to the CDN
- **Content injection** — malicious content that could be rendered as executable code on hub websites

For vulnerabilities related to the hub website template or the platform API, please report to the respective repositories:
- Hub template: [all-aain/hub](https://github.com/all-aain/hub/security)
- Platform: email security@all-aain.org directly

## Supported Versions

Only the latest version deployed to `cdn.all-aain.org` is actively maintained.
