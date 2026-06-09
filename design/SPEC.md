# MAX — Security Assessment Platform

## Overview

MAX is a security assessment platform where a human operator plans, executes, and reports on authorized penetration tests. The platform orchestrates Kali-based engine containers to run methodology-driven assessments, captures findings with CVSS 3.1 scoring, and generates Markdown reports.

This handoff package contains a **high-fidelity HTML/React prototype** of the entire workspace, plus this specification document. The prototype is a clickable design reference. **The task is to reimplement it as a real desktop application that calls real Kali tools and real LLMs.**

## About the Design Files

The files in `design_reference/` are **design references created in HTML** — clickable React prototypes showing intended look, behavior, and information architecture. They are NOT production code to copy.

The goal is to **recreate these designs in a real desktop application stack**: a Tauri or Electron shell, a React frontend (the JSX in `design_reference/` can be lifted as a starting point), and a Python or Go backend that actually runs Kali tools and talks to LLMs.

## Fidelity

**High-fidelity (hifi).** All colors, spacing, typography, and component states in the design files are intentional and should be reproduced pixel-faithfully in the target React app. Hex values, font stacks, and CVSS scoring formulas are documented in the Design Tokens section below.

---

## Recommended Technology Stack

| Layer | Recommendation | Why |
|---|---|---|
| **Shell** | Tauri 2.x (Rust) | Small binary (~12 MB), packages to `.deb` for Kali, can spawn subprocesses safely |
| **Frontend** | React 18 + TypeScript | Direct port from the prototype JSX; mature ecosystem |
| **Styling** | Tailwind or vanilla CSS modules | The prototype uses inline styles — convert to CSS modules or Tailwind |
| **State** | Zustand or Jotai | Lightweight, no boilerplate |
| **Backend** | Python 3.12 + FastAPI | Best LLM SDK story; easy subprocess + asyncio |
| **DB** | SQLite per engagement | Portable, no server, durable |
| **LLM** | Anthropic SDK + Ollama client | Multi-provider routing |
| **IPC** | Tauri commands (Rust ↔ frontend) wrapping local FastAPI | Clean separation |

Alternative if Rust is unfamiliar: **Electron + Node backend**. Heavier (~150 MB) but everyone knows it.

---

## Product Architecture

```
┌───────────────────────────────────────────────────────────────┐
│                         Tauri Window                          │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │                    React Frontend                       │  │
│  │  (Top bar · Sidebar · Center pane · Right pane)         │  │
│  └────────────────────┬────────────────────────────────────┘  │
│                       │ HTTP / WS                             │
│  ┌────────────────────▼────────────────────────────────────┐  │
│  │              FastAPI Backend (localhost)                │  │
│  │                                                         │  │
│  │  ┌─────────────┐  ┌──────────────┐  ┌────────────────┐  │  │
│  │  │ Engagement  │  │ Agent Loop   │  │  Tool Runner   │  │  │
│  │  │   Store     │  │ (LLM router) │  │  (subprocess)  │  │  │
│  │  │  (SQLite)   │  │              │  │                │  │  │
│  │  └─────────────┘  └──────┬───────┘  └────────────────┘  │  │
│  │                          │                              │  │
│  │                  ┌───────▼────────┐                     │  │
│  │                  │ Approval Queue │                     │  │
│  │                  │   (SQLite)     │                     │  │
│  │                  └────────────────┘                     │  │
│  └────────────┬───────────────────────────────────┬────────┘  │
└───────────────┼───────────────────────────────────┼───────────┘
                │                                   │
        ┌───────▼──────┐                  ┌─────────▼──────────┐
        │  Local LLM   │                  │  Anthropic / OAI   │
        │   (Ollama)   │                  │      (Cloud)       │
        └──────────────┘                  └────────────────────┘
                │
                │  spawns
                ▼
        ┌──────────────────────────────────────────┐
        │   Kali Tools                             │
        │   nmap · nikto · sqlmap · ffuf · ...     │
        └──────────────────────────────────────────┘
```

---

## Screens / Views

The prototype has 3 primary artboards. Each is documented below.

