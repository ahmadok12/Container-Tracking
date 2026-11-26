// Container Tracker PWA. Talks only to /api/tracktainer (our proxy), never to Tracktainer directly.

const API = '/api/tracktainer';
const view = document.getElementById('view');
const state = { list: null, listCursor: null, listError: null, details: new Map(), filter: 'all' };

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const store = {
  get(k) { try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* private mode */ } },
};

class ApiError extends Error {
  constructor(message, code, status) { super(message); this.code = code; this.status = status; }
}

async function api(params) {
  const qs = new URLSearchParams(params);
  let res;
  try {
    res = await fetch(`${API}?${qs}`, { headers: { Accept: 'application/json' } });
  } catch {
    throw new ApiError("You seem to be offline. Check your internet connection and try again.", 'offline', 0);
  }
  let body = null;
  try { body = await res.json(); } catch { /* not json */ }
  if (!res.ok) {
    throw new ApiError(body?.error?.message || 'Something went wrong. Please try again.', body?.error?.code || 'error', res.status);
  }
  return body;
}

const dateFmt = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
const shortFmt = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short' });
function parseDay(s) {
  if (!s) return null;
  const [y, m, d] = s.slice(0, 10).split('-').map(Number);
  return new Date(y, m - 1, d);
}
const fmtDate = (s) => (s ? dateFmt.format(parseDay(s)) : '—');
const fmtShort = (s) => (s ? shortFmt.format(parseDay(s)) : '—');
function daysFromToday(s) {
  const d = parseDay(s);
  if (!d) return null;
  const t = new Date(); t.setHours(0, 0, 0, 0);
  return Math.round((d - t) / 864e5);
}
function timeAgo(iso) {
  if (!iso) return 'not yet';
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 2) return 'just now';
  if (mins < 60) return `${mins} min ago`;
  const h = Math.round(mins / 60);
  if (h < 24) return `${h} hour${h > 1 ? 's' : ''} ago`;
  const d = Math.round(h / 24);
  return `${d} day${d > 1 ? 's' : ''} ago`;
}
const placeName = (p) => (p ? p.name : null);
const placeFull = (p) => (p ? [p.name, p.country?.name].filter(Boolean).join(', ') : 'Not known yet');
const title = (s) => (s ? s.charAt(0) + s.slice(1).toLowerCase() : '');

/* ------------------------------------------------------------------ */
/* Plain-language status                                               */
/* ------------------------------------------------------------------ */

const FAILURES = {
  NOT_FOUND: "The shipping line doesn't recognise this number yet.",
  CANCELLED: 'The shipping line says this shipment was cancelled.',
  CARRIER_NOT_SUPPORTED: "This shipping line isn't supported for tracking.",
  CARRIER_NOT_DETECTED: "We couldn't tell which shipping line this number belongs to.",
};

function statusInfo(s) {
  if (s.failure) return { label: "Can't track", cls: 's-problem', hint: FAILURES[s.failure] || 'Tracking is not possible for this number.' };
  switch (s.status) {
    case 'IN_TRANSIT': return { label: 'On the way', cls: 's-transit', hint: 'Your container is travelling by sea.' };
    case 'ARRIVED': return { label: 'Arrived', cls: 's-arrived', hint: 'The ship has reached the destination port.' };
    case 'COMPLETED': return { label: 'Delivered', cls: 's-done', hint: 'The journey is finished.' };
    case 'PLANNED': return { label: 'Booked', cls: 's-planned', hint: 'Booked and waiting to sail.' };
    case 'CANCELLED': return { label: 'Cancelled', cls: 's-problem', hint: 'This shipment was cancelled.' };
    default: return { label: 'Getting details', cls: 's-pending', hint: "We're collecting the latest details from the shipping line. This can take a little while." };
  }
}
const pill = (s) => { const i = statusInfo(s); return `<span class="pill ${i.cls}">${esc(i.label)}</span>`; };

const EVENTS = {
  EMSH: ['Empty container sent for packing', 'box'],
  GTIN: ['Dropped off at the port', 'gate'],
  LOAD: ['Loaded onto the ship', 'load'],
  DEPA: ['Ship left the port', 'ship'],
  ARRI: ['Ship arrived at the port', 'anchor'],
  DISC: ['Unloaded from the ship', 'unload'],
  GTOT: ['Picked up from the port', 'truck'],
  EMRT: ['Empty container returned', 'check'],
};

// Four simple stages: Booked > Sailing > Arrived > Delivered
function progress(s, container) {
  const mv = container?.movements || [];
  const act = (codes) => mv.some((m) => m.classifier === 'ACT' && codes.includes(m.event));
  const podCode = s.pod?.code;
  const lastDiscAtPod = mv.some((m) => m.classifier === 'ACT' && m.event === 'DISC' && (!podCode || m.location?.code === podCode));
  const st = s.status;
  const sailed = ['IN_TRANSIT', 'ARRIVED', 'COMPLETED'].includes(st) || act(['DEPA']);
  const arrived = ['ARRIVED', 'COMPLETED'].includes(st) || lastDiscAtPod;
  const delivered = st === 'COMPLETED' || act(['EMRT']) || (arrived && mv.some((m) => m.classifier === 'ACT' && m.event === 'GTOT' && (!podCode || m.location?.code === podCode)));
  const hasData = st !== 'PENDING' && st !== 'CANCELLED' && !s.failure;
  const done = [hasData, sailed, arrived, delivered];
  return { done, current: done.indexOf(false) };
}

