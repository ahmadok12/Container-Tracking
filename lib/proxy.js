// Read-only proxy between the PWA and the Tracktainer API.
// The API key is read from the server environment (TRACKTAINER_API_KEY)
// and is never sent to the browser. Only a fixed set of GET reads is allowed.

import { demoList, demoDetail } from './demo-data.js';

const API_BASE = 'https://api.tracktainer.com/v1';
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const NUMBER_RE = /^[A-Z0-9]{4,30}$/;
const CURSOR_RE = /^[A-Za-z0-9_\-=.%]{1,512}$/;

function json(body, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'x-content-type-options': 'nosniff',
      ...extraHeaders,
    },
  });
}

// Plain-language error the app can show as-is.
function problem(status, code, message) {
  return json({ error: { code, message } }, status, { 'cache-control': 'no-store' });
}

const CACHE_OK = { 'cache-control': 'public, max-age=60, s-maxage=300, stale-while-revalidate=600' };

async function callApi(path, key) {
  let res;
  try {
    res = await fetch(API_BASE + path, {
      headers: {
        Authorization: `Bearer ${key}`,
        Accept: 'application/vnd.api+json, application/geo+json, application/json',
      },
    });
  } catch {
    return { ok: false, status: 502 };
  }
  if (!res.ok) return { ok: false, status: res.status };
  try {
    return { ok: true, status: res.status, body: await res.json() };
  } catch {
    return { ok: false, status: 502 };
  }
}

function upstreamError(status) {
  if (status === 404) return problem(404, 'not_found', "We couldn't find that shipment.");
  if (status === 401 || status === 403)
    return problem(503, 'not_configured', 'Tracking is temporarily unavailable. Please try again later.');
  if (status === 429)
    return problem(503, 'busy', 'Lots of people are checking right now. Please try again in a minute.');
  return problem(502, 'upstream', "We couldn't reach the tracking service. Please try again shortly.");
}

// Keep only what the list screens need.
function summarize(item) {
  const a = item.attributes || {};
  return {
    id: item.id,
    number: a.shipment_number,
    numberType: a.shipment_number_type,
    name: a.shipment_name,
    status: a.shipment_status,
    failure: a.failure_reason,
    carrier: a.carrier,
    origin: a.origin || a.port_of_loading,
    destination: a.destination || a.port_of_discharge,
    pol: a.port_of_loading,
    pod: a.port_of_discharge,
    etd: a.etd,
    eta: a.eta,
    delayDays: a.delay_days,
    transitTime: a.transit_time,
    containerCount: a.container_count,
    trackingActive: a.tracking_active,
    lastCheckedAt: a.last_checked_at,
    createdAt: a.created_at,
    updatedAt: a.updated_at,
  };
}

async function list(url, key) {
  const qs = new URLSearchParams({ 'page[size]': '25', sort: '-updated_at' });
  const cursor = url.searchParams.get('cursor');
  if (cursor) {
    if (!CURSOR_RE.test(cursor)) return problem(400, 'bad_request', 'Something went wrong. Please refresh.');
    qs.set('page[cursor]', cursor);
  }
  const r = await callApi(`/ocean/shipments?${qs}`, key);
  if (!r.ok) return upstreamError(r.status);
  const next = r.body.links?.next ? new URL(r.body.links.next, API_BASE).searchParams.get('page[cursor]') : null;
  return json({ items: (r.body.data || []).map(summarize), nextCursor: next }, 200, CACHE_OK);
}

async function search(url, key) {
  const q = (url.searchParams.get('q') || '').toUpperCase().replace(/[\s\-_/]/g, '');
  if (!NUMBER_RE.test(q))
    return problem(400, 'bad_number', 'Please enter a container or booking number, for example MSKU1234567.');
  const qs = new URLSearchParams({ 'filter[shipment_number]': q, 'page[size]': '10', sort: '-updated_at' });
  const r = await callApi(`/ocean/shipments?${qs}`, key);
  if (!r.ok) return upstreamError(r.status);
  return json({ query: q, items: (r.body.data || []).map(summarize) }, 200, CACHE_OK);
}

async function detail(url, key) {
  const id = url.searchParams.get('id') || '';
  if (!UUID_RE.test(id)) return problem(404, 'not_found', "We couldn't find that shipment.");
  const container = (url.searchParams.get('container') || '').toUpperCase();
  const routeQs = NUMBER_RE.test(container) ? `?container=${container}` : '';

  const [ship, route, eta] = await Promise.all([
    callApi(`/ocean/shipments/${id}`, key),
    callApi(`/ocean/shipments/${id}/route${routeQs}`, key),
    callApi(`/ocean/shipments/${id}/eta-changes`, key),
  ]);
  if (!ship.ok) return upstreamError(ship.status);
  const data = ship.body.data;
  const a = data.attributes || {};
  return json(
    {
      ...summarize(data),
      teu: a.teu,
      co2: a.co2,
      transshipments: a.transshipment_count,
      containers: a.containers || [],
      route: route.ok ? route.body : null,
      etaChanges: eta.ok ? eta.body.data || [] : [],
    },
    200,
    CACHE_OK,
  );
}

export async function handle(request, env = {}) {
  if (request.method !== 'GET') return problem(405, 'method', 'This app can only read tracking data.');
  const url = new URL(request.url);
  const action = url.searchParams.get('action');

  if (String(env.DEMO_MODE).toLowerCase() === 'true') {
    if (action === 'list') return json(demoList());
    if (action === 'search') {
      const q = (url.searchParams.get('q') || '').toUpperCase().replace(/[\s\-_/]/g, '');
      if (!NUMBER_RE.test(q)) return problem(400, 'bad_number', 'Please enter a container or booking number, for example MSKU1234567.');
      return json({ query: q, items: demoList().items.filter((s) => s.number === q) });
    }
    if (action === 'detail') {
      const d = demoDetail(url.searchParams.get('id'));
      return d ? json(d) : problem(404, 'not_found', "We couldn't find that shipment.");
    }
    return problem(404, 'unknown', 'Unknown request.');
  }

  const key = env.TRACKTAINER_API_KEY;
  if (!key) return problem(503, 'not_configured', 'Tracking is not set up yet. Please try again later.');

  if (action === 'list') return list(url, key);
  if (action === 'search') return search(url, key);
  if (action === 'detail') return detail(url, key);
  return problem(404, 'unknown', 'Unknown request.');
}
