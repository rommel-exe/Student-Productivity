import React, { useState } from "react";
import { Settings, User, Monitor, Key, Bell, Database, Cloud, Shield, Save, LogOut } from "lucide-react";
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
  const [activeTab, setActiveTab] = useState<"account" | "appearance" | "data" | "integrations" | "notifications">("appearance");
  const { logout } = useAuth();

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

        </div>
      </div>
    </div>
  );
}
