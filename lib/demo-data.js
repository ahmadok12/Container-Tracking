// Sample data in the same shape the proxy returns, used only when DEMO_MODE=true.
// Lets you preview the app before adding the real Tracktainer API key.

const port = (name, code, country, cc, lat, lon) => ({
  name, code, country: { name: country, code: cc }, latitude: lat, longitude: lon,
});

const SHA = port('Shanghai', 'CNSHA', 'China', 'CN', 31.2304, 121.4737);
const SIN = port('Singapore', 'SGSIN', 'Singapore', 'SG', 1.2644, 103.84);
const JEA = port('Jebel Ali', 'AEJEA', 'United Arab Emirates', 'AE', 25.0112, 55.0617);
const NGB = port('Ningbo', 'CNNGB', 'China', 'CN', 29.8683, 121.544);
const SSZ = port('Santos', 'BRSSZ', 'Brazil', 'BR', -23.9608, -46.3336);
const RTM = port('Rotterdam', 'NLRTM', 'Netherlands', 'NL', 51.95, 4.14);
const KHI = port('Karachi', 'PKKHI', 'Pakistan', 'PK', 24.8465, 66.9784);
const HAM = port('Hamburg', 'DEHAM', 'Germany', 'DE', 53.5461, 9.9661);

const now = new Date();
const d = (offset) => new Date(now.getTime() + offset * 864e5).toISOString().slice(0, 10);
const ts = (offset) => new Date(now.getTime() + offset * 864e5).toISOString().replace(/\.\d+Z$/, 'Z');

const vessel = (name, imo, position = null) => ({ name, imo, call_sign: null, ...(position ? { position } : {}) });
const mv = (event, classifier, date, location, v = null, voyage = null, mode = 'VESSEL') => ({
  event, classifier, date, location, vessel: v, voyage, transport_mode: mode,
});

