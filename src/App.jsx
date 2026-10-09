import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import styles from './styles.js';
import { baseMapCenter, layers, mapBounds } from './mmrData.js';
import { getActionCapabilities, getLiveApiStatus, getMmrSnapshot } from './apiClient.js';

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

function Header({ onRefresh, liveStatus, activeTab, setActiveTab }) {
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
      </div>

      <div className="top-actions">
        <span className={`live-api-state ${liveStatus.state === 'ONLINE' ? 'online' : 'offline'}`}>
          LIVE API <b>{liveStatus.state}</b>
        </span>
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

function MapWorkspace({ selectedAsset, selectedEntity, onSelect, zoomed, onZoomChange, onToast, scenario, setScenario, confidence, setConfidence, sidebarOpen, setSidebarOpen }) {
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
      />
    </section>
  );
}

function ControlCenter({ selectedAsset, selectedEntity, scenario, setScenario, confidence, setConfidence, runScenario, hasRun, readout, onToast }) {
  const [mode, setMode] = useState('observe');
  const [replayOpen, setReplayOpen] = useState(false);
  const [actionState, setActionState] = useState('BLOCKED');
  const context = `${selectedAsset} · ${scenarios[scenario][0]}`;
  const blockedAction = (action) => {
    setActionState('BLOCKED');
    onToast(`${action} blocked: authority API contract unavailable`);
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
              <b>Decision Authority Endpoint</b>
              <small>Role, mandate and approval scope cannot be verified from the supplied contracts.</small>
            </div>
            <strong>BLOCKED</strong>
          </div>
          <div className="decision-actions">
            <button onClick={() => blockedAction('Approve')} disabled={!getActionCapabilities().approve}>
              Approve
            </button>
            <button onClick={() => blockedAction('Reject')} disabled={!getActionCapabilities().reject}>
              Reject
            </button>
            <button onClick={() => blockedAction('Escalate')} disabled={!getActionCapabilities().escalate}>
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
              <small>Deploy / assign API contract unavailable. No execution has been attempted.</small>
            </div>
            <span className="execution-dot blocked"></span>
          </div>
          <div className="act-actions">
            <button onClick={() => blockedAction('Deploy')} disabled={!getActionCapabilities().deploy}>
              Deploy
            </button>
            <button onClick={() => blockedAction('Assign')} disabled={!getActionCapabilities().assign}>
              Assign
            </button>
            <button
              className="replay-button"
              onClick={() => {
                setReplayOpen((value) => !value);
                onToast('Replay unavailable: no verified replay API contract');
              }}
            >
              ↺ Replay
            </button>
          </div>
          {replayOpen && (
            <div className="replay-log">
              <b>Replay Timeline</b>
              <span>UNAVAILABLE · NO EXECUTION EVENTS</span>
              <small>There is no verified execution record for {selectedAsset}.</small>
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

export default function App() {
  const [activeTab, setActiveTab] = useState('spatial');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [selectedAsset, setSelectedAsset] = useState('Kolshet Jetty');
  const [zoomed, setZoomed] = useState(false);
  const [scenario, setScenario] = useState('baseline');
  const [confidence, setConfidence] = useState(68);
  const [toast, setToast] = useState('');
  const [snapshot, setSnapshot] = useState(null);
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

  useEffect(() => {
    refreshSnapshot();
  }, []);

  const notify = (message) => {
    setToast(message);
    window.clearTimeout(window.mmrToastTimer);
    window.mmrToastTimer = window.setTimeout(() => setToast(''), 2600);
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
        />

        <main className={`workspace ${sidebarOpen ? '' : 'sidebar-collapsed'}`}>
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
            />
          )}

          <IntelligencePanel
            selectedAsset={selectedAsset}
            selectedEntity={selectedEntity}
            onSelect={selectAsset}
            onToast={notify}
          />
        </main>

        <div className={`toast ${toast ? 'visible' : ''}`} role="status">
          {toast}
        </div>
      </div>
    </>
  );
}