### 1. Workspace (Build mode)

**Purpose**: The day-to-day work surface. The operator watches the agent's stream, approves risky tool calls, browses findings, and scores CVSS.

**Layout**: Three vertical panes inside a top-bar / status-bar shell. From left to right:
- **Sidebar** (250 px) — engagement health, active methodology step, nav, severity breakdown
- **Center pane** (flex) — tabbed: Agent stream / Playbook / Timeline / Transcript; composer at bottom
- **Right pane** (410 px) — tabbed: Findings / Report / Loot

#### Top Bar (height 50 px)

| Element | Spec |
|---|---|
| Brand mark | 26 px SVG chevron (`brand/mark.svg`), cyan→blue gradient `#00D4CC → #0066FF` |
| Brand text | "MAX" — 13 px, weight 700, letter-spacing 3, color `#e5edf7` |
| Version | "v0.9.2-rc" — 9 px, color `#5a6479` |
| Engagement pill | "ENG · Northwind Commerce · NW-WEB-2026-03" — clickable to switch engagements |
| Methodology pill | "METHOD · OWASP Web Security Testing Guide · WSTG v4.2 · External Web" — accent-colored primary |
| Plan/Build toggle | Segmented control (32 px tall, 3 px inner padding); Plan = blue `#7ab6e0`, Build = accent |
| Search | 220 px input with `⌘K` hint |
| LLM router chip | "sonnet-4.5 ↔ qwen-32b" — colored dot + glow |
| Autonomy pill | Color-coded by mode: Passive `#94a3b8`, Review = accent, Autopilot `#fb7185` |
| Avatar | 30 px circle, initials, gradient `#34d399 → #06b6d4` |

#### Sidebar (width 250 px, padding 12px 10px, gap 12 px)

1. **Engagement card** (background `#101620`, border `#1c2330`, radius 8 px):
   - Header: "ENGAGEMENT" + animated active dot
   - Started timestamp, last activity
   - Coverage % bar (accent fill)
   - Report ready % bar (`#34d399` fill)
2. **Active step card** (`{accent}0d` bg, `{accent}44` border):
   - "ACTIVE STEP" header
   - Name: "Authentication Testing"
   - Subtitle: "WSTG-ATHN · Web Security Testing Guide"
   - 12-segment progress bar (one per WSTG category, colored by status)
3. **Nav** — 9 items: Overview, Scope · RoE, Hosts, Findings, Methodology, Agent log, Pivots, Loot, Report. Active item has 2 px accent left border + `#131e2c` bg.
4. **Severity breakdown** — 4 rows (high/med/low/info) with colored dot + count + mini bar.

#### Center Pane — Agent Stream Tab

Tab strip (height 36 px) with 4 tabs: **Agent stream** (active) · **Playbook** [badge: 12] · **Timeline** · **Transcript**. Tab key in composer cycles between them.

Stream rows (gap 10 px between entries):

| Kind | Label | Color | Render |
|---|---|---|---|
| `plan` | PLAN | `#7ab6e0` | Plain text, color `#cdd6e2` |
| `tool` | TOOL | accent | Mono code block on `#0a0e14` bg, `#1c2330` border, with `$ ` prefix and runtime cost on the right |
| `obs` | RESULT | `#4ade80` | Pale green text in subtle green bg block (`#0d1a14` bg, `#1f4d33` border) |
| `think` | THINK | `#a59c8e` | Italic gray text |
| `approve` | APPROVE | `#fbbf24` | Yellow alert card with Approve/Dry-run/Edit/Reject buttons |
| `human` | HUMAN | `#e879f9` | Pink-bordered card with operator avatar |
| `pivot` | PIVOT | `#fb7185` | Full-width gradient card; see Pivot Cards below |

Each row: 56 px timestamp column (mono, `#5a6479`) + 64 px label column + flex body.

#### Composer

Located at bottom of center pane. Single text input with autocomplete:
- Type `/` → dropdown of slash commands
- Type `@` → dropdown of discovered hosts
- Tab → cycle center-pane tabs (or accept suggestion if open)
- Arrow keys / Enter / Esc → navigate suggestions

