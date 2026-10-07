import React, { useState, useEffect } from 'react';
import ShipmentsListScreen from './components/ShipmentsListScreen';
import TrackingDetailScreen from './components/TrackingDetailScreen';
import UpdateStatusModal from './components/UpdateStatusModal';
import TrackShipmentModal from './components/TrackShipmentModal';
import IntegrationsModal from './components/IntegrationsModal';
import {
  getStoredShipments,
  storeShipments,
  getStoredSettings,
  storeSettings,
  syncDirectToGoogleSheets,
  pullDirectFromGoogleSheets,
  isLocalServer
} from './utils/storage';
import { fetchLiveTracktainerShipments } from './utils/tracktainerApi';
import {
  sendShipmentNotification,
  requestNotificationPermission,
  getNotificationPermission
} from './utils/notifications';
import { CheckCircle2, AlertCircle, Download, Bell } from 'lucide-react';

export default function App() {
  const [shipments, setShipments] = useState(() => getStoredShipments());
  const [selectedShipment, setSelectedShipment] = useState(() => getStoredShipments()[0]);
  const [activeScreen, setActiveScreen] = useState('list'); // 'list' | 'detail'
  const [settings, setSettings] = useState(() => getStoredSettings());
  const [deferredInstallPrompt, setDeferredInstallPrompt] = useState(null);

  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [editingShipment, setEditingShipment] = useState(null);
  const [isTrackModalOpen, setIsTrackModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [settingsTab, setSettingsTab] = useState('sheets');
  const [isSyncing, setIsSyncing] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    // Listen for PWA install prompt
    const handleBeforeInstall = (e) => {
      e.preventDefault();
      setDeferredInstallPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
  }, []);

  const handleInstallApp = async () => {
    if (deferredInstallPrompt) {
      deferredInstallPrompt.prompt();
      const choice = await deferredInstallPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        setDeferredInstallPrompt(null);
        showToast('Tracktainer App installed!');
      }
    }
  };

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Fetch live shipments from Tracktainer API and backend
  const fetchShipments = async () => {
    setIsSyncing(true);
    try {
      // 1. Fetch live real-time shipments directly from Tracktainer API
      if (settings.tracktainerApiKey) {
        const liveList = await fetchLiveTracktainerShipments(settings.tracktainerApiKey);
        if (liveList && liveList.length > 0) {
          setShipments(liveList);
          storeShipments(liveList);
          if (selectedShipment) {
            const found = liveList.find(s => s.containerNumber === selectedShipment.containerNumber || s.id === selectedShipment.id);
            setSelectedShipment(found || liveList[0]);
          } else {
            setSelectedShipment(liveList[0]);
          }
          setIsSyncing(false);
          return;
        }
      }

      // 2. If running on local server, try syncing with local backend
      if (isLocalServer()) {
        const res = await fetch('/api/shipments');
        if (res.ok && res.headers.get('content-type')?.includes('json')) {
          const data = await res.json();
          if (data.success && data.shipments && data.shipments.length > 0) {
            setShipments(data.shipments);
            storeShipments(data.shipments);
            if (selectedShipment) {
              const updated = data.shipments.find(s => s.id === selectedShipment.id);
              if (updated) setSelectedShipment(updated);
            }
          }
        }
      }
    } catch (err) {
      console.warn('Sync notice:', err);
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    fetchShipments();
  }, []);

  // Update Status handler
  const handleUpdateStatus = async (id, updatePayload) => {
    setIsSyncing(true);
    try {
      // 1. Immediately update in client state & localStorage
      const updatedList = shipments.map((s) => {
        if (s.id !== id && s.containerNumber !== id) return s;

        const updated = { ...s };
        if (updatePayload.status) updated.status = updatePayload.status;

        if (updatePayload.delayDays !== undefined) {
          updated.delayDays = Number(updatePayload.delayDays);
          if (updated.delayDays > 0) {
            updated.statusBadge = `Delayed +${updated.delayDays} days`;
            updated.timeline = { ...(updated.timeline || {}), delayText: `Delayed +${updated.delayDays} days`, isDelayed: true };
          } else if (updated.delayDays < 0) {
            updated.statusBadge = `Early ${Math.abs(updated.delayDays)} days`;
            updated.timeline = { ...(updated.timeline || {}), delayText: `Early ${Math.abs(updated.delayDays)} days`, isDelayed: false };
          } else {
            updated.statusBadge = 'On Schedule';
            updated.timeline = { ...(updated.timeline || {}), delayText: 'On Schedule', isDelayed: false };
          }
        }

        if (updatePayload.eta) {
          updated.timeline = { ...(updated.timeline || {}), eta: updatePayload.eta };
        }
        if (updatePayload.ata !== undefined) {
          updated.timeline = { ...(updated.timeline || {}), ata: updatePayload.ata };
        }

        if (updatePayload.addMilestone) {
          const newMilestone = {
            id: 'm-' + Date.now(),
            date: updatePayload.addMilestone.date || new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
            type: updatePayload.addMilestone.type || 'ACTUAL',
            location: updatePayload.addMilestone.location || updated.pod?.name,
            countryFlag: updatePayload.addMilestone.countryFlag || '📍',
            event: updatePayload.addMilestone.event || 'Status Updated',
            vesselInfo: updatePayload.addMilestone.vesselInfo || `${updated.vesselName} IMO ${updated.imo} VOY ${updated.voyage}`,
          };
          updated.milestones = [...(updated.milestones || []), newMilestone];
        }

        updated.lastSyncedAt = new Date().toISOString();
        return updated;
      });

      setShipments(updatedList);
      storeShipments(updatedList);

      const targetShipment = updatedList.find(s => s.id === id || s.containerNumber === id);
      if (targetShipment && selectedShipment && (selectedShipment.id === id || selectedShipment.containerNumber === id)) {
        setSelectedShipment(targetShipment);
      }

      // 2. Direct Sync to Google Sheets if configured
      if (settings.googleSheetsUrl && settings.autoSyncToSheets) {
        syncDirectToGoogleSheets(settings.googleSheetsUrl, targetShipment ? [targetShipment] : updatedList);
      }

      // 3. If running locally, also sync to backend
      if (isLocalServer()) {
        try {
          await fetch(`/api/shipments/${id}/status`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatePayload),
          });
        } catch (e) {}
      }

      if (targetShipment) {
        sendShipmentNotification(`Container ${targetShipment.containerNumber} Updated`, {
          body: `Status: ${updatePayload.status || targetShipment.status} • Delay: ${targetShipment.statusBadge}`,
        });
      }

      showToast('Shipment status updated & recorded!');
    } catch (err) {
      showToast('Error updating status: ' + err.message, 'error');
    } finally {
      setIsSyncing(false);
    }
  };

  // Track New Shipment handler
  const handleTrackShipment = async (newShipmentData) => {
    setIsSyncing(true);
    try {
      const completeShipment = {
        id: newShipmentData.id || 'trk-' + Date.now().toString(36),
        containerNumber: newShipmentData.containerNumber.toUpperCase(),
        blNumber: newShipmentData.blNumber || `BL-${newShipmentData.containerNumber}`,
        carrier: newShipmentData.carrier || 'Ocean Carrier',
        vesselName: newShipmentData.vesselName || 'PACIFIC TRADER',
        imo: newShipmentData.imo || '9400124',
        voyage: newShipmentData.voyage || '2601W',
        status: newShipmentData.status || 'In Transit',
        statusBadge: newShipmentData.statusBadge || 'On Schedule',
        delayDays: newShipmentData.delayDays || 0,
        direct: newShipmentData.direct !== undefined ? newShipmentData.direct : true,
        transitDays: newShipmentData.transitDays || 28,
        pol: newShipmentData.pol || {
          name: 'Qingdao',
          code: 'CNTAO',
          country: 'China',
          flag: '🇨🇳',
          date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
          lat: 36.0671,
          lng: 120.3826,
        },
        pod: newShipmentData.pod || {
          name: 'Karachi',
          code: 'PKKHI',
          country: 'Pakistan',
          flag: '🇵🇰',
          date: new Date(Date.now() + 25 * 86400000).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
          lat: 24.8607,
          lng: 67.0011,
        },
        currentPosition: newShipmentData.currentPosition || {
          lat: 23.85,
          lng: 65.8,
          speedKnots: 14.8,
          heading: 340,
          statusDescription: 'Underway using engine',
        },
        timeline: newShipmentData.timeline || {
          eta: new Date(Date.now() + 25 * 86400000).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
          ata: null,
          departureActual: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
          delayText: newShipmentData.statusBadge || 'On Schedule',
          isDelayed: false,
        },
        details: newShipmentData.details || {
          containersCount: 1,
          transhipments: 0,
          transitTime: '28 days',
          carbon: '1.20 t CO₂',
        },
        routePath: newShipmentData.routePath || [
          [36.0671, 120.3826],
          [22.2, 114.1],
          [1.3, 103.8],
          [6.0, 80.2],
          [23.85, 65.8],
          [24.8607, 67.0011],
        ],
        milestones: newShipmentData.milestones || [
          {
            id: 'm-' + Date.now(),
            date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
            type: 'ACTUAL',
            location: newShipmentData.pol?.name || 'Port of Origin',
            countryFlag: '🇨🇳',
            event: 'Gate in full',
            vesselInfo: (newShipmentData.vesselName || 'CARRIER') + ' ' + (newShipmentData.voyage || ''),
          },
        ],
        lastSyncedAt: new Date().toISOString(),
      };

      // 1. Save to state and localStorage
      const updatedList = [completeShipment, ...shipments.filter(s => s.containerNumber !== completeShipment.containerNumber)];
      setShipments(updatedList);
      storeShipments(updatedList);
      setSelectedShipment(completeShipment);
      setActiveScreen('detail');

      // 2. Direct Sync to Google Sheets if configured
      if (settings.googleSheetsUrl && settings.autoSyncToSheets) {
        syncDirectToGoogleSheets(settings.googleSheetsUrl, [completeShipment]);
      }

      // 3. If running locally, also sync to backend
      if (isLocalServer()) {
        try {
          await fetch('/api/shipments', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(completeShipment),
          });
        } catch (e) {}
      }

      sendShipmentNotification(`New Shipment: ${completeShipment.containerNumber}`, {
        body: `${completeShipment.carrier}: ${completeShipment.pol.name} → ${completeShipment.pod.name} (ETA: ${completeShipment.timeline.eta})`,
      });

      showToast(`Container ${completeShipment.containerNumber} added!`);
    } catch (err) {
      showToast('Error tracking shipment: ' + err.message, 'error');
    } finally {
      setIsSyncing(false);
    }
  };

  // Save Settings handler
  const handleSaveSettings = async (newSettings) => {
    try {
      const updated = storeSettings(newSettings);
      setSettings(updated);

      // If running locally, also save to backend
      if (isLocalServer()) {
        try {
          await fetch('/api/settings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newSettings),
          });
        } catch (e) {}
      }

      showToast('Settings saved successfully!');
    } catch (err) {
      showToast('Error saving settings: ' + err.message, 'error');
    }
  };

  // Google Sheets Sync Trigger
  const handleTriggerSync = async (direction) => {
    setIsSyncing(true);
    try {
      if (direction === 'pull') {
        const res = await pullDirectFromGoogleSheets(settings.googleSheetsUrl);
        if (res.success && res.shipments && res.shipments.length > 0) {
          setShipments(res.shipments);
          storeShipments(res.shipments);
          setSelectedShipment(res.shipments[0]);
          showToast(`Loaded ${res.shipments.length} shipment(s) from Google Sheets!`);
        } else {
          showToast(res.message || 'No shipments found in sheet', 'error');
        }
      } else {
        const res = await syncDirectToGoogleSheets(settings.googleSheetsUrl, shipments);
        if (res.success) {
          showToast(`Pushed ${shipments.length} shipment(s) to Google Sheets!`);
        } else {
          showToast('Failed to sync with Google Sheets', 'error');
        }
      }
    } catch (err) {
      showToast('Sync notice: ' + err.message, 'error');
    } finally {
      setIsSyncing(false);
    }
  };

  const openStatusModalFor = (shipment) => {
    setEditingShipment(shipment || selectedShipment);
    setIsStatusModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#e9e6df] sm:py-6 flex justify-center items-start font-sans select-none">
      {/* Mobile Frame Container (max-w-md, responsive full-width on mobile) */}
      <div className="w-full max-w-md min-h-screen bg-[#fbf9f5] sm:rounded-3xl sm:border sm:border-[#ece8df] sm:shadow-2xl overflow-hidden relative flex flex-col">
        {/* Toast Alert */}
        {toast && (
          <div className="fixed top-4 left-4 right-4 max-w-sm mx-auto z-[999] flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 text-white shadow-xl text-xs font-medium animate-in slide-in-from-top-3">
            {toast.type === 'error' ? (
              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            )}
            <span>{toast.message}</span>
          </div>
        )}

        {/* Screen 1: Shipment Selection Screen */}
        {activeScreen === 'list' && (
          <ShipmentsListScreen
            shipments={shipments}
            onSelectShipment={(s) => {
              setSelectedShipment(s);
              setActiveScreen('detail');
            }}
            onOpenTrackModal={() => setIsTrackModalOpen(true)}
            onOpenStatusModal={openStatusModalFor}
            onOpenSettings={() => {
              setSettingsTab('sheets');
              setIsSettingsModalOpen(true);
            }}
            googleSheetsConnected={!!settings.googleSheetsUrl}
            tracktainerLinked={!!settings.tracktainerApiKey}
            isSyncing={isSyncing}
            onRefresh={fetchShipments}
            hasInstallPrompt={!!deferredInstallPrompt}
            onInstallApp={handleInstallApp}
          />
        )}

        {/* Screen 2: Dedicated Shipment Tracking Screen */}
        {activeScreen === 'detail' && (
          <TrackingDetailScreen
            shipment={selectedShipment}
            onBack={() => setActiveScreen('list')}
            onOpenStatusModal={openStatusModalFor}
            onOpenSettings={() => {
              setSettingsTab('sheets');
              setIsSettingsModalOpen(true);
            }}
            googleSheetsConnected={!!settings.googleSheetsUrl}
            isSyncing={isSyncing}
            onQuickSync={() => handleTriggerSync('push')}
          />
        )}

        {/* Modals */}
        <UpdateStatusModal
          isOpen={isStatusModalOpen}
          onClose={() => setIsStatusModalOpen(false)}
          shipment={editingShipment || selectedShipment}
          onUpdateStatus={handleUpdateStatus}
          googleSheetsConnected={!!settings.googleSheetsUrl}
        />

        <TrackShipmentModal
          isOpen={isTrackModalOpen}
          onClose={() => setIsTrackModalOpen(false)}
          onTrackShipment={handleTrackShipment}
          tracktainerApiKey={settings.tracktainerApiKey}
        />

        <IntegrationsModal
          isOpen={isSettingsModalOpen}
          onClose={() => setIsSettingsModalOpen(false)}
          initialTab={settingsTab}
          settings={settings}
          onSaveSettings={handleSaveSettings}
          onTriggerSync={handleTriggerSync}
          shipments={shipments}
        />
      </div>
    </div>
  );
}
