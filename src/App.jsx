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
  { label: 'Spatial integrity', value: 'VERIFIED', source: 'national_gis_layer.py · 43 infrastructure nodes · 11 waterways' },
  { label: 'Nearest port distance', value: '29.44 km', source: 'mmr_feasibility_report.json · Haversine straight-line' },
  { label: 'Environmental constraint', value: 'FLAGGED', source: 'Thane Creek Ramsar Wetland Site · Ramsar Site No. 2490' },
];

function StatusBadge({ status }) {
  return <span className={`data-status status-${status.state.toLowerCase()}`} title={status.message}><i></i>{status.state}</span>;
}

function Header({ onRefresh, snapshotStatus, liveStatus }) {
  return <header className="topbar">
    <a className="brand" href="#/" aria-label="MMR Intelligence home"><span className="brand-mark"><span></span><span></span><span></span></span><span><strong>MMR</strong><small>INTELLIGENCE</small></span></a>
    <div className="study-context"><span className="live-dot"></span><span>NW-53 CORRIDOR STUDY</span><span className="context-separator">/</span><span className="muted">Mumbai Metropolitan Region</span></div>
    <div className="top-actions"><StatusBadge status={snapshotStatus}/><span className="live-api-state">API <b>{liveStatus.state}</b></span><button className="icon-button" onClick={onRefresh} aria-label="Refresh data" title="Refresh data">↻</button></div>
  </header>;
}

const layerOrder = ['nw53', 'waterways', 'terminals', 'ports', 'logistics', 'roadRail', 'environmental', 'feasibility'];
const layerType = (key) => key === 'terminals' ? 'terminal' : key === 'roadRail' ? 'road-rail' : key;

function MarineSpatialMap({ selectedAsset, onSelect, zoomed, onZoomChange, onToast }) {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const layerGroups = useRef({});
  const [visibleLayers, setVisibleLayers] = useState(Object.fromEntries(layerOrder.map((key) => [key, key !== 'roadRail'])));

  useEffect(() => {
    const map = L.map(mapRef.current, { zoomControl: false, attributionControl: true }).setView(baseMapCenter, 10);
    L.control.zoom({ position: 'bottomright' }).addTo(map);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '&copy; OpenStreetMap contributors', maxZoom: 19 }).addTo(map);
    map.fitBounds(mapBounds, { padding: [20, 20] });
    mapInstance.current = map;
    return () => { map.remove(); mapInstance.current = null; };
  }, []);

  useEffect(() => {
    const map = mapInstance.current;
    if (!map) return undefined;
    Object.values(layerGroups.current).forEach((group) => group.remove());
    layerGroups.current = {};
    const addPoint = (group, entity, name, type, lat, lon, details) => {
      const marker = L.circleMarker([lat, lon], { radius: selectedAsset === name ? 9 : 6, color: layers[type]?.color || '#42e0d3', weight: 2, fillColor: layers[type]?.color || '#42e0d3', fillOpacity: .9 });
      marker.bindPopup(`<strong>${name}</strong><br><span>${details}</span>`);
      marker.on('click', () => onSelect(name));
      marker.addTo(group);
    };
    layerOrder.forEach((key) => {
      const source = layers[key]; const group = L.layerGroup(); layerGroups.current[key] = group;
      if (key === 'nw53') L.polyline(source.geometry, { color: source.color, weight: 5, opacity: .9, dashArray: '8 7' }).bindTooltip('NW-53 · Kalyan-Thane-Mumbai Waterway').addTo(group);
      if (key === 'feasibility') L.polyline(source.geometry, { color: source.color, weight: 8, opacity: .45 }).bindTooltip(`Feasibility assessment · corridor ${source.assessment.structural_scores.corridor_score}`).addTo(group);
      if (key === 'waterways') source.geometry.forEach((entity) => L.polyline(entity.coordinates, { color: source.color, weight: 3, opacity: .65 }).bindTooltip(entity.name).addTo(group));
      if (key === 'terminals') source.geometry.forEach((entity) => { const [lon, lat] = entity.geometry.coordinates; addPoint(group, entity, entity.name, key, lat, lon, `${entity.properties.classification} · ${entity.source}`); });
      if (key === 'ports') source.geometry.forEach((port) => addPoint(group, port, port.port_name, key, port.latitude, port.longitude, `${port.port_type} · ${port.source}`));
      if (key === 'logistics') source.geometry.forEach((park) => addPoint(group, park, park.park_name, key, park.latitude, park.longitude, `${park.notes}`));
      if (key === 'environmental') source.geometry.forEach((entity) => { const [lon, lat] = entity.geometry.coordinates; addPoint(group, entity, entity.name, key, lat, lon, `${entity.known_unknowns[0]} · ${entity.source}`); });
      if (visibleLayers[key]) group.addTo(map);
    });
    return () => Object.values(layerGroups.current).forEach((group) => group.remove());
  }, [selectedAsset, visibleLayers, onSelect]);

  useEffect(() => { if (mapInstance.current) mapInstance.current.invalidateSize(); }, []);
  useEffect(() => { if (mapInstance.current) zoomed ? mapInstance.current.setView(baseMapCenter, 11) : mapInstance.current.fitBounds(mapBounds, { padding: [20, 20] }); }, [zoomed]);
  return <div className="real-map-shell"><div ref={mapRef} className={`leaflet-map ${zoomed ? 'zoomed' : ''}`} aria-label="Interactive Marine Spatial Map"></div><div className="map-layer-control"><div className="layer-control-title">MAP LAYERS <span>WGS84</span></div>{layerOrder.map((key) => <button key={key} className={`layer-toggle ${visibleLayers[key] ? 'active' : ''} ${layers[key].unavailable ? 'unavailable' : ''}`} onClick={() => { if (layers[key].unavailable) { onToast('Road / rail geometry is not present in the supplied data layer'); return; } setVisibleLayers((current) => ({ ...current, [key]: !current[key] })); }}><i style={{ backgroundColor: layers[key].color }}></i><span>{layers[key].label}</span><b>{layers[key].unavailable ? 'N/A' : visibleLayers[key] ? 'ON' : 'OFF'}</b></button>)}</div><div className="map-provider-note">OpenStreetMap basemap · supplied data layers only</div></div>;
}

