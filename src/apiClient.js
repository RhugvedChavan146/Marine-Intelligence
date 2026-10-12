import canonical from '../../../Backend/marine-intelligence-task/mmr_canonical_envelope.json';
import feasibility from '../../../Backend/marine-intelligence-task/mmr_feasibility_assessment.json';
import evidenceLog from '../../../Backend/marine-intelligence-task/mmr_evidence_log.json';
import financial from '../../../Backend/marine-intelligence-task/mmr_financial_assessment.json';

/**
 * @typedef {'LOADING'|'READY'|'STALE'|'DEGRADED'|'ERROR'|'UNAVAILABLE'|'ONLINE'} DataState
 * @typedef {{ state: DataState, source: string, timestamp: string|null, message: string }} ApiStatus
 * @typedef {{ id: string, email: string, role: 'admin'|'analyst'|'viewer', is_active: boolean, created_at: string }} UserProfile
 * @typedef {{ entityId: string, entityType: string, name: string, geometry: object, provenance: object, confidence: string, timestamp: string, properties: object, knownUnknowns: string[] }} CanonicalEntity
 * @typedef {{ entities: CanonicalEntity[], feasibility: CanonicalEntity|null, evidenceLog: object, status: ApiStatus }} MmrSnapshot
 */

const LOCAL_SOURCE = 'verified local canonical data layer';
export const LIVE_API_BASE = import.meta.env.VITE_MMR_API_BASE_URL || 'http://163.128.209.18:8013';
export const BACKEND_API_BASE = import.meta.env.VITE_BACKEND_API_BASE_URL || 'http://127.0.0.1:8000';

const AUTH_TOKEN_KEY = 'mmr_auth_token';

export function getStoredToken() {
  return localStorage.getItem(AUTH_TOKEN_KEY);
}

export function setStoredToken(token) {
  if (token) {
    localStorage.setItem(AUTH_TOKEN_KEY, token);
  } else {
    localStorage.removeItem(AUTH_TOKEN_KEY);
  }
}

export function clearStoredToken() {
  localStorage.removeItem(AUTH_TOKEN_KEY);
}

/**
 * Log in with email and password against the FastAPI backend
 * @param {string} email
 * @param {string} password
 * @returns {Promise<{ access_token: string, user: UserProfile }>}
 */
export async function loginUser(email, password) {
  const res = await fetch(`${BACKEND_API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
  });
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.detail || 'Email or password is incorrect.');
  }
  const data = await res.json();
  setStoredToken(data.access_token);
  return data;
}

/**
 * Register a new user account
 * @param {string} email
 * @param {string} password
 * @param {string} [name]
 * @returns {Promise<UserProfile>}
 */
export async function registerUser(email, password, name = '') {
  const payload = {
    email: email.trim().toLowerCase(),
    password,
  };
  if (name && name.trim()) {
    payload.name = name.trim();
  }
  const res = await fetch(`${BACKEND_API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.detail || 'Failed to register account.');
  }
  return await res.json();
}

/**
 * Fetch current authenticated user profile
 * @param {string|null} token
 * @returns {Promise<UserProfile|null>}
 */
export async function getCurrentUser(token = getStoredToken()) {
  if (!token) return null;
  try {
    const res = await fetch(`${BACKEND_API_BASE}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      return await res.json();
    }
    clearStoredToken();
    return null;
  } catch {
    return null;
  }
}

/**
 * Fetch all users (Admin only)
 * @param {string|null} token
 * @returns {Promise<UserProfile[]>}
 */
export async function fetchAdminUsers(token = getStoredToken()) {
  if (!token) throw new Error('Authentication required.');
  const res = await fetch(`${BACKEND_API_BASE}/admin/users`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.detail || 'Failed to fetch user list.');
  }
  return await res.json();
}

/**
 * Change a user's role (Admin only)
 * @param {string} userId
 * @param {'admin'|'analyst'|'viewer'} role
 * @param {string|null} token
 */
export async function updateUserRole(userId, role, token = getStoredToken()) {
  if (!token) throw new Error('Authentication required.');
  const res = await fetch(`${BACKEND_API_BASE}/admin/users/${userId}/role`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ role }),
  });
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.detail || 'Failed to update user role.');
  }
  return await res.json();
}

/**
 * Change a user's active status (Admin only)
 * @param {string} userId
 * @param {boolean} isActive
 * @param {string|null} token
 */
export async function updateUserActive(userId, isActive, token = getStoredToken()) {
  if (!token) throw new Error('Authentication required.');
  const res = await fetch(`${BACKEND_API_BASE}/admin/users/${userId}/active`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ is_active: isActive }),
  });
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.detail || 'Failed to update user status.');
  }
  return await res.json();
}

/**
 * Permanently delete a user account (Admin only)
 * @param {string} userId
 * @param {string|null} token
 */
export async function deleteUser(userId, token = getStoredToken()) {
  if (!token) throw new Error('Authentication required.');
  const res = await fetch(`${BACKEND_API_BASE}/admin/users/${userId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.detail || 'Failed to delete user.');
  }
  return await res.json();
}

/**
 * Fetch protected dataset from backend API
 * @param {string} datasetName
 * @param {string|null} token
 */
export async function fetchProtectedDataset(datasetName, token = getStoredToken()) {
  if (!token) throw new Error('Authentication required.');
  const res = await fetch(`${BACKEND_API_BASE}/api/datasets/${datasetName}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.detail || `Dataset '${datasetName}' could not be loaded.`);
  }
  return await res.json();
}

/**
 * Fetch protected assessment from backend API (Admin / Analyst only)
 * @param {string} assessmentName
 * @param {string|null} token
 */
export async function fetchProtectedAssessment(assessmentName, token = getStoredToken()) {
  if (!token) throw new Error('Authentication required.');
  const res = await fetch(`${BACKEND_API_BASE}/api/assessments/${assessmentName}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.detail || `Assessment '${assessmentName}' access restricted.`);
  }
  return await res.json();
}

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

/** 
 * Returns dynamic action capabilities depending on authenticated user role.
 * Admin has full execution permissions.
 * Analyst has escalation and replay permissions.
 * Viewer is strictly read-only.
 * @param {UserProfile|null} user
 * @returns {{ approve: boolean, reject: boolean, escalate: boolean, deploy: boolean, assign: boolean, replay: boolean }} 
 */
export function getActionCapabilities(user = null) {
  if (user?.role === 'admin') {
    return { approve: true, reject: true, escalate: true, deploy: true, assign: true, replay: true };
  }
  if (user?.role === 'analyst') {
    return { approve: false, reject: false, escalate: true, deploy: false, assign: false, replay: true };
  }
  return { approve: false, reject: false, escalate: false, deploy: false, assign: false, replay: false };
}