function stepper(s, container) {
  const { done, current } = progress(s, container);
  const away = daysFromToday(s.eta);
  let tag = '';
  if (current === 2 && away != null) tag = away > 0 ? `${away} day${away === 1 ? '' : 's'} away` : away === 0 ? 'Due today' : 'Due any time';
  else if (current === 1 && s.etd) {
    const d = daysFromToday(s.etd);
    tag = d > 0 ? `Sails in ${d} day${d === 1 ? '' : 's'}` : 'Sailing soon';
  }
  const tick = '<svg viewBox="0 0 12 12"><path d="M2.5 6.2 5 8.6l4.5-5"/></svg>';
  let html = '<div class="stepper" role="img" aria-label="' + esc(['Booked', 'Sailing', 'Arrived', 'Delivered'].map((l, i) => `${l} ${done[i] ? 'done' : 'not yet'}`).join(', ')) + '">';
  for (let i = 0; i < 4; i++) {
    const cls = done[i] ? 'done' : i === current ? 'now' : '';
    html += `<span class="step ${cls}">${done[i] ? tick : ''}${i === current && tag ? `<span class="tag">${esc(tag)}</span>` : ''}</span>`;
    if (i < 3) html += `<span class="bar ${done[i + 1] ? 'done' : ''}"></span>`;
  }
  html += '</div><div class="step-labels"><span>Booked</span><span>Sailing</span><span>Arrived</span><span>Delivered</span></div>';
  return html;
}

/* ------------------------------------------------------------------ */
/* Artwork                                                             */
/* ------------------------------------------------------------------ */

function shipScene(opts = {}) {
  const sky = opts.sky !== false;
  const id = Math.random().toString(36).slice(2, 7);
  return `<div class="ship-scene" aria-hidden="true"><svg viewBox="0 0 360 120" preserveAspectRatio="xMidYMax slice">
    <defs>
      <linearGradient id="sea${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5BA7C8"/><stop offset="1" stop-color="#2F7FA6"/></linearGradient>
    </defs>
    ${sky ? '<circle cx="300" cy="34" r="16" fill="#FFC9A8"/><circle cx="300" cy="34" r="24" fill="#FFC9A8" opacity=".35"/>' : ''}
    <g class="ss-gull" fill="none" stroke="#5A5A62" stroke-width="1.6" stroke-linecap="round"><path d="M236 52q4-4 8 0q4-4 8 0"/><path d="M258 42q3-3 6 0q3-3 6 0"/></g>
    <path class="ss-wave-back" fill="#9CCBE0" d="M0 92 q22.5-7 45 0t45 0 45 0 45 0 45 0 45 0 45 0 45 0 45 0 45 0 45 0 45 0 V120 H0Z"/>
    <g class="ss-ship"><g class="ss-bob">
      <g class="ss-smoke" fill="#C9C3BF"><circle cx="214" cy="38" r="4"/><circle cx="214" cy="38" r="4"/><circle cx="214" cy="38" r="4"/></g>
      <rect x="128" y="60" width="18" height="12" rx="1.5" fill="#FF6B35"/><rect x="147" y="60" width="18" height="12" rx="1.5" fill="#2E86AB"/><rect x="166" y="60" width="18" height="12" rx="1.5" fill="#F4B942"/>
      <rect x="137" y="47" width="18" height="12" rx="1.5" fill="#E8553E"/><rect x="156" y="47" width="18" height="12" rx="1.5" fill="#FF8F5E"/><rect x="175" y="60" width="0" height="0"/>
      <rect x="185" y="60" width="18" height="12" rx="1.5" fill="#3A3A40"/>
      <rect x="208" y="44" width="16" height="28" rx="2" fill="#FFFFFF"/><rect x="211" y="48" width="10" height="4" rx="1" fill="#2E86AB"/><rect x="211" y="55" width="10" height="3" rx="1" fill="#CFE3EA"/>
      <rect x="210" y="40" width="9" height="5" fill="#FF6B35"/>
      <path d="M112 72 H236 L226 92 H124 Z" fill="#1C1C1E"/><path d="M116 78 H233" stroke="#FF6B35" stroke-width="2.4"/>
    </g></g>
    <path class="ss-wave-front" fill="url(#sea${id})" d="M0 96 q22.5 6 45 0t45 0 45 0 45 0 45 0 45 0 45 0 45 0 45 0 45 0 45 0 45 0 V120 H0Z"/>
    <g class="ss-wave-front" stroke="#FFFFFF" stroke-opacity=".55" stroke-width="1.5" stroke-linecap="round"><path d="M30 106h14M120 110h10M210 105h16M300 109h12M390 106h14M480 110h10"/></g>
  </svg></div>`;
}

const containerIcon = '<svg viewBox="0 0 32 32"><rect x="3" y="9" width="26" height="15" rx="2" fill="#FF6B35"/><path d="M8 11v11M12.5 11v11M17 11v11M21.5 11v11M26 11v11" stroke="#fff" stroke-opacity=".55" stroke-width="1.3"/><rect x="3" y="9" width="26" height="3" rx="1.5" fill="#E8553E"/></svg>';
const vesselIcon = '<svg viewBox="0 0 32 32"><rect x="9" y="11" width="5" height="4" rx=".6" fill="#FF6B35"/><rect x="14.5" y="11" width="5" height="4" rx=".6" fill="#2E86AB"/><rect x="20" y="8" width="4" height="7" rx=".6" fill="#fff"/><path d="M5 15h22l-3 6H8z" fill="#fff"/></svg>';