function MapWorkspace({ selectedAsset, selectedEntity, onSelect, zoomed, onZoomChange, onToast, scenario, setScenario, confidence, setConfidence, snapshotStatus }) {
  const [hasRun, setHasRun] = useState(false);
  const [readout, setReadout] = useState(scenarios.baseline);
  const runScenario = () => { setReadout(scenarios[scenario]); setHasRun(true); onToast(`${scenarios[scenario][0]} loaded into the shared workspace`); };
  return <section className="map-workspace" aria-label="Marine Spatial Map">
    <div className="map-toolbar"><span className="map-title"><span className="section-kicker">MARINE SPATIAL VIEW</span><b>NW-53 corridor map</b></span><div className="map-tools"><button className="map-tool" onClick={() => { onZoomChange(true); onToast('NW-53 corridor focused'); }} title="Focus NW-53 corridor">◎ <span>Focus corridor</span></button><button className="map-tool" onClick={() => onZoomChange(false)} title="Zoom out">−</button><button className="map-tool" onClick={() => onZoomChange(true)} title="Zoom in">+</button></div></div>
    <div className="map-canvas"><MarineSpatialMap selectedAsset={selectedAsset} onSelect={onSelect} zoomed={zoomed} onZoomChange={onZoomChange} onToast={onToast}/><div className="map-status"><span className="status-icon">✓</span><span><b>Spatial integrity verified</b><small>43 infrastructure nodes · 11 waterways</small></span></div></div>
    <ControlCenter selectedAsset={selectedAsset} selectedEntity={selectedEntity} scenario={scenario} setScenario={setScenario} confidence={confidence} setConfidence={setConfidence} runScenario={runScenario} hasRun={hasRun} readout={readout} onToast={onToast} snapshotStatus={snapshotStatus}/>
  </section>;
}

