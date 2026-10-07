export const defaultShipments = [
  {
    id: "ecd73c65-03bc-4dbb-8432-c83914914ee2",
    containerNumber: "TXGU6848701",
    blNumber: "KMTC-QDG-KHI-89102",
    carrier: "KMTC (Korea Marine Transport)",
    vesselName: "KMTC CHENNAI",
    imo: "9375513",
    voyage: "2605W",
    status: "In Transit",
    statusBadge: "Delayed +4 days",
    delayDays: 4,
    direct: true,
    transitDays: 37,
    pol: {
      name: "Qingdao",
      code: "CNTAO",
      country: "China",
      flag: "🇨🇳",
      date: "Aug 31, 2026",
      lat: 36.0671,
      lng: 120.3826
    },
    pod: {
      name: "Karachi",
      code: "PKKHI",
      country: "Pakistan",
      flag: "🇵🇰",
      date: "Oct 7, 2026",
      lat: 24.8607,
      lng: 67.0011
    },
    currentPosition: {
      lat: 23.85,
      lng: 65.8,
      speedKnots: 14.8,
      heading: 340,
      statusDescription: "Approaching Port of Karachi"
    },
    timeline: {
      eta: "Oct 7, 2026",
      ata: null,
      departureActual: "Aug 31, 2026",
      delayText: "Delayed +4 days",
      isDelayed: true
    },
    details: {
      containersCount: 1,
      transhipments: 0,
      transitTime: "37 days",
      carbon: "1.42 t CO₂"
    },
    routePath: [
      [36.0671, 120.3826],
      [31.23, 122.5],
      [24.5, 120.2],
      [15.0, 114.5],
      [4.0, 107.0],
      [1.3, 104.0],
      [2.5, 101.5],
      [5.5, 96.0],
      [6.0, 81.0],
      [10.0, 74.5],
      [18.0, 69.0],
      [23.85, 65.8],
      [24.8607, 67.0011]
    ],
    milestones: [
      {
        id: "m1",
        date: "Aug 24, 2026",
        type: "ACTUAL",
        location: "Qingdao, China",
        countryFlag: "🇨🇳",
        event: "Gate out empty",
        vesselInfo: "KMTC CHENNAI IMO 9375513 VOY 2605W"
      },
      {
        id: "m2",
        date: "Aug 27, 2026",
        type: "ACTUAL",
        location: "Qingdao, China",
        countryFlag: "🇨🇳",
        event: "Gate in full",
        vesselInfo: "KMTC CHENNAI IMO 9375513 VOY 2605W"
      },
      {
        id: "m3",
        date: "Aug 31, 2026",
        type: "ACTUAL",
        location: "Qingdao, China",
        countryFlag: "🇨🇳",
        event: "Gate in full",
        vesselInfo: "KMTC CHENNAI IMO 9375513 VOY 2605W"
      },
      {
        id: "m4",
        date: "Aug 31, 2026",
        type: "ACTUAL",
        location: "Qingdao, China",
        countryFlag: "🇨🇳",
        event: "Loaded",
        vesselInfo: "KMTC CHENNAI IMO 9375513 VOY 2605W"
      },
      {
        id: "m5",
        date: "Aug 31, 2026",
        type: "ACTUAL",
        location: "Qingdao, China",
        countryFlag: "🇨🇳",
        event: "Departed",
        vesselInfo: "KMTC CHENNAI IMO 9375513 VOY 2605W"
      },
      {
        id: "m6",
        date: "Oct 7, 2026",
        type: "PLANNED",
        location: "Karachi, Pakistan",
        countryFlag: "🇵🇰",
        event: "Arrived",
        vesselInfo: "KMTC CHENNAI IMO 9375513 VOY 2605W"
      }
    ],
    lastSyncedAt: "2026-10-07T13:00:00Z"
  }
];
