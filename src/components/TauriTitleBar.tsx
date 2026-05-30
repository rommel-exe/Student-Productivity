import React, { useEffect, useState } from "react";
import { GraduationCap, Minus, Square, X } from "lucide-react";

export default function TauriTitleBar() {
  const [isTauri, setIsTauri] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    // Check defined Tauri environment
    const isTauriEnv = typeof window !== "undefined" && (
      (window as any).__TAURI__ !== undefined || 
      (window as any).__TAURI_IPC__ !== undefined || 
      (window as any).__TAURI_METADATA__ !== undefined
    );
    if (isTauriEnv) {
      setIsTauri(true);
    }
  }, []);

  if (!isTauri) return null;

  const handleMinimize = async () => {
    try {
      const windowApi = await import("@tauri-apps/api/window");
      const appWindow = typeof (windowApi as any).getCurrentWindow === "function" 
        ? (windowApi as any).getCurrentWindow() 
        : (windowApi as any).appWindow;
      
      if (appWindow) {
        await appWindow.minimize();
      }
    } catch (e) {
      console.error("Tauri minimize error:", e);
    }
  };

  const handleMaximize = async () => {
    try {
      const windowApi = await import("@tauri-apps/api/window");
      const appWindow = typeof (windowApi as any).getCurrentWindow === "function" 
        ? (windowApi as any).getCurrentWindow() 
        : (windowApi as any).appWindow;
      
      if (appWindow) {
        if (typeof appWindow.toggleMaximize === "function") {
          await appWindow.toggleMaximize();
        } else if (typeof appWindow.maximize === "function") {
          const isMaxState = await appWindow.isMaximized();
          if (isMaxState) {
            await appWindow.unmaximize();
          } else {
            await appWindow.maximize();
          }
        }
        const max = await appWindow.isMaximized();
        setIsFullscreen(max);
      }
    } catch (e) {
      console.error("Tauri toggle maximize error:", e);
    }
  };

  const handleClose = async () => {
    try {
      const windowApi = await import("@tauri-apps/api/window");
      const appWindow = typeof (windowApi as any).getCurrentWindow === "function" 
        ? (windowApi as any).getCurrentWindow() 
        : (windowApi as any).appWindow;
        
      if (appWindow) {
        await appWindow.close();
      }
    } catch (e) {
      console.error("Tauri close error:", e);
    }
  };

  return (
    <div 
      className="h-10 bg-slate-100 border-b border-slate-200 select-none flex items-center justify-between px-4 text-xs text-slate-500 shrink-0 z-50 relative"
      style={{ WebkitAppRegion: "drag" } as any}
      id="tauri-custom-titlebar"
    >
      {/* Draggable Title Area */}
      <div className="flex items-center gap-2 select-none pointer-events-none">
        <GraduationCap className="w-4.5 h-4.5 text-indigo-600" />
        <span className="font-bold text-slate-800 font-sans">OneNote-Obsidian Desktop Studio</span>
        <span className="bg-emerald-50 text-emerald-700 text-[10px] px-2.5 py-0.5 rounded-full font-sans font-bold flex items-center gap-1 border border-emerald-100">
          <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
          Tauri Native
        </span>
      </div>

      {/* Non-draggable control buttons */}
      <div 
        className="flex items-center gap-0.5"
        style={{ WebkitAppRegion: "no-drag" } as any}
        id="tauri-titlebar-controls"
      >
        <button
          onClick={handleMinimize}
          className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-200 rounded transition duration-100 cursor-pointer flex items-center justify-center h-8 w-8"
          title="Minimize Window"
          id="window-control-minimize"
        >
          <Minus className="w-4 h-4" />
        </button>
        <button
          onClick={handleMaximize}
          className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-200 rounded transition duration-100 cursor-pointer flex items-center justify-center h-8 w-8"
          title={isFullscreen ? "Restore Window" : "Maximize Window"}
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
