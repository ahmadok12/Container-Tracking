import React, { useMemo, useState } from 'react';
import { Search, Plus, Settings, RefreshCw, Bell, Download, Ship, ChevronRight, X } from 'lucide-react';
import { Brand, StatusPill, VoyageBar, IconButton } from './ui';
import { statusGroup, voyageProgress, daysToEta } from '../utils/shipments';
import { getNotificationPermission, requestNotificationPermission } from '../utils/notifications';

const FILTERS = [
  { id: 'active', label: 'Active', match: (g) => g !== 'arrived' },
  { id: 'delayed', label: 'Delayed', match: (g) => g === 'delayed' },
  { id: 'arrived', label: 'Arrived', match: (g) => g === 'arrived' },
];

function etaText(s) {
  const d = daysToEta(s);
  if (statusGroup(s) === 'arrived') return s.timeline?.ata ? `Arrived ${s.timeline.ata}` : 'Arrived';
  if (d === null) return '';
  if (d > 1) return `${d} days to go`;
  if (d === 1) return 'Arrives tomorrow';
  if (d === 0) return 'Arrives today';
  return `Overdue ${Math.abs(d)}d`;
}

function ShipmentCard({ shipment, onOpen }) {
  const progress = voyageProgress(shipment);
  return (
    <button
      onClick={() => onOpen(shipment)}
      className="block w-full rounded-2xl bg-white p-4 text-left ring-1 ring-sand-200 transition hover:ring-brand-200 active:scale-[0.99]"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="font-mono text-[15px] font-bold tracking-wide text-slate-900">{shipment.containerNumber}</div>
          <div className="mt-0.5 truncate text-xs text-slate-500">
            {[shipment.carrier, shipment.goods || shipment.vesselName].filter(Boolean).join(' · ')}
          </div>
        </div>
        <StatusPill shipment={shipment} />
      </div>

      <div className="mt-4 flex items-end justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">From</div>
          <div className="truncate text-sm font-bold text-slate-800">
            <span className="mr-1">{shipment.pol?.flag}</span>
            {shipment.pol?.name}
          </div>
        </div>
        <div className="min-w-0 text-right">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">To</div>
          <div className="truncate text-sm font-bold text-slate-800">
            {shipment.pod?.name}
            <span className="ml-1">{shipment.pod?.flag}</span>
          </div>
        </div>
      </div>

      <div className="mt-2.5">
        <VoyageBar progress={progress} shipment={shipment} />
      </div>

      <div className="mt-2.5 flex items-center justify-between text-xs">
        <span className="text-slate-500">
          ETA <span className="font-semibold text-slate-800">{shipment.timeline?.eta || '—'}</span>
        </span>
        <span className={`flex items-center gap-0.5 font-semibold ${statusGroup(shipment) !== 'arrived' && daysToEta(shipment) < 0 ? 'text-amber-600' : 'text-brand-700'}`}>
          {etaText(shipment)}
          <ChevronRight className="h-3.5 w-3.5" />
        </span>
      </div>
    </button>
  );
}

