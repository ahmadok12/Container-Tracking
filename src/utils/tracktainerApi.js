import { buildRoute } from './shipments';

// Tracktainer API Integration Utility

const EVENT_NAME_MAP = {
  EMSH: 'Empty Container Dispatched',
  GTIN: 'Gate In Full',
  LOAD: 'Loaded onto Vessel',
  DEPA: 'Departed Port',
  ARRI: 'Arrived at Port',
  DISC: 'Discharged from Vessel',
  CUCL: 'Customs Cleared',
  RCVE: 'Delivered to Consignee',
};

const FLAGS = { CN: '🇨🇳', PK: '🇵🇰', AE: '🇦🇪', SA: '🇸🇦', OM: '🇴🇲', SG: '🇸🇬', LK: '🇱🇰', MY: '🇲🇾', IN: '🇮🇳' };
const flagFor = (code) => FLAGS[code] || '📍';

function formatDate(isoStr) {
  if (!isoStr) return '';
  try {
    const d = new Date(isoStr);
    if (isNaN(d.getTime())) return isoStr;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch (e) {
    return isoStr;
  }
}

export function transformTracktainerShipment(item, detail = null) {
  const attr = (detail && detail.data && detail.data.attributes) || item.attributes;
  const id = (detail && detail.data && detail.data.id) || item.id;

  const containerNumber = String(attr.containers?.[0]?.number || attr.shipment_number || '').toUpperCase();
  const carrierName = attr.carrier?.name || 'Ocean Carrier';
  const delayDays = attr.delay_days || 0;
  const etaFormatted = formatDate(attr.eta);
  const etdFormatted = formatDate(attr.etd);

  const containerObj = attr.containers && attr.containers[0];
  const latestMovement = containerObj?.latest_movement;
  const vessel = latestMovement?.vessel;

  const vesselName = vessel?.name || '';
  const imo = vessel?.imo ? String(vessel.imo) : '';
  const voyage = latestMovement?.voyage || '';

  const polLat = attr.port_of_loading?.latitude || attr.origin?.latitude || 36.012;
  const polLng = attr.port_of_loading?.longitude || attr.origin?.longitude || 120.213;
  const podLat = attr.port_of_discharge?.latitude || attr.destination?.latitude || 24.7833;
  const podLng = attr.port_of_discharge?.longitude || attr.destination?.longitude || 66.9833;

  const hasLivePosition = vessel?.position?.latitude != null && vessel?.position?.longitude != null;
  const curLat = hasLivePosition ? vessel.position.latitude : null;
  const curLng = hasLivePosition ? vessel.position.longitude : null;

  // Parse milestones from movements
  let milestones = [];
  if (containerObj?.movements && Array.isArray(containerObj.movements)) {
    milestones = containerObj.movements.map((m, idx) => ({
      id: 'm-' + idx + '-' + (m.date || idx),
      date: formatDate(m.date),
      type: m.classifier === 'ACT' ? 'ACTUAL' : 'PLANNED',
      location: (m.location?.name || 'Port') + ', ' + (m.location?.country?.name || ''),
      countryFlag: flagFor(m.location?.country?.code),
      event: EVENT_NAME_MAP[m.event] || m.event,
      vesselInfo: m.vessel?.name
        ? `${m.vessel.name} VOY ${m.voyage || voyage}`
        : `${carrierName} • TRUCK`,
    }));
  }

  // Fallback milestones if empty
  if (milestones.length === 0) {
    milestones = [
      {
        id: 'm1',
        date: etdFormatted || 'Sep 28, 2026',
        type: 'ACTUAL',
        location: `${attr.port_of_loading?.name || 'Qingdao'}, China`,
        countryFlag: '🇨🇳',
        event: 'Departed Port',
        vesselInfo: vesselName ? `${vesselName} VOY ${voyage}` : carrierName,
      },
      {
        id: 'm2',
        date: etaFormatted || 'Oct 24, 2026',
        type: 'PLANNED',
        location: `${attr.port_of_discharge?.name || 'Karachi'}, Pakistan`,
        countryFlag: '🇵🇰',
        event: 'Arrived at Destination Port',
        vesselInfo: vesselName ? `${vesselName} VOY ${voyage}` : carrierName,
      },
    ];
  }

  return {
    id: id,
    source: 'tracktainer',
    containerNumber: containerNumber,
    blNumber: `${attr.carrier?.scac || 'BL'}-${containerNumber}`,
    carrier: carrierName,
    vesselName: vesselName,
    imo: imo,
    voyage: voyage,
    status: attr.shipment_status === 'IN_TRANSIT' ? 'In Transit' : attr.shipment_status || 'In Transit',
    statusBadge: delayDays > 0 ? `Delayed +${delayDays} days` : 'On Schedule',
    delayDays: delayDays,
    direct: attr.transshipment_count === 0,
    transitDays: attr.transit_time || 26,
    pol: {
      name: attr.port_of_loading?.name || attr.origin?.name || 'Qingdao',
      code: attr.port_of_loading?.code || attr.origin?.code || 'CNTAO',
      country: attr.port_of_loading?.country?.name || 'China',
      flag: flagFor(attr.port_of_loading?.country?.code || 'CN'),
      date: etdFormatted,
      lat: polLat,
      lng: polLng,
    },
    pod: {
      name: attr.port_of_discharge?.name || attr.destination?.name || 'Karachi',
      code: attr.port_of_discharge?.code || attr.destination?.code || 'PKKHI',
      country: attr.port_of_discharge?.country?.name || 'Pakistan',
      flag: flagFor(attr.port_of_discharge?.country?.code || 'PK'),
      date: etaFormatted,
      lat: podLat,
      lng: podLng,
    },
    currentPosition: hasLivePosition
      ? { lat: curLat, lng: curLng, source: 'live', statusDescription: vesselName ? `Underway (${vesselName})` : 'Underway' }
      : null,
    timeline: {
      eta: etaFormatted,
      ata: null,
      departureActual: etdFormatted,
      delayText: delayDays > 0 ? `Delayed +${delayDays} days` : 'On Schedule',
      isDelayed: delayDays > 0,
    },
    details: {
      containersCount: attr.container_count || 1,
      transhipments: attr.transshipment_count || 0,
      transitTime: `${attr.transit_time || 26} days`,
      ...(attr.co2 ? { carbon: `${attr.co2} t CO₂` } : {}),
    },
    routePath: buildRoute({ lat: polLat, lng: polLng }, { lat: podLat, lng: podLng }),
    milestones: milestones,
    lastSyncedAt: new Date().toISOString(),
  };
}

// Returns { shipments, error } — error is a human-readable reason when nothing could be loaded
export async function fetchLiveTracktainerShipments(apiKey, baseUrl = 'https://api.tracktainer.com/v1') {
  if (!apiKey) return { shipments: [], error: 'no-key' };
  const base = baseUrl.replace(/\/$/, '');
  const headers = { Authorization: 'Bearer ' + apiKey, Accept: 'application/vnd.api+json' };

  let listData;
  try {
    const listRes = await fetch(`${base}/ocean/shipments?page[size]=100`, { headers });
    if (listRes.status === 401 || listRes.status === 403) return { shipments: [], error: 'Tracktainer rejected the API key.' };
    if (!listRes.ok) return { shipments: [], error: `Tracktainer returned error ${listRes.status}.` };
    listData = await listRes.json();
  } catch {
    return { shipments: [], error: 'Could not reach Tracktainer from this browser (network or CORS block).' };
  }
  if (!Array.isArray(listData?.data)) return { shipments: [], error: 'Unexpected reply from Tracktainer.' };

  const shipments = await Promise.all(
    listData.data.map(async (item) => {
      try {
        const res = await fetch(`${base}/ocean/shipments/${item.id}`, { headers });
        if (res.ok) return transformTracktainerShipment(item, await res.json());
      } catch {
        /* fall back to list data */
      }
      return transformTracktainerShipment(item);
    })
  );
  return { shipments: shipments.filter((s) => s.containerNumber), error: null };
}
