import React, { Suspense, lazy, useCallback, useEffect, useRef, useState } from 'react';
import { CheckCircle2, AlertCircle } from 'lucide-react';
import ShipmentsListScreen from './components/ShipmentsListScreen';
import TrackingDetailScreen from './components/TrackingDetailScreen';
import UpdateStatusModal from './components/UpdateStatusModal';
import TrackShipmentModal from './components/TrackShipmentModal';
import {
  getStoredShipments,
  storeShipments,
  getStoredSettings,
  storeSettings,
  syncDirectToGoogleSheets,
  pullDirectFromGoogleSheets,
  isLocalServer,
} from './utils/storage';
import { fetchLiveTracktainerShipments } from './utils/tracktainerApi';
import { sendShipmentNotification } from './utils/notifications';
import { applyStatusUpdate, autoCloseOverdue, delayLabel, sameShipment } from './utils/shipments';

const IntegrationsModal = lazy(() => import('./components/IntegrationsModal'));

const postLocal = (url, method, body) =>
  isLocalServer()
    ? fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }).catch(() => {})
    : Promise.resolve();

export default function App() {
  const [shipments, setShipments] = useState(() => autoCloseOverdue(getStoredShipments()).list);
  const [selectedId, setSelectedId] = useState(null);
  const [settings, setSettings] = useState(getStoredSettings);
  const [modal, setModal] = useState(null); // 'track' | 'status' | 'settings'
  const [editing, setEditing] = useState(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [toast, setToast] = useState(null);
  const [installPrompt, setInstallPrompt] = useState(null);
  const toastTimer = useRef();

  const selected = shipments.find((s) => s.id === selectedId) || null;

  // Persist every change
  useEffect(() => storeShipments(shipments), [shipments]);

  const showToast = useCallback((message, type = 'success') => {
    clearTimeout(toastTimer.current);
    setToast({ message, type });
    toastTimer.current = setTimeout(() => setToast(null), 3200);
  }, []);

  // PWA install prompt
  useEffect(() => {
    const onPrompt = (e) => {
      e.preventDefault();
      setInstallPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', onPrompt);
    return () => window.removeEventListener('beforeinstallprompt', onPrompt);
  }, []);

  // Android/browser back button closes modal / returns to list
  useEffect(() => {
    const onPop = () => {
      setModal(null);
      setSelectedId(null);
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const openShipment = (s) => {
    window.history.pushState({ shipment: s.id }, '');
    setSelectedId(s.id);
    window.scrollTo(0, 0);
  };
  const backToList = () => {
    if (window.history.state?.shipment) window.history.back();
    else setSelectedId(null);
  };

  const syncSheets = (list) => {
    if (settings.googleSheetsUrl && settings.autoSyncToSheets) syncDirectToGoogleSheets(settings.googleSheetsUrl, list);
  };

  // manual = user tapped refresh, so tell them what happened
  const refresh = useCallback(
    async (manual = false) => {
      setIsSyncing(true);
      let message = null;
      try {
        if (settings.tracktainerApiKey) {
          const { shipments: live, error } = await fetchLiveTracktainerShipments(settings.tracktainerApiKey, settings.tracktainerBaseUrl);
          if (error) message = { text: error, type: 'error' };
          else {
            // live data wins; keep manually-added shipments Tracktainer doesn't know about
            setShipments((prev) => autoCloseOverdue([...live, ...prev.filter((p) => !live.some((l) => sameShipment(l, p)))]).list);
            message = { text: `Loaded ${live.length} shipment(s) from Tracktainer` };
          }
        } else if (manual) {
          message = { text: 'Add your Tracktainer API key in Settings to load portal shipments', type: 'error' };
        }
        if (isLocalServer()) {
          const res = await fetch('/api/shipments').catch(() => null);
          if (res?.ok && res.headers.get('content-type')?.includes('json')) {
            const data = await res.json();
            if (data.success && data.shipments?.length && !settings.tracktainerApiKey) setShipments(autoCloseOverdue(data.shipments).list);
          }
        }
        setShipments((prev) => autoCloseOverdue(prev).list);
      } finally {
        setIsSyncing(false);
        if (message && (manual || message.type === 'error')) showToast(message.text, message.type);
      }
    },
    [settings.tracktainerApiKey, settings.tracktainerBaseUrl, showToast]
  );

  useEffect(() => {
    refresh();
  }, [refresh]);

  const handleUpdateStatus = async (id, payload) => {
    const current = shipments.find((s) => s.id === id || s.containerNumber === id);
    if (!current) return;
    const updated = applyStatusUpdate(current, payload);
    setShipments((prev) => prev.map((s) => (sameShipment(s, current) ? updated : s)));
    syncSheets([updated]);
    postLocal(`/api/shipments/${id}/status`, 'PUT', payload);
    sendShipmentNotification(`${updated.containerNumber} updated`, {
      body: `${updated.status} · ${delayLabel(updated.delayDays)} · ETA ${updated.timeline?.eta || '—'}`,
    });
    showToast('Status updated');
  };

  const handleTrackShipment = (shipment) => {
    setShipments((prev) => [shipment, ...prev.filter((s) => s.containerNumber !== shipment.containerNumber)]);
    openShipment(shipment);
    syncSheets([shipment]);
    postLocal('/api/shipments', 'POST', shipment);
    showToast(`${shipment.containerNumber} added`);
  };

  const handleDelete = (shipment) => {
    if (!window.confirm(`Stop tracking ${shipment.containerNumber}? It will be removed from this device.`)) return;
    setShipments((prev) => prev.filter((s) => !sameShipment(s, shipment)));
    backToList();
    showToast(`${shipment.containerNumber} removed`);
  };

  const handleSaveSettings = async (patch) => {
    setSettings(storeSettings(patch));
    postLocal('/api/settings', 'POST', patch);
    showToast('Settings saved');
  };

  const handleTriggerSync = async (direction) => {
    setIsSyncing(true);
    try {
      if (direction === 'pull') {
        const res = await pullDirectFromGoogleSheets(settings.googleSheetsUrl);
        if (res.success && res.shipments.length) {
          setShipments(res.shipments);
          showToast(`Loaded ${res.shipments.length} shipment(s) from Google Sheets`);
        } else showToast(res.message || 'No shipments found in the sheet', 'error');
      } else {
        const res = await syncDirectToGoogleSheets(settings.googleSheetsUrl, shipments);
        showToast(res.success ? `Sent ${shipments.length} shipment(s) to Google Sheets` : 'Could not reach Google Sheets', res.success ? 'success' : 'error');
      }
    } finally {
      setIsSyncing(false);
    }
  };

  const handleInstall = async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === 'accepted') setInstallPrompt(null);
  };

  const openStatus = (s) => {
    setEditing(s);
    setModal('status');
  };
  const closeModal = () => setModal(null);

  return (
    <div className="flex min-h-dvh justify-center sm:py-6">
      <div className="relative flex min-h-dvh w-full max-w-md flex-col overflow-hidden bg-sand-50 sm:min-h-[calc(100dvh-3rem)] sm:rounded-[2rem] sm:shadow-2xl sm:ring-1 sm:ring-sand-200">
        {toast && (
          <div
            role="status"
            className="fixed inset-x-4 top-4 z-[999] mx-auto flex max-w-sm items-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-medium text-white shadow-xl animate-sheet"
          >
            {toast.type === 'error' ? (
              <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
            ) : (
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
            )}
            {toast.message}
          </div>
        )}

        {selected ? (
          <TrackingDetailScreen shipment={selected} onBack={backToList} onOpenStatusModal={openStatus} onDelete={handleDelete} />
        ) : (
          <ShipmentsListScreen
            shipments={shipments}
            onSelectShipment={openShipment}
            onOpenTrackModal={() => setModal('track')}
            onOpenSettings={() => setModal('settings')}
            googleSheetsConnected={!!settings.googleSheetsUrl}
            isSyncing={isSyncing}
            onRefresh={() => refresh(true)}
            hasInstallPrompt={!!installPrompt}
            onInstallApp={handleInstall}
          />
        )}

        {modal === 'status' && editing && (
          <UpdateStatusModal
            key={editing.id}
            shipment={editing}
            onClose={closeModal}
            onUpdateStatus={handleUpdateStatus}
            googleSheetsConnected={!!settings.googleSheetsUrl && settings.autoSyncToSheets}
          />
        )}

        {modal === 'track' && (
          <TrackShipmentModal
            onClose={closeModal}
            onTrackShipment={handleTrackShipment}
            existingNumbers={shipments.map((s) => s.containerNumber)}
          />
        )}

        {modal === 'settings' && (
          <Suspense fallback={null}>
            <IntegrationsModal
              onClose={closeModal}
              settings={settings}
              onSaveSettings={handleSaveSettings}
              onTriggerSync={handleTriggerSync}
              shipments={shipments}
            />
          </Suspense>
        )}
      </div>
    </div>
  );
}
