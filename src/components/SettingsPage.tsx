import React, { useState } from "react";
import { 
  Settings, 
  User, 
  Monitor, 
  Moon, 
  Sun, 
  Shield, 
  Bell, 
  Database,
  Smartphone,
  LogOut,
  Sliders,
  Check
} from "lucide-react";

interface SettingsPageProps {
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

export default function SettingsPage({
  uiTheme,
  onChangeTheme,
  radiusStyle,
  onChangeRadius,
  fontSizeStyle,
  onChangeFontSize,
  glassMode,
  onToggleGlassMode,
  userEmail
}: SettingsPageProps) {
  const [activeTab, setActiveTab] = useState<"account" | "appearance" | "notifications" | "data">("appearance");

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 p-8 h-full">
      <div className="max-w-4xl mx-auto space-y-8 pb-12">
        <div>
          <h1 className="text-3xl font-bold font-sans text-slate-900 tracking-tight">Settings</h1>
          <p className="text-slate-500 mt-1">Manage your account preferences and app appearance</p>
        </div>

        <div className="flex flex-col md:flex-row gap-8">
          {/* Sidebar Menu for Settings */}
          <div className="w-full md:w-64 shrink-0 space-y-1">
            <button
              onClick={() => setActiveTab("appearance")}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl font-medium text-sm transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500/50 ${activeTab === "appearance" ? "bg-white text-indigo-600 shadow-sm border border-slate-200" : "text-slate-600 hover:bg-slate-200/50"}`}
            >
              <Monitor className="w-5 h-5" />
              Appearance
            </button>
            <button
              onClick={() => setActiveTab("account")}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl font-medium text-sm transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500/50 ${activeTab === "account" ? "bg-white text-indigo-600 shadow-sm border border-slate-200" : "text-slate-600 hover:bg-slate-200/50"}`}
            >
              <User className="w-5 h-5" />
              Account & Profile
            </button>
            <button
              onClick={() => setActiveTab("notifications")}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl font-medium text-sm transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500/50 ${activeTab === "notifications" ? "bg-white text-indigo-600 shadow-sm border border-slate-200" : "text-slate-600 hover:bg-slate-200/50"}`}
            >
              <Bell className="w-5 h-5" />
              Notifications
            </button>
            <button
              onClick={() => setActiveTab("data")}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl font-medium text-sm transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500/50 ${activeTab === "data" ? "bg-white text-indigo-600 shadow-sm border border-slate-200" : "text-slate-600 hover:bg-slate-200/50"}`}
            >
              <Database className="w-5 h-5" />
              Data & Privacy
            </button>
          </div>

          {/* Settings Content Area */}
          <div className="flex-1 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm min-h-[500px]">
            {activeTab === "appearance" && (
              <div className="space-y-8 animate-fade-in">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 mb-4">Theme & Aesthetics</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div 
                      onClick={() => onChangeTheme("cupertino-light")}
                      className={`cursor-pointer p-4 rounded-xl border-2 transition-all ${uiTheme === "cupertino-light" ? "border-indigo-600 bg-indigo-50/50" : "border-slate-200 hover:border-slate-300 bg-slate-50"}`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2 text-slate-800 font-semibold font-sans">
                          <Sun className="w-4 h-4" /> Light
                        </div>
                        {uiTheme === "cupertino-light" && <Check className="w-4 h-4 text-indigo-600" />}
                      </div>
                      <p className="text-xs text-slate-500">Clean, bright workspace optimized for daytime study</p>
                    </div>

                    <div 
                      onClick={() => onChangeTheme("midnight-dark")}
                      className={`cursor-pointer p-4 rounded-xl border-2 transition-all ${uiTheme === "midnight-dark" ? "border-indigo-600 bg-slate-800" : "border-slate-200 hover:border-slate-300 bg-slate-900"}`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2 text-white font-semibold font-sans">
                          <Moon className="w-4 h-4" /> Dark
                        </div>
                        {uiTheme === "midnight-dark" && <Check className="w-4 h-4 text-indigo-400" />}
                      </div>
                      <p className="text-xs text-slate-400">Eye-strain reduction for late-night sessions</p>
                    </div>
                  </div>
                </div>

                <div className="pt-6 border-t border-slate-100">
                  <h3 className="text-lg font-bold text-slate-900 mb-4">Layout Styling</h3>
                  
                  <div className="space-y-6">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="font-semibold text-slate-700 text-sm">Corner Radius</label>
                        <span className="text-xs text-slate-500 font-mono capitalize">{radiusStyle}</span>
                      </div>
                      <div className="p-1 bg-slate-100 rounded-lg flex gap-1">
                        {(["brutalist", "balanced", "pill"] as const).map(style => (
                          <button
                            key={style}
                            onClick={() => onChangeRadius(style)}
                            className={`flex-1 py-1.5 text-xs font-semibold rounded-md capitalize transition-all ${radiusStyle === style ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
                          >
                            {style}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="font-semibold text-slate-700 text-sm">Typography Density</label>
                        <span className="text-xs text-slate-500 font-mono capitalize">{fontSizeStyle}</span>
                      </div>
                      <div className="p-1 bg-slate-100 rounded-lg flex gap-1">
                        {(["compact", "normal", "cozy"] as const).map(style => (
                          <button
                            key={style}
                            onClick={() => onChangeFontSize(style)}
                            className={`flex-1 py-1.5 text-xs font-semibold rounded-md capitalize transition-all ${fontSizeStyle === style ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
                          >
                            {style}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2">
                      <div>
                        <div className="font-semibold text-slate-700 text-sm mb-1">Mica Glass Effect</div>
                        <p className="text-xs text-slate-500">Enable frosted glass effects on sidebar and overlays (requires more GPU and only in Light theme)</p>
                      </div>
                      <button
                        onClick={() => onToggleGlassMode(!glassMode)}
                        className={`w-11 h-6 rounded-full transition-colors relative focus:outline-none focus:ring-2 focus:ring-indigo-500/50 ${glassMode ? "bg-indigo-600" : "bg-slate-300"}`}
                      >
                        <div className={`w-4 h-4 bg-white rounded-full absolute top-1 shadow-sm transition-transform ${glassMode ? "left-6" : "left-1"}`} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "account" && (
              <div className="space-y-8 animate-fade-in">
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 bg-indigo-100 text-indigo-700 rounded-2xl flex items-center justify-center font-bold text-2xl shrink-0">
                    {userEmail.substring(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-slate-900">{userEmail.split('@')[0]}</h3>
                    <p className="text-sm text-slate-500">{userEmail}</p>
                    <div className="mt-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-emerald-50 text-emerald-700 font-semibold text-xs border border-emerald-200">
                      <Shield className="w-3.5 h-3.5" /> Pro Academic License
                    </div>
                  </div>
                  <button className="px-4 py-2 border border-slate-200 text-slate-700 font-semibold text-sm rounded-xl hover:bg-slate-50 transition">
                    Edit Profile
                  </button>
                </div>

                <div className="pt-6 border-t border-slate-100 space-y-5">
                  <h3 className="text-lg font-bold text-slate-900 mb-2">Connected Accounts</h3>
                  <div className="flex items-center justify-between p-4 border border-slate-200 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded bg-slate-100 flex items-center justify-center text-slate-700">
                        <Smartphone className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-semibold text-sm text-slate-900">Google Calendar</div>
                        <div className="text-xs text-slate-500">Connected to {userEmail}</div>
                      </div>
                    </div>
                    <button className="text-sm font-semibold text-slate-500 hover:text-slate-800 transition">Disconnect</button>
                  </div>

                  <div className="flex items-center justify-between p-4 border border-slate-200 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded bg-slate-100 flex items-center justify-center text-slate-700">
                        <Database className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-semibold text-sm text-slate-900">Notion Workspace</div>
                        <div className="text-xs text-slate-500">Not connected</div>
                      </div>
                    </div>
                    <button className="text-sm font-semibold text-indigo-600 hover:text-indigo-700 transition">Connect</button>
                  </div>
                </div>

                <div className="pt-6 border-t border-slate-100">
                  <button className="w-full flex items-center justify-center gap-2 p-3 text-red-600 font-semibold text-sm hover:bg-red-50 rounded-xl transition">
                    <LogOut className="w-4 h-4" />
                    Sign Out on all devices
                  </button>
                </div>
              </div>
            )}

            {activeTab === "notifications" && (
              <div className="space-y-6 animate-fade-in">
                <h3 className="text-lg font-bold text-slate-900">Alerts & Reminders</h3>
                <div className="space-y-4">
                  {[
                    { id: "push", label: "Push Notifications", desc: "Get real-time updates directly on your device", enabled: true },
                    { id: "email", label: "Email Summary", desc: "Receive daily digest of due tasks & events", enabled: false },
                    { id: "tasks", label: "Overdue Task Warnings", desc: "Alert me when tasks fall behind schedule", enabled: true },
                    { id: "collab", label: "Calendar Conflicts", desc: "Warn before creating overlapping meetings", enabled: true },
                  ].map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-4 border border-slate-100 bg-slate-50/50 rounded-xl">
                      <div>
                        <div className="font-semibold text-slate-800 text-sm">{item.label}</div>
                        <div className="text-xs text-slate-500 mt-0.5">{item.desc}</div>
                      </div>
                      <button className={`w-11 h-6 rounded-full transition-colors relative focus:outline-none ${item.enabled ? "bg-indigo-600" : "bg-slate-300"}`}>
                        <div className={`w-4 h-4 bg-white rounded-full absolute top-1 shadow-sm transition-transform ${item.enabled ? "left-6" : "left-1"}`} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

             {activeTab === "data" && (
              <div className="space-y-6 animate-fade-in">
                <h3 className="text-lg font-bold text-slate-900">Data Controls</h3>
                
                <div className="p-4 border border-emerald-200 bg-emerald-50 rounded-xl">
                  <div className="flex items-start gap-3">
                    <Database className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-semibold text-emerald-900 text-sm">Local Execution Mode Active</div>
                      <p className="text-xs text-emerald-700 mt-1">Your data is stored exclusively in your browser and local filesystem. Almanac respects your privacy.</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <button className="w-full text-left p-4 border border-slate-200 hover:border-slate-300 rounded-xl transition group">
                    <div className="font-semibold text-slate-800 text-sm group-hover:text-indigo-600">Export Workspace Data</div>
                    <div className="text-xs text-slate-500 mt-1">Download all notes, tasks, and settings as JSON archive</div>
                  </button>
                  <button className="w-full text-left p-4 border border-slate-200 hover:border-slate-300 rounded-xl transition group">
                    <div className="font-semibold text-slate-800 text-sm group-hover:text-indigo-600">Clear Cache & Local Storage</div>
                    <div className="text-xs text-slate-500 mt-1">Free up space and resolve syncing issues (Safe)</div>
                  </button>
                  <button className="w-full text-left p-4 border border-red-200 bg-red-50/50 hover:bg-red-50 rounded-xl transition group">
                    <div className="font-semibold text-red-700 text-sm">Danger Zone: Delete Account & Data</div>
                    <div className="text-xs text-red-600 mt-1">Permanently remove your account and all associated workspace info</div>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
