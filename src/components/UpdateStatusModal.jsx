import React, { useState } from 'react';
import { Minus, Plus } from 'lucide-react';
import { Sheet, Field, inputCls } from './ui';
import { STATUSES, toInputDate, fromInputDate, today, delayLabel } from '../utils/shipments';

const ARRIVAL = new Set(['Arrived', 'Discharged', 'Customs Clearance', 'Delivered']);

export default function UpdateStatusModal({ shipment, onClose, onUpdateStatus, googleSheetsConnected }) {
  const [status, setStatus] = useState(shipment.status || 'In Transit');
  const [delayDays, setDelayDays] = useState(Number(shipment.delayDays) || 0);
  const [eta, setEta] = useState(toInputDate(shipment.timeline?.eta || shipment.pod?.date));
  const [ata, setAta] = useState(toInputDate(shipment.timeline?.ata));
  const [addMilestone, setAddMilestone] = useState(true);
  const [event, setEvent] = useState('');
  const [location, setLocation] = useState(`${shipment.pod?.name || ''}${shipment.pod?.country ? `, ${shipment.pod.country}` : ''}`);
  const [saving, setSaving] = useState(false);

  const showAta = ARRIVAL.has(status);
  const etaPassed = !ARRIVAL.has(status) && eta && new Date(`${eta}T00:00`).getTime() + Math.max(delayDays, 0) * 86400000 < new Date().setHours(0, 0, 0, 0);

  const changeStatus = (value) => {
    setStatus(value);
    if (ARRIVAL.has(value) && !ata) setAta(toInputDate(new Date()));
  };

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    await onUpdateStatus(shipment.id, {
      status,
      delayDays,
      eta: fromInputDate(eta),
      ata: showAta ? fromInputDate(ata) || null : null,
      ...(addMilestone && {
        addMilestone: { date: today(), type: 'ACTUAL', location, event: event.trim() || status },
      }),
    });
    setSaving(false);
    onClose();
  };

  return (
    <Sheet
      title="Update status"
      subtitle={`${shipment.containerNumber} · ${shipment.carrier}`}
      onClose={onClose}
      footer={
        <button
          form="status-form"
          type="submit"
          disabled={saving}
          className="w-full rounded-2xl bg-brand-600 py-3.5 text-sm font-bold text-white disabled:opacity-60"
        >
          {saving ? 'Saving…' : googleSheetsConnected ? 'Save & sync to Sheets' : 'Save update'}
        </button>
      }
    >
      <form id="status-form" onSubmit={submit} className="space-y-4">
        <Field label="Status">
          <div className="flex flex-wrap gap-2">
            {STATUSES.map((s) => (
              <button
                type="button"
                key={s}
                onClick={() => changeStatus(s)}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                  status === s ? 'bg-brand-600 text-white' : 'bg-sand-100 text-slate-600 hover:bg-sand-200'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </Field>

        <Field label="Delay" hint={delayLabel(delayDays)}>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setDelayDays((d) => d - 1)}
              aria-label="Decrease delay"
              className="grid h-11 w-11 place-items-center rounded-xl bg-sand-100 text-slate-700"
            >
              <Minus className="h-4 w-4" />
            </button>
            <input
              type="number"
              inputMode="numeric"
              value={delayDays}
              onChange={(e) => setDelayDays(Number(e.target.value) || 0)}
              className={`${inputCls} text-center tabular-nums`}
              aria-label="Delay in days"
            />
            <button
              type="button"
              onClick={() => setDelayDays((d) => d + 1)}
              aria-label="Increase delay"
              className="grid h-11 w-11 place-items-center rounded-xl bg-sand-100 text-slate-700"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
        </Field>

        <div className={`grid gap-3 ${showAta ? 'grid-cols-2' : 'grid-cols-1'}`}>
          <Field label="ETA" hint={etaPassed ? 'This date has passed, so the shipment will be marked arrived. Set the new ETA if it is still at sea.' : null}>
            <input type="date" value={eta} onChange={(e) => setEta(e.target.value)} className={`${inputCls} ${etaPassed ? 'border-amber-400' : ''}`} />
          </Field>
          {showAta && (
            <Field label="Arrived on (ATA)">
              <input type="date" value={ata} onChange={(e) => setAta(e.target.value)} className={inputCls} />
            </Field>
          )}
        </div>

        <div className="rounded-2xl bg-sand-50 p-3.5 ring-1 ring-sand-200">
          <label className="flex items-center gap-2.5">
            <input
              type="checkbox"
              checked={addMilestone}
              onChange={(e) => setAddMilestone(e.target.checked)}
              className="h-4 w-4 rounded accent-brand-600"
            />
            <span className="text-sm font-semibold text-slate-800">Add to milestone history</span>
          </label>
          {addMilestone && (
            <div className="mt-3 space-y-3">
              <Field label="Event">
                <input value={event} onChange={(e) => setEvent(e.target.value)} placeholder={status} className={inputCls} />
              </Field>
              <Field label="Location">
                <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. Karachi, Pakistan" className={inputCls} />
              </Field>
            </div>
          )}
        </div>
      </form>
    </Sheet>
  );
}
