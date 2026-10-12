const styles = `
:root {
  --ink: #f0f7fa;
  --muted: #8da3b0;
  --faint: #506575;
  --bg-deep: #050c14;
  --bg-surface: #0a1826;
  --bg-card: rgba(13, 27, 42, 0.78);
  --glass-bg: rgba(9, 21, 33, 0.88);
  --line: rgba(145, 180, 195, 0.14);
  --line-glow: rgba(66, 224, 211, 0.3);
  --cyan: #00f2fe;
  --cyan-mint: #42e0d3;
  --cyan-deep: #0ea5e9;
  --blue: #3b82f6;
  --amber: #f59e0b;
  --red: #f43f5e;
  --green: #10b981;
  --font-sans: 'Outfit', 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  --font-mono: 'JetBrains Mono', 'DM Mono', monospace;
}

* { box-sizing: border-box; margin: 0; padding: 0; }

html, body {
  min-height: 100%;
  background: var(--bg-deep);
  color: var(--ink);
  font-family: var(--font-sans);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

body { font-size: 13px; line-height: 1.6; letter-spacing: 0.01em; }

button, select, input { font: inherit; color: inherit; }
button { cursor: pointer; border: none; background: transparent; }
button:focus-visible, select:focus-visible, input:focus-visible {
  outline: 2px solid var(--cyan-mint);
  outline-offset: 2px;
}

/* Custom Scrollbars */
::-webkit-scrollbar { width: 6px; height: 6px; }
::-webkit-scrollbar-track { background: var(--bg-deep); }
::-webkit-scrollbar-thumb { background: rgba(66, 224, 211, 0.25); border-radius: 3px; }
::-webkit-scrollbar-thumb:hover { background: var(--cyan-mint); }

.app-shell {
  min-height: 100vh;
  background: 
    radial-gradient(ellipse at 80% 0%, rgba(14, 165, 233, 0.12) 0%, transparent 50%),
    radial-gradient(ellipse at 20% 100%, rgba(0, 242, 254, 0.08) 0%, transparent 60%),
    var(--bg-deep);
  display: flex;
  flex-direction: column;
}

/* Header Topbar */
.topbar {
  height: 64px;
  padding: 0 24px;
  display: flex;
  align-items: center;
  gap: 28px;
  border-bottom: 1px solid var(--line);
  background: rgba(5, 12, 20, 0.92);
  backdrop-filter: blur(12px);
  z-index: 100;
}

.brand {
  display: flex;
  align-items: center;
  gap: 12px;
  color: var(--ink);
  text-decoration: none;
  min-width: 200px;
}

.brand-mark {
  display: flex;
  align-items: flex-end;
  gap: 3.5px;
  height: 24px;
  padding: 3px 5px;
  border: 1.5px solid var(--cyan-mint);
  border-radius: 4px;
  background: rgba(66, 224, 211, 0.1);
  box-shadow: 0 0 12px rgba(66, 224, 211, 0.25);
  transform: skewX(-8deg);
}

.brand-mark span {
  display: block;
  width: 3.5px;
  background: var(--cyan);
  border-radius: 1px;
}
.brand-mark span:nth-child(1) { height: 9px; }
.brand-mark span:nth-child(2) { height: 14px; }
.brand-mark span:nth-child(3) { height: 19px; }

.brand-text strong {
  display: block;
  font-size: 17px;
  font-weight: 800;
  letter-spacing: 0.12em;
  background: linear-gradient(135deg, #ffffff 40%, var(--cyan-mint));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  line-height: 1.1;
}

.brand-text small {
  display: block;
  color: var(--muted);
  font-family: var(--font-mono);
  font-size: 8.5px;
  letter-spacing: 0.18em;
}

.study-context {
  color: var(--cyan-mint);
  font-family: var(--font-mono);
  font-size: 10px;
  letter-spacing: 0.1em;
  display: flex;
  align-items: center;
  gap: 10px;
  background: rgba(66, 224, 211, 0.06);
  padding: 6px 12px;
  border: 1px solid rgba(66, 224, 211, 0.2);
  border-radius: 20px;
}

.live-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--green);
  box-shadow: 0 0 0 4px rgba(16, 185, 129, 0.2);
  animation: pulse-green 2s infinite;
}

@keyframes pulse-green {
  0%, 100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.4); }
  50% { box-shadow: 0 0 0 6px rgba(16, 185, 129, 0); }
}

.context-separator { color: var(--faint); }
.muted { color: var(--muted); }

.top-actions {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 14px;
}

.icon-button {
  width: 34px;
  height: 34px;
  border: 1px solid var(--line);
  background: rgba(13, 27, 42, 0.6);
  color: var(--muted);
  border-radius: 6px;
  font-size: 15px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.icon-button:hover {
  color: var(--cyan);
  border-color: var(--cyan-mint);
  background: rgba(66, 224, 211, 0.12);
  box-shadow: 0 0 10px rgba(66, 224, 211, 0.2);
}

.live-api-state {
  color: var(--muted);
  font-family: var(--font-mono);
  font-size: 9.5px;
  background: rgba(255, 255, 255, 0.04);
  padding: 5px 12px;
  border-radius: 20px;
  border: 1px solid var(--line);
  display: flex;
  align-items: center;
  gap: 6px;
}

.live-api-state b {
  color: var(--green);
  font-weight: 700;
}

.live-api-state.offline b {
  color: var(--red);
}

/* Workspace Layout & Collapsible Sidebar */
.workspace {
  flex: 1;
  display: grid;
  grid-template-columns: minmax(0, 1fr) 480px;
  transition: grid-template-columns 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  min-height: calc(100vh - 64px);
}

.workspace.sidebar-collapsed {
  grid-template-columns: minmax(0, 1fr) 0px;
}

.map-workspace {
  min-width: 0;
  display: flex;
  flex-direction: column;
  border-right: 1px solid var(--line);
}

.map-toolbar {
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  border-bottom: 1px solid var(--line);
  background: rgba(9, 21, 33, 0.7);
  backdrop-filter: blur(8px);
}

.map-title {
  display: flex;
  align-items: center;
  gap: 12px;
}

.map-title b {
  font-size: 13px;
  font-weight: 700;
  color: var(--ink);
}

.section-kicker {
  display: block;
  color: var(--muted);
  font-family: var(--font-mono);
  font-size: 9px;
  font-weight: 600;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

/* Navigation Tabs */
.tab-navigator {
  display: flex;
  gap: 6px;
  background: rgba(5, 12, 20, 0.6);
  padding: 3px;
  border-radius: 8px;
  border: 1px solid var(--line);
}

.tab-button {
  padding: 6px 14px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 600;
  color: var(--muted);
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 6px;
}

.tab-button:hover {
  color: var(--ink);
  background: rgba(255, 255, 255, 0.05);
}

.tab-button.active {
  color: #050c14;
  background: linear-gradient(135deg, var(--cyan) 0%, var(--cyan-mint) 100%);
  font-weight: 700;
  box-shadow: 0 0 12px rgba(66, 224, 211, 0.3);
}

.map-tools {
  display: flex;
  gap: 8px;
}

.map-tool {
  height: 32px;
  border: 1px solid var(--line);
  background: rgba(13, 27, 42, 0.7);
  border-radius: 6px;
  color: var(--muted);
  padding: 0 12px;
  font-size: 12px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 4px;
  transition: all 0.2s ease;
}

.map-tool:hover {
  color: var(--cyan);
  border-color: var(--cyan-mint);
  background: rgba(66, 224, 211, 0.1);
}

.map-tool span {
  font-family: var(--font-mono);
  font-size: 9px;
  color: var(--cyan-mint);
}

/* Leaflet Real Map Shell */
.map-canvas-wrapper {
  position: relative;
  height: 680px;
  min-height: 640px;
  flex: none;
  background: #0a1b28;
}

.real-map-shell {
  position: absolute;
  inset: 0;
  background: #091c27;
}

.leaflet-map {
  position: absolute;
  inset: 0;
  z-index: 1;
}

.leaflet-control-attribution {
  background: rgba(5, 12, 20, 0.85) !important;
  color: var(--muted) !important;
  font-family: var(--font-mono) !important;
  font-size: 9px !important;
  padding: 3px 8px !important;
  border-top-left-radius: 4px;
}

.leaflet-control-attribution a {
  color: var(--cyan-mint) !important;
}

/* Custom Floating Map Layer Controller */
.map-layer-control {
  position: absolute;
  z-index: 500;
  top: 18px;
  left: 18px;
  width: 220px;
  padding: 12px;
  background: rgba(7, 18, 28, 0.88);
  backdrop-filter: blur(14px);
  border: 1px solid rgba(66, 224, 211, 0.22);
  border-radius: 8px;
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.45);
}

.layer-control-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 8px;
  margin-bottom: 6px;
  border-bottom: 1px solid var(--line);
  color: var(--ink);
  font-family: var(--font-mono);
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.12em;
}

.layer-control-title span { color: var(--muted); }

.layer-toggle {
  width: 100%;
  display: grid;
  grid-template-columns: 10px 1fr auto;
  align-items: center;
  gap: 8px;
  padding: 7px 4px;
  border: 0;
  border-radius: 4px;
  background: transparent;
  color: var(--muted);
  text-align: left;
  font-size: 11px;
  font-weight: 500;
  transition: all 0.15s ease;
}

.layer-toggle:hover {
  color: var(--ink);
  background: rgba(255, 255, 255, 0.04);
}

.layer-toggle.active {
  color: var(--ink);
  font-weight: 600;
}

.layer-toggle i {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  opacity: 0.35;
}

.layer-toggle.active i {
  opacity: 1;
  box-shadow: 0 0 8px currentColor;
}

.layer-toggle b {
  font-family: var(--font-mono);
  font-size: 9px;
  color: var(--cyan-mint);
}

.layer-toggle.unavailable { opacity: 0.55; }
.layer-toggle.unavailable b { color: var(--muted); }

.map-status {
  position: absolute;
  top: 18px;
  right: 18px;
  z-index: 500;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  background: rgba(7, 18, 28, 0.88);
  backdrop-filter: blur(14px);
  border: 1px solid rgba(66, 224, 211, 0.25);
  border-radius: 8px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.35);
}

.status-icon {
  color: var(--green);
  font-size: 16px;
  font-weight: 800;
}

.map-status b {
  display: block;
  font-size: 11px;
  font-weight: 700;
  color: var(--ink);
}

.map-status small {
  display: block;
  color: var(--muted);
  font-family: var(--font-mono);
  font-size: 9px;
}

.map-provider-note {
  position: absolute;
  z-index: 500;
  bottom: 14px;
  left: 18px;
  padding: 5px 10px;
  background: rgba(5, 12, 20, 0.85);
  color: var(--muted);
  font-family: var(--font-mono);
  font-size: 9px;
  border-radius: 4px;
  border: 1px solid var(--line);
}

/* Control Center Panel */
.control-center {
  padding: 24px 28px;
  border-top: 1px solid var(--line);
  background: rgba(7, 18, 28, 0.95);
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.control-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}

.control-heading-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.control-heading b {
  font-size: 14px;
  font-weight: 700;
  color: var(--ink);
  letter-spacing: 0.02em;
}

.control-status {
  color: var(--cyan-mint);
  font-family: var(--font-mono);
  font-size: 10px;
  display: flex;
  align-items: center;
  gap: 6px;
}

.control-status i {
  display: inline-block;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--cyan-mint);
  box-shadow: 0 0 6px var(--cyan-mint);
}

.control-context {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 14px 18px;
  background: rgba(0, 242, 254, 0.04);
  border: 1px solid rgba(66, 224, 211, 0.2);
  border-left: 3.5px solid var(--cyan-mint);
  border-radius: 6px;
}

.control-context .context-kicker {
  color: var(--cyan-mint);
  font-family: var(--font-mono);
  font-size: 9px;
  letter-spacing: 0.12em;
  font-weight: 700;
}

.control-context b {
  font-size: 13px;
  font-weight: 700;
  color: var(--ink);
  line-height: 1.45;
  word-break: break-word;
}

.control-context small {
  color: var(--muted);
  font-size: 10.5px;
  line-height: 1.45;
}

/* Control Tab Steps */
.control-steps {
  display: flex;
  gap: 8px;
}

.control-steps button {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 9px 16px;
  border: 1px solid var(--line);
  background: rgba(13, 27, 42, 0.6);
  color: var(--muted);
  border-radius: 6px;
  font-size: 11px;
  font-weight: 700;
  transition: all 0.2s ease;
}

.control-steps button:hover {
  color: var(--ink);
  background: rgba(255, 255, 255, 0.04);
}

.control-steps button.active {
  color: var(--ink);
  border-color: var(--cyan-mint);
  background: rgba(66, 224, 211, 0.12);
  box-shadow: 0 0 10px rgba(66, 224, 211, 0.15);
}

.control-steps i {
  font-family: var(--font-mono);
  font-size: 9.5px;
  color: var(--cyan-mint);
  font-style: normal;
}

.control-evidence-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
}

.evidence-item {
  padding: 12px 16px;
  background: rgba(13, 27, 42, 0.6);
  border: 1px solid var(--line);
  border-radius: 6px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.evidence-item span {
  display: block;
  color: var(--muted);
  font-size: 10px;
  font-weight: 500;
}

.evidence-item b {
  display: block;
  margin: 8px 0 6px;
  font-family: var(--font-mono);
  font-size: 15px;
  font-weight: 700;
  color: var(--cyan);
  letter-spacing: 0.02em;
}

.evidence-item b.evidence-alert { color: var(--amber); }

.evidence-item small {
  display: block;
  color: var(--faint);
  font-family: var(--font-mono);
  font-size: 9px;
  line-height: 1.4;
}

.control-observe {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.alert-strip {
  margin-top: 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: rgba(244, 63, 94, 0.08);
  border: 1px solid rgba(244, 63, 94, 0.25);
  border-radius: 6px;
  color: #fca5a5;
  font-size: 11px;
}

.alert-strip > span:first-child {
  display: grid;
  place-items: center;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: rgba(244, 63, 94, 0.2);
  color: var(--red);
  font-weight: 800;
  flex-shrink: 0;
}

.alert-strip em {
  margin-left: auto;
  color: var(--red);
  font-family: var(--font-mono);
  font-size: 9px;
  font-style: normal;
  font-weight: 700;
}

.decision-review {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 14px;
  flex-wrap: wrap;
}

.decision-review button {
  padding: 7px 14px;
  border: 1px solid var(--cyan-mint);
  background: rgba(66, 224, 211, 0.08);
  color: var(--cyan-mint);
  border-radius: 6px;
  font-size: 10.5px;
  font-weight: 600;
  white-space: nowrap;
}

.decision-review span {
  color: var(--muted);
  font-size: 11px;
  line-height: 1.4;
  word-break: break-word;
}

/* Authority Card & Execution Card */
.authority-card, .execution-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  background: rgba(13, 27, 42, 0.6);
  border: 1px solid rgba(244, 63, 94, 0.25);
  border-radius: 6px;
  gap: 16px;
}

.authority-card-info, .execution-card-info {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
}

.authority-card-info b, .execution-card-info b {
  display: block;
  font-size: 13.5px;
  font-weight: 700;
  color: var(--ink);
  line-height: 1.35;
  margin: 2px 0;
}

.authority-card-info small, .execution-card-info small {
  display: block;
  color: var(--muted);
  font-size: 10.5px;
  line-height: 1.45;
}

.authority-card strong {
  color: var(--red);
  font-family: var(--font-mono);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.05em;
  flex-shrink: 0;
}

.decision-actions, .act-actions {
  display: flex;
  gap: 10px;
  margin-top: 14px;
}

.decision-actions button, .act-actions button {
  flex: 1;
  height: 36px;
  border: 1px solid rgba(244, 63, 94, 0.3);
  background: rgba(244, 63, 94, 0.08);
  color: #fca5a5;
  border-radius: 6px;
  font-size: 11.5px;
  font-weight: 600;
  transition: all 0.2s ease;
}

.decision-actions button:disabled, .act-actions button:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.execution-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--red);
  box-shadow: 0 0 0 4px rgba(244, 63, 94, 0.15);
  flex-shrink: 0;
}

.replay-button {
  border-color: var(--cyan-mint) !important;
  background: rgba(66, 224, 211, 0.08) !important;
  color: var(--cyan-mint) !important;
}

.replay-log {
  display: grid;
  gap: 4px;
  padding: 12px;
  margin-top: 10px;
  background: rgba(5, 12, 20, 0.8);
  border: 1px dashed var(--line);
  border-radius: 6px;
  font-size: 10px;
}

.replay-log span {
  color: var(--red);
  font-family: var(--font-mono);
  font-weight: 700;
}

.replay-log small { color: var(--muted); }

.control-footer {
  padding-top: 16px;
  border-top: 1px solid var(--line);
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.scenario-inline {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}

.scenario-field {
  display: flex;
  align-items: center;
  gap: 8px;
}

.scenario-inline label {
  color: var(--muted);
  font-family: var(--font-mono);
  font-size: 10px;
  text-transform: uppercase;
}

.scenario-inline select {
  height: 36px;
  min-width: 200px;
  background: rgba(13, 27, 42, 0.8);
  color: var(--ink);
  border: 1px solid var(--line);
  border-radius: 6px;
  padding: 0 12px;
  font-size: 11.5px;
}

.scenario-inline input {
  width: 110px;
  accent-color: var(--cyan-mint);
}

.scenario-inline output {
  color: var(--cyan);
  font-family: var(--font-mono);
  font-weight: 700;
}

.run-button {
  height: 36px;
  border-radius: 6px;
  background: linear-gradient(135deg, var(--cyan) 0%, var(--cyan-mint) 100%);
  color: #050c14;
  padding: 0 18px;
  font-size: 11.5px;
  font-weight: 800;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.2s ease;
  box-shadow: 0 0 12px rgba(66, 224, 211, 0.25);
  margin-left: auto;
}

.run-button:hover {
  transform: translateY(-1px);
  box-shadow: 0 0 18px rgba(66, 224, 211, 0.4);
}

.control-readout {
  display: flex;
  gap: 14px;
  align-items: center;
  padding-top: 14px;
  border-top: 1px solid var(--line);
}

.readout-icon {
  color: var(--cyan);
  font-size: 22px;
  flex-shrink: 0;
}

.control-readout b {
  display: block;
  font-size: 12.5px;
  font-weight: 700;
  color: var(--ink);
}

.control-readout small {
  display: block;
  color: var(--muted);
  font-size: 11px;
  line-height: 1.45;
  margin-top: 2px;
}

/* Intelligence Panel (Right Sidebar) */
.intelligence-panel {
  background: rgba(9, 21, 33, 0.95);
  overflow-y: auto;
  border-left: 1px solid var(--line);
  display: flex;
  flex-direction: column;
  transition: opacity 0.25s ease;
}

.workspace.sidebar-collapsed .intelligence-panel {
  display: none;
}

.panel-heading {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 24px 24px 12px;
}

.panel-heading h1 {
  font-size: 20px;
  font-weight: 800;
  margin-top: 4px;
  background: linear-gradient(135deg, #ffffff 40%, var(--cyan-mint));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.brief-meta {
  padding: 0 24px 18px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.confidence-badge, .updated, .signal-count {
  font-family: var(--font-mono);
  font-size: 9px;
  font-weight: 600;
  letter-spacing: 0.08em;
}

.confidence-badge { color: var(--cyan-mint); }
.updated { color: var(--faint); }

.selected-context {
  margin: 0 24px 16px;
  padding: 12px 16px;
  border: 1px solid rgba(66, 224, 211, 0.25);
  border-left: 3.5px solid var(--cyan-mint);
  background: rgba(0, 242, 254, 0.04);
  border-radius: 6px;
}

.selected-context b {
  display: block;
  margin-top: 4px;
  font-size: 13px;
  font-weight: 700;
  color: var(--ink);
}

.selected-context small {
  display: block;
  margin-top: 4px;
  color: var(--muted);
  font-size: 10.5px;
  line-height: 1.45;
}

/* KPI Status Badges */
.status-tag {
  display: inline-block;
  padding: 2px 7px;
  border-radius: 4px;
  font-family: var(--font-mono);
  font-size: 8.5px;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.tag-verified { background: rgba(16, 185, 129, 0.15); color: var(--green); border: 1px solid rgba(16, 185, 129, 0.3); }
.tag-flagged { background: rgba(244, 63, 94, 0.15); color: var(--red); border: 1px solid rgba(244, 63, 94, 0.3); }
.tag-pending { background: rgba(245, 158, 11, 0.15); color: var(--amber); border: 1px solid rgba(245, 158, 11, 0.3); }
.tag-unavailable { background: rgba(141, 163, 176, 0.12); color: var(--muted); border: 1px solid rgba(141, 163, 176, 0.2); }

.metric-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1px;
  background: var(--line);
  border-block: 1px solid var(--line);
}

.metric-card {
  background: rgba(9, 21, 33, 0.9);
  padding: 16px;
  min-height: 94px;
  transition: background 0.2s ease;
}

.metric-card:hover {
  background: rgba(13, 27, 42, 0.95);
}

.metric-card span {
  display: block;
  color: var(--muted);
  font-size: 10.5px;
  font-weight: 500;
}

.metric-card strong {
  display: block;
  font-family: var(--font-mono);
  font-size: 22px;
  font-weight: 700;
  margin: 6px 0 2px;
  color: var(--ink);
}

.metric-card small {
  display: block;
  color: var(--muted);
  font-family: var(--font-mono);
  font-size: 9px;
}

.trend-flat { color: var(--cyan-mint); font-style: normal; }
.metric-card.warning strong { color: var(--amber); }

.panel-section {
  padding: 20px 24px;
  border-bottom: 1px solid var(--line);
}

.section-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 13px;
  font-weight: 700;
  margin-bottom: 16px;
}

.text-button {
  border: 0;
  background: none;
  color: var(--cyan-mint);
  font-size: 10.5px;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  transition: color 0.2s ease;
}

.text-button:hover {
  color: var(--cyan);
  text-decoration: underline;
}

.route-summary {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
}

.route-summary div b {
  display: block;
  font-family: var(--font-mono);
  font-size: 18px;
  font-weight: 700;
}

.route-summary div span {
  display: block;
  color: var(--muted);
  font-size: 9.5px;
  margin-top: 2px;
}

.route-bar {
  flex: 1;
  height: 5px;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 3px;
  margin: 0 16px;
  overflow: hidden;
}

.route-bar span {
  display: block;
  width: 72%;
  height: 100%;
  background: linear-gradient(90deg, var(--cyan-mint), var(--cyan));
  border-radius: 3px;
}

.route-list {
  border-top: 1px solid var(--line);
}

.route-row {
  width: 100%;
  border: 0;
  border-bottom: 1px solid var(--line);
  background: transparent;
  display: grid;
  grid-template-columns: 10px 1fr auto 12px;
  align-items: center;
  gap: 10px;
  text-align: left;
  padding: 12px 0;
  color: var(--muted);
  transition: all 0.2s ease;
}

.route-row:hover, .route-row.selected {
  color: var(--ink);
  padding-left: 6px;
}

.route-row.selected b { color: var(--cyan); }
.route-row b { display: block; font-size: 12px; font-weight: 600; }
.route-row small { display: block; color: var(--muted); font-size: 9.5px; margin-top: 2px; }
.route-row strong { font-family: var(--font-mono); font-size: 11px; color: var(--cyan-mint); }
.route-bullet { width: 8px; height: 8px; border-radius: 50%; background: var(--cyan-mint); }

.method-note {
  color: var(--faint);
  font-family: var(--font-mono);
  font-size: 9px;
  margin-top: 12px;
}

.planning-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.planning-grid > div {
  padding: 10px 12px;
  background: rgba(13, 27, 42, 0.6);
  border: 1px solid var(--line);
  border-radius: 6px;
}

.planning-grid span { display: block; color: var(--muted); font-size: 9.5px; }
.planning-grid b { display: block; margin: 4px 0; font-family: var(--font-mono); font-size: 10.5px; font-weight: 600; }
.planning-grid small { display: block; color: var(--faint); font-family: var(--font-mono); font-size: 8.5px; }
.unavailable-text { color: var(--amber) !important; }

/* Provenance Inspector Drawer */
.provenance-accordion {
  margin-top: 10px;
  border: 1px solid var(--line);
  border-radius: 6px;
  background: rgba(5, 12, 20, 0.6);
  overflow: hidden;
}

.provenance-trigger {
  width: 100%;
  padding: 10px 14px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: var(--cyan-mint);
  font-family: var(--font-mono);
  font-size: 10px;
  font-weight: 600;
  background: rgba(66, 224, 211, 0.05);
}

.provenance-content {
  padding: 12px 14px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  font-family: var(--font-mono);
  font-size: 9.5px;
  color: var(--muted);
  border-top: 1px solid var(--line);
}

.reasoning-copy {
  color: var(--muted);
  font-size: 11px;
  line-height: 1.5;
  margin-bottom: 12px;
}

.input-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.input-chips span {
  padding: 4px 8px;
  border: 1px solid rgba(66, 224, 211, 0.25);
  background: rgba(66, 224, 211, 0.06);
  color: var(--cyan-mint);
  font-family: var(--font-mono);
  font-size: 8.5px;
  font-weight: 600;
  border-radius: 4px;
}

.signal-row {
  display: grid;
  grid-template-columns: 22px 1fr 12px;
  gap: 10px;
  width: 100%;
  text-align: left;
  background: none;
  border: 0;
  padding: 12px 0;
  border-top: 1px solid var(--line);
  transition: all 0.2s ease;
}

.signal-row:hover {
  padding-left: 4px;
}

.signal-icon {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  background: rgba(66, 224, 211, 0.12);
  color: var(--cyan-mint);
  font-family: var(--font-mono);
  font-size: 11px;
  font-weight: 700;
}

.signal-row.critical .signal-icon {
  background: rgba(244, 63, 94, 0.15);
  color: var(--red);
}

.signal-row b { display: block; font-size: 11px; font-weight: 600; color: var(--ink); }
.signal-row small { display: block; color: var(--muted); font-size: 9.5px; margin-top: 2px; }

/* Toast */
.toast {
  position: fixed;
  bottom: 24px;
  left: 50%;
  transform: translate(-50%, 20px);
  background: linear-gradient(135deg, var(--cyan) 0%, var(--cyan-mint) 100%);
  color: #050c14;
  padding: 12px 20px;
  border-radius: 30px;
  font-size: 12px;
  font-weight: 700;
  opacity: 0;
  pointer-events: none;
  transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
  box-shadow: 0 8px 24px rgba(66, 224, 211, 0.35);
  z-index: 1000;
}

.toast.visible {
  opacity: 1;
  transform: translate(-50%, 0);
}

/* Authentication & Role Management Styles */
.auth-topbar-wrapper {
  display: flex;
  align-items: center;
  gap: 10px;
}

.sign-in-btn {
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 6px 14px;
  border-radius: 6px;
  background: rgba(66, 224, 211, 0.12);
  border: 1px solid var(--cyan-mint);
  color: var(--cyan);
  font-family: var(--font-sans);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.04em;
  transition: all 0.2s ease;
}

.sign-in-btn:hover {
  background: var(--cyan-mint);
  color: #050c14;
  box-shadow: 0 0 16px rgba(66, 224, 211, 0.4);
}

.user-profile-badge {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 4px 10px;
  background: rgba(13, 27, 42, 0.7);
  border: 1px solid var(--line);
  border-radius: 20px;
}

.user-avatar {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--cyan-deep), var(--cyan-mint));
  color: #050c14;
  font-weight: 800;
  font-size: 11px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.user-email-text {
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--ink);
  max-width: 140px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.role-tag {
  display: inline-flex;
  align-items: center;
  padding: 2px 7px;
  border-radius: 4px;
  font-family: var(--font-mono);
  font-size: 9px;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.role-tag.admin {
  background: rgba(245, 158, 11, 0.18);
  border: 1px solid var(--amber);
  color: #fbbf24;
}

.role-tag.viewer {
  background: rgba(59, 130, 246, 0.18);
  border: 1px solid var(--blue);
  color: #93c5fd;
}

.role-tag.analyst {
  background: rgba(168, 85, 247, 0.18);
  border: 1px solid #c084fc;
  color: #e9d5ff;
}

.sign-out-btn {
  color: var(--muted);
  font-size: 11px;
  padding: 3px 7px;
  border-radius: 4px;
  border: 1px solid transparent;
  transition: all 0.2s;
}

.sign-out-btn:hover {
  color: var(--red);
  background: rgba(244, 63, 94, 0.12);
  border-color: rgba(244, 63, 94, 0.3);
}

/* Auth Modal */
.auth-overlay {
  position: fixed;
  inset: 0;
  background: rgba(3, 8, 14, 0.85);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
  animation: authOverlayFade 0.22s ease-out;
}

@keyframes authOverlayFade {
  from { opacity: 0; }
  to { opacity: 1; }
}

.auth-modal {
  width: 100%;
  max-width: 440px;
  background: linear-gradient(180deg, rgba(10, 24, 38, 0.98) 0%, rgba(5, 12, 20, 0.98) 100%);
  border: 1px solid rgba(66, 224, 211, 0.3);
  border-radius: 14px;
  padding: 28px 24px;
  box-shadow: 
    0 24px 60px rgba(0, 0, 0, 0.75), 
    0 0 35px rgba(66, 224, 211, 0.12),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
  display: flex;
  flex-direction: column;
  gap: 16px;
  position: relative;
  animation: authModalScale 0.24s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes authModalScale {
  from { opacity: 0; transform: scale(0.96) translateY(8px); }
  to { opacity: 1; transform: scale(1) translateY(0); }
}

.auth-modal-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.auth-modal-title {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.auth-modal-title h2 {
  font-size: 20px;
  font-weight: 800;
  color: var(--ink);
  letter-spacing: -0.02em;
  line-height: 1.25;
}

.auth-context-desc {
  font-size: 11.5px;
  color: var(--muted);
  line-height: 1.45;
  margin-top: 2px;
}

.auth-modal-close {
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--muted);
  font-size: 16px;
  border-radius: 6px;
  border: 1px solid var(--line);
  background: rgba(255, 255, 255, 0.03);
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.auth-modal-close:hover {
  color: var(--ink);
  border-color: var(--cyan-mint);
  background: rgba(66, 224, 211, 0.1);
}

.auth-tabs {
  display: flex;
  background: rgba(5, 12, 20, 0.85);
  border: 1px solid var(--line);
  border-radius: 8px;
  padding: 3px;
  gap: 4px;
}

.auth-tab-btn {
  flex: 1;
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 11.5px;
  font-weight: 700;
  color: var(--muted);
  text-align: center;
  transition: all 0.2s ease;
}

.auth-tab-btn:hover {
  color: var(--ink);
}

.auth-tab-btn.active {
  background: rgba(66, 224, 211, 0.15);
  border: 1px solid var(--cyan-mint);
  color: var(--cyan);
  box-shadow: 0 0 10px rgba(66, 224, 211, 0.2);
}

.auth-form {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.auth-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.auth-field-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.auth-field label {
  font-size: 10px;
  font-family: var(--font-mono);
  font-weight: 600;
  color: var(--muted);
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.auth-char-count {
  font-family: var(--font-mono);
  font-size: 9.5px;
  color: var(--faint);
  transition: color 0.2s;
}

.auth-char-count.valid {
  color: #6ee7b7;
}

.auth-input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.auth-field input {
  width: 100%;
  background: rgba(5, 12, 20, 0.85);
  border: 1px solid var(--line);
  border-radius: 7px;
  padding: 10px 14px;
  font-size: 12.5px;
  color: var(--ink);
  transition: all 0.2s ease;
  font-family: var(--font-sans);
}

.auth-field input.has-toggle {
  padding-right: 42px;
}

.auth-field input::placeholder {
  color: var(--faint);
}

.auth-field input:focus {
  border-color: var(--cyan-mint);
  background: rgba(9, 21, 33, 0.95);
  box-shadow: 0 0 0 3px rgba(66, 224, 211, 0.15);
}

.auth-field input:-webkit-autofill,
.auth-field input:-webkit-autofill:hover, 
.auth-field input:-webkit-autofill:focus,
.auth-field input:-webkit-autofill:active {
  -webkit-background-clip: text;
  -webkit-text-fill-color: var(--ink) !important;
  transition: background-color 5000s ease-in-out 0s;
  box-shadow: inset 0 0 20px 20px #050c14 !important;
}

.auth-field input.is-invalid {
  border-color: var(--red);
  box-shadow: 0 0 0 3px rgba(244, 63, 94, 0.15);
}

.auth-field input.is-valid {
  border-color: rgba(16, 185, 129, 0.5);
}

.password-toggle-btn {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  height: 28px;
  width: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 5px;
  color: var(--muted);
  transition: all 0.2s;
}

.password-toggle-btn:hover {
  color: var(--cyan);
  background: rgba(66, 224, 211, 0.1);
}

.field-error-msg {
  font-size: 11px;
  color: #fda4af;
  display: flex;
  align-items: center;
  gap: 5px;
  margin-top: 2px;
  animation: authOverlayFade 0.2s;
}

.auth-error-box {
  padding: 10px 14px;
  background: rgba(244, 63, 94, 0.15);
  border: 1px solid var(--red);
  border-radius: 6px;
  color: #fda4af;
  font-size: 11.5px;
  display: flex;
  align-items: flex-start;
  gap: 8px;
  line-height: 1.4;
}

.role-notice-card {
  padding: 10px 14px;
  background: rgba(59, 130, 246, 0.1);
  border: 1px solid rgba(59, 130, 246, 0.25);
  border-radius: 7px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.role-notice-card b {
  font-size: 10.5px;
  color: #93c5fd;
  letter-spacing: 0.05em;
  font-family: var(--font-mono);
  display: flex;
  align-items: center;
  gap: 6px;
}

.role-notice-card small {
  font-size: 10.5px;
  color: var(--muted);
  line-height: 1.4;
}

.auth-submit-btn {
  padding: 11px 16px;
  border-radius: 7px;
  background: linear-gradient(135deg, var(--cyan) 0%, var(--cyan-mint) 100%);
  color: #050c14;
  font-weight: 800;
  font-size: 12.5px;
  letter-spacing: 0.04em;
  transition: all 0.2s ease;
  margin-top: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.auth-submit-btn:hover:not(:disabled) {
  box-shadow: 0 0 18px rgba(66, 224, 211, 0.4);
  transform: translateY(-1px);
}

.auth-submit-btn:active:not(:disabled) {
  transform: translateY(0);
}

.auth-submit-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-spinner {
  width: 14px;
  height: 14px;
  border: 2px solid rgba(5, 12, 20, 0.25);
  border-top-color: #050c14;
  border-radius: 50%;
  animation: spinnerRotate 0.6s linear infinite;
}

@keyframes spinnerRotate {
  to { transform: rotate(360deg); }
}

/* User Management View (Admin Tab) */
.user-management-view {
  display: flex;
  flex-direction: column;
  padding: 28px;
  gap: 24px;
  overflow-y: auto;
  min-width: 0;
  background: var(--bg-deep);
}

.admin-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.admin-stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 16px;
}

.admin-stat-card {
  background: var(--bg-card);
  border: 1px solid var(--line);
  border-radius: 8px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.admin-stat-card span {
  font-size: 10px;
  font-family: var(--font-mono);
  color: var(--muted);
  text-transform: uppercase;
}

.admin-stat-card strong {
  font-size: 24px;
  font-weight: 800;
  color: var(--ink);
}

.users-table-card {
  background: var(--bg-card);
  border: 1px solid var(--line);
  border-radius: 8px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.users-table-header {
  padding: 16px 20px;
  border-bottom: 1px solid var(--line);
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: rgba(9, 21, 33, 0.6);
}

.users-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
}

.users-table th {
  text-align: left;
  padding: 12px 20px;
  font-family: var(--font-mono);
  font-size: 10px;
  color: var(--muted);
  text-transform: uppercase;
  border-bottom: 1px solid var(--line);
  background: rgba(5, 12, 20, 0.5);
}

.users-table td {
  padding: 14px 20px;
  border-bottom: 1px solid rgba(145, 180, 195, 0.08);
  color: var(--ink);
}

.users-table tr:hover td {
  background: rgba(66, 224, 211, 0.03);
}

.role-select {
  background: rgba(5, 12, 20, 0.8);
  border: 1px solid var(--line);
  border-radius: 6px;
  padding: 5px 10px;
  color: var(--ink);
  font-size: 11px;
  font-family: var(--font-mono);
  font-weight: 600;
  cursor: pointer;
}

.role-select:focus {
  border-color: var(--cyan-mint);
}

.status-toggle {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 10px;
  font-weight: 700;
  font-family: var(--font-mono);
  cursor: pointer;
  border: 1px solid transparent;
  transition: all 0.2s;
}

.status-toggle.active {
  background: rgba(16, 185, 129, 0.15);
  border-color: rgba(16, 185, 129, 0.3);
  color: #6ee7b7;
}

.status-toggle.inactive {
  background: rgba(244, 63, 94, 0.15);
  border-color: rgba(244, 63, 94, 0.3);
  color: #fda4af;
}

.status-toggle:hover {
  filter: brightness(1.2);
}

.delete-user-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 4px 10px;
  border-radius: 5px;
  font-size: 11px;
  font-family: var(--font-mono);
  font-weight: 600;
  color: #fca5a5;
  background: rgba(244, 63, 94, 0.12);
  border: 1px solid rgba(244, 63, 94, 0.28);
  transition: all 0.2s;
  cursor: pointer;
}

.delete-user-btn:hover:not(:disabled) {
  background: rgba(244, 63, 94, 0.28);
  border-color: var(--red);
  color: #fff;
  transform: translateY(-1px);
}

.delete-user-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.rbac-banner {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 18px;
  border-radius: 8px;
  background: rgba(59, 130, 246, 0.1);
  border: 1px solid rgba(59, 130, 246, 0.25);
  color: #bfdbfe;
  font-size: 12px;
  margin-bottom: 16px;
}

.rbac-banner.viewer {
  background: rgba(59, 130, 246, 0.1);
  border-color: rgba(59, 130, 246, 0.3);
  color: #93c5fd;
}

.rbac-banner.admin {
  background: rgba(245, 158, 11, 0.1);
  border-color: rgba(245, 158, 11, 0.3);
  color: #fde68a;
}

.rbac-banner.unauthenticated {
  background: rgba(244, 63, 94, 0.08);
  border-color: rgba(244, 63, 94, 0.25);
  color: #fca5a5;
}

/* Responsive Breakpoints */
@media (max-width: 1080px) {
  .workspace { grid-template-columns: 1fr; }
  .intelligence-panel { border-left: 0; border-top: 1px solid var(--line); }
}

@media (max-width: 768px) {
  .topbar { padding: 0 16px; gap: 14px; }
  .study-context { display: none; }
  .map-toolbar { padding: 0 16px; flex-wrap: wrap; height: auto; padding-block: 10px; gap: 10px; }
  .control-evidence-grid { grid-template-columns: 1fr; }
  .planning-grid { grid-template-columns: 1fr; }
  .run-button { width: 100%; margin-left: 0; }
}

@media (max-width: 480px) {
  .auth-modal {
    padding: 20px 16px;
    gap: 14px;
    border-radius: 12px;
  }
  .auth-modal-title h2 {
    font-size: 17px;
  }
  .auth-field input {
    font-size: 13px;
    padding: 10px 12px;
  }
  .auth-submit-btn {
    padding: 12px;
  }
}
`;

export default styles;