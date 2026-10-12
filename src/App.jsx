import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import styles from './styles.js';
import { baseMapCenter, layers, mapBounds } from './mmrData.js';
import {
  clearStoredToken,
  deleteUser,
  fetchAdminUsers,
  getActionCapabilities,
  getCurrentUser,
  getLiveApiStatus,
  getMmrSnapshot,
  loginUser,
  registerUser,
  updateUserActive,
  updateUserRole,
} from './apiClient.js';

const assetDetails = {
  'Kolshet Jetty': 'Kolshet Jetty → Rewas Port · 29.44 km straight-line distance',
  'Gaimukh Jetty': 'Gaimukh Jetty → Rewas Port · 30.66 km straight-line distance',
  'Rewas Port': 'Rewas Port · nearest connected port in the current model',
  'Jawaharlal Nehru Port': 'Jawaharlal Nehru Port · major container port',
  'Mumbai Port': 'Mumbai Port · major port and MMR network node',
  'Bhiwandi Logistics Cluster': 'Bhiwandi Logistics Cluster · private warehousing cluster, not an official MMLP',
  'Thane Creek Ramsar Wetland Site': 'Thane Creek Ramsar Wetland Site · clearance required for siting and dredging',
};

const scenarios = {
  baseline: ['Baseline network', 'Distance-derived connectivity only. Navigability and seasonal constraints remain unassessed.'],
  expansion: ['Jetty expansion candidate', 'Expansion candidate lens active. Score remains directional until missing feeds are connected.'],
  environment: ['Environmental clearance lens', 'Environmental constraint lens active. Any siting decision requires ecological clearance.'],
};

const controlEvidence = [
  { label: 'Spatial Integrity', value: 'VERIFIED', source: 'national_gis_layer.py · 43 infrastructure nodes · 11 waterways' },
  { label: 'Nearest Port Distance', value: '29.44 km', source: 'mmr_feasibility_report.json · Haversine straight-line' },
  { label: 'Environmental Constraint', value: 'FLAGGED', source: 'Thane Creek Ramsar Wetland Site · Ramsar Site No. 2490' },
];

function getUserDisplayName(user) {
  if (!user) return '';
  if (user.name && user.name.trim()) {
    return user.name.trim();
  }
  const prefix = (user.email || '').split('@')[0];
  if (!prefix) return 'User';
  if (prefix.includes('.') || prefix.includes('_') || prefix.includes('-')) {
    return prefix
      .split(/[._-]/)
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
  }
  return prefix.charAt(0).toUpperCase() + prefix.slice(1);
}

