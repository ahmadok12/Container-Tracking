import React, { Suspense, lazy, useState } from 'react';
import { ArrowLeft, Edit3, Share2, Trash2, Box, Clock, Ship, FileText, Package, Building2, Copy, Check } from 'lucide-react';
import { StatusPill, VoyageBar } from './ui';
import { voyageProgress, daysToEta, isArrived, delayLabel, sortMilestones, parseDate } from '../utils/shipments';

const ShipmentMap = lazy(() => import('./ShipmentMap'));

function MapFallback() {
  return <div className="grid h-full w-full place-items-center bg-[#e8eef2] text-xs font-medium text-slate-400">Loading map…</div>;
}

function Card({ title, action, children, className = '' }) {
  return (
    <section className={`rounded-2xl bg-white p-4 ring-1 ring-sand-200 ${className}`}>
      {title && (
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{title}</h3>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

function Summary({ shipment }) {
  const progress = voyageProgress(shipment);
  const d = daysToEta(shipment);
  const arrived = isArrived(shipment);
  const { pol = {}, pod = {} } = shipment;
  return (
    <Card>
      <div className="flex items-center justify-between gap-2">
        <StatusPill shipment={shipment} />
        <span className="text-xs font-semibold text-slate-500">{shipment.status}</span>
      </div>

      <div className="mt-4 grid grid-cols-[1fr_auto_1fr] items-start gap-2">
        <div className="min-w-0">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Loading</div>
          <div className="truncate text-lg font-extrabold text-slate-900">{pol.name}</div>
          <div className="text-xs font-medium text-slate-500">
            {pol.flag} {pol.code}
          </div>
        </div>
        <div className="mt-4 rounded-full bg-sand-100 px-2.5 py-1 text-[11px] font-bold text-slate-600">
          {shipment.transitDays ? `${shipment.transitDays}d` : '—'}
        </div>
        <div className="min-w-0 text-right">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Discharge</div>
          <div className="truncate text-lg font-extrabold text-slate-900">{pod.name}</div>
          <div className="text-xs font-medium text-slate-500">
            {pod.code} {pod.flag}
          </div>
        </div>
      </div>

      <div className="mt-4">
        <VoyageBar progress={progress} shipment={shipment} />
      </div>

      <dl className="mt-4 grid grid-cols-3 gap-2 text-center">
        <div className="rounded-xl bg-sand-50 px-2 py-2.5">
          <dt className="text-[10px] font-semibold uppercase text-slate-400">Departed</dt>
          <dd className="mt-0.5 text-xs font-bold text-slate-800">{shipment.timeline?.departureActual || pol.date || '—'}</dd>
        </div>
        <div className="rounded-xl bg-sand-50 px-2 py-2.5">
          <dt className="text-[10px] font-semibold uppercase text-slate-400">{arrived ? 'Arrived' : 'ETA'}</dt>
          <dd className="mt-0.5 text-xs font-bold text-slate-800">
            {arrived ? shipment.timeline?.ata || shipment.timeline?.eta : shipment.timeline?.eta || '—'}
          </dd>
        </div>
        <div className="rounded-xl bg-sand-50 px-2 py-2.5">
          <dt className="text-[10px] font-semibold uppercase text-slate-400">{arrived ? 'Delay' : 'Days left'}</dt>
          <dd className={`mt-0.5 text-xs font-bold ${Number(shipment.delayDays) > 0 ? 'text-red-600' : !arrived && d < 0 ? 'text-amber-600' : 'text-slate-800'}`}>
            {arrived ? delayLabel(shipment.delayDays) : d === null ? '—' : d < 0 ? `Overdue ${-d}d` : d}
          </dd>
        </div>
      </dl>
    </Card>
  );
}

function CopyValue({ value }) {
  const [copied, setCopied] = useState(false);
  if (!value) return <span className="text-slate-400">—</span>;
  return (
    <button
      onClick={() => {
        navigator.clipboard?.writeText(value);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
      className="inline-flex max-w-full items-center gap-1 font-mono text-[13px] font-semibold text-slate-800"
      title="Copy"
    >
      <span className="truncate">{value}</span>
      {copied ? <Check className="h-3 w-3 shrink-0 text-brand-600" /> : <Copy className="h-3 w-3 shrink-0 text-slate-300" />}
    </button>
  );
}

function Details({ shipment }) {
  const rows = [
    { icon: FileText, label: 'B/L number', value: <CopyValue value={shipment.blNumber} /> },
    { icon: Ship, label: 'Vessel / voyage', value: [shipment.vesselName, shipment.voyage].filter(Boolean).join(' · ') || '—' },
    { icon: Building2, label: 'Carrier', value: shipment.carrier || '—' },
    { icon: Box, label: 'Containers', value: shipment.details?.containersCount ?? 1 },
    shipment.supplier && { icon: Building2, label: 'Supplier', value: shipment.supplier },
    shipment.goods && { icon: Package, label: 'Goods', value: shipment.goods },
  ].filter(Boolean);
  return (
    <Card title="Shipment details">
      <dl className="divide-y divide-sand-100">
        {rows.map(({ icon: Icon, label, value }) => (
          <div key={label} className="flex items-center justify-between gap-4 py-2.5 first:pt-0 last:pb-0">
            <dt className="flex shrink-0 items-center gap-2 text-xs font-medium text-slate-500">
              <Icon className="h-3.5 w-3.5 text-slate-400" />
              {label}
            </dt>
            <dd className="min-w-0 truncate text-right text-[13px] font-semibold text-slate-800">{value}</dd>
          </div>
        ))}
      </dl>
    </Card>
  );
}

function Milestones({ milestones, onAdd }) {
  const list = sortMilestones(milestones);
  const now = Date.now();
  return (
    <Card
      title="Milestones"
      action={
        <button onClick={onAdd} className="text-xs font-bold text-brand-700">
          + Add event
        </button>
      }
    >
      {list.length === 0 ? (
        <p className="py-4 text-center text-xs text-slate-400">No events recorded yet.</p>
      ) : (
        <ol className="relative">
          {list.map((m, i) => {
            const done = m.type === 'ACTUAL' || (parseDate(m.date)?.getTime() ?? Infinity) < now;
            const actual = m.type === 'ACTUAL';
            return (
              <li key={m.id || i} className="relative flex gap-3 pb-4 last:pb-0">
                {i < list.length - 1 && (
                  <span className={`absolute left-[7px] top-4 h-full w-0.5 ${done ? 'bg-brand-200' : 'bg-sand-200'}`} />
                )}
                <span
                  className={`relative mt-0.5 h-4 w-4 shrink-0 rounded-full border-2 ${
                    actual ? 'border-brand-600 bg-brand-600' : 'border-slate-300 bg-white'
                  }`}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className={`text-sm font-semibold ${actual ? 'text-slate-900' : 'text-slate-500'}`}>{m.event}</span>
                    <span className="shrink-0 text-[11px] font-medium text-slate-400">{m.date}</span>
                  </div>
                  <div className="mt-0.5 truncate text-xs text-slate-500">
                    {m.countryFlag} {m.location}
                    {!actual && <span className="ml-1.5 rounded bg-sand-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-500">Planned</span>}
                  </div>
                  {m.vesselInfo && <div className="mt-0.5 truncate text-[11px] text-slate-400">{m.vesselInfo}</div>}
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </Card>
  );
}

export default function TrackingDetailScreen({ shipment, onBack, onOpenStatusModal, onDelete }) {
  if (!shipment) return null;
  const livePos = shipment.currentPosition?.source === 'live';

  const share = async () => {
    const text = `${shipment.containerNumber} · ${shipment.pol?.name} → ${shipment.pod?.name}\nStatus: ${shipment.status} (${delayLabel(
      shipment.delayDays
    )})\nETA: ${shipment.timeline?.eta || '—'}`;
    try {
      if (navigator.share) await navigator.share({ title: `Shipment ${shipment.containerNumber}`, text });
      else await navigator.clipboard.writeText(text);
    } catch {
      /* user cancelled */
    }
  };

  return (
    <div className="flex min-h-dvh flex-col pb-28">
      <header className="sticky top-0 z-30 flex items-center gap-2 border-b border-sand-200 bg-sand-50/90 px-3 py-2.5 backdrop-blur-md">
        <button onClick={onBack} aria-label="Back" className="grid h-10 w-10 place-items-center rounded-full text-slate-700 hover:bg-white">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="min-w-0 flex-1">
          <div className="truncate font-mono text-[15px] font-bold text-slate-900">{shipment.containerNumber}</div>
          <div className="truncate text-[11px] text-slate-500">{shipment.carrier}</div>
        </div>
        <button onClick={share} aria-label="Share" className="grid h-10 w-10 place-items-center rounded-full text-slate-600 hover:bg-white">
          <Share2 className="h-4.5 w-4.5" />
        </button>
        <button
          onClick={() => onDelete(shipment)}
          aria-label="Remove shipment"
          className="grid h-10 w-10 place-items-center rounded-full text-slate-400 hover:bg-white hover:text-red-600"
        >
          <Trash2 className="h-4.5 w-4.5" />
        </button>
      </header>

      <main className="space-y-3 p-3.5">
        {shipment.autoClosed && (
          <div className="rounded-2xl bg-amber-50 p-3.5 text-xs text-amber-900 ring-1 ring-amber-200">
            <span className="font-bold">Marked arrived automatically</span> because its ETA passed. Still at sea?{' '}
            <button onClick={() => onOpenStatusModal(shipment)} className="font-bold underline">
              Update the status and set a new ETA
            </button>
            .
          </div>
        )}
        <Summary shipment={shipment} />

        <section className="relative isolate h-64 overflow-hidden rounded-2xl ring-1 ring-sand-200">
          <Suspense fallback={<MapFallback />}>
            <ShipmentMap shipment={shipment} />
          </Suspense>
          {!isArrived(shipment) && (
            <div className="pointer-events-none absolute left-3 top-3 z-[400] flex items-center gap-1.5 rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-semibold text-slate-600 shadow-sm">
              <span className={`h-1.5 w-1.5 rounded-full ${livePos ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
              {livePos ? 'Live vessel position' : 'Estimated position'}
            </div>
          )}
        </section>

        <Details shipment={shipment} />
        <Milestones milestones={shipment.milestones} onAdd={() => onOpenStatusModal(shipment)} />

        {shipment.lastSyncedAt && (
          <p className="flex items-center justify-center gap-1 pt-1 text-[11px] text-slate-400">
            <Clock className="h-3 w-3" />
            Updated {new Date(shipment.lastSyncedAt).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })}
          </p>
        )}
      </main>

      <div className="fixed inset-x-0 bottom-0 z-30 mx-auto max-w-md border-t border-sand-200 bg-white/95 px-4 pt-3 backdrop-blur-md pb-safe">
        <button
          onClick={() => onOpenStatusModal(shipment)}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-brand-600 py-3.5 text-sm font-bold text-white shadow-lg shadow-brand-600/25 active:scale-[0.99]"
        >
          <Edit3 className="h-4 w-4" />
          Update status
        </button>
      </div>
    </div>
  );
}
