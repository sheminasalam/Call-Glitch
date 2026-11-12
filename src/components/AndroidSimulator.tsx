import React, { useState, useEffect, useRef } from 'react';
import { 
  Wifi, 
  Battery, 
  Key, 
  ChevronDown, 
  Power, 
  Flame, 
  Settings2, 
  Video, 
  Mic, 
  MicOff, 
  PhoneOff, 
  Volume2, 
  Check, 
  Sliders, 
  ShieldAlert, 
  Layers, 
  Clock, 
  Sparkles,
  Smartphone
} from 'lucide-react';
import { 
  ProfileType, 
  GlitchProfileConfig, 
  PRESET_PROFILES, 
  CALLING_APPS, 
  NetworkMetrics 
} from '../types/glitch';

interface AndroidSimulatorProps {
  metrics: NetworkMetrics;
  onToggleGlitch: (active: boolean) => void;
  onSelectProfile: (profile: ProfileType) => void;
  onUpdateConfig: (config: GlitchProfileConfig) => void;
  activeConfig: GlitchProfileConfig;
}

export const AndroidSimulator: React.FC<AndroidSimulatorProps> = ({
  metrics,
  onToggleGlitch,
  onSelectProfile,
  onUpdateConfig,
  activeConfig
}) => {
  // Simulator UI view modes
  const [phoneScreen, setPhoneScreen] = useState<'app' | 'call'>('call');
  const [isShadeOpen, setIsShadeOpen] = useState(false);
  const [showAppsModal, setShowAppsModal] = useState(false);
  const [selectedApps, setSelectedApps] = useState<string[]>(['com.whatsapp', 'org.telegram.messenger', 'com.google.android.apps.tachyon']);
  const [showAdvancedInApp, setShowAdvancedInApp] = useState(false);
  const [callDuration, setCallDuration] = useState(142); // 02:22
  const [videoFreeze, setVideoFreeze] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);

  // Call timer increment
  useEffect(() => {
    const timer = setInterval(() => {
      setCallDuration(prev => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Video freeze simulation based on packet loss & jitter
  useEffect(() => {
    if (!metrics.isGlitchActive) {
      setVideoFreeze(false);
      return;
    }

    const intervalMs = metrics.activeProfile === 'SEVERE' ? 2200 : metrics.activeProfile === 'MODERATE' ? 3600 : 6000;
    const freezeDuration = metrics.activeProfile === 'SEVERE' ? 1200 : metrics.activeProfile === 'MODERATE' ? 700 : 300;

    const interval = setInterval(() => {
      setVideoFreeze(true);
      setTimeout(() => setVideoFreeze(false), freezeDuration);
    }, intervalMs);

    return () => clearInterval(interval);
  }, [metrics.isGlitchActive, metrics.activeProfile]);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const handleAppToggle = (pkg: string) => {
    setSelectedApps(prev => 
      prev.includes(pkg) ? prev.filter(p => p !== pkg) : [...prev, pkg]
    );
  };

  return (
    <div className="flex flex-col items-center select-none">
      {/* Simulator Control Bar */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 w-full max-w-[380px] px-1">
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs font-medium">
          <button
            onClick={() => setPhoneScreen('call')}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-md transition-colors ${
              phoneScreen === 'call' 
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm' 
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Video className="w-3.5 h-3.5 text-emerald-500" />
            WhatsApp Call
          </button>
          <button
            onClick={() => setPhoneScreen('app')}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-md transition-colors ${
              phoneScreen === 'app' 
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm' 
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5 text-sky-500" />
            Call Glitch UI
          </button>
        </div>

        <button
          onClick={() => setIsShadeOpen(!isShadeOpen)}
          className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:border-slate-300 shadow-sm"
        >
          <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isShadeOpen ? 'rotate-180' : ''}`} />
          {isShadeOpen ? 'Close Shade' : 'Pull Down Shade'}
        </button>
      </div>

      {/* Phone Chassis */}
      <div 
        ref={containerRef}
        className="relative w-[340px] h-[690px] bg-slate-950 rounded-[44px] p-3 shadow-2xl border-4 border-slate-800 ring-1 ring-slate-700/50 overflow-hidden flex flex-col"
      >
        {/* Dynamic Island / Front Camera Punch Hole */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 w-24 h-4 bg-black rounded-full z-50 flex items-center justify-center">
          <div className="w-2.5 h-2.5 bg-slate-900 rounded-full border border-slate-800" />
        </div>

        {/* Screen Content Wrapper */}
        <div className="relative w-full h-full bg-slate-900 rounded-[34px] overflow-hidden flex flex-col text-slate-100">
          
          {/* Top Status Bar */}
          <div 
            onClick={() => setIsShadeOpen(!isShadeOpen)}
            className="w-full h-9 pt-2 px-5 flex items-center justify-between text-[11px] font-semibold text-slate-200 z-40 bg-gradient-to-b from-black/60 to-transparent cursor-pointer"
          >
            <span>09:41</span>
            <div className="flex items-center gap-2">
              {metrics.isGlitchActive && (
                <span title="VPN Active">
                  <Key className="w-3 h-3 text-amber-400" />
                </span>
              )}
              <Wifi className="w-3 h-3" />
              <span className="text-[10px] tracking-tight">5G</span>
              <Battery className="w-3.5 h-3.5 text-slate-200" />
            </div>
          </div>

          {/* SCREEN BODY 1: Simulated Video Call Screen */}
          {phoneScreen === 'call' && (
            <div className="relative flex-1 bg-slate-950 flex flex-col justify-between p-4 overflow-hidden">
              {/* Background Video Simulation */}
              <div className="absolute inset-0 z-0">
                <div className={`w-full h-full object-cover transition-all duration-300 ${
                  videoFreeze ? 'filter brightness-90 contrast-125 blur-[1px]' : ''
                }`}>
                  {/* Procedural video scene: animated gradient room & participant */}
                  <div className="w-full h-full bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-950 flex flex-col items-center justify-center relative">
                    {/* Simulated person avatar */}
                    <div className={`relative w-28 h-28 rounded-full border-2 border-white/20 bg-gradient-to-tr from-sky-600 to-indigo-500 flex items-center justify-center shadow-xl transition-transform ${
                      videoFreeze ? 'scale-95' : 'animate-pulse'
                    }`}>
                      <span className="text-4xl">👨‍💻</span>
                      {videoFreeze && (
                        <div className="absolute inset-0 bg-red-950/40 rounded-full flex items-center justify-center backdrop-blur-[2px]">
                          <span className="text-[10px] font-mono text-red-200 bg-red-900/80 px-2 py-0.5 rounded">BUFFERING</span>
                        </div>
                      )}
                    </div>

                    <p className="mt-4 text-sm font-medium text-white/90">Sarah (WhatsApp Video)</p>
                    <p className="text-xs text-white/60 font-mono mt-0.5">{formatTime(callDuration)}</p>

                    {/* Glitch Overlay Banner when active */}
                    {metrics.isGlitchActive && (
                      <div className="mt-3 px-3 py-1 bg-red-500/20 border border-red-500/40 rounded-full flex items-center gap-1.5 text-[11px] text-red-300 font-medium animate-pulse">
                        <Flame className="w-3 h-3 text-red-400" />
                        <span>Call Glitch {metrics.activeProfile}: {metrics.currentPingMs}ms / {activeConfig.packetLossPercent}% loss</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Self View Floating Camera (PiP) */}
                <div className="absolute top-12 right-4 w-20 h-28 rounded-xl bg-slate-800 border border-white/20 shadow-lg overflow-hidden flex flex-col items-center justify-center">
                  <span className="text-2xl">🧑</span>
                  <span className="text-[9px] text-white/70 mt-1">You</span>
                </div>
              </div>

              {/* Top Call Info */}
              <div className="relative z-10 flex items-center justify-between text-xs text-white/80">
                <span className="bg-black/40 px-2.5 py-1 rounded-full backdrop-blur-md">End-to-end encrypted</span>
                <span className={`px-2.5 py-1 rounded-full text-[10px] font-mono backdrop-blur-md ${
                  metrics.isGlitchActive ? 'bg-red-900/60 text-red-300' : 'bg-emerald-900/60 text-emerald-300'
                }`}>
                  {metrics.isGlitchActive ? 'Unstable Signal' : 'HD Call Quality'}
                </span>
              </div>

              {/* Real-time Audio Waveform Visualizer */}
              <div className="relative z-10 w-full bg-black/40 backdrop-blur-md rounded-2xl p-3 border border-white/10">
                <div className="flex items-center justify-between mb-1.5 text-[10px] text-white/70 font-mono">
                  <span>AUDIO STREAM</span>
                  <span className="tabular-nums">
                    {metrics.isGlitchActive ? `Jitter: ±${metrics.jitterVarianceMs}ms` : 'Clear: 16kHz'}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-1 h-8">
                  {[40, 65, 85, 30, 95, 70, 50, 90, 60, 45, 80, 55, 35, 75, 90, 60].map((h, i) => {
                    const dynamicHeight = metrics.isGlitchActive 
                      ? (videoFreeze ? 4 : Math.max(8, Math.round(h * (Math.random() > 0.4 ? 0.3 : 1.2))))
                      : h;
                    return (
                      <div 
                        key={i}
                        style={{ height: `${dynamicHeight}%` }}
                        className={`w-1 rounded-full transition-all duration-150 ${
                          metrics.isGlitchActive 
                            ? (videoFreeze ? 'bg-red-500/50' : 'bg-amber-400') 
                            : 'bg-emerald-400'
                        }`}
                      />
                    );
                  })}
                </div>
              </div>

              {/* Bottom In-Call Controls */}
              <div className="relative z-10 flex items-center justify-center gap-4 py-2">
                <button className="w-11 h-11 rounded-full bg-white/15 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/25">
                  <Volume2 className="w-5 h-5" />
                </button>
                <button className="w-11 h-11 rounded-full bg-white/15 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/25">
                  <Mic className="w-5 h-5" />
                </button>
                <button className="w-11 h-11 rounded-full bg-white/15 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/25">
                  <Video className="w-5 h-5" />
                </button>
                <button 
                  onClick={() => setPhoneScreen('app')}
                  className="w-11 h-11 rounded-full bg-red-600 flex items-center justify-center text-white shadow-lg shadow-red-600/30"
                >
                  <PhoneOff className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}

          {/* SCREEN BODY 2: Native Call Glitch Compose App UI */}
          {phoneScreen === 'app' && (
            <div className="flex-1 bg-slate-900 overflow-y-auto px-4 py-3 flex flex-col text-slate-100">
              {/* App Bar */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-sky-500 flex items-center justify-center text-white font-bold text-xs shadow-md shadow-sky-500/20">
                    CG
                  </div>
                  <div>
                    <h1 className="text-sm font-bold text-white tracking-tight leading-tight">Call Glitch</h1>
                    <p className="text-[10px] text-slate-400">Rootless Network Impairment</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowAppsModal(true)}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs flex items-center gap-1"
                  title="Targeted Calling Apps"
                >
                  <Layers className="w-3.5 h-3.5 text-sky-400" />
                  <span className="text-[11px] font-medium">{selectedApps.length} Apps</span>
                </button>
              </div>

              {/* Status Banner */}
              <div className={`mt-3 p-3 rounded-2xl border transition-colors ${
                metrics.isGlitchActive 
                  ? 'bg-red-950/40 border-red-500/40' 
                  : 'bg-slate-800/60 border-slate-700/60'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-2.5 h-2.5 rounded-full ${metrics.isGlitchActive ? 'bg-red-500 animate-ping' : 'bg-emerald-400'}`} />
                    <span className="text-xs font-semibold">
                      {metrics.isGlitchActive ? `${activeConfig.name} Impairment Active` : 'Normal Direct Network'}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400">
                    {metrics.isGlitchActive ? `${metrics.currentPingMs}ms` : '18ms (Bypass)'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  {metrics.isGlitchActive 
                    ? `${metrics.forwardedCount} pkts · ${metrics.droppedCount} dropped (${activeConfig.packetLossPercent}%)`
                    : `${selectedApps.length} apps routed to TUN · Non-selected direct bypass`}
                </p>
              </div>

              {/* Big Tactile ON/OFF Toggle */}
              <div className="flex flex-col items-center justify-center my-4">
                <button
                  onClick={() => onToggleGlitch(!metrics.isGlitchActive)}
                  className={`w-24 h-24 rounded-full flex flex-col items-center justify-center transition-all duration-200 shadow-xl ${
                    metrics.isGlitchActive
                      ? 'bg-red-600 hover:bg-red-500 text-white shadow-red-600/40 scale-105 ring-4 ring-red-500/30'
                      : 'bg-sky-500 hover:bg-sky-400 text-white shadow-sky-500/30 active:scale-95'
                  }`}
                >
                  <Power className="w-8 h-8" />
                  <span className="text-xs font-bold tracking-wider mt-1">
                    {metrics.isGlitchActive ? 'STOP' : 'START'}
                  </span>
                </button>
                <span className="text-[10px] text-slate-400 mt-2">
                  {metrics.isGlitchActive ? 'Tap to instantly restore normal connection' : 'One-tap activation for selected apps'}
                </span>
              </div>

              {/* Profile Selector */}
              <div className="mt-1">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-slate-200">Impairment Profile</span>
                  <span className="text-[10px] text-slate-400">UDP Prioritized</span>
                </div>
                <div className="grid grid-cols-4 gap-1.5">
                  {(['MILD', 'MODERATE', 'SEVERE', 'CUSTOM'] as ProfileType[]).map(p => {
                    const isSelected = activeConfig.type === p;
                    const preset = p !== 'CUSTOM' ? PRESET_PROFILES[p] : activeConfig;
                    return (
                      <button
                        key={p}
                        onClick={() => onSelectProfile(p)}
                        className={`p-2 rounded-xl text-left border transition-all ${
                          isSelected
                            ? 'bg-sky-950/60 border-sky-400 text-sky-100 shadow-sm'
                            : 'bg-slate-800/50 border-slate-700/60 text-slate-300 hover:bg-slate-800'
                        }`}
                      >
                        <div className="text-[11px] font-bold truncate">{p === 'CUSTOM' ? 'Custom' : preset.name}</div>
                        <div className="text-[9px] text-slate-400 font-mono mt-0.5">
                          {p === 'CUSTOM' ? `${preset.baseLatencyMs}ms` : `${preset.baseLatencyMs}ms / ${preset.packetLossPercent}%`}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* In-Call Quick Controls */}
              <div className="mt-3 p-3 rounded-2xl bg-slate-800/40 border border-slate-700/60 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-semibold text-slate-200">Quick Settings Tile</span>
                    <p className="text-[10px] text-slate-400">Primary in-call 1-tap control (no overlays)</p>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-2 py-0.5 rounded">
                    Primary
                  </span>
                </div>

                <div className="h-px bg-slate-800" />

                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-semibold text-slate-200">Auto-Restore Timeout</span>
                    <p className="text-[10px] text-slate-400">Restores normal traffic automatically</p>
                  </div>
                  <div className="flex items-center gap-1">
                    {[0, 60, 180].map(sec => (
                      <button
                        key={sec}
                        onClick={() => onUpdateConfig({ ...activeConfig, timeoutSeconds: sec })}
                        className={`px-2 py-0.5 rounded text-[10px] font-mono border ${
                          activeConfig.timeoutSeconds === sec
                            ? 'bg-sky-900 border-sky-400 text-sky-200'
                            : 'bg-slate-800 border-slate-700 text-slate-400'
                        }`}
                      >
                        {sec === 0 ? 'Off' : `${sec / 60}m`}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Advanced Parameters Accordion */}
              <div className="mt-3">
                <button
                  onClick={() => setShowAdvancedInApp(!showAdvancedInApp)}
                  className="w-full flex items-center justify-between p-2.5 rounded-xl bg-slate-800/40 border border-slate-700/60 text-xs font-semibold text-slate-300"
                >
                  <span className="flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5 text-sky-400" />
                    Advanced Engineering Controls
                  </span>
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showAdvancedInApp ? 'rotate-180' : ''}`} />
                </button>

                {showAdvancedInApp && (
                  <div className="mt-2 p-3 rounded-2xl bg-slate-800/60 border border-slate-700/80 space-y-3">
                    {/* Latency */}
                    <div>
                      <div className="flex justify-between text-[11px] mb-1">
                        <span className="text-slate-300">Base Delay</span>
                        <span className="font-mono text-sky-400">{activeConfig.baseLatencyMs} ms</span>
                      </div>
                      <input 
                        type="range" 
                        min={0} 
                        max={600} 
                        step={10}
                        value={activeConfig.baseLatencyMs}
                        onChange={e => onUpdateConfig({ ...activeConfig, type: 'CUSTOM', baseLatencyMs: Number(e.target.value) })}
                        className="w-full accent-sky-400 h-1 bg-slate-700 rounded-lg cursor-pointer"
                      />
                    </div>

                    {/* Jitter */}
                    <div>
                      <div className="flex justify-between text-[11px] mb-1">
                        <span className="text-slate-300">Random Jitter</span>
                        <span className="font-mono text-sky-400">±{activeConfig.jitterMs} ms</span>
                      </div>
                      <input 
                        type="range" 
                        min={0} 
                        max={250} 
                        step={5}
                        value={activeConfig.jitterMs}
                        onChange={e => onUpdateConfig({ ...activeConfig, type: 'CUSTOM', jitterMs: Number(e.target.value) })}
                        className="w-full accent-sky-400 h-1 bg-slate-700 rounded-lg cursor-pointer"
                      />
                    </div>

                    {/* Loss */}
                    <div>
                      <div className="flex justify-between text-[11px] mb-1">
                        <span className="text-slate-300">Packet Loss</span>
                        <span className="font-mono text-sky-400">{activeConfig.packetLossPercent}%</span>
                      </div>
                      <input 
                        type="range" 
                        min={0} 
                        max={15} 
                        step={0.5}
                        value={activeConfig.packetLossPercent}
                        onChange={e => onUpdateConfig({ ...activeConfig, type: 'CUSTOM', packetLossPercent: Number(e.target.value) })}
                        className="w-full accent-sky-400 h-1 bg-slate-700 rounded-lg cursor-pointer"
                      />
                    </div>

                    {/* TCP Impairment Switch */}
                    <div className="flex items-center justify-between pt-1">
                      <div>
                        <span className="text-[11px] font-medium text-slate-300">Affect TCP Traffic</span>
                        <p className="text-[9px] text-amber-400/90">Keep disabled to preserve call signaling</p>
                      </div>
                      <button
                        onClick={() => onUpdateConfig({ ...activeConfig, type: 'CUSTOM', affectTcp: !activeConfig.affectTcp })}
                        className={`w-9 h-4.5 rounded-full p-0.5 transition-colors ${activeConfig.affectTcp ? 'bg-amber-500' : 'bg-slate-700'}`}
                      >
                        <div className={`w-3.5 h-3.5 rounded-full bg-white transition-transform ${activeConfig.affectTcp ? 'translate-x-4.5' : ''}`} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}


          {/* PULL-DOWN QUICK SETTINGS & NOTIFICATION SHADE */}
          {isShadeOpen && (
            <div className="absolute inset-0 z-50 bg-slate-950/95 backdrop-blur-xl flex flex-col p-4 animate-in slide-in-from-top-full duration-200">
              {/* Shade Header */}
              <div className="flex items-center justify-between text-xs text-slate-400 pb-3 border-b border-slate-800">
                <span className="font-semibold text-white">Quick Settings & Notifications</span>
                <button 
                  onClick={() => setIsShadeOpen(false)}
                  className="px-2 py-1 rounded bg-slate-800 text-slate-300 hover:bg-slate-700 text-[11px]"
                >
                  Close
                </button>
              </div>

              {/* Quick Settings Tiles Grid */}
              <div className="my-3">
                <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-2 font-mono">Quick Settings Tiles</p>
                <div className="grid grid-cols-2 gap-2">
                  {/* CRITICAL FEATURE: Call Glitch QS Tile */}
                  <button
                    onClick={() => {
                      onToggleGlitch(!metrics.isGlitchActive);
                    }}
                    className={`p-3 rounded-2xl flex items-center gap-3 border transition-all text-left ${
                      metrics.isGlitchActive
                        ? 'bg-red-600 border-red-400 text-white shadow-lg shadow-red-600/30'
                        : 'bg-slate-800/90 border-slate-700 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center ${
                      metrics.isGlitchActive ? 'bg-white/20' : 'bg-slate-700'
                    }`}>
                      <Flame className="w-5 h-5" />
                    </div>
                    <div className="overflow-hidden">
                      <div className="text-xs font-bold leading-tight truncate">Call Glitch</div>
                      <div className="text-[10px] opacity-80 truncate">
                        {metrics.isGlitchActive ? `${activeConfig.name} Active` : 'Tap to Impair'}
                      </div>
                    </div>
                  </button>

                  {/* Standard Wi-Fi Tile */}
                  <div className="p-3 rounded-2xl bg-sky-600/30 border border-sky-500/40 text-sky-200 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-sky-500 flex items-center justify-center text-white">
                      <Wifi className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold">Home Wi-Fi</div>
                      <div className="text-[10px] opacity-80">Connected</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Persistent Foreground Notification */}
              {metrics.isGlitchActive && (
                <div className="mt-2 p-3 rounded-2xl bg-slate-900 border border-red-500/40 shadow-xl">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs text-red-400 font-semibold">
                      <Flame className="w-3.5 h-3.5" />
                      <span>Call Glitch: {activeConfig.name}</span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono">Running</span>
                  </div>
                  <p className="text-[11px] text-slate-300 mt-1">
                    Simulating unstable connection ({activeConfig.baseLatencyMs}ms delay, {activeConfig.packetLossPercent}% loss)
                  </p>
                  
                  {/* STOP Priority Action */}
                  <div className="mt-2.5 flex items-center justify-end gap-2">
                    <button
                      onClick={() => {
                        onToggleGlitch(false);
                      }}
                      className="px-4 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold text-xs shadow-md shadow-red-600/30 flex items-center gap-1.5"
                    >
                      <Power className="w-3.5 h-3.5" />
                      STOP (Restore Network)
                    </button>
                  </div>
                </div>
              )}

              {/* In-Call Help Hint */}
              <div className="mt-auto p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-[11px] text-slate-400">
                <span className="font-semibold text-slate-300">In-Call Activation Test:</span> Swipe down while in WhatsApp, tap the tile to glitch, and tap again to restore immediately!
              </div>
            </div>
          )}

          {/* TARGETED APPS SELECTION MODAL */}
          {showAppsModal && (
            <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-md p-4 flex flex-col justify-end">
              <div className="bg-slate-900 rounded-3xl p-4 border border-slate-700 shadow-2xl flex flex-col max-h-[85%]">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div>
                    <h3 className="text-sm font-bold text-white">Target Calling Apps</h3>
                    <p className="text-[10px] text-slate-400">Non-selected apps bypass VPN interface</p>
                  </div>
                  <button 
                    onClick={() => setShowAppsModal(false)}
                    className="p-1 rounded-full bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs"
                  >
                    ✕
                  </button>
                </div>

                <div className="overflow-y-auto py-2 space-y-1.5 my-2">
                  {CALLING_APPS.map(app => {
                    const isChecked = selectedApps.includes(app.packageName);
                    return (
                      <div
                        key={app.id}
                        onClick={() => handleAppToggle(app.packageName)}
                        className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer border transition-colors ${
                          isChecked 
                            ? 'bg-sky-950/40 border-sky-500/50 text-white' 
                            : 'bg-slate-800/40 border-slate-700/60 text-slate-400'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="text-lg">{app.icon}</span>
                          <div>
                            <div className="text-xs font-semibold">{app.name}</div>
                            <div className="text-[9px] font-mono text-slate-500">{app.packageName}</div>
                          </div>
                        </div>
                        <div className={`w-5 h-5 rounded-md flex items-center justify-center border ${
                          isChecked ? 'bg-sky-500 border-sky-400 text-white' : 'border-slate-600'
                        }`}>
                          {isChecked && <Check className="w-3.5 h-3.5" />}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <button
                  onClick={() => setShowAppsModal(false)}
                  className="w-full py-2 bg-sky-500 hover:bg-sky-400 text-white rounded-xl font-semibold text-xs transition-colors mt-2"
                >
                  Save Applications ({selectedApps.length} active)
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
