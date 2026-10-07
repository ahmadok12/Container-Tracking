import { defaultShipments } from '../data/defaultShipments';

const SHIPMENTS_STORAGE_KEY = 'tracktainer_shipments_v1';
const SETTINGS_STORAGE_KEY = 'tracktainer_settings_v1';

export const DEFAULT_SETTINGS = {
  tracktainerApiKey: 'ca0853e15f63f20e1f02bc87166ed103bdeab9db',
  tracktainerBaseUrl: 'https://api.tracktainer.com/v1',
  googleSheetsUrl: '',
  autoSyncToSheets: true,
};

// Check if running on localhost backend or static GitHub Pages
export const isLocalServer = () => {
  return window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
};

// Load settings
export const getStoredSettings = () => {
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (raw) return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch (e) {}
  return DEFAULT_SETTINGS;
};

// Save settings
export const storeSettings = (newSettings) => {
  try {
    const current = getStoredSettings();
    const updated = { ...current, ...newSettings };
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch (e) {}
  return newSettings;
};

// Load shipments
export const getStoredShipments = () => {
  try {
    const raw = localStorage.getItem(SHIPMENTS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {}
  return defaultShipments;
};

// Save shipments
export const storeShipments = (shipments) => {
  try {
    localStorage.setItem(SHIPMENTS_STORAGE_KEY, JSON.stringify(shipments));
  } catch (e) {}
};

// Direct sync to Google Sheets from browser
export const syncDirectToGoogleSheets = async (webhookUrl, shipments) => {
  if (!webhookUrl || !webhookUrl.startsWith('http')) return { success: false };

  try {
    // Attempt standard fetch or no-cors fallback
    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({
        action: 'sync_shipments',
        shipments: shipments,
      }),
    });
    return { success: true };
  } catch (err) {
    // Attempt no-cors if browser blocked response due to redirect
    try {
      await fetch(webhookUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({
          action: 'sync_shipments',
          shipments: shipments,
        }),
      });
      return { success: true };
    } catch (e) {
      console.warn('Google Sheets sync warning:', e);
      return { success: false, error: err.message };
    }
  }
};

// Direct pull from Google Sheets
export const pullDirectFromGoogleSheets = async (webhookUrl) => {
  if (!webhookUrl || !webhookUrl.startsWith('http')) {
    return { success: false, message: 'Invalid Google Sheets URL' };
  }
  try {
    const res = await fetch(webhookUrl, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
    });
    const data = await res.json();
    if (data && data.shipments && Array.isArray(data.shipments)) {
      return { success: true, shipments: data.shipments };
    }
    return { success: false, message: 'Invalid data format from Google Sheets' };
  } catch (err) {
    return { success: false, error: err.message };
  }
};
