import React from 'react';
import {
  LayoutGrid,
  Ship,
  Box,
  Code2,
  Settings,
  ChevronDown,
  ArrowLeft,
  Plus,
  FileSpreadsheet,
  MapPin,
  ExternalLink
} from 'lucide-react';

export default function Sidebar({
  activeView,
  setActiveView,
  onOpenTrackModal,
  onOpenIntegrations,
  onOpenGoogleSheets,
  shipmentsCount = 1,
  googleSheetsConnected = false,
  tracktainerLinked = false
}) {
  return (
    <aside className="w-64 min-w-[256px] bg-transparent flex flex-col justify-between p-4 select-none">
      <div>
        {/* Top Header: Logo + Collapse Button */}
        <div className="flex items-center justify-between mb-5 px-1">
          <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => setActiveView('dashboard')}>
            {/* Tracktainer Dual Pill Icon */}
            <div className="flex items-center gap-1">
              <div className="w-2.5 h-6 rounded-full bg-[#0284c7]"></div>
              <div className="w-2.5 h-6 rounded-full bg-[#38bdf8]"></div>
            </div>
            <div className="text-xl font-bold tracking-tight">
              <span className="text-slate-900">Track</span>
              <span className="text-[#0284c7]">tainer</span>
            </div>
          </div>

          <button
            title="Collapse Sidebar"
            className="w-7 h-7 rounded-full bg-amber-100/70 hover:bg-amber-200/80 text-amber-700 flex items-center justify-center transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Container Tracking Module Dropdown Card */}
        <div className="bg-white rounded-xl p-3 border border-[#ece8df] shadow-xs mb-6 cursor-pointer hover:border-slate-300 transition-colors">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-[#0284c7] text-white flex items-center justify-center font-bold text-xs shadow-xs">
                CT
              </div>
              <div>
                <div className="text-xs font-bold text-slate-800 leading-tight">
                  Container Tracking
                </div>
                <div className="text-[11px] text-slate-400">
                  Track your shipments
                </div>
              </div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </div>
        </div>

        {/* Navigation Section */}
        <nav className="space-y-4">
          {/* Overview */}
          <div>
            <button
              onClick={() => setActiveView('overview')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
                activeView === 'overview'
                  ? 'bg-white text-[#0284c7] shadow-xs border border-[#ece8df]'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
            >
              <LayoutGrid className="w-4 h-4 text-slate-500" />
              <span>Overview</span>
            </button>
          </div>

          {/* Shipments Category */}
          <div>
            <div className="flex items-center gap-3 px-3 py-1.5 text-sm font-bold text-slate-800">
              <Ship className="w-4 h-4 text-slate-700" />
              <span>Shipments</span>
            </div>

            <div className="mt-1 pl-4 space-y-1">
              <button
                onClick={onOpenTrackModal}
                className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:text-[#0284c7] hover:bg-slate-200/50 transition-colors group"
              >
                <Plus className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#0284c7]" />
                <span>Track Shipment</span>
              </button>

              <button
                onClick={() => setActiveView('dashboard')}
                className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  activeView === 'dashboard'
                    ? 'text-[#0284c7] bg-white shadow-xs border border-[#ece8df]'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                  <span>All Shipments</span>
                </div>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-500 font-mono">
                  {shipmentsCount}
                </span>
              </button>
            </div>
          </div>

          {/* Containers Category */}
          <div>
            <div className="flex items-center gap-3 px-3 py-1.5 text-sm font-bold text-slate-800">
              <Box className="w-4 h-4 text-slate-700" />
              <span>Containers</span>
            </div>

            <div className="mt-1 pl-4 space-y-1">
              <button
                onClick={() => setActiveView('containers')}
                className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  activeView === 'containers'
                    ? 'text-[#0284c7] bg-white shadow-xs border border-[#ece8df]'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                <span>All Containers</span>
              </button>
            </div>
          </div>

          {/* Integrations Category */}
          <div>
            <div className="flex items-center gap-3 px-3 py-1.5 text-sm font-bold text-slate-800">
              <Code2 className="w-4 h-4 text-slate-700" />
              <span>Integrations</span>
            </div>

            <div className="mt-1 pl-4 space-y-1">
              {/* Tracktainer API Keys */}
              <button
                onClick={onOpenIntegrations}
                className="w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:text-[#0284c7] hover:bg-slate-200/50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span className={`w-1.5 h-1.5 rounded-full ${tracktainerLinked ? 'bg-emerald-500' : 'bg-slate-400'}`}></span>
                  <span>API Keys</span>
                </div>
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-500 text-white uppercase tracking-wider">
                  NEW
                </span>
              </button>

              {/* Google Sheets Sync */}
              <button
                onClick={onOpenGoogleSheets}
                className="w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:text-[#0284c7] hover:bg-slate-200/50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Google Sheets</span>
                </div>
                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider ${
                  googleSheetsConnected ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'
                }`}>
                  {googleSheetsConnected ? 'LIVE' : 'SYNC'}
                </span>
              </button>

              {/* Embed Map */}
              <button
                onClick={() => alert('Embed Map iframe snippet copied to clipboard!')}
                className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-200/50 transition-colors"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                <span>Embed Map</span>
              </button>
            </div>
          </div>

          {/* Settings */}
          <div>
            <button
              onClick={onOpenIntegrations}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-200/50 transition-colors"
            >
              <Settings className="w-4 h-4 text-slate-500" />
              <span>Settings</span>
            </button>
          </div>
        </nav>
      </div>

      {/* Footer Info */}
      <div className="pt-6 border-t border-slate-200/60 text-[11px] text-slate-400 space-y-2">
        <div className="font-medium text-slate-500">
          Copyright 2026 © Tracktainer
        </div>
        <div className="flex flex-wrap gap-x-2 gap-y-1 text-[10px]">
          <a href="#" className="hover:underline">Help Center</a>
          <span>•</span>
          <a href="#" className="hover:underline">Tutorials</a>
          <span>•</span>
          <a href="#" className="hover:underline">About</a>
          <span>•</span>
          <a href="#" className="hover:underline">Privacy</a>
        </div>
      </div>
    </aside>
  );
}
