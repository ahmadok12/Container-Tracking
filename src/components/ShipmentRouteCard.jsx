import React from 'react';
import { Info, Clock, ArrowRight } from 'lucide-react';

export default function ShipmentRouteCard({ shipment }) {
  if (!shipment) return null;

  const pol = shipment.pol || { name: 'Qingdao', code: 'CNTAO', date: 'Aug 31, 2026' };
  const pod = shipment.pod || { name: 'Karachi', code: 'PKKHI', date: 'Oct 7, 2026' };
  const transitDays = shipment.transitDays || 37;
  const isDirect = shipment.direct !== false;

  return (
    <div className="bg-white rounded-xl p-5 border border-[#ece8df] shadow-sm">
      <div className="text-[11px] font-bold tracking-wider text-slate-400 uppercase mb-4">
        Shipment Route
      </div>

      <div className="flex items-center justify-between gap-4">
        {/* POL - Port of Loading */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
            <span>POL</span>
            <Info className="w-3.5 h-3.5 text-slate-300" />
          </div>
          <div className="text-xl font-bold text-slate-900 truncate">
            {pol.name}
          </div>
          <div className="text-xs font-semibold text-slate-500 tracking-wider">
            {pol.code}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-2">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>{pol.date}</span>
          </div>
        </div>

        {/* Center Route Badge */}
        <div className="flex flex-col items-center justify-center px-2">
          <div className="px-3 py-1 rounded-full bg-[#e0f2fe] text-[#0284c7] font-semibold text-xs whitespace-nowrap shadow-xs">
            {transitDays} days
          </div>
          <div className="flex items-center gap-1 text-slate-400 my-1">
            <span className="w-6 h-[1.5px] bg-slate-200"></span>
            <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
            <span className="w-6 h-[1.5px] bg-slate-200"></span>
          </div>
          <div className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
            {isDirect ? 'Direct' : 'Transhipment'}
          </div>
        </div>

        {/* POD - Port of Discharge */}
        <div className="flex-1 min-w-0 text-right">
          <div className="flex items-center justify-end gap-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
            <Info className="w-3.5 h-3.5 text-slate-300" />
            <span>POD</span>
          </div>
          <div className="text-xl font-bold text-slate-900 truncate">
            {pod.name}
          </div>
          <div className="text-xs font-semibold text-slate-500 tracking-wider">
            {pod.code}
          </div>
          <div className="flex items-center justify-end gap-1.5 text-xs text-slate-400 mt-2">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>{pod.date}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
