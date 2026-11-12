import React, { useState, useEffect } from 'react';
import { 
  Smartphone, 
  Activity, 
  FileCode, 
  Network, 
  Download, 
  Power, 
  Flame, 
  Moon, 
  Sun, 
  CheckCircle2, 
  Wifi, 
  Layers 
} from 'lucide-react';
import { AndroidSimulator } from './components/AndroidSimulator';
import { TestSuiteRunner } from './components/TestSuiteRunner';
import { CodeExplorer } from './components/CodeExplorer';
import { ArchitectureView } from './components/ArchitectureView';
import { 
  ProfileType, 
  GlitchProfileConfig, 
  PRESET_PROFILES, 
  NetworkMetrics 
} from './types/glitch';
import { generateProjectZip } from './utils/projectZip';

export default function App() {
  const [activeTab, setActiveTab] = useState<'simulator' | 'tests' | 'code' | 'architecture'>('simulator');
  const [darkMode, setDarkMode] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  // Active configuration
  const [activeConfig, setActiveConfig] = useState<GlitchProfileConfig>(PRESET_PROFILES.MODERATE);

  // Simulated live telemetry
  const [metrics, setMetrics] = useState<NetworkMetrics>({
    currentPingMs: 18,
    packetLossRate: 0.0,
    forwardedCount: 1420,
    droppedCount: 0,
    jitterVarianceMs: 2,
    queueDepth: 0,
    isGlitchActive: false,
    activeProfile: 'MODERATE',
    unselectedAppPingMs: 16,
  });

  // Handle dark mode toggle on root html element
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Live telemetry ticker
  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics(prev => {
        if (!prev.isGlitchActive) {
          return {
            ...prev,
            currentPingMs: 16 + Math.floor(Math.random() * 5),
            packetLossRate: 0.0,
            jitterVarianceMs: 2,
            queueDepth: 0,
            forwardedCount: prev.forwardedCount + 8,
            unselectedAppPingMs: 15 + Math.floor(Math.random() * 4),
          };
        }

        const base = activeConfig.baseLatencyMs;
        const jitter = activeConfig.jitterMs;
        const currentJitter = Math.floor((Math.random() * 2 - 1) * jitter);
        const calculatedPing = Math.max(20, base + currentJitter);

        const newForwarded = prev.forwardedCount + 8;
        const lossRoll = Math.random() * 100;
        const newDropped = lossRoll < activeConfig.packetLossPercent ? prev.droppedCount + 1 : prev.droppedCount;

        return {
          ...prev,
          currentPingMs: calculatedPing,
          packetLossRate: activeConfig.packetLossPercent,
          jitterVarianceMs: Math.abs(currentJitter),
          queueDepth: Math.min(60, Math.floor(calculatedPing / 50)),
          forwardedCount: newForwarded,
          droppedCount: newDropped,
          unselectedAppPingMs: 15 + Math.floor(Math.random() * 4), // Always normal!
        };
      });
    }, 400);

    return () => clearInterval(interval);
  }, [metrics.isGlitchActive, activeConfig]);

  const handleToggleGlitch = (active: boolean) => {
    setMetrics(prev => ({
      ...prev,
      isGlitchActive: active,
      currentPingMs: active ? activeConfig.baseLatencyMs : 18,
      activeProfile: activeConfig.type,
      queueDepth: active ? 4 : 0,
    }));
  };

  const handleSelectProfile = (profile: ProfileType) => {
    const newConfig: GlitchProfileConfig = profile === 'CUSTOM' 
      ? { ...activeConfig, type: 'CUSTOM' as const } 
      : PRESET_PROFILES[profile];
    setActiveConfig(newConfig);
    if (metrics.isGlitchActive) {
      setMetrics(prev => ({
        ...prev,
        activeProfile: profile,
        currentPingMs: newConfig.baseLatencyMs,
      }));
    }
  };

  const handleUpdateConfig = (config: GlitchProfileConfig) => {
    setActiveConfig(config);
    if (metrics.isGlitchActive) {
      setMetrics(prev => ({
        ...prev,
        activeProfile: config.type,
        currentPingMs: config.baseLatencyMs,
      }));
    }
  };

  const handleQuickDownload = async () => {
    try {
      setIsDownloading(true);
      const zipBlob = await generateProjectZip();
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'CallGlitch-Android-Studio-Project.zip';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col transition-colors">
      
      {/* 2. Top Bar Contract: 3 zones separated by gap-8 (Brand, Nav links, 1 primary action) */}
      <header className="sticky top-0 z-50 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
          
          {/* Zone 1: Single text element wordmark */}
          <div className="flex items-center gap-2.5 whitespace-nowrap shrink-0">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-sky-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-sky-600/20 font-bold text-sm">
              CG
            </div>
            <span className="text-base font-bold tracking-tight text-slate-900 dark:text-white">
              Call Glitch
            </span>
          </div>

          {/* Zone 2: Clean single-line text navigation links */}
          <nav className="hidden md:flex items-center gap-6 text-xs font-semibold text-slate-600 dark:text-slate-400">
            <button
              onClick={() => setActiveTab('simulator')}
              className={`hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap shrink-0 pb-0.5 ${
                activeTab === 'simulator' ? 'text-sky-600 dark:text-sky-400 border-b-2 border-sky-500 font-bold' : ''
              }`}
            >
              Interactive Simulator
            </button>
            <button
              onClick={() => setActiveTab('tests')}
              className={`hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap shrink-0 pb-0.5 ${
                activeTab === 'tests' ? 'text-sky-600 dark:text-sky-400 border-b-2 border-sky-500 font-bold' : ''
              }`}
            >
              Test Suite (1–9)
            </button>
            <button
              onClick={() => setActiveTab('code')}
              className={`hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap shrink-0 pb-0.5 ${
                activeTab === 'code' ? 'text-sky-600 dark:text-sky-400 border-b-2 border-sky-500 font-bold' : ''
              }`}
            >
              Codebase & Download
            </button>
            <button
              onClick={() => setActiveTab('architecture')}
              className={`hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap shrink-0 pb-0.5 ${
                activeTab === 'architecture' ? 'text-sky-600 dark:text-sky-400 border-b-2 border-sky-500 font-bold' : ''
              }`}
            >
              Network Architecture
            </button>
          </nav>

          {/* Zone 3: 1 primary action button */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Toggle theme"
            >
              {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
            </button>

            <button
              onClick={handleQuickDownload}
              disabled={isDownloading}
              className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 dark:bg-white dark:text-slate-900 rounded-xl hover:opacity-90 transition-opacity whitespace-nowrap shrink-0 shadow-sm flex items-center gap-1.5 disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isDownloading ? 'Packaging...' : 'Download Android Project'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Live Pipeline Telemetry Strip */}
      <div className="bg-slate-100 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800 py-2.5 px-4">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4 text-xs font-mono">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${metrics.isGlitchActive ? 'bg-red-500 animate-ping' : 'bg-emerald-500'}`} />
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {metrics.isGlitchActive ? `STATUS: ${activeConfig.name.toUpperCase()} IMPAIRMENT` : 'STATUS: NORMAL NETWORK'}
              </span>
            </div>
            <span className="text-slate-400">·</span>
            <span className="text-slate-600 dark:text-slate-400">
              Forwarder: <span className="text-slate-900 dark:text-white font-bold">{metrics.forwardedCount.toLocaleString()} pkts</span>
            </span>
            <span className="text-slate-400">·</span>
            <span className="text-slate-600 dark:text-slate-400">
              Dropped: <span className="text-red-500 font-bold">{metrics.droppedCount.toLocaleString()} pkts</span>
            </span>
          </div>

          <div className="flex items-center gap-4 text-[11px]">
            <div>
              <span className="text-slate-500 dark:text-slate-400">Call Ping: </span>
              <span className={`font-bold tabular-nums ${metrics.isGlitchActive ? 'text-red-500' : 'text-emerald-600 dark:text-emerald-400'}`}>
                {metrics.currentPingMs} ms
              </span>
            </div>
            <div>
              <span className="text-slate-500 dark:text-slate-400">Jitter: </span>
              <span className="text-slate-800 dark:text-slate-200 font-bold tabular-nums">
                ±{metrics.jitterVarianceMs} ms
              </span>
            </div>
            <div>
              <span className="text-slate-500 dark:text-slate-400">Unselected App Ping (Isolation): </span>
              <span className="text-emerald-600 dark:text-emerald-400 font-bold tabular-nums">
                {metrics.unselectedAppPingMs} ms (Direct Bypass)
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main View Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full">
        {activeTab === 'simulator' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left 5 Cols: Android Phone Simulator */}
            <div className="lg:col-span-5 flex justify-center">
              <AndroidSimulator
                metrics={metrics}
                onToggleGlitch={handleToggleGlitch}
                onSelectProfile={handleSelectProfile}
                onUpdateConfig={handleUpdateConfig}
                activeConfig={activeConfig}
              />
            </div>

            {/* Right 7 Cols: Quick Verification & Interactive Control Center */}
            <div className="lg:col-span-7 space-y-6">
              {/* Primary In-Call Acceptance Criterion Callout */}
              <div className="p-5 rounded-2xl bg-gradient-to-br from-sky-50 to-indigo-50 dark:from-slate-900 dark:to-slate-900 border border-sky-200 dark:border-sky-900 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <span className="text-[11px] font-mono uppercase tracking-wider text-sky-600 dark:text-sky-400 font-bold">
                      Prompt Acceptance Criterion
                    </span>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white mt-0.5">
                      Zero-Leaving In-Call Quick Settings Toggle
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                      "I must be able to start a WhatsApp video call, swipe down the Android Quick Settings panel, tap Call Glitch, and have the selected connection impairment profile activate without opening the Call Glitch application or leaving the video call. Tapping the tile again must restore normal networking immediately."
                    </p>
                  </div>
                  <div className="shrink-0 p-2.5 rounded-xl bg-white dark:bg-slate-800 shadow-sm text-sky-500">
                    <Flame className="w-5 h-5" />
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-sky-100 dark:border-slate-800 flex flex-wrap items-center gap-3">
                  <button
                    onClick={() => handleToggleGlitch(!metrics.isGlitchActive)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-2 ${
                      metrics.isGlitchActive
                        ? 'bg-red-600 hover:bg-red-500 text-white'
                        : 'bg-sky-500 hover:bg-sky-400 text-white'
                    }`}
                  >
                    <Power className="w-3.5 h-3.5" />
                    {metrics.isGlitchActive ? 'Trigger Quick STOP' : 'Simulate Quick Settings Tile Tap'}
                  </button>

                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    Or click <strong>"Pull Down Shade"</strong> on the phone mockup to test the actual shade & QS tile!
                  </span>
                </div>
              </div>

              {/* Profiles & Parameters Grid */}
              <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-sky-500" />
                  Standard Connection Profiles (Section 6)
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {(['MILD', 'MODERATE', 'SEVERE'] as const).map(p => {
                    const preset = PRESET_PROFILES[p];
                    const isActive = activeConfig.type === p;
                    return (
                      <div
                        key={p}
                        onClick={() => handleSelectProfile(p)}
                        className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                          isActive
                            ? 'bg-sky-50 dark:bg-sky-950/40 border-sky-400 dark:border-sky-500 shadow-sm ring-1 ring-sky-400'
                            : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-bold text-slate-900 dark:text-white">{preset.name}</span>
                          {isActive && <CheckCircle2 className="w-3.5 h-3.5 text-sky-500" />}
                        </div>
                        <div className="space-y-1 text-[11px] font-mono text-slate-500 dark:text-slate-400">
                          <div>Base Latency: <span className="text-slate-900 dark:text-slate-200 font-bold">{preset.baseLatencyMs} ms</span></div>
                          <div>Random Jitter: <span className="text-slate-900 dark:text-slate-200 font-bold">±{preset.jitterMs} ms</span></div>
                          <div>UDP Loss: <span className="text-red-500 font-bold">{preset.packetLossPercent}%</span></div>
                          <div>Direction: <span className="text-slate-900 dark:text-slate-200">Both</span></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Quick Actions & Verification Shortcuts */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div 
                  onClick={() => setActiveTab('tests')}
                  className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm cursor-pointer hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <Activity className="w-4 h-4 text-emerald-500" />
                      Tests 1 to 9 Suite
                    </span>
                    <span className="text-[11px] text-sky-500 font-medium">Run →</span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                    Verify isolation, Wi-Fi to LTE handover, failsafe watchdog, and rapid in-call toggling against all 9 test specs.
                  </p>
                </div>

                <div 
                  onClick={() => setActiveTab('code')}
                  className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm cursor-pointer hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <FileCode className="w-4 h-4 text-sky-500" />
                      Android Studio Codebase
                    </span>
                    <span className="text-[11px] text-sky-500 font-medium">Browse →</span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                    Inspect VpnService.kt, PacketForwardingEngine.kt, TileService.kt, Compose screens, and download the full .ZIP project.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'tests' && (
          <TestSuiteRunner metrics={metrics} />
        )}

        {activeTab === 'code' && (
          <CodeExplorer />
        )}

        {activeTab === 'architecture' && (
          <ArchitectureView />
        )}
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-200 dark:border-slate-800 py-6 text-center text-xs text-slate-500 dark:text-slate-400">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>Call Glitch · Rootless, Per-App Network Impairment Utility for Android (API 26–35)</p>
          <div className="flex items-center gap-4 font-mono text-[11px]">
            <span>VpnService</span>
            <span>·</span>
            <span>TileService</span>
            <span>·</span>
            <span>Jetpack Compose</span>
            <span>·</span>
            <span>DataStore</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
