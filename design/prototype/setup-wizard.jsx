// Engagement Setup Wizard — 4-step flow shown as a separate artboard.
// Polished slate chrome matching the workspace.

function EngagementWizard({ t }) {
  const accent = t.theme || "#22d3ee";

  const [step, setStep] = React.useState(2); // start mid-flow for richer demo
  const [form, setForm] = React.useState({
    name: "Northwind Commerce",
    code: "NW-WEB-2026-04",
    type: "Public Web Application",
    description: "Pre-production assessment of the redesigned shop + checkout flow ahead of Q3 launch. No exploitation past minimal PoC. Findings will be triaged into Jira and prioritized for the engineering team's sprint planning.",
    operator: "j.calder",
    assessor: "Jordan Calder",
    team: "CI Cyber Recon Hunt",
    start: "2026-06-02",
    end: "2026-06-16",
    inScope: ["shop.northwind.io", "api.northwind.io", "auth.northwind.io", "cdn.northwind.io"],
    outScope: ["corp.northwind.io", "*.internal.northwind.io"],
    methodology: "owasp-wstg-pub",
    docs: [
    { name: "northwind-arch-v3.pdf", size: "1.2 MB", kind: "TSD", uploaded: true },
    { name: "RoE_signed_2026-05-22.pdf", size: "84 KB", kind: "RoE", uploaded: true },
    { name: "data-classification.xlsx", size: "212 KB", kind: "DATA", uploaded: true }],

    contacts: [
    { name: "Priya Mehta", role: "App Eng Lead", email: "priya.m@northwind.example", primary: true, oncall: true },
    { name: "Dan Romero", role: "SecOps", email: "dromero@northwind.example", primary: false, oncall: true },
    { name: "Hilde Brandt", role: "Engagement owner", email: "hbrandt@northwind.example", primary: true, oncall: false }],

    primaryModel: "claude-sonnet-4.5",
    localModel: "qwen2.5-coder:32b",
    routerPolicy: "policy",
    autonomy: "review",
    disabledTools: [] // tool ids the user disabled for this engagement
  });

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const steps = [
  { n: 1, l: "Engagement & Scope", sub: "Target, dates, RoE" },
  { n: 2, l: "Methodology", sub: "Playbook, depth" },
  { n: 3, l: "Documents & Contacts", sub: "TSDs, owners" },
  { n: 4, l: "Agent & Review", sub: "Models, autonomy" }];


  return (
    <div style={{
      width: "100%", height: "100%", background: "#0a0e14", color: "#cdd6e2",
      fontFamily: "'Inter', 'Geist', system-ui, sans-serif", fontSize: 13,
      display: "flex", flexDirection: "column", overflow: "hidden"
    }}>
      {/* Wizard chrome */}
      <div style={{
        height: 50, flexShrink: 0, background: "#0a0e14",
        borderBottom: "1px solid #1c2330",
        display: "flex", alignItems: "center", padding: "0 16px", gap: 14
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
          <svg width="28" height="28" viewBox="0 0 500 500">
            <defs>
              <linearGradient id="maxMarkWizard" x1="0%" y1="100%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#00D4CC" />
                <stop offset="100%" stopColor="#0066FF" />
              </linearGradient>
            </defs>
            <path d="M113.10,386.90 L250.00,113.10 L386.90,386.90 L250.00,250.00 Z" fill="url(#maxMarkWizard)" />
            <line x1="113.10" y1="386.90" x2="250.00" y2="113.10" stroke="rgba(255,255,255,0.22)" strokeWidth="6" />
            <line x1="250.00" y1="179.70" x2="250.00" y2="264.80" stroke="rgba(255,255,255,0.10)" strokeWidth="3" />
          </svg>
          <span style={{ fontWeight: 700, letterSpacing: 3, fontSize: 13, color: "#e5edf7" }}>MAX</span>
        </div>
        <span style={{ color: "#3a445a" }}>›</span>
        <span style={{ fontSize: 13, color: "#e5edf7", fontWeight: 500 }}>New Engagement</span>
        <span style={{ fontSize: 11, color: "#7d8aa1" }}>· step {step} of 4</span>
        <div style={{ flex: 1 }} />
        <button style={{
          padding: "5px 10px", background: "transparent", color: "#7d8aa1",
          border: "1px solid #1c2330", borderRadius: 5, fontSize: 11, fontFamily: "inherit"
        }}>Save draft</button>
        <button style={{
          padding: "5px 10px", background: "transparent", color: "#fb7185",
          border: "1px solid #1c2330", borderRadius: 5, fontSize: 11, fontFamily: "inherit"
        }}>Cancel</button>
      </div>

      <div style={{ flex: 1, display: "flex", minHeight: 0 }}>
        {/* Left rail — step indicator */}
        <div style={{
          width: 280, flexShrink: 0, background: "#0a0e14",
          borderRight: "1px solid #1c2330",
          padding: "20px 16px", display: "flex", flexDirection: "column", gap: 10
        }}>
          <div style={{ fontSize: 10, color: "#5a6479", letterSpacing: 1, marginBottom: 4 }}>SETUP CHECKLIST</div>
          {steps.map((s, i) =>
          <div key={s.n} onClick={() => setStep(s.n)} style={{
            display: "flex", gap: 12, padding: "10px 12px", borderRadius: 8,
            background: step === s.n ? `${accent}12` : "transparent",
            border: `1px solid ${step === s.n ? accent + "55" : "transparent"}`,
            cursor: "default", alignItems: "flex-start"
          }}>
              <div style={{
              width: 22, height: 22, borderRadius: "50%", flexShrink: 0,
              background: step > s.n ? accent : step === s.n ? "transparent" : "#1c2330",
              border: step === s.n ? `1.5px solid ${accent}` : "1.5px solid #1c2330",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 11, fontWeight: 600,
              color: step > s.n ? "#0a0e14" : step === s.n ? accent : "#5a6479"
            }}>
                {step > s.n ? "✓" : s.n}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: step === s.n ? 600 : 500, color: step >= s.n ? "#e5edf7" : "#7d8aa1" }}>{s.l}</div>
                <div style={{ fontSize: 10.5, color: "#7d8aa1", marginTop: 1 }}>{s.sub}</div>
              </div>
            </div>
          )}

          <div style={{ flex: 1 }} />

          {/* Mini summary while editing */}
          <div style={{
            padding: 10, background: "#101620", borderRadius: 8, border: "1px solid #1c2330",
            fontSize: 11, color: "#7d8aa1", display: "flex", flexDirection: "column", gap: 5
          }}>
            <div style={{ fontSize: 9, color: "#5a6479", letterSpacing: 0.8 }}>DRAFT SUMMARY</div>
            <div><span style={{ color: "#5a6479" }}>name </span><span style={{ color: "#cdd6e2" }}>{form.name}</span></div>
            <div><span style={{ color: "#5a6479" }}>code </span><span style={{ color: "#cdd6e2", fontFamily: "'Geist Mono', monospace" }}>{form.code}</span></div>
            <div><span style={{ color: "#5a6479" }}>hosts </span><span style={{ color: "#cdd6e2" }}>{form.inScope.length} in · {form.outScope.length} out</span></div>
            <div><span style={{ color: "#5a6479" }}>docs </span><span style={{ color: "#cdd6e2" }}>{form.docs.length} files</span></div>
            <div><span style={{ color: "#5a6479" }}>contacts </span><span style={{ color: "#cdd6e2" }}>{form.contacts.length} people</span></div>
          </div>
        </div>

        {/* Main step content */}
        <div style={{ flex: 1, overflow: "auto", padding: "24px 32px", minWidth: 0 }}>
          {step === 1 && <EwStep1 form={form} set={set} accent={accent} />}
          {step === 2 && <EwStep2 form={form} set={set} accent={accent} />}
          {step === 3 && <EwStep3 form={form} set={set} accent={accent} />}
          {step === 4 && <EwStep4 form={form} set={set} accent={accent} />}
        </div>
      </div>

      {/* Footer */}
      <div style={{
        height: 60, flexShrink: 0, background: "#0a0e14",
        borderTop: "1px solid #1c2330",
        display: "flex", alignItems: "center", padding: "0 24px", gap: 14
      }}>
        <button onClick={() => setStep((s) => Math.max(1, s - 1))} style={{
          padding: "8px 14px", background: "transparent", color: "#cdd6e2",
          border: "1px solid #1c2330", borderRadius: 6, fontSize: 12, fontFamily: "inherit",
          cursor: "default", display: "flex", alignItems: "center", gap: 6,
          opacity: step === 1 ? 0.4 : 1
        }}>← Back</button>

        {/* Progress dots */}
        <div style={{ display: "flex", gap: 5, alignItems: "center", marginLeft: 12 }}>
          {steps.map((s) =>
          <div key={s.n} style={{
            width: step === s.n ? 22 : 6, height: 6, borderRadius: 3,
            background: step >= s.n ? accent : "#1c2330", transition: "width .2s"
          }} />
          )}
        </div>
        <span style={{ fontSize: 10, color: "#7d8aa1", marginLeft: 6 }}>step {step} of 4</span>

        <div style={{ flex: 1 }} />

        {step < 4 ?
        <button onClick={() => setStep((s) => s + 1)} style={{
          padding: "9px 16px", background: accent, color: "#0a0e14",
          border: 0, borderRadius: 6, fontSize: 12, fontWeight: 600, fontFamily: "inherit",
          cursor: "default", display: "flex", alignItems: "center", gap: 6
        }}>Continue →</button> :

        <button style={{
          padding: "9px 16px", background: "#34d399", color: "#0a0e14",
          border: 0, borderRadius: 6, fontSize: 12, fontWeight: 700, fontFamily: "inherit",
          cursor: "default", display: "flex", alignItems: "center", gap: 6,
          boxShadow: "0 0 0 1px #34d399, 0 4px 14px rgba(52,211,153,0.3)"
        }}>✓ Create engagement</button>
        }
      </div>
    </div>);

}

