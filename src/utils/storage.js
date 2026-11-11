import { defaultShipments } from '../data/defaultShipments';

const SHIPMENTS_KEY = 'jst_shipments_v1';
const SETTINGS_KEY = 'jst_settings_v1';
// Keys used by the earlier "Tracktainer" build — read once so no saved data is lost
const LEGACY_SHIPMENTS_KEY = 'tracktainer_shipments_v1';
const LEGACY_SETTINGS_KEY = 'tracktainer_settings_v1';

export const DEFAULT_SETTINGS = {
  tracktainerApiKey: '',
  tracktainerBaseUrl: 'https://api.tracktainer.com/v1',
  googleSheetsUrl: '',
  autoSyncToSheets: true,
};

export const isLocalServer = () =>
  window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

const readJSON = (key) => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const writeJSON = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage full or unavailable */
  }
};

export const getStoredSettings = () => {
  const current = readJSON(SETTINGS_KEY);
  if (current) return { ...DEFAULT_SETTINGS, ...current };
  // The old build shipped with a hard-coded API key: carry over other settings, not the key
  const { tracktainerApiKey: _dropped, ...legacy } = readJSON(LEGACY_SETTINGS_KEY) || {};
  return { ...DEFAULT_SETTINGS, ...legacy };
};

export const storeSettings = (patch) => {
  const updated = { ...getStoredSettings(), ...patch };
  writeJSON(SETTINGS_KEY, updated);
  return updated;
};

export const getStoredShipments = () => {
  const list = readJSON(SHIPMENTS_KEY) ?? readJSON(LEGACY_SHIPMENTS_KEY);
  return Array.isArray(list) ? list : defaultShipments;
};

export const storeShipments = (shipments) => writeJSON(SHIPMENTS_KEY, shipments);

const postToSheets = (url, body, mode) =>
  fetch(url, {
    method: 'POST',
    mode,
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(body),
  });

export const syncDirectToGoogleSheets = async (webhookUrl, shipments) => {
  if (!webhookUrl?.startsWith('http')) return { success: false };
  const body = { action: 'sync_shipments', shipments };
  try {
    await postToSheets(webhookUrl, body);
    return { success: true };
  } catch (err) {
    try {
      // Apps Script redirects can trip CORS; no-cors still delivers the POST
      await postToSheets(webhookUrl, body, 'no-cors');
      return { success: true };
    } catch {
      return { success: false, error: err.message };
    }
  }
};

export const pullDirectFromGoogleSheets = async (webhookUrl) => {
  if (!webhookUrl?.startsWith('http')) return { success: false, message: 'Invalid Google Sheets URL' };
  try {
    const res = await fetch(webhookUrl, { headers: { Accept: 'application/json' } });
    const data = await res.json();
    if (Array.isArray(data?.shipments)) return { success: true, shipments: data.shipments };
    return { success: false, message: 'Unexpected data from Google Sheets' };
  } catch (err) {
    return { success: false, message: err.message };
  }
};
