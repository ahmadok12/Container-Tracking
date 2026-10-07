import React from 'react';
import { Ship, Plus } from 'lucide-react';

export default function MilestonesTable({ milestones, onAddMilestone }) {
  const events = milestones || [];

  return (
    <div className="bg-white rounded-xl border border-[#ece8df] shadow-sm overflow-hidden mt-6">
      <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold tracking-wider text-slate-900 uppercase">
            Shipment Milestones
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Chronological carrier and port event history
          </p>
        </div>
        <button
          onClick={onAddMilestone}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg text-[#0284c7] bg-[#f0f9ff] hover:bg-[#e0f2fe] transition-colors border border-[#bae6fd]"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Event</span>
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-100 bg-[#faf9f6]/60 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              <th className="py-3 px-6">Date</th>
              <th className="py-3 px-6">Status</th>
              <th className="py-3 px-6">Location</th>
              <th className="py-3 px-6">Milestone Event</th>
              <th className="py-3 px-6">Vessel / Voyage</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {events.length === 0 ? (
              <tr>
                <td colSpan="5" className="py-8 text-center text-slate-400 text-sm">
                  No milestone events recorded yet.
                </td>
              </tr>
            ) : (
              events.map((item, idx) => {
                const isActual = item.type === 'ACTUAL';
                return (
                  <tr
                    key={item.id || idx}
                    className="hover:bg-slate-50/70 transition-colors group"
                  >
                    {/* Date */}
                    <td className="py-4 px-6 font-semibold text-slate-800 whitespace-nowrap text-sm">
                      {item.date}
                    </td>

                    {/* Status Pill (Actual vs Planned) */}
                    <td className="py-4 px-6 whitespace-nowrap">
                      {isActual ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#e0f2fe] text-[#0284c7]">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#0284c7]"></span>
                          <span>ACTUAL</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-500">
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                          <span>PLANNED</span>
                        </span>
                      )}
                    </td>

                    {/* Location with Flag */}
                    <td className="py-4 px-6 whitespace-nowrap text-slate-700">
                      <div className="flex items-center gap-2">
                        <span className="text-base leading-none">
                          {item.countryFlag || '📍'}
                        </span>
                        <span className="font-medium text-slate-800">
                          {item.location}
                        </span>
                      </div>
                    </td>

                    {/* Milestone Event Description */}
                    <td className="py-4 px-6 text-slate-700 font-medium">
                      <span className={item.event === 'Arrived' ? 'italic font-medium text-slate-600' : ''}>
                        {item.event}
                      </span>
                    </td>

                    {/* Vessel / Voyage */}
                    <td className="py-4 px-6 text-slate-600 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Ship className="w-4 h-4 text-slate-400 flex-shrink-0" />
                        <div className="text-xs">
                          <span className="font-semibold text-slate-800 mr-2">
                            {item.vesselInfo?.split(' IMO')[0] || item.vesselInfo || '-'}
                          </span>
                          {item.vesselInfo?.includes('IMO') && (
                            <span className="text-[11px] text-slate-400 font-mono">
                              IMO {item.vesselInfo.split('IMO ')[1]?.split(' ')[0]}
                            </span>
                          )}
                          {item.vesselInfo?.includes('VOY') && (
                            <span className="ml-2 px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold bg-blue-50 text-blue-600 border border-blue-100">
                              VOY {item.vesselInfo.split('VOY ')[1]}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
