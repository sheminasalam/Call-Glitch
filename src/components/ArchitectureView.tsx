import React from 'react';
import { 
  Network, 
  ShieldCheck, 
  Cpu, 
  ArrowDown, 
  ArrowUp, 
  Layers, 
  Zap, 
  ServerCrash, 
  Lock, 
  Radio, 
  Share2 
} from 'lucide-react';

export const ArchitectureView: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Overview Banner */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Network className="w-5 h-5 text-sky-500" />
          Rootless Per-App Network Forwarding & Impairment Architecture
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-3xl leading-relaxed">
          Call Glitch achieves software-based traffic shaping without root access, external VPN servers, or touching neighboring Wi-Fi traffic. It relies on Android’s official <code className="font-mono text-sky-600 dark:text-sky-400">VpnService</code> API combined with user-space packet routing and socket protection.
        </p>
      </div>

      {/* Interactive Flow Diagram */}
      <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 text-white shadow-xl">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-6">
          <span className="text-xs font-mono uppercase tracking-wider text-slate-400">
            End-to-End Packet Routing Pipeline
          </span>
          <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800/80 px-2.5 py-0.5 rounded-full">
            Bi-directional Impairment Active
          </span>
        </div>

        <div className="max-w-2xl mx-auto space-y-4">
          {/* Layer 1: App */}
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-700 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">💬</span>
              <div>
                <h4 className="text-xs font-bold text-white">Targeted Calling Application</h4>
                <p className="text-[11px] text-slate-400 font-mono">WhatsApp · Telegram · Google Meet · Zoom</p>
              </div>
            </div>
            <span className="text-[10px] font-mono bg-sky-950 text-sky-300 border border-sky-800 px-2 py-0.5 rounded">
              UDP RTP/SRTP Media Traffic
            </span>
          </div>

          <div className="flex justify-center my-1 text-slate-500">
            <div className="flex flex-col items-center">
              <ArrowDown className="w-4 h-4 text-sky-400 animate-bounce" />
            </div>
          </div>

          {/* Layer 2: Android VpnService TUN */}
          <div className="p-4 rounded-xl bg-slate-900/90 border border-sky-900/60 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center font-bold text-xs">
                TUN
              </div>
              <div>
                <h4 className="text-xs font-bold text-sky-200">Android VpnService Virtual Interface</h4>
                <p className="text-[11px] text-slate-400 font-mono">10.240.0.1/24 · fd00:call:glitch::1/64 · MTU 1500</p>
              </div>
            </div>
            <span className="text-[10px] font-mono bg-slate-800 text-slate-300 px-2 py-0.5 rounded">
              VpnService.Builder
            </span>
          </div>

          <div className="flex justify-center my-1 text-slate-500">
            <ArrowDown className="w-4 h-4 text-sky-400" />
          </div>

          {/* Layer 3: Per-App Traffic Filter */}
          <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-800/50 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs">
                UID
              </div>
              <div>
                <h4 className="text-xs font-bold text-emerald-300">Per-App Traffic Isolation Filter</h4>
                <p className="text-[11px] text-slate-400 font-mono">addAllowedApplication(pkg) · Non-selected bypass TUN</p>
              </div>
            </div>
            <span className="text-[10px] font-mono text-emerald-400">Zero Leakage</span>
          </div>

          <div className="flex justify-center my-1 text-slate-500">
            <ArrowDown className="w-4 h-4 text-amber-400" />
          </div>

          {/* Layer 4: Network Impairment Engine */}
          <div className="p-4 rounded-xl bg-amber-950/30 border border-amber-700/60 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-xs">
                  GLITCH
                </div>
                <div>
                  <h4 className="text-xs font-bold text-amber-300">Network Impairment Engine</h4>
                  <p className="text-[11px] text-slate-400 font-mono">Bounded Priority Queue (500 pkts) · Flow-Isolated</p>
                </div>
              </div>
              <span className="text-[10px] font-mono text-amber-300 bg-amber-900/60 px-2 py-0.5 rounded">
                Active Traffic Shaper
              </span>
            </div>

            <div className="grid grid-cols-4 gap-2 pt-2 border-t border-amber-900/40 text-center text-[10px] font-mono">
              <div className="p-1.5 rounded bg-slate-900 border border-slate-800">
                <div className="text-slate-400">DELAY</div>
                <div className="text-amber-400 font-bold">120 - 350ms</div>
              </div>
              <div className="p-1.5 rounded bg-slate-900 border border-slate-800">
                <div className="text-slate-400">JITTER</div>
                <div className="text-amber-400 font-bold">±30 - 160ms</div>
              </div>
              <div className="p-1.5 rounded bg-slate-900 border border-slate-800">
                <div className="text-slate-400">LOSS</div>
                <div className="text-amber-400 font-bold">1 - 7% UDP</div>
              </div>
              <div className="p-1.5 rounded bg-slate-900 border border-slate-800">
                <div className="text-slate-400">BURST</div>
                <div className="text-amber-400 font-bold">Optional 800ms</div>
              </div>
            </div>
          </div>

          <div className="flex justify-center my-1 text-slate-500">
            <ArrowDown className="w-4 h-4 text-purple-400" />
          </div>

          {/* Layer 5: Protected Forwarding Engine */}
          <div className="p-4 rounded-xl bg-purple-950/30 border border-purple-800/50 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold text-xs">
                SOCK
              </div>
              <div>
                <h4 className="text-xs font-bold text-purple-200">User-Space TCP/UDP Forwarding Engine</h4>
                <p className="text-[11px] text-slate-400 font-mono">DatagramSocket · protect(socket) eliminates routing loop</p>
              </div>
            </div>
            <span className="text-[10px] font-mono text-purple-300 bg-purple-900/60 px-2 py-0.5 rounded">
              VpnService.protect()
            </span>
          </div>

          <div className="flex justify-center my-1 text-slate-500">
            <ArrowDown className="w-4 h-4 text-emerald-400" />
          </div>

          {/* Layer 6: Physical Network */}
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-700 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🌐</span>
              <div>
                <h4 className="text-xs font-bold text-white">Direct Physical Network / Internet</h4>
                <p className="text-[11px] text-slate-400 font-mono">Wi-Fi (802.11ax) or Cellular (5G/LTE) Default Gateway</p>
              </div>
            </div>
            <span className="text-[10px] font-mono bg-emerald-950 text-emerald-300 border border-emerald-800 px-2 py-0.5 rounded">
              Remote WhatsApp/Media Server
            </span>
          </div>
        </div>
      </div>

      {/* Critical Implementation Safeguards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="w-8 h-8 rounded-xl bg-sky-50 dark:bg-sky-950 text-sky-600 dark:text-sky-400 flex items-center justify-center mb-3">
            <Lock className="w-4 h-4" />
          </div>
          <h3 className="text-xs font-bold text-slate-900 dark:text-white mb-1">
            Loop Prevention via protect()
          </h3>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
            All direct sockets created by the user-space forwarder call <code className="font-mono text-slate-700 dark:text-slate-300">VpnService.protect()</code>, binding them to the default physical network interface and preventing recursive VPN routing loops.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-3">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <h3 className="text-xs font-bold text-slate-900 dark:text-white mb-1">
            Priority STOP & Zero Blackhole
          </h3>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
            Tapping STOP from the Quick Settings tile or persistent notification immediately destroys the TUN file descriptor and clears queues, ensuring the device returns to baseline network connectivity without delay.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-3">
            <Radio className="w-4 h-4" />
          </div>
          <h3 className="text-xs font-bold text-slate-900 dark:text-white mb-1">
            Wi-Fi / Cellular Handover
          </h3>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
            <code className="font-mono text-slate-700 dark:text-slate-300">ConnectivityManager.NetworkCallback</code> listens to network transitions. If Wi-Fi drops, sockets are immediately re-bound and re-protected over 5G without tearing down the call.
          </p>
        </div>
      </div>
    </div>
  );
};
