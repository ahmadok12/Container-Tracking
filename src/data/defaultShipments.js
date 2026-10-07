export const defaultShipments = [
  {
    id: "2c36479a-2286-49ae-b251-9099b22e5a71",
    containerNumber: "TCNU2692599",
    blNumber: "CMDU-TCNU2692599",
    carrier: "Cma Cgm",
    vesselName: "APL CHONGQING",
    imo: "9461867",
    voyage: "0P52IS1MA",
    status: "In Transit",
    statusBadge: "On Schedule",
    delayDays: 0,
    direct: true,
    transitDays: 26,
    pol: {
      name: "Qingdao",
      code: "CNTAO",
      country: "China",
      flag: "🇨🇳",
      date: "Sep 28, 2026",
      lat: 36.012,
      lng: 120.213
    },
    pod: {
      name: "Karachi",
      code: "PKKHI",
      country: "Pakistan",
      flag: "🇵🇰",
      date: "Oct 24, 2026",
      lat: 24.7833,
      lng: 66.9833
    },
    currentPosition: {
      lat: 24.2202,
      lng: 118.9443,
      speedKnots: 15.2,
      heading: 235,
      statusDescription: "Underway in Taiwan Strait (APL CHONGQING)"
    },
    timeline: {
      eta: "Oct 24, 2026",
      ata: null,
      departureActual: "Sep 28, 2026",
      delayText: "On Schedule",
      isDelayed: false
    },
    details: {
      containersCount: 1,
      transhipments: 0,
      transitTime: "26 days",
      carbon: "1.55 t CO₂"
    },
    routePath: [
      [36.012, 120.213],
      [31.2, 122.5],
      [24.2202, 118.9443],
      [14.0, 112.0],
      [2.0, 104.0],
      [6.0, 80.0],
      [24.7833, 66.9833]
    ],
    milestones: [
      {
        id: "m1",
        date: "Sep 20, 2026",
        type: "ACTUAL",
        location: "Qingdao, China",
        countryFlag: "🇨🇳",
        event: "Empty Container Dispatched",
        vesselInfo: "Cma Cgm • TRUCK"
      },
      {
        id: "m2",
        date: "Sep 26, 2026",
        type: "ACTUAL",
        location: "Qingdao, China",
        countryFlag: "🇨🇳",
        event: "Gate In Full",
        vesselInfo: "Cma Cgm • TRUCK"
      },
      {
        id: "m3",
        date: "Sep 28, 2026",
        type: "ACTUAL",
        location: "Qingdao, China",
        countryFlag: "🇨🇳",
        event: "Loaded onto Vessel",
        vesselInfo: "APL CHONGQING IMO 9461867 VOY 0P52IS1MA"
      },
      {
        id: "m4",
        date: "Sep 28, 2026",
        type: "ACTUAL",
        location: "Qingdao, China",
        countryFlag: "🇨🇳",
        event: "Departed Port",
        vesselInfo: "APL CHONGQING IMO 9461867 VOY 0P52IS1MA"
      },
      {
        id: "m5",
        date: "Oct 24, 2026",
        type: "PLANNED",
        location: "Karachi, Pakistan",
        countryFlag: "🇵🇰",
        event: "Arrived at Destination Port",
        vesselInfo: "APL CHONGQING IMO 9461867 VOY 0P52JN1MA"
      }
    ],
    lastSyncedAt: "2026-10-07T12:00:00Z"
  },
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
      carbon: "1.02 t CO₂"
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
        event: "Loaded",
        vesselInfo: "KMTC CHENNAI IMO 9375513 VOY 2605W"
      },
      {
        id: "m4",
        date: "Aug 31, 2026",
        type: "ACTUAL",
        location: "Qingdao, China",
        countryFlag: "🇨🇳",
        event: "Departed",
        vesselInfo: "KMTC CHENNAI IMO 9375513 VOY 2605W"
      },
      {
        id: "m5",
        date: "Oct 7, 2026",
        type: "PLANNED",
        location: "Karachi, Pakistan",
        countryFlag: "🇵🇰",
        event: "Arrived",
        vesselInfo: "KMTC CHENNAI IMO 9375513 VOY 2605W"
      }
    ],
    lastSyncedAt: "2026-10-07T11:00:00Z"
  }
];