Slash commands: `/run` `/finding` `/method` `/cvss` `/report` `/pivot` `/hosts` `/scope`.

#### Right Pane — Findings Tab

- Severity counters (4 cards, one per sev) at top
- Filter chips row: All / Open / `shop.northwind.io` / `api.northwind.io` / `auth.northwind.io` + CSV export button + "↓ sev" sort indicator
- Findings list — each row has:
  - Colored severity pill (36 px wide, uppercase, `{SEV[sev]}25` bg)
  - Finding ID in mono, then title
  - Status row: glowing colored dot + status label + host
- Selected finding detail (lower half) — see Finding Detail Component below

#### Right Pane — Report Tab

- Layout selector dropdown — 7 templates (External Web App, Internal Web App, External Network, Internal Network, SSO / Federation, Adversary Simulation, Compliance Sweep)
- View toggle: Markdown source / Rendered
- Markdown source is syntax-highlighted (headings in accent, `**bold**` in `#e5edf7`, inline `code` in accent on tinted bg)
- Export bar at bottom: MD (primary) / PDF / DOCX / JSON

#### Status Bar (height 24 px)

`● connected` · mode (PLAN/BUILD) · coverage % · hosts (in/total) · findings count · `pivots 3` · `NORMAL`. Mono 10 px text, color `#5a6479`.

---

### 2. Engagement Setup Wizard

**Purpose**: Create a new engagement. 4-step flow.

**Layout**: Top chrome (height 50 px) · left rail step indicator (280 px) · main step content (flex) · footer with Back/Continue (height 60 px).

#### Step 1 — Engagement & Scope

- System / Engagement name (text)
- Project code (mono, auto-suggested)
- Engagement type (select): External Web Application / Internal Web Application / Internal Network / External Network / Cloud (AWS/GCP/Azure) / SSO Federation / Adversary Simulation
- Start date, End date
- Description (textarea, 3 rows)
- **Scope** — two chip inputs: In-scope hosts (accent), Out-of-scope (`#fb7185` danger)
- **Rules of Engagement** — 7 toggles in a 2-col grid:
  1. No exploitation past minimal PoC (default on)
  2. No DoS or volumetric scans (default on)
  3. No social engineering (default on)
  4. No data exfiltration beyond proof (default on)
  5. Notify SOC before active scans (default on)
  6. Test only after business hours 17:00–09:00 UTC (default off)
  7. Screen-record all interactive sessions (default off)

#### Step 2 — Methodology

- Grid of 8 playbook cards (2 columns):
  - OWASP WSTG v4.2 — External Web (default)
  - OWASP WSTG v4.2 — Authenticated Web
  - PTES — Internal Network
  - PTES — External Network
  - NIST SP 800-115 — Compliance Sweep
  - MITRE ATT&CK — Adversary Simulation
  - ISACA SSO / Federation — Identity Audit
  - **Custom playbook**
- Right-side preview pane shows step checklist for selected playbook

#### Step 3 — Documents & Contacts

- Reference documents: 3-col grid of file cards + drop zone (PDF / DOCX / MD / XLSX). Files become RAG context for the agent.
- Tag chips for doc kinds: TSD / Arch diagram / Past report / Data classification / Auth credentials
- Contacts table: Name / Role / Email / Primary / On-call

#### Step 4 — Agent & Tools

- Primary model select (Claude/GPT/Gemini/local options)
- Local fallback select (Ollama models)
- Routing policy radio: **Combo** (cloud reasoning + local tool I/O) / Cloud-only / Air-gapped
- Default autonomy radio: Passive / Review / Autopilot
- **Enabled tools** — Kali tool inventory grouped by Kali category. Each tool is a toggle card showing name/version/description. "Enable all" + "Reset to defaults" buttons. Internal-network tools default off for external engagements.

