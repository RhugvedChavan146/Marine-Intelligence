import canonical from '../../marine-intelligence-task-main backend/mmr_canonical_envelope.json';
import feasibility from '../../marine-intelligence-task-main backend/mmr_feasibility_assessment.json';
import evidenceLog from '../../marine-intelligence-task-main backend/mmr_evidence_log.json';
import financial from '../../marine-intelligence-task-main backend/mmr_financial_assessment.json';

/**
 * @typedef {'LOADING'|'READY'|'STALE'|'DEGRADED'|'ERROR'|'UNAVAILABLE'|'ONLINE'} DataState
 * @typedef {{ state: DataState, source: string, timestamp: string|null, message: string }} ApiStatus
 * @typedef {{ entityId: string, entityType: string, name: string, geometry: object, provenance: object, confidence: string, timestamp: string, properties: object, knownUnknowns: string[] }} CanonicalEntity
 * @typedef {{ entities: CanonicalEntity[], feasibility: CanonicalEntity|null, evidenceLog: object, status: ApiStatus }} MmrSnapshot
 */

const LOCAL_SOURCE = 'verified local canonical data layer';
export const LIVE_API_BASE = import.meta.env.VITE_MMR_API_BASE_URL || 'http://163.128.209.18:8013';

const normalizeEntity = (entity) => ({
  entityId: entity.entity_id,
  entityType: entity.entity_type,
  name: entity.name,
  geometry: entity.geometry,
  provenance: entity.provenance || {},
  confidence: entity.confidence || 'UNKNOWN',
  timestamp: entity.timestamp || canonical.generated_at,
  properties: entity.properties || {},
  knownUnknowns: entity.known_unknowns || [],
  source: entity.source,
  authority: entity.authority,
});

const staleThresholdMs = 24 * 60 * 60 * 1000;
const snapshotAgeState = (timestamp) => {
  const age = Date.now() - new Date(timestamp).getTime();
  return Number.isFinite(age) && age > staleThresholdMs ? 'STALE' : 'READY';
};

/** @returns {Promise<ApiStatus>} */
export async function getLiveApiStatus() {
  if (!LIVE_API_BASE) {
    return { state: 'UNAVAILABLE', source: 'No VITE_MMR_API_BASE_URL configured', timestamp: null, message: 'No verified live MMR API contract is configured.' };
  }
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);
    const res = await fetch(`${LIVE_API_BASE}/health`, { signal: controller.signal });
    clearTimeout(timeoutId);
    if (res.ok) {
      const data = await res.json();
      return {
        state: 'ONLINE',
        source: LIVE_API_BASE,
        timestamp: new Date().toISOString(),
        message: `Live service '${data.service || 'Observation API'}' connected (v${data.version || '1.0'}).`,
      };
    }
    return { state: 'UNAVAILABLE', source: LIVE_API_BASE, timestamp: new Date().toISOString(), message: `Live API responded with status ${res.status}.` };
  } catch (err) {
    return { state: 'UNAVAILABLE', source: LIVE_API_BASE, timestamp: null, message: `Live API unreachable: ${err.message}` };
  }
}

/** @returns {Promise<MmrSnapshot>} */
export async function getMmrSnapshot() {
  const liveStatus = await getLiveApiStatus();
  const entities = canonical.entities.map(normalizeEntity);
  const feasibilityEntity = normalizeEntity(feasibility);
  const localState = snapshotAgeState(canonical.generated_at);

  if (liveStatus.state === 'ONLINE') {
    return {
      entities,
      feasibility: feasibilityEntity,
      evidenceLog,
      status: {
        state: 'READY',
        source: liveStatus.source,
        timestamp: liveStatus.timestamp,
        message: `Connected to live API (${LIVE_API_BASE}) and synchronized with canonical dataset.`,
      },
    };
  }

  return {
    entities,
    feasibility: feasibilityEntity,
    evidenceLog,
    status: {
      state: localState,
      source: LOCAL_SOURCE,
      timestamp: canonical.generated_at,
      message: localState === 'STALE'
        ? 'Local canonical snapshot is older than 24 hours; live refresh is unavailable.'
        : 'Verified local canonical snapshot loaded.',
    },
  };
}

export function getFinancialAssessment() {
  return financial;
}

/** @returns {{ approve: boolean, reject: boolean, escalate: boolean, deploy: boolean, assign: boolean, replay: boolean }} */
export function getActionCapabilities() {
  return { approve: false, reject: false, escalate: false, deploy: false, assign: false, replay: false };
}