function ControlCenter({ selectedAsset, selectedEntity, scenario, setScenario, confidence, setConfidence, runScenario, hasRun, readout, onToast, snapshotStatus }) {
  const [mode, setMode] = useState('observe');
  const [replayOpen, setReplayOpen] = useState(false);
  const [actionState, setActionState] = useState('BLOCKED');
  const context = `${selectedAsset} · ${scenarios[scenario][0]}`;
  const blockedAction = (action) => { setActionState('BLOCKED'); onToast(`${action} blocked: authority API contract unavailable`); };
  return <section className="control-center" aria-label="Control Center">
    <div className="control-heading"><span className="section-kicker">CONTROL CENTER</span><b>Operational decision loop</b><span className="control-status"><i></i>Shared context</span></div>
    <div className="control-status-row"><StatusBadge status={snapshotStatus}/><span>{snapshotStatus.message}</span></div>
    <div className="control-context"><span>CONTEXT</span><b>{context}</b><small>{selectedEntity ? `${selectedEntity.entityId} · ${selectedEntity.confidence} confidence · ${selectedEntity.timestamp}` : 'Canonical entity metadata is loading.'}</small></div>
    <div className="control-steps" role="tablist" aria-label="Control Center workflow">{[['observe', '01', 'Observe'], ['decide', '02', 'Decide'], ['act', '03', 'Act']].map(([key, number, label], index, tabs) => <button key={key} id={`control-tab-${key}`} className={mode === key ? 'active' : ''} onClick={() => setMode(key)} onKeyDown={(event) => { if (event.key === 'ArrowRight' || event.key === 'ArrowDown') { event.preventDefault(); document.getElementById(`control-tab-${tabs[(index + 1) % tabs.length][0]}`).focus(); setMode(tabs[(index + 1) % tabs.length][0]); } if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') { event.preventDefault(); document.getElementById(`control-tab-${tabs[(index - 1 + tabs.length) % tabs.length][0]}`).focus(); setMode(tabs[(index - 1 + tabs.length) % tabs.length][0]); } }} role="tab" aria-selected={mode === key} aria-controls={`control-panel-${key}`} tabIndex={mode === key ? 0 : -1}><i>{number}</i>{label}</button>)}</div>
    {mode === 'observe' && <div id="control-panel-observe" className="control-observe" role="tabpanel" aria-labelledby="control-tab-observe"><div className="control-evidence-grid">{controlEvidence.map((item) => <article key={item.label} className="evidence-item"><span>{item.label}</span><b className={item.value === 'FLAGGED' ? 'evidence-alert' : ''}>{item.value}</b><small>{item.source}</small></article>)}</div><div className="alert-strip"><span>!</span><b>Alert</b><span>Environmental clearance required before siting or dredging.</span><em>VERIFIED SIGNAL</em></div></div>}
    {mode === 'decide' && <div id="control-panel-decide" className="control-decide" role="tabpanel" aria-labelledby="control-tab-decide"><div className="decision-review"><button onClick={() => onToast('Evidence is available in Observe for this context')}>Inspect evidence</button><button onClick={() => onToast(`Scenario review: ${scenarios[scenario][0]}`)}>Review scenario</button><span>Decision context: <b>{context}</b></span></div><div className="authority-card"><div><span className="section-kicker">AUTHORITY CHECK</span><b>Decision authority endpoint</b><small>Role, mandate and approval scope cannot be verified from the supplied contracts.</small></div><strong>BLOCKED</strong></div><div className="decision-actions"><button onClick={() => blockedAction('Approve')} disabled={!getActionCapabilities().approve}>Approve</button><button onClick={() => blockedAction('Reject')} disabled={!getActionCapabilities().reject}>Reject</button><button onClick={() => blockedAction('Escalate')} disabled={!getActionCapabilities().escalate}>Escalate</button></div><p className="blocked-note">No action will be sent. Configure a verified authorization API before making a decision.</p></div>}
    {mode === 'act' && <div id="control-panel-act" className="control-act" role="tabpanel" aria-labelledby="control-tab-act"><div className="execution-card"><div><span className="section-kicker">EXECUTION STATUS</span><b>{actionState}</b><small>Deploy / assign API contract unavailable. No execution has been attempted.</small></div><span className="execution-dot blocked"></span></div><div className="act-actions"><button onClick={() => blockedAction('Deploy')} disabled={!getActionCapabilities().deploy}>Deploy</button><button onClick={() => blockedAction('Assign')} disabled={!getActionCapabilities().assign}>Assign</button><button className="replay-button" onClick={() => { setReplayOpen((value) => !value); onToast('Replay unavailable: no verified replay API contract'); }}>↺ Replay</button></div>{replayOpen && <div className="replay-log"><b>Replay timeline</b><span>UNAVAILABLE · NO EXECUTION EVENTS</span><small>There is no verified execution record for {selectedAsset}.</small></div>}</div>}
    <div className="control-footer"><div className="scenario-inline"><label htmlFor="scenario-select">Scenario</label><select id="scenario-select" value={scenario} onChange={(event) => { setScenario(event.target.value); }}><option value="baseline">Baseline / current network</option><option value="expansion">Jetty expansion candidate</option><option value="environment">Environmental clearance lens</option></select><label htmlFor="confidence-range">Confidence <output>{confidence}%</output></label><input id="confidence-range" type="range" min="0" max="100" value={confidence} onChange={(event) => setConfidence(event.target.value)}/><button className="run-button" onClick={runScenario}><span>▶</span> Run scenario</button></div><div className="control-readout"><span className="readout-icon">◌</span><span><b>{hasRun ? readout[0] : 'Baseline network'}</b><small>{readout[1]}</small></span></div></div>
  </section>;
}

function IntelligencePanel({ selectedAsset, selectedEntity, onSelect, onViewChange, onToast, snapshotStatus }) {
  return <aside className="intelligence-panel" aria-label="Planning and Intelligence"><div className="panel-heading"><div><span className="section-kicker">PLANNING &amp; INTELLIGENCE</span><h1>MMR corridor brief</h1></div><button className="icon-button quiet" title="Panel options">•••</button></div><div className="brief-meta"><span className="confidence-badge"><i></i> DATA CONFIDENCE {selectedEntity?.confidence || 'PENDING'}</span><span className="updated">{selectedEntity ? `UPDATED ${selectedEntity.timestamp.slice(0, 10)}` : 'SNAPSHOT LOADING'}</span></div><div className="selected-context"><span className="section-kicker">SELECTED LOCATION</span><b>{selectedAsset}</b><small>{selectedEntity ? `${selectedEntity.entityId} · ${selectedEntity.provenance.origin || selectedEntity.source} · ${selectedEntity.confidence} confidence · ${selectedEntity.timestamp}` : assetDetails[selectedAsset] || 'Source-backed spatial entity selected on map.'}</small></div><div className="panel-status"><StatusBadge status={snapshotStatus}/><span>{snapshotStatus.message}</span></div><div className="metric-grid"><article className="metric-card"><span>Feasibility score</span><strong>53.3</strong><small><i className="trend-flat">→</i> directional</small></article><article className="metric-card"><span>Model confidence</span><strong>{selectedEntity?.confidence || 'PENDING'}</strong><small>canonical entity confidence</small></article><article className="metric-card warning"><span>Congestion / diversion</span><strong>UNAVAILABLE</strong><small>traffic baseline missing</small></article><article className="metric-card warning"><span>Cost / investment</span><strong>NOT ASSESSED</strong><small>benchmarks missing</small></article></div>
    <div className="panel-section route-section"><div className="section-title"><span>Connectivity pulse</span><button className="text-button" onClick={() => onToast('Routes are shown on the Marine Spatial View')}>View on map <span>↗</span></button></div><div className="route-summary"><div><b>2</b><span>active jetties</span></div><div className="route-bar"><span></span></div><div><b>29.44 km</b><span>nearest port</span></div></div><div className="route-list">{[['Kolshet Jetty', '29.44 km'], ['Gaimukh Jetty', '30.66 km']].map(([asset, distance]) => <button key={asset} className={`route-row ${selectedAsset === asset ? 'selected' : ''}`} onClick={() => onSelect(asset)}><span className="route-bullet cyan"></span><span><b>{asset}</b><small>→ Rewas Port</small></span><strong>{distance}</strong><span>›</span></button>)}</div><p className="method-note">Straight-line Haversine distance. Not a navigable route length.</p></div>
    <div className="panel-section planning-section"><div className="section-title"><span>Scenario outlook</span><span className="signal-count">DATA-BACKED ONLY</span></div><div className="planning-grid"><div><span>Baseline</span><b>Current NW-53 snapshot</b><small>2 jetties · 3 connected ports</small></div><div><span>Projected state</span><b className="unavailable-text">UNAVAILABLE</b><small>No traffic, cargo or growth feed connected.</small></div><div><span>Congestion / diversion</span><b className="unavailable-text">NOT ASSESSED</b><small>Requires verified road-traffic baseline.</small></div><div><span>Cost / investment</span><b className="unavailable-text">NOT ASSESSED</b><small>Requires IWAI/MMRDA benchmarks.</small></div></div></div>
    <div className="panel-section reasoning-section"><div className="section-title"><span>AI reasoning trace</span><span className="signal-count">TRACEABLE INPUTS</span></div><p className="reasoning-copy">No generative recommendation is issued. Current directional readout is derived from verified spatial connectivity and environmental flags only.</p><div className="input-chips"><span>WATERWAY_NW53</span><span>TERMINAL_21/22</span><span>FEASIBILITY_NW53_MMR</span><span>ENV_16</span></div></div>
    <div className="panel-section alerts-section"><div className="section-title"><span>Intelligence signals</span><span className="signal-count">3 items</span></div><button className="signal-row critical" onClick={() => onSelect('Thane Creek Ramsar Wetland Site')}><span className="signal-icon">!</span><span><b>Environmental clearance required</b><small>Both active jetties overlap the Thane Creek Ramsar corridor.</small></span><span>›</span></button><button className="signal-row neutral"><span className="signal-icon">i</span><span><b>Feasibility score pending</b><small>Depth, navigability and seasonal data are not connected.</small></span><span>›</span></button><button className="signal-row neutral"><span className="signal-icon">i</span><span><b>Traffic baseline unavailable</b><small>Decongestion assessment is not yet assessed.</small></span><span>›</span></button></div>
  </aside>;
}

export default function App() {
  const [selectedAsset, setSelectedAsset] = useState('Kolshet Jetty'); const [zoomed, setZoomed] = useState(false); const [scenario, setScenario] = useState('baseline'); const [confidence, setConfidence] = useState(68); const [toast, setToast] = useState(''); const [snapshot, setSnapshot] = useState(null); const [snapshotStatus, setSnapshotStatus] = useState({ state: 'LOADING', source: 'verified local canonical data layer', timestamp: null, message: 'Loading verified MMR snapshot.' }); const liveStatus = getLiveApiStatus();
  const refreshSnapshot = async () => { setSnapshotStatus((current) => ({ ...current, state: 'LOADING', message: 'Loading verified MMR snapshot.' })); try { const nextSnapshot = await getMmrSnapshot(); setSnapshot(nextSnapshot); setSnapshotStatus(nextSnapshot.status); } catch (error) { setSnapshotStatus({ state: 'ERROR', source: 'verified local canonical data layer', timestamp: null, message: `Snapshot load failed: ${error.message}` }); } };
  useEffect(() => { refreshSnapshot(); }, []);
  const notify = (message) => { setToast(message); window.clearTimeout(window.mmrToastTimer); window.mmrToastTimer = window.setTimeout(() => setToast(''), 2600); };
  const selectedEntity = snapshot?.entities.find((entity) => entity.name === selectedAsset) || null;
  const selectAsset = (asset) => { setSelectedAsset(asset); notify(assetDetails[asset] || asset); };
  return <><style>{styles}</style><div className="app-shell"><Header onRefresh={() => { refreshSnapshot(); notify('Refreshing verified local snapshot'); }} snapshotStatus={snapshotStatus} liveStatus={liveStatus}/><main className="workspace"><MapWorkspace selectedAsset={selectedAsset} selectedEntity={selectedEntity} onSelect={selectAsset} zoomed={zoomed} onZoomChange={setZoomed} onToast={notify} scenario={scenario} setScenario={setScenario} confidence={confidence} setConfidence={setConfidence} snapshotStatus={snapshotStatus}/><IntelligencePanel selectedAsset={selectedAsset} selectedEntity={selectedEntity} onSelect={selectAsset} onToast={notify} snapshotStatus={snapshotStatus}/></main><div className={`toast ${toast ? 'visible' : ''}`} role="status">{toast}</div></div></>;
}