const ICONS = {
  box: '<rect x="4" y="7" width="16" height="11" rx="1.5"/><path d="M8 7v11M12 7v11M16 7v11"/>',
  gate: '<path d="M4 20V8l8-4 8 4v12"/><path d="M9 20v-6h6v6"/>',
  load: '<path d="M12 3v10m-4-4 4 4 4-4"/><path d="M4 17h16l-2 4H6z"/>',
  ship: '<path d="M3 15h18l-3 5H6z"/><path d="M7 15V9h6v6M13 11h4v4"/>',
  anchor: '<circle cx="12" cy="5" r="2"/><path d="M12 7v13M5 13a7 7 0 0 0 14 0M8 10h8"/>',
  unload: '<path d="M12 13V3m-4 4 4-4 4 4"/><path d="M4 17h16l-2 4H6z"/>',
  truck: '<path d="M3 7h11v9H3zM14 10h4l3 3v3h-7z"/><circle cx="7" cy="18" r="1.8"/><circle cx="17" cy="18" r="1.8"/>',
  check: '<circle cx="12" cy="12" r="8.5"/><path d="m8 12.3 2.7 2.7L16 9.5"/>',
};

const searchSvg = '<svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="6.5"/><path d="m16 16 4.5 4.5"/></svg>';
const arrowSvg = '<svg viewBox="0 0 24 24"><path d="M5 12h14m-5-5 5 5-5 5"/></svg>';
const refreshSvg = '<svg viewBox="0 0 24 24"><path d="M20 12a8 8 0 1 1-2.3-5.6M20 4v5h-5"/></svg>';
const backSvg = '<svg viewBox="0 0 24 24"><path d="M19 12H5m6-6-6 6 6 6"/></svg>';

/* ------------------------------------------------------------------ */
/* Shared pieces                                                       */
/* ------------------------------------------------------------------ */

function searchBox(value = '') {
  return `<form class="search" id="search-form" role="search" autocomplete="off">
    <label>${searchSvg}<input id="search-input" name="q" inputmode="text" autocapitalize="characters" autocorrect="off" spellcheck="false" enterkeyhint="search"
      placeholder="Container or booking number" aria-label="Container or booking number" value="${esc(value)}" maxlength="30"></label>
    <button class="go" type="submit" aria-label="Search">${arrowSvg}</button>
  </form>`;
}

function bindSearch() {
  const form = document.getElementById('search-form');
  if (!form) return;
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const q = form.q.value.trim().toUpperCase().replace(/[\s\-_/]/g, '');
    if (!q) { form.q.focus(); return; }
    form.q.blur();
    location.hash = `#/search/${encodeURIComponent(q)}`;
  });
}

function routeText(s) {
  const a = placeName(s.origin), b = placeName(s.destination);
  if (a && b) return `${a} → ${b}`;
  return s.carrier?.name ? `${s.carrier.name} · details coming` : 'Details coming soon';
}

function rowHtml(s) {
  return `<a class="row" href="#/track/${esc(s.id)}">
    <span class="ship-ico">${containerIcon}</span>
    <span class="t"><b>${esc(s.number || 'Unknown number')}</b><small>${esc(s.name ? `${s.name} · ` : '')}${esc(routeText(s))}</small></span>
    ${pill(s)}
  </a>`;
}

function endsInner(s) {
  const dep = !s.etd ? 'Departure date not known yet' : `${daysFromToday(s.etd) > 0 ? 'Sails' : 'Left'} ${fmtDate(s.etd)}`;
  const arr = !s.eta ? 'Arrival date not known yet' : `${s.status === 'ARRIVED' || s.status === 'COMPLETED' ? 'Arrived' : 'Expected'} ${fmtDate(s.eta)}`;
  return `<div><small>${esc(dep)}</small><b>${esc(placeName(s.origin) || '—')}</b></div>
      <div><small>${esc(arr)}</small><b>${esc(placeName(s.destination) || '—')}</b></div>`;
}

function currentCard(s, container) {
  return `<a class="card link" href="#/track/${esc(s.id)}">
    <div class="ship-head">
      <span class="ship-ico">${containerIcon}</span>
      <span class="t"><b>${esc(s.number)}</b><small>${esc([s.carrier?.name, s.name].filter(Boolean).join(' · ') || 'Container')}</small></span>
      ${pill(s)}
    </div>
    ${stepper(s, container)}
    <div class="ends">
      ${endsInner(s)}
    </div>
  </a>`;
}

function stateBlock({ titleText, text, actions = '', ship = true }) {
  return `<div class="state">${ship ? shipScene({ sky: false }) : ''}<h2>${esc(titleText)}</h2><p>${esc(text)}</p>${actions}</div>`;
}

function errorBlock(err, retryAction = 'retry') {
  const offline = err.code === 'offline';
  return stateBlock({
    titleText: offline ? "You're offline" : 'We hit a snag',
    text: err.message,
    actions: `<button class="btn btn-dark" data-action="${retryAction}">Try again</button>`,
  });
}

function skeletonHome() {
  return '<div class="skeleton sk-card"></div><div class="skeleton sk-row"></div><div class="skeleton sk-row"></div><div class="skeleton sk-row"></div>';
}

