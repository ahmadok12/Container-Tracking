import React from 'react';
import { Headphones, Video, MessageCircle } from 'lucide-react';

export default function RightDock() {
  return (
    <aside className="w-14 flex flex-col items-center justify-between py-5 border-l border-[#ece8df]/60 select-none">
      <div className="flex flex-col items-center gap-3">
        {/* Workspace Avatars / Badges */}
        <button
          title="Container Tracking (CT)"
          className="w-8 h-8 rounded-full bg-[#0284c7] text-white flex items-center justify-center font-bold text-xs shadow-xs hover:scale-105 transition-transform"
        >
          CT
        </button>

        <button
          title="Railways (RW)"
          className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shadow-xs hover:scale-105 transition-transform"
        >
          RW
        </button>

        <button
          title="Trucking Logistics (TL)"
          className="w-8 h-8 rounded-full bg-amber-400 text-slate-900 flex items-center justify-center font-bold text-xs shadow-xs hover:scale-105 transition-transform"
        >
          TL
        </button>

        <button
          title="Warehousing & Storage (WS)"
          className="w-8 h-8 rounded-full bg-red-700 text-white flex items-center justify-center font-bold text-xs shadow-xs hover:scale-105 transition-transform"
        >
          WS
        </button>

        <div className="w-6 h-[1px] bg-slate-200 my-2"></div>

        {/* Support & Media icons */}
        <button
          title="Audio Guides & Support"
          className="w-8 h-8 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition-colors"
        >
          <Headphones className="w-4 h-4" />
        </button>

        <button
          title="Tutorial Videos"
          className="w-8 h-8 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition-colors"
        >
          <Video className="w-4 h-4" />
        </button>
      </div>

      {/* Floating Chat Widget Circle */}
      <div className="fixed bottom-6 right-6 z-50">
        <button
          title="Tracktainer Support Chat"
          className="w-12 h-12 rounded-full bg-[#0284c7] hover:bg-[#0369a1] text-white flex items-center justify-center shadow-lg hover:shadow-xl transition-all cursor-pointer group"
          onClick={() => alert('Tracktainer Live Assistant: How can we help you with your shipments today?')}
        >
          <MessageCircle className="w-6 h-6 group-hover:scale-110 transition-transform fill-current" />
        </button>
      </div>
    </aside>
  );
}
