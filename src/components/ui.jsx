import React from 'react';
import { X } from 'lucide-react';
import { STATUS_STYLES, statusGroup, delayLabel, isArrived } from '../utils/shipments';

export function BrandMark({ size = 32 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
      <rect width="64" height="64" rx="16" fill="var(--color-brand-600)" />
      <path
        d="M14 40c5 6 15 6 18-1V18M38 38c2 4 6 5 9 5 5 0 8-3 8-7 0-9-16-6-16-14 0-4 3-6 7-6 3 0 6 1 8 4"
        fill="none"
        stroke="#fff"
        strokeWidth="5.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function Brand({ subtitle = 'Import Shipments' }) {
  return (
    <div className="flex items-center gap-2.5">
      <BrandMark size={34} />
      <div className="leading-none">
        <div className="text-[17px] font-extrabold tracking-tight text-slate-900">
          JS <span className="text-brand-600">Traders</span>
        </div>
        <div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400 mt-1">{subtitle}</div>
      </div>
    </div>
  );
}

export function StatusPill({ shipment, className = '' }) {
  const group = statusGroup(shipment);
  const style = STATUS_STYLES[group];
  const text = group === 'arrived' ? shipment.status || 'Arrived' : delayLabel(shipment.delayDays);
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ring-inset whitespace-nowrap ${style.pill} ${className}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
      {text}
    </span>
  );
}

export function VoyageBar({ progress, shipment }) {
  const delayed = statusGroup(shipment) === 'delayed';
  const done = isArrived(shipment);
  const pct = Math.round(progress * 100);
  return (
    <div className="relative h-1.5 rounded-full bg-sand-200" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
      <div
        className={`absolute inset-y-0 left-0 rounded-full ${done ? 'bg-slate-400' : delayed ? 'bg-red-500' : 'bg-brand-500'}`}
        style={{ width: `${Math.max(pct, 3)}%` }}
      />
      {!done && (
        <div
          className={`absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow ${delayed ? 'bg-red-500' : 'bg-brand-600'}`}
          style={{ left: `${Math.max(pct, 3)}%` }}
        />
      )}
    </div>
  );
}

export function IconButton({ label, onClick, children, badge }) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      title={label}
      className="relative grid h-10 w-10 place-items-center rounded-full bg-white text-slate-600 ring-1 ring-sand-200 transition hover:text-brand-700 active:scale-95"
    >
      {children}
      {badge && <span className={`absolute right-1.5 top-1.5 h-2 w-2 rounded-full ring-2 ring-white ${badge}`} />}
    </button>
  );
}

// Bottom sheet on mobile, centred dialog on larger screens
export function Sheet({ title, subtitle, onClose, children, footer }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-slate-900/45 backdrop-blur-[2px] animate-fade" onClick={onClose} />
      <div className="relative flex max-h-[92dvh] w-full max-w-md flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl animate-sheet sm:rounded-3xl">
        <div className="mx-auto mt-2.5 h-1 w-10 rounded-full bg-slate-200 sm:hidden" />
        <div className="flex items-start justify-between gap-3 px-5 pb-3 pt-3">
          <div className="min-w-0">
            <h2 className="text-base font-bold text-slate-900">{title}</h2>
            {subtitle && <p className="mt-0.5 truncate text-xs text-slate-500">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="-mr-1 grid h-9 w-9 shrink-0 place-items-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            <X className="h-4.5 w-4.5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 pb-4">{children}</div>
        {footer && <div className="border-t border-sand-200 bg-white px-5 pt-3 pb-safe">{footer}</div>}
      </div>
    </div>
  );
}

export const inputCls =
  'w-full rounded-xl border border-sand-300 bg-white px-3 py-2.5 text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100';

export function Field({ label, hint, children }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold text-slate-600">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-[11px] text-slate-400">{hint}</span>}
    </label>
  );
}
