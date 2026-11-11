// Shipment domain helpers: dates, status, progress, ports and shipment building.

export const STATUSES = [
  'Booked',
  'Gate In Full',
  'Loaded',
  'Departed',
  'In Transit',
  'Transhipment',
  'Arrived',
  'Discharged',
  'Customs Clearance',
  'Delivered',
];

const ARRIVED_STATUSES = new Set(['Arrived', 'Discharged', 'Customs Clearance', 'Delivered']);

export const CARRIERS = [
  { code: 'KMTC', name: 'KMTC' },
  { code: 'MSK', name: 'Maersk' },
  { code: 'MSC', name: 'MSC' },
  { code: 'CMA', name: 'CMA CGM' },
  { code: 'COSCO', name: 'COSCO' },
  { code: 'OOCL', name: 'OOCL' },
  { code: 'ONE', name: 'ONE' },
  { code: 'HPL', name: 'Hapag-Lloyd' },
  { code: 'EMC', name: 'Evergreen' },
  { code: 'YML', name: 'Yang Ming' },
  { code: 'HMM', name: 'HMM' },
  { code: 'PIL', name: 'PIL' },
  { code: 'ZIM', name: 'ZIM' },
];

// Common ports for China → Pakistan / Gulf trade
export const PORTS = [
  { code: 'CNTAO', name: 'Qingdao', country: 'China', flag: '🇨🇳', lat: 36.07, lng: 120.38 },
  { code: 'CNSHA', name: 'Shanghai', country: 'China', flag: '🇨🇳', lat: 31.23, lng: 121.8 },
  { code: 'CNNGB', name: 'Ningbo', country: 'China', flag: '🇨🇳', lat: 29.87, lng: 121.85 },
  { code: 'CNTXG', name: 'Tianjin', country: 'China', flag: '🇨🇳', lat: 38.98, lng: 117.75 },
  { code: 'CNXMN', name: 'Xiamen', country: 'China', flag: '🇨🇳', lat: 24.45, lng: 118.07 },
  { code: 'CNYTN', name: 'Shenzhen (Yantian)', country: 'China', flag: '🇨🇳', lat: 22.57, lng: 114.27 },
  { code: 'CNNSA', name: 'Guangzhou (Nansha)', country: 'China', flag: '🇨🇳', lat: 22.65, lng: 113.67 },
  { code: 'PKKHI', name: 'Karachi', country: 'Pakistan', flag: '🇵🇰', lat: 24.78, lng: 66.98 },
  { code: 'PKBQM', name: 'Port Qasim', country: 'Pakistan', flag: '🇵🇰', lat: 24.77, lng: 67.33 },
  { code: 'AEJEA', name: 'Jebel Ali', country: 'UAE', flag: '🇦🇪', lat: 25.01, lng: 55.06 },
  { code: 'SADMM', name: 'Dammam', country: 'Saudi Arabia', flag: '🇸🇦', lat: 26.5, lng: 50.2 },
  { code: 'OMSOH', name: 'Sohar', country: 'Oman', flag: '🇴🇲', lat: 24.5, lng: 56.63 },
];

export const findPort = (code) => PORTS.find((p) => p.code === code);

