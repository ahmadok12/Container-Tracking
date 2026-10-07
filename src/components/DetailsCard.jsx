import React from 'react';
import { Box, GitFork, Clock, Leaf } from 'lucide-react';

export default function DetailsCard({ shipment }) {
  if (!shipment) return null;

  const details = shipment.details || {};

  return (
    <div className="bg-white rounded-xl p-5 border border-[#ece8df] shadow-sm">
      <div className="text-[11px] font-bold tracking-wider text-slate-400 uppercase mb-4">
        Details
      </div>

      <div className="grid grid-cols-2 gap-3">
        {/* Containers */}
        <div className="bg-[#f8fafc] rounded-lg p-3 border border-slate-100 flex flex-col justify-between">
          <div className="flex items-center gap-1.5 text-[11px] font-bold tracking-wider text-slate-500 uppercase">
            <Box className="w-3.5 h-3.5 text-[#0284c7]" />
            <span>Containers</span>
          </div>
          <div className="text-xl font-bold text-slate-900 mt-2">
            {details.containersCount ?? 1}
          </div>
        </div>

        {/* Transhipments */}
        <div className="bg-[#f8fafc] rounded-lg p-3 border border-slate-100 flex flex-col justify-between">
          <div className="flex items-center gap-1.5 text-[11px] font-bold tracking-wider text-slate-500 uppercase">
            <GitFork className="w-3.5 h-3.5 text-indigo-500" />
            <span>Transhipments</span>
          </div>
          <div className="text-xl font-bold text-slate-900 mt-2">
            {details.transhipments ?? 0}
          </div>
        </div>

        {/* Transit Time */}
        <div className="bg-[#f8fafc] rounded-lg p-3 border border-slate-100 flex flex-col justify-between">
          <div className="flex items-center gap-1.5 text-[11px] font-bold tracking-wider text-slate-500 uppercase">
            <Clock className="w-3.5 h-3.5 text-amber-500" />
            <span>Transit Time</span>
          </div>
          <div className="text-sm font-bold text-slate-900 mt-2">
            {details.transitTime || `${shipment.transitDays || 37} days`}
          </div>
        </div>

        {/* Carbon */}
        <div className="bg-[#f8fafc] rounded-lg p-3 border border-slate-100 flex flex-col justify-between">
          <div className="flex items-center gap-1.5 text-[11px] font-bold tracking-wider text-slate-500 uppercase">
            <Leaf className="w-3.5 h-3.5 text-emerald-500" />
            <span>Carbon</span>
          </div>
          <div className="text-sm font-bold text-slate-900 mt-2">
            {details.carbon || '1.42 t CO₂'}
          </div>
        </div>
      </div>
    </div>
  );
}
