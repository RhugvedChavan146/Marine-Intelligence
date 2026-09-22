import canonical from '../../mmr_canonical_envelope.json';
import feasibility from '../../mmr_feasibility_assessment.json';
import ports from '../../ports.json';
import logistics from '../../logistics.json';
import waterways from '../../waterways.json';

const canonicalEntities = canonical.entities;
const coordinateToLatLng = ([longitude, latitude]) => [latitude, longitude];

export const layers = {
  nw53: {
    label: 'NW-53 waterway',
    color: '#42e0d3',
    geometry: canonicalEntities.find((entity) => entity.entity_id === 'WATERWAY_NW53').geometry.coordinates.map(coordinateToLatLng),
    source: 'IWAI / mmr_canonical_envelope.json',
  },
  waterways: {
    label: 'Waterways',
    color: '#6caef2',
    geometry: canonicalEntities.filter((entity) => entity.entity_type === 'waterway').map((entity) => ({ ...entity, coordinates: entity.geometry.coordinates.map(coordinateToLatLng) })),
    source: 'mmr_canonical_envelope.json',
  },
  terminals: {
    label: 'Terminals & jetties',
    color: '#42e0d3',
    geometry: canonicalEntities.filter((entity) => entity.entity_type === 'iwt_terminal'),
    source: 'IWAI / mmr_canonical_envelope.json',
  },
  ports: {
    label: 'Ports',
    color: '#6caef2',
    geometry: ports.filter((port) => ['Mumbai Port', 'Jawaharlal Nehru Port', 'Rewas Port'].includes(port.port_name)),
    source: 'ports.json',
  },
  logistics: {
    label: 'Logistics',
    color: '#ffbd70',
    geometry: logistics.filter((park) => park.park_name === 'Bhiwandi Logistics Cluster'),
    source: 'logistics.json',
  },
  roadRail: {
    label: 'Road / rail',
    color: '#a5b4bd',
    geometry: [],
    source: 'No road or rail geometry is present in the supplied data layer.',
    unavailable: true,
  },
  environmental: {
    label: 'Environmental',
    color: '#f27d71',
    geometry: canonicalEntities.filter((entity) => entity.entity_type === 'environmental_constraint'),
    source: 'Ramsar / mmr_canonical_envelope.json',
  },
  feasibility: {
    label: 'Feasibility',
    color: '#ffbd70',
    geometry: feasibility.geometry.coordinates.map(coordinateToLatLng),
    assessment: feasibility.properties,
    source: 'mmr_feasibility_assessment.json',
  },
};

export const baseMapCenter = [19.12, 72.98];
export const mapBounds = [[18.86, 72.74], [19.39, 73.18]];
export const waterwaySummary = waterways.iwt_terminals.filter((terminal) => terminal.waterway_name.includes('NW-53'));