// ─── Form helpers ────────────────────────────────────────────────────────────
function EwField({ label, hint, children, span }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6, gridColumn: span ? `span ${span}` : undefined }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
        <label style={{ fontSize: 10.5, color: "#7d8aa1", letterSpacing: 0.5, fontWeight: 500 }}>{label}</label>
        {hint && <span style={{ fontSize: 10, color: "#5a6479" }}>{hint}</span>}
      </div>
      {children}
    </div>);

}
function EwInput({ value, onChange, mono, placeholder }) {
  return (
    <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
    style={{
      height: 34, padding: "0 12px",
      background: "#0d1218", border: "1px solid #1c2330", borderRadius: 6,
      color: "#e5edf7", fontFamily: mono ? "'Geist Mono', monospace" : "inherit",
      fontSize: 13, outline: "none"
    }} />);

}
function EwTextarea({ value, onChange, rows = 4 }) {
  return (
    <textarea value={value} onChange={(e) => onChange(e.target.value)} rows={rows}
    style={{
      padding: "10px 12px",
      background: "#0d1218", border: "1px solid #1c2330", borderRadius: 6,
      color: "#cdd6e2", fontFamily: "inherit", fontSize: 12, lineHeight: 1.5,
      outline: "none", resize: "vertical"
    }} />);

}
function EwChipInput({ chips, onChange, accent, danger }) {
  const [text, setText] = React.useState("");
  const add = () => {
    if (!text.trim()) return;
    onChange([...chips, text.trim()]);
    setText("");
  };
  const remove = (i) => onChange(chips.filter((_, j) => j !== i));
  const color = danger ? "#fb7185" : accent;
  return (
    <div style={{
      minHeight: 38, padding: 6, background: "#0d1218",
      border: "1px solid #1c2330", borderRadius: 6,
      display: "flex", flexWrap: "wrap", gap: 5, alignItems: "center"
    }}>
      {chips.map((c, i) =>
      <span key={i} style={{
        display: "flex", alignItems: "center", gap: 6,
        padding: "3px 4px 3px 8px", borderRadius: 4,
        background: `${color}18`, border: `1px solid ${color}44`,
        color: "#e5edf7", fontSize: 11, fontFamily: "'Geist Mono', monospace"
      }}>
          {c}
          <button onClick={() => remove(i)} style={{
          width: 16, height: 16, borderRadius: 3, border: 0,
          background: "transparent", color: color, cursor: "default",
          fontSize: 11, padding: 0, fontFamily: "inherit"
        }}>×</button>
        </span>
      )}
      <input value={text}
      onChange={(e) => setText(e.target.value)}
      onKeyDown={(e) => {if (e.key === "Enter" || e.key === ",") {e.preventDefault();add();}}}
      placeholder={chips.length === 0 ? "type host + ↵" : ""}
      style={{
        flex: 1, minWidth: 120, height: 24, padding: "0 6px",
        background: "transparent", border: 0, outline: "none",
        color: "#cdd6e2", fontFamily: "'Geist Mono', monospace", fontSize: 12
      }} />
    </div>);

}