function installNotice() {
  const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
  const standalone = navigator.standalone || matchMedia('(display-mode: standalone)').matches;
  if (!ios || standalone || store.get('hideInstall')) return '';
  return `<div class="notice" id="install-note">
    <svg viewBox="0 0 24 24"><path d="M12 15V3m-4 4 4-4 4 4"/><path d="M6 11H5a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-8a1 1 0 0 0-1-1h-1"/></svg>
    <span>Install this app: tap <b>Share</b> then <b>Add to Home Screen</b>.</span>
    <button type="button" aria-label="Dismiss" data-action="hide-install">×</button>
  </div>`;
}

/* ------------------------------------------------------------------ */
/* Data loading                                                        */
/* ------------------------------------------------------------------ */

async function loadList(force = false) {
  if (state.list && !force) return state.list;
  const data = await api({ action: 'list' });
  state.list = data.items || [];
  state.listCursor = data.nextCursor || null;
  return state.list;
}

async function loadMore() {
  if (!state.listCursor) return;
  const data = await api({ action: 'list', cursor: state.listCursor });
  state.list = state.list.concat(data.items || []);
  state.listCursor = data.nextCursor || null;
}

async function loadDetail(id, container, force = false) {
  const key = `${id}|${container || ''}`;
  if (!force && state.details.has(key)) return state.details.get(key);
  const params = { action: 'detail', id };
  if (container) params.container = container;
  const d = await api(params);
  state.details.set(key, d);
  store.set('lastShipment', id);
  return d;
}

function pickCurrent(list) {
  const rank = { IN_TRANSIT: 0, ARRIVED: 1, PLANNED: 2, PENDING: 3, COMPLETED: 4, CANCELLED: 5 };
  return [...list].filter((s) => !s.failure).sort((a, b) => (rank[a.status] ?? 9) - (rank[b.status] ?? 9) || (a.eta || '9').localeCompare(b.eta || '9'))[0];
}

/* ------------------------------------------------------------------ */
/* Screens                                                             */
/* ------------------------------------------------------------------ */

