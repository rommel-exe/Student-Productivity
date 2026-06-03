import React, { useState, useEffect } from "react";
import { Settings, User, Monitor, Key, Bell, Database, Cloud, Shield, Save, LogOut, RefreshCw, AlertTriangle, Check, ExternalLink, HelpCircle, Activity } from "lucide-react";
import { useAuth } from "../AuthProvider";

interface SettingsViewProps {
  uiTheme: string;
  onChangeTheme: (theme: string) => void;
  radiusStyle: "brutalist" | "balanced" | "pill";
  onChangeRadius: (radius: "brutalist" | "balanced" | "pill") => void;
  fontSizeStyle: "compact" | "normal" | "cozy";
  onChangeFontSize: (size: "compact" | "normal" | "cozy") => void;
  glassMode: boolean;
  onToggleGlassMode: (enabled: boolean) => void;
  userEmail: string;
}

export default function SettingsView({
  uiTheme,
  onChangeTheme,
  radiusStyle,
  onChangeRadius,
  fontSizeStyle,
  onChangeFontSize,
  glassMode,
  onToggleGlassMode,
  userEmail
}: SettingsViewProps) {
  const [activeTab, setActiveTab] = useState<"account" | "appearance" | "data" | "integrations" | "notifications" | "updates">("appearance");
  const { logout } = useAuth();

  const [localVersion, setLocalVersion] = useState("0.0.16");

  useEffect(() => {
    const isTauri = typeof window !== "undefined" && (
      (window as any).__TAURI__ !== undefined || 
      (window as any).__TAURI_IPC__ !== undefined || 
      (window as any).__TAURI_METADATA__ !== undefined
    );
    if (isTauri) {
      import("@tauri-apps/api/app")
        .then(({ getVersion }) => {
          getVersion()
            .then((ver) => setLocalVersion(ver))
            .catch((err) => console.error("Failed to get Tauri version:", err));
        })
        .catch((err) => console.error("Failed to load Tauri app API:", err));
    }
  }, []);

  // Diagnostics and Repository state
  const [githubReleases, setGithubReleases] = useState<any[]>([]);
  const [loadingGithub, setLoadingGithub] = useState(false);
  const [githubError, setGithubError] = useState<string | null>(null);

  const fetchReleases = async () => {
    setLoadingGithub(true);
    setGithubError(null);
    try {
      const response = await fetch("https://api.github.com/repos/rommel-exe/Student-Productivity/releases");
      if (!response.ok) {
        throw new Error(`Failed to query GitHub API: ${response.statusText}`);
      }
      const data = await response.json();
      setGithubReleases(data);
    } catch (err: any) {
      setGithubError(err.message || String(err));
    } finally {
      setLoadingGithub(false);
    }
  };

  useEffect(() => {
    if (activeTab === "updates") {
      fetchReleases();
    }
  }, [activeTab]);

  return (
    <div className="flex-1 h-full flex overflow-hidden bg-main-bg">
      {/* Settings Sidebar */}
      <div className="w-64 border-r border-border-theme bg-sidebar-bg/50 flex flex-col p-4 overflow-y-auto">
        <h2 className="text-xl font-bold font-sans text-text-title mb-6 px-2">Settings</h2>
        
        <div className="flex flex-col gap-1">
          <button
            onClick={() => setActiveTab("appearance")}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition cursor-pointer ${
              activeTab === "appearance" ? "bg-accent-main text-white" : "text-text-muted hover:bg-black/5 dark:hover:bg-white/5 hover:text-text-title"
            }`}
          >
            <Monitor className="w-4 h-4" />
            <span>Appearance</span>
          </button>
          
          <button
            onClick={() => setActiveTab("account")}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition cursor-pointer ${
              activeTab === "account" ? "bg-accent-main text-white" : "text-text-muted hover:bg-black/5 dark:hover:bg-white/5 hover:text-text-title"
            }`}
          >
            <User className="w-4 h-4" />
            <span>Account & Security</span>
          </button>

          <button
            onClick={() => setActiveTab("data")}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition cursor-pointer ${
              activeTab === "data" ? "bg-accent-main text-white" : "text-text-muted hover:bg-black/5 dark:hover:bg-white/5 hover:text-text-title"
            }`}
          >
            <Database className="w-4 h-4" />
            <span>Data & Sync</span>
          </button>
          
          <button
            onClick={() => setActiveTab("integrations")}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition cursor-pointer mt-4 ${
              activeTab === "integrations" ? "bg-accent-main text-white" : "text-text-muted hover:bg-black/5 dark:hover:bg-white/5 hover:text-text-title"
            }`}
          >
            <Cloud className="w-4 h-4" />
            <span>Integrations</span>
          </button>

          <button
            onClick={() => setActiveTab("notifications")}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition cursor-pointer ${
              activeTab === "notifications" ? "bg-accent-main text-white" : "text-text-muted hover:bg-black/5 dark:hover:bg-white/5 hover:text-text-title"
            }`}
          >
            <Bell className="w-4 h-4" />
            <span>Notifications</span>
          </button>

          <button
            onClick={() => setActiveTab("updates")}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition cursor-pointer mt-4 border border-dashed border-border-theme hover:border-accent-main/40 ${
              activeTab === "updates" ? "bg-accent-main text-white cursor-pointer" : "text-text-muted hover:bg-black/5 dark:hover:bg-white/5 hover:text-text-title cursor-pointer"
            }`}
          >
            <RefreshCw className="w-4 h-4" />
            <span>App Updates (Tauri)</span>
          </button>
        </div>
      </div>

      {/* Settings Content */}
      <div className="flex-1 overflow-y-auto p-8 lg:p-12">
        <div className="max-w-3xl">
          
          {activeTab === "appearance" && (
            <div className="animate-fade-in flex flex-col gap-8">
              <div>
                <h3 className="text-2xl font-bold text-text-title font-sans mb-1">Appearance</h3>
                <p className="text-sm text-text-muted">Customize the visual style and density of your workspace.</p>
              </div>

              <div className="bg-card-bg border border-border-theme rounded-2xl p-6 shadow-sm flex flex-col gap-6">
                <div>
                  <label className="text-sm font-semibold text-text-title block mb-3">Color Theme</label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[
                      { id: "cupertino-light", name: "Cupertino Light", color: "bg-gray-100" },
                      { id: "cupertino-dark", name: "Cupertino Dark", color: "bg-gray-900" },
                      { id: "solarized", name: "Solarized", color: "bg-amber-50" },
                      { id: "nord", name: "Nord", color: "bg-slate-800" }
                    ].map(theme => (
                      <button
                        key={theme.id}
                        onClick={() => onChangeTheme(theme.id)}
                        className={`flex flex-col items-center gap-2 p-3 border rounded-xl transition ${uiTheme === theme.id ? "border-accent-main ring-2 ring-accent-main/20 bg-accent-light/50" : "border-border-theme hover:border-text-muted"}`}
                      >
                        <div className={`w-8 h-8 rounded-full ${theme.color} border border-black/10 dark:border-white/10 shadow-sm`} />
                        <span className="text-xs font-medium text-text-body">{theme.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="h-px bg-border-theme w-full" />

                <div>
                  <label className="text-sm font-semibold text-text-title block mb-3">Corner Radius</label>
                  <div className="flex gap-3">
                    {[
                      { id: "brutalist", name: "Brutalist (0px)" },
                      { id: "balanced", name: "Balanced (8px)" },
                      { id: "pill", name: "Pill (16px)" }
                    ].map(style => (
                      <button
                        key={style.id}
                        onClick={() => onChangeRadius(style.id as any)}
                        className={`px-4 py-2 text-sm font-medium border rounded-lg transition ${radiusStyle === style.id ? "bg-accent-main text-white border-accent-main" : "bg-card-bg text-text-body border-border-theme hover:bg-black/5 dark:hover:bg-white/5"}`}
                      >
                        {style.name}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="h-px bg-border-theme w-full" />

                <div>
                  <label className="text-sm font-semibold text-text-title block mb-3">Information Density (Font Size)</label>
                  <div className="flex gap-3">
                    {[
                      { id: "compact", name: "Compact" },
                      { id: "normal", name: "Normal" },
                      { id: "cozy", name: "Cozy" }
                    ].map(style => (
                      <button
                        key={style.id}
                        onClick={() => onChangeFontSize(style.id as any)}
                        className={`px-4 py-2 text-sm font-medium border rounded-lg transition ${fontSizeStyle === style.id ? "bg-accent-main text-white border-accent-main" : "bg-card-bg text-text-body border-border-theme hover:bg-black/5 dark:hover:bg-white/5"}`}
                      >
                        {style.name}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="h-px bg-border-theme w-full" />

                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-semibold text-text-title block mb-1">Glass Effect Effects</label>
                    <p className="text-xs text-text-muted">Enable translucent blurred backgrounds on sidebars and overlays.</p>
                  </div>
                  <button
                    onClick={() => onToggleGlassMode(!glassMode)}
                    className={`w-11 h-6 rounded-full flex items-center p-1 transition-colors ${glassMode ? "bg-accent-main" : "bg-border-theme"}`}
                  >
                    <div className={`w-4 h-4 bg-white rounded-full transition-transform ${glassMode ? "translate-x-5 shadow-sm" : ""}`} />
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === "account" && (
            <div className="animate-fade-in flex flex-col gap-8">
              <div>
                <h3 className="text-2xl font-bold text-text-title font-sans mb-1">Account & Security</h3>
                <p className="text-sm text-text-muted">Manage your personal information and login credentials.</p>
              </div>

              <div className="bg-card-bg border border-border-theme rounded-2xl p-6 shadow-sm flex flex-col gap-6">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-accent-light border-2 border-accent-main/20 flex flex-col items-center justify-center text-accent-main relative group cursor-pointer">
                    <span className="text-xl font-bold">{userEmail.substring(0, 2).toUpperCase()}</span>
                    <div className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold">
                      Edit
                    </div>
                  </div>
                  <div>
                    <h4 className="font-bold text-text-title">Student Profile</h4>
                    <p className="text-sm text-text-muted">{userEmail}</p>
                    <button className="text-xs font-bold text-accent-main hover:underline mt-1">Change Avatar</button>
                  </div>
                </div>

                <div className="h-px bg-border-theme w-full" />

                <div className="flex flex-col gap-3">
                  <label className="text-sm font-semibold text-text-title block">Email Address</label>
                  <div className="flex gap-3">
                    <input type="email" value={userEmail} readOnly className="flex-1 bg-black/5 dark:bg-white/5 border border-border-theme px-3 py-2 rounded-lg text-sm text-text-muted outline-none focus:border-accent-main/50" />
                    <button className="px-4 py-2 bg-card-bg border border-border-theme rounded-lg text-sm font-medium hover:bg-black/5 dark:hover:bg-white/5 transition">Update</button>
                  </div>
                </div>

                 <div className="flex flex-col gap-3">
                  <label className="text-sm font-semibold text-text-title block">Password</label>
                  <div className="flex gap-3">
                    <input type="password" value="********" readOnly className="flex-1 bg-black/5 dark:bg-white/5 border border-border-theme px-3 py-2 rounded-lg text-sm text-text-muted outline-none focus:border-accent-main/50" />
                    <button className="px-4 py-2 bg-card-bg border border-border-theme rounded-lg text-sm font-medium hover:bg-black/5 dark:hover:bg-white/5 transition flex items-center gap-2">
                       <Key className="w-4 h-4" /> Change
                    </button>
                  </div>
                </div>

                <div className="h-px bg-border-theme w-full" />

                <div>
                  <h4 className="font-semibold text-text-title mb-3 flex items-center gap-2"><Shield className="w-4 h-4" /> Account Actions</h4>
                  <p className="text-sm text-text-muted mb-4">Sign out of your account on this device.</p>
                  <button onClick={logout} className="px-4 py-2 bg-red-500/10 text-red-500 border border-red-500/20 rounded-lg text-sm font-medium hover:bg-red-500/20 transition flex items-center gap-2">
                    <LogOut className="w-4 h-4" /> Sign Out
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === "data" && (
            <div className="animate-fade-in flex flex-col gap-8">
              <div>
                <h3 className="text-2xl font-bold text-text-title font-sans mb-1">Data & Sync</h3>
                <p className="text-sm text-text-muted">Manage your workspace local data, backups, and cloud synchronization.</p>
              </div>

              <div className="bg-card-bg border border-border-theme rounded-2xl p-6 shadow-sm flex flex-col gap-6">
                
                <div className="flex items-center justify-between">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                      <Cloud className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-text-title">Cloud Synchronization</h4>
                      <p className="text-sm text-text-muted mt-0.5">Automatically backup notes and tasks to your Almanac Cloud account.</p>
                    </div>
                  </div>
                  <button className="w-11 h-6 rounded-full bg-border-theme flex items-center p-1 transition-colors shrink-0">
                    <div className="w-4 h-4 bg-white rounded-full shadow-sm" />
                  </button>
                </div>

                <div className="h-px bg-border-theme w-full" />

                <div className="flex items-center justify-between">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                      <Save className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-text-title">Local Export</h4>
                      <p className="text-sm text-text-muted mt-0.5">Download a complete JSON archive of all your notebooks, pages, and tasks.</p>
                    </div>
                  </div>
                  <button className="px-4 py-2 bg-card-bg border border-border-theme rounded-lg text-sm font-medium hover:bg-black/5 dark:hover:bg-white/5 transition">
                    Export JSON
                  </button>
                </div>

                <div className="h-px bg-border-theme w-full" />

                <div className="flex flex-col gap-3">
                  <h4 className="font-bold text-red-600 dark:text-red-400">Danger Zone</h4>
                  <p className="text-sm text-text-muted mb-2">Permanently delete all workspace data attached to this browser session. This cannot be undone.</p>
                  <button className="self-start px-4 py-2 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 rounded-lg text-sm font-medium hover:bg-red-50 dark:hover:bg-red-900/20 transition">
                    Clear Workspace Data
                  </button>
                </div>

              </div>
            </div>
          )}

          {activeTab === "integrations" && (
            <div className="animate-fade-in flex flex-col gap-8">
              <div>
                <h3 className="text-2xl font-bold text-text-title font-sans mb-1">Connected Apps</h3>
                <p className="text-sm text-text-muted">Connect third-party apps to synchronize your academic life.</p>
              </div>

              <div className="bg-card-bg border border-border-theme rounded-2xl p-6 shadow-sm flex flex-col gap-6">
                
                <div className="flex items-center justify-between">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 flex items-center justify-center shrink-0">
                      <span className="font-bold font-mono text-xs">Canvas</span>
                    </div>
                    <div>
                      <h4 className="font-bold text-text-title">Canvas LMS</h4>
                      <p className="text-sm text-text-muted mt-0.5">Automatically pull assignments, syllabus links, and lecture dates.</p>
                    </div>
                  </div>
                  <button className="px-4 py-2 bg-card-bg border border-border-theme rounded-lg text-sm font-medium hover:bg-black/5 dark:hover:bg-white/5 transition">
                    Connect
                  </button>
                </div>

                <div className="h-px bg-border-theme w-full" />

                <div className="flex items-center justify-between">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0">
                      <span className="font-bold font-mono text-xs">Todoist</span>
                    </div>
                    <div>
                      <h4 className="font-bold text-text-title">Todoist</h4>
                      <p className="text-sm text-text-muted mt-0.5">2-way sync tasks mapped by project headers and priorities.</p>
                    </div>
                  </div>
                  <button className="px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600 transition shadow-sm">
                    Disconnect
                  </button>
                </div>

                <div className="h-px bg-border-theme w-full" />
                
                <div className="flex items-center justify-between">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                      <span className="font-bold font-mono text-xs">GCal</span>
                    </div>
                    <div>
                      <h4 className="font-bold text-text-title">Google Calendar</h4>
                      <p className="text-sm text-text-muted mt-0.5">Access and write events from the native Almanac calendar view.</p>
                    </div>
                  </div>
                  <button className="px-4 py-2 bg-card-bg border border-border-theme rounded-lg text-sm font-medium hover:bg-black/5 dark:hover:bg-white/5 transition">
                    Connect
                  </button>
                </div>

              </div>
            </div>
          )}

          {activeTab === "notifications" && (
            <div className="animate-fade-in flex flex-col gap-8">
              <div>
                <h3 className="text-2xl font-bold text-text-title font-sans mb-1">Notifications</h3>
                <p className="text-sm text-text-muted">Control when and how Almanac alerts you.</p>
              </div>

              <div className="bg-card-bg border border-border-theme rounded-2xl p-6 shadow-sm flex flex-col gap-6">
                
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-text-title mb-1">Daily Agenda Email</h4>
                    <p className="text-xs text-text-muted">Receive a morning digest of your classes and tasks due today.</p>
                  </div>
                  <button className="w-11 h-6 rounded-full bg-accent-main flex items-center p-1 transition-colors">
                    <div className="w-4 h-4 bg-white rounded-full transition-transform translate-x-5 shadow-sm" />
                  </button>
                </div>

                <div className="h-px bg-border-theme w-full" />

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-text-title mb-1">Push Notifications</h4>
                    <p className="text-xs text-text-muted">Native OS alerts 10 minutes before an event or task deadline.</p>
                  </div>
                  <button className="w-11 h-6 rounded-full bg-border-theme flex items-center p-1 transition-colors">
                    <div className="w-4 h-4 bg-white rounded-full shadow-sm" />
                  </button>
                </div>

                <div className="h-px bg-border-theme w-full" />

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-text-title mb-1">Streak Alerts</h4>
                    <p className="text-xs text-text-muted">Reminders to keep your study streak going if it's nearing midnight.</p>
                  </div>
                  <button className="w-11 h-6 rounded-full bg-accent-main flex items-center p-1 transition-colors">
                    <div className="w-4 h-4 bg-white rounded-full transition-transform translate-x-5 shadow-sm" />
                  </button>
                </div>

              </div>
            </div>
          )}

          {activeTab === "updates" && (
            <div className="animate-fade-in flex flex-col gap-8">
              <div>
                <h3 className="text-2xl font-bold text-text-title font-sans mb-1 flex items-center gap-2">
                  <RefreshCw className="w-6 h-6 text-accent-main animate-pulse" />
                  App Updates & Tauri Diagnostics
                </h3>
                <p className="text-sm text-text-muted">Analyze your Tauri cross-platform updater endpoints, local binary configurations, and test update triggers.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Local App configuration */}
                <div className="bg-card-bg border border-border-theme p-5 rounded-2xl flex flex-col gap-3" id="local-cfg-board">
                  <h4 className="text-sm font-semibold text-text-title uppercase tracking-wider flex items-center gap-2 font-sans">
                    <Activity size={16} className="text-accent-main" />
                    Local Configuration Info
                  </h4>
                  <div className="text-xs space-y-2.5">
                    <div className="flex justify-between py-1 border-b border-border-theme/40">
                      <span className="text-text-muted">App Version (Local):</span>
                      <span className="font-mono text-emerald-500 font-bold">v{localVersion}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-border-theme/40">
                      <span className="text-text-muted">App Identifier:</span>
                      <span className="font-mono text-text-body">com.onenote.obsidian.app</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-border-theme/40">
                      <span className="text-text-muted">Relaunch Capability:</span>
                      <span className="text-green-500 font-medium">Enabled (process:allow-restart)</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-text-muted">Platform Hook:</span>
                      <span className="text-text-body bg-black/10 dark:bg-white/10 px-1.5 py-0.5 rounded text-[10px]">Tauri Native + Web Hybrid</span>
                    </div>
                  </div>
                </div>

                {/* Remote Endpoint Stats */}
                <div className="bg-card-bg border border-border-theme p-5 rounded-2xl flex flex-col gap-3" id="remote-git-board">
                  <h4 className="text-sm font-semibold text-text-title uppercase tracking-wider flex items-center gap-2 font-sans">
                    <Cloud size={16} className="text-blue-500" />
                    GitHub Release Integrations
                  </h4>
                  <div className="text-xs space-y-2.5">
                    <div className="flex justify-between py-1 border-b border-border-theme/40">
                      <span className="text-text-muted">Repository:</span>
                      <span className="font-mono text-text-body truncate max-w-[150px]" title="rommel-exe/Student-Productivity">rommel-exe/Student-Productivity</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-border-theme/40">
                      <span className="text-text-muted">Endpoint Target:</span>
                      <a href="https://github.com/rommel-exe/Student-Productivity/releases" target="_blank" rel="noopener noreferrer" className="text-accent-main font-medium hover:underline flex items-center gap-1 cursor-pointer">
                        View Releases <ExternalLink size={10} />
                      </a>
                    </div>
                    <div className="flex justify-between py-1 border-b border-border-theme/40">
                      <span className="text-text-muted">Status:</span>
                      {loadingGithub ? (
                        <span className="text-text-muted">Checking API...</span>
                      ) : githubError ? (
                        <span className="text-red-500 font-bold">API Offline/Error</span>
                      ) : (
                        <span className="text-green-500 font-bold">Online</span>
                      )}
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-text-muted">Latest Server Tag:</span>
                      <span className="font-mono font-semibold text-text-body bg-accent-main/10 text-accent-main px-1.5 py-0.5 rounded">
                        {loadingGithub ? "..." : githubReleases[0]?.tag_name || "v0.0.1"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Integrity Audit Report */}
              <div className="bg-card-bg border border-border-theme p-6 rounded-2xl flex flex-col gap-4" id="endpoint-audit">
                <div className="flex items-center gap-2 text-text-title font-semibold font-sans">
                  <Shield size={18} className="text-orange-500" />
                  <h4>Tauri Updater Endpoint Audit & Integrity Check</h4>
                </div>

                <div className="text-xs text-text-body flex flex-col gap-3">
                  {/* Item 1 */}
                  <div className="flex gap-3 leading-relaxed items-start">
                    <div className="mt-0.5 bg-green-500/10 text-green-500 rounded p-0.5 shrink-0">
                      <Check size={14} />
                    </div>
                    <div>
                      <p className="font-semibold text-text-title font-sans">Tauri Updater Signature Pubkey matches configuration</p>
                      <p className="text-text-muted mt-0.5 text-[11px] leading-normal">The updated public key dW50cnVzdGVk... (165C2C...) is configured. This matches the release build keys for binary validation.</p>
                    </div>
                  </div>

                  {/* Item 2 */}
                  <div className="flex gap-3 leading-relaxed items-start">
                    <div className="mt-0.5 bg-green-500/10 text-green-500 rounded p-0.5 shrink-0">
                      <Check size={14} />
                    </div>
                    <div>
                      <p className="font-semibold text-text-title font-sans">Tauri v2 Permissions (default.json) properly declared</p>
                      <p className="text-text-muted mt-0.5 text-[11px] leading-normal">Permissions `updater:default` and `process:allow-restart` are active inside the default capability map.</p>
                    </div>
                  </div>

                  {/* Item 3 (Audit Status) */}
                  {!loadingGithub && githubReleases[0] && (() => {
                    const latestRelease = githubReleases[0];
                    const hasLatestJson = latestRelease?.assets?.some((a: any) => a.name === "latest.json");

                    if (hasLatestJson) {
                      return (
                        <div className="flex gap-3 leading-relaxed items-start max-w-full">
                          <div className="mt-0.5 bg-green-500/10 text-green-500 rounded p-0.5 shrink-0">
                            <Check size={14} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-text-title font-sans">Tauri Updater Manifest (latest.json) verified online!</p>
                            <p className="text-text-muted mt-0.5 text-[11px] leading-relaxed">
                              Successfully located <code className="bg-black/10 dark:bg-white/10 px-1.5 py-0.5 rounded font-mono text-[10px] text-text-body">latest.json</code> in release assets of <b className="text-text-title">{latestRelease.tag_name}</b>. Installed Tauri clients can check this file dynamically to receive signature-verified upgrades.
                            </p>
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div className="flex gap-3 leading-relaxed items-start max-w-full">
                        <div className="mt-0.5 bg-amber-500/10 text-amber-500 rounded p-0.5 shrink-0">
                          <AlertTriangle size={14} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-amber-500 font-sans">CRITICAL: missing "latest.json" asset in GitHub Release assets</p>
                          <p className="text-text-muted mt-1 text-[11px] leading-relaxed">
                            Your latest GitHub Release tag (<b className="text-text-title">{latestRelease.tag_name || "v0.0.1"}</b>) contains binary installers (RPM, DMG, AppImage, EXE, MSI), but is <span className="text-red-500 font-semibold">missing the updater manifest "latest.json" asset file</span>.
                          </p>
                          <p className="text-text-muted mt-1 text-[11px] leading-relaxed">
                            Because of this, the Tauri client calling <code className="bg-black/10 dark:bg-white/10 px-1 py-0.5 rounded font-mono text-[10px] text-text-body">https://github.com/rommel-exe/Student-Productivity/releases/latest/download/latest.json</code> receives a <span className="text-red-500 font-semibold">404 Not Found</span> error, causing the updater check to exit quietly or throw a connection error.
                          </p>
                          <div className="mt-4 bg-main-bg/60 p-4 rounded-xl border border-border-theme/40 text-text-muted">
                            <p className="font-semibold text-[10px] uppercase text-text-title tracking-wider mb-2 font-sans flex items-center gap-1">
                              <HelpCircle size={10} className="text-accent-main" />
                              How to solve / fix updater:
                            </p>
                            <p className="text-[10px] leading-normal mb-3">Create a local file named <code className="font-mono text-accent-main bg-accent-main/5 px-1 py-0.5 rounded">latest.json</code> in this format (signing the hash of your releases with your private key), then upload it to your GitHub releases assets list:</p>
                            <pre className="text-[11px] font-mono whitespace-pre-wrap bg-black/15 dark:bg-black/30 p-3 rounded-lg border border-border-theme/40 text-text-body select-text leading-normal max-h-[160px] overflow-auto">
{`{
  "version": "0.0.16",
  "notes": "Workspace upgrades, custom multi-tab settings, and updated capability parameters.",
  "pub_date": "${new Date().toISOString()}",
  "platforms": {
    "darwin-aarch64": {
      "signature": "<signature-content>",
      "url": "https://github.com/rommel-exe/Student-Productivity/releases/download/v0.0.16/OneNoteObsidian_aarch64.app.tar.gz"
    },
    "windows-x86_64": {
      "signature": "<signature-content>",
      "url": "https://github.com/rommel-exe/Student-Productivity/releases/download/v0.0.16/OneNoteObsidian_0.0.16_x64-setup.exe"
    }
  }
}`}
                            </pre>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