// ─── STEP 1 — Engagement & Scope ─────────────────────────────────────────────
function EwStep1({ form, set, accent }) {
  const ROE_CLAUSES = [
  { id: "noexpl", l: "No exploitation past minimal PoC", default: true },
  { id: "nodos", l: "No DoS or volumetric scans", default: true },
  { id: "noeng", l: "No social engineering", default: true },
  { id: "noexfil", l: "No data exfiltration beyond proof", default: true },
  { id: "notify", l: "Notify SOC before active scans", default: true },
  { id: "hours", l: "Test only after business hours (17:00–09:00 UTC)", default: false },
  { id: "screcord", l: "Screen-record all interactive sessions", default: false }];

  return (
    <div>
      <div style={{ fontSize: 18, fontWeight: 700, color: "#e5edf7", marginBottom: 4 }}>Engagement & Scope</div>
      <div style={{ fontSize: 12, color: "#7d8aa1", marginBottom: 22 }}>What is being tested, when, and where can the agent operate.</div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, marginBottom: 16 }}>
        <EwField label="Client / engagement name" span={2}>
          <EwInput value={form.name} onChange={(v) => set("name", v)} />
        </EwField>
        <EwField label="Project code" hint="auto-suggest">
          <EwInput value={form.code} onChange={(v) => set("code", v)} mono />
        </EwField>

        <EwField label="Engagement type">
          <select value={form.type} onChange={(e) => {
              const newType = e.target.value;
              set("type", newType);
              const mid = window.ENGAGEMENT_METHODOLOGY[newType];
              if (mid) set("methodology", mid);
            }} style={{
            height: 34, padding: "0 12px", background: "#0d1218",
            border: "1px solid #1c2330", borderRadius: 6, color: "#e5edf7",
            fontFamily: "inherit", fontSize: 13, outline: "none", appearance: "none"
          }}>
            <option>Public Web Application</option>
            <option>Internal Web Application</option>
            <option>Cloud Web Application</option>
            <option>Active Directory</option>
            <option>Internal Network / Hosts</option>
            <option>Asset Discovery &amp; ID</option>
            <option>Incident Investigation</option>
            <option>Authenticated / SSO</option>
          </select>
        </EwField>
        <EwField label="Start date">
          <EwInput value={form.start} onChange={(v) => set("start", v)} mono />
        </EwField>
        <EwField label="End date">
          <EwInput value={form.end} onChange={(v) => set("end", v)} mono />
        </EwField>

        <EwField label="Assessor name">
          <EwInput value={form.assessor} onChange={(v) => set("assessor", v)} />
        </EwField>
        <EwField label="Conducting team" hint="default" span={2}>
          <EwInput value={form.team} onChange={(v) => set("team", v)} />
        </EwField>

        <EwField label="Description / objectives" span={3}>
          <EwTextarea value={form.description} onChange={(v) => set("description", v)} rows={3} />
        </EwField>
      </div>

      <div style={{ height: 1, background: "#1c2330", margin: "18px 0" }} />

      <div style={{ fontSize: 13, fontWeight: 600, color: "#e5edf7", marginBottom: 12 }}>Scope</div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 16 }}>
        <EwField label="In-scope hosts" hint={`${form.inScope.length} hosts`}>
          <EwChipInput chips={form.inScope} onChange={(v) => set("inScope", v)} accent={accent} />
        </EwField>
        <EwField label="Out-of-scope · do not touch" hint={`${form.outScope.length} hosts`}>
          <EwChipInput chips={form.outScope} onChange={(v) => set("outScope", v)} accent={accent} danger />
        </EwField>
      </div>

      <div style={{ fontSize: 13, fontWeight: 600, color: "#e5edf7", marginBottom: 8 }}>Rules of Engagement</div>
      <div style={{ fontSize: 11, color: "#7d8aa1", marginBottom: 12 }}>These clauses are passed into the agent's system prompt and enforced before every tool call.</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        {ROE_CLAUSES.map((c) =>
        <label key={c.id} style={{
          display: "flex", alignItems: "center", gap: 10, padding: "8px 10px",
          background: c.default ? `${accent}10` : "#0d1218",
          border: `1px solid ${c.default ? accent + "44" : "#1c2330"}`,
          borderRadius: 6, cursor: "default", fontSize: 12, color: "#cdd6e2"
        }}>
            <div style={{
            width: 16, height: 16, borderRadius: 4, flexShrink: 0,
            background: c.default ? accent : "transparent",
            border: c.default ? `1px solid ${accent}` : "1px solid #3a445a",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "#0a0e14", fontSize: 10, fontWeight: 700
          }}>{c.default ? "✓" : ""}</div>
            <span>{c.l}</span>
          </label>
        )}
      </div>
    </div>);

}

