import React, { useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { Sheet, Field, inputCls } from './ui';
import { CARRIERS, PORTS, buildShipment, toInputDate } from '../utils/shipments';

const ORIGINS = PORTS.filter((p) => p.country === 'China');
const DESTINATIONS = PORTS.filter((p) => p.country !== 'China');
// ISO 6346: 4 letters + 7 digits
const CONTAINER_RE = /^[A-Z]{4}\d{7}$/;

export default function TrackShipmentModal({ onClose, onTrackShipment, existingNumbers = [] }) {
  const [form, setForm] = useState(() => ({
    containerNumber: '',
    blNumber: '',
    carrier: 'KMTC',
    polCode: 'CNTAO',
    podCode: 'PKKHI',
    etd: toInputDate(new Date()),
    eta: toInputDate(new Date(Date.now() + 25 * 86400000)),
    vesselName: '',
    voyage: '',
    containersCount: 1,
    supplier: '',
    goods: '',
  }));
  const [showMore, setShowMore] = useState(false);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const number = form.containerNumber.trim().toUpperCase();
  const formatOk = CONTAINER_RE.test(number);
  const duplicate = existingNumbers.includes(number);
  const datesOk = !form.etd || !form.eta || form.eta >= form.etd;
  const canSave = number.length >= 4 && !duplicate && datesOk;

  const submit = (e) => {
    e.preventDefault();
    if (!canSave) return;
    onTrackShipment(buildShipment(form));
    onClose();
  };

  return (
    <Sheet
      title="Add shipment"
      subtitle="Track a new import container"
      onClose={onClose}
      footer={
        <button
          form="track-form"
          type="submit"
          disabled={!canSave}
          className="w-full rounded-2xl bg-brand-600 py-3.5 text-sm font-bold text-white disabled:opacity-50"
        >
          Start tracking
        </button>
      }
    >
      <form id="track-form" onSubmit={submit} className="space-y-4">
        <Field
          label="Container number"
          hint={
            duplicate
              ? 'This container is already being tracked.'
              : number && !formatOk
                ? 'Usually 4 letters + 7 digits, e.g. TXGU6848701'
                : null
          }
        >
          <input
            required
            autoFocus
            value={form.containerNumber}
            onChange={(e) => setForm((f) => ({ ...f, containerNumber: e.target.value.toUpperCase().replace(/\s/g, '') }))}
            placeholder="TXGU6848701"
            maxLength={15}
            autoCapitalize="characters"
            className={`${inputCls} font-mono uppercase tracking-wider ${duplicate ? 'border-red-300' : ''}`}
          />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Shipping line">
            <select value={form.carrier} onChange={set('carrier')} className={inputCls}>
              {CARRIERS.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="B/L number">
            <input value={form.blNumber} onChange={set('blNumber')} placeholder="Optional" className={`${inputCls} uppercase`} />
          </Field>
        </div>

        <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-2">
          <Field label="From">
            <select value={form.polCode} onChange={set('polCode')} className={inputCls}>
              {ORIGINS.map((p) => (
                <option key={p.code} value={p.code}>
                  {p.name}
                </option>
              ))}
            </select>
          </Field>
          <ArrowRight className="mb-3 h-4 w-4 text-slate-400" />
          <Field label="To">
            <select value={form.podCode} onChange={set('podCode')} className={inputCls}>
              {DESTINATIONS.map((p) => (
                <option key={p.code} value={p.code}>
                  {p.name}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Departure (ETD)">
            <input type="date" value={form.etd} onChange={set('etd')} className={inputCls} />
          </Field>
          <Field label="Arrival (ETA)" hint={!datesOk ? 'ETA must be after ETD' : null}>
            <input type="date" value={form.eta} min={form.etd} onChange={set('eta')} className={inputCls} />
          </Field>
        </div>

        <button type="button" onClick={() => setShowMore((v) => !v)} className="text-xs font-bold text-brand-700">
          {showMore ? '− Fewer details' : '+ Vessel, supplier & goods'}
        </button>

        {showMore && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Vessel">
                <input value={form.vesselName} onChange={set('vesselName')} placeholder="KMTC CHENNAI" className={`${inputCls} uppercase`} />
              </Field>
              <Field label="Voyage">
                <input value={form.voyage} onChange={set('voyage')} placeholder="2605W" className={`${inputCls} uppercase`} />
              </Field>
            </div>
            <div className="grid grid-cols-[2fr_1fr] gap-3">
              <Field label="Supplier">
                <input value={form.supplier} onChange={set('supplier')} placeholder="Supplier name" className={inputCls} />
              </Field>
              <Field label="Containers">
                <input type="number" min={1} inputMode="numeric" value={form.containersCount} onChange={set('containersCount')} className={inputCls} />
              </Field>
            </div>
            <Field label="Goods">
              <input value={form.goods} onChange={set('goods')} placeholder="e.g. Feeding pans, drinker lines" className={inputCls} />
            </Field>
          </div>
        )}
      </form>
    </Sheet>
  );
}