// ---------- Dates ----------
export const formatDate = (value) => {
  if (!value) return '';
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

export const parseDate = (value) => {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
};

// "Oct 7, 2026" -> "2026-10-07" for <input type="date">
export const toInputDate = (value) => {
  const d = parseDate(value);
  if (!d) return '';
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

// "2026-10-07" -> "Oct 7, 2026" (parsed as local date, not UTC)
export const fromInputDate = (value) => {
  if (!value) return '';
  const [y, m, d] = value.split('-').map(Number);
  return formatDate(new Date(y, m - 1, d));
};

export const today = () => formatDate(new Date());

const DAY = 86400000;
export const daysBetween = (a, b) => {
  const da = parseDate(a);
  const db = parseDate(b);
  if (!da || !db) return null;
  return Math.round((db - da) / DAY);
};

// ---------- Status ----------
export const isArrived = (s) => ARRIVED_STATUSES.has(s?.status) || !!s?.timeline?.ata;
export const isDelayed = (s) => !isArrived(s) && Number(s?.delayDays) > 0;

export const delayLabel = (days) => {
  const n = Number(days) || 0;
  if (n > 0) return `Delayed +${n} day${n === 1 ? '' : 's'}`;
  if (n < 0) return `Early ${Math.abs(n)} day${n === -1 ? '' : 's'}`;
  return 'On Schedule';
};

export const statusGroup = (s) => {
  if (isArrived(s)) return 'arrived';
  if (isDelayed(s)) return 'delayed';
  return 'transit';
};

export const STATUS_STYLES = {
  arrived: { label: 'Arrived', pill: 'bg-slate-100 text-slate-700 ring-slate-200', dot: 'bg-slate-500' },
  delayed: { label: 'Delayed', pill: 'bg-red-50 text-red-700 ring-red-100', dot: 'bg-red-500' },
  transit: { label: 'On Schedule', pill: 'bg-brand-50 text-brand-700 ring-brand-100', dot: 'bg-brand-500' },
};

// Voyage progress 0..1 from departure to ETA
export const voyageProgress = (s) => {
  if (isArrived(s)) return 1;
  const dep = parseDate(s?.timeline?.departureActual || s?.pol?.date);
  const eta = parseDate(s?.timeline?.eta || s?.pod?.date);
  if (!dep || !eta || eta <= dep) return 0;
  return Math.min(1, Math.max(0, (Date.now() - dep) / (eta - dep)));
};

// days until the delay-adjusted ETA
export const daysToEta = (s) => {
  const eta = effectiveEta(s);
  if (!eta) return null;
  return Math.ceil((eta - Date.now()) / DAY);
};

// ---------- Routes ----------
// Rough sea-lane waypoints from China to the Arabian Sea / Gulf
const SEA_LANE = [
  [21.0, 116.5], // off Hong Kong
  [12.0, 111.5], // South China Sea
  [1.25, 104.0], // Singapore Strait
  [5.8, 94.5], // Malacca exit
  [5.6, 80.5], // south of Sri Lanka
  [15.0, 68.0], // Arabian Sea
];
export const buildRoute = (pol, pod) => {
  const path = [[pol.lat, pol.lng]];
  // northern ports pass through the Taiwan Strait first
  if (pol.lat > 37.5) path.push([38.4, 121.3], [36.6, 123.2]); // out of Bohai Sea
  if (pol.lat > 26) path.push([28.0, 123.0], [24.5, 119.5]);
  path.push(...SEA_LANE);
  if (pod.lng < 62) path.push([22.8, 60.5]); // Gulf of Oman
  if (pod.lng < 56.5) path.push([26.4, 56.6]); // Strait of Hormuz
  path.push([pod.lat, pod.lng]);
  return path;
};

// Interpolate a point along a polyline at fraction t
export const pointAlong = (path, t) => {
  if (!path?.length) return null;
  if (t <= 0 || path.length === 1) return path[0];
  if (t >= 1) return path[path.length - 1];
  const seg = [];
  let total = 0;
  for (let i = 1; i < path.length; i++) {
    const d = Math.hypot(path[i][0] - path[i - 1][0], path[i][1] - path[i - 1][1]);
    seg.push(d);
    total += d;
  }
  let target = total * t;
  for (let i = 0; i < seg.length; i++) {
    if (target <= seg[i]) {
      const f = seg[i] ? target / seg[i] : 0;
      return [
        path[i][0] + (path[i + 1][0] - path[i][0]) * f,
        path[i][1] + (path[i + 1][1] - path[i][1]) * f,
      ];
    }
    target -= seg[i];
  }
  return path[path.length - 1];
};

// ---------- Build / update ----------
const uid = (p) => `${p}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

export const buildShipment = (form) => {
  const pol = findPort(form.polCode) || PORTS[0];
  const pod = findPort(form.podCode) || PORTS[7];
  const etd = fromInputDate(form.etd) || today();
  const eta = fromInputDate(form.eta) || formatDate(new Date(Date.now() + 25 * DAY));
  const transitDays = daysBetween(etd, eta) ?? 25;
  const carrier = CARRIERS.find((c) => c.code === form.carrier)?.name || form.carrier || 'Ocean Carrier';
  const containerNumber = form.containerNumber.trim().toUpperCase();
  const vesselName = (form.vesselName || '').trim().toUpperCase();
  const voyage = (form.voyage || '').trim().toUpperCase();
  const vesselInfo = vesselName ? `${vesselName}${voyage ? ` VOY ${voyage}` : ''}` : carrier;
  const departed = parseDate(etd) <= new Date();
  const routePath = buildRoute(pol, pod);

  return {
    id: uid('jst'),
    containerNumber,
    blNumber: (form.blNumber || '').trim().toUpperCase(),
    supplier: (form.supplier || '').trim(),
    goods: (form.goods || '').trim(),
    carrier,
    vesselName,
    imo: '',
    voyage,
    status: departed ? 'In Transit' : 'Booked',
    statusBadge: 'On Schedule',
    delayDays: 0,
    direct: true,
    transitDays,
    pol: { ...pol, date: etd },
    pod: { ...pod, date: eta },
    currentPosition: null,
    timeline: { eta, ata: null, departureActual: etd, delayText: 'On Schedule', isDelayed: false },
    details: {
      containersCount: Number(form.containersCount) || 1,
      transhipments: 0,
      transitTime: `${transitDays} days`,
    },
    routePath,
    milestones: [
      {
        id: uid('m'),
        date: etd,
        type: departed ? 'ACTUAL' : 'PLANNED',
        location: `${pol.name}, ${pol.country}`,
        countryFlag: pol.flag,
        event: 'Departed',
        vesselInfo,
      },
      {
        id: uid('m'),
        date: eta,
        type: 'PLANNED',
        location: `${pod.name}, ${pod.country}`,
        countryFlag: pod.flag,
        event: 'Arrival',
        vesselInfo,
      },
    ],
    lastSyncedAt: new Date().toISOString(),
  };
};

export const applyStatusUpdate = (s, u) => {
  const next = { ...s, timeline: { ...(s.timeline || {}) } };
  if (u.status) next.status = u.status;
  next.autoClosed = false;
  if (u.delayDays !== undefined) {
    next.delayDays = Number(u.delayDays) || 0;
    next.statusBadge = delayLabel(next.delayDays);
    next.timeline.delayText = next.statusBadge;
    next.timeline.isDelayed = next.delayDays > 0;
  }
  if (u.eta) {
    next.timeline.eta = u.eta;
    next.pod = { ...(next.pod || {}), date: u.eta };
  }
  if (u.ata !== undefined) next.timeline.ata = u.ata || null;
  if (u.addMilestone) {
    const portByName = PORTS.find((p) => u.addMilestone.location?.toLowerCase().includes(p.name.toLowerCase()));
    next.milestones = [
      ...(next.milestones || []),
      {
        id: uid('m'),
        date: u.addMilestone.date || today(),
        type: u.addMilestone.type || 'ACTUAL',
        location: u.addMilestone.location || next.pod?.name,
        countryFlag: portByName?.flag || '📍',
        event: u.addMilestone.event || 'Status updated',
        vesselInfo: next.vesselName ? `${next.vesselName}${next.voyage ? ` VOY ${next.voyage}` : ''}` : next.carrier,
      },
    ];
  }
  next.lastSyncedAt = new Date().toISOString();
  return next;
};

export const sortMilestones = (list = []) =>
  [...list].sort((a, b) => (parseDate(a.date)?.getTime() ?? 0) - (parseDate(b.date)?.getTime() ?? 0));

export const sameShipment = (a, b) =>
  !!a && !!b && (a.id === b.id || a.containerNumber === b.containerNumber);

// ---------- Auto close ----------
// ETA pushed out by any recorded delay (delay days are on top of the ETA)
export const effectiveEta = (s) => {
  const eta = parseDate(s?.timeline?.eta || s?.pod?.date);
  if (!eta) return null;
  return new Date(eta.getTime() + Math.max(Number(s?.delayDays) || 0, 0) * DAY);
};

const startOfToday = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

export const isOverdue = (s) => {
  if (isArrived(s)) return false;
  const eta = effectiveEta(s);
  return !!eta && eta < startOfToday();
};

const closeMilestones = (s, arrivedOn) => {
  const today0 = startOfToday();
  const list = (s.milestones || []).map((m) =>
    m.type === 'PLANNED' && (parseDate(m.date) ?? today0) < today0 ? { ...m, type: 'ACTUAL' } : m
  );
  if (list.some((m) => /arriv/i.test(m.event || '') && m.type === 'ACTUAL')) return list;
  return [
    ...list,
    {
      id: uid('m'),
      date: arrivedOn,
      type: 'ACTUAL',
      location: `${s.pod?.name || ''}${s.pod?.country ? `, ${s.pod.country}` : ''}`,
      countryFlag: s.pod?.flag || '📍',
      event: 'Arrived (auto-closed after ETA)',
      vesselInfo: s.vesselName || s.carrier || '',
    },
  ];
};

// Marks shipments whose (delay-adjusted) ETA is before today as Arrived.
// Tracktainer shipments are left alone — their status comes from the carrier.
export const autoCloseOverdue = (list) => {
  let changed = 0;
  const next = list.map((s) => {
    if (s.source === 'tracktainer' || !isOverdue(s)) return s;
    changed += 1;
    const arrivedOn = formatDate(effectiveEta(s));
    return {
      ...s,
      status: 'Arrived',
      autoClosed: true,
      timeline: { ...(s.timeline || {}), ata: arrivedOn },
      milestones: closeMilestones(s, arrivedOn),
    };
  });
  return { list: changed ? next : list, changed };
};