const shipments = [
  {
    id: '7d1c2b8e-4a3f-4c11-9e55-0b6f2a9d1c01',
    number: 'MSKU2909637', numberType: 'CONTAINER', name: 'Furniture order 1182',
    status: 'IN_TRANSIT', failure: null,
    carrier: { name: 'Maersk', scac: 'MAEU' },
    origin: SHA, destination: JEA, pol: SHA, pod: JEA,
    etd: d(-9), eta: d(6), delayDays: 2, transitTime: 15, containerCount: 1,
    trackingActive: true, lastCheckedAt: ts(-0.1), createdAt: ts(-14), updatedAt: ts(-0.1),
    teu: 2, co2: 1.84, transshipments: 1,
    containers: [{
      container_number: 'MSKU2909637', container_size: 40, container_type: 'HC',
      latest_movement: mv('DEPA', 'ACT', d(-2), SIN, vessel('MAERSK SENTOSA', 9632179, { latitude: 7.9, longitude: 82.2 }), '247W'),
      movements: [
        mv('EMSH', 'ACT', d(-13), SHA, null, null, 'TRUCK'),
        mv('GTIN', 'ACT', d(-11), SHA, null, null, 'TRUCK'),
        mv('LOAD', 'ACT', d(-9), SHA, vessel('MAERSK HONAM', 9786847), '245S'),
        mv('DEPA', 'ACT', d(-9), SHA, vessel('MAERSK HONAM', 9786847), '245S'),
        mv('ARRI', 'ACT', d(-4), SIN, vessel('MAERSK HONAM', 9786847), '245S'),
        mv('DISC', 'ACT', d(-4), SIN, vessel('MAERSK HONAM', 9786847), '245S'),
        mv('LOAD', 'ACT', d(-2), SIN, vessel('MAERSK SENTOSA', 9632179), '247W'),
        mv('DEPA', 'ACT', d(-2), SIN, vessel('MAERSK SENTOSA', 9632179), '247W'),
        mv('ARRI', 'EST', d(6), JEA, vessel('MAERSK SENTOSA', 9632179), '247W'),
        mv('DISC', 'EST', d(6), JEA, vessel('MAERSK SENTOSA', 9632179), '247W'),
      ],
    }],
    route: {
      type: 'FeatureCollection', container_number: 'MSKU2909637',
      features: [
        { type: 'Feature', id: 'port-1', geometry: { type: 'Point', coordinates: [121.4737, 31.2304] }, properties: { feature_type: 'PORT', sequence: 1, label: 'POL', reached: true, name: 'Shanghai', locode: 'CNSHA' } },
        { type: 'Feature', id: 'port-2', geometry: { type: 'Point', coordinates: [103.84, 1.2644] }, properties: { feature_type: 'PORT', sequence: 2, label: 'TS', reached: true, name: 'Singapore', locode: 'SGSIN' } },
        { type: 'Feature', id: 'port-3', geometry: { type: 'Point', coordinates: [55.0617, 25.0112] }, properties: { feature_type: 'PORT', sequence: 3, label: 'POD', reached: false, name: 'Jebel Ali', locode: 'AEJEA' } },
        { type: 'Feature', id: 'leg-1', geometry: { type: 'LineString', coordinates: [[121.47, 31.23], [122.6, 29.5], [120.2, 24.0], [116.5, 21.0], [111.0, 12.0], [105.5, 4.0], [103.84, 1.26]] }, properties: { feature_type: 'LEG', sequence: 1, status: 'COMPLETED', part: null, routed: true } },
        { type: 'Feature', id: 'leg-2-actual', geometry: { type: 'LineString', coordinates: [[103.84, 1.26], [100.5, 3.8], [97.0, 6.0], [88.0, 6.5], [82.2, 7.9]] }, properties: { feature_type: 'LEG', sequence: 2, status: 'IN_TRANSIT', part: 'ACTUAL', routed: true } },
        { type: 'Feature', id: 'leg-2-estimated', geometry: { type: 'LineString', coordinates: [[82.2, 7.9], [76.0, 9.0], [66.0, 17.0], [58.8, 23.0], [56.6, 26.4], [55.06, 25.01]] }, properties: { feature_type: 'LEG', sequence: 2, status: 'IN_TRANSIT', part: 'ESTIMATED', routed: true } },
        { type: 'Feature', id: 'vessel', geometry: { type: 'Point', coordinates: [82.2, 7.9] }, properties: { feature_type: 'VESSEL', name: 'MAERSK SENTOSA', imo: 9632179, reported_at: ts(-0.2) } },
      ],
    },
    etaChanges: [
      { old_eta: d(5), new_eta: d(6), delta_days: 1, changed_at: ts(-3) },
      { old_eta: d(4), new_eta: d(5), delta_days: 1, changed_at: ts(-7) },
    ],
  },
  {
    id: '7d1c2b8e-4a3f-4c11-9e55-0b6f2a9d1c02',
    number: 'MSCU7283613', numberType: 'CONTAINER', name: null,
    status: 'ARRIVED', failure: null,
    carrier: { name: 'MSC', scac: 'MSCU' },
    origin: NGB, destination: SSZ, pol: NGB, pod: SSZ,
    etd: d(-38), eta: d(-1), delayDays: 0, transitTime: 37, containerCount: 1,
    trackingActive: true, lastCheckedAt: ts(-0.3), createdAt: ts(-45), updatedAt: ts(-0.3),
    teu: 2, co2: 3.1, transshipments: 0,
    containers: [{
      container_number: 'MSCU7283613', container_size: 40, container_type: 'HC',
      latest_movement: mv('DISC', 'ACT', d(-1), SSZ, vessel('MSC ARINA', 9839131), '612W'),
      movements: [
        mv('GTIN', 'ACT', d(-41), NGB, null, null, 'TRUCK'),
        mv('LOAD', 'ACT', d(-38), NGB, vessel('MSC ARINA', 9839131), '612W'),
        mv('DEPA', 'ACT', d(-38), NGB, vessel('MSC ARINA', 9839131), '612W'),
        mv('ARRI', 'ACT', d(-1), SSZ, vessel('MSC ARINA', 9839131), '612W'),
        mv('DISC', 'ACT', d(-1), SSZ, vessel('MSC ARINA', 9839131), '612W'),
        mv('GTOT', 'EST', d(2), SSZ, null, null, 'TRUCK'),
      ],
    }],
    route: {
      type: 'FeatureCollection', container_number: 'MSCU7283613',
      features: [
        { type: 'Feature', id: 'port-1', geometry: { type: 'Point', coordinates: [121.544, 29.8683] }, properties: { feature_type: 'PORT', sequence: 1, label: 'POL', reached: true, name: 'Ningbo' } },
        { type: 'Feature', id: 'port-2', geometry: { type: 'Point', coordinates: [-46.3336, -23.9608] }, properties: { feature_type: 'PORT', sequence: 2, label: 'POD', reached: true, name: 'Santos' } },
        { type: 'Feature', id: 'leg-1', geometry: { type: 'LineString', coordinates: [[121.54, 29.87], [120.2, 24.0], [111.0, 12.0], [105.5, 4.0], [103.8, 1.2], [96.0, -5.0], [75.0, -20.0], [40.0, -33.0], [20.0, -36.0], [0.0, -32.0], [-30.0, -27.0], [-46.33, -23.96]] }, properties: { feature_type: 'LEG', sequence: 1, status: 'COMPLETED', part: null, routed: true } },
      ],
    },
    etaChanges: [],
  },
  {
    id: '7d1c2b8e-4a3f-4c11-9e55-0b6f2a9d1c03',
    number: 'HLXU8134520', numberType: 'CONTAINER', name: 'Textile rolls',
    status: 'COMPLETED', failure: null,
    carrier: { name: 'Hapag-Lloyd', scac: 'HLCU' },
    origin: KHI, destination: HAM, pol: KHI, pod: HAM,
    etd: d(-52), eta: d(-21), delayDays: 0, transitTime: 31, containerCount: 1,
    trackingActive: false, lastCheckedAt: ts(-15), createdAt: ts(-60), updatedAt: ts(-15),
    teu: 1, co2: 0.9, transshipments: 0,
    containers: [{
      container_number: 'HLXU8134520', container_size: 20, container_type: 'DC',
      latest_movement: mv('EMRT', 'ACT', d(-16), HAM, null, null, 'TRUCK'),
      movements: [
        mv('GTIN', 'ACT', d(-54), KHI, null, null, 'TRUCK'),
        mv('LOAD', 'ACT', d(-52), KHI, vessel('BERLIN EXPRESS', 9501332), '041W'),
        mv('DEPA', 'ACT', d(-52), KHI, vessel('BERLIN EXPRESS', 9501332), '041W'),
        mv('ARRI', 'ACT', d(-21), HAM, vessel('BERLIN EXPRESS', 9501332), '041W'),
        mv('DISC', 'ACT', d(-21), HAM, vessel('BERLIN EXPRESS', 9501332), '041W'),
        mv('GTOT', 'ACT', d(-19), HAM, null, null, 'TRUCK'),
        mv('EMRT', 'ACT', d(-16), HAM, null, null, 'TRUCK'),
      ],
    }],
    route: {
      type: 'FeatureCollection', container_number: 'HLXU8134520',
      features: [
        { type: 'Feature', id: 'port-1', geometry: { type: 'Point', coordinates: [66.9784, 24.8465] }, properties: { feature_type: 'PORT', sequence: 1, label: 'POL', reached: true, name: 'Karachi' } },
        { type: 'Feature', id: 'port-2', geometry: { type: 'Point', coordinates: [9.9661, 53.5461] }, properties: { feature_type: 'PORT', sequence: 2, label: 'POD', reached: true, name: 'Hamburg' } },
        { type: 'Feature', id: 'leg-1', geometry: { type: 'LineString', coordinates: [[66.98, 24.85], [60.0, 20.0], [51.0, 12.5], [43.4, 12.6], [38.0, 20.0], [32.6, 29.9], [32.3, 31.3], [20.0, 34.5], [11.0, 37.5], [-5.6, 35.95], [-9.5, 38.0], [-9.5, 43.5], [-5.0, 48.5], [1.5, 50.9], [4.0, 52.0], [8.0, 54.0], [9.97, 53.55]] }, properties: { feature_type: 'LEG', sequence: 1, status: 'COMPLETED', part: null, routed: true } },
      ],
    },
    etaChanges: [{ old_eta: d(-23), new_eta: d(-21), delta_days: 2, changed_at: ts(-30) }],
  },
  {
    id: '7d1c2b8e-4a3f-4c11-9e55-0b6f2a9d1c04',
    number: 'CMAU5501927', numberType: 'CONTAINER', name: 'Spare parts',
    status: 'PLANNED', failure: null,
    carrier: { name: 'CMA CGM', scac: 'CMDU' },
    origin: RTM, destination: KHI, pol: RTM, pod: KHI,
    etd: d(4), eta: d(29), delayDays: 0, transitTime: 25, containerCount: 1,
    trackingActive: true, lastCheckedAt: ts(-0.5), createdAt: ts(-3), updatedAt: ts(-0.5),
    teu: 2, co2: null, transshipments: 0,
    containers: [{
      container_number: 'CMAU5501927', container_size: 40, container_type: 'DC',
      latest_movement: mv('EMSH', 'ACT', d(-1), RTM, null, null, 'TRUCK'),
      movements: [
        mv('EMSH', 'ACT', d(-1), RTM, null, null, 'TRUCK'),
        mv('LOAD', 'EST', d(4), RTM, vessel('CMA CGM JULES VERNE', 9454436), '0FL3E'),
        mv('DEPA', 'EST', d(4), RTM, vessel('CMA CGM JULES VERNE', 9454436), '0FL3E'),
        mv('ARRI', 'EST', d(29), KHI, vessel('CMA CGM JULES VERNE', 9454436), '0FL3E'),
      ],
    }],
    route: null,
    etaChanges: [],
  },
  {
    id: '7d1c2b8e-4a3f-4c11-9e55-0b6f2a9d1c05',
    number: 'ONEU0042788', numberType: 'CONTAINER', name: null,
    status: 'PENDING', failure: null,
    carrier: { name: 'ONE', scac: 'ONEY' },
    origin: null, destination: null, pol: null, pod: null,
    etd: null, eta: null, delayDays: 0, transitTime: null, containerCount: 0,
    trackingActive: true, lastCheckedAt: null, createdAt: ts(-0.05), updatedAt: ts(-0.05),
    teu: null, co2: null, transshipments: null,
    containers: [], route: null, etaChanges: [],
  },
];

const SUMMARY_KEYS = ['id', 'number', 'numberType', 'name', 'status', 'failure', 'carrier', 'origin', 'destination', 'pol', 'pod', 'etd', 'eta', 'delayDays', 'transitTime', 'containerCount', 'trackingActive', 'lastCheckedAt', 'createdAt', 'updatedAt'];

export function demoList() {
  return {
    items: shipments.map((s) => Object.fromEntries(SUMMARY_KEYS.map((k) => [k, s[k]]))),
    nextCursor: null,
  };
}

export function demoDetail(id) {
  return shipments.find((s) => s.id === id) || null;
}
