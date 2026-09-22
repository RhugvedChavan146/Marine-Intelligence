import canonical from '../../marine-intelligence-task-main/mmr_canonical_envelope.json';
import feasibility from '../../marine-intelligence-task-main/mmr_feasibility_assessment.json';
import evidenceLog from '../../marine-intelligence-task-main/mmr_evidence_log.json';

/**
 * @typedef {'LOADING'|'READY'|'STALE'|'DEGRADED'|'ERROR'|'UNAVAILABLE'} DataState
 * @typedef {{ state: DataState, source: string, timestamp: string|null, message: string }} ApiStatus
 * @typedef {{ entityId: string, entityType: string, name: string, geometry: object, provenance: object, confidence: string, timestamp: string, properties: object, knownUnknowns: string[] }} CanonicalEntity
 * @typedef {{ entities: CanonicalEntity[], feasibility: CanonicalEntity|null, evidenceLog: object, status: ApiStatus }} MmrSnapshot
 */

const LOCAL_SOURCE = 'verified local canonical data layer';
const LIVE_API_BASE = import.meta.env.VITE_MMR_API_BASE_URL || '';

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

/** @returns {Promise<MmrSnapshot>} */
export async function getMmrSnapshot() {
  await Promise.resolve();
  const entities = canonical.entities.map(normalizeEntity);
  const feasibilityEntity = normalizeEntity(feasibility);
  const state = snapshotAgeState(canonical.generated_at);
  return {
    entities,
    feasibility: feasibilityEntity,
    evidenceLog,
    status: {
      state,
      source: LOCAL_SOURCE,
      timestamp: canonical.generated_at,
      message: state === 'STALE'
        ? 'Local canonical snapshot is older than 24 hours; live refresh is unavailable.'
        : 'Verified local canonical snapshot loaded.',
    },
  };
}

/** @returns {ApiStatus} */
export function getLiveApiStatus() {
  return LIVE_API_BASE
    ? { state: 'UNAVAILABLE', source: LIVE_API_BASE, timestamp: null, message: 'Live endpoint is configured but its contract is not verified in this repository.' }
    : { state: 'UNAVAILABLE', source: 'No VITE_MMR_API_BASE_URL configured', timestamp: null, message: 'No verified live MMR API contract is configured.' };
}

/** @returns {{ approve: boolean, reject: boolean, escalate: boolean, deploy: boolean, assign: boolean, replay: boolean }} */
export function getActionCapabilities() {
  return { approve: false, reject: false, escalate: false, deploy: false, assign: false, replay: false };
}