// ─── STEP 2 — Methodology ────────────────────────────────────────────────────
function EwStep2({ form, set, accent }) {
  const selected = window.METHODOLOGIES.find((m) => m.id === form.methodology) || window.METHODOLOGIES[0];
  return (
    <div>
      <div style={{ fontSize: 18, fontWeight: 700, color: "#e5edf7", marginBottom: 4 }}>Methodology</div>
      <div style={{ fontSize: 12, color: "#7d8aa1", marginBottom: 22 }}>Pick a playbook — it drives the agent's plan template, step list, and finding mapping.</div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: 22 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {window.METHODOLOGIES.map((m) => {
            const on = m.id === form.methodology;
            return (
              <div key={m.id} onClick={() => set("methodology", m.id)} style={{
                padding: 12, borderRadius: 8, cursor: "default",
                background: on ? `${accent}12` : "#0d1218",
                border: `1px solid ${on ? accent : "#1c2330"}`,
                display: "flex", flexDirection: "column", gap: 5,
                position: "relative"
              }}>
                {on &&
                <div style={{
                  position: "absolute", top: 8, right: 8,
                  width: 18, height: 18, borderRadius: "50%", background: accent,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: "#0a0e14", fontSize: 11, fontWeight: 700
                }}>✓</div>
                }
                <div style={{ fontSize: 9, color: "#5a6479", letterSpacing: 1, fontFamily: "'Geist Mono', monospace" }}>{m.id.toUpperCase()}</div>
                <div style={{ fontSize: 13.5, color: "#e5edf7", fontWeight: 600 }}>{m.name}</div>
                <div style={{ fontSize: 11, color: "#7d8aa1" }}>{m.profile}</div>
                <div style={{ fontSize: 10, color: "#5a6479", marginTop: 3 }}>
                  {m.steps > 0 ? `${m.steps} step categories` : "build your own"}
                </div>
              </div>);

          })}
        </div>

        {/* Right preview */}
        <div style={{
          padding: 16, background: "#101620",
          border: "1px solid #1c2330", borderRadius: 8,
          display: "flex", flexDirection: "column", gap: 10,
          alignSelf: "flex-start"
        }}>
          <div style={{ fontSize: 10, color: "#5a6479", letterSpacing: 1 }}>PREVIEW</div>
          <div style={{ fontSize: 14, color: "#e5edf7", fontWeight: 600 }}>{selected.name}</div>
          <div style={{ fontSize: 11, color: "#7d8aa1" }}>{selected.profile}</div>
          <div style={{ height: 1, background: "#1c2330" }} />
          <div style={{ fontSize: 10, color: "#5a6479", letterSpacing: 1 }}>STEP CHECKLIST</div>
          {(() => {
            const steps = (window.PLAYBOOK_BY_KEY || {})[selected.playbook] || [];
            if (selected.playbook === "CUSTOM" || steps.length === 0) {
              return (
                <div style={{ padding: 12, background: "#0d1218", borderRadius: 6, fontSize: 11, color: "#7d8aa1", textAlign: "center" }}>
                  {selected.playbook === "CUSTOM"
                    ? "Build your own step list after creating the engagement."
                    : "Step checklist will load when this playbook is selected."}
                </div>
              );
            }
            return (
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                {steps.map((s) => (
                  <div key={s.code} style={{ display: "flex", gap: 6, alignItems: "center", fontSize: 11 }}>
                    <span style={{ width: 16, height: 16, borderRadius: 3, background: "#1c2330", color: "#7d8aa1", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontFamily: "'Geist Mono', monospace" }}>○</span>
                    <span style={{ fontSize: 9, color: "#5a6479", fontFamily: "'Geist Mono', monospace", width: 78 }}>{s.code}</span>
                    <span style={{ color: "#cdd6e2", flex: 1 }}>{s.name}</span>
                  </div>
                ))}
              </div>
            );
          })()}
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "#7d8aa1", marginTop: 4 }}>
            <span>findings auto-map to step categories</span>
            <a style={{ color: accent }}>edit ↗</a>
          </div>
        </div>
      </div>
    </div>);

}

