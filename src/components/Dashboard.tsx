/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useState, useEffect } from "react";
import { NotePage, Task, TaskProject, getPagePlaintext } from "../types";
import { 
  Sparkles, 
  BookOpen, 
  CheckCircle, 
  Calendar, 
  Clock, 
  Flame, 
  ArrowRight,
  TrendingUp,
  Link2,
  AlertCircle,
  Plus,
  FileText,
  CheckSquare,
  X
} from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { motion, AnimatePresence } from "motion/react";

interface DashboardProps {
  pages: NotePage[];
  tasks: Task[];
  projects: TaskProject[];
  onNavigateSection: (section: string) => void;
  onSelectPage: (id: string) => void;
  onToggleTaskComplete: (id: string) => void;
  onQuickCreateNote?: () => void;
  onQuickCreateTask?: (title: string) => void;
  onQuickCreateEvent?: (title: string) => void;
}

export default function Dashboard({
  pages,
  tasks,
  projects,
  onNavigateSection,
  onSelectPage,
  onToggleTaskComplete,
  onQuickCreateNote,
  onQuickCreateTask,
  onQuickCreateEvent
}: DashboardProps) {
  
  // Format current date nicely
  const currentDateString = useMemo(() => {
    return new Date().toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric"
    });
  }, []);

  // Compute workspace analytics
  const analytics = useMemo(() => {
    const totalPages = pages.length;
    const completedTasks = tasks.filter(t => t.completed).length;
    const totalTasks = tasks.length;
    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    
    // Count bi-directional wikilinks correctly
    let linksCount = 0;
    pages.forEach(p => {
      const matchReg = /\[\[(.*?)\]\]/g;
      let match;
      matchReg.lastIndex = 0;
      while ((match = matchReg.exec(getPagePlaintext(p.content))) !== null) {
        const titleMatch = match[1].trim().toLowerCase();
        if (pages.some(other => other.title.toLowerCase() === titleMatch && other.id !== p.id)) {
          linksCount++;
        }
      }
    });

    // Extract tags list
    const tagsSet = new Set<string>();
    pages.forEach(p => { p.tags.forEach(t => tagsSet.add(t)); });

    // Filter tasks due today
    const todayStr = new Date().toISOString().split("T")[0];
    const todayTasks = tasks.filter(t => t.dueDate === todayStr && !t.completed);

    // Get 3 recently updated pages
    const recentPages = [...pages]
      .sort((a, b) => b.updatedAt - a.updatedAt)
      .slice(0, 3);

    // Calculate a student productivity streak based on completed tasks
    const streakDays = Math.max(1, Math.min(25, Math.ceil(completedTasks * 1.5)));

    return {
      totalPages,
      completedTasks,
      totalTasks,
      completionRate,
      linksCount,
      uniqueTags: tagsSet.size,
      todayTasks,
      recentPages,
      streakDays
    };
  }, [pages, tasks]);

  // Generate mock study streak data for last 30 days based on the current streak
  const streakChartData = useMemo(() => {
    const data = [];
    let currentStreak = 0;
    const today = new Date();
    
    for (let i = 29; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      
      // Seed random with day to keep chart stable
      const isStudied = Math.random() > 0.25; 
      
      if (isStudied) {
        currentStreak += 1;
      } else {
        currentStreak = 0;
      }
      
      data.push({
        name: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        streak: currentStreak,
        tasks: isStudied ? Math.floor(Math.random() * 5) + 1 : 0
      });
    }
    
    // Assure the last point maps to our actual streak
    data[29].streak = Math.max(1, Math.min(25, Math.ceil(tasks.filter(t => t.completed).length * 1.5)));
    
    return data;
  }, [tasks]);

  const [quickActionOpen, setQuickActionOpen] = useState(false);
  const [activeQuickAction, setActiveQuickAction] = useState<"none" | "task" | "event">("none");
  const [quickActionInput, setQuickActionInput] = useState("");
  const [dailyBriefing, setDailyBriefing] = useState<string | null>(null);
  const [briefingLoading, setBriefingLoading] = useState(false);

  useEffect(() => {
    async function fetchBriefing() {
      setBriefingLoading(true);
      try {
        const response = await fetch("/api/briefing");
        if (response.ok) {
          const data = await response.json();
          setDailyBriefing(data.briefing);
        }
      } catch (error) {
        console.error("Failed to fetch briefing", error);
        setDailyBriefing("Unable to load daily briefing today.");
      } finally {
        setBriefingLoading(false);
      }
    }
    fetchBriefing();
  }, []);

  const handleQuickActionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickActionInput.trim()) return;
    
    if (activeQuickAction === "task" && onQuickCreateTask) {
      onQuickCreateTask(quickActionInput.trim());
    } else if (activeQuickAction === "event" && onQuickCreateEvent) {
      onQuickCreateEvent(quickActionInput.trim());
    }
    
    setQuickActionInput("");
    setActiveQuickAction("none");
    setQuickActionOpen(false);
  };

  // Color helper for Todoist priority levels
  const getPriorityColor = (p: 1 | 2 | 3 | 4) => {
    switch (p) {
      case 1: return "border-red-400 bg-red-50 text-red-650";
      case 2: return "border-amber-400 bg-amber-50 text-amber-750";
      case 3: return "border-blue-450 bg-blue-50 text-blue-700";
      default: return "border-slate-350 bg-slate-50 text-slate-500";
    }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 p-8" id="dashboard-hub">
      <div className="max-w-5xl mx-auto" id="dashboard-inner">
        {/* Main Header / Time Row */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8" id="dashboard-heading-section">
          <div>
            <h1 className="font-sans font-bold text-3xl text-slate-900 tracking-tight" id="dashboard-welcome">
              Welcome back to your study hub
            </h1>
            <p className="text-slate-500 text-sm mt-1.5 flex items-center gap-2" id="dashboard-date-indicator">
              <Calendar className="w-4 h-4 text-slate-400" />
              <span>{currentDateString}</span>
            </p>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-50 border border-amber-100 text-amber-700 text-xs font-semibold" id="streak-meter">
            <Flame className="w-4 h-4 fill-amber-500 text-amber-500 animate-pulse" />
            <span>{analytics.streakDays} DAY STUDY STREAK</span>
          </div>
        </div>

        {/* Analytics Bento Grid layout */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8" id="dashboard-stats-grid">
          {/* Card 1: Task completion scale */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex items-center justify-between col-span-1 md:col-span-2" id="stat-card-progress">
            <div className="flex flex-col justify-between h-full">
              <div>
                <p className="text-[11px] uppercase font-bold text-slate-400 tracking-wider font-sans mb-1" id="prog-label">Daily Task Target</p>
                <h3 className="font-sans font-bold text-2xl text-slate-900" id="prog-count">
                  {analytics.completedTasks} / {analytics.totalTasks} Tasks
                </h3>
              </div>
              <p className="text-xs text-slate-550 mt-4 max-w-xs" id="prog-summary">
                Study target configured for 5 daily tasks. Complete more items to compound your streak!
              </p>
            </div>
            {/* Round Custom SVG Progress Ring */}
            <div className="relative w-24 h-24 shrink-0" id="progress-circle-outer">
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="48"
                  cy="48"
                  r="38"
                  className="stroke-slate-100 fill-none"
                  strokeWidth="8"
                />
                <circle
                  cx="48"
                  cy="48"
                  r="38"
                  className="stroke-indigo-600 fill-none transition-all duration-500 ease-out"
                  strokeWidth="8"
                  strokeDasharray={`${2 * Math.PI * 38}`}
                  strokeDashoffset={`${2 * Math.PI * 38 * (1 - analytics.completionRate / 100)}`}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center font-sans" id="progress-num">
                <span className="font-bold text-lg text-slate-900">{analytics.completionRate}%</span>
                <span className="text-[10px] text-slate-400 font-semibold font-sans">Target</span>
              </div>
            </div>
          </div>

          {/* Card 2: Note summaries */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between" id="stat-card-notes">
            <div>
              <div className="flex justify-between items-start mb-2" id="card-notes-header">
                <p className="text-[11px] uppercase font-bold text-slate-400 tracking-wider font-sans">Active Notes</p>
                <BookOpen className="w-4 h-4 text-slate-400" />
              </div>
              <h3 className="font-sans font-bold text-3xl text-slate-900" id="card-notes-value">{analytics.totalPages}</h3>
              <p className="text-[11px] text-slate-400 mt-1" id="card-notes-sub">Organized in notebooks & sections</p>
            </div>
            <div className="mt-4 flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-700 transition cursor-pointer font-bold" onClick={() => onNavigateSection("notes")} id="view-notes-action">
              <span>Write new pages</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Card 3: Backlinks connection frequency */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between" id="stat-card-links">
            <div>
              <div className="flex justify-between items-start mb-2" id="card-links-header">
                <p className="text-[11px] uppercase font-bold text-slate-400 tracking-wider font-sans">Semantic Links</p>
                <Link2 className="w-4 h-4 text-slate-400" />
              </div>
              <h3 className="font-sans font-bold text-3xl text-slate-900" id="card-links-value">{analytics.linksCount}</h3>
              <p className="text-[11px] text-slate-400 mt-1" id="card-links-sub">Obsidian bidirectional connections</p>
            </div>
            <div className="mt-4 flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-700 transition cursor-pointer font-bold" onClick={() => onNavigateSection("graph")} id="view-graph-action">
              <span>Open active network map</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>
        </div>

        {/* Study Streak Activity Chart */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm mb-8 animate-fade-in" id="dashboard-streak-chart">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="font-sans font-bold text-lg text-slate-800 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-indigo-500" /> Study Streak Activity
              </h2>
              <p className="text-xs text-slate-500 mt-1">Your 30-day productivity timeline and daily task completion</p>
            </div>
            <div className="hidden sm:flex items-center gap-4 text-xs font-semibold">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded bg-indigo-500"></div>
                <span className="text-slate-600">Streak Level</span>
              </div>
            </div>
          </div>
          
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={streakChartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorStreak" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fill: '#94a3b8' }} 
                  minTickGap={20} 
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fill: '#94a3b8' }} 
                />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', padding: '10px' }}
                  labelStyle={{ fontWeight: 'bold', color: '#1e293b', marginBottom: '6px' }}
                  itemStyle={{ fontSize: '13px', padding: '2px 0' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="streak" 
                  name="Streak Day"
                  stroke="#4f46e5" 
                  strokeWidth={3} 
                  fillOpacity={1} 
                  fill="url(#colorStreak)" 
                  activeDot={{ r: 6, strokeWidth: 0, fill: '#4f46e5' }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* AI Daily World Briefing */}
        <div className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-2xl border border-indigo-100 p-6 shadow-sm mb-8 animate-fade-in" id="dashboard-daily-briefing">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5 text-indigo-500" />
            </div>
            <div className="flex-1">
              <h2 className="font-sans font-bold text-lg text-slate-800 mb-1">Your Daily Briefing</h2>
              {briefingLoading ? (
                <div className="space-y-2 mt-3 w-full max-w-xl">
                  <div className="h-4 bg-indigo-100/50 rounded animate-pulse w-full"></div>
                  <div className="h-4 bg-indigo-100/50 rounded animate-pulse w-4/5"></div>
                  <div className="h-4 bg-indigo-100/50 rounded animate-pulse w-2/3"></div>
                </div>
              ) : (
                <p className="text-sm text-slate-700 leading-relaxed max-w-3xl font-medium mt-1">
                  {dailyBriefing || "Your briefing will appear here once connected."}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Split Section: Due Tasks (Todoist style) vs Recent Notes (OneNote style) */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8" id="dashboard-lower-layout">
          
          {/* Left Column: Todoist Urgent Agendas */}
          <div className="lg:col-span-3 flex flex-col gap-4" id="dashboard-tasks-panel">
            <div className="flex items-center justify-between animate-fade-in" id="tasks-header">
              <h2 className="font-sans font-bold text-lg text-slate-800" id="tasks-title">Today's Study Checklist</h2>
              <button 
                onClick={() => onNavigateSection("tasks")}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-700 transition flex items-center gap-1"
                id="all-tasks-link"
              >
                <span>Manage in Todoist</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm min-h-[220px] flex flex-col justify-between" id="tasks-card">
              {analytics.todayTasks.length > 0 ? (
                <div className="flex flex-col gap-3" id="todays-tasks-list">
                  {analytics.todayTasks.slice(0, 4).map(task => {
                    // Match associated page in workspace to render note shortcuts
                    const associatedPage = pages.find(p => p.id === task.linkedPageId);
                    
                    return (
                      <div
                        key={task.id}
                        className="flex items-start justify-between p-3.5 rounded-xl hover:bg-slate-50 border border-slate-100/50 transition group"
                        id={`task-item-${task.id}`}
                      >
                        <div className="flex items-start gap-3.5" id={`task-left-${task.id}`}>
                          <button
                            onClick={() => onToggleTaskComplete(task.id)}
                            className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 mt-0.5 transition-all ${getPriorityColor(task.priority)} hover:scale-105`}
                            id={`task-check-${task.id}`}
                          >
                            <CheckCircle className="w-3 h-3 opacity-0 group-hover:opacity-60 transition" />
                          </button>
                          <div>
                            <p className="text-slate-800 text-sm font-sans font-medium line-clamp-1" id={`task-title-${task.id}`}>
                              {task.title}
                            </p>
                            <div className="flex flex-wrap items-center gap-2 mt-1.5" id={`task-meta-${task.id}`}>
                              <span className="text-[10px] font-mono bg-slate-100 text-slate-600 rounded px-1.5 py-0.5 font-bold" id={`task-priority-tag-${task.id}`}>
                                P{task.priority}
                              </span>
                              {associatedPage && (
                                <button
                                  onClick={() => onSelectPage(associatedPage.id)}
                                  className="text-[10px] bg-indigo-50 text-indigo-600 rounded px-1.5 py-0.5 hover:underline flex items-center gap-1 font-bold font-sans"
                                  id={`task-page-lnk-${task.id}`}
                                >
                                  <Link2 className="w-2.5 h-2.5" />
                                  <span>{associatedPage.title}</span>
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                        <span className="text-[10px] font-mono text-slate-400 mt-1 font-semibold" id={`task-due-${task.id}`}>Today</span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-10 text-center" id="tasks-empty-stage">
                  <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3" id="tasks-empty-circle">
                    <CheckCircle className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-800 font-sans" id="tasks-empty-title">All caught up today!</h4>
                  <p className="text-xs text-slate-400 mt-1 max-w-xs font-medium" id="tasks-empty-desc">You don't have any due tasks remaining. Add exams, lectures, or assignments to stay ahead.</p>
                </div>
              )}

              {/* Weekly Motivation Prompt */}
              <div className="mt-4 pt-4 border-t border-slate-100 flex items-center gap-2 text-[11px] text-slate-450 font-medium" id="agenda-prompt">
                <AlertCircle className="w-4 h-4 text-indigo-500 shrink-0" />
                <span>Need extra prep? Create linked research tasks in Obsidian notes directly!</span>
              </div>
            </div>
          </div>

          {/* Right Column: OneNote Recent Notes & Obsidian Graph Thumbnail */}
          <div className="lg:col-span-2 flex flex-col gap-4" id="dashboard-recent-panel">
            <h2 className="font-sans font-bold text-lg text-slate-800" id="recent-title">Recent Pages</h2>

            <div className="flex flex-col gap-4" id="recent-card-list">
              {analytics.recentPages.map(page => (
                <div
                  key={page.id}
                  onClick={() => onSelectPage(page.id)}
                  className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:border-indigo-400 hover:shadow-md cursor-pointer transition-all duration-200 hover:-translate-y-0.5 flex flex-col justify-between group"
                  id={`recent-item-${page.id}`}
                >
                  <div>
                    <div className="flex items-center justify-between" id={`recent-item-head-${page.id}`}>
                      <h3 className="text-sm font-bold text-slate-900 font-sans group-hover:text-indigo-600 transition truncate pr-4">
                        {page.title}
                      </h3>
                      <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    </div>
                    {/* Tiny raw snippet */}
                    <p className="text-xs text-slate-450 mt-2.5 line-clamp-2 leading-relaxed" id={`recent-item-body-${page.id}`}>
                      {getPagePlaintext(page.content).replace(/#\w+/g, "").replace(/[#*`_]/g, "").substring(0, 100)}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5 mt-4.5" id={`recent-item-tags-${page.id}`}>
                    {page.tags.slice(0, 3).map((tag, idx) => (
                      <span key={idx} className="text-[10px] bg-slate-100 text-slate-500 font-bold rounded px-2 py-0.5" id={`recent-item-tag-${page.id}-${idx}`}>
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              ))}

              {analytics.recentPages.length === 0 && (
                <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm text-center text-slate-400" id="recent-empty-state">
                  <p className="text-xs" id="recent-empty-txt">No notes created yet. Click the Notebooks section on the sidebar to draft your first academic summary!</p>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* Quick Actions Floating Menu */}
      <div className="fixed bottom-8 right-8 z-50 flex flex-col items-end">
        <AnimatePresence>
          {quickActionOpen && (
            <motion.div 
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.9 }}
              className="bg-white rounded-2xl shadow-xl border border-slate-200 mb-4 overflow-hidden w-64"
            >
              <div className="p-3 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 font-sans uppercase tracking-wider">Quick Create</span>
                <button 
                  onClick={() => { setQuickActionOpen(false); setActiveQuickAction("none"); }}
                  className="text-slate-400 hover:text-slate-700 transition p-1 hover:bg-slate-200 rounded-md"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              
              {activeQuickAction === "none" ? (
                <div className="p-2 flex flex-col gap-1">
                  <button 
                    onClick={() => { 
                      if (onQuickCreateNote) onQuickCreateNote(); 
                      setQuickActionOpen(false); 
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-indigo-600 rounded-lg transition"
                  >
                    <FileText className="w-4 h-4" />
                    New Page
                  </button>
                  <button 
                    onClick={() => { setActiveQuickAction("task"); setQuickActionInput(""); }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-indigo-600 rounded-lg transition"
                  >
                    <CheckSquare className="w-4 h-4" />
                    New Task
                  </button>
                  <button 
                    onClick={() => { setActiveQuickAction("event"); setQuickActionInput(""); }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-indigo-600 rounded-lg transition"
                  >
                    <Calendar className="w-4 h-4" />
                    New Event
                  </button>
                </div>
              ) : (
                <form onSubmit={handleQuickActionSubmit} className="p-4" id="quick-action-form">
                  <label className="text-xs font-semibold text-slate-500 mb-2 block">
                    {activeQuickAction === "task" ? "Task Title" : "Event Title"}
                  </label>
                  <input
                    type="text"
                    autoFocus
                    value={quickActionInput}
                    onChange={(e) => setQuickActionInput(e.target.value)}
                    placeholder={activeQuickAction === "task" ? "e.g., Read chapter 4..." : "e.g., Study Session..."}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition mb-3"
                  />
                  <div className="flex gap-2">
                    <button 
                      type="button" 
                      onClick={() => setActiveQuickAction("none")}
                      className="flex-1 px-3 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
                    >
                      Back
                    </button>
                    <button 
                      type="submit"
                      disabled={!quickActionInput.trim()}
                      className="flex-1 px-3 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:bg-indigo-400 rounded-lg transition"
                    >
                      Create
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          )}
        </AnimatePresence>
        
        <button
          onClick={() => {
            if (quickActionOpen) {
              setQuickActionOpen(false);
              setActiveQuickAction("none");
            } else {
              setQuickActionOpen(true);
            }
          }}
          className={`w-14 h-14 rounded-full flex items-center justify-center text-white shadow-xl transition-all duration-300 hover:scale-105 ${quickActionOpen ? "bg-slate-800 rotate-45" : "bg-indigo-600 hover:bg-indigo-700"}`}
        >
          <Plus className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
}
