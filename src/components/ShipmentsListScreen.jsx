import React, { useState } from 'react';
import {
  Ship,
  Search,
  Plus,
  ArrowRight,
  Settings,
  RefreshCw,
  FileSpreadsheet,
  Clock,
  MapPin,
  Edit3,
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Bell,
  Download
} from 'lucide-react';
import { getNotificationPermission, requestNotificationPermission } from '../utils/notifications';

export default function ShipmentsListScreen({
  shipments,
  onSelectShipment,
  onOpenTrackModal,
  onOpenStatusModal,
  onOpenSettings,
  googleSheetsConnected,
  tracktainerLinked,
  isSyncing,
  onRefresh,
  hasInstallPrompt,
  onInstallApp
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [notificationState, setNotificationState] = useState(() => getNotificationPermission());

  const filteredShipments = shipments.filter(s => {
    const q = searchQuery.toLowerCase();
    return (
      s.containerNumber.toLowerCase().includes(q) ||
      (s.carrier && s.carrier.toLowerCase().includes(q)) ||
      (s.pol?.name && s.pol.name.toLowerCase().includes(q)) ||
      (s.pod?.name && s.pod.name.toLowerCase().includes(q)) ||
      (s.status && s.status.toLowerCase().includes(q))
    );
  });

  return (
    <div className="flex flex-col min-h-screen bg-[#fbf9f5]">
      {/* Mobile Top Header */}
      <header className="sticky top-0 z-30 bg-[#fbf9f5]/90 backdrop-blur-md px-4 py-3.5 border-b border-[#ece8df] flex items-center justify-between">
        {/* Tracktainer Brand Logo */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-0.5">
            <div className="w-2.5 h-5 rounded-full bg-[#0284c7]"></div>
            <div className="w-2.5 h-5 rounded-full bg-[#38bdf8]"></div>
          </div>
          <div>
            <div className="text-base font-bold tracking-tight leading-none">
              <span className="text-slate-900">Track</span>
              <span className="text-[#0284c7]">tainer</span>
            </div>
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
              Shipments Portal
            </span>
          </div>
        </div>

        {/* Header Right Actions */}
        <div className="flex items-center gap-2">
          {/* Push Notification Button */}
          <button
            onClick={async () => {
              const res = await requestNotificationPermission();
              setNotificationState(res);
            }}
            title={notificationState === 'granted' ? 'Push Notifications Active' : 'Enable Push Notifications'}
            className={`w-8 h-8 rounded-full border flex items-center justify-center transition-colors shadow-2xs relative ${
              notificationState === 'granted'
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-white text-slate-600 hover:text-[#0284c7] border-[#ece8df]'
            }`}
          >
            <Bell className="w-3.5 h-3.5" />
            {notificationState !== 'granted' && (
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
            )}
          </button>

          {/* Refresh / Sync Button */}
          <button
            onClick={onRefresh}
            title="Refresh Data"
            className="w-8 h-8 rounded-full bg-white border border-[#ece8df] text-slate-600 hover:text-[#0284c7] flex items-center justify-center transition-colors shadow-2xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-[#0284c7]' : ''}`} />
          </button>

          {/* Settings Button (Google Sheets & Tracktainer API) */}
          <button
            onClick={onOpenSettings}
            title="Integrations & Settings"
            className="w-8 h-8 rounded-full bg-white border border-[#ece8df] text-slate-700 hover:text-[#0284c7] flex items-center justify-center transition-colors shadow-2xs relative"
          >
            <Settings className="w-4 h-4" />
            {googleSheetsConnected && (
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-emerald-500"></span>
            )}
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 p-4 space-y-3.5 pb-24">
        {/* PWA Install Banner */}
        {hasInstallPrompt && (
          <div className="bg-gradient-to-r from-[#0284c7] to-[#0369a1] text-white p-3 rounded-2xl shadow-sm flex items-center justify-between animate-in fade-in">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
                <Download className="w-4 h-4 text-white" />
              </div>
              <div>
                <div className="text-xs font-bold leading-tight">Install Mobile App</div>
                <div className="text-[10px] text-white/80">Add Tracktainer to Home Screen</div>
              </div>
            </div>
            <button
              onClick={onInstallApp}
              className="px-3 py-1.5 bg-white text-[#0284c7] text-xs font-bold rounded-lg shadow-xs active:scale-95 transition-all"
            >
              Install
            </button>
          </div>
        )}
        {/* Connection Status Pill Banner */}
        <div className="flex items-center justify-between bg-white px-3.5 py-2.5 rounded-xl border border-[#ece8df] shadow-2xs">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className={`w-4 h-4 ${googleSheetsConnected ? 'text-emerald-600' : 'text-slate-400'}`} />
            <div className="text-xs">
              <span className="font-semibold text-slate-800">Google Sheets: </span>
              <span className={googleSheetsConnected ? 'text-emerald-600 font-bold' : 'text-slate-400'}>
                {googleSheetsConnected ? 'Connected & Live' : 'Not Linked'}
              </span>
            </div>
          </div>

          <button
            onClick={onOpenSettings}
            className="text-[11px] font-bold text-[#0284c7] hover:underline"
          >
            {googleSheetsConnected ? 'Configure' : 'Setup Sync'}
          </button>
        </div>

        {/* Screen Title & Add Action */}
        <div className="flex items-center justify-between pt-1">
          <div>
            <h1 className="text-lg font-bold text-slate-900 leading-tight">
              Added Shipments
            </h1>
            <p className="text-xs text-slate-500">
              Select a shipment below to view live tracking
            </p>
          </div>

          <button
            onClick={onOpenTrackModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0284c7] text-white text-xs font-bold shadow-xs active:scale-95 transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add</span>
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search container, carrier, port..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-white border border-[#ece8df] focus:outline-none focus:ring-2 focus:ring-[#0284c7] font-medium placeholder-slate-400 shadow-2xs"
          />
        </div>

        {/* Shipments List */}
        <div className="space-y-3 pt-1">
          {filteredShipments.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 text-center border border-[#ece8df]">
              <Ship className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-xs font-semibold text-slate-600">No shipments found</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Add a container or adjust your search filter</p>
            </div>
          ) : (
            filteredShipments.map((shipment) => {
              const isDelayed = shipment.statusBadge?.includes('Delay') || shipment.timeline?.isDelayed;

              return (
                <div
                  key={shipment.id}
                  className="bg-white rounded-2xl p-4 border border-[#ece8df] shadow-xs hover:border-[#0284c7] transition-all relative overflow-hidden group"
                >
                  {/* Top Row: Container Number & Status Badge */}
                  <div className="flex items-start justify-between gap-2 mb-2.5">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-sm text-slate-900 tracking-wide">
                          {shipment.containerNumber}
                        </span>
                        <span className="text-[10px] font-semibold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                          {shipment.carrier?.split(' ')[0] || 'KMTC'}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-400 mt-0.5 block truncate max-w-[200px]">
                        Vessel: {shipment.vesselName} ({shipment.voyage || '2605W'})
                      </span>
                    </div>

                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap ${
                        isDelayed
                          ? 'bg-red-50 text-red-600 border border-red-100'
                          : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                      }`}
                    >
                      {shipment.statusBadge || shipment.status}
                    </span>
                  </div>

                  {/* Route Overview Row */}
                  <div
                    onClick={() => onSelectShipment(shipment)}
                    className="bg-[#faf9f6] rounded-xl p-3 border border-slate-100 flex items-center justify-between cursor-pointer hover:bg-[#f0f9ff]/50 transition-colors"
                  >
                    {/* Origin */}
                    <div className="min-w-0">
                      <div className="text-[10px] font-bold uppercase text-slate-400">POL</div>
                      <div className="text-xs font-bold text-slate-800 truncate">
                        {shipment.pol?.name}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {shipment.pol?.date}
                      </div>
                    </div>

                    {/* Middle Days Indicator */}
                    <div className="flex flex-col items-center px-2">
                      <span className="text-[10px] font-bold text-[#0284c7] bg-[#e0f2fe] px-2 py-0.5 rounded-full">
                        {shipment.transitDays || 37}d
                      </span>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-400 my-0.5" />
                      <span className="text-[9px] uppercase font-bold text-slate-400">
                        {shipment.direct ? 'Direct' : 'Tranship'}
                      </span>
                    </div>

                    {/* Destination */}
                    <div className="text-right min-w-0">
                      <div className="text-[10px] font-bold uppercase text-slate-400">POD</div>
                      <div className="text-xs font-bold text-slate-800 truncate">
                        {shipment.pod?.name}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        ETA: {shipment.timeline?.eta}
                      </div>
                    </div>
                  </div>

                  {/* Bottom Action Buttons */}
                  <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-slate-100">
                    <button
                      onClick={() => onOpenStatusModal(shipment)}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-slate-600 hover:text-[#0284c7] bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200/70"
                    >
                      <Edit3 className="w-3 h-3 text-[#0284c7]" />
                      <span>Update Status</span>
                    </button>

                    <button
                      onClick={() => onSelectShipment(shipment)}
                      className="inline-flex items-center gap-1 px-3 py-1 text-xs font-bold text-white bg-[#0284c7] hover:bg-[#0369a1] rounded-lg shadow-2xs transition-colors"
                    >
                      <span>Open Tracking</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </main>

      {/* Floating Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white/95 backdrop-blur-md border-t border-[#ece8df] px-6 py-2.5 flex items-center justify-around z-30 shadow-lg">
        <button
          className="flex flex-col items-center gap-1 text-[#0284c7] font-bold text-[11px]"
        >
          <Ship className="w-5 h-5" />
          <span>Shipments</span>
        </button>

        <button
          onClick={onOpenTrackModal}
          className="w-11 h-11 -mt-5 rounded-full bg-[#0284c7] text-white flex items-center justify-center shadow-lg active:scale-95 transition-transform"
          title="Add New Shipment"
        >
          <Plus className="w-6 h-6" />
        </button>

        <button
          onClick={onOpenSettings}
          className="flex flex-col items-center gap-1 text-slate-500 hover:text-slate-800 font-semibold text-[11px] transition-colors"
        >
          <Settings className="w-5 h-5" />
          <span>Settings</span>
        </button>
      </nav>
    </div>
  );
}