// ─── STEP 3 — Documents & Contacts ───────────────────────────────────────────
function EwStep3({ form, set, accent }) {
  return (
    <div>
      <div style={{ fontSize: 18, fontWeight: 700, color: "#e5edf7", marginBottom: 4 }}>Documents & Contacts</div>
      <div style={{ fontSize: 12, color: "#7d8aa1", marginBottom: 22 }}>Upload TSDs, architecture diagrams, signed RoE. List system owners — they get pulled into the final report.</div>

      <div style={{ fontSize: 13, fontWeight: 600, color: "#e5edf7", marginBottom: 8 }}>Reference documents</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 12 }}>
        {form.docs.map((d, i) =>
        <div key={i} style={{
          padding: 12, background: "#0d1218",
          border: "1px solid #1c2330", borderRadius: 8,
          display: "flex", flexDirection: "column", gap: 6
        }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{
              fontSize: 9, color: accent, padding: "1px 6px",
              border: `1px solid ${accent}55`, borderRadius: 3, letterSpacing: 0.6
            }}>{d.kind}</span>
              <div style={{ flex: 1 }} />
              <span style={{ fontSize: 9, color: "#34d399" }}>● uploaded</span>
            </div>
            <div style={{ fontSize: 12, color: "#e5edf7", fontFamily: "'Geist Mono', monospace", wordBreak: "break-all" }}>{d.name}</div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "#7d8aa1" }}>
              <span>{d.size}</span>
              <span style={{ color: "#5a6479" }}>preview ↗</span>
            </div>
          </div>
        )}
        {/* Drop zone */}
        <div style={{
          padding: 16, background: "rgba(34,211,238,0.04)",
          border: `2px dashed ${accent}55`, borderRadius: 8,
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6,
          cursor: "default"
        }}>
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke={accent} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M11 4v10" />
            <path d="M6 9l5-5 5 5" />
            <path d="M4 16v2h14v-2" />
          </svg>
          <div style={{ fontSize: 12, color: "#e5edf7", fontWeight: 500 }}>Drop or browse</div>
          <div style={{ fontSize: 10, color: "#7d8aa1", textAlign: "center" }}>PDF · DOCX · MD · XLSX<br />used by agent for context</div>
        </div>
      </div>

      <div style={{ display: "flex", gap: 6, marginBottom: 22, fontSize: 10, color: "#7d8aa1" }}>
        <span style={{ padding: "2px 7px", background: "#1c2330", borderRadius: 3 }}>+ TSD</span>
        <span style={{ padding: "2px 7px", background: "#1c2330", borderRadius: 3 }}>+ Arch diagram</span>
        <span style={{ padding: "2px 7px", background: "#1c2330", borderRadius: 3 }}>+ Past report</span>
        <span style={{ padding: "2px 7px", background: "#1c2330", borderRadius: 3 }}>+ Data classification</span>
        <span style={{ padding: "2px 7px", background: "#1c2330", borderRadius: 3 }}>+ Auth credentials</span>
      </div>

      <div style={{ fontSize: 13, fontWeight: 600, color: "#e5edf7", marginBottom: 8 }}>System owners & contacts</div>
      <div style={{
        background: "#0d1218", border: "1px solid #1c2330", borderRadius: 8, overflow: "hidden"
      }}>
        <div style={{
          display: "grid", gridTemplateColumns: "1fr 1.2fr 1.5fr 80px 80px 40px",
          padding: "8px 14px", borderBottom: "1px solid #1c2330", fontSize: 10,
          color: "#5a6479", letterSpacing: 0.5, textTransform: "uppercase"
        }}>
          <span>Name</span><span>Role</span><span>Email</span><span>Primary</span><span>On-call</span><span></span>
        </div>
        {form.contacts.map((c, i) =>
        <div key={i} style={{
          display: "grid", gridTemplateColumns: "1fr 1.2fr 1.5fr 80px 80px 40px",
          padding: "10px 14px", borderBottom: "1px solid #131922",
          alignItems: "center", fontSize: 12, color: "#cdd6e2"
        }}>
            <span style={{ color: "#e5edf7" }}>{c.name}</span>
            <span style={{ color: "#7d8aa1" }}>{c.role}</span>
            <span style={{ color: "#7d8aa1", fontFamily: "'Geist Mono', monospace", fontSize: 11 }}>{c.email}</span>
            <span style={{ color: c.primary ? "#34d399" : "#3a445a" }}>{c.primary ? "✓" : "—"}</span>
            <span style={{ color: c.oncall ? "#34d399" : "#3a445a" }}>{c.oncall ? "✓" : "—"}</span>
            <span style={{ color: "#5a6479", textAlign: "center" }}>⋯</span>
          </div>
        )}
        <div style={{
          padding: "10px 14px", color: accent, fontSize: 12, cursor: "default"
        }}>+ Add contact</div>
      </div>
    </div>);

}

