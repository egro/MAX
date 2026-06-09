// Full-page report deliverable — what the exported PDF/DOCX looks like.
// Consistent skeleton: cover · exec summary · findings summary · findings detail · methodology.
// Rendered as stacked "paper" pages on a slate backdrop.

function ReportDeliverable({ t }) {
  const P = window.PENTEST;
  const SEV = window.SEV_COLORS;
  const accent = t.theme || "#22d3ee";

  // CVSS scoring reused from the right-pane module.
  const score = (f) => (window.paCvssScore ? window.paCvssScore(f.cvss) : f.cvss_score || 0);
  const sevWord = { high: "HIGH", med: "MEDIUM", low: "LOW", info: "INFO" };
  const critWord = {
    high: "Immediate — remediate before next release",
    med:  "Scheduled — address this sprint",
    low:  "Backlog — fix in normal maintenance",
    info: "Informational — no action required",
  };

  return (
    <div style={{
      width: "100%", height: "100%", overflow: "auto",
      background: "#0a0e14",
      fontFamily: "'Inter', system-ui, sans-serif",
      display: "flex", flexDirection: "column", alignItems: "center",
      padding: "28px 0 60px",
    }}>
      {/* Toolbar */}
      <ReportToolbar accent={accent} />

      {/* ── PAGE 1 · COVER ───────────────────────────────────── */}
      <ReportPage>
        <div style={{ height: "100%", display: "flex", flexDirection: "column", position: "relative" }}>
          {/* gradient corner */}
          <div style={{ position: "absolute", top: -40, right: -40, width: 280, height: 280, background: "radial-gradient(circle, rgba(0,212,204,0.12), transparent 70%)", pointerEvents: "none" }} />

          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <svg width="42" height="42" viewBox="0 0 500 500">
              <defs>
                <linearGradient id="repMark" x1="0%" y1="100%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#00D4CC" /><stop offset="100%" stopColor="#0066FF" />
                </linearGradient>
              </defs>
              <path d="M113.10,386.90 L250.00,113.10 L386.90,386.90 L250.00,250.00 Z" fill="url(#repMark)" />
              <line x1="113.10" y1="386.90" x2="250.00" y2="113.10" stroke="rgba(255,255,255,0.22)" strokeWidth="6" />
            </svg>
            <div>
              <div style={{ fontFamily: "'Geist', sans-serif", fontWeight: 700, letterSpacing: 3, fontSize: 18, color: "#0a1530" }}>MAX</div>
              <div style={{ fontSize: 10, color: "#5a6479", letterSpacing: 1 }}>Where threats come into focus.</div>
            </div>
          </div>

          <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
            <div style={{ fontSize: 13, color: accent, letterSpacing: 3, fontWeight: 600, marginBottom: 14 }}>PENETRATION TEST REPORT</div>
            <div style={{ fontFamily: "'Geist', sans-serif", fontSize: 44, fontWeight: 700, color: "#0a1530", letterSpacing: -0.5, lineHeight: 1.05 }}>
              {P.engagement.name}
            </div>
            <div style={{ fontSize: 16, color: "#3a445a", marginTop: 12, fontFamily: "'Geist Mono', monospace" }}>
              {P.engagement.code} · {P.engagement.type}
            </div>
            <div style={{ width: 80, height: 3, background: "linear-gradient(90deg, #00D4CC, #0066FF)", marginTop: 24, borderRadius: 2 }} />
            <div style={{ fontSize: 13, color: "#5a6479", marginTop: 22 }}>
              Prepared by <b style={{ color: "#0a1530" }}>{P.engagement.team}</b>
            </div>
            <div style={{ fontSize: 13, color: "#5a6479", marginTop: 2 }}>
              Assessor: <b style={{ color: "#0a1530" }}>{P.engagement.assessor}</b>
            </div>
          </div>

          {/* Footer meta grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 18, paddingTop: 24, borderTop: "1px solid #e3e7ee" }}>
            {[
              ["STARTED", P.engagement.startedAt],
              ["ASSESSOR", P.engagement.assessor],
              ["CONDUCTED BY", P.engagement.team],
              ["METHODOLOGY", "OWASP WSTG v4.2"],
              ["CLASSIFICATION", "CONFIDENTIAL"],
              ["RECIPIENT", "System Owner / ISSO"],
            ].map(([k, v]) => (
              <div key={k}>
                <div style={{ fontSize: 9, color: "#9aa4b2", letterSpacing: 1, marginBottom: 3 }}>{k}</div>
                <div style={{ fontSize: 12, color: "#0a1530", fontWeight: 500 }}>{v}</div>
              </div>
            ))}
          </div>
        </div>
      </ReportPage>

      {/* ── PAGE 2 · EXEC SUMMARY + FINDINGS SUMMARY ─────────── */}
      <ReportPage>
        <ReportSectionTitle n="1" title="Executive Summary" accent={accent} />
        <p style={reportBody}>
          MAX conducted a {P.engagement.type.toLowerCase()} assessment of {P.engagement.name}'s
          in-scope systems, following the OWASP Web Security Testing Guide (v4.2). Testing was
          limited to discovery and minimal proof-of-concept — <b>no exploitation past minimal proof</b>,
          consistent with the agreed rules of engagement.
        </p>
        <p style={reportBody}>
          The assessment identified <b>{P.findings.length} findings</b>: {P.metrics.findingsBySev.high} high,
          {" "}{P.metrics.findingsBySev.med} medium, {P.metrics.findingsBySev.low} low, and
          {" "}{P.metrics.findingsBySev.info} informational. The most significant risk is a chain combining a
          dangling DNS record (subdomain takeover) with a missing Content-Security-Policy header, which
          would permit a drive-by attack against shop users. A re-used JWT signing key further extends an
          authentication compromise from the identity host to the API. All findings are remediable by the
          owning team within the current sprint.
        </p>

        {/* Severity strip */}
        <div style={{ display: "flex", gap: 12, margin: "20px 0 28px" }}>
          {[["high", "High"], ["med", "Medium"], ["low", "Low"], ["info", "Info"]].map(([k, lbl]) => (
            <div key={k} style={{ flex: 1, padding: "14px 16px", border: `1px solid ${SEV[k]}55`, background: `${SEV[k]}10`, borderRadius: 8 }}>
              <div style={{ fontSize: 28, fontWeight: 700, color: SEV[k], fontVariantNumeric: "tabular-nums", lineHeight: 1 }}>
                {String(P.metrics.findingsBySev[k]).padStart(2, "0")}
              </div>
              <div style={{ fontSize: 11, color: "#3a445a", letterSpacing: 0.5, marginTop: 4 }}>{lbl}</div>
            </div>
          ))}
        </div>

        <ReportSectionTitle n="2" title="Findings Summary" accent={accent} />
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, marginTop: 8 }}>
          <thead>
            <tr style={{ borderBottom: "2px solid #0a1530" }}>
              {["#", "SEVERITY", "CVSS", "FINDING", "SYSTEM", "STATUS"].map((h) => (
                <th key={h} style={{ textAlign: h === "CVSS" ? "center" : "left", padding: "8px 10px", fontSize: 10, color: "#5a6479", letterSpacing: 0.6, fontWeight: 600 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {P.findings.map((f) => (
              <tr key={f.id} style={{ borderBottom: "1px solid #e3e7ee" }}>
                <td style={{ padding: "8px 10px", fontFamily: "'Geist Mono', monospace", color: "#5a6479", fontSize: 11 }}>{f.id}</td>
                <td style={{ padding: "8px 10px" }}>
                  <span style={{ padding: "2px 7px", borderRadius: 3, fontSize: 10, fontWeight: 700, background: `${SEV[f.sev]}22`, color: reportSevInk(f.sev), letterSpacing: 0.4 }}>{sevWord[f.sev]}</span>
                </td>
                <td style={{ padding: "8px 10px", textAlign: "center", fontFamily: "'Geist Mono', monospace", color: "#0a1530", fontWeight: 600 }}>{score(f).toFixed(1)}</td>
                <td style={{ padding: "8px 10px", color: "#0a1530" }}>{f.title}</td>
                <td style={{ padding: "8px 10px", color: "#5a6479", fontFamily: "'Geist Mono', monospace", fontSize: 11 }}>{f.host.split(" · ")[0]}</td>
                <td style={{ padding: "8px 10px", color: "#5a6479", fontSize: 11, textTransform: "capitalize" }}>{f.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </ReportPage>

      {/* ── PAGES 3+ · FINDINGS DETAIL ───────────────────────── */}
      <ReportPage>
        <ReportSectionTitle n="3" title="Findings Detail" accent={accent} />
        {P.findings.slice(0, 3).map((f) => (
          <ReportFinding key={f.id} f={f} score={score(f)} sevWord={sevWord} critWord={critWord} accent={accent} />
        ))}
      </ReportPage>

      <ReportPage>
        {P.findings.slice(3, 7).map((f) => (
          <ReportFinding key={f.id} f={f} score={score(f)} sevWord={sevWord} critWord={critWord} accent={accent} />
        ))}
      </ReportPage>

      <ReportPage>
        {P.findings.slice(7).map((f) => (
          <ReportFinding key={f.id} f={f} score={score(f)} sevWord={sevWord} critWord={critWord} accent={accent} />
        ))}

        {/* Methodology & scope appendix */}
        <div style={{ marginTop: 28 }}>
          <ReportSectionTitle n="4" title="Methodology & Scope" accent={accent} />
          <p style={reportBody}>
            This engagement was conducted by <b>{P.engagement.team}</b> following the
            {" "}<b>OWASP Web Security Testing Guide v4.2</b> ({P.engagement.type} profile).
            Testing was performed by {P.engagement.assessor} between the engagement start time
            and the report date, primarily using unauthenticated techniques.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18, marginTop: 16 }}>
            <div>
              <div style={{ fontSize: 10, color: "#4ade80", letterSpacing: 1, marginBottom: 6, fontWeight: 600 }}>IN SCOPE</div>
              {P.scope.in.map((s) => (
                <div key={s} style={{ fontSize: 12, color: "#0a1530", fontFamily: "'Geist Mono', monospace", padding: "2px 0" }}>+ {s}</div>
              ))}
            </div>
            <div>
              <div style={{ fontSize: 10, color: "#e0533d", letterSpacing: 1, marginBottom: 6, fontWeight: 600 }}>OUT OF SCOPE</div>
              {P.scope.out.map((s) => (
                <div key={s} style={{ fontSize: 12, color: "#9aa4b2", fontFamily: "'Geist Mono', monospace", padding: "2px 0" }}>− {s}</div>
              ))}
            </div>
          </div>
          <div style={{ marginTop: 16 }}>
            <div style={{ fontSize: 10, color: "#5a6479", letterSpacing: 1, marginBottom: 6, fontWeight: 600 }}>RULES OF ENGAGEMENT</div>
            <ol style={{ margin: 0, paddingLeft: 20, fontSize: 12, color: "#3a445a", lineHeight: 1.7 }}>
              {P.scope.rules.map((r, i) => <li key={i}>{r}</li>)}
            </ol>
          </div>
        </div>
      </ReportPage>
    </div>
  );
}

// ─── Toolbar ─────────────────────────────────────────────────
function ReportToolbar({ accent }) {
  return (
    <div style={{
      width: 820, marginBottom: 24, display: "flex", alignItems: "center", gap: 12,
      background: "#0d1218", border: "1px solid #1c2330", borderRadius: 10, padding: "12px 16px",
    }}>
      <svg width="20" height="20" viewBox="0 0 500 500">
        <defs>
          <linearGradient id="repTbMark" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#00D4CC" /><stop offset="100%" stopColor="#0066FF" />
          </linearGradient>
        </defs>
        <path d="M113.10,386.90 L250.00,113.10 L386.90,386.90 L250.00,250.00 Z" fill="url(#repTbMark)" />
      </svg>
      <div style={{ display: "flex", flexDirection: "column" }}>
        <span style={{ fontSize: 13, color: "#e5edf7", fontWeight: 600 }}>Report preview</span>
        <span style={{ fontSize: 10, color: "#7d8aa1", fontFamily: "'Geist Mono', monospace" }}>NW-WEB-2026-03.pdf · draft 0.71</span>
      </div>
      <div style={{ flex: 1 }} />
      <span style={{ fontSize: 10, color: "#5a6479", marginRight: 4 }}>edit as</span>
      {["Markdown", "DOCX"].map((x) => (
        <button key={x} style={{
          padding: "6px 12px", background: "#131922", color: "#cdd6e2",
          border: "1px solid #1c2330", borderRadius: 6, fontSize: 11, fontFamily: "inherit", cursor: "default",
        }}>{x}</button>
      ))}
      <button style={{
        padding: "6px 14px", background: accent, color: "#0a0e14",
        border: 0, borderRadius: 6, fontSize: 11, fontWeight: 600, fontFamily: "inherit", cursor: "default",
        display: "flex", alignItems: "center", gap: 6,
      }}>
        <svg width="11" height="11" viewBox="0 0 11 11" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M5.5 1v6M3 5l2.5 2.5L8 5M1.5 9.5h8" /></svg>
        Export final PDF
      </button>
    </div>
  );
}

// ─── A4-ish page ─────────────────────────────────────────────
function ReportPage({ children }) {
  return (
    <div style={{
      width: 820, minHeight: 1060, background: "#ffffff", color: "#0a1530",
      borderRadius: 6, boxShadow: "0 8px 40px rgba(0,0,0,0.45)",
      padding: "56px 60px", marginBottom: 28, position: "relative",
    }}>
      {children}
    </div>
  );
}

function ReportSectionTitle({ n, title, accent }) {
  return (
    <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginBottom: 14, paddingBottom: 8, borderBottom: `2px solid ${accent}` }}>
      <span style={{ fontFamily: "'Geist Mono', monospace", fontSize: 14, color: accent, fontWeight: 700 }}>{n}</span>
      <span style={{ fontFamily: "'Geist', sans-serif", fontSize: 22, fontWeight: 700, color: "#0a1530", letterSpacing: -0.3 }}>{title}</span>
    </div>
  );
}

const reportBody = {
  fontSize: 13, lineHeight: 1.65, color: "#3a445a", margin: "0 0 12px",
};

function reportSevInk(sev) {
  return { high: "#c0392b", med: "#b8860b", low: "#2c6a9e", info: "#5a6479" }[sev] || "#5a6479";
}

// ─── Single finding block ────────────────────────────────────
function ReportFinding({ f, score, sevWord, critWord, accent }) {
  const SEV = window.SEV_COLORS;
  const ink = reportSevInk(f.sev);
  const sevBand = score >= 9 ? "Critical" : score >= 7 ? "High" : score >= 4 ? "Medium" : score > 0 ? "Low" : "None";

  // CVSS vector string
  const vec = f.cvss ? "CVSS:3.1/" + ["AV", "AC", "PR", "UI", "S", "C", "I", "A"].map((k) => `${k}:${f.cvss[k]}`).join("/") : "—";

  // Synthesize an evidence command + output per finding for the mockup.
  const evidence = reportEvidence(f);

  return (
    <div style={{ marginBottom: 28, paddingBottom: 22, borderBottom: "1px solid #e3e7ee", breakInside: "avoid" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
        <span style={{ padding: "3px 8px", borderRadius: 4, fontSize: 11, fontWeight: 700, background: `${SEV[f.sev]}22`, color: ink, letterSpacing: 0.4 }}>{sevWord[f.sev]}</span>
        <span style={{ fontFamily: "'Geist Mono', monospace", fontSize: 12, color: "#5a6479" }}>{f.id}</span>
        <span style={{ fontFamily: "'Geist', sans-serif", fontSize: 17, fontWeight: 700, color: "#0a1530", letterSpacing: -0.2 }}>{f.title}</span>
      </div>

      {/* Meta + CVSS two-column */}
      <div style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr", gap: 16, marginBottom: 12 }}>
        <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: "4px 12px", fontSize: 12, alignContent: "start" }}>
          <span style={{ color: "#9aa4b2" }}>Criticality</span><span style={{ color: "#0a1530" }}>{critWord[f.sev]}</span>
          <span style={{ color: "#9aa4b2" }}>System</span><span style={{ color: "#0a1530", fontFamily: "'Geist Mono', monospace", fontSize: 11 }}>{f.host}</span>
          <span style={{ color: "#9aa4b2" }}>CWE</span><span style={{ color: "#0a1530" }}>{f.cwe}</span>
          {f.cve && <><span style={{ color: "#9aa4b2" }}>CVE</span><span style={{ color: "#c0392b", fontFamily: "'Geist Mono', monospace", fontSize: 11 }}>{f.cve}</span></>}
        </div>
        {/* CVSS card */}
        <div style={{ border: `1px solid ${SEV[f.sev]}44`, background: `${SEV[f.sev]}0c`, borderRadius: 8, padding: "10px 12px" }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
            <span style={{ fontSize: 24, fontWeight: 700, color: ink, fontVariantNumeric: "tabular-nums", lineHeight: 1 }}>{score.toFixed(1)}</span>
            <span style={{ fontSize: 11, color: ink, fontWeight: 600, letterSpacing: 0.5 }}>{sevBand.toUpperCase()} · CVSS 3.1</span>
          </div>
          <div style={{ fontFamily: "'Geist Mono', monospace", fontSize: 9.5, color: "#5a6479", marginTop: 6, wordBreak: "break-all" }}>{vec}</div>
        </div>
      </div>

      {/* Description */}
      <div style={{ fontSize: 12.5, lineHeight: 1.6, color: "#3a445a", marginBottom: 10 }}>
        {reportDescription(f)}
      </div>

      {/* Evidence */}
      <div style={{ fontSize: 9.5, color: "#9aa4b2", letterSpacing: 0.6, marginBottom: 4, fontWeight: 600 }}>
        EVIDENCE · {evidence.meta}
      </div>
      <pre style={{
        margin: "0 0 12px", padding: "10px 12px", background: "#0d1422", color: "#cdd6e2",
        borderRadius: 6, fontSize: 10.5, fontFamily: "'Geist Mono', monospace", lineHeight: 1.5,
        whiteSpace: "pre-wrap", wordBreak: "break-word", overflow: "hidden",
      }}>{evidence.body}</pre>

      {/* Fix */}
      <div style={{ display: "flex", gap: 10, padding: "10px 12px", background: "rgba(74,210,149,0.1)", border: "1px solid rgba(74,210,149,0.4)", borderRadius: 8 }}>
        <span style={{ fontSize: 11, color: "#1f8a5b", fontWeight: 700, letterSpacing: 0.4, flexShrink: 0 }}>FIX</span>
        <span style={{ fontSize: 12.5, color: "#1a3a2a", lineHeight: 1.55 }}>{f.eta_patch}</span>
      </div>
    </div>
  );
}

// Per-finding description prose for the mockup.
function reportDescription(f) {
  const map = {
    "NW-F001": "The DNS record for cdn-old.northwind.io points to an S3 bucket that no longer exists. An attacker who registers the bucket name can serve arbitrary content from a hostname inside the client's own domain.",
    "NW-F002": "The shop frontend ships jQuery 1.7.2, which contains known DOM-XSS sinks. Three reachable call sites pass request-controlled data into vulnerable selectors; without a CSP, a single reflected sink yields a full cross-site scripting chain.",
    "NW-F003": "The production GraphQL endpoint responds to introspection queries, exposing the full schema — every type, field, and mutation — which substantially eases reconnaissance for an attacker.",
    "NW-F004": "The identity service signs JWTs with HS256 using a weak, guessable key. The key was recovered from a wordlist and validates tokens on both the auth and API hosts, extending an auth compromise into the data plane.",
    "NW-F005": "Responses across all routes lack a Content-Security-Policy and X-Frame-Options header, removing a key defense-in-depth control against XSS and clickjacking.",
    "NW-F006": "The /search endpoint returns a full Node.js stack trace on malformed input, disclosing internal file paths and framework versions.",
    "NW-F007": "The GraphQL gateway accepts deeply nested queries with no field-level complexity or depth limit, enabling resource exhaustion (denial-of-wallet) without a volumetric attack.",
    "NW-F008": "The web servers return their nginx version in the Server header, easing version-specific reconnaissance.",
    "NW-F009": "robots.txt discloses sensitive paths (/staging, /internal-api, /admin-legacy) that should not be publicly referenced.",
    "NW-F010": "The identity provider runs Keycloak 21.1, one minor version behind, with a partially-applicable CVE. Informational pending confirmation of exploitability in this configuration.",
  };
  return map[f.id] || f.evidence;
}

// Per-finding evidence block (tool + command + output).
function reportEvidence(f) {
  const map = {
    "NW-F001": { meta: "dig (bind9 9.18) · 2026-05-16 11:42 UTC", body: "$ dig +short cdn-old.northwind.io\norphaned-bucket.s3.amazonaws.com.\n\n$ curl -sI https://orphaned-bucket.s3.amazonaws.com\nHTTP/1.1 404 Not Found\nx-amz-error-code: NoSuchBucket" },
    "NW-F002": { meta: "curl + sha256sum · 2026-05-15 14:08 UTC", body: "$ curl -s https://shop.northwind.io/static/js/jquery-1.7.2.min.js | sha256sum\n5e1f… (matches known jQuery 1.7.2 release hash)" },
    "NW-F003": { meta: "curl · 2026-05-17 09:51 UTC", body: "$ curl -s -X POST https://api.northwind.io/graphql \\\n  -d '{\"query\":\"{__schema{types{name}}}\"}'\nHTTP/1.1 200 OK\n{\"data\":{\"__schema\":{\"types\":[…full schema…]}}}" },
    "NW-F004": { meta: "john + custom verifier · 2026-05-18 16:30 UTC", body: "$ john --wordlist=rockyou-sub.txt jwt.hash\nnorthwind2023   (HS256 key recovered, 4.2M tries)\n\n$ curl -H \"Authorization: Bearer $FORGED\" https://api.northwind.io/api/users/me\nHTTP/1.1 200 OK   {\"sub\":\"ops-readonly\",\"roles\":[\"viewer\"]}" },
    "NW-F005": { meta: "curl -I · 2026-05-15 14:11 UTC", body: "$ curl -sI https://shop.northwind.io/ | grep -iE 'content-security|x-frame'\n(no output — headers absent on all routes)" },
    "NW-F006": { meta: "curl · 2026-05-19 10:14 UTC", body: "$ curl -s 'https://shop.northwind.io/search?q=%27'\nHTTP/1.1 500\nError: Unexpected token … at /var/app/server/db.js:142" },
    "NW-F007": { meta: "custom GraphQL probe · 2026-05-20 13:02 UTC", body: "$ python3 depth_probe.py --depth 1000 https://api.northwind.io/graphql\naccepted · server time 14.0s · no depth/complexity limit observed" },
    "NW-F008": { meta: "curl -I · 2026-05-14 16:22 UTC", body: "$ curl -sI https://shop.northwind.io | grep -i server\nServer: nginx/1.18.0" },
    "NW-F009": { meta: "curl · 2026-05-14 16:25 UTC", body: "$ curl -s https://shop.northwind.io/robots.txt\nDisallow: /staging\nDisallow: /internal-api\nDisallow: /admin-legacy" },
    "NW-F010": { meta: "whatweb · 2026-05-21 09:00 UTC", body: "$ whatweb https://auth.northwind.io/realms/master\nKeycloak[21.1.0] — N-1 minor (CVE-2024-1132 partial)" },
  };
  return map[f.id] || { meta: "—", body: f.evidence };
}

Object.assign(window, { ReportDeliverable });
