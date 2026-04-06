# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability in this repository (e.g., in build scripts, CI workflows, or site deployment), please report it responsibly.

**Do not open a public issue.**

Email **security@all-ai-network.org** with:
- A description of the vulnerability
- Steps to reproduce
- Potential impact

We will acknowledge receipt within 48 hours and provide an estimated timeline for a fix.

## Scope

This is a content repository. The primary security concerns are:
- **Build script integrity** — scripts that generate `manifest.json` and `tree.json`
- **CI/CD pipeline security** — GitHub Actions workflows that deploy to GitHub Pages
- **Content injection** — malicious content that could be rendered as executable code on hub websites

For vulnerabilities related to the hub website template, please report to the respective repository:
- Hub template: [ALL-Applied-AI-Network/aain-hub-template](https://github.com/ALL-Applied-AI-Network/aain-hub-template/security)

## Supported Versions

Only the latest version deployed to GitHub Pages is actively maintained.
