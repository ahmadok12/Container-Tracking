import React, { useState, useEffect } from 'react';
import {
  X,
  FileSpreadsheet,
  Key,
  CheckCircle2,
  AlertCircle,
  Copy,
  ExternalLink,
  RefreshCw,
  Upload,
  Download,
  Check,
  HelpCircle,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

export default function IntegrationsModal({
  isOpen,
  onClose,
  initialTab = 'sheets',
  settings,
  onSaveSettings,
  onTriggerSync,
  shipments
}) {
  if (!isOpen) return null;

  const [activeTab, setActiveTab] = useState(initialTab);
  const [googleSheetsUrl, setGoogleSheetsUrl] = useState(settings?.googleSheetsUrl || '');
  const [tracktainerApiKey, setTracktainerApiKey] = useState(settings?.tracktainerApiKey || '');
  const [tracktainerBaseUrl, setTracktainerBaseUrl] = useState(settings?.tracktainerBaseUrl || 'https://api.tracktainer.com/v1');
  
  const [isTestingSheets, setIsTestingSheets] = useState(false);
  const [sheetsStatus, setSheetsStatus] = useState(settings?.googleSheetsUrl ? 'configured' : 'idle');
  const [sheetsMessage, setSheetsMessage] = useState('');

  const [isTestingTracktainer, setIsTestingTracktainer] = useState(false);
  const [tracktainerStatus, setTracktainerStatus] = useState(settings?.tracktainerApiKey ? 'configured' : 'idle');
  const [tracktainerMessage, setTracktainerMessage] = useState('');

  const [copiedScript, setCopiedScript] = useState(false);
  const [scriptCode, setScriptCode] = useState('');
  const [showInstructions, setShowInstructions] = useState(true);

  useEffect(() => {
    fetch('/api/google-sheets/template-script')
      .then(res => res.json())
      .then(data => {
        if (data.success) setScriptCode(data.script);
      })
      .catch(() => {});
  }, []);

  const handleTestGoogleSheets = async () => {
    if (!googleSheetsUrl) {
      alert('Please enter a Google Apps Script Web App URL first.');
      return;
    }
    setIsTestingSheets(true);
    setSheetsMessage('');
    try {
      const res = await fetch('/api/google-sheets/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ webhookUrl: googleSheetsUrl }),
      });
      const data = await res.json();
      if (data.success) {
        setSheetsStatus('success');
        setSheetsMessage('✓ Google Sheet connected & live!');
        onSaveSettings({ googleSheetsUrl });
      } else {
        setSheetsStatus('error');
        setSheetsMessage(data.message || 'Connection failed.');
      }
    } catch (err) {
      setSheetsStatus('error');
      setSheetsMessage(err.message);
    } finally {
      setIsTestingSheets(false);
    }
  };

  const handleTestTracktainer = async () => {
    if (!tracktainerApiKey) {
      alert('Please enter your Tracktainer API Key.');
      return;
    }
    setIsTestingTracktainer(true);
    setTracktainerMessage('');
    try {
      const res = await fetch('/api/tracktainer/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: tracktainerApiKey, baseUrl: tracktainerBaseUrl }),
      });
      const data = await res.json();
      if (data.success) {
        setTracktainerStatus('success');
        setTracktainerMessage(data.message || 'Tracktainer API key verified.');
        onSaveSettings({ tracktainerApiKey, tracktainerBaseUrl });
      } else {
        setTracktainerStatus('error');
        setTracktainerMessage(data.message || 'Failed to authenticate.');
      }
    } catch (err) {
      setTracktainerStatus('error');
      setTracktainerMessage(err.message);
    } finally {
      setIsTestingTracktainer(false);
    }
  };

  const handleCopyScript = () => {
    if (scriptCode) {
      navigator.clipboard.writeText(scriptCode);
      setCopiedScript(true);
      setTimeout(() => setCopiedScript(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-3">
      <div className="bg-white rounded-2xl max-w-md w-full border border-[#ece8df] shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-4 py-3.5 border-b border-slate-100 flex items-center justify-between bg-[#faf9f6]">
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              Settings & Integrations
            </h2>
            <p className="text-[11px] text-slate-500">
              Google Sheets Database & Tracktainer API
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Mobile Tabs */}
        <div className="flex border-b border-slate-100 px-4 bg-slate-50/70">
          <button
            onClick={() => setActiveTab('sheets')}
            className={`py-2.5 px-3 text-xs font-bold flex items-center gap-1.5 border-b-2 transition-colors flex-1 justify-center ${
              activeTab === 'sheets'
                ? 'border-[#0284c7] text-[#0284c7]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>Google Sheets</span>
          </button>

          <button
            onClick={() => setActiveTab('tracktainer')}
            className={`py-2.5 px-3 text-xs font-bold flex items-center gap-1.5 border-b-2 transition-colors flex-1 justify-center ${
              activeTab === 'tracktainer'
                ? 'border-[#0284c7] text-[#0284c7]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Key className="w-3.5 h-3.5 text-[#0284c7]" />
            <span>Tracktainer API</span>
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="p-4 overflow-y-auto space-y-4 flex-1 text-xs">
          {activeTab === 'sheets' && (
            <div className="space-y-3.5">
              {/* Web App URL card */}
              <div className="bg-[#f0f9ff]/60 rounded-xl p-3.5 border border-[#bae6fd]">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-bold text-slate-900 uppercase text-[10px] tracking-wider">
                    Google Sheets Webhook URL
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                    googleSheetsUrl ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'
                  }`}>
                    {googleSheetsUrl ? 'Linked' : 'Not Linked'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 mb-2.5">
                  Shipment statuses, milestones, and delays will sync directly to your spreadsheet.
                </p>

                <div className="space-y-2">
                  <input
                    type="url"
                    value={googleSheetsUrl}
                    onChange={(e) => setGoogleSheetsUrl(e.target.value)}
                    placeholder="https://script.google.com/macros/s/.../exec"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0284c7] bg-white font-mono"
                  />
                  <button
                    onClick={handleTestGoogleSheets}
                    disabled={isTestingSheets}
                    className="w-full py-2 bg-[#0284c7] hover:bg-[#0369a1] text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isTestingSheets ? 'animate-spin' : ''}`} />
                    <span>{isTestingSheets ? 'Connecting...' : 'Save & Test Connection'}</span>
                  </button>
                </div>

                {sheetsMessage && (
                  <div className={`mt-2 p-2 rounded-lg text-[11px] font-medium flex items-center gap-1.5 ${
                    sheetsStatus === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'
                  }`}>
                    {sheetsStatus === 'success' ? <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" /> : <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />}
                    <span>{sheetsMessage}</span>
                  </div>
                )}
              </div>

              {/* Manual 2-way sync */}
              <div className="bg-white rounded-xl p-3 border border-slate-200 shadow-2xs">
                <span className="font-bold text-slate-800 text-[11px] block mb-2">
                  Manual Sync Controls
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => onTriggerSync('push')}
                    className="py-1.5 px-2 text-[11px] font-semibold rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 flex items-center justify-center gap-1"
                  >
                    <Upload className="w-3 h-3" />
                    <span>Push to Sheet</span>
                  </button>
                  <button
                    onClick={() => onTriggerSync('pull')}
                    className="py-1.5 px-2 text-[11px] font-semibold rounded-lg bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200 flex items-center justify-center gap-1"
                  >
                    <Download className="w-3 h-3" />
                    <span>Pull from Sheet</span>
                  </button>
                </div>
              </div>

              {/* Instructions Accordion */}
              <div className="bg-slate-50 rounded-xl p-3 border border-slate-200">
                <div
                  className="flex items-center justify-between cursor-pointer"
                  onClick={() => setShowInstructions(!showInstructions)}
                >
                  <div className="flex items-center gap-1.5 font-bold text-slate-800 text-[11px]">
                    <HelpCircle className="w-3.5 h-3.5 text-[#0284c7]" />
                    <span>How to get Google Sheets URL (1 Min)</span>
                  </div>
                  {showInstructions ? <ChevronUp className="w-3.5 h-3.5 text-slate-400" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-400" />}
                </div>

                {showInstructions && (
                  <div className="mt-2.5 space-y-2 text-[11px] text-slate-600 leading-relaxed border-t border-slate-200/80 pt-2">
                    <ol className="space-y-1 list-decimal list-inside">
                      <li>Create a new sheet at <a href="https://sheets.new" target="_blank" rel="noreferrer" className="text-[#0284c7] font-bold underline">sheets.new</a></li>
                      <li>Click <b>Extensions → Apps Script</b> in top menu.</li>
                      <li>Delete existing code and paste the script below.</li>
                      <li>Click <b>Deploy → New deployment</b>:
                        <ul className="pl-4 list-disc space-y-0.5 mt-0.5 text-slate-500">
                          <li>Type: <b>Web app</b></li>
                          <li>Execute as: <b>Me</b></li>
                          <li>Who has access: <b>Anyone</b></li>
                        </ul>
                      </li>
                      <li>Click <b>Deploy</b> and copy the Web App URL here!</li>
                    </ol>

                    <button
                      onClick={handleCopyScript}
                      className="w-full mt-2 py-1.5 px-3 text-[11px] font-bold rounded-lg bg-white border border-slate-200 text-[#0284c7] hover:bg-slate-100 flex items-center justify-center gap-1.5 shadow-2xs"
                    >
                      {copiedScript ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedScript ? 'Copied Apps Script Code!' : 'Copy Ready-to-Paste Script'}</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'tracktainer' && (
            <div className="space-y-3.5">
              <div className="bg-white rounded-xl p-3.5 border border-slate-200 shadow-2xs space-y-3">
                <div>
                  <label className="font-bold text-slate-800 text-[11px] block mb-1">
                    Tracktainer API Key
                  </label>
                  <p className="text-[11px] text-slate-500 mb-2">
                    Connects directly to Tracktainer container and milestone tracking API.
                  </p>
                  <input
                    type="password"
                    value={tracktainerApiKey}
                    onChange={(e) => setTracktainerApiKey(e.target.value)}
                    placeholder="e.g. tk_live_..."
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0284c7] font-mono"
                  />
                  <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1">
                    <span>From tracktainer.com portal</span>
                    <button
                      type="button"
                      onClick={() => setTracktainerApiKey('tk_live_demo_9375513_kmtc')}
                      className="text-[#0284c7] font-semibold hover:underline"
                    >
                      Fill Demo Key
                    </button>
                  </div>
                </div>

                <div>
                  <label className="font-bold text-slate-700 text-[10px] block mb-1">
                    API Base URL
                  </label>
                  <input
                    type="text"
                    value={tracktainerBaseUrl}
                    onChange={(e) => setTracktainerBaseUrl(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 font-mono"
                  />
                </div>

                <button
                  onClick={handleTestTracktainer}
                  disabled={isTestingTracktainer}
                  className="w-full py-2 bg-[#0284c7] hover:bg-[#0369a1] text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isTestingTracktainer ? 'animate-spin' : ''}`} />
                  <span>{isTestingTracktainer ? 'Verifying...' : 'Verify API Key'}</span>
                </button>

                {tracktainerMessage && (
                  <div className={`p-2 rounded-lg text-[11px] font-medium flex items-center gap-1.5 ${
                    tracktainerStatus === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'
                  }`}>
                    {tracktainerStatus === 'success' ? <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" /> : <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />}
                    <span>{tracktainerMessage}</span>
                  </div>
                )}
              </div>

              {/* Inbound Webhook Listener */}
              <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 space-y-1">
                <span className="font-bold text-slate-800 text-[11px] block">
                  Tracktainer Webhook URL
                </span>
                <p className="text-[10px] text-slate-500">
                  Configure this webhook in Tracktainer for automated updates:
                </p>
                <code className="block bg-white p-2 rounded-md border border-slate-200 text-[11px] font-mono text-slate-800 break-all select-all">
                  {window.location.origin}/api/tracktainer/webhook
                </code>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2.5 border-t border-slate-100 flex items-center justify-end bg-[#faf9f6]">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-bold text-white bg-slate-800 hover:bg-slate-900 rounded-lg transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