async function renderHome() {
  const greet = (() => { const h = new Date().getHours(); return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening'; })();
  view.innerHTML = `
    <div class="topbar">
      <div class="who"><span class="icon-chip" aria-hidden="true">${containerIcon}</span>
        <div><small>${esc(greet)}</small><b>Your containers</b></div></div>
      <button class="icon-chip" data-action="refresh" aria-label="Refresh">${refreshSvg}</button>
    </div>
    <section class="hero">
      <div class="hero-text"><h2>Where's my container?</h2><p>Type a container or booking number to see where it is right now.</p></div>
      ${shipScene()}
    </section>
    ${searchBox()}
    ${installNotice()}
    <div id="home-body">${skeletonHome()}</div>`;
  bindSearch();

  const body = document.getElementById('home-body');
  try {
    const list = await loadList();
    if (!document.body.contains(body)) return;
    if (!list.length) {
      body.innerHTML = stateBlock({ titleText: 'No shipments yet', text: 'When containers are added to your tracking account they will show up here. You can still search by number above.', ship: false });
      return;
    }
    const current = pickCurrent(list);
    const counts = {
      moving: list.filter((s) => s.status === 'IN_TRANSIT').length,
      arrived: list.filter((s) => s.status === 'ARRIVED' || s.status === 'COMPLETED').length,
    };
    let currentHtml = '';
    if (current) {
      let container = null;
      try {
        const d = await loadDetail(current.id);
        container = d.containers?.[0] || null;
      } catch { /* the card still works without movements */ }
      if (!document.body.contains(body)) return;
      currentHtml = `<div class="section-head"><h3>Current shipment</h3><a href="#/track/${esc(current.id)}">Track</a></div>${currentCard(current, container)}`;
    }
    const recent = list.filter((s) => s !== current).slice(0, 5);
    body.innerHTML = `
      <div class="tiles">
        <button class="tile accent" data-filter="moving"><b>${counts.moving}</b><span>On the way</span></button>
        <button class="tile" data-filter="arrived"><b>${counts.arrived}</b><span>Arrived or delivered</span></button>
      </div>
      ${currentHtml}
      ${recent.length ? `<div class="section-head"><h3>Recent shipments</h3><a href="#/shipments">See all</a></div><div class="list">${recent.map(rowHtml).join('')}</div>` : ''}`;
  } catch (err) {
    if (document.body.contains(body)) body.innerHTML = errorBlock(err);
  }
}

const FILTERS = [
  ['all', 'All', () => true],
  ['moving', 'On the way', (s) => s.status === 'IN_TRANSIT'],
  ['arrived', 'Arrived', (s) => s.status === 'ARRIVED' || s.status === 'COMPLETED'],
  ['booked', 'Booked', (s) => s.status === 'PLANNED' || (s.status === 'PENDING' && !s.failure)],
  ['problem', 'Needs attention', (s) => !!s.failure || s.status === 'CANCELLED' || s.delayDays > 0],
];

async function renderShipments() {
  view.innerHTML = `<h1 class="page-title">Shipments</h1>${searchBox()}
    <div class="chips" role="group" aria-label="Filter">${FILTERS.map(([k, l]) => `<button class="chip" data-filter="${k}" aria-pressed="${state.filter === k}">${l}</button>`).join('')}</div>
    <div id="ship-body">${skeletonHome()}</div>`;
  bindSearch();
  const body = document.getElementById('ship-body');
  try {
    await loadList();
    if (document.body.contains(body)) paintShipmentList(body);
  } catch (err) {
    if (document.body.contains(body)) body.innerHTML = errorBlock(err);
  }
}

function paintShipmentList(body) {
  const f = FILTERS.find(([k]) => k === state.filter) || FILTERS[0];
  const items = state.list.filter(f[2]);
  body.innerHTML = items.length
    ? `<div class="list">${items.map(rowHtml).join('')}</div>${state.listCursor ? '<button class="btn btn-ghost btn-block" data-action="more">Show more</button>' : ''}`
    : stateBlock({ titleText: 'Nothing here', text: state.filter === 'all' ? 'No shipments are being tracked yet.' : 'No shipments match this filter right now.', ship: false });
}

async function renderSearch(q) {
  view.innerHTML = `<h1 class="page-title">Search</h1>${searchBox(q)}<div id="search-body">${skeletonHome()}</div>`;
  bindSearch();
  const body = document.getElementById('search-body');
  try {
    const res = await api({ action: 'search', q });
    if (!document.body.contains(body)) return;
    const items = res.items || [];
    if (items.length === 1) { location.replace(`#/track/${items[0].id}`); return; }
    if (!items.length) {
      body.innerHTML = stateBlock({
        titleText: "We couldn't find that number",
        text: `${res.query} isn't in the tracking list. Check the number for typos (it usually looks like 4 letters and 7 digits, e.g. MSKU1234567). If it's correct, ask your shipping contact to add it for tracking.`,
        actions: '<a class="btn btn-dark" href="#/shipments">See all shipments</a>',
      });
      return;
    }
    body.innerHTML = `<div class="section-head"><h3>${items.length} matches</h3></div><div class="list">${items.map(rowHtml).join('')}</div>`;
  } catch (err) {
    if (!document.body.contains(body)) return;
    body.innerHTML = err.code === 'bad_number'
      ? stateBlock({ titleText: 'Check the number', text: err.message, ship: false })
      : errorBlock(err);
  }
}

function renderTrackEmpty() {
  const last = store.get('lastShipment');
  if (last) { location.replace(`#/track/${last}`); return; }
  view.innerHTML = `<h1 class="page-title">Tracking</h1>
    ${stateBlock({ titleText: 'Track a container', text: 'Search a container or booking number, or pick one from your shipments, to see it on the map.', actions: '<a class="btn btn-dark" href="#/shipments">Choose a shipment</a>' })}
    ${searchBox()}`;
  bindSearch();
}

async function renderTrack(id, container) {
  document.body.classList.add('on-track');
  view.classList.add('flush');
  view.innerHTML = `<div class="track">
      <div class="map-wrap"><div class="map-fallback">${shipScene({ sky: false })}</div>
        <div class="map-top"><a class="icon-chip" href="#/home" aria-label="Back">${backSvg}</a><h1>Live tracking</h1><button class="icon-chip" data-action="refresh-track" aria-label="Refresh">${refreshSvg}</button></div></div>
      <section class="sheet" id="sheet"><div class="grab"></div>
        <div class="skeleton" style="height:56px;background-color:#2A2A2D;opacity:.25;margin-bottom:16px"></div>
        <div class="skeleton" style="height:120px;opacity:.15"></div>
      </section></div>`;
  const sheet = document.getElementById('sheet');
  let d;
  try {
    d = await loadDetail(id, container);
  } catch (err) {
    if (!document.body.contains(sheet)) return;
    if (err.status === 404) {
      store.set('lastShipment', null);
      sheet.innerHTML = '<div class="grab"></div>' + stateBlock({ titleText: 'Shipment not found', text: "This shipment isn't available any more. It may have been removed from tracking.", actions: '<a class="btn btn-accent" href="#/shipments">See all shipments</a>', ship: false });
    } else {
      sheet.innerHTML = '<div class="grab"></div>' + errorBlock(err, 'refresh-track');
    }
    return;
  }
  if (!document.body.contains(sheet)) return;

  const ctr = d.containers.find((c) => c.container_number === container) || d.containers[0] || null;
  const info = statusInfo(d);
  const latest = ctr?.latest_movement;
  const vesselName = latest?.vessel?.name || ctr?.movements?.slice().reverse().find((m) => m.vessel)?.vessel?.name;
  const voyage = latest?.voyage || ctr?.movements?.slice().reverse().find((m) => m.voyage)?.voyage;
  const away = daysFromToday(d.eta);
  const size = ctr ? [ctr.container_size ? `${ctr.container_size} ft` : null, ({ HC: 'High Cube', DC: 'Standard', RF: 'Reefer (cold)', OT: 'Open Top', FR: 'Flat Rack', TK: 'Tank' })[ctr.container_type] || ctr.container_type].filter(Boolean).join(' · ') : null;

  let etaBox = '';
  if (d.eta && !['COMPLETED', 'CANCELLED'].includes(d.status) && !d.failure) {
    const changes = d.etaChanges || [];
    const n = d.status === 'ARRIVED' ? '✓' : away > 0 ? away : away === 0 ? '0' : '!';
    const unit = d.status === 'ARRIVED' ? 'arrived' : away > 0 ? (away === 1 ? 'day left' : 'days left') : away === 0 ? 'today' : 'overdue';
    const changeTxt = changes.length
      ? `The arrival date changed ${changes.length === 1 ? 'once' : `${changes.length} times`}. Last change: ${fmtShort(changes[0].old_eta)} → ${fmtShort(changes[0].new_eta)}.`
      : 'No changes to the arrival date so far.';
    etaBox = `<div class="eta-box"><div class="days">${n}<small>${unit}</small></div>
      <p>Expected at ${esc(placeName(d.destination) || 'destination')} on <b>${esc(fmtDate(d.eta))}</b>${d.delayDays > 0 ? `, <b class="late">${d.delayDays} day${d.delayDays === 1 ? '' : 's'} later</b> than first planned` : ''}.<br><span>${esc(changeTxt)}</span></p></div>`;
  }

  const moves = (ctr?.movements || []).slice().sort((a, b) => (a.date || '9999').localeCompare(b.date || '9999'));
  const timeline = moves.length ? `<ul class="timeline">${moves.map((m) => {
    const [label, icon] = EVENTS[m.event] || [title(m.event), 'box'];
    const isDone = m.classifier === 'ACT';
    const where = m.location ? placeFull(m.location) : '';
    const extra = m.vessel?.name && ['LOAD', 'DEPA', 'ARRI', 'DISC'].includes(m.event) ? ` · ${m.vessel.name}` : '';
    return `<li class="${isDone ? 'done' : ''}"><span class="dot"><svg viewBox="0 0 24 24">${ICONS[icon]}</svg></span>
      <div><b>${esc(label)}</b><small>${isDone ? esc(fmtDate(m.date)) : `<span class="exp">Expected ${esc(fmtDate(m.date))}</span>`}${where ? ` · ${esc(where)}` : ''}${esc(extra)}</small></div></li>`;
  }).join('')}</ul>` : `<p class="muted">${esc(info.hint)}</p>`;

  const chips = d.containers.length > 1
    ? `<div class="ctr-chips">${d.containers.map((c) => `<button data-container="${esc(c.container_number)}" aria-pressed="${c === ctr}">${esc(c.container_number)}</button>`).join('')}</div>` : '';

  sheet.innerHTML = `<div class="grab"></div>
    ${chips}
    <div class="head">
      <div><span class="lbl">${d.numberType === 'BOOKING' ? 'Booking no.' : 'Container no.'}</span><div class="big">${esc(d.number)}</div></div>
      <div class="right"><span class="lbl">Status</span><span class="pill ${info.cls}">${esc(info.label)}</span></div>
    </div>
    ${stepper(d, ctr)}
    <div class="ends">
      ${endsInner(d)}
    </div>
    <hr>
    ${d.failure || d.status === 'PENDING' ? `<p class="muted" style="margin-bottom:16px">${esc(info.hint)}</p>` : ''}
    ${etaBox}
    ${etaBox ? '<hr>' : ''}
    <div class="facts">
      <div><span class="lbl">From</span><b>${esc(placeFull(d.origin))}</b></div>
      <div><span class="lbl">To</span><b>${esc(placeFull(d.destination))}</b></div>
      <div><span class="lbl">Shipping line</span><b>${esc(d.carrier?.name || 'Not known yet')}</b></div>
      <div><span class="lbl">Ship</span><b>${esc(vesselName || '—')}</b></div>
      <div><span class="lbl">Voyage</span><b>${esc(voyage || '—')}</b></div>
      <div><span class="lbl">Container</span><b>${esc(size || '—')}</b></div>
      <div><span class="lbl">Time at sea</span><b>${d.transitTime != null ? `${d.transitTime} days` : '—'}</b></div>
      <div><span class="lbl">Stops on the way</span><b>${d.transshipments != null ? (d.transshipments === 0 ? 'Direct' : d.transshipments) : '—'}</b></div>
      ${d.name ? `<div class="wide"><span class="lbl">Reference</span><b>${esc(d.name)}</b></div>` : ''}
    </div>
    <hr>
    <h3>Journey</h3>
    ${timeline}
    <p class="muted" style="margin-top:6px">Last checked with the shipping line ${esc(timeAgo(d.lastCheckedAt))}.</p>`;

  drawMap(d);
}

function renderHelp() {
  view.innerHTML = `<h1 class="page-title">Help</h1>
  <div class="help">
    <section class="hero" style="min-height:130px"><div class="hero-text"><h2>Tracking made simple</h2><p>Live updates straight from the shipping lines.</p></div>${shipScene()}</section>
    <div class="card"><h3>What the statuses mean</h3><dl>
      <dt><span class="pill s-planned">Booked</span></dt><dd>Space on a ship is booked. It hasn't sailed yet.</dd>
      <dt><span class="pill s-transit">On the way</span></dt><dd>The container is on a ship travelling to its destination.</dd>
      <dt><span class="pill s-arrived">Arrived</span></dt><dd>The ship reached the destination port. The container is being unloaded or waiting for pickup.</dd>
      <dt><span class="pill s-done">Delivered</span></dt><dd>The container was collected and the journey is finished.</dd>
      <dt><span class="pill s-pending">Getting details</span></dt><dd>We're still asking the shipping line for information. Check back soon.</dd>
      <dt><span class="pill s-problem">Can't track</span></dt><dd>The shipping line couldn't find this number. Double-check it with your supplier.</dd>
    </dl></div>
    <div class="card"><h3>"Expected" vs. done</h3><p>Steps with an orange icon have already happened. Steps marked <b style="color:#C98A00">Expected</b> are the shipping line's best guess and can change.</p></div>
    <div class="card"><h3>Install on your iPhone</h3><ol><li>Open this page in <b>Safari</b>.</li><li>Tap the <b>Share</b> button (square with an arrow).</li><li>Choose <b>Add to Home Screen</b>, then <b>Add</b>.</li></ol></div>
    <div class="card"><h3>Where does the data come from?</h3><p>Tracking information is provided by Tracktainer, which checks the shipping lines several times a day. Dates are in local port time.</p></div>
  </div>`;
}

/* ------------------------------------------------------------------ */
/* Map                                                                 */
/* ------------------------------------------------------------------ */

let map = null;
let world = null;

// Coastlines come from a bundled Natural Earth file, so the map needs no tile
// service and no key, and works offline.
function loadWorld() {
  if (!world) world = fetch('/world.json').then((r) => (r.ok ? r.json() : null)).catch(() => null);
  return world;
}

async function drawLand(m, shifted) {
  const w = await loadWorld();
  if (!w || m !== map) return;
  const L = window.L;
  const offsets = shifted ? [0, 360] : [0];
  for (const dx of offsets) {
    const move = (c) => (typeof c[0] === 'number' ? [c[0] + dx, c[1]] : c.map(move));
    const land = dx ? { type: 'MultiPolygon', coordinates: move(w.land.coordinates) } : w.land;
    const borders = dx ? { type: 'MultiLineString', coordinates: move(w.borders.coordinates) } : w.borders;
    L.geoJSON(borders, { interactive: false, style: { color: '#E4DDD4', weight: 0.8, fill: false } }).addTo(m).bringToBack();
    L.geoJSON(land, { interactive: false, style: { stroke: true, color: '#D9D2C9', weight: 1, fillColor: '#F7F3EE', fillOpacity: 1 } }).addTo(m).bringToBack();
  }
}

function unwrapCoords(features) {
  // Keep Pacific crossings in one piece: shift western longitudes by +360.
  let min = 180, max = -180;
  const walk = (c, fn) => (typeof c[0] === 'number' ? fn(c) : c.forEach((x) => walk(x, fn)));
  features.forEach((f) => f.geometry && walk(f.geometry.coordinates, ([lon]) => { min = Math.min(min, lon); max = Math.max(max, lon); }));
  const shift = min < -90 && max > 90;
  const toLatLng = ([lon, lat]) => [lat, shift && lon < 0 ? lon + 360 : lon];
  return toLatLng;
}

function drawMap(d) {
  if (map) { map.remove(); map = null; }
  const el = document.querySelector('.map-wrap');
  if (!el || !window.L) {
    if (!window.L) window.addEventListener('load', () => document.querySelector('.map-wrap') && drawMap(d), { once: true });
    return;
  }
  let features = d.route?.features || [];
  // Fall back to the known ports when no route is available yet
  if (!features.length) {
    features = [d.origin, d.destination].filter((p) => p && p.latitude != null).map((p, i, arr) => ({
      type: 'Feature', geometry: { type: 'Point', coordinates: [p.longitude, p.latitude] },
      properties: { feature_type: 'PORT', name: p.name, label: i === arr.length - 1 ? 'POD' : 'POL', reached: i === 0 && d.status !== 'PLANNED' },
    }));
    if (features.length === 2) {
      features.push({ type: 'Feature', geometry: { type: 'LineString', coordinates: features.map((f) => f.geometry.coordinates) }, properties: { feature_type: 'LEG', status: 'PLANNED' } });
    }
  }
  if (!features.length) return; // keep the ship illustration

  const mapDiv = document.createElement('div');
  mapDiv.className = 'map';
  el.insertBefore(mapDiv, el.querySelector('.map-top'));
  el.querySelector('.map-fallback')?.remove();

  const L = window.L;
  map = L.map(mapDiv, { zoomControl: false, attributionControl: true, worldCopyJump: false, preferCanvas: true, minZoom: 1, maxZoom: 7 });
  map.attributionControl.setPrefix(false).addAttribution('Map data: Natural Earth');
  const ll = unwrapCoords(features);
  drawLand(map, ll([-179, 0])[1] > 180);
  const bounds = [];
  const lines = (g) => (g.type === 'LineString' ? [g.coordinates] : g.type === 'MultiLineString' ? g.coordinates : []);

  for (const f of features) {
    const p = f.properties || {};
    if (p.feature_type !== 'LEG' || !f.geometry) continue;
    const future = p.status === 'PLANNED' || p.part === 'ESTIMATED';
    for (const seg of lines(f.geometry)) {
      const pts = seg.map(ll);
      pts.forEach((x) => bounds.push(x));
      L.polyline(pts, future
        ? { color: '#1C1C1E', weight: 3, opacity: .55, dashArray: '2 8', lineCap: 'round' }
        : { color: '#FF6B35', weight: 4, opacity: .95, lineCap: 'round' }).addTo(map);
    }
  }
  const ports = features.filter((f) => f.properties?.feature_type === 'PORT' && f.geometry);
  ports.forEach((f, i) => {
    const p = f.properties;
    const latlng = ll(f.geometry.coordinates);
    bounds.push(latlng);
    const dest = p.label === 'POD' || p.label === 'DST' ? (i === ports.length - 1) : false;
    const icon = L.divIcon({ className: '', html: `<div class="port-pin ${p.reached ? 'reached' : ''} ${dest ? 'dest' : ''}"></div>`, iconSize: dest ? [22, 22] : [16, 16], iconAnchor: dest ? [11, 11] : [8, 8] });
    L.marker(latlng, { icon, keyboard: false, title: p.name }).addTo(map).bindTooltip(esc(p.name || ''), { direction: 'top', offset: [0, -8] });
  });
  let vesselLatLng = null;
  const v = features.find((f) => f.properties?.feature_type === 'VESSEL' && f.geometry);
  if (v) {
    vesselLatLng = ll(v.geometry.coordinates);
    const icon = L.divIcon({ className: '', html: `<div class="vessel-pin">${vesselIcon}</div>`, iconSize: [40, 40], iconAnchor: [20, 20] });
    L.marker(vesselLatLng, { icon, keyboard: false, zIndexOffset: 1000, title: v.properties.name }).addTo(map).bindTooltip(esc(v.properties.name || 'Ship'), { direction: 'top', offset: [0, -18] });
    bounds.push(vesselLatLng);
  }
  if (bounds.length) map.fitBounds(bounds, { paddingTopLeft: [30, 70], paddingBottomRight: [30, 50], maxZoom: 6 });
}

/* ------------------------------------------------------------------ */
/* Router                                                              */
/* ------------------------------------------------------------------ */

function setTab(name) {
  document.querySelectorAll('.tabbar .tab').forEach((a) => {
    if (a.dataset.tab === name) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
  });
}

async function router() {
  const [, page = 'home', arg, arg2] = (location.hash || '#/home').split('/');
  if (map) { map.remove(); map = null; }
  document.body.classList.remove('on-track');
  view.classList.remove('flush');
  window.scrollTo(0, 0);
  switch (page) {
    case 'shipments': setTab('shipments'); return renderShipments();
    case 'search': setTab('home'); return renderSearch(decodeURIComponent(arg || ''));
    case 'track':
      setTab('track');
      return arg ? renderTrack(decodeURIComponent(arg), arg2 ? decodeURIComponent(arg2) : undefined) : renderTrackEmpty();
    case 'help': setTab('help'); return renderHelp();
    default: setTab('home'); return renderHome();
  }
}

/* ------------------------------------------------------------------ */
/* Events                                                              */
/* ------------------------------------------------------------------ */

document.addEventListener('click', async (e) => {
  const t = e.target.closest('[data-action], [data-filter], [data-container]');
  if (!t) return;
  if (t.dataset.container) {
    const id = (location.hash.split('/')[2]) || '';
    location.hash = `#/track/${id}/${encodeURIComponent(t.dataset.container)}`;
    return;
  }
  if (t.dataset.filter) {
    state.filter = t.dataset.filter;
    if (!location.hash.startsWith('#/shipments')) { location.hash = '#/shipments'; return; }
    document.querySelectorAll('.chip').forEach((c) => c.setAttribute('aria-pressed', String(c.dataset.filter === state.filter)));
    const body = document.getElementById('ship-body');
    if (body && state.list) paintShipmentList(body);
    return;
  }
  const a = t.dataset.action;
  if (a === 'retry') { state.list = null; router(); }
  if (a === 'refresh') {
    t.classList.add('spin');
    state.list = null; state.details.clear();
    await router();
  }
  if (a === 'refresh-track') { state.details.clear(); router(); }
  if (a === 'more') {
    t.disabled = true; t.textContent = 'Loading…';
    try { await loadMore(); paintShipmentList(document.getElementById('ship-body')); } catch (err) { t.disabled = false; t.textContent = 'Try again'; }
  }
  if (a === 'hide-install') { store.set('hideInstall', true); document.getElementById('install-note')?.remove(); }
});

document.getElementById('fab').addEventListener('click', () => {
  const input = document.getElementById('search-input');
  if (input && !location.hash.startsWith('#/track')) { input.focus(); input.scrollIntoView({ behavior: 'smooth', block: 'center' }); return; }
  location.hash = '#/home';
  setTimeout(() => document.getElementById('search-input')?.focus(), 50);
});

window.addEventListener('hashchange', router);

/* ------------------------------------------------------------------ */
/* Desktop notice                                                      */
/* ------------------------------------------------------------------ */

function checkDesktop() {
  const touch = matchMedia('(pointer: coarse)').matches;
  const wide = window.innerWidth > 820;
  if (touch || !wide || sessionStorageGet('preview')) return;
  const note = document.getElementById('desktop-note');
  note.hidden = false;
  note.querySelector('[data-ship]').innerHTML = shipScene();
  document.getElementById('desktop-url').textContent = location.origin;
  document.getElementById('desktop-continue').addEventListener('click', () => {
    note.hidden = true;
    document.body.classList.add('desktop-preview');
    try { sessionStorage.setItem('preview', '1'); } catch { /* ignore */ }
  });
}
function sessionStorageGet(k) {
  try { if (sessionStorage.getItem(k)) { document.body.classList.add('desktop-preview'); return true; } } catch { /* ignore */ }
  return false;
}

/* ------------------------------------------------------------------ */
/* Boot                                                                */
/* ------------------------------------------------------------------ */

checkDesktop();
router();

if ('serviceWorker' in navigator && location.protocol === 'https:') {
  window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js').catch(() => {}));
}
