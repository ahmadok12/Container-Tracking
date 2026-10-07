import React, { useState, useEffect } from 'react';
import ShipmentsListScreen from './components/ShipmentsListScreen';
import TrackingDetailScreen from './components/TrackingDetailScreen';
import UpdateStatusModal from './components/UpdateStatusModal';
import TrackShipmentModal from './components/TrackShipmentModal';
import IntegrationsModal from './components/IntegrationsModal';
import { defaultShipments } from './data/defaultShipments';
import { CheckCircle2, AlertCircle } from 'lucide-react';

export default function App() {
  const [shipments, setShipments] = useState(defaultShipments);
  const [selectedShipment, setSelectedShipment] = useState(defaultShipments[0]);
  const [activeScreen, setActiveScreen] = useState('list'); // 'list' | 'detail'
  
  const [settings, setSettings] = useState({
    tracktainerApiKey: 'ca0853e15f63f20e1f02bc87166ed103bdeab9db',
    tracktainerBaseUrl: 'https://api.tracktainer.com/v1',
    googleSheetsUrl: '',
    autoSyncToSheets: true,
  });

  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [editingShipment, setEditingShipment] = useState(null);
  const [isTrackModalOpen, setIsTrackModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [settingsTab, setSettingsTab] = useState('sheets');
  const [isSyncing, setIsSyncing] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Fetch shipments and settings from API
  const fetchShipments = async () => {
    try {
      setIsSyncing(true);
      const res = await fetch('/api/shipments');
      const data = await res.json();
      if (data.success && data.shipments && data.shipments.length > 0) {
        setShipments(data.shipments);
        if (selectedShipment) {
          const updated = data.shipments.find(s => s.id === selectedShipment.id);
          if (updated) setSelectedShipment(updated);
        }
      }
    } catch (err) {
      console.warn('API error fetching shipments:', err);
    } finally {
      setIsSyncing(false);
    }
  };

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/settings');
      const data = await res.json();
      if (data.success && data.settings) {
        setSettings(data.settings);
      }
    } catch (err) {
      console.warn('API error fetching settings:', err);
    }
  };

  useEffect(() => {
    fetchShipments();
    fetchSettings();
  }, []);

  // Update Status handler
  const handleUpdateStatus = async (id, updatePayload) => {
    setIsSyncing(true);
    try {
      const res = await fetch(`/api/shipments/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatePayload),
      });
      const data = await res.json();
      if (data.success) {
        showToast('Shipment status updated & recorded in Google Sheets!');
        await fetchShipments();
        if (selectedShipment && selectedShipment.id === id) {
          setSelectedShipment(data.shipment);
        }
      } else {
        showToast(data.message || 'Failed to update status', 'error');
      }
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
      const res = await fetch('/api/shipments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newShipmentData),
      });
      const data = await res.json();
      if (data.success && data.shipment) {
        showToast(`Container ${data.shipment.containerNumber} added!`);
        await fetchShipments();
        setSelectedShipment(data.shipment);
        setActiveScreen('detail');
      } else {
        showToast(data.message || 'Could not track shipment', 'error');
      }
    } catch (err) {
      showToast('Error tracking shipment: ' + err.message, 'error');
    } finally {
      setIsSyncing(false);
    }
  };

  // Save Settings handler
  const handleSaveSettings = async (newSettings) => {
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSettings),
      });
      const data = await res.json();
      if (data.success) {
        setSettings(data.settings);
        showToast('Settings saved successfully!');
      }
    } catch (err) {
      showToast('Error saving settings: ' + err.message, 'error');
    }
  };

  // Google Sheets Sync Trigger
  const handleTriggerSync = async (direction) => {
    setIsSyncing(true);
    try {
      const res = await fetch('/api/google-sheets/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ direction }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message || 'Google Sheets sync completed!');
        if (direction === 'pull') fetchShipments();
      } else {
        showToast(data.message || 'Sync failed', 'error');
      }
    } catch (err) {
      showToast('Sync error: ' + err.message, 'error');
    } finally {
      setIsSyncing(false);
    }
  };

  // Open status modal for specific shipment
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
