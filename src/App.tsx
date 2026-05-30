/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { Sparkles, Download, RefreshCw, X, AlertCircle } from "lucide-react";
import Sidebar from "./components/Sidebar";
import Dashboard from "./components/Dashboard";
import NoteEditor from "./components/NoteEditor";
import TauriTitleBar from "./components/TauriTitleBar";
import CalendarComponent from "./components/CalendarComponent";
import SettingsView from "./components/SettingsView";
import { INITIAL_STATE } from "./data/initialData";
import { WorkspaceState, NotePage, Task, Notebook, Section, TaskProject, CalendarEvent } from "./types";
import { useAuth } from "./AuthProvider";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "./firebase";

const LOCAL_STORAGE_KEY = "almanac_suite_workspace_data";

export default function App() {
  const { user, signInWithGoogle, logout, loading } = useAuth();

  // Tauri Automatic Updater Integration
  const [updateInfo, setUpdateInfo] = useState<{
    available: boolean;
    version: string;
    body: string;
  } | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const checkAppUpdates = async () => {
      try {
        const isTauri = typeof window !== "undefined" && (
          (window as any).__TAURI__ !== undefined || 
          (window as any).__TAURI_IPC__ !== undefined || 
          (window as any).__TAURI_METADATA__ !== undefined
        );
        if (!isTauri) return;

        const { check } = await import("@tauri-apps/plugin-updater");
        const update = await check();
        if (update && active) {
          setUpdateInfo({
            available: true,
            version: update.version || "latest",
            body: update.body || "A new update is available with outstanding improvements and features.",
          });
          setIsUpdating(true);
          
          try {
            const { relaunch } = await import("@tauri-apps/plugin-process");
            
            await update.downloadAndInstall();
            await relaunch();
          } catch (err: any) {
            console.error("Auto-Updater installation failed: ", err);
            if (active) {
              setUpdateError(err.message || String(err));
              setIsUpdating(false);
            }
          }
        }
      } catch (err: any) {
        console.error("Tauri Auto-Updater check failed: ", err);
      }
    };

    // Fast check on mount
    const timer = setTimeout(checkAppUpdates, 1500);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, []);

  const handlePerformUpdate = async () => {
    setIsUpdating(true);
    setUpdateError(null);
    try {
      const { check } = await import("@tauri-apps/plugin-updater");
      const { relaunch } = await import("@tauri-apps/plugin-process");
      
      const update = await check();
      if (update) {
        await update.downloadAndInstall();
        await relaunch();
      }
    } catch (err: any) {
      console.error("Auto-Updater Installation failed: ", err);
      setUpdateError(err.message || String(err));
      setIsUpdating(false);
    }
  };
  
  // safe state hooks for UI customization settings
  const [uiTheme, setUiTheme] = useState<string>(() => {
    try {
      return localStorage.getItem("almanac_suite_ui_theme") || "cupertino-light";
    } catch {
      return "cupertino-light";
    }
  });

  const [radiusStyle, setRadiusStyle] = useState<"brutalist" | "balanced" | "pill">(() => {
    try {
      return (localStorage.getItem("almanac_suite_radius_style") as any) || "balanced";
    } catch {
      return "balanced";
    }
  });

  const [fontSizeStyle, setFontSizeStyle] = useState<"compact" | "normal" | "cozy">(() => {
    try {
      return (localStorage.getItem("almanac_suite_font_size_style") as any) || "normal";
    } catch {
      return "normal";
    }
  });

  const [glassMode, setGlassMode] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem("almanac_suite_glass_mode");
      return stored !== null ? stored === "true" : true;
    } catch {
      return true;
    }
  });

  const handleChangeTheme = (theme: string) => {
    setUiTheme(theme);
    try {
      localStorage.setItem("almanac_suite_ui_theme", theme);
    } catch {}
  };

  const handleChangeRadius = (radius: "brutalist" | "balanced" | "pill") => {
    setRadiusStyle(radius);
    try {
      localStorage.setItem("almanac_suite_radius_style", radius);
    } catch {}
  };

  const handleChangeFontSize = (size: "compact" | "normal" | "cozy") => {
    setFontSizeStyle(size);
    try {
      localStorage.setItem("almanac_suite_font_size_style", size);
    } catch {}
  };

  const handleToggleGlassMode = (enabled: boolean) => {
    setGlassMode(enabled);
    try {
      localStorage.setItem("almanac_suite_glass_mode", String(enabled));
    } catch {}
  };

  // Safe initialization of complete Workspace State from Local Storage or static demo template
  const [state, setState] = useState<WorkspaceState>(() => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.notebooks && parsed.pages && parsed.tasks) {
          if (!parsed.events) {
            parsed.events = INITIAL_STATE.events || [];
          }
          return parsed;
        }
      }
    } catch (e) {
      console.error("Failed to parse stored workspace state:", e);
    }
    return INITIAL_STATE;
  });

  // Safe persist-aware initialization of left sidebar collapse
  const [isLeftSidebarCollapsed, setIsLeftSidebarCollapsed] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem("almanac_suite_left_sidebar_collapsed");
      return stored === "true";
    } catch {
      return false;
    }
  });

  const handleToggleLeftSidebar = () => {
    setIsLeftSidebarCollapsed(prev => {
      const newVal = !prev;
      try {
        localStorage.setItem("almanac_suite_left_sidebar_collapsed", String(newVal));
      } catch (e) {}
      return newVal;
    });
  };



  // Current view layout: "dashboard" | "notes" | "tasks" | "graph"
  const [activeTab, setActiveTab] = useState<string>("dashboard");
  
  // Highlighting specific page within notebook editor
  const [selectedPageId, setSelectedPageId] = useState<string | null>(null);

  // Auto-sync State updates to localStorage and Firestore
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [cloudLoaded, setCloudLoaded] = useState<boolean>(false);
  
  // 1. Fetch remote data upon login to prevent over-writing cloud data with local empty state
  useEffect(() => {
    let isActive = true;
    if (user && !loading && !cloudLoaded) {
      setIsSyncing(true);
      import("firebase/firestore").then(async ({ getDoc, doc }) => {
        try {
          const workspaceRef = doc(db, `users/${user.uid}/workspace`, 'main');
          const docSnap = await getDoc(workspaceRef);
          if (docSnap.exists() && isActive) {
            const remoteData = JSON.parse(docSnap.data().data);
            if (remoteData && remoteData.pages) {
              setState(remoteData);
            }
          } else if (isActive) {
            // Securely reset to INITIAL_STATE to prevent leaking previous user's localStorage cache
            setState(INITIAL_STATE);
          }
        } catch (e) {
          console.error("Failed to load from Firestore", e);
        } finally {
          if (isActive) {
            setCloudLoaded(true);
            setIsSyncing(false);
          }
        }
      });
    }
    return () => { isActive = false; };
  }, [user, loading, cloudLoaded]);

  // 2. Sync changes back to Firestore / Local Storage
  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(state));
    
    // Crucial patch: Don't accidentally wipe firestore if cloud data isn't merged yet
    if (user && !loading && cloudLoaded) {
      setIsSyncing(true);
      const timeoutId = setTimeout(async () => {
        try {
          const workspaceRef = doc(db, `users/${user.uid}/workspace`, 'main');
          await setDoc(workspaceRef, { 
            data: JSON.stringify(state), 
            updatedAt: serverTimestamp() 
          }, { merge: true });
        } catch (e) {
          console.error("Failed to sync to Firestore", e);
        } finally {
          setIsSyncing(false);
        }
      }, 1500); // debounce 1.5s
      
      return () => clearTimeout(timeoutId);
    }
  }, [state, user, loading, cloudLoaded]);

  // CORE ACTIONS FOR NOTEBOOKS, SECTIONS, PAGES
  const handleAddNotebook = (title: string) => {
    const newNb: Notebook = {
      id: `nb-${Date.now()}`,
      title,
      createdAt: Date.now()
    };
    setState(prev => ({
      ...prev,
      notebooks: [...prev.notebooks, newNb]
    }));
  };

  const handleAddSection = (notebookId: string, title: string, color: string) => {
    const newSec: Section = {
      id: `sec-${Date.now()}`,
      notebookId,
      title,
      color
    };
    setState(prev => ({
      ...prev,
      sections: [...prev.sections, newSec]
    }));
  };

  const handleAddPage = (notebookId: string, sectionId: string) => {
    const newPage: NotePage = {
      id: `page-${Date.now()}`,
      notebookId,
      sectionId,
      title: "Untitled concept",
      content: `# Untitled concept\n\nWrite some insights here... Use double-brackets [[Page Title]] to link thoughts together.`,
      tags: [],
      updatedAt: Date.now()
    };

    setState(prev => ({
      ...prev,
      pages: [...prev.pages, newPage]
    }));
    
    // Auto-navigate focus onto the newly created page immediately!
    setSelectedPageId(newPage.id);
  };

  const handleUpdatePage = (id: string, updates: Partial<NotePage>) => {
    setState(prev => ({
      ...prev,
      pages: prev.pages.map(p => p.id === id ? { ...p, ...updates, updatedAt: Date.now() } : p)
    }));
  };

  const handleDeletePage = (id: string) => {
    setState(prev => ({
      ...prev,
      pages: prev.pages.filter(p => p.id !== id),
      // Clean up any tasks associated exclusively to this page
      tasks: prev.tasks.map(t => t.linkedPageId === id ? { ...t, linkedPageId: undefined } : t)
    }));
    if (selectedPageId === id) {
      setSelectedPageId(null);
    }
  };

  // CORE ACTIONS FOR TASKS & COURSE PROJECTS (TODOIST)
  const handleAddTask = (taskDetails: Omit<Task, "id" | "createdAt">) => {
    const newTask: Task = {
      ...taskDetails,
      id: `task-${Date.now()}`,
      createdAt: Date.now()
    };
    setState(prev => ({
      ...prev,
      tasks: [newTask, ...prev.tasks]
    }));
  };

  const handleUpdateTask = (id: string, updates: Partial<Task>) => {
    setState(prev => ({
      ...prev,
      tasks: prev.tasks.map(t => t.id === id ? { ...t, ...updates } : t)
    }));
  };

  const handleToggleTaskComplete = (id: string) => {
    setState(prev => ({
      ...prev,
      tasks: prev.tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t)
    }));
  };

  const handleDeleteTask = (id: string) => {
    setState(prev => ({
      ...prev,
      tasks: prev.tasks.filter(t => t.id !== id)
    }));
  };

  const handleAddProject = (name: string, color: string) => {
    const newProject: TaskProject = {
      id: `proj-${Date.now()}`,
      name,
      color
    };
    setState(prev => ({
      ...prev,
      projects: [...prev.projects, newProject]
    }));
  };

  // CORE ACTIONS FOR CALENDAR EVENTS (GOOGLE CALENDAR REPLICA)
  const handleAddEvent = (eventDetails: Omit<CalendarEvent, "id">) => {
    const newEvent: CalendarEvent = {
      ...eventDetails,
      id: `event-${Date.now()}`
    };
    setState(prev => ({
      ...prev,
      events: [newEvent, ...(prev.events || [])]
    }));
  };

  const handleUpdateEvent = (id: string, eventUpdates: Partial<CalendarEvent>) => {
    setState(prev => ({
      ...prev,
      events: (prev.events || []).map(evt => evt.id === id ? { ...evt, ...eventUpdates } : evt)
    }));
  };

  const handleDeleteEvent = (id: string) => {
    setState(prev => ({
      ...prev,
      events: (prev.events || []).filter(evt => evt.id !== id)
    }));
  };

  // Add inline link task from the note editor drawer directly
  const handleAddLinkedTask = (title: string, pageId: string) => {
    const associatedPage = state.pages.find(p => p.id === pageId);
    let targetProjId = state.projects[0]?.id || "proj-inbox";

    // Smart-guess course project matching the notebook
    if (associatedPage) {
      const matchedProj = state.projects.find(p => 
        p.name.toLowerCase().includes(associatedPage.title.toLowerCase()) || 
        associatedPage.title.toLowerCase().includes(p.name.toLowerCase().replace(/💻|🧪|📚|📥/g, "").trim())
      );
      if (matchedProj) targetProjId = matchedProj.id;
    }

    handleAddTask({
      title,
      priority: 2, // Default high/medium P2 priority from editor drawer
      completed: false,
      projectId: targetProjId,
      labels: ["linked"],
      linkedPageId: pageId
    });
  };

  // Jumps browser view to Note Editor and focuses on specified page
  const handleSelectPageAndNavigate = (pageId: string | null) => {
    setSelectedPageId(pageId);
    setActiveTab("notes");
  };

  const pendingTasksCount = state.tasks.filter(t => !t.completed).length;

  if (loading) {
    return (
      <div className={`flex flex-col h-screen bg-main-bg text-text-body overflow-hidden font-sans relative theme-${uiTheme} radius-${radiusStyle} density-${fontSizeStyle} ${glassMode ? "glass-backdrop-blur" : ""} items-center justify-center`}>
        <div className="animate-pulse flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-accent-main border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-text-muted font-medium">Loading workspace...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className={`flex flex-col h-screen bg-main-bg text-text-body overflow-hidden font-sans relative theme-${uiTheme} radius-${radiusStyle} density-${fontSizeStyle} ${glassMode ? "glass-backdrop-blur" : ""} items-center justify-center p-6`}>
        <div className="max-w-md w-full bg-card-bg border border-border-theme p-8 rounded-2xl shadow-xl flex flex-col items-center text-center">
          <div className="w-[60px] h-[60px] bg-accent-main text-white font-bold text-2xl shadow-[0_4px_20px_rgba(0,113,227,0.4)] flex items-center justify-center relative overflow-hidden mb-6" style={{ borderRadius: "22%" }}>
            <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent" />
            <span className="relative z-10">🎓</span>
          </div>
          <h1 className="text-2xl font-display font-bold text-text-title mb-2">Welcome to Almanac</h1>
          <p className="text-text-muted mb-8">A focused workspace for your notes, tasks, and calendar. Please sign in to continue.</p>
          <button 
            onClick={signInWithGoogle}
            className="w-full py-3 px-4 bg-accent-main hover:bg-accent-main/90 text-white rounded-xl font-medium transition cursor-pointer shadow-sm flex items-center justify-center gap-2"
          >
             Sign in with Google
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col h-screen bg-main-bg text-text-body overflow-hidden font-sans relative theme-${uiTheme} radius-${radiusStyle} density-${fontSizeStyle} ${glassMode ? "glass-backdrop-blur" : ""}`} id="applet-viewport">
      {/* Custom integrated Titlebar for Tauri environments */}
      <TauriTitleBar />

      <div className="flex flex-1 overflow-hidden w-full relative" id="applet-body-container">
        {/* Sidebar navigation */}
        <Sidebar
          activeSection={activeTab}
          onSectionChange={setActiveTab}
          userEmail={user.email || "student@university.edu"}
          notebooksCount={state.pages.length}
          pendingTasksCount={pendingTasksCount}
          isCollapsed={isLeftSidebarCollapsed}
          onToggleCollapse={handleToggleLeftSidebar}
        />

        {/* Main Switchboard Canvas views */}
        <main className="flex-1 flex flex-col overflow-hidden" id="main-content-display">
          {activeTab === "dashboard" && (
            <Dashboard
              pages={state.pages}
              tasks={state.tasks}
              projects={state.projects}
              onNavigateSection={setActiveTab}
              onSelectPage={handleSelectPageAndNavigate}
              onToggleTaskComplete={handleToggleTaskComplete}
              onQuickCreateNote={() => {
                const nbId = state.notebooks[0]?.id || `nb-${Date.now()}`;
                const secId = state.sections[0]?.id || `sec-${Date.now()}`;
                handleAddPage(nbId, secId);
              }}
              onQuickCreateTask={(title) => {
                handleAddTask({
                  title,
                  priority: 4,
                  completed: false,
                  projectId: state.projects[0]?.id,
                  labels: ["quick-add"]
                });
              }}
              onQuickCreateEvent={(title) => {
                const now = new Date();
                const later = new Date(now.getTime() + 60 * 60 * 1000);
                handleAddEvent({
                  title,
                  start: now.toISOString().slice(0, 16),
                  end: later.toISOString().slice(0, 16),
                  projectId: state.projects[0]?.id,
                  color: state.projects[0]?.color || "indigo"
                });
              }}
            />
          )}

          {activeTab === "gcal" && (
            <CalendarComponent
              events={state.events || []}
              projects={state.projects}
              pages={state.pages}
              tasks={state.tasks}
              onAddEvent={handleAddEvent}
              onUpdateEvent={handleUpdateEvent}
              onDeleteEvent={handleDeleteEvent}
              onNavigateToNote={handleSelectPageAndNavigate}
              onAddTask={handleAddTask}
              onUpdateTask={handleUpdateTask}
              onToggleTaskComplete={handleToggleTaskComplete}
              onDeleteTask={handleDeleteTask}
            />
          )}

          {activeTab === "notes" && (
            <NoteEditor
              notebooks={state.notebooks}
              sections={state.sections}
              pages={state.pages}
              tasks={state.tasks}
              onAddNotebook={handleAddNotebook}
              onAddSection={handleAddSection}
              onAddPage={handleAddPage}
              onUpdatePage={handleUpdatePage}
              onDeletePage={handleDeletePage}
              onAddLinkedTask={handleAddLinkedTask}
              onToggleTaskComplete={handleToggleTaskComplete}
              selectedPageId={selectedPageId}
              onSelectPage={setSelectedPageId}
              isSyncing={isSyncing}
            />
          )}

          {activeTab === "settings" && (
            <SettingsView
              uiTheme={uiTheme}
              onChangeTheme={handleChangeTheme}
              radiusStyle={radiusStyle}
              onChangeRadius={handleChangeRadius}
              fontSizeStyle={fontSizeStyle}
              onChangeFontSize={handleChangeFontSize}
              glassMode={glassMode}
              onToggleGlassMode={handleToggleGlassMode}
              userEmail="fujack2010@gmail.com"
            />
          )}
        </main>
      </div>

      {/* Dynamic Tauri Auto-Updater UI overlay */}
      {updateInfo && updateInfo.available && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-fade-in" id="updater-modal-overlay">
          <div className="max-w-md w-full bg-card-bg border border-border-theme p-6 rounded-2xl shadow-2xl flex flex-col relative" id="updater-dialog-container">
            {(!isUpdating || updateError) && (
              <button 
                onClick={() => setUpdateInfo(null)}
                className="absolute top-4 right-4 text-text-muted hover:text-text-body transition cursor-pointer"
                title="Close update dialog"
              >
                <X size={18} />
              </button>
            )}
            
            <div className="flex items-start gap-4 mb-4">
              <div className="w-12 h-12 rounded-xl bg-accent-main/10 text-accent-main flex items-center justify-center shrink-0">
                <Sparkles size={24} className="animate-pulse text-accent-main" />
              </div>
              <div className="flex-1">
                <span className="text-xs font-semibold px-2.5 py-1 bg-accent-main/10 text-accent-main rounded-full inline-block mb-1">
                  System Update
                </span>
                <h3 className="text-lg font-bold text-text-title font-display">Installing Update v{updateInfo.version}</h3>
              </div>
            </div>

            <p className="text-sm text-text-muted mb-4 leading-relaxed bg-main-bg/50 p-3 rounded-lg border border-border-theme/40 font-sans text-xs">
              {isUpdating 
                ? "Downloading and applying the latest changes. Please keep the app open; it will restart automatically to complete the update in a brief moment." 
                : "A new version of the desktop app is ready to install."
              }
            </p>

            {updateError && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 text-red-500 rounded-lg text-xs flex items-center gap-2">
                <AlertCircle size={14} className="shrink-0" />
                <span>Error: {updateError}</span>
              </div>
            )}

            <div className="flex gap-3 justify-end mt-2">
              {updateError ? (
                <>
                  <button
                    type="button"
                    onClick={() => setUpdateInfo(null)}
                    className="px-4 py-2 text-sm font-medium text-text-muted hover:bg-main-bg/80 rounded-xl transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handlePerformUpdate}
                    className="px-4 py-2 bg-accent-main hover:bg-accent-main/90 text-white rounded-xl text-sm font-medium transition cursor-pointer flex items-center gap-2"
                  >
                    <RefreshCw size={14} />
                    Retry Install
                  </button>
                </>
              ) : (
                <div className="flex items-center gap-2.5 text-xs text-text-muted py-2">
                  <RefreshCw size={14} className="animate-spin text-accent-main" />
                  <span>Installing automatically...</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
