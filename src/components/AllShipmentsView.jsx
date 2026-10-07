import React from 'react';
import { Ship, Clock, ArrowRight, ExternalLink, Plus, RefreshCw, FileSpreadsheet } from 'lucide-react';

export default function AllShipmentsView({
  shipments,
  onSelectShipment,
  onOpenTrackModal,
  onOpenStatusModal
}) {
  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-xl p-5 border border-[#ece8df] shadow-sm flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900">
            All Tracked Shipments ({shipments?.length || 0})
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Real-time multi-carrier tracking backed by Tracktainer & Google Sheets
          </p>
        </div>
        <button
          onClick={onOpenTrackModal}
          className="px-4 py-2 bg-[#0284c7] hover:bg-[#0369a1] text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Track New Shipment</span>
        </button>
      </div>

      {/* Grid of Shipments */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {shipments?.map((s) => (
          <div
            key={s.id}
            className="bg-white rounded-xl p-5 border border-[#ece8df] shadow-sm hover:border-[#0284c7] hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
            onClick={() => onSelectShipment(s)}
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-[#f0f9ff] text-[#0284c7] flex items-center justify-center">
                    <Ship className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-mono font-bold text-slate-900 text-sm group-hover:text-[#0284c7] transition-colors">
                      {s.containerNumber}
                    </span>
                    <span className="block text-[11px] text-slate-400 font-medium">
                      {s.carrier}
                    </span>
                  </div>
                </div>

                <span
                  className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                    s.statusBadge?.includes('Delay')
                      ? 'bg-red-50 text-red-600 border border-red-100'
                      : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                  }`}
                >
                  {s.statusBadge || s.status}
                </span>
              </div>

              {/* Route */}
              <div className="bg-[#faf9f6] rounded-lg p-3 border border-slate-100 flex items-center justify-between text-xs my-3">
                <div>
                  <div className="font-bold text-slate-800">{s.pol?.name}</div>
                  <div className="text-[11px] text-slate-400">{s.pol?.date}</div>
                </div>
                <div className="flex items-center gap-1 text-slate-400 font-medium text-[11px]">
                  <span>{s.transitDays}d</span>
                  <ArrowRight className="w-3 h-3 text-[#0284c7]" />
                </div>
                <div className="text-right">
                  <div className="font-bold text-slate-800">{s.pod?.name}</div>
                  <div className="text-[11px] text-slate-400">ETA: {s.timeline?.eta}</div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs">
              <span className="text-slate-500 font-medium">
                Vessel: <b className="text-slate-800 font-semibold">{s.vesselName}</b>
              </span>
              <span className="text-[#0284c7] font-bold group-hover:underline flex items-center gap-1">
                <span>View Dashboard</span>
                <ArrowRight className="w-3 h-3" />
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
