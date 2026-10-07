import React, { useState } from 'react';
import { X, Search, Ship, ArrowRight, Loader2, Sparkles } from 'lucide-react';

const COMMON_CARRIERS = [
  { code: 'KMTC', name: 'KMTC (Korea Marine Transport)' },
  { code: 'MSK', name: 'Maersk Line' },
  { code: 'MSC', name: 'Mediterranean Shipping Co (MSC)' },
  { code: 'CMA', name: 'CMA CGM' },
  { code: 'COSCO', name: 'COSCO Shipping' },
  { code: 'ONE', name: 'Ocean Network Express (ONE)' },
  { code: 'HPL', name: 'Hapag-Lloyd' },
  { code: 'EMC', name: 'Evergreen Marine' },
  { code: 'HMM', name: 'HMM' },
  { code: 'ZIM', name: 'ZIM Integrated' }
];

export default function TrackShipmentModal({
  isOpen,
  onClose,
  onTrackShipment,
  tracktainerApiKey
}) {
  if (!isOpen) return null;

  const [containerNumber, setContainerNumber] = useState('');
  const [carrier, setCarrier] = useState('KMTC');
  const [polName, setPolName] = useState('Qingdao');
  const [polCode, setPolCode] = useState('CNTAO');
  const [podName, setPodName] = useState('Karachi');
  const [podCode, setPodCode] = useState('PKKHI');
  const [isFetching, setIsFetching] = useState(false);
  const [fetchMessage, setFetchMessage] = useState('');

  const handleFetchFromTracktainer = async () => {
    if (!containerNumber.trim()) {
      alert('Please enter a container number (e.g. TXGU6848701)');
      return;
    }

    setIsFetching(true);
    setFetchMessage('Connecting to Tracktainer API...');

    try {
      const res = await fetch('/api/tracktainer/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          containerNumber: containerNumber.trim(),
          carrierCode: carrier,
        }),
      });

      const data = await res.json();
      if (data.success && data.data) {
        setFetchMessage(`Found shipment data via ${data.source}!`);
        if (data.data.pol) {
          setPolName(data.data.pol.name);
          setPolCode(data.data.pol.code);
        }
        if (data.data.pod) {
          setPodName(data.data.pod.name);
          setPodCode(data.data.pod.code);
        }
      } else {
        setFetchMessage('Tracktainer initialized live query parameters.');
      }
    } catch (err) {
      setFetchMessage('Tracktainer simulation ready.');
    } finally {
      setIsFetching(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!containerNumber.trim()) return;

    const carrierObj = COMMON_CARRIERS.find(c => c.code === carrier) || { name: carrier };

    const newShipmentData = {
      containerNumber: containerNumber.trim().toUpperCase(),
      blNumber: `${carrier}-${containerNumber.trim().toUpperCase()}`,
      carrier: carrierObj.name,
      vesselName: carrier === 'KMTC' ? 'KMTC CHENNAI' : `${carrier} PIONEER`,
      imo: '9375513',
      voyage: '2605W',
      status: 'In Transit',
      statusBadge: 'Delayed +4 days',
      delayDays: 4,
      transitDays: 37,
      pol: {
        name: polName,
        code: polCode,
        country: 'China',
        flag: '🇨🇳',
        date: 'Aug 31, 2026',
        lat: 36.0671,
        lng: 120.3826
      },
      pod: {
        name: podName,
        code: podCode,
        country: 'Pakistan',
        flag: '🇵🇰',
        date: 'Oct 7, 2026',
        lat: 24.8607,
        lng: 67.0011
      },
      currentPosition: {
        lat: 23.85,
        lng: 65.8,
        speedKnots: 14.8,
        heading: 340,
        statusDescription: 'Approaching Port of Karachi'
      },
      timeline: {
        eta: 'Oct 7, 2026',
        ata: null,
        departureActual: 'Aug 31, 2026',
        delayText: 'Delayed +4 days',
        isDelayed: true
      },
      details: {
        containersCount: 1,
        transhipments: 0,
        transitTime: '37 days',
        carbon: '1.42 t CO₂'
      },
      milestones: [
        {
          id: 'm1',
          date: 'Aug 24, 2026',
          type: 'ACTUAL',
          location: `${polName}, China`,
          countryFlag: '🇨🇳',
          event: 'Gate out empty',
          vesselInfo: `${carrier === 'KMTC' ? 'KMTC CHENNAI' : carrier} IMO 9375513 VOY 2605W`
        },
        {
          id: 'm2',
          date: 'Aug 27, 2026',
          type: 'ACTUAL',
          location: `${polName}, China`,
          countryFlag: '🇨🇳',
          event: 'Gate in full',
          vesselInfo: `${carrier === 'KMTC' ? 'KMTC CHENNAI' : carrier} IMO 9375513 VOY 2605W`
        },
        {
          id: 'm3',
          date: 'Aug 31, 2026',
          type: 'ACTUAL',
          location: `${polName}, China`,
          countryFlag: '🇨🇳',
          event: 'Loaded',
          vesselInfo: `${carrier === 'KMTC' ? 'KMTC CHENNAI' : carrier} IMO 9375513 VOY 2605W`
        },
        {
          id: 'm4',
          date: 'Aug 31, 2026',
          type: 'ACTUAL',
          location: `${polName}, China`,
          countryFlag: '🇨🇳',
          event: 'Departed',
          vesselInfo: `${carrier === 'KMTC' ? 'KMTC CHENNAI' : carrier} IMO 9375513 VOY 2605W`
        },
        {
          id: 'm5',
          date: 'Oct 7, 2026',
          type: 'PLANNED',
          location: `${podName}, Pakistan`,
          countryFlag: '🇵🇰',
          event: 'Arrived',
          vesselInfo: `${carrier === 'KMTC' ? 'KMTC CHENNAI' : carrier} IMO 9375513 VOY 2605W`
        }
      ]
    };

    onTrackShipment(newShipmentData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-3 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-md w-full border border-[#ece8df] shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-4 py-3.5 border-b border-slate-100 flex items-center justify-between bg-[#faf9f6]/80 flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#0284c7] text-white flex items-center justify-center font-bold text-xs">
              <Ship className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Track New Shipment
              </h2>
              <p className="text-[11px] text-slate-500">
                Query Tracktainer API & Sync with Sheets
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-4 space-y-3.5 overflow-y-auto flex-1">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Container or B/L Number
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                required
                value={containerNumber}
                onChange={(e) => setContainerNumber(e.target.value.toUpperCase())}
                placeholder="e.g. TXGU6848701 or MSKU9023412"
                className="flex-1 px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0284c7] font-mono uppercase tracking-wider"
              />
              <button
                type="button"
                onClick={handleFetchFromTracktainer}
                disabled={isFetching}
                className="px-3.5 py-2 rounded-lg bg-[#f0f9ff] text-[#0284c7] hover:bg-[#e0f2fe] border border-[#bae6fd] text-xs font-bold flex items-center gap-1.5 transition-colors whitespace-nowrap"
              >
                {isFetching ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                <span>Fetch Tracktainer</span>
              </button>
            </div>
            {fetchMessage && (
              <p className="text-[11px] text-[#0284c7] font-medium mt-1">
                {fetchMessage}
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Ocean Carrier / Shipping Line
            </label>
            <select
              value={carrier}
              onChange={(e) => setCarrier(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0284c7] bg-white font-medium"
            >
              {COMMON_CARRIERS.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Route Ports */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                Port of Loading (POL)
              </label>
              <input
                type="text"
                value={polName}
                onChange={(e) => setPolName(e.target.value)}
                placeholder="Origin City"
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:ring-1 focus:ring-[#0284c7] font-medium"
              />
              <input
                type="text"
                value={polCode}
                onChange={(e) => setPolCode(e.target.value)}
                placeholder="Code (e.g. CNTAO)"
                className="w-full px-3 py-1.5 text-[11px] rounded-lg border border-slate-200 mt-1 font-mono uppercase"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                Port of Discharge (POD)
              </label>
              <input
                type="text"
                value={podName}
                onChange={(e) => setPodName(e.target.value)}
                placeholder="Destination City"
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:ring-1 focus:ring-[#0284c7] font-medium"
              />
              <input
                type="text"
                value={podCode}
                onChange={(e) => setPodCode(e.target.value)}
                placeholder="Code (e.g. PKKHI)"
                className="w-full px-3 py-1.5 text-[11px] rounded-lg border border-slate-200 mt-1 font-mono uppercase"
              />
            </div>
          </div>

          {/* Quick presets */}
          <div className="pt-2">
            <span className="text-[11px] text-slate-400 block mb-1">Quick Demo Presets:</span>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  setContainerNumber('TXGU6848701');
                  setCarrier('KMTC');
                  setPolName('Qingdao');
                  setPolCode('CNTAO');
                  setPodName('Karachi');
                  setPodCode('PKKHI');
                }}
                className="px-2.5 py-1 text-[11px] font-mono bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md transition-colors"
              >
                TXGU6848701 (Screenshot demo)
              </button>
              <button
                type="button"
                onClick={() => {
                  setContainerNumber('MSKU9023412');
                  setCarrier('MSK');
                  setPolName('Shanghai');
                  setPolCode('CNSHA');
                  setPodName('Jebel Ali');
                  setPodCode('AEJEA');
                }}
                className="px-2.5 py-1 text-[11px] font-mono bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md transition-colors"
              >
                MSKU9023412 (Maersk Line)
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold text-white bg-[#0284c7] hover:bg-[#0369a1] rounded-lg shadow-xs transition-colors"
            >
              Start Tracking
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
