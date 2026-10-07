import React from 'react';
import {
  Bell,
  Coins,
  Plus,
  ExternalLink,
  ChevronDown,
  RefreshCw,
  FileSpreadsheet,
  CheckCircle2
} from 'lucide-react';

export default function TopBar({
  currentShipment,
  shipments,
  onSelectShipment,
  onOpenStatusModal,
  onOpenIntegrations,
  onOpenGoogleSheets,
  googleSheetsConnected,
  isSyncing,
  onQuickSync
}) {
  return (
    <header className="h-16 px-6 flex items-center justify-between border-b border-[#ece8df]/70 bg-transparent">
      {/* Left: Active Shipment Breadcrumb & Selector */}
      <div className="flex items-center gap-3">
        <div className="relative group">
          <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white border border-[#ece8df] shadow-2xs hover:border-slate-300 transition-colors">
            <span className="text-xs font-semibold text-slate-500">Container:</span>
            <span className="text-sm font-bold text-slate-900 tracking-wide">
              {currentShipment?.containerNumber || 'No Shipment'}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-1" />
          </button>

          {/* Quick Shipment Dropdown */}
          <div className="absolute top-full left-0 mt-1.5 w-64 bg-white rounded-xl shadow-lg border border-[#ece8df] p-1.5 z-50 hidden group-hover:block">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1">
              Tracked Shipments ({shipments?.length || 0})
            </div>
            {shipments?.map((s) => (
              <button
                key={s.id}
                onClick={() => onSelectShipment(s)}
                className={`w-full text-left px-2.5 py-2 rounded-lg text-xs font-medium flex items-center justify-between hover:bg-slate-50 transition-colors ${
                  s.id === currentShipment?.id ? 'bg-[#f0f9ff] text-[#0284c7] font-semibold' : 'text-slate-700'
                }`}
              >
                <div>
                  <div className="font-bold">{s.containerNumber}</div>
                  <div className="text-[11px] text-slate-400">{s.pol?.name} → {s.pod?.name}</div>
                </div>
                <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                  s.statusBadge?.includes('Delay') ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'
                }`}>
                  {s.statusBadge || s.status}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Carrier Info Badge */}
        {currentShipment?.carrier && (
          <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-white border border-slate-200/80 text-slate-600 shadow-2xs hidden sm:inline-block">
            {currentShipment.carrier}
          </span>
        )}

        {/* Google Sheets Sync Indicator */}
        <button
          onClick={onOpenGoogleSheets}
          title="Google Sheets Auto-Sync Status (Click to configure)"
          className={`hidden md:flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border transition-colors ${
            googleSheetsConnected
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
              : 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
          }`}
        >
          <FileSpreadsheet className="w-3 h-3 text-emerald-600" />
          <span>{googleSheetsConnected ? 'Sheets Live' : 'Link Google Sheets'}</span>
          {googleSheetsConnected && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>}
        </button>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3">
        {/* Update Status Button (Primary user action requested!) */}
        <button
          onClick={onOpenStatusModal}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0284c7] hover:bg-[#0369a1] text-white text-xs font-bold shadow-xs hover:shadow-sm transition-all"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
          <span>Update Status</span>
        </button>

        {/* Notification Bell */}
        <button
          title="Notifications"
          className="w-8 h-8 rounded-full bg-white border border-[#ece8df] text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors shadow-2xs relative"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[#0284c7]"></span>
        </button>

        {/* Credits Pill */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-[#ece8df] text-xs font-semibold text-slate-700 shadow-2xs">
          <Coins className="w-3.5 h-3.5 text-amber-500" />
          <span>1 Credits</span>
        </div>

        {/* Buy Credits Button */}
        <button
          onClick={() => alert('Tracktainer Subscription & Credits: Unlimited API requests enabled.')}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#f0f9ff] text-[#0284c7] hover:bg-[#e0f2fe] border border-[#bae6fd] text-xs font-bold transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Buy Credits</span>
        </button>

        {/* User Profile Avatar */}
        <div
          title="Account: AA (Logged In)"
          className="w-8 h-8 rounded-full bg-slate-300 text-slate-700 flex items-center justify-center font-bold text-xs cursor-pointer border border-white shadow-2xs"
        >
          AA
        </div>

        {/* External Link */}
        <button
          title="Share Tracking Link"
          onClick={() => {
            navigator.clipboard.writeText(window.location.href);
            alert('Public Tracking URL copied to clipboard!');
          }}
          className="w-8 h-8 rounded-full bg-white border border-[#ece8df] text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors shadow-2xs"
        >
          <ExternalLink className="w-3.5 h-3.5" />
        </button>
      </div>
    </header>
  );
}
