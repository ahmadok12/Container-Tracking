import React, { useState } from 'react';
import { X, RefreshCw, FileSpreadsheet, CheckCircle2, Clock } from 'lucide-react';

export default function UpdateStatusModal({
  isOpen,
  onClose,
  shipment,
  onUpdateStatus,
  googleSheetsConnected
}) {
  if (!isOpen || !shipment) return null;

  const [status, setStatus] = useState(shipment.status || 'In Transit');
  const [delayDays, setDelayDays] = useState(shipment.delayDays ?? 4);
  const [eta, setEta] = useState(shipment.timeline?.eta || 'Oct 7, 2026');
  const [ata, setAta] = useState(shipment.timeline?.ata || '');
  const [addMilestone, setAddMilestone] = useState(true);
  const [milestoneEvent, setMilestoneEvent] = useState('Status Updated');
  const [milestoneLocation, setMilestoneLocation] = useState(shipment.pod?.name || 'Karachi, Pakistan');
  const [milestoneType, setMilestoneType] = useState('ACTUAL');
  const [syncToSheets, setSyncToSheets] = useState(true);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    const updatePayload = {
      status,
      delayDays: Number(delayDays),
      eta,
      ata: ata || null,
      syncToSheets,
      ...(addMilestone
        ? {
            addMilestone: {
              date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
              type: milestoneType,
              location: milestoneLocation,
              countryFlag: milestoneLocation.toLowerCase().includes('karachi') || milestoneLocation.toLowerCase().includes('pakistan') ? '🇵🇰' : '🇨🇳',
              event: milestoneEvent,
              vesselInfo: `${shipment.vesselName} IMO ${shipment.imo} VOY ${shipment.voyage}`,
            },
          }
        : {}),
    };

    await onUpdateStatus(shipment.id, updatePayload);
    setSaving(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-3 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-md w-full border border-[#ece8df] shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="px-4 py-3.5 border-b border-slate-100 flex items-center justify-between bg-[#faf9f6]/80 flex-shrink-0">
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              Update Shipment Status
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Container <span className="font-mono font-semibold text-[#0284c7]">{shipment.containerNumber}</span> • {shipment.carrier}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 space-y-3.5 overflow-y-auto flex-1">
          {/* Status Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Current Shipment Status
            </label>
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setMilestoneEvent(e.target.value);
              }}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0284c7] focus:border-transparent bg-white font-medium text-slate-800"
            >
              <option value="In Transit">In Transit (Underway)</option>
              <option value="Gate Out Empty">Gate Out Empty</option>
              <option value="Gate In Full">Gate In Full</option>
              <option value="Loaded">Loaded onto Vessel</option>
              <option value="Departed">Departed Origin Port</option>
              <option value="Delayed">Delayed / Transhipment Wait</option>
              <option value="Arrived">Arrived at Port of Discharge</option>
              <option value="Customs Clearance">Customs Clearance / Hold</option>
              <option value="Discharged">Discharged from Vessel</option>
              <option value="Delivered">Delivered to Consignee</option>
            </select>
          </div>

          {/* Delay Days & ETA Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Delay Days (+ / -)
              </label>
              <input
                type="number"
                value={delayDays}
                onChange={(e) => setDelayDays(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0284c7] font-medium"
                placeholder="0"
              />
              <span className="text-[11px] text-slate-400 mt-0.5 block">
                0 = On Schedule, &gt;0 = Delayed
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Estimated Arrival (ETA)
              </label>
              <input
                type="text"
                value={eta}
                onChange={(e) => setEta(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0284c7] font-medium"
                placeholder="e.g. Oct 7, 2026"
              />
            </div>
          </div>

          {/* Actual Arrival Time (ATA) if arrived */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Actual Arrival Date (ATA) <span className="text-slate-400 normal-case font-normal">(optional)</span>
            </label>
            <input
              type="text"
              value={ata}
              onChange={(e) => setAta(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0284c7] font-medium"
              placeholder="Leave blank or e.g. Oct 7, 2026"
            />
          </div>

          {/* Append to Milestones Section */}
          <div className="pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between mb-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={addMilestone}
                  onChange={(e) => setAddMilestone(e.target.checked)}
                  className="rounded text-[#0284c7] focus:ring-[#0284c7] w-4 h-4"
                />
                <span className="text-xs font-bold text-slate-800">
                  Record new milestone event in timeline table
                </span>
              </label>
            </div>

            {addMilestone && (
              <div className="space-y-3 bg-[#faf9f6] p-3.5 rounded-xl border border-slate-200/80">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Event Description
                    </label>
                    <input
                      type="text"
                      value={milestoneEvent}
                      onChange={(e) => setMilestoneEvent(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs rounded-md border border-slate-200 focus:outline-none focus:ring-1 focus:ring-[#0284c7] bg-white font-medium"
                      placeholder="e.g. Arrived"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Event Type
                    </label>
                    <select
                      value={milestoneType}
                      onChange={(e) => setMilestoneType(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs rounded-md border border-slate-200 focus:outline-none focus:ring-1 focus:ring-[#0284c7] bg-white font-semibold"
                    >
                      <option value="ACTUAL">ACTUAL (Completed)</option>
                      <option value="PLANNED">PLANNED (Upcoming)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Event Port / Location
                  </label>
                  <input
                    type="text"
                    value={milestoneLocation}
                    onChange={(e) => setMilestoneLocation(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs rounded-md border border-slate-200 focus:outline-none focus:ring-1 focus:ring-[#0284c7] bg-white font-medium"
                    placeholder="e.g. Karachi, Pakistan"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Google Sheets Sync Checkbox */}
          <div className="pt-2 flex items-center justify-between text-xs text-slate-600">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={syncToSheets}
                onChange={(e) => setSyncToSheets(e.target.checked)}
                className="rounded text-[#0284c7] focus:ring-[#0284c7] w-4 h-4"
              />
              <span className="flex items-center gap-1.5">
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                <span>Auto-sync update to Google Sheets</span>
              </span>
            </label>
            <span className={`text-[11px] font-medium ${googleSheetsConnected ? 'text-emerald-600' : 'text-slate-400'}`}>
              {googleSheetsConnected ? '✓ Google Sheets Connected' : '(Local & Sync)'}
            </span>
          </div>

          {/* Submit Action */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 text-xs font-bold text-white bg-[#0284c7] hover:bg-[#0369a1] rounded-lg shadow-xs flex items-center gap-1.5 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${saving ? 'animate-spin' : ''}`} />
              <span>{saving ? 'Saving...' : 'Save & Update Status'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
