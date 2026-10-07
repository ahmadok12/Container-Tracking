import React from 'react';
import {
  ArrowLeft,
  Settings,
  RefreshCw,
  Edit3,
  FileSpreadsheet,
  Share2,
  ExternalLink
} from 'lucide-react';
import ShipmentMap from './ShipmentMap';
import ShipmentRouteCard from './ShipmentRouteCard';
import TimelineCard from './TimelineCard';
import DetailsCard from './DetailsCard';
import MilestonesTable from './MilestonesTable';

export default function TrackingDetailScreen({
  shipment,
  onBack,
  onOpenStatusModal,
  onOpenSettings,
  googleSheetsConnected,
  isSyncing,
  onQuickSync
}) {
  if (!shipment) return null;

  return (
    <div className="flex flex-col min-h-screen bg-[#fbf9f5] pb-24">
      {/* Mobile Top Header */}
      <header className="sticky top-0 z-30 bg-[#fbf9f5]/90 backdrop-blur-md px-3.5 py-3 border-b border-[#ece8df] flex items-center justify-between">
        <div className="flex items-center gap-2 min-w-0">
          <button
            onClick={onBack}
            className="w-8 h-8 rounded-full bg-white border border-[#ece8df] text-slate-700 hover:text-slate-900 flex items-center justify-center transition-colors shadow-2xs flex-shrink-0"
            title="Back to Shipments"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-mono font-bold text-sm text-slate-900 truncate">
                {shipment.containerNumber}
              </span>
              <span className="text-[10px] font-semibold text-slate-400 bg-slate-100 px-1.5 py-0.2 rounded">
                {shipment.carrier?.split(' ')[0] || 'KMTC'}
              </span>
            </div>
            <span className="text-[10px] text-slate-400 block truncate">
              {shipment.pol?.name} → {shipment.pod?.name}
            </span>
          </div>
        </div>

        {/* Header Right Actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Prominent Update Status Button */}
          <button
            onClick={() => onOpenStatusModal(shipment)}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#0284c7] hover:bg-[#0369a1] text-white text-xs font-bold shadow-xs active:scale-95 transition-all"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Update</span>
          </button>

          {/* Settings Button */}
          <button
            onClick={onOpenSettings}
            className="w-8 h-8 rounded-full bg-white border border-[#ece8df] text-slate-700 hover:text-[#0284c7] flex items-center justify-center transition-colors shadow-2xs relative"
            title="Settings & Integrations"
          >
            <Settings className="w-4 h-4" />
            {googleSheetsConnected && (
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-emerald-500"></span>
            )}
          </button>
        </div>
      </header>

      {/* Main Tracking Content */}
      <main className="p-3.5 space-y-4">
        {/* Quick Info & Google Sheets Indicator */}
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
              shipment.statusBadge?.includes('Delay')
                ? 'bg-red-50 text-red-600 border border-red-100'
                : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
            }`}>
              {shipment.statusBadge || shipment.status}
            </span>
            <span className="text-xs text-slate-500 font-medium">
              {shipment.vesselName}
            </span>
          </div>

          <button
            onClick={onOpenSettings}
            className="flex items-center gap-1 text-[11px] font-semibold text-slate-500 hover:text-slate-800"
          >
            <FileSpreadsheet className={`w-3 h-3 ${googleSheetsConnected ? 'text-emerald-600' : 'text-slate-400'}`} />
            <span>{googleSheetsConnected ? 'Sheets Sync' : 'Link Sheets'}</span>
          </button>
        </div>

        {/* 1. Interactive Ocean Map (Mobile height) */}
        <div className="h-[280px] w-full">
          <ShipmentMap shipment={shipment} />
        </div>

        {/* 2. Route Card */}
        <ShipmentRouteCard shipment={shipment} />

        {/* 3. Timeline Card */}
        <TimelineCard shipment={shipment} />

        {/* 4. Details Card */}
        <DetailsCard shipment={shipment} />

        {/* 5. Chronological Milestones Table */}
        <MilestonesTable
          milestones={shipment.milestones}
          onAddMilestone={() => onOpenStatusModal(shipment)}
        />
      </main>

      {/* Fixed Sticky Bottom Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white/95 backdrop-blur-md border-t border-[#ece8df] p-3 z-30 shadow-lg flex items-center gap-2.5">
        <button
          onClick={onBack}
          className="px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors flex items-center gap-1"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Shipments</span>
        </button>

        <button
          onClick={() => onOpenStatusModal(shipment)}
          className="flex-1 py-2.5 px-4 rounded-xl bg-[#0284c7] hover:bg-[#0369a1] text-white text-xs font-bold shadow-sm active:scale-98 transition-all flex items-center justify-center gap-2"
        >
          <Edit3 className="w-4 h-4" />
          <span>Update Shipment Status</span>
        </button>
      </div>
    </div>
  );
}
