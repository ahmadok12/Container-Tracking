import React from 'react';
import { Info } from 'lucide-react';

export default function TimelineCard({ shipment }) {
  if (!shipment) return null;

  const timeline = shipment.timeline || {};
  const isDelayed = shipment.delayDays > 0 || timeline.isDelayed;

  return (
    <div className="bg-white rounded-xl p-5 border border-[#ece8df] shadow-sm">
      <div className="text-[11px] font-bold tracking-wider text-slate-400 uppercase mb-4">
        Timeline
      </div>

      <div className="space-y-3.5">
        {/* ETA */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">
            <span>ETA</span>
            <Info className="w-3.5 h-3.5 text-slate-300" />
          </div>
          <div className="text-sm font-semibold text-slate-900">
            {timeline.eta || shipment.pod?.date || 'N/A'}
          </div>
        </div>

        {/* ATA */}
        <div className="flex items-center justify-between">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            ATA
          </div>
          <div className="text-sm font-semibold text-slate-900">
            {timeline.ata || '-'}
          </div>
        </div>

        {/* Delay */}
        <div className="flex items-center justify-between pt-1">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Delay
          </div>
          <div>
            {isDelayed ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-50 text-red-600 border border-red-100">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                <span>{timeline.delayText || `Delayed +${shipment.delayDays} days`}</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-100">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                <span>On Schedule</span>
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
