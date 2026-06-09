# MAX · Design

This folder holds everything design-related for **MAX** — the spec, the clickable prototype, brand assets, and supporting materials.

> **MAX** — Security Assessment Platform
>
> _Where threats come into focus._

## Layout

```
design/
├── README.md               you are here — navigation
├── SPEC.md                 full developer specification (start here for implementation)
├── prototype/              clickable React/HTML prototype (load index.html)
├── standalone-prototype.html   single-file workspace (works offline, share-friendly)
├── sample-report.html      single-file sample PDF-style report (show to clients/stakeholders)
├── brand-pitch.html        10-slide brand identity pitch deck
├── brand/                  official brand assets — mark, lockups, wordmark
└── screenshots/            1440×900 reference screenshots of the main views
```

## Quick start

| If you want to… | Open… |
|---|---|
| Implement the workspace | `SPEC.md` — full spec with data models, design tokens, screen-by-screen detail |
| Click through the design | `prototype/index.html` (run from a local web server) — or `standalone-prototype.html` (no server, no internet) |
| Show a finished report | `sample-report.html` — full PDF-style deliverable, opens in any browser, print to PDF |
| Pitch the brand | `brand-pitch.html` |
| Use the logo | `brand/mark.svg` (vector) or `brand/mark-transparent.png` (raster) |

## What's in the prototype

Four screens (artboards in `prototype/index.html`):
1. **Workspace · Build mode** — agent stream, findings, CVSS scoring
2. **Workspace · Plan mode** — chat-only reasoning + Markdown report tab
3. **Engagement Setup Wizard** — 4-step engagement creation (scope, methodology, docs/contacts, agent/tools)
4. **Report deliverable** — full-page PDF-style report preview

## Methodology ↔ engagement-type alignment

Every engagement type maps to one official methodology:

| Engagement type | Methodology |
|---|---|
| Public Web Application | OWASP WSTG v4.2 |
| Internal Web Application | OWASP WSTG v4.2 |
| Cloud Web Application | OWASP WSTG v4.2 + CIS Benchmarks |
| Active Directory | MITRE ATT&CK (Enterprise) |
| Internal Network / Hosts | PTES |
| Asset Discovery & ID | NIST SP 800-115 |
| Incident Investigation | NIST SP 800-61r2 |
| Authenticated / SSO | OWASP ASVS + WSTG |

Report structure is consistent across all types (exec summary → findings summary → findings detail → methodology/scope), with engagement-type framing. Editable as Markdown/DOCX, delivered as PDF.

## Brand colors at a glance

| Token | Hex | Use |
|---|---|---|
| Brand Gradient | `#00D4CC → #0066FF` | Mark, hero, CTAs, focus rings |
| Night | `#0a0e14` | Primary surface |
| Ink | `#e5edf7` | Primary text |
| Coral | `#fb7185` | Threat / alert (rare, never decorative) |

Full palette in `SPEC.md § Design Tokens` and on slide 5 of `brand-pitch.html`.

## Status

This is a design reference — clickable, but not connected to a backend. Implementation kicks off following the phased plan in `SPEC.md § Implementation Plan`.