// ─── STEP 4 — Agent & Review ─────────────────────────────────────────────────
function EwStep4({ form, set, accent }) {
  return (
    <div>
      <div style={{ fontSize: 18, fontWeight: 700, color: "#e5edf7", marginBottom: 4 }}>Agent & Models</div>
      <div style={{ fontSize: 12, color: "#7d8aa1", marginBottom: 22 }}>Pick your providers, set the default autonomy. All can be overridden per-turn.</div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 18 }}>
        <EwField label="Primary model · reasoning + planning">
          <select value={form.primaryModel} onChange={(e) => set("primaryModel", e.target.value)} style={{
            height: 34, padding: "0 12px", background: "#0d1218", border: "1px solid #1c2330",
            borderRadius: 6, color: "#e5edf7", fontFamily: "inherit", fontSize: 13, outline: "none", appearance: "none"
          }}>
            <option>claude-sonnet-4.5</option>
            <option>claude-opus-4.5</option>
            <option>claude-haiku-4.5</option>
            <option>gpt-4o-2024-12-XX</option>
            <option>gpt-5-pro</option>
            <option>gemini-2.0-pro</option>
            <option>local · llama3.1-70b</option>
          </select>
        </EwField>
        <EwField label="Local fallback · tool I/O + air-gap">
          <select value={form.localModel} onChange={(e) => set("localModel", e.target.value)} style={{
            height: 34, padding: "0 12px", background: "#0d1218", border: "1px solid #1c2330",
            borderRadius: 6, color: "#e5edf7", fontFamily: "inherit", fontSize: 13, outline: "none", appearance: "none"
          }}>
            <option>qwen2.5-coder:32b · ollama</option>
            <option>llama3.1-70b · ollama</option>
            <option>deepseek-coder:33b · ollama</option>
            <option>none — cloud only</option>
          </select>
        </EwField>
      </div>

      <EwField label="Routing policy">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 18 }}>
          {[
          { id: "policy", l: "Policy-routed", sub: "Cloud for reasoning, local for tool I/O" },
          { id: "cloud", l: "Cloud-only", sub: "All turns hit the primary model" },
          { id: "airgap", l: "Air-gapped", sub: "All turns local · no external calls" }].
          map((p) => {
            const on = form.routerPolicy === p.id;
            return (
              <div key={p.id} onClick={() => set("routerPolicy", p.id)} style={{
                padding: 11, borderRadius: 8, cursor: "default",
                background: on ? `${accent}12` : "#0d1218",
                border: `1px solid ${on ? accent : "#1c2330"}`
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
                  <div style={{
                    width: 14, height: 14, borderRadius: "50%", flexShrink: 0,
                    background: on ? accent : "transparent",
                    border: `1.5px solid ${on ? accent : "#3a445a"}`,
                    display: "flex", alignItems: "center", justifyContent: "center"
                  }}>
                    {on && <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#0a0e14" }} />}
                  </div>
                  <span style={{ fontSize: 12.5, color: "#e5edf7", fontWeight: 600 }}>{p.l}</span>
                </div>
                <div style={{ fontSize: 10.5, color: "#7d8aa1", paddingLeft: 20 }}>{p.sub}</div>
              </div>);

          })}
        </div>
      </EwField>

      <EwField label="Default autonomy">
        <div style={{ display: "flex", gap: 6 }}>
          {[
          { id: "passive", l: "Passive", sub: "approve every step" },
          { id: "review", l: "Review", sub: "approve risky steps" },
          { id: "auto", l: "Autopilot", sub: "RoE-constrained" }].
          map((a) => {
            const on = form.autonomy === a.id;
            return (
              <div key={a.id} onClick={() => set("autonomy", a.id)} style={{
                flex: 1, padding: "8px 10px", borderRadius: 6, cursor: "default",
                background: on ? `${accent}12` : "#0d1218",
                border: `1px solid ${on ? accent : "#1c2330"}`,
                display: "flex", flexDirection: "column", gap: 2
              }}>
                <span style={{ fontSize: 12, color: "#e5edf7", fontWeight: 600 }}>{a.l}</span>
                <span style={{ fontSize: 10, color: "#7d8aa1" }}>{a.sub}</span>
              </div>);

          })}
        </div>
      </EwField>

      <div style={{ height: 1, background: "#1c2330", margin: "18px 0" }} />

      {/* Tools — Kali / Linux inventory */}
      <EwToolsSection form={form} set={set} accent={accent} />

      <div style={{ height: 1, background: "#1c2330", margin: "18px 0" }} />

      {/* Review summary */}
      <div style={{ fontSize: 13, fontWeight: 600, color: "#e5edf7", marginBottom: 12 }}>Review</div>
      <div style={{
        background: "#101620", border: "1px solid #1c2330", borderRadius: 8, padding: 16,
        display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, fontSize: 12
      }}>
        <div>
          <div style={{ fontSize: 9, color: "#5a6479", letterSpacing: 0.8, marginBottom: 4 }}>ENGAGEMENT</div>
          <div style={{ color: "#e5edf7" }}>{form.name}</div>
          <div style={{ color: "#7d8aa1", fontFamily: "'Geist Mono', monospace", fontSize: 11 }}>{form.code}</div>
          <div style={{ color: "#7d8aa1", marginTop: 2, fontSize: 11 }}>{form.type}</div>
        </div>
        <div>
          <div style={{ fontSize: 9, color: "#5a6479", letterSpacing: 0.8, marginBottom: 4 }}>ASSESSOR</div>
          <div style={{ color: "#e5edf7" }}>{form.assessor}</div>
          <div style={{ color: "#7d8aa1", fontSize: 11, marginTop: 2 }}>{form.team}</div>
        </div>
        <div>
          <div style={{ fontSize: 9, color: "#5a6479", letterSpacing: 0.8, marginBottom: 4 }}>WINDOW</div>
          <div style={{ color: "#e5edf7", fontFamily: "'Geist Mono', monospace", fontSize: 11 }}>{form.start} → {form.end}</div>
          <div style={{ color: "#7d8aa1", fontSize: 11, marginTop: 2 }}>14 days · ~5 working days/wk</div>
        </div>
        <div>
          <div style={{ fontSize: 9, color: "#5a6479", letterSpacing: 0.8, marginBottom: 4 }}>METHODOLOGY</div>
          <div style={{ color: "#e5edf7" }}>{(window.METHODOLOGIES.find((m) => m.id === form.methodology) || {}).name}</div>
          <div style={{ color: "#7d8aa1", fontSize: 11 }}>{(window.METHODOLOGIES.find((m) => m.id === form.methodology) || {}).profile}</div>
        </div>
        <div>
          <div style={{ fontSize: 9, color: "#5a6479", letterSpacing: 0.8, marginBottom: 4 }}>SCOPE</div>
          <div style={{ color: "#e5edf7" }}>{form.inScope.length} hosts in</div>
          <div style={{ color: "#7d8aa1", fontSize: 11 }}>{form.outScope.length} explicit out · 5 RoE clauses</div>
        </div>
        <div>
          <div style={{ fontSize: 9, color: "#5a6479", letterSpacing: 0.8, marginBottom: 4 }}>AGENT</div>
          <div style={{ color: "#e5edf7", fontFamily: "'Geist Mono', monospace", fontSize: 11 }}>{form.primaryModel}</div>
          <div style={{ color: "#7d8aa1", fontSize: 11 }}>↔ {form.localModel.split(" ")[0]} · {form.routerPolicy}</div>
        </div>
        <div>
          <div style={{ fontSize: 9, color: "#5a6479", letterSpacing: 0.8, marginBottom: 4 }}>SAFETY</div>
          <div style={{ color: "#e5edf7", textTransform: "capitalize" }}>{form.autonomy}</div>
          <div style={{ color: "#7d8aa1", fontSize: 11 }}>{window.KALI_TOOLS.length - form.disabledTools.length} of {window.KALI_TOOLS.length} tools enabled</div>
        </div>
      </div>
    </div>);

}

// ─── Tools section — Kali / Linux tool inventory ─────────────────────────────
// Toggle individual tools on/off for the engagement. Some are disabled by
// default (internal-net tools when scoping external).
function EwToolsSection({ form, set, accent }) {
  const all = window.KALI_TOOLS;
  const disabledSet = new Set(form.disabledTools || []);
  // Group by category
  const groups = {};
  all.forEach((t) => {(groups[t.cat] = groups[t.cat] || []).push(t);});

  const toggle = (id) => {
    const next = new Set(disabledSet);
    next.has(id) ? next.delete(id) : next.add(id);
    set("disabledTools", Array.from(next));
  };

  const enabledCount = all.length - disabledSet.size;

  return (
    <div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 4 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: "#e5edf7" }}>Enabled tools</div>
        <div style={{ fontSize: 11, color: "#7d8aa1" }}>
          {enabledCount} of {all.length} active · disable any tool to keep the agent off it for this engagement
        </div>
        <div style={{ flex: 1 }} />
        <button onClick={() => set("disabledTools", [])} style={{
          padding: "4px 10px", background: "transparent", color: accent,
          border: `1px solid ${accent}55`, borderRadius: 4, fontSize: 10, fontFamily: "inherit", cursor: "default"
        }}>Enable all</button>
        <button onClick={() => set("disabledTools", all.filter((t) => !t.externalOK).map((t) => t.id))} style={{
          padding: "4px 10px", background: "transparent", color: "#7d8aa1",
          border: "1px solid #1c2330", borderRadius: 4, fontSize: 10, fontFamily: "inherit", cursor: "default"
        }}>Reset to defaults</button>
      </div>

      <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 14 }}>
        {Object.entries(groups).map(([cat, tools]) =>
        <div key={cat}>
            <div style={{ fontSize: 10, color: "#5a6479", letterSpacing: 0.8, marginBottom: 6 }}>{cat.toUpperCase()}</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 6 }}>
              {tools.map((t) => {
              const on = !disabledSet.has(t.id);
              return (
                <div key={t.id} onClick={() => toggle(t.id)} style={{
                  padding: "8px 10px", borderRadius: 6, cursor: "default",
                  background: on ? `${accent}10` : "#0d1218",
                  border: `1px solid ${on ? accent + "55" : "#1c2330"}`,
                  display: "flex", flexDirection: "column", gap: 3,
                  opacity: on ? 1 : 0.6
                }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <div style={{
                      width: 12, height: 12, borderRadius: 3, flexShrink: 0,
                      background: on ? accent : "transparent",
                      border: `1.5px solid ${on ? accent : "#3a445a"}`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 9, color: "#0a0e14", fontWeight: 700
                    }}>{on ? "✓" : ""}</div>
                      <span style={{ fontSize: 12, color: "#e5edf7", fontFamily: "'Geist Mono', monospace", fontWeight: 600 }}>{t.label}</span>
                      <span style={{ fontSize: 9, color: "#5a6479", fontFamily: "'Geist Mono', monospace" }}>v{t.v}</span>
                    </div>
                    <span style={{ fontSize: 10.5, color: "#7d8aa1", paddingLeft: 18, lineHeight: 1.3 }}>{t.desc}</span>
                  </div>);

            })}
            </div>
          </div>
        )}
      </div>

      <div style={{
        marginTop: 14, padding: "8px 10px",
        background: "rgba(122,182,224,0.06)", border: "1px solid #7ab6e044",
        borderRadius: 6, fontSize: 11, color: "#aacde6", lineHeight: 1.5,
        display: "flex", gap: 8, alignItems: "flex-start"
      }}>
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="#7ab6e0" strokeWidth="1.5" style={{ flexShrink: 0, marginTop: 1 }}>
          <circle cx="7" cy="7" r="5.5" />
          <path d="M7 6.5v3M7 4.5v.01" strokeLinecap="round" />
        </svg>
        <span>
          The agent only calls the tools enabled here. Disabling a tool the agent <i>wants</i> to use surfaces a "tool unavailable" notice in the stream — you can re-enable it from the running engagement.
          Internal-network tools (responder, bloodhound, impacket, crackmapexec) default off for external engagements.
        </span>
      </div>
    </div>);

}

Object.assign(window, { EngagementWizard });