Tool categories (Kali's native taxonomy):
- Information Gathering — nmap, masscan, amass, sublist3r, dnsrecon, whatweb, httpx, theHarvester
- Vulnerability Analysis — nikto, nuclei, testssl.sh, sslyze
- Web Application Analysis — ffuf, gobuster, dirb, wpscan, sqlmap, burpsuite
- Password Attacks — hydra, medusa, john, hashcat
- Exploitation Tools — metasploit, searchsploit
- Sniffing & Spoofing — mitmproxy
- Post Exploitation — responder, bloodhound, impacket, netexec
- Scripting & Shells — bash, python3, pwsh (PowerShell), curl
- Reporting Tools — pandoc, gowitness

---

### 3. Workspace (Plan mode)

Same chrome as Build mode but:
- Plan/Build toggle thumb on Plan side, blue accent
- Autonomy pill is dimmed to 35% opacity (autonomy is N/A in Plan)
- Center pane mode banner reads "PLAN · no execution" (blue)
- Composer border is blue
- Quick actions become reasoning prompts (Explain X / Hypothesize next pivot / Coverage gaps? / etc.) — clicking them appends a HUMAN question + THINK response, no tool execution

The mode toggle is **orthogonal to autonomy**. Plan mode is always read-only, regardless of autonomy setting.

---

## Components Reused Across Screens

### Pivot Card

Surfaces when the agent connects two findings (cross-pollination). Rendered inline in the agent stream.

- Gradient top accent bar (pink → magenta)
- Header: "PIVOT SUGGESTION" + pivot ID + status pill (approved/pending you/skipped)
- Title (14 px, weight 600)
- Body text
- Footer row: "connects" + finding ID chips × cost · risk
- Action buttons (Take pivot / Defer / Dismiss · skip / Edit plan) — only shown when status=pending

### Finding Detail

In right pane lower half. Shows for the selected finding:
- Severity badge + ID + CWE + CVE + status pill
- Title (14 px, weight 600)
- Host (mono)
- Evidence block (`#0a0e14` bg, mono)
- Recommended fix block (`#4ade80` tinted bg + border)
- **CVSS 3.1 panel** — see below
- Action buttons: Add to report (primary) / Jira issue / Open MD

### CVSS 3.1 Panel

8 metrics, interactive segmented controls. As any metric changes, score recalculates live using the FIRST.org base-score formula:

```
AVw  = {N:0.85, A:0.62, L:0.55, P:0.2}[AV]
ACw  = {L:0.77, H:0.44}[AC]
PRw  = scope-dependent:
       S=U: {N:0.85, L:0.62, H:0.27}
       S=C: {N:0.85, L:0.68, H:0.5}
UIw  = {N:0.85, R:0.62}[UI]
Cw   = {N:0, L:0.22, H:0.56}[C]
Iw   = {N:0, L:0.22, H:0.56}[I]
Aw   = {N:0, L:0.22, H:0.56}[A]

ISS    = 1 − (1−Cw)(1−Iw)(1−Aw)
impact = S=U ? 6.42·ISS : 7.52·(ISS−0.029) − 3.25·(ISS−0.02)^15
exploit= 8.22 · AVw · ACw · PRw · UIw
raw    = S=U ? impact+exploit : 1.08·(impact+exploit)
score  = ⌈min(10, raw) · 10⌉ / 10
```

Severity bands:
| Score | Label | Color |
|---|---|---|
| 0.0 | NONE | `#9aa0a6` |
| 0.1–3.9 | LOW | `#7ab6e0` |
| 4.0–6.9 | MEDIUM | `#e0a93d` |
| 7.0–8.9 | HIGH | `#e0533d` |
| 9.0–10.0 | CRITICAL | `#dc2626` |

Vector string format: `CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:N`

---

## Interactions & Behavior

| Surface | Behavior |
|---|---|
| Plan/Build toggle | Click switches mode; in Plan, autonomy is dimmed and tool execution is disabled |
| Composer Enter | Sends. In Build → agent acknowledges with PLAN; in Plan → agent responds with THINK |
| Composer `/` | Opens slash-command autocomplete. Arrows navigate, Enter/Tab accept, Esc clears |
| Composer `@` | Opens host autocomplete from discovered hosts in the engagement |
| Composer Tab (no AC open) | Cycles center-pane tabs (Stream → Playbook → Timeline → Transcript) |
| Stream entries | Animate in (slide-down, 0.4s) when newly added |
| Approval card | Approve / Dry-run / Edit / Reject. Reject opens a small textarea for reason |
| Pivot card | Take pivot / Defer / Dismiss. Dismiss prompts for reason (logged for audit) |
| Finding row click | Selects, populates detail pane |
| CVSS metric click | Recomputes score instantly; updates vector string and severity badge color |
| Report layout select | Changes report sections (different templates per engagement type) |
| Engagement pill | Opens dropdown to switch engagement |
| Methodology pill | Opens methodology switcher (rare action; usually set at engagement creation) |

---

## State Management

### Frontend State (Zustand stores)

```ts
// useEngagement
type Engagement = {
  id: string
  code: string
  name: string
  type: 'ext-web' | 'int-web' | 'ext-net' | 'int-net' | 'cloud' | 'sso' | 'adv-sim'
  startedAt: string
  scope: { in: string[]; out: string[]; rules: string[] }
  methodology: MethodologyId
  contacts: Contact[]
  documents: Document[]
  primaryModel: string
  localModel: string
  routerPolicy: 'combo' | 'cloud' | 'airgap'
  defaultAutonomy: 'passive' | 'review' | 'auto'
  enabledTools: string[]   // tool IDs
}

// useWorkspace
type WorkspaceState = {
  mode: 'plan' | 'build'
  autonomy: 'passive' | 'review' | 'auto'  // can override engagement default per session
  centerTab: 'stream' | 'playbook' | 'timeline' | 'transcript'
  rightTab: 'findings' | 'report' | 'loot'
  selectedFindingId: string | null
  reportLayout: ReportLayoutId
}

// useAgent (server-driven via WebSocket; mirrors backend state)
type AgentState = {
  stream: StreamEntry[]
  pendingApprovals: ApprovalRequest[]
  pivots: Pivot[]
  turn: number
  contextUsage: number       // 0..1
  status: 'idle' | 'planning' | 'executing' | 'awaiting-approval' | 'error'
}

// useFindings
type FindingsState = {
  findings: Finding[]
  filter: { sev?: Severity[]; host?: string; status?: FindingStatus }
  sort: { field: 'sev' | 'first_seen' | 'host'; dir: 'asc' | 'desc' }
}
```

### Backend State (SQLite per engagement)

```sql
-- engagements.db (global)
CREATE TABLE engagements (
  id TEXT PRIMARY KEY,
  code TEXT UNIQUE,
  name TEXT,
  type TEXT,
  status TEXT,
  config_json TEXT,
  started_at TIMESTAMP,
  ended_at TIMESTAMP
);

-- per-engagement: engagements/<id>/state.db
CREATE TABLE hosts (
  host TEXT PRIMARY KEY,
  ip TEXT,
  tech_json TEXT,
  ports_json TEXT,
  first_seen TIMESTAMP,
  orphan INTEGER DEFAULT 0
);

CREATE TABLE findings (
  id TEXT PRIMARY KEY,         -- 'NW-F001'
  sev TEXT,                    -- 'high' | 'med' | 'low' | 'info'
  title TEXT,
  host TEXT,
  cwe TEXT,
  cve TEXT,
  evidence TEXT,
  status TEXT,                 -- 'confirmed' | 'hypothesis' | 'needs-verify' | 'informational' | 'false-positive' | 'patched'
  fix_recommendation TEXT,
  first_seen TIMESTAMP,
  cvss_vector TEXT,            -- 'CVSS:3.1/AV:N/...'
  cvss_score REAL,
  linked_finding_ids TEXT      -- JSON array
);

CREATE TABLE agent_turns (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ts TIMESTAMP,
  kind TEXT,                   -- 'plan' | 'tool' | 'obs' | 'think' | 'approve' | 'human' | 'pivot'
  body TEXT,
  metadata_json TEXT,          -- {cost, model, tool_id, finding_ref, pivot_ref, ...}
  parent_turn INTEGER REFERENCES agent_turns(id)
);

CREATE TABLE approvals (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  turn_id INTEGER REFERENCES agent_turns(id),
  status TEXT,                 -- 'pending' | 'approved' | 'rejected' | 'dry-run' | 'edited'
  requested_at TIMESTAMP,
  resolved_at TIMESTAMP,
  resolver TEXT,
  reason TEXT
);

CREATE TABLE pivots (
  id TEXT PRIMARY KEY,
  title TEXT,
  body TEXT,
  connects_finding_ids TEXT,
  sev TEXT,
  estimated_cost TEXT,
  risk TEXT,
  status TEXT,                 -- 'pending' | 'approved' | 'skipped' | 'deferred'
  surfaced_at TIMESTAMP
);

CREATE TABLE loot (
  id TEXT PRIMARY KEY,
  kind TEXT,                   -- 'key' | 'schema' | 'path' | 'credential' | 'hash' | ...
  label TEXT,
  note TEXT,
  finding_ref TEXT,
  data BLOB,                   -- the actual material; encrypted at rest
  created_at TIMESTAMP
);
```

---

## LLM Integration Contract

The agent loop should expose a single function:

```python
async def agent_turn(engagement_id: str, user_input: str | None) -> AsyncIterator[StreamEntry]:
    """
    Drive one or more turns of the agent. Yields stream entries as they happen.
    User input may be None (autopilot continuation).
    Honors engagement.routerPolicy and engagement.defaultAutonomy.
    """
```

### Routing policy

| Policy | Reasoning calls | Tool I/O parsing | Notes |
|---|---|---|---|
| `combo` | Primary cloud model | Local Ollama | Default; cloud sees only synopses, never raw evidence |
| `cloud` | Primary cloud model | Primary cloud model | Higher quality, more data leaves |
| `airgap` | Local Ollama | Local Ollama | Air-gapped engagements |

### System prompt skeleton

The system prompt must include, in order:
1. Identity: "You are MAX, an LLM agent assisting authorized penetration testing."
2. Engagement metadata (name, code, type, scope, RoE clauses)
3. Methodology playbook step list with current step marked
4. Enabled tools list with version + brief description
5. Autonomy posture and what it means for tool calls
6. Output format contract (tool calls as JSON, prose as plain text, etc.)

RoE clauses must be **enforced programmatically before every tool call**, not just stated in the prompt. Example: if RoE includes "No DoS or volumetric scans" and the agent tries to run `masscan` with `--rate 1000000`, the runner refuses.

### Tool call contract

LLM emits a tool call as a structured response. Runner:
1. Parses + validates against the engagement's enabled tools list
2. Checks RoE programmatically (rate limits, port ranges, target IP against scope)
3. If autonomy=`passive` or risk≥medium under `review`, creates an Approval and pauses
4. Spawns the binary via subprocess, captures stdout/stderr, enforces a timeout
5. Emits `tool` then `obs` (renamed RESULT in UI) stream entries
6. Persists the turn

### Pivot detection

A separate, cheaper LLM pass runs after each new finding/observation, asking: *"Does this new evidence combine with any existing finding to enable an attack we haven't proposed yet?"* If yes, emit a `pivot` entry with the connects list.

---

## Design Tokens

### Colors

```js
// Brand
const MAX_GRADIENT_START = '#00D4CC'  // teal
const MAX_GRADIENT_END   = '#0066FF'  // blue

// Surface
const BG_PRIMARY     = '#0a0e14'
const BG_SECONDARY   = '#0d1218'
const BG_TERTIARY    = '#101620'
const BG_ELEVATED    = '#131922'

// Borders
const BORDER         = '#1c2330'
const BORDER_SUBTLE  = '#131922'
const BORDER_STRONG  = '#232b3a'

// Text
const TEXT_PRIMARY   = '#e5edf7'
const TEXT_SECONDARY = '#cdd6e2'
const TEXT_TERTIARY  = '#a8aec0'
const TEXT_MUTED     = '#7d8aa1'
const TEXT_FAINT     = '#5a6479'
const TEXT_GHOST     = '#3a445a'

// Accents (user-selectable in Tweaks)
const ACCENT_CYAN    = '#22d3ee'  // default
const ACCENT_AMBER   = '#f5a623'
const ACCENT_MAGENTA = '#e879f9'
const ACCENT_LIME    = '#a3e635'

// Severity
const SEV_HIGH       = '#e0533d'
const SEV_MED        = '#e0a93d'
const SEV_LOW        = '#7ab6e0'
const SEV_INFO       = '#9aa0a6'
const SEV_CRITICAL   = '#dc2626'

// Status
const STATUS_CONFIRMED       = '#34d399'
const STATUS_HYPOTHESIS      = '#fbbf24'
const STATUS_NEEDS_VERIFY    = '#fb7185'
const STATUS_INFORMATIONAL   = '#7ab6e0'
const STATUS_FALSE_POSITIVE  = '#7d8aa1'
const STATUS_PATCHED         = '#a3e635'

// Semantic
const SUCCESS = '#34d399'
const WARNING = '#fbbf24'
const DANGER  = '#fb7185'
const INFO    = '#7ab6e0'
```

### Typography

| Use | Stack | Sizes |
|---|---|---|
| UI / body | `'Inter', 'Geist', system-ui, sans-serif` | 10, 11, 12, 13, 14, 18, 22 px |
| Mono / code | `'Geist Mono', 'JetBrains Mono', 'IBM Plex Mono', ui-monospace, monospace` | 9, 10, 11, 12 px |

Headings up to 22 px. Letter-spacing -0.3 to -0.5 for large titles, 0.4 to 1.5 for small uppercase labels.

### Spacing scale

`{ xs: 4, sm: 6, md: 8, lg: 10, xl: 12, 2xl: 14, 3xl: 16, 4xl: 18, 5xl: 22 }` (in pixels)

### Radius

`{ sm: 3, md: 4, lg: 5, xl: 6, 2xl: 8 }` (in pixels). Status pills are 3 px, buttons 5–6 px, cards 8 px.

### Shadows

```
boxShadow: '0 10px 30px rgba(0,0,0,0.4)'      // dropdown
boxShadow: '0 -8px 28px rgba(0,0,0,0.4)'      // autocomplete (bottom-anchored)
boxShadow: '0 4px 14px rgba(52,211,153,0.3)'  // primary CTA glow
```

### Animation

- Stream entries: `slideIn .4s cubic-bezier(.2,.7,.3,1)` — `translateY(-4px) → 0`, opacity 0 → 1
- Status dot pulse: `2s infinite ease-in-out`, scale 1 → 1.2, opacity 1 → 0.6
- Connected dot blink: `1.6s infinite`, opacity 1 ↔ 0.3

---

## Assets

`brand/` contains the official MAX assets:
- `mark.svg` — vector chevron mark with cyan→blue gradient
- `mark-transparent.png` — 1000×1000 PNG
- `logo-horizontal-dark.png` — wordmark + "Where Threats Come Into Focus." tagline on dark
- `logo-square-dark.png` — square lockup

MAX is the brand name for the **Security Assessment Platform** — use the tagline everywhere else.

The tagline "Where Threats Come Into Focus." is part of the brand. Consider using it in the loading splash, the empty-state for a fresh engagement, and the report cover page.

Recommended icon library: **Lucide React** (matches the visual weight of the hand-rolled SVGs in the prototype).

---

## Files

Design reference files in `design_reference/`:

| File | What it is |
|---|---|
| `index.html` | Entry point — Design Canvas with 3 artboards + Tweaks panel |
| `pentest-app.jsx` | Main workspace component (top bar, sidebar, center pane, composer) |
| `pentest-app-right.jsx` | Right pane (Findings / Report / Loot tabs) + CVSS panel |
| `setup-wizard.jsx` | Engagement Setup Wizard (4 steps) |
| `shared-data.js` | Sample engagement data + Kali tool inventory + methodologies + pivots |
| `design-canvas.jsx` | Design canvas wrapper (NOT part of the product; can ignore) |
| `tweaks-panel.jsx` | Tweaks panel wrapper (NOT part of the product; can ignore) |
| `brand/` | Brand assets — use these in the real app |

Reference screenshots in `screenshots/`:

| File | Screen |
|---|---|
| `01-workspace-build.png` | Workspace · BUILD mode · Findings tab + CVSS |
| `02-workspace-plan.png` | Workspace · PLAN mode · Report tab |
| `03-setup-wizard.png` | Engagement Setup Wizard |

The `shared-data.js` file is especially useful — it's the canonical schema for findings, hosts, pivots, methodologies, and the Kali tool inventory. Lift its shape directly.

---

## Implementation Plan (suggested order)

### Phase 1 — Skeleton (Week 1)
1. Scaffold Tauri + React + TypeScript
2. Set up FastAPI backend, sidecar binary
3. Build the engagement setup wizard end-to-end (form, validation, SQLite persist)
4. Engagement list / picker

### Phase 2 — Agent loop (Weeks 2–3)
1. LLM router: Anthropic SDK + Ollama client behind a common interface
2. Tool runner: subprocess wrapper for **nmap, curl, ffuf** (just three to start)
3. Stream WebSocket from backend to frontend
4. Approval queue with persistent state
5. Hardcode RoE enforcement for the three tools

### Phase 3 — Findings & Report (Week 4)
1. Findings CRUD + the colored status system
2. CVSS panel (formula already documented above)
3. Markdown report builder with one layout (External Web)
4. CSV export for findings table

### Phase 4 — Methodology + Pivots (Week 5)
1. Playbook step tracker driven by methodology
2. Pivot detection LLM pass
3. Multiple report layouts

### Phase 5 — Tool expansion (Week 6)
1. Add the rest of the Kali tools, one category at a time
2. Per-engagement tool enable/disable enforcement
3. RoE programmatic guards (rate limits, scope checks, etc.)

### Phase 6 — Polish (Weeks 7–8)
1. Plan/Build mode wiring (no execution in Plan)
2. Tweaks (theme, density, layout)
3. PDF / DOCX export via pandoc
4. Loot vault with encryption-at-rest
5. Packaging: `.deb` for Kali, code-signed

### What to skip in v1
- Multi-operator collaboration (single user only)
- Jira / GitHub issue integration (export MD/JSON and use existing tooling)
- Custom playbook editor (just ship the built-in playbooks)
- Adversary simulation / ATT&CK matrix view (ship External Web first)

---

## Security & Compliance Notes

- **Loot at rest**: encrypt the `data` column in `loot` using a key derived from an operator passphrase (Argon2id). Never log raw loot to disk in plaintext.
- **LLM data egress**: in `combo` and `cloud` modes, the cloud LLM sees prose summaries but never raw tool output blobs (those stay local). The router is responsible for this redaction. In `airgap` mode, no outbound traffic to LLM providers.
- **Tool sandboxing**: subprocess calls should drop privileges and run with a restricted PATH. Consider firejail or a minimal AppArmor profile.
- **RoE breach detection**: if the agent attempts something out of bounds, log it, refuse, surface a red banner in the UI ("Agent attempted out-of-scope action"). Don't just silently filter.
- **Audit log**: append-only log of all agent_turns and approvals. Required for any post-engagement client review.

---

## Open Questions for the Implementer

These are things I didn't lock down — your call:

1. **Window state**: should engagement switching reload the whole workspace, or keep a tab per engagement?
2. **Offline LLM bundling**: ship Ollama as a sidecar binary, or require user to install it separately?
3. **Tool installation check**: at engagement creation, should MAX shell out to `which nmap` etc. and warn about missing binaries?
4. **Versioned playbooks**: methodology guides drift (WSTG v4.2 → v4.3 someday). Bundle vs. update channel?
5. **Multi-target engagements** (e.g. one engagement covering multiple URLs from different clients): not designed. Punt to v2?

---

## Getting Help

The prototype was built in Claude's design environment. For implementation questions:
- Use **Claude Code** (CLI) in your terminal for actual coding sessions
- For design changes or new screens, go back to the design environment where this prototype lives

Good luck — and watch the operator-in-the-loop carefully. The whole product hinges on operators trusting the agent enough to delegate while staying sharp enough to catch when it's wrong.