export default function ShipmentsListScreen({
  shipments,
  onSelectShipment,
  onOpenTrackModal,
  onOpenSettings,
  googleSheetsConnected,
  isSyncing,
  onRefresh,
  hasInstallPrompt,
  onInstallApp,
}) {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('active');
  const [notif, setNotif] = useState(getNotificationPermission);

  const counts = useMemo(() => {
    const c = { active: 0, delayed: 0, arrived: 0 };
    shipments.forEach((s) => FILTERS.forEach((f) => f.match(statusGroup(s)) && (c[f.id] += 1)));
    return c;
  }, [shipments]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const f = FILTERS.find((x) => x.id === filter);
    return shipments.filter((s) => {
      // searching looks across every shipment, including arrived ones
      if (!q) return f.match(statusGroup(s));
      return [s.containerNumber, s.blNumber, s.carrier, s.vesselName, s.goods, s.supplier, s.pol?.name, s.pod?.name, s.status]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q));
    });
  }, [shipments, query, filter]);

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-sand-200 bg-sand-50/90 px-4 py-3 backdrop-blur-md">
        <Brand />
        <div className="flex items-center gap-2">
          {notif !== 'granted' && notif !== 'unsupported' && (
            <IconButton
              label="Turn on shipment alerts"
              onClick={async () => setNotif(await requestNotificationPermission())}
              badge="bg-amber-500"
            >
              <Bell className="h-4 w-4" />
            </IconButton>
          )}
          <IconButton label="Refresh" onClick={onRefresh}>
            <RefreshCw className={`h-4 w-4 ${isSyncing ? 'animate-spin text-brand-600' : ''}`} />
          </IconButton>
        </div>
      </header>

      <main className="flex-1 space-y-4 px-4 pb-28 pt-4">
        {hasInstallPrompt && (
          <div className="flex items-center justify-between gap-3 rounded-2xl bg-brand-700 p-3.5 text-white">
            <div className="flex items-center gap-3">
              <div className="grid h-9 w-9 place-items-center rounded-xl bg-white/15">
                <Download className="h-4 w-4" />
              </div>
              <div>
                <div className="text-sm font-bold">Install JS Traders</div>
                <div className="text-xs text-white/75">Add to your home screen</div>
              </div>
            </div>
            <button onClick={onInstallApp} className="rounded-lg bg-white px-3.5 py-2 text-xs font-bold text-brand-700 active:scale-95">
              Install
            </button>
          </div>
        )}

        {/* Summary */}
        <section className="grid grid-cols-3 gap-2.5">
          {[
            { id: 'active', label: 'Active', tone: 'text-brand-700' },
            { id: 'delayed', label: 'Delayed', tone: 'text-red-600' },
            { id: 'arrived', label: 'Arrived', tone: 'text-slate-700' },
          ].map((k) => (
            <button
              key={k.id}
              onClick={() => setFilter(filter === k.id ? 'active' : k.id)}
              className={`rounded-2xl bg-white px-3 py-3 text-left ring-1 transition ${
                filter === k.id ? 'ring-2 ring-brand-500' : 'ring-sand-200'
              }`}
            >
              <div className={`text-2xl font-extrabold tabular-nums ${k.tone}`}>{counts[k.id]}</div>
              <div className="text-[11px] font-semibold text-slate-500">{k.label}</div>
            </button>
          ))}
        </section>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Container, B/L, carrier, port, goods…"
            className="w-full rounded-2xl border border-sand-200 bg-white py-3 pl-10 pr-10 text-sm font-medium placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
          />
          {query && (
            <button onClick={() => setQuery('')} aria-label="Clear search" className="absolute right-2 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center text-slate-400">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="flex items-center justify-between px-1 text-xs">
          <span className="font-bold text-slate-700">
            {query ? `Search results · ${visible.length}` : filter === 'active' ? 'Active shipments' : filter === 'delayed' ? 'Delayed shipments' : 'Arrived (history)'}
          </span>
          {filter !== 'active' && !query && (
            <button onClick={() => setFilter('active')} className="font-bold text-brand-700">
              Back to active
            </button>
          )}
        </div>

        <section className="space-y-3">
          {visible.length === 0 ? (
            <div className="rounded-2xl bg-white px-6 py-10 text-center ring-1 ring-sand-200">
              <Ship className="mx-auto h-8 w-8 text-slate-300" />
              <p className="mt-2 text-sm font-semibold text-slate-700">
                {query ? 'No shipments match' : shipments.length ? (filter === 'arrived' ? 'Nothing has arrived yet' : 'No active shipments') : 'No shipments yet'}
              </p>
              <p className="mt-1 text-xs text-slate-400">
                {query ? 'Try a different search.' : shipments.length ? 'Tap + to add a new container.' : 'Add your first container to start tracking.'}
              </p>
              {!shipments.length && (
                <button onClick={onOpenTrackModal} className="mt-4 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-bold text-white">
                  Add shipment
                </button>
              )}
            </div>
          ) : (
            visible.map((s) => <ShipmentCard key={s.id || s.containerNumber} shipment={s} onOpen={onSelectShipment} />)
          )}
        </section>
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-30 mx-auto flex max-w-md items-center justify-around border-t border-sand-200 bg-white/95 px-6 pt-2 backdrop-blur-md pb-safe">
        <button className="flex w-20 flex-col items-center gap-0.5 text-[11px] font-bold text-brand-700" aria-current="page">
          <Ship className="h-5 w-5" />
          Shipments
        </button>
        <button
          onClick={onOpenTrackModal}
          aria-label="Add shipment"
          className="-mt-7 grid h-14 w-14 place-items-center rounded-full bg-brand-600 text-white shadow-lg shadow-brand-600/30 ring-4 ring-sand-50 active:scale-95"
        >
          <Plus className="h-6 w-6" />
        </button>
        <button onClick={onOpenSettings} className="relative flex w-20 flex-col items-center gap-0.5 text-[11px] font-semibold text-slate-500">
          <Settings className="h-5 w-5" />
          Settings
          {googleSheetsConnected && <span className="absolute right-6 top-0 h-2 w-2 rounded-full bg-emerald-500" />}
        </button>
      </nav>
    </div>
  );
}
