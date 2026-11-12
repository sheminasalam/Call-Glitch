export type ProfileType = 'MILD' | 'MODERATE' | 'SEVERE' | 'CUSTOM';
export type ImpairmentDirection = 'BOTH' | 'INCOMING' | 'OUTGOING';

export interface GlitchProfileConfig {
  type: ProfileType;
  name: string;
  baseLatencyMs: number;
  jitterMs: number;
  packetLossPercent: number;
  burstInterruptionEnabled: boolean;
  burstDurationMs: number;
  burstIntervalSeconds: number;
  direction: ImpairmentDirection;
  affectTcp: boolean;
  timeoutSeconds: number;
}

export const PRESET_PROFILES: Record<Exclude<ProfileType, 'CUSTOM'>, GlitchProfileConfig> = {
  MILD: {
    type: 'MILD',
    name: 'Mild',
    baseLatencyMs: 120,
    jitterMs: 30,
    packetLossPercent: 1.0,
    burstInterruptionEnabled: false,
    burstDurationMs: 600,
    burstIntervalSeconds: 15,
    direction: 'BOTH',
    affectTcp: false,
    timeoutSeconds: 0,
  },
  MODERATE: {
    type: 'MODERATE',
    name: 'Moderate',
    baseLatencyMs: 220,
    jitterMs: 90,
    packetLossPercent: 3.0,
    burstInterruptionEnabled: false,
    burstDurationMs: 800,
    burstIntervalSeconds: 12,
    direction: 'BOTH',
    affectTcp: false,
    timeoutSeconds: 0,
  },
  SEVERE: {
    type: 'SEVERE',
    name: 'Severe',
    baseLatencyMs: 350,
    jitterMs: 160,
    packetLossPercent: 7.0,
    burstInterruptionEnabled: true,
    burstDurationMs: 1200,
    burstIntervalSeconds: 10,
    direction: 'BOTH',
    affectTcp: false,
    timeoutSeconds: 0,
  },
};

export interface CallingApp {
  id: string;
  name: string;
  packageName: string;
  icon: string;
  defaultSelected: boolean;
}

export const CALLING_APPS: CallingApp[] = [
  { id: 'whatsapp', name: 'WhatsApp', packageName: 'com.whatsapp', icon: '💬', defaultSelected: true },
  { id: 'telegram', name: 'Telegram', packageName: 'org.telegram.messenger', icon: '✈️', defaultSelected: true },
  { id: 'instagram', name: 'Instagram', packageName: 'com.instagram.android', icon: '📷', defaultSelected: true },
  { id: 'messenger', name: 'Messenger', packageName: 'com.facebook.orca', icon: '⚡', defaultSelected: true },
  { id: 'meet', name: 'Google Meet', packageName: 'com.google.android.apps.tachyon', icon: '📹', defaultSelected: true },
  { id: 'zoom', name: 'Zoom Workplace', packageName: 'us.zoom.videomeetings', icon: '💻', defaultSelected: true },
  { id: 'signal', name: 'Signal', packageName: 'org.thoughtcrime.securesms', icon: '🔒', defaultSelected: false },
  { id: 'discord', name: 'Discord', packageName: 'com.discord', icon: '🎮', defaultSelected: false },
];

export interface NetworkMetrics {
  currentPingMs: number;
  packetLossRate: number;
  forwardedCount: number;
  droppedCount: number;
  jitterVarianceMs: number;
  queueDepth: number;
  isGlitchActive: boolean;
  activeProfile: ProfileType;
  unselectedAppPingMs: number; // For proving isolation
}

export interface TestCaseResult {
  id: number;
  title: string;
  category: string;
  status: 'idle' | 'running' | 'passed' | 'failed';
  assertion: string;
  details: string;
  measuredMetric?: string;
}
