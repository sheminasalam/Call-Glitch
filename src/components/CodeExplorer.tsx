import React, { useState } from 'react';
import { 
  FolderTree, 
  FileCode, 
  Copy, 
  Check, 
  Download, 
  Terminal, 
  FileText, 
  ShieldAlert, 
  ExternalLink 
} from 'lucide-react';
import { ANDROID_PROJECT_FILES, AndroidProjectFile } from '../android/projectFiles';
import { generateProjectZip } from '../utils/projectZip';

export const CodeExplorer: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<AndroidProjectFile>(
    ANDROID_PROJECT_FILES.find(f => f.path.includes('CallGlitchVpnService.kt')) || ANDROID_PROJECT_FILES[0]
  );
  const [copied, setCopied] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(selectedFile.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadZip = async () => {
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
      console.error('Failed to generate zip', e);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Action Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <FileCode className="w-5 h-5 text-sky-500" />
            Complete Native Android Studio Project
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Production-grade Kotlin & Jetpack Compose codebase. Ready to open in Android Studio and build with Gradle.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleDownloadZip}
            disabled={isDownloading}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-semibold text-xs transition-colors shadow-sm disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            {isDownloading ? 'Packaging Project (.ZIP)...' : 'Download Complete Project (.ZIP)'}
          </button>
        </div>
      </div>

      {/* Main Code View Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left: Project File Tree */}
        <div className="lg:col-span-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
          <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <FolderTree className="w-4 h-4 text-sky-500" />
              Project Structure
            </span>
            <span className="text-[11px] font-mono text-slate-400">
              {ANDROID_PROJECT_FILES.length} Files
            </span>
          </div>

          <div className="p-2 space-y-1 max-h-[640px] overflow-y-auto">
            {ANDROID_PROJECT_FILES.map(file => {
              const isSelected = selectedFile.path === file.path;
              const isKotlin = file.language === 'kotlin';
              const isXml = file.language === 'xml';
              const isMarkdown = file.language === 'markdown';

              return (
                <button
                  key={file.path}
                  onClick={() => setSelectedFile(file)}
                  className={`w-full text-left px-3 py-2.5 rounded-xl transition-all flex items-start gap-2.5 ${
                    isSelected
                      ? 'bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 font-medium'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <span className="mt-0.5 shrink-0 text-xs font-mono">
                    {isKotlin ? '⚡' : isXml ? '📄' : isMarkdown ? '📖' : '⚙️'}
                  </span>
                  <div className="overflow-hidden">
                    <div className="text-xs font-mono truncate">{file.path}</div>
                    <div className="text-[10px] text-slate-400 dark:text-slate-500 truncate mt-0.5">
                      {file.description}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: Code Viewer */}
        <div className="lg:col-span-8 rounded-2xl bg-slate-950 border border-slate-800 overflow-hidden shadow-xl flex flex-col">
          {/* File Tab Header */}
          <div className="px-4 py-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 overflow-hidden">
              <span className="font-mono text-sky-400 font-semibold">{selectedFile.path}</span>
              <span className="text-slate-500 text-[11px]">({selectedFile.language})</span>
            </div>
            
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors text-[11px] font-medium"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy File</span>
                </>
              )}
            </button>
          </div>

          {/* Description banner */}
          <div className="px-4 py-2 bg-slate-900/40 border-b border-slate-800/80 text-[11px] text-slate-400">
            {selectedFile.description}
          </div>

          {/* Code Content */}
          <div className="p-4 max-h-[580px] overflow-auto font-mono text-xs text-slate-200 leading-relaxed">
            <pre>
              <code>{selectedFile.content}</code>
            </pre>
          </div>
        </div>
      </div>

      {/* Build & Run Instructions */}
      <div className="p-5 rounded-2xl bg-slate-900 text-white border border-slate-800">
        <h3 className="text-sm font-bold flex items-center gap-2 mb-3">
          <Terminal className="w-4 h-4 text-emerald-400" />
          How to Build & Flash on Real Android Device
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs font-mono">
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
            <div className="text-slate-400 text-[10px] uppercase tracking-wider mb-1">1. Build Debug APK</div>
            <code className="text-sky-300">./gradlew assembleDebug</code>
          </div>
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
            <div className="text-slate-400 text-[10px] uppercase tracking-wider mb-1">2. Install on Device via ADB</div>
            <code className="text-emerald-300">adb install -r app-debug.apk</code>
          </div>
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
            <div className="text-slate-400 text-[10px] uppercase tracking-wider mb-1">3. Grant System Overlay (Optional)</div>
            <code className="text-amber-300">adb shell appops set com.callglitch.app SYSTEM_ALERT_WINDOW allow</code>
          </div>
        </div>
      </div>
    </div>
  );
};
