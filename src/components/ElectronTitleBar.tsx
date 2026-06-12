import React, { useEffect, useState } from "react";
import { GraduationCap, Minus, Square, X } from "lucide-react";

export default function ElectronTitleBar() {
  const [isElectron, setIsElectron] = useState(false);

  useEffect(() => {
    const isElectronEnv = typeof window !== "undefined" && (window as any).electronAPI !== undefined;
    if (isElectronEnv) {
      setIsElectron(true);
    }
  }, []);

  if (!isElectron) return null;

  const handleMinimize = () => {
    (window as any).electronAPI.minimize();
  };

  const handleMaximize = () => {
    (window as any).electronAPI.maximize();
  };

  const handleClose = () => {
    (window as any).electronAPI.close();
  };

  return (
    <div 
      className="h-10 bg-slate-100 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 select-none flex items-center justify-between px-4 text-xs text-slate-500 shrink-0 z-50 relative"
      style={{ WebkitAppRegion: "drag" } as any}
      id="electron-custom-titlebar"
    >
      {/* Draggable Title Area */}
      <div className="flex items-center gap-2 select-none pointer-events-none">
        <GraduationCap className="w-4.5 h-4.5 text-indigo-600 dark:text-indigo-400" />
        <span className="font-bold text-slate-800 dark:text-slate-200 font-sans">OneNote-Obsidian Desktop Studio</span>
        <span className="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 text-[10px] px-2.5 py-0.5 rounded-full font-sans font-bold flex items-center gap-1 border border-emerald-100 dark:border-emerald-900/40">
          <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
          Electron Desktop
        </span>
      </div>

      {/* Non-draggable control buttons */}
      <div 
        className="flex items-center gap-0.5"
        style={{ WebkitAppRegion: "no-drag" } as any}
        id="electron-titlebar-controls"
      >
        <button
          onClick={handleMinimize}
          className="p-1.5 text-slate-400 hover:text-slate-800 dark:hover:text-slate-100 hover:bg-slate-200 dark:hover:bg-slate-800 rounded transition duration-100 cursor-pointer flex items-center justify-center h-8 w-8"
          title="Minimize Window"
          id="window-control-minimize"
        >
          <Minus className="w-4 h-4" />
        </button>
        <button
          onClick={handleMaximize}
          className="p-1.5 text-slate-400 hover:text-slate-800 dark:hover:text-slate-100 hover:bg-slate-200 dark:hover:bg-slate-800 rounded transition duration-100 cursor-pointer flex items-center justify-center h-8 w-8"
          title="Maximize Window"
          id="window-control-maximize"
        >
          <Square className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={handleClose}
          className="p-1.5 text-slate-400 hover:text-white hover:bg-red-500 rounded transition duration-100 cursor-pointer flex items-center justify-center h-8 w-8"
          title="Close App"
          id="window-control-close"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