function Header({ onRefresh, liveStatus, activeTab, setActiveTab, user, onOpenAuth, onLogout }) {
  return (
    <header className="topbar">
      <a className="brand" href="#/" aria-label="MMR Intelligence home">
        <span className="brand-mark">
          <span></span><span></span><span></span>
        </span>
        <span className="brand-text">
          <strong>MMR</strong>
          <small>INTELLIGENCE</small>
        </span>
      </a>

      <div className="study-context">
        <span className="live-dot"></span>
        <span>NW-53 CORRIDOR STUDY</span>
        <span className="context-separator">/</span>
        <span className="muted">Mumbai Metropolitan Region</span>
      </div>

      <div className="tab-navigator">
        <button
          className={`tab-button ${activeTab === 'spatial' ? 'active' : ''}`}
          onClick={() => setActiveTab('spatial')}
          aria-selected={activeTab === 'spatial'}
          role="tab"
        >
          🗺️ Spatial View
        </button>
        <button
          className={`tab-button ${activeTab === 'control' ? 'active' : ''}`}
          onClick={() => setActiveTab('control')}
          aria-selected={activeTab === 'control'}
          role="tab"
        >
          ⚡ Decision Loop
        </button>
        {user?.role === 'admin' && (
          <button
            className={`tab-button ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
            aria-selected={activeTab === 'users'}
            role="tab"
          >
            👥 User Management
          </button>
        )}
      </div>

      <div className="top-actions">
        <span className={`live-api-state ${liveStatus.state === 'ONLINE' ? 'online' : 'offline'}`}>
          LIVE API <b>{liveStatus.state}</b>
        </span>

        {user ? (
          <div className="user-profile-badge">
            <span className="user-avatar">{getUserDisplayName(user)[0].toUpperCase()}</span>
            <span className="user-email-text" title={user.email}>
              {getUserDisplayName(user)}
            </span>
            <span className={`role-tag ${user.role}`}>{user.role}</span>
            <button className="sign-out-btn" onClick={onLogout} title="Sign Out">
              Sign Out
            </button>
          </div>
        ) : (
          <button className="sign-in-btn" onClick={onOpenAuth}>
            Sign In
          </button>
        )}

        <button className="icon-button" onClick={onRefresh} aria-label="Refresh data" title="Refresh data">
          ↻
        </button>
      </div>
    </header>
  );
}

const layerOrder = ['nw53', 'waterways', 'terminals', 'ports', 'logistics', 'roadRail', 'environmental', 'feasibility'];

function MarineSpatialMap({ selectedAsset, onSelect, zoomed, sidebarOpen }) {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const layerGroups = useRef({});
  const [visibleLayers, setVisibleLayers] = useState(
    Object.fromEntries(layerOrder.map((key) => [key, key !== 'roadRail']))
  );

  useEffect(() => {
    const map = L.map(mapRef.current, { zoomControl: false, attributionControl: true }).setView(baseMapCenter, 10);
    L.control.zoom({ position: 'bottomright' }).addTo(map);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);
    map.fitBounds(mapBounds, { padding: [20, 20] });
    mapInstance.current = map;
    return () => {
      map.remove();
      mapInstance.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapInstance.current;
    if (!map) return undefined;
    Object.values(layerGroups.current).forEach((group) => group.remove());
    layerGroups.current = {};

    const addPoint = (group, entity, name, type, lat, lon, details) => {
      const marker = L.circleMarker([lat, lon], {
        radius: selectedAsset === name ? 10 : 6,
        color: layers[type]?.color || '#42e0d3',
        weight: selectedAsset === name ? 3 : 2,
        fillColor: layers[type]?.color || '#42e0d3',
        fillOpacity: 0.9,
      });
      marker.bindPopup(`<strong>${name}</strong><br><span>${details}</span>`);
      marker.on('click', () => onSelect(name));
      marker.addTo(group);
    };

    layerOrder.forEach((key) => {
      const source = layers[key];
      const group = L.layerGroup();
      layerGroups.current[key] = group;

      if (key === 'nw53')
        L.polyline(source.geometry, { color: source.color, weight: 5, opacity: 0.9, dashArray: '8 7' })
          .bindTooltip('NW-53 · Kalyan-Thane-Mumbai Waterway')
          .addTo(group);
      if (key === 'feasibility')
        L.polyline(source.geometry, { color: source.color, weight: 8, opacity: 0.45 })
          .bindTooltip(`Feasibility assessment · corridor ${source.assessment.structural_scores.corridor_score}`)
          .addTo(group);
      if (key === 'waterways')
        source.geometry.forEach((entity) =>
          L.polyline(entity.coordinates, { color: source.color, weight: 3, opacity: 0.65 })
            .bindTooltip(entity.name)
            .addTo(group)
        );
      if (key === 'terminals')
        source.geometry.forEach((entity) => {
          const [lon, lat] = entity.geometry.coordinates;
          addPoint(group, entity, entity.name, key, lat, lon, `${entity.properties.classification} · ${entity.source}`);
        });
      if (key === 'ports')
        source.geometry.forEach((port) =>
          addPoint(group, port, port.port_name, key, port.latitude, port.longitude, `${port.port_type} · ${port.source}`)
        );
      if (key === 'logistics')
        source.geometry.forEach((park) =>
          addPoint(group, park, park.park_name, key, park.latitude, park.longitude, `${park.notes}`)
        );
      if (key === 'environmental')
        source.geometry.forEach((entity) => {
          const [lon, lat] = entity.geometry.coordinates;
          addPoint(group, entity, entity.name, key, lat, lon, `${entity.known_unknowns[0]} · ${entity.source}`);
        });

      if (visibleLayers[key]) group.addTo(map);
    });

    return () => Object.values(layerGroups.current).forEach((group) => group.remove());
  }, [selectedAsset, visibleLayers, onSelect]);

  useEffect(() => {
    if (mapInstance.current) mapInstance.current.invalidateSize();
  }, []);

  useEffect(() => {
    if (mapInstance.current) {
      mapInstance.current.invalidateSize();
      const timer1 = setTimeout(() => mapInstance.current?.invalidateSize(), 50);
      const timer2 = setTimeout(() => mapInstance.current?.invalidateSize(), 180);
      const timer3 = setTimeout(() => mapInstance.current?.invalidateSize(), 350);
      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
        clearTimeout(timer3);
      };
    }
  }, [sidebarOpen]);

  useEffect(() => {
    if (mapInstance.current)
      zoomed ? mapInstance.current.setView(baseMapCenter, 11) : mapInstance.current.fitBounds(mapBounds, { padding: [20, 20] });
  }, [zoomed]);

  return (
    <div className="real-map-shell">
      <div ref={mapRef} className={`leaflet-map ${zoomed ? 'zoomed' : ''}`} aria-label="Interactive Marine Spatial Map"></div>
      <div className="map-layer-control">
        <div className="layer-control-title">
          <span>MAP LAYERS</span> <span>WGS84</span>
        </div>
        {layerOrder.map((key) => (
          <button
            key={key}
            className={`layer-toggle ${visibleLayers[key] ? 'active' : ''} ${layers[key].unavailable ? 'unavailable' : ''}`}
            onClick={() => {
              if (layers[key].unavailable) return;
              setVisibleLayers((current) => ({ ...current, [key]: !current[key] }));
            }}
          >
            <i style={{ backgroundColor: layers[key].color }}></i>
            <span>{layers[key].label}</span>
            <b>{layers[key].unavailable ? 'N/A' : visibleLayers[key] ? 'ON' : 'OFF'}</b>
          </button>
        ))}
      </div>
      <div className="map-provider-note">OpenStreetMap basemap · verified spatial layer</div>
    </div>
  );
}

function MapWorkspace({
  selectedAsset,
  selectedEntity,
  onSelect,
  zoomed,
  onZoomChange,
  onToast,
  scenario,
  setScenario,
  confidence,
  setConfidence,
  sidebarOpen,
  setSidebarOpen,
  user,
  onOpenAuth,
}) {
  const [hasRun, setHasRun] = useState(false);
  const [readout, setReadout] = useState(scenarios.baseline);
  const runScenario = () => {
    setReadout(scenarios[scenario]);
    setHasRun(true);
    onToast(`${scenarios[scenario][0]} loaded into the shared workspace`);
  };

  return (
    <section className="map-workspace" aria-label="Marine Spatial Map">
      <div className="map-toolbar">
        <div className="map-title">
          <span className="section-kicker">MARINE SPATIAL VIEW</span>
          <b>NW-53 Corridor Overview</b>
        </div>
        <div className="map-tools">
          <button
            className="map-tool"
            onClick={() => {
              onZoomChange(true);
              onToast('NW-53 corridor focused');
            }}
            title="Focus NW-53 corridor"
          >
            ◎ <span>Focus Corridor</span>
          </button>
          <button className="map-tool" onClick={() => onZoomChange(false)} title="Zoom out">
            −
          </button>
          <button className="map-tool" onClick={() => onZoomChange(true)} title="Zoom in">
            +
          </button>
          <button
            className="map-tool"
            onClick={() => setSidebarOpen((prev) => !prev)}
            title="Toggle Intelligence Sidebar"
          >
            {sidebarOpen ? 'Sidebar ➔' : '❮ Sidebar'}
          </button>
        </div>
      </div>

      <div className="map-canvas-wrapper">
        <MarineSpatialMap selectedAsset={selectedAsset} onSelect={onSelect} zoomed={zoomed} sidebarOpen={sidebarOpen} />
        <div className="map-status">
          <span className="status-icon">✓</span>
          <div>
            <b>Spatial integrity verified</b>
            <small>43 infrastructure nodes · 11 waterways</small>
          </div>
        </div>
      </div>

      <ControlCenter
        selectedAsset={selectedAsset}
        selectedEntity={selectedEntity}
        scenario={scenario}
        setScenario={setScenario}
        confidence={confidence}
        setConfidence={setConfidence}
        runScenario={runScenario}
        hasRun={hasRun}
        readout={readout}
        onToast={onToast}
        user={user}
        onOpenAuth={onOpenAuth}
      />
    </section>
  );
}

function ControlCenter({
  selectedAsset,
  selectedEntity,
  scenario,
  setScenario,
  confidence,
  setConfidence,
  runScenario,
  hasRun,
  readout,
  onToast,
  user,
  onOpenAuth,
}) {
  const [mode, setMode] = useState('observe');
  const [replayOpen, setReplayOpen] = useState(false);
  const [actionState, setActionState] = useState('READY');
  const [executionLog, setExecutionLog] = useState([]);
  const context = `${selectedAsset} · ${scenarios[scenario][0]}`;
  const capabilities = getActionCapabilities(user);

  const executeAction = (action) => {
    if (!user) {
      onToast(`Authentication required: Please sign in to execute ${action}`);
      onOpenAuth();
      return;
    }
    if (user.role === 'viewer') {
      onToast('Access Denied: Viewer accounts are restricted to read-only observation.');
      return;
    }
    setActionState(`${action.toUpperCase()}D`);
    const newEvent = {
      action,
      user: user.email,
      role: user.role,
      target: selectedAsset,
      time: new Date().toLocaleTimeString(),
    };
    setExecutionLog((prev) => [newEvent, ...prev]);
    onToast(`Action Executed: ${action} confirmed by ${user.role.toUpperCase()} (${user.email})`);
  };

  return (
    <section className="control-center" aria-label="Control Center">
      <div className="control-heading">
        <div className="control-heading-left">
          <span className="section-kicker">CONTROL CENTER</span>
          <b>Operational Decision Loop</b>
        </div>
        <span className="control-status">
          <i></i> Shared Context Active
        </span>
      </div>

      <div className="control-context">
        <span className="context-kicker">ACTIVE DECISION CONTEXT</span>
        <b>{context}</b>
        <small>
          {selectedEntity
            ? `${selectedEntity.entityId} · ${selectedEntity.confidence} Confidence · ${selectedEntity.timestamp}`
            : 'Canonical entity metadata loaded.'}
        </small>
      </div>

      <div className="control-steps" role="tablist" aria-label="Control Center workflow">
        {[
          ['observe', '01', 'Observe'],
          ['decide', '02', 'Decide'],
          ['act', '03', 'Act'],
        ].map(([key, number, label]) => (
          <button
            key={key}
            id={`control-tab-${key}`}
            className={mode === key ? 'active' : ''}
            onClick={() => setMode(key)}
            role="tab"
            aria-selected={mode === key}
          >
            <i>{number}</i>
            {label}
          </button>
        ))}
      </div>

      {mode === 'observe' && (
        <div id="control-panel-observe" className="control-observe">
          <div className="control-evidence-grid">
            {controlEvidence.map((item) => (
              <article key={item.label} className="evidence-item">
                <span>{item.label}</span>
                <b className={item.value === 'FLAGGED' ? 'evidence-alert' : ''}>{item.value}</b>
                <small>{item.source}</small>
              </article>
            ))}
          </div>
          <div className="alert-strip">
            <span>!</span>
            <b>Alert</b>
            <span>Environmental clearance required before siting or dredging.</span>
            <em>VERIFIED SIGNAL</em>
          </div>
        </div>
      )}

      {mode === 'decide' && (
        <div id="control-panel-decide" className="control-decide">
          <div className="decision-review">
            <button onClick={() => onToast('Evidence is available in Observe for this context')}>Inspect Evidence</button>
            <button onClick={() => onToast(`Scenario review: ${scenarios[scenario][0]}`)}>Review Scenario</button>
            <span>
              Decision context: <b>{context}</b>
            </span>
          </div>

          <div className="authority-card">
            <div className="authority-card-info">
              <span className="section-kicker">AUTHORITY CHECK</span>
              <b>Decision Authority Scope</b>
              <small>
                {user?.role === 'admin'
                  ? `Authenticated Administrator mandate (${user.email}). Executive decision scope granted.`
                  : user?.role === 'viewer'
                    ? `Signed in as Viewer (${user.email}). Read-only mode active; decision changes require Admin role.`
                    : 'No active authenticated session. Sign in to verify decision mandate.'}
              </small>
            </div>
            <strong style={{ color: user?.role === 'admin' ? 'var(--green)' : user?.role === 'viewer' ? 'var(--blue)' : 'var(--amber)' }}>
              {user?.role === 'admin' ? 'AUTHORIZED' : user?.role === 'viewer' ? 'VIEWER (READ-ONLY)' : 'UNAUTHENTICATED'}
            </strong>
          </div>

          <div className="decision-actions">
            <button
              onClick={() => executeAction('Approve')}
              disabled={!capabilities.approve}
              title={!capabilities.approve ? (user?.role === 'viewer' ? 'Restricted: Viewer is read-only' : 'Sign in as Admin') : 'Approve decision'}
            >
              Approve
            </button>
            <button
              onClick={() => executeAction('Reject')}
              disabled={!capabilities.reject}
              title={!capabilities.reject ? (user?.role === 'viewer' ? 'Restricted: Viewer is read-only' : 'Sign in as Admin') : 'Reject decision'}
            >
              Reject
            </button>
            <button
              onClick={() => executeAction('Escalate')}
              disabled={!capabilities.escalate}
              title={!capabilities.escalate ? (user?.role === 'viewer' ? 'Restricted: Viewer is read-only' : 'Sign in as Admin') : 'Escalate issue'}
            >
              Escalate
            </button>
          </div>
        </div>
      )}

      {mode === 'act' && (
        <div id="control-panel-act" className="control-act">
          <div className="execution-card">
            <div className="execution-card-info">
              <span className="section-kicker">EXECUTION STATUS</span>
              <b>{actionState}</b>
              <small>
                {user?.role === 'admin'
                  ? `Admin execution dispatch pipeline active for ${selectedAsset}.`
                  : user?.role === 'viewer'
                    ? 'Viewer role: execution dispatch is read-only.'
                    : 'Sign in with Administrator account to dispatch.'}
              </small>
            </div>
            <span className={`execution-dot ${user?.role === 'admin' ? 'live' : 'blocked'}`}></span>
          </div>
          <div className="act-actions">
            <button onClick={() => executeAction('Deploy')} disabled={!capabilities.deploy}>
              Deploy
            </button>
            <button onClick={() => executeAction('Assign')} disabled={!capabilities.assign}>
              Assign
            </button>
            <button
              className="replay-button"
              onClick={() => {
                setReplayOpen((value) => !value);
              }}
            >
              ↺ Replay
            </button>
          </div>
          {replayOpen && (
            <div className="replay-log">
              <b>Replay Timeline</b>
              {executionLog.length === 0 ? (
                <>
                  <span>NO EXECUTION EVENTS YET</span>
                  <small>Execute an admin action (Approve/Deploy) to record events in SQLite log.</small>
                </>
              ) : (
                executionLog.map((ev, i) => (
                  <div key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '6px' }}>
                    <b style={{ color: 'var(--cyan-mint)' }}>{ev.action}</b> on <span>{ev.target}</span> by <small>{ev.user} ({ev.role})</small> at {ev.time}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}

      <div className="control-footer">
        <div className="scenario-inline">
          <div className="scenario-field">
            <label htmlFor="scenario-select">Scenario</label>
            <select id="scenario-select" value={scenario} onChange={(event) => setScenario(event.target.value)}>
              <option value="baseline">Baseline / current network</option>
              <option value="expansion">Jetty expansion candidate</option>
              <option value="environment">Environmental clearance lens</option>
            </select>
          </div>

          <div className="scenario-field">
            <label htmlFor="confidence-range">
              Confidence <output>{confidence}%</output>
            </label>
            <input
              id="confidence-range"
              type="range"
              min="0"
              max="100"
              value={confidence}
              onChange={(event) => setConfidence(event.target.value)}
            />
          </div>

          <button className="run-button" onClick={runScenario}>
            <span>▶</span> Run Scenario
          </button>
        </div>

        <div className="control-readout">
          <span className="readout-icon">◌</span>
          <div>
            <b>{hasRun ? readout[0] : 'Baseline network'}</b>
            <small>{readout[1]}</small>
          </div>
        </div>
      </div>
    </section>
  );
}

function IntelligencePanel({ selectedAsset, selectedEntity, onSelect, onToast }) {
  const [provenanceOpen, setProvenanceOpen] = useState(false);

  return (
    <aside className="intelligence-panel" aria-label="Planning and Intelligence">
      <div className="panel-heading">
        <div>
          <span className="section-kicker">PLANNING &amp; INTELLIGENCE</span>
          <h1>MMR Corridor Brief</h1>
        </div>
      </div>

      <div className="brief-meta">
        <span className="confidence-badge">
          <i></i> CONFIDENCE {selectedEntity?.confidence || 'PENDING'}
        </span>
        <span className="updated">
          {selectedEntity ? `UPDATED ${selectedEntity.timestamp.slice(0, 10)}` : 'SNAPSHOT LOADING'}
        </span>
      </div>

      <div className="selected-context">
        <span className="section-kicker">SELECTED LOCATION</span>
        <b>{selectedAsset}</b>
        <small>
          {selectedEntity
            ? `${selectedEntity.entityId} · ${selectedEntity.provenance.origin || selectedEntity.source} · ${selectedEntity.confidence} confidence · ${selectedEntity.timestamp}`
            : assetDetails[selectedAsset] || 'Source-backed spatial entity selected on map.'}
        </small>
      </div>

      <div className="metric-grid">
        <article className="metric-card">
          <span>Feasibility Score</span>
          <strong>53.3</strong>
          <small>
            <span className="status-tag tag-pending">DIRECTIONAL</span>
          </small>
        </article>
        <article className="metric-card">
          <span>Model Confidence</span>
          <strong>{selectedEntity?.confidence || 'PENDING'}</strong>
          <small>
            <span className="status-tag tag-verified">VERIFIED SNAPSHOT</span>
          </small>
        </article>
        <article className="metric-card warning">
          <span>Congestion / Diversion</span>
          <strong>UNAVAILABLE</strong>
          <small>
            <span className="status-tag tag-unavailable">MISSING FEED</span>
          </small>
        </article>
        <article className="metric-card warning">
          <span>Cost / Investment</span>
          <strong>NOT ASSESSED</strong>
          <small>
            <span className="status-tag tag-unavailable">BENCHMARK MISSING</span>
          </small>
        </article>
      </div>

      <div className="panel-section route-section">
        <div className="section-title">
          <span>Connectivity Pulse</span>
          <button className="text-button" onClick={() => onToast('Routes are shown on the Marine Spatial View')}>
            View on Map ↗
          </button>
        </div>
        <div className="route-summary">
          <div>
            <b>2</b>
            <span>active jetties</span>
          </div>
          <div className="route-bar">
            <span></span>
          </div>
          <div>
            <b>29.44 km</b>
            <span>nearest port</span>
          </div>
        </div>
        <div className="route-list">
          {[
            ['Kolshet Jetty', '29.44 km'],
            ['Gaimukh Jetty', '30.66 km'],
          ].map(([asset, distance]) => (
            <button
              key={asset}
              className={`route-row ${selectedAsset === asset ? 'selected' : ''}`}
              onClick={() => onSelect(asset)}
            >
              <span className="route-bullet"></span>
              <div>
                <b>{asset}</b>
                <small>→ Rewas Port</small>
              </div>
              <strong>{distance}</strong>
              <span>›</span>
            </button>
          ))}
        </div>
        <p className="method-note">Straight-line Haversine distance. Not a navigable route length.</p>
      </div>

      <div className="panel-section planning-section">
        <div className="section-title">
          <span>Scenario Outlook</span>
          <span className="signal-count">DATA-BACKED ONLY</span>
        </div>
        <div className="planning-grid">
          <div>
            <span>Baseline</span>
            <b>Current NW-53 snapshot</b>
            <small>2 jetties · 3 connected ports</small>
          </div>
          <div>
            <span>Projected state</span>
            <b className="unavailable-text">UNAVAILABLE</b>
            <small>No traffic or cargo feed connected.</small>
          </div>
          <div>
            <span>Congestion / diversion</span>
            <b className="unavailable-text">NOT ASSESSED</b>
            <small>Requires road-traffic baseline.</small>
          </div>
          <div>
            <span>Cost / investment</span>
            <b className="unavailable-text">NOT ASSESSED</b>
            <small>Requires IWAI benchmarks.</small>
          </div>
        </div>
      </div>

      <div className="panel-section reasoning-section">
        <div className="section-title">
          <span>AI Reasoning &amp; Provenance</span>
          <span className="signal-count">TRACEABLE INPUTS</span>
        </div>
        <p className="reasoning-copy">
          No generative recommendation is issued. Current directional readout is derived from verified spatial connectivity and environmental flags only.
        </p>

        <div className="provenance-accordion">
          <button
            className="provenance-trigger"
            onClick={() => setProvenanceOpen((prev) => !prev)}
            aria-expanded={provenanceOpen}
          >
            <span>{provenanceOpen ? '▲ Hide Data Provenance' : '▼ Inspect Technical Provenance'}</span>
            <small>{selectedEntity ? selectedEntity.entityId : 'CANONICAL'}</small>
          </button>
          {provenanceOpen && (
            <div className="provenance-content">
              <div><strong>Entity ID:</strong> {selectedEntity?.entityId || 'N/A'}</div>
              <div><strong>Data Source:</strong> {selectedEntity?.provenance?.origin || selectedEntity?.source || 'national_gis_layer.py'}</div>
              <div><strong>Timestamp:</strong> {selectedEntity?.timestamp || '2026-10-09'}</div>
              <div><strong>Spatial Layer:</strong> mmr_canonical_envelope.json</div>
            </div>
          )}
        </div>

        <div className="input-chips" style={{ marginTop: '10px' }}>
          <span>WATERWAY_NW53</span>
          <span>TERMINAL_21/22</span>
          <span>FEASIBILITY_NW53_MMR</span>
          <span>ENV_16</span>
        </div>
      </div>

      <div className="panel-section alerts-section">
        <div className="section-title">
          <span>Intelligence Signals</span>
          <span className="signal-count">3 items</span>
        </div>
        <button className="signal-row critical" onClick={() => onSelect('Thane Creek Ramsar Wetland Site')}>
          <span className="signal-icon">!</span>
          <div>
            <b>Environmental clearance required</b>
            <small>Both active jetties overlap the Thane Creek Ramsar corridor.</small>
          </div>
          <span>›</span>
        </button>
        <button className="signal-row neutral">
          <span className="signal-icon">i</span>
          <div>
            <b>Feasibility score pending</b>
            <small>Depth, navigability and seasonal data are not connected.</small>
          </div>
          <span>›</span>
        </button>
        <button className="signal-row neutral">
          <span className="signal-icon">i</span>
          <div>
            <b>Traffic baseline unavailable</b>
            <small>Decongestion assessment is not yet assessed.</small>
          </div>
          <span>›</span>
        </button>
      </div>
    </aside>
  );
}

function UserManagement({ user, onToast }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatingId, setUpdatingId] = useState(null);

  const loadUsers = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await fetchAdminUsers();
      setUsers(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleRoleChange = async (targetUser, newRole) => {
    if (targetUser.role === newRole) return;
    setUpdatingId(targetUser.id);
    try {
      const updated = await updateUserRole(targetUser.id, newRole);
      setUsers((prev) => prev.map((u) => (u.id === targetUser.id ? updated : u)));
      onToast(`Updated ${targetUser.email} role to ${newRole.toUpperCase()}`);
    } catch (err) {
      onToast(`Role update failed: ${err.message}`);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleStatusToggle = async (targetUser) => {
    setUpdatingId(targetUser.id);
    try {
      const updated = await updateUserActive(targetUser.id, !targetUser.is_active);
      setUsers((prev) => prev.map((u) => (u.id === targetUser.id ? updated : u)));
      onToast(`${targetUser.email} ${updated.is_active ? 'Activated' : 'Suspended'}`);
    } catch (err) {
      onToast(`Status update failed: ${err.message}`);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDeleteUser = async (targetUser) => {
    if (targetUser.id === user.id) {
      onToast('You cannot delete your own admin account.');
      return;
    }
    const confirmDelete = window.confirm(
      `Are you sure you want to permanently delete ${getUserDisplayName(targetUser)} (${targetUser.email})?`
    );
    if (!confirmDelete) return;

    setUpdatingId(targetUser.id);
    try {
      await deleteUser(targetUser.id);
      setUsers((prev) => prev.filter((u) => u.id !== targetUser.id));
      onToast(`Permanently deleted: ${targetUser.email}`);
    } catch (err) {
      onToast(`Delete failed: ${err.message}`);
    } finally {
      setUpdatingId(null);
    }
  };

  if (user?.role !== 'admin') {
    return (
      <div className="user-management-view">
        <div className="rbac-banner viewer">
          <span>⚠️</span>
          <span>Access Restricted: User Management requires an active Administrator role.</span>
        </div>
      </div>
    );
  }

  const totalUsers = users.length;
  const adminCount = users.filter((u) => u.role === 'admin' && u.is_active).length;
  const viewerCount = users.filter((u) => u.role === 'viewer' && u.is_active).length;
  const activeCount = users.filter((u) => u.is_active).length;

  return (
    <div className="user-management-view">
      <div className="admin-header">
        <div>
          <span className="section-kicker">GOVERNANCE &amp; SECURITY</span>
          <h2 style={{ fontSize: '20px', fontWeight: 800 }}>Role-Based Access Management</h2>
          <small style={{ color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>
            Connected to Marine Intelligence SQLite &amp; JWT Authority Engine
          </small>
        </div>
        <button className="sign-in-btn" onClick={loadUsers} disabled={loading}>
          ↻ Refresh Accounts
        </button>
      </div>

      <div className="admin-stats-grid">
        <div className="admin-stat-card">
          <span>Total Accounts</span>
          <strong>{totalUsers}</strong>
        </div>
        <div className="admin-stat-card">
          <span>Active Admins</span>
          <strong style={{ color: '#fbbf24' }}>{adminCount}</strong>
        </div>
        <div className="admin-stat-card">
          <span>Active Viewers</span>
          <strong style={{ color: '#93c5fd' }}>{viewerCount}</strong>
        </div>
        <div className="admin-stat-card">
          <span>Operational State</span>
          <strong style={{ color: 'var(--green)' }}>{activeCount} / {totalUsers} ACTIVE</strong>
        </div>
      </div>

      {error && <div className="auth-error-box">{error}</div>}

      <div className="users-table-card">
        <div className="users-table-header">
          <b>System User Directory</b>
          <small style={{ color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>
            Changes commit directly to backend SQLite database
          </small>
        </div>
        <table className="users-table">
          <thead>
            <tr>
              <th>Account Email</th>
              <th>Current Role</th>
              <th>Account Status</th>
              <th>Created Date</th>
              <th>Permissions Scope</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((item) => (
              <tr key={item.id}>
                <td>
                  <div>
                    <strong style={{ color: 'var(--text-bright)', fontSize: '13px' }}>
                      {getUserDisplayName(item)}
                    </strong>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--muted)' }}>
                      {item.email}
                      {item.id === user.id && <span style={{ marginLeft: '6px', color: 'var(--cyan-mint)', fontSize: '10px' }}>(You)</span>}
                    </div>
                  </div>
                </td>
                <td>
                  <select
                    className="role-select"
                    value={item.role}
                    disabled={updatingId === item.id}
                    onChange={(e) => handleRoleChange(item, e.target.value)}
                  >
                    <option value="admin">ADMIN</option>
                    <option value="analyst">ANALYST</option>
                    <option value="viewer">VIEWER</option>
                  </select>
                </td>
                <td>
                  <button
                    className={`status-toggle ${item.is_active ? 'active' : 'inactive'}`}
                    disabled={updatingId === item.id}
                    onClick={() => handleStatusToggle(item)}
                    title={item.is_active ? 'Click to suspend' : 'Click to activate'}
                  >
                    <span>{item.is_active ? '● Active' : '○ Suspended'}</span>
                  </button>
                </td>
                <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--muted)' }}>
                  {item.created_at ? new Date(item.created_at).toLocaleDateString() : 'N/A'}
                </td>
                <td>
                  <span className={`role-tag ${item.role}`}>
                    {item.role === 'admin' ? 'FULL CONTROL' : item.role === 'analyst' ? 'ANALYSIS & ASSESSMENTS' : 'READ-ONLY DATA'}
                  </span>
                </td>
                <td>
                  {item.id !== user.id && (
                    <button
                      className="delete-user-btn"
                      disabled={updatingId === item.id}
                      onClick={() => handleDeleteUser(item)}
                      title={`Permanently delete ${item.email}`}
                    >
                      🗑️ Delete
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AuthModal({ isOpen, onClose, onLogin, onRegister }) {
  const [tab, setTab] = useState('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [loading, setLoading] = useState(false);
  const [isReady, setIsReady] = useState(false);

  const validateNameFormat = (val) => {
    const trimmed = (val || '').trim();
    if (!trimmed) return 'Full name is required.';
    if (trimmed.length < 2) return 'Full name must be at least 2 characters.';
    return '';
  };

  const validateEmailFormat = (val) => {
    const trimmed = (val || '').trim();
    if (!trimmed) return 'Email address is required.';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmed)) {
      return 'Please enter a valid email address (e.g. name@domain.com).';
    }
    return '';
  };

  const validatePasswordFormat = (val) => {
    if (!val) return 'Password is required.';
    if (val.length < 12) {
      return `Password must be at least 12 characters (${val.length}/12).`;
    }
    if (val.length > 128) {
      return 'Password cannot exceed 128 characters.';
    }
    return '';
  };

  const handleBlur = (field) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    validateField(field);
  };

  const validateField = (field) => {
    let msg = '';
    if (field === 'name' && tab === 'register') {
      msg = validateNameFormat(name);
    } else if (field === 'email') {
      msg = validateEmailFormat(email);
    } else if (field === 'password') {
      msg = validatePasswordFormat(password);
    } else if (field === 'confirmPassword' && tab === 'register') {
      if (!confirmPassword) {
        msg = 'Please confirm your password.';
      } else if (confirmPassword !== password) {
        msg = 'Passwords do not match.';
      }
    }
    setFieldErrors((prev) => ({ ...prev, [field]: msg }));
    return !msg;
  };

  useEffect(() => {
    if (isOpen) {
      setIsReady(false);
      setEmail('');
      setName('');
      setPassword('');
      setConfirmPassword('');
      setError('');
      setFieldErrors({});
      setTouched({});
      setShowPassword(false);
      setShowConfirmPassword(false);

      const timer = setTimeout(() => {
        setIsReady(true);
        setEmail('');
        setPassword('');
      }, 120);

      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const switchTab = (nextTab) => {
    setTab(nextTab);
    setError('');
    setFieldErrors({});
    setTouched({});
    setEmail('');
    setName('');
    setPassword('');
    setConfirmPassword('');
    setShowPassword(false);
    setShowConfirmPassword(false);
    setIsReady(false);

    setTimeout(() => {
      setIsReady(true);
      setEmail('');
      setPassword('');
    }, 60);
  };

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const nameValid = tab === 'register' ? validateNameFormat(name) : '';
    const emailValid = validateEmailFormat(email);
    const passValid = validatePasswordFormat(password);
    const confirmValid = tab === 'register' ? (confirmPassword !== password ? 'Passwords do not match.' : '') : '';

    setTouched({ name: true, email: true, password: true, confirmPassword: true });
    setFieldErrors({
      name: nameValid,
      email: emailValid,
      password: passValid,
      confirmPassword: confirmValid,
    });

    if (nameValid || emailValid || passValid || confirmValid) {
      return;
    }

    setLoading(true);
    try {
      if (tab === 'login') {
        await onLogin(email.trim(), password);
      } else {
        await onRegister(email.trim(), password, name.trim());
      }
    } catch (err) {
      setError(err.message || 'Operation failed');
    } finally {
      setLoading(false);
    }
  };

  const nameHasError = touched.name && fieldErrors.name;
  const nameIsClean = touched.name && !fieldErrors.name && name.trim().length >= 2;
  const emailHasError = touched.email && fieldErrors.email;
  const emailIsClean = touched.email && !fieldErrors.email && email.length > 0;
  const passHasError = touched.password && fieldErrors.password;
  const passIsClean = touched.password && !fieldErrors.password && password.length >= 12;
  const confirmHasError = touched.confirmPassword && fieldErrors.confirmPassword;
  const confirmIsClean = touched.confirmPassword && !fieldErrors.confirmPassword && confirmPassword.length >= 12;

  return (
    <div className="auth-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="auth-modal-title">
      <div className="auth-modal" onClick={(e) => e.stopPropagation()}>
        <div className="auth-modal-header">
          <div className="auth-modal-title">
            <span className="section-kicker">MMR SECURITY GATEWAY</span>
            <h2 id="auth-modal-title">
              {tab === 'login' ? 'Sign In to MMR Console' : 'Create Account'}
            </h2>
            <p className="auth-context-desc">
              {tab === 'login'
                ? 'Authenticate with your verified credentials to access operational decision controls and spatial GIS analytics.'
                : 'Register a verified account to access operational maps and spatial analytics.'}
            </p>
          </div>
          <button className="auth-modal-close" onClick={onClose} aria-label="Close authentication modal" title="Close">✕</button>
        </div>

        <div className="auth-tabs" role="tablist">
          <button
            type="button"
            className={`auth-tab-btn ${tab === 'login' ? 'active' : ''}`}
            onClick={() => switchTab('login')}
            role="tab"
            aria-selected={tab === 'login'}
          >
            Sign In
          </button>
          <button
            type="button"
            className={`auth-tab-btn ${tab === 'register' ? 'active' : ''}`}
            onClick={() => switchTab('register')}
            role="tab"
            aria-selected={tab === 'register'}
          >
            Register
          </button>
        </div>

        {error && (
          <div className="auth-error-box" role="alert">
            <span style={{ fontSize: '14px' }}>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        <form className="auth-form" onSubmit={handleSubmit} noValidate autoComplete="off">
          {/* Decoy inputs to intercept aggressive browser autofill */}
          <div style={{ position: 'absolute', opacity: 0, height: 0, width: 0, pointerEvents: 'none', overflow: 'hidden' }} aria-hidden="true">
            <input type="text" name="fake_username_decoy" tabIndex="-1" autoComplete="off" />
            <input type="password" name="fake_password_decoy" tabIndex="-1" autoComplete="off" />
          </div>

          {tab === 'register' && (
            <div className="auth-field">
              <div className="auth-field-header">
                <label htmlFor="auth-name-input">Full Name</label>
                {nameIsClean && <span className="auth-char-count valid">✓ Valid</span>}
              </div>
              <div className="auth-input-wrapper">
                <input
                  id="auth-name-input"
                  name="user_full_name"
                  type="text"
                  required
                  disabled={loading}
                  autoComplete="off"
                  placeholder="Enter your name"
                  value={name}
                  className={nameHasError ? 'is-invalid' : nameIsClean ? 'is-valid' : ''}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (touched.name) {
                      setFieldErrors((prev) => ({ ...prev, name: validateNameFormat(e.target.value) }));
                    }
                  }}
                  onBlur={() => handleBlur('name')}
                />
              </div>
              {nameHasError && <span className="field-error-msg">⚠️ {fieldErrors.name}</span>}
            </div>
          )}

          <div className="auth-field">
            <div className="auth-field-header">
              <label htmlFor="auth-email-input">Email Address</label>
              {emailIsClean && <span className="auth-char-count valid">✓ Valid format</span>}
            </div>
            <div className="auth-input-wrapper">
              <input
                id="auth-email-input"
                name="user_login_identity"
                type="email"
                readOnly={!isReady}
                onFocus={() => setIsReady(true)}
                required
                disabled={loading}
                autoComplete="new-password"
                placeholder="Enter your email"
                value={email}
                className={emailHasError ? 'is-invalid' : emailIsClean ? 'is-valid' : ''}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (touched.email) {
                    setFieldErrors((prev) => ({ ...prev, email: validateEmailFormat(e.target.value) }));
                  }
                }}
                onBlur={() => handleBlur('email')}
              />
            </div>
            {emailHasError && <span className="field-error-msg">⚠️ {fieldErrors.email}</span>}
          </div>

          <div className="auth-field">
            <div className="auth-field-header">
              <label htmlFor="auth-password-input">Password</label>
              {tab === 'register' && (
                <span className={`auth-char-count ${password.length >= 12 ? 'valid' : ''}`}>
                  {password.length}/12 min chars
                </span>
              )}
            </div>
            <div className="auth-input-wrapper">
              <input
                id="auth-password-input"
                name="user_login_secret"
                type={showPassword ? 'text' : 'password'}
                readOnly={!isReady}
                onFocus={() => setIsReady(true)}
                required
                disabled={loading}
                autoComplete="new-password"
                placeholder={tab === 'login' ? 'Enter your password' : 'Enter your password (min 12 chars)'}
                value={password}
                className={`has-toggle ${passHasError ? 'is-invalid' : passIsClean ? 'is-valid' : ''}`}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (touched.password) {
                    setFieldErrors((prev) => ({ ...prev, password: validatePasswordFormat(e.target.value) }));
                  }
                  if (tab === 'register' && touched.confirmPassword) {
                    setFieldErrors((prev) => ({
                      ...prev,
                      confirmPassword: confirmPassword !== e.target.value ? 'Passwords do not match.' : '',
                    }));
                  }
                }}
                onBlur={() => handleBlur('password')}
              />
              <button
                type="button"
                className="password-toggle-btn"
                onClick={() => setShowPassword((prev) => !prev)}
                title={showPassword ? 'Hide password' : 'Show password'}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
            {passHasError && <span className="field-error-msg">⚠️ {fieldErrors.password}</span>}
          </div>

          {tab === 'register' && (
            <div className="auth-field">
              <div className="auth-field-header">
                <label htmlFor="auth-confirm-password-input">Confirm Password</label>
                {confirmIsClean && <span className="auth-char-count valid">✓ Matches</span>}
              </div>
              <div className="auth-input-wrapper">
                <input
                  id="auth-confirm-password-input"
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  disabled={loading}
                  autoComplete="off"
                  placeholder="Confirm your password"
                  value={confirmPassword}
                  className={`has-toggle ${confirmHasError ? 'is-invalid' : confirmIsClean ? 'is-valid' : ''}`}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    if (touched.confirmPassword) {
                      setFieldErrors((prev) => ({
                        ...prev,
                        confirmPassword: e.target.value !== password ? 'Passwords do not match.' : '',
                      }));
                    }
                  }}
                  onBlur={() => handleBlur('confirmPassword')}
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  title={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                  aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                >
                  {showConfirmPassword ? (
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
              {confirmHasError && <span className="field-error-msg">⚠️ {fieldErrors.confirmPassword}</span>}
            </div>
          )}

          <button type="submit" className="auth-submit-btn" disabled={loading}>
            {loading ? (
              <>
                <span className="btn-spinner"></span>
                <span>{tab === 'login' ? 'Authenticating...' : 'Registering Account...'}</span>
              </>
            ) : (
              tab === 'login' ? 'Sign In to MMR Console' : 'Register'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function App() {
  const [activeTab, setActiveTab] = useState('spatial');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [selectedAsset, setSelectedAsset] = useState('Kolshet Jetty');
  const [zoomed, setZoomed] = useState(false);
  const [scenario, setScenario] = useState('baseline');
  const [confidence, setConfidence] = useState(68);
  const [toast, setToast] = useState('');
  const [snapshot, setSnapshot] = useState(null);
  const [user, setUser] = useState(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [liveStatus, setLiveStatus] = useState({
    state: 'CHECKING',
    source: 'http://163.128.209.18:8013',
    timestamp: null,
    message: 'Checking live endpoint...',
  });

  const refreshSnapshot = async () => {
    try {
      const status = await getLiveApiStatus();
      setLiveStatus(status);
      const nextSnapshot = await getMmrSnapshot();
      setSnapshot(nextSnapshot);
    } catch (error) {
      console.error('Snapshot load failed:', error);
    }
  };

  const loadAuthUser = async () => {
    try {
      const currentUser = await getCurrentUser();
      setUser(currentUser);
    } catch (err) {
      console.error('Session restoration failed:', err);
    }
  };

  useEffect(() => {
    refreshSnapshot();
    loadAuthUser();
  }, []);

  const notify = (message) => {
    setToast(message);
    window.clearTimeout(window.mmrToastTimer);
    window.mmrToastTimer = window.setTimeout(() => setToast(''), 2600);
  };

  const handleLogin = async (email, password) => {
    const data = await loginUser(email, password);
    setUser(data.user);
    setAuthModalOpen(false);
    notify(`Welcome, ${getUserDisplayName(data.user)} (${data.user.role.toUpperCase()})`);
  };

  const handleRegister = async (email, password, name) => {
    await registerUser(email, password, name);
    // Automatically log in after registration
    const data = await loginUser(email, password);
    setUser(data.user);
    setAuthModalOpen(false);
    notify(`Account registered! Welcome, ${getUserDisplayName(data.user)}`);
  };

  const handleLogout = () => {
    clearStoredToken();
    setUser(null);
    if (activeTab === 'users') {
      setActiveTab('spatial');
    }
    notify('Signed out successfully');
  };

  const selectedEntity = snapshot?.entities.find((entity) => entity.name === selectedAsset) || null;
  const selectAsset = (asset) => {
    setSelectedAsset(asset);
    notify(assetDetails[asset] || asset);
  };

  return (
    <>
      <style>{styles}</style>
      <div className="app-shell">
        <Header
          onRefresh={() => {
            refreshSnapshot();
            notify('Refreshing verified local snapshot');
          }}
          liveStatus={liveStatus}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          user={user}
          onOpenAuth={() => setAuthModalOpen(true)}
          onLogout={handleLogout}
        />

        <main className={`workspace ${sidebarOpen && activeTab !== 'users' ? '' : 'sidebar-collapsed'}`}>
          {activeTab === 'spatial' && (
            <MapWorkspace
              selectedAsset={selectedAsset}
              selectedEntity={selectedEntity}
              onSelect={selectAsset}
              zoomed={zoomed}
              onZoomChange={setZoomed}
              onToast={notify}
              scenario={scenario}
              setScenario={setScenario}
              confidence={confidence}
              setConfidence={setConfidence}
              sidebarOpen={sidebarOpen}
              setSidebarOpen={setSidebarOpen}
              user={user}
              onOpenAuth={() => setAuthModalOpen(true)}
            />
          )}

          {activeTab === 'control' && (
            <ControlCenter
              selectedAsset={selectedAsset}
              selectedEntity={selectedEntity}
              scenario={scenario}
              setScenario={setScenario}
              confidence={confidence}
              setConfidence={setConfidence}
              runScenario={() => notify(`${scenarios[scenario][0]} evaluated`)}
              hasRun={true}
              readout={scenarios[scenario]}
              onToast={notify}
              user={user}
              onOpenAuth={() => setAuthModalOpen(true)}
            />
          )}

          {activeTab === 'users' && (
            <UserManagement user={user} onToast={notify} />
          )}

          {activeTab !== 'users' && (
            <IntelligencePanel
              selectedAsset={selectedAsset}
              selectedEntity={selectedEntity}
              onSelect={selectAsset}
              onToast={notify}
            />
          )}
        </main>

        <AuthModal
          isOpen={authModalOpen}
          onClose={() => setAuthModalOpen(false)}
          onLogin={handleLogin}
          onRegister={handleRegister}
        />

        <div className={`toast ${toast ? 'visible' : ''}`} role="status">
          {toast}
        </div>
      </div>
    </>
  );
}