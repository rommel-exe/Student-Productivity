/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from "react";
import { NotePage, Task, TaskProject, CalendarEvent } from "../types";
import { 
  Plus, 
  ChevronLeft, 
  ChevronRight, 
  Calendar, 
  Clock, 
  MapPin, 
  AlignLeft, 
  Trash2, 
  Edit3, 
  X, 
  Check, 
  CheckSquare,
  Sparkles,
  Link2,
  Folder,
  ArrowRight,
  ArrowUpDown
} from "lucide-react";

interface CalendarComponentProps {
  events: CalendarEvent[];
  projects: TaskProject[];
  pages: NotePage[];
  tasks: Task[];
  onAddEvent: (event: Omit<CalendarEvent, "id">) => void;
  onUpdateEvent: (id: string, event: Partial<CalendarEvent>) => void;
  onDeleteEvent: (id: string) => void;
  onNavigateToNote: (id: string) => void;
  onAddTask?: (task: Omit<Task, "id" | "createdAt">) => void;
  onUpdateTask?: (id: string, updates: Partial<Task>) => void;
  onToggleTaskComplete?: (id: string) => void;
  onDeleteTask?: (id: string) => void;
}

// Format date helper: "YYYY-MM-DD"
const formatDateString = (date: Date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

// Format time helper: "HH:MM"
const formatTimeString = (date: Date) => {
  const h = String(date.getHours()).padStart(2, "0");
  const m = String(date.getMinutes()).padStart(2, "0");
  return `${h}:${m}`;
};

export default function CalendarComponent({
  events,
  projects,
  pages,
  tasks,
  onAddEvent,
  onUpdateEvent,
  onDeleteEvent,
  onNavigateToNote,
  onAddTask,
  onUpdateTask,
  onToggleTaskComplete,
  onDeleteTask
}: CalendarComponentProps) {
  // Current view focal date
  const [currentDate, setCurrentDate] = useState<Date>(new Date(2026, 4, 27)); // Aligned default around May 27, 2026

  // Active view: "month" | "week" | "day"
  const [viewType, setViewType] = useState<"month" | "week" | "day">("month");

  // Filtered project categories
  const [visibleProjects, setVisibleProjects] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = { "tasks-todo": true };
    projects.forEach(p => {
      initial[p.id] = true;
    });
    return initial;
  });

  // Modal open states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedEventForDetail, setSelectedEventForDetail] = useState<CalendarEvent | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [taskSearchQuery, setTaskSearchQuery] = useState("");
  const [taskSortPriority, setTaskSortPriority] = useState(false);

  // Form fields for create/edit
  const [formType, setFormType] = useState<"event" | "task">("event");
  const [formTitle, setFormTitle] = useState("");
  const [formStartDate, setFormStartDate] = useState("2026-05-27");
  const [formStartTime, setFormStartTime] = useState("10:00");
  const [formEndDate, setFormEndDate] = useState("2026-05-27");
  const [formEndTime, setFormEndTime] = useState("11:00");
  const [formDescription, setFormDescription] = useState("");
  const [formProjectId, setFormProjectId] = useState("");
  const [formAllDay, setFormAllDay] = useState(false);
  const [formTaskPriority, setFormTaskPriority] = useState<1|2|3|4>(4);
  const [formTaskLabels, setFormTaskLabels] = useState("");

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Constants
  const MONTHS = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  // Navigate focal date
  const handlePrev = () => {
    setCurrentDate(prev => {
      const d = new Date(prev);
      if (viewType === "month") d.setMonth(d.getMonth() - 1);
      else if (viewType === "week") d.setDate(d.getDate() - 7);
      else d.setDate(d.getDate() - 1);
      return d;
    });
  };

  const handleNext = () => {
    setCurrentDate(prev => {
      const d = new Date(prev);
      if (viewType === "month") d.setMonth(d.getMonth() + 1);
      else if (viewType === "week") d.setDate(d.getDate() + 7);
      else d.setDate(d.getDate() + 1);
      return d;
    });
  };

  const handleGoToday = () => {
    setCurrentDate(new Date(2026, 4, 27)); // go back to today context
  };

  // Monthly Calculation: Returns dates of current month grid (35 or 42 days)
  const monthGrid = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    // Start of the month
    const firstDayIndex = new Date(year, month, 1).getDay();
    // Days in current month
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    // Days in previous month
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    const arr: { date: Date; isCurrentMonth: boolean; isToday: boolean }[] = [];

    // Prev month overflow days
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const d = new Date(year, month - 1, daysInPrevMonth - i);
      arr.push({ date: d, isCurrentMonth: false, isToday: false });
    }

    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      const d = new Date(year, month, i);
      const isToday = d.getFullYear() === 2026 && d.getMonth() === 4 && d.getDate() === 27; // hardcoded logic for May 27, 2026
      arr.push({ date: d, isCurrentMonth: true, isToday });
    }

    // Next month overflow days
    const totalSlots = arr.length > 35 ? 42 : 35;
    const remainingSlots = totalSlots - arr.length;
    for (let i = 1; i <= remainingSlots; i++) {
      const d = new Date(year, month + 1, i);
      arr.push({ date: d, isCurrentMonth: false, isToday: false });
    }

    return arr;
  }, [currentDate]);

  // Week Grid days
  const weekGrid = useMemo(() => {
    const arr: Date[] = [];
    const focal = new Date(currentDate);
    const dayOfWeek = focal.getDay();
    // Compute sunday
    const sunday = new Date(focal);
    sunday.setDate(focal.getDate() - dayOfWeek);

    for (let i = 0; i < 7; i++) {
      const d = new Date(sunday);
      d.setDate(sunday.getDate() + i);
      arr.push(d);
    }
    return arr;
  }, [currentDate]);

  // Project Checkbox Handlers
  const toggleProjectVisibility = (id: string) => {
    setVisibleProjects(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  // Extract all visible items
  const activeEventsWithTodoTasks = useMemo(() => {
    // 1. Core Events
    const activeEvts = events.filter(evt => {
      if (evt.projectId) return visibleProjects[evt.projectId] !== false;
      return true; // No project events are always shown
    });

    // 2. Map incomplete todoist tasks as events if "tasks-todo" filter check is active
    let taskEvents: CalendarEvent[] = [];
    if (visibleProjects["tasks-todo"] !== false) {
      taskEvents = tasks
        .filter(t => t.dueDate && !t.completed)
        .map(t => {
          const matchedProj = projects.find(p => p.id === t.projectId);
          return {
            id: `task-evt-${t.id}`,
            title: `📋 TASK: ${t.title}`,
            start: `${t.dueDate}T09:00`,
            end: `${t.dueDate}T10:00`,
            color: matchedProj?.color || "#94A3B8",
            description: `Auto-generated Todoist agenda. Priority: P${t.priority}. Labels: ${t.labels.join(", ")}`,
            projectId: "tasks-todo",
            allDay: true
          };
        });
    }

    return [...activeEvts, ...taskEvents];
  }, [events, tasks, visibleProjects, projects]);

  // Filter events matching targeted dates
  const getEventsForDate = (date: Date) => {
    const filterStr = formatDateString(date);
    return activeEventsWithTodoTasks.filter(evt => {
      const evtStartOnlyDate = evt.start.split("T")[0];
      return evtStartOnlyDate === filterStr;
    });
  };

  // Open Event Create modal (defaulting time appropriately)
  const handleOpenCreateModal = (date?: Date, hour?: number, defaultType: "event" | "task" = "event") => {
    const focalDate = date || new Date(2026, 4, 27);
    const dateStr = formatDateString(focalDate);
    
    setFormType(defaultType);
    setFormTitle("");
    setFormStartDate(dateStr);
    setFormEndDate(dateStr);
    
    if (hour !== undefined) {
      const hrStr = String(hour).padStart(2, "0");
      const endHrStr = String((hour + 1) % 24).padStart(2, "0");
      setFormStartTime(`${hrStr}:00`);
      setFormEndTime(`${endHrStr}:00`);
      setFormAllDay(false);
    } else {
      setFormStartTime("10:00");
      setFormEndTime("11:00");
      setFormAllDay(true);
    }
    
    setFormDescription("");
    setFormProjectId(projects[0]?.id || "");
    setFormTaskPriority(4);
    setFormTaskLabels("");
    setIsEditing(false);
    setSelectedEventForDetail(null);
    setIsAddModalOpen(true);
  };

  // Handle Event submit
  const handleSaveEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) return;

    if (formType === "task") {
      const taskPayload = {
        title: formTitle,
        priority: formTaskPriority,
        projectId: formProjectId || undefined,
        labels: formTaskLabels ? formTaskLabels.split(',').map(l => l.trim()) : [],
        dueDate: formStartDate || undefined,
        description: formDescription.trim() || undefined
      };

      if (isEditing && editingTaskId && onUpdateTask) {
        onUpdateTask(editingTaskId, taskPayload);
      } else if (onAddTask) {
        onAddTask({
          ...taskPayload,
          completed: false
        });
      }
      setIsAddModalOpen(false);
      setEditingTaskId(null);
      return;
    }

    const chosenProj = projects.find(p => p.id === formProjectId);
    const hexColor = chosenProj?.color || "#6366F1";

    const payload = {
      title: formTitle,
      start: formAllDay ? `${formStartDate}T00:00` : `${formStartDate}T${formStartTime}`,
      end: formAllDay ? `${formEndDate}T23:59` : `${formEndDate}T${formEndTime}`,
      color: hexColor,
      projectId: formProjectId || undefined,
      description: formDescription,
      allDay: formAllDay
    };

    if (isEditing && selectedEventForDetail) {
      onUpdateEvent(selectedEventForDetail.id, payload);
    } else {
      onAddEvent(payload);
    }

    setIsAddModalOpen(false);
    setSelectedEventForDetail(null);
  };

  const handleEditActiveEvent = () => {
    if (!selectedEventForDetail) return;
    const evt = selectedEventForDetail;
    setFormTitle(evt.title);
    
    const [startD, startT] = evt.start.split("T");
    const [endD, endT] = evt.end.split("T");
    setFormStartDate(startD);
    setFormStartTime(startT || "09:00");
    setFormEndDate(endD);
    setFormEndTime(endT || "10:00");
    setFormDescription(evt.description || "");
    setFormProjectId(evt.projectId || "");
    setFormAllDay(!!evt.allDay);
    
    setIsEditing(true);
    setFormType("event");
    setIsAddModalOpen(true);
  };

  const handleEditTask = (task: Task) => {
    setEditingTaskId(task.id);
    setFormType("task");
    setFormTitle(task.title);
    setFormStartDate(task.dueDate || formatDateString(currentDate));
    setFormTaskPriority(task.priority);
    setFormProjectId(task.projectId || "");
    setFormTaskLabels(task.labels ? task.labels.join(", ") : "");
    setFormDescription(task.description || "");
    setIsEditing(true);
    setIsAddModalOpen(true);
  };

  const handleDeleteActiveEvent = () => {
    if (!selectedEventForDetail) return;
    onDeleteEvent(selectedEventForDetail.id);
    setSelectedEventForDetail(null);
  };

  // Smart matching of tags or notes in GCal description list (double-brackets [[Page Title]])
  const renderDescriptionSnippet = (desc: string) => {
    if (!desc) return null;
    const regex = /\[\[(.*?)\]\]/g;
    const elements: React.ReactNode[] = [];
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(desc)) !== null) {
      const matchText = match[1];
      const matchIndex = match.index;

      // Add text leading to match
      if (matchIndex > lastIndex) {
        elements.push(desc.substring(lastIndex, matchIndex));
      }

      // Find page matching name
      const foundPage = pages.find(p => p.title.toLowerCase() === matchText.trim().toLowerCase());
      if (foundPage) {
        elements.push(
          <button
            key={matchIndex}
            onClick={() => {
              onNavigateToNote(foundPage.id);
              setSelectedEventForDetail(null);
            }}
            className="text-xs bg-accent-light text-accent-text hover:underline px-1.5 py-0.5 rounded font-semibold inline-flex items-center gap-1.5 align-middle"
          >
            <Link2 className="w-3 h-3 text-accent-text animate-pulse" />
            <span>{foundPage.title}</span>
          </button>
        );
      } else {
        elements.push(<span key={matchIndex} className="text-slate-400 font-bold">[[{matchText}]]</span>);
      }
      lastIndex = regex.lastIndex;
    }

    if (lastIndex < desc.length) {
      elements.push(desc.substring(lastIndex));
    }

    return elements.length > 0 ? elements : desc;
  };

  // Mini Calendar Widget renderer (Sidebar)
  const renderMiniCalendar = () => {
    const daysInCurrMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
    const startingDayIdx = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
    const days: React.ReactNode[] = [];

    // Empty spaces for padding starting weekdays
    for (let i = 0; i < startingDayIdx; i++) {
      days.push(<div key={`empty-${i}`} className="w-6 h-6" />);
    }

    for (let d = 1; d <= daysInCurrMonth; d++) {
      const activeFocal = currentDate.getDate() === d;
      const isToday = currentDate.getFullYear() === 2026 && currentDate.getMonth() === 4 && d === 27; // May 27, 2026

      days.push(
        <button
          key={`day-${d}`}
          onClick={() => {
            const updated = new Date(currentDate);
            updated.setDate(d);
            setCurrentDate(updated);
          }}
          className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-sans font-semibold hover:bg-slate-100 ${
            activeFocal ? "bg-accent-main text-white hover:bg-accent-main" : ""
          } ${isToday && !activeFocal ? "border border-red-500 text-red-500" : ""}`}
        >
          {d}
        </button>
      );
    }

    return (
      <div className="flex flex-col gap-2 p-2 border-b border-border-theme shrink-0" id="mini-calendar">
        <div className="flex items-center justify-between px-1" id="mini-cal-header">
          <span className="text-xs font-bold text-text-title">
            {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}
          </span>
          <div className="flex gap-1">
            <button onClick={handlePrev} className="p-1 rounded hover:bg-slate-100 text-text-muted">
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button onClick={handleNext} className="p-1 rounded hover:bg-slate-100 text-text-muted">
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
        <div className="grid grid-cols-7 text-center font-bold text-slate-400 text-[9px] font-mono leading-relaxed" id="mini-cal-weekdays">
          {WEEKDAYS.map(w => (
            <span key={w}>{w.substring(0, 1)}</span>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-y-1 align-middle justify-items-center" id="mini-cal-days">
          {days}
        </div>
      </div>
    );
  };

  return (
    <div className="flex-1 flex overflow-hidden h-full bg-main-bg text-text-body font-sans" id="gcal-screen">
      {/* 1. LEFT GCAL SIDEBAR (GCal Style) */}
      {!isSidebarCollapsed ? (
        <div className="w-64 border-r border-border-theme bg-card-bg flex flex-col p-4 shrink-0 overflow-y-auto hidden md:flex transition-all duration-300 relative" id="gcal-sidebar">
          
          <div className="flex items-center justify-between mb-6">
            {/* Colorful Plus 'Create' Action Button */}
            <button
              onClick={() => handleOpenCreateModal()}
              className="flex items-center gap-3.5 px-6 py-3.5 rounded-full bg-main-bg text-[#3C4043] border border-slate-220 hover:border-slate-300 dark:bg-[#303134] dark:border-zinc-700 dark:text-zinc-200 transition shadow-md hover:shadow-lg font-sans font-medium text-sm shrink-0 active:scale-95"
              id="gcal-global-create-btn"
            >
              {/* Multi colored Google plus indicator */}
              <div className="flex items-center justify-center relative w-5 h-5">
                <span className="absolute w-1 h-5 bg-[#4285F4] rounded-sm transform rotate-90" />
                <span className="absolute w-1 h-5 bg-[#34A853] rounded-sm" />
                <span className="absolute w-1 h-2.5 bg-[#EA4335] rounded-sm top-0" />
                <span className="absolute h-1 w-2.5 bg-[#FBBC05] rounded-sm left-0" />
              </div>
              <span className="text-text-title font-bold leading-tight">Create event</span>
            </button>

            {/* Collapse Button */}
            <button
              onClick={() => setIsSidebarCollapsed(true)}
              className="p-1.5 rounded-lg text-text-muted hover:text-accent-main hover:bg-accent-light transition cursor-pointer border border-transparent hover:border-border-theme bg-card-bg shrink-0"
              title="Collapse Sidebar"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto flex flex-col gap-3 mt-4" id="gcal-tasks-list">
            <div className="px-2 flex flex-col gap-2">
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-[10px] uppercase font-bold text-text-muted tracking-wider flex items-center gap-1.5">
                  <CheckSquare className="w-3.5 h-3.5" /> Tasks
                </h3>
                <button
                  onClick={() => setTaskSortPriority(!taskSortPriority)}
                  className={`p-1 rounded flex items-center gap-1 transition ${taskSortPriority ? 'bg-accent-light text-accent-main' : 'hover:bg-card-bg text-text-muted'}`}
                  title={taskSortPriority ? "Sorting by Priority (P1-P4)" : "Sort by Priority"}
                >
                  <ArrowUpDown className="w-3 h-3" />
                </button>
              </div>
              <input
                type="text"
                placeholder="Search tasks..."
                value={taskSearchQuery}
                onChange={(e) => setTaskSearchQuery(e.target.value)}
                className="w-full text-xs px-2.5 py-1.5 rounded-md border border-border-theme bg-main-bg focus:outline-none focus:border-accent-main transition-colors"
                id="gcal-tasks-search"
              />
            </div>
            {tasks
              .filter(t => !t.completed && (!taskSearchQuery.trim() || t.title.toLowerCase().includes(taskSearchQuery.toLowerCase())))
              .sort((a, b) => taskSortPriority ? a.priority - b.priority : 0)
              .map(task => {
              const proj = projects.find(p => p.id === task.projectId);
              return (
                <div 
                  key={task.id} 
                  className="flex gap-3 p-3 rounded-xl border border-border-theme bg-main-bg hover:shadow-sm transition cursor-pointer group"
                  onClick={() => handleEditTask(task)}
                >
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onToggleTaskComplete) onToggleTaskComplete(task.id);
                    }}
                    className={`w-4 h-4 mt-0.5 rounded-full border border-slate-300 dark:border-zinc-600 flex items-center justify-center hover:bg-slate-100 transition shrink-0 ${
                      task.priority === 1 ? 'border-red-400 bg-red-50' :
                      task.priority === 2 ? 'border-orange-400 bg-orange-50' :
                      task.priority === 3 ? 'border-blue-400 bg-blue-50' :
                      ''
                    }`}
                    title="Complete Task"
                  >
                  </button>
                  <div className="flex flex-col gap-1.5 w-full overflow-hidden">
                    <p className="text-xs font-semibold text-text-title break-words leading-tight">{task.title}</p>
                    {task.description && (
                      <p className="text-[10px] text-text-muted truncate">{task.description}</p>
                    )}
                    <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                      {task.dueDate && (
                        <span className="text-[9px] text-text-muted font-medium bg-card-bg border border-border-theme px-1.5 py-0.5 rounded-sm flex items-center gap-1">
                          <Clock className="w-2.5 h-2.5" />
                          {new Date(task.dueDate).toLocaleDateString()}
                        </span>
                      )}
                      {proj && (
                        <span className="text-[9px] font-medium px-1.5 py-0.5 rounded-sm border" style={{ borderColor: proj.color, color: proj.color, backgroundColor: `${proj.color}15` }}>
                          {proj.name}
                        </span>
                      )}
                      {task.labels && task.labels.map((lbl, idx) => (
                        <span key={idx} className="text-[9px] bg-accent-light text-accent-main px-1.5 py-0.5 rounded-sm font-medium">
                          {lbl}
                        </span>
                      ))}
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onDeleteTask) onDeleteTask(task.id);
                    }}
                    className="p-1 rounded opacity-0 group-hover:opacity-100 text-red-400 hover:bg-red-50 hover:text-red-600 transition shrink-0 self-start"
                    title="Delete Task"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
            {tasks.filter(t => !t.completed).length === 0 && (
              <div className="flex flex-col items-center justify-center py-10 opacity-60">
                <Check className="w-8 h-8 text-text-muted mb-2" />
                <p className="text-xs text-text-muted text-center font-medium">All tasks completed!<br/>You're all caught up.</p>
              </div>
            )}
            <button
              onClick={() => handleOpenCreateModal(undefined, undefined, "task")}
              className="mt-2 w-full py-2 rounded-lg bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 transition text-[13px] font-medium text-accent-main flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Add Task
            </button>

            {tasks.filter(t => t.completed).length > 0 && (
              <div className="mt-4 pt-4 border-t border-border-theme/50">
                <h3 className="px-2 text-[10px] uppercase font-bold text-text-muted tracking-wider mb-2 flex items-center gap-1.5 opacity-60">
                  <CheckSquare className="w-3.5 h-3.5" /> Completed
                </h3>
                <div className="flex flex-col gap-2">
                  {tasks
                    .filter(t => t.completed && (!taskSearchQuery.trim() || t.title.toLowerCase().includes(taskSearchQuery.toLowerCase())))
                    .map(task => (
                    <div 
                      key={task.id} 
                      className="flex gap-3 p-2 rounded-lg bg-main-bg/50 transition group opacity-60 hover:opacity-100"
                    >
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onToggleTaskComplete) onToggleTaskComplete(task.id);
                        }}
                        className="w-4 h-4 mt-0.5 rounded-full bg-slate-200 dark:bg-zinc-700 flex items-center justify-center hover:bg-slate-300 transition shrink-0"
                        title="Uncomplete Task"
                      >
                        <Check className="w-2.5 h-2.5 text-slate-500" />
                      </button>
                      <div className="flex flex-col w-full">
                        <p className="text-xs font-medium text-text-muted line-through break-words leading-tight">{task.title}</p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onDeleteTask) onDeleteTask(task.id);
                        }}
                        className="p-1 rounded opacity-0 group-hover:opacity-100 text-red-400 hover:bg-red-50 hover:text-red-600 transition shrink-0 self-start"
                        title="Delete Task"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="w-[68px] border-r border-border-theme bg-card-bg flex flex-col items-center py-4 shrink-0 overflow-y-auto hidden md:flex transition-all duration-300 relative" id="gcal-sidebar-collapsed">
          <button
            onClick={() => setIsSidebarCollapsed(false)}
            className="p-1.5 rounded-lg text-text-muted hover:text-accent-main hover:bg-accent-light transition cursor-pointer border border-transparent hover:border-border-theme bg-card-bg mb-6"
            title="Expand Sidebar"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          
          <button
            onClick={() => handleOpenCreateModal()}
            className="p-3 rounded-full bg-main-bg text-[#3C4043] border border-slate-220 hover:border-slate-300 dark:bg-[#303134] dark:border-zinc-700 dark:text-zinc-200 transition shadow-md hover:shadow-lg flex items-center justify-center shrink-0 active:scale-95"
            title="Create event"
          >
            <Plus className="w-5 h-5 text-accent-main" />
          </button>
        </div>
      )}

      {/* 2. MAIN GCAL CORE CANVAS (Google Calendar Look-Alike) */}
      <div className="flex-1 flex flex-col overflow-hidden h-full" id="gcal-main-content">
        
        {/* Top Header Controls Panel */}
        <div className="h-16 border-b border-border-theme bg-card-bg flex items-center justify-between px-6 shrink-0" id="gcal-header-panel">
          <div className="flex items-center gap-4" id="gcal-header-left">
            {/* Calendar icon branding */}
            <div className="flex items-center gap-2" id="gcal-brand">
              <div className="bg-accent-main text-white p-2 rounded-lg" id="gcal-icon-wrapper">
                <Calendar className="w-5 h-5" />
              </div>
              <h2 className="text-base font-bold text-text-title tracking-tight hidden lg:block">Google Calendar</h2>
            </div>

            {/* Today jump button */}
            <button
              onClick={handleGoToday}
              className="px-4 py-2 border border-border-theme hover:bg-main-bg rounded-lg text-xs font-bold text-text-title transition"
              id="gcal-today-btn"
            >
              Today
            </button>

            {/* Pagination Controls */}
            <div className="flex items-center gap-1.5" id="gcal-pagination">
              <button onClick={handlePrev} className="p-2 rounded-lg hover:bg-main-bg text-text-muted border border-border-theme transition" id="gcal-prev-btn">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button onClick={handleNext} className="p-2 rounded-lg hover:bg-main-bg text-text-muted border border-border-theme transition" id="gcal-next-btn">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Active Range Header label */}
            <h1 className="text-base md:text-lg font-bold text-text-title font-sans" id="gcal-range-label">
              {viewType === "month" && `${MONTHS[currentDate.getMonth()]} ${currentDate.getFullYear()}`}
              {viewType === "week" && (
                `Week of ${MONTHS[weekGrid[0].getMonth()]} ${weekGrid[0].getDate()}, ${weekGrid[0].getFullYear()}`
              )}
              {viewType === "day" && (
                `${currentDate.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}, ${currentDate.getFullYear()}`
              )}
            </h1>
          </div>

          {/* View Toggles controls */}
          <div className="flex items-center gap-2" id="gcal-view-toggles">
            <div className="flex bg-black/5 dark:bg-white/10 p-1 rounded-[9px] border border-black/5 dark:border-white/5" id="gcal-toggle-pill">
              {(["day", "week", "month"] as const).map(type => (
                <button
                  key={type}
                  onClick={() => setViewType(type)}
                  className={`px-4 py-1.5 rounded-md text-[13px] transition-all duration-150 capitalize cursor-pointer font-medium ${
                    viewType === type 
                      ? "bg-white dark:bg-[#4d4d4d] text-text-title shadow-[0_1px_3px_rgba(0,0,0,0.12)] border border-black/5 dark:border-transparent" 
                      : "text-text-muted hover:text-text-title border border-transparent"
                  }`}
                  id={`gcal-view-toggle-${type}`}
                >
                  {type}
                </button>
              ))}
            </div>

            {/* Floating plus button for small screens */}
            <button
              onClick={() => handleOpenCreateModal()}
              className="p-2 bg-accent-main hover:bg-accent-main/90 text-white rounded-full md:hidden flex justify-center items-center shadow"
              id="gcal-mobile-add-btn"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Calendar Core Views Switchboard */}
        <div className="flex-1 overflow-auto bg-main-bg select-none" id="gcal-grid-stage">
          
          {/* ========================================================= */}
          {/* A. MONTHLY GRID VIEW                                      */}
          {/* ========================================================= */}
          {viewType === "month" && (
            <div className="h-full min-w-[700px] flex flex-col" id="gcal-month-view">
              {/* Header weekday text boxes */}
              <div className="grid grid-cols-7 border-b border-border-theme bg-card-bg text-center py-2 shrink-0 font-bold font-sans text-xs text-text-muted" id="gcal-month-header">
                {WEEKDAYS.map(d => (
                  <div key={d}>{d}</div>
                ))}
              </div>

              {/* Grid block loop */}
              <div className="flex-1 grid grid-cols-7 grid-rows-5 md:grid-rows-6" id="gcal-month-cells">
                {monthGrid.map((slot, index) => {
                  const dayEvents = getEventsForDate(slot.date);
                  
                  return (
                    <div
                      key={index}
                      onClick={(e) => {
                        // Only trigger if we aren't clicking the day number block which handles its own clicks
                        handleOpenCreateModal(slot.date);
                      }}
                      className={`min-h-[100px] border-r border-b border-border-theme/60 bg-card-bg p-1 flex flex-col hover:bg-main-bg/10 relative transition`}
                      id={`gcal-month-slot-${index}`}
                    >
                      {/* Day Number segment */}
                      <div className="flex justify-between items-start" id={`gcal-month-slot-header-${index}`}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            const updated = new Date(slot.date);
                            setCurrentDate(updated);
                            setViewType("day");
                          }}
                          className={`w-6 h-6 rounded-full flex items-center justify-center font-sans font-semibold text-xs leading-none m-1 hover:bg-slate-100 ${
                            slot.isToday ? "bg-red-500 text-white hover:bg-red-500" : ""
                          } ${slot.isCurrentMonth ? "text-text-title" : "text-text-muted opacity-50"}`}
                        >
                          {slot.date.getDate()}
                        </button>
                      </div>

                      {/* Day events stacked */}
                      <div className="flex-1 flex flex-col gap-1 overflow-y-auto max-h-[110px] px-1 custom-scrollbar" id={`gcal-month-slot-events-${index}`}>
                        {dayEvents.map(evt => (
                          <div
                            key={evt.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedEventForDetail(evt);
                            }}
                            className="text-[10px] font-sans font-bold px-1.5 py-1 rounded truncate cursor-pointer hover:brightness-95 transition-all text-white border border-black/5 flex items-center gap-1 select-none font-bold"
                            style={{ backgroundColor: evt.color }}
                            title={evt.title}
                          >
                            {!evt.allDay && <span className="w-1.5 h-1.5 rounded-full bg-white shrink-0" />}
                            <span className="truncate">{evt.title}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* B. WEEKLY GRID VIEW                                       */}
          {/* ========================================================= */}
          {viewType === "week" && (
            <div className="h-full min-w-[800px] flex flex-col" id="gcal-week-view">
              
              {/* Top Row: Weekday column titles */}
              <div className="grid grid-cols-8 border-b border-border-theme bg-card-bg text-center py-3 shrink-0" id="gcal-week-header">
                {/* Top left corner blank slot */}
                <div className="border-r border-border-theme text-xs font-bold text-text-muted flex items-center justify-center pr-3">
                  GMT
                </div>
                {weekGrid.map((day, idx) => {
                  const isToday = day.getFullYear() === 2026 && day.getMonth() === 4 && day.getDate() === 27; // May 27, 2026
                  return (
                    <div key={idx} className="flex flex-col items-center justify-center px-1" id={`gcal-week-day-col-${idx}`}>
                      <span className="text-[11px] font-sans text-text-muted font-bold tracking-wide uppercase">
                        {WEEKDAYS[day.getDay()]}
                      </span>
                      <button
                        onClick={() => {
                          setCurrentDate(new Date(day));
                          setViewType("day");
                        }}
                        className={`w-8 h-8 rounded-full flex items-center justify-center font-sans font-bold text-base mt-1 hover:bg-slate-100 ${
                          isToday ? "bg-red-500 text-white hover:bg-red-500" : "text-text-title"
                        }`}
                      >
                        {day.getDate()}
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* Weekly Hourly Scrolling Panel */}
              <div className="flex-1 overflow-y-auto grid grid-cols-8 relative" id="gcal-week-scroll">
                
                {/* 1. Left column Hour markers */}
                <div className="border-r border-border-theme bg-card-bg/20 text-center text-[10px] font-bold text-text-muted flex flex-col shrink-0" id="gcal-hour-markers">
                  {Array.from({ length: 24 }).map((_, hour) => (
                    <div
                      key={hour}
                      className="h-16 flex items-start justify-end pr-2 pt-1 border-b border-border-theme/40"
                    >
                      {hour === 0 ? "12 AM" : hour === 12 ? "12 PM" : hour > 12 ? `${hour - 12} PM` : `${hour} AM`}
                    </div>
                  ))}
                </div>

                {/* 2. Seven columns representing days of the week */}
                {weekGrid.map((day, colIdx) => {
                  const dayEvents = getEventsForDate(day);
                  const isToday = day.getFullYear() === 2026 && day.getMonth() === 4 && day.getDate() === 27;

                  return (
                    <div
                      key={colIdx}
                      className="border-r border-border-theme/60 relative h-[1536px] bg-card-bg/5 hover:bg-black/[0.01]"
                      id={`gcal-week-column-${colIdx}`}
                    >
                      {/* Hour divider lines background overlay */}
                      {Array.from({ length: 24 }).map((_, hIdx) => (
                        <div
                          key={hIdx}
                          onClick={() => handleOpenCreateModal(day, hIdx)}
                          className="absolute left-0 right-0 h-16 border-b border-border-theme/35 hover:bg-accent-light/5 cursor-crosshair transition-colors"
                          style={{ top: `${hIdx * 64}px` }}
                        />
                      ))}

                      {/* Current time RED indicator line (May 27, 2026 10:58 AM equivalent) */}
                      {isToday && (
                        <div 
                          className="absolute left-0 right-0 flex items-center z-20 pointer-events-none"
                          style={{ top: `${(10 * 64) + (58 / 60) * 64}px` }}
                          id="red-time-line-week"
                        >
                          <span className="w-2.5 h-2.5 rounded-full bg-red-500 -ml-1 border border-white" />
                          <div className="flex-1 h-[2px] bg-red-500" />
                        </div>
                      )}

                      {/* Place day events absolutely */}
                      {dayEvents.map(evt => {
                        if (evt.allDay) {
                          // Render allDay events pinned near top of grid
                          return (
                            <div
                              key={evt.id}
                              onClick={() => setSelectedEventForDetail(evt)}
                              className="absolute left-1 right-1 top-1.5 p-1.5 rounded text-[10px] font-sans font-semibold text-white truncate shadow-sm cursor-pointer hover:brightness-95 leading-tight select-none border border-black/5"
                              style={{ backgroundColor: evt.color, height: "26px" }}
                              title={evt.title}
                            >
                              <span className="truncate block font-bold">{evt.title}</span>
                            </div>
                          );
                        }

                        // Parse standard hour ranges
                        const startParts = evt.start.split("T")[1]?.split(":");
                        const endParts = evt.end.split("T")[1]?.split(":");
                        if (!startParts || !endParts) return null;

                        const startHour = parseInt(startParts[0], 10);
                        const startMin = parseInt(startParts[1], 10);
                        const endHour = parseInt(endParts[0], 10);
                        const endMin = parseInt(endParts[1], 10);

                        const startOffset = startHour * 64 + (startMin / 60) * 64;
                        const durationH = (endHour + endMin / 60) - (startHour + startMin / 60);
                        const endOffsetHeight = Math.max(28, durationH * 64);

                        return (
                          <div
                            key={evt.id}
                            onClick={() => setSelectedEventForDetail(evt)}
                            className="absolute left-1 right-1 p-2 rounded-lg text-[10px] font-sans font-semibold text-white flex flex-col justify-between shadow-md cursor-pointer hover:brightness-95 transition border border-black/10 z-10 hover:scale-[1.01] active:scale-[0.99]"
                            style={{ 
                              top: `${startOffset}px`, 
                              height: `${endOffsetHeight}px`,
                              backgroundColor: evt.color
                            }}
                            title={`${evt.title} (${startHour}:${startMin} to ${endHour}:${endMin})`}
                          >
                            <div className="overflow-hidden">
                              <span className="font-bold text-[11px] block text-white/95 leading-none mb-1">{evt.title}</span>
                              <span className="text-[9px] text-white/80 font-medium font-mono leading-none block">
                                {startHour}:{String(startMin).padEnd(2, "0")} - {endHour}:{String(endMin).padEnd(2, "0")}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* C. DAY VIEW (Hourly Detail)                               */}
          {/* ========================================================= */}
          {viewType === "day" && (
            <div className="h-full min-w-[500px] flex flex-col bg-card-bg" id="gcal-day-view">
              
              {/* Day Header row */}
              <div className="border-b border-border-theme bg-card-bg flex flex-col py-4 px-6 gap-1" id="gcal-day-header">
                <span className="text-xs uppercase font-sans font-bold text-text-muted">
                  {WEEKDAYS[currentDate.getDay()]}
                </span>
                <span className="text-2xl font-sans font-bold text-text-title leading-none">
                  {currentDate.getDate()} {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}
                </span>
              </div>

              {/* Day scrolling hourly blocks */}
              <div className="flex-1 overflow-y-auto grid grid-cols-12 relative" id="gcal-day-scroll">
                
                {/* 1. Left hours indicators */}
                <div className="col-span-2 border-r border-border-theme text-center text-[11px] font-semibold text-text-muted flex flex-col shrink-0 bg-card-bg" id="gcal-day-hour-labels">
                  {Array.from({ length: 24 }).map((_, hour) => (
                    <div
                      key={hour}
                      className="h-20 flex items-start justify-end pr-3 pt-1 border-b border-border-theme/40"
                    >
                      {hour === 0 ? "12 AM" : hour === 12 ? "12 PM" : hour > 12 ? `${hour - 12} PM` : `${hour} AM`}
                    </div>
                  ))}
                </div>

                {/* 2. Main 1-Day column */}
                <div className="col-span-10 relative h-[1920px] bg-card-bg" id="gcal-day-event-col">
                  {/* Grid lines background overlay */}
                  {Array.from({ length: 24 }).map((_, hIdx) => (
                    <div
                      key={hIdx}
                      onClick={() => handleOpenCreateModal(currentDate, hIdx)}
                      className="absolute left-0 right-0 h-20 border-b border-border-theme/35 hover:bg-accent-light/5 cursor-crosshair transition-colors"
                      style={{ top: `${hIdx * 80}px` }}
                    />
                  ))}

                  {/* Red Live Time indicator line (May 27, 2026 equivalent) */}
                  {currentDate.getFullYear() === 2026 && currentDate.getMonth() === 4 && currentDate.getDate() === 27 && (
                    <div
                      className="absolute left-0 right-0 flex items-center z-20 pointer-events-none"
                      style={{ top: `${(10 * 80) + (58 / 60) * 80}px` }}
                      id="red-time-line-day"
                    >
                      <span className="w-2.5 h-2.5 rounded-full bg-red-500 -ml-1 border border-white" />
                      <div className="flex-1 h-[2px] bg-red-500" />
                    </div>
                  )}

                  {/* Render Day events */}
                  {getEventsForDate(currentDate).map(evt => {
                    if (evt.allDay) {
                      return (
                        <div
                          key={evt.id}
                          onClick={() => setSelectedEventForDetail(evt)}
                          className="absolute left-4 right-4 top-2 p-2 rounded-xl text-xs font-semibold text-white truncate shadow-md hover:brightness-95 transition cursor-pointer select-none border border-black/5"
                          style={{ backgroundColor: evt.color, height: "36px" }}
                          title={evt.title}
                        >
                          <span className="font-bold">{evt.title} (All Day)</span>
                        </div>
                      );
                    }

                    const startParts = evt.start.split("T")[1]?.split(":");
                    const endParts = evt.end.split("T")[1]?.split(":");
                    if (!startParts || !endParts) return null;

                    const startHour = parseInt(startParts[0], 10);
                    const startMin = parseInt(startParts[1], 10);
                    const endHour = parseInt(endParts[0], 10);
                    const endMin = parseInt(endParts[1], 10);

                    const startOffset = startHour * 80 + (startMin / 60) * 80;
                    const durationH = (endHour + endMin / 60) - (startHour + startMin / 60);
                    const endOffsetHeight = Math.max(36, durationH * 80);

                    return (
                      <div
                        key={evt.id}
                        onClick={() => setSelectedEventForDetail(evt)}
                        className="absolute left-4 right-4 p-4 rounded-2xl text-xs font-semibold text-white flex flex-col justify-between shadow-lg cursor-pointer hover:brightness-95 transition border border-black/10 z-10 hover:scale-[1.005] active:scale-[0.995]"
                        style={{ 
                          top: `${startOffset}px`, 
                          height: `${endOffsetHeight}px`,
                          backgroundColor: evt.color
                        }}
                      >
                        <div>
                          <h4 className="text-sm font-bold text-white mb-1">{evt.title}</h4>
                          <span className="text-[10px] text-white/85 font-bold font-mono leading-none block mb-2 flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 shrink-0" />
                            {startHour}:{String(startMin).padEnd(2, "0")} - {endHour}:{String(endMin).padEnd(2, "0")}
                          </span>
                          {evt.description && (
                            <p className="text-[11px] text-white/80 line-clamp-3 leading-relaxed mt-2 bg-black/15 p-2 rounded-lg font-normal">
                              {renderDescriptionSnippet(evt.description)}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

        </div>
      </div>



      {/* ========================================================= */}
      {/* 3. EVENT DETAILS POPOVER / MODAL (Identical GCal style)    */}
      {/* ========================================================= */}
      {selectedEventForDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 dark:bg-black/40 backdrop-blur-sm animate-fade-in" id="gcal-detail-modal-bg">
          <div className="max-w-md w-full bg-card-bg/90 backdrop-blur-xl border border-black/5 dark:border-white/10 p-6 rounded-[24px] shadow-[0_20px_60px_rgba(0,0,0,0.15)] relative flex flex-col gap-5" id="gcal-detail-card">
            
            {/* Upper Action Bar (pencil, trash, close) */}
            <div className="flex justify-between items-center pb-2 border-b border-border-theme/40" id="gcal-detail-controls">
              <span className="text-[10px] font-sans font-bold uppercase tracking-wider text-text-muted flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-accent-text" /> Event Schedule
              </span>
              <div className="flex items-center gap-1">
                {/* Prevent editing todoist-derived task events */}
                {!selectedEventForDetail.id.startsWith("task-evt-") && (
                  <button
                    onClick={handleEditActiveEvent}
                    className="p-2 rounded-lg text-text-muted hover:text-accent-text hover:bg-main-bg transition"
                    title="Edit event details"
                    id="gcal-detail-edit-pencil-btn"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                )}
                {!selectedEventForDetail.id.startsWith("task-evt-") && (
                  <button
                    onClick={handleDeleteActiveEvent}
                    className="p-2 rounded-lg text-text-muted hover:text-red-500 hover:bg-rose-50 transition"
                    title="Delete event"
                    id="gcal-detail-delete-trash-btn"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={() => setSelectedEventForDetail(null)}
                  className="p-2 rounded-lg text-text-muted hover:text-text-title hover:bg-main-bg transition"
                  id="gcal-detail-close-btn"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Event Header styling */}
            <div className="flex items-start gap-4" id="gcal-detail-header-row">
              <span className="w-4.5 h-4.5 rounded-md mt-1.5 shrink-0 shadow-xs border border-white/5" style={{ backgroundColor: selectedEventForDetail.color }} />
              <div>
                <h3 className="text-xl font-sans font-bold text-text-title leading-tight" id="gcal-detail-title">
                  {selectedEventForDetail.title}
                </h3>
                
                {/* Time range strings */}
                <span className="text-xs text-text-muted font-mono block mt-1.5 flex items-center gap-1.5" id="gcal-detail-time-range">
                  <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>
                    {selectedEventForDetail.allDay ? (
                      `All day event on ${selectedEventForDetail.start.split("T")[0]}`
                    ) : (
                      `${selectedEventForDetail.start.replace("T", " ")} to ${selectedEventForDetail.end.split("T")[1]}`
                    )}
                  </span>
                </span>
              </div>
            </div>

            {/* Description list */}
            {selectedEventForDetail.description && (
              <div className="flex items-start gap-4 p-3.5 rounded-xl bg-main-bg/30 border border-border-theme/40" id="gcal-detail-desc-block">
                <AlignLeft className="w-4.5 h-4.5 text-slate-400 mt-0.5 shrink-0" />
                <div className="text-xs text-text-body leading-relaxed break-words" id="gcal-detail-desc">
                  {renderDescriptionSnippet(selectedEventForDetail.description)}
                </div>
              </div>
            )}

            {/* Calendar Category tag */}
            {selectedEventForDetail.projectId && (
              <div className="flex items-center gap-2.5 text-xs text-text-muted border-t border-border-theme/30 pt-3" id="gcal-detail-category-row">
                <Folder className="w-3.5 h-3.5" />
                <span>Calendar Category:</span>
                <span className="font-sans font-bold text-text-title">
                  {selectedEventForDetail.projectId === "tasks-todo" 
                    ? "Due Tasks" 
                    : projects.find(p => p.id === selectedEventForDetail.projectId)?.name || "Default Project"
                  }
                </span>
              </div>
            )}

          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 4. EVENT INTAKE / QUICK CREATE MODAL (Standard GCal look)  */}
      {/* ========================================================= */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 dark:bg-black/40 backdrop-blur-sm animate-fade-in" id="gcal-editor-modal-bg">
          <form
            onSubmit={handleSaveEvent}
            className="max-w-md w-full bg-card-bg/90 backdrop-blur-xl border border-black/5 dark:border-white/10 p-6 rounded-[24px] shadow-[0_20px_60px_rgba(0,0,0,0.15)] flex flex-col gap-4 font-sans relative focus-within:border-accent-main/30 transition-all"
            id="gcal-editor-form"
          >
            {/* Form Title & Close */}
            <div className="flex justify-between items-center pb-2 border-b border-border-theme/40" id="gcal-editor-head">
              <span className="text-xs font-bold uppercase tracking-wider text-text-muted">
                {isEditing ? "Modify Calendar Schedule" : "Schedule New Academic Event"}
              </span>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 rounded-lg text-text-muted hover:text-text-title hover:bg-main-bg transition"
                id="gcal-editor-close-btn"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Type selector */}
            {!isEditing && (
              <div className="flex border-b border-border-theme mb-2">
                <button
                  type="button"
                  onClick={() => setFormType("event")}
                  className={`px-4 py-2 text-xs font-bold transition-colors border-b-2 ${formType === "event" ? "border-accent-main text-accent-main" : "border-transparent text-text-muted hover:text-text-title"}`}
                >
                  Event
                </button>
                <button
                  type="button"
                  onClick={() => setFormType("task")}
                  className={`px-4 py-2 text-xs font-bold transition-colors border-b-2 ${formType === "task" ? "border-accent-main text-accent-main" : "border-transparent text-text-muted hover:text-text-title"}`}
                >
                  Task
                </button>
              </div>
            )}

            {/* Event Title Field */}
            <div className="flex flex-col gap-1" id="gcal-editor-title-group">
              <input
                type="text"
                placeholder={formType === "event" ? "Event title (e.g., Computer Systems Class Prep)" : "Task title (e.g., Read chapter 4)"}
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                className="w-full px-2 py-3 text-lg font-semibold bg-transparent border-b-2 border-black/5 dark:border-white/10 focus:border-accent-main focus:outline-none text-text-title placeholder:text-slate-400 dark:placeholder:text-zinc-500 transition-colors"
                required
                id="gcal-editor-title-input"
              />
            </div>

            {formType === "event" ? (
              <>
                {/* Date time range selections */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3" id="gcal-editor-date-fields">
                  <div className="flex flex-col gap-1" id="gcal-editor-start-date-group">
                    <label className="text-[10px] uppercase font-bold text-text-muted">Starts</label>
                    <input
                      type="date"
                      value={formStartDate}
                      onChange={(e) => setFormStartDate(e.target.value)}
                      className="px-3 py-2 text-[13px] bg-black/5 dark:bg-white/5 border border-transparent hover:bg-black/10 dark:hover:bg-white/10 rounded-xl text-text-title focus:bg-transparent focus:border-accent-main focus:ring-4 focus:ring-accent-main/20 outline-none transition-all cursor-pointer"
                      id="gcal-editor-start-date"
                    />
                  </div>

                  {!formAllDay && (
                    <div className="flex flex-col gap-1" id="gcal-editor-start-time-group">
                      <label className="text-[10px] uppercase font-bold text-text-muted">Hour</label>
                      <input
                        type="time"
                        value={formStartTime}
                        onChange={(e) => setFormStartTime(e.target.value)}
                        className="px-3 py-2 text-[13px] bg-black/5 dark:bg-white/5 border border-transparent hover:bg-black/10 dark:hover:bg-white/10 rounded-xl text-text-title focus:bg-transparent focus:border-accent-main focus:ring-4 focus:ring-accent-main/20 outline-none transition-all cursor-pointer"
                        id="gcal-editor-start-time"
                      />
                    </div>
                  )}

                  <div className="flex flex-col gap-1" id="gcal-editor-end-date-group">
                    <label className="text-[10px] uppercase font-bold text-text-muted">Ends</label>
                    <input
                      type="date"
                      value={formEndDate}
                      onChange={(e) => setFormEndDate(e.target.value)}
                      className="px-3 py-2 text-[13px] bg-black/5 dark:bg-white/5 border border-transparent hover:bg-black/10 dark:hover:bg-white/10 rounded-xl text-text-title focus:bg-transparent focus:border-accent-main focus:ring-4 focus:ring-accent-main/20 outline-none transition-all cursor-pointer"
                      id="gcal-editor-end-date"
                    />
                  </div>

                  {!formAllDay && (
                    <div className="flex flex-col gap-1" id="gcal-editor-end-time-group">
                      <label className="text-[10px] uppercase font-bold text-text-muted">Hour Close</label>
                      <input
                        type="time"
                        value={formEndTime}
                        onChange={(e) => setFormEndTime(e.target.value)}
                        className="px-3 py-2 text-[13px] bg-black/5 dark:bg-white/5 border border-transparent hover:bg-black/10 dark:hover:bg-white/10 rounded-xl text-text-title focus:bg-transparent focus:border-accent-main focus:ring-4 focus:ring-accent-main/20 outline-none transition-all cursor-pointer"
                        id="gcal-editor-end-time"
                      />
                    </div>
                  )}
                </div>

                {/* Checkbox for All Day event */}
                <label className="flex items-center gap-2 px-1 cursor-pointer select-none self-start" id="gcal-editor-allday-label">
                  <input
                    type="checkbox"
                    checked={formAllDay}
                    onChange={(e) => setFormAllDay(e.target.checked)}
                    className="w-4 h-4 rounded border border-border-theme text-accent-main focus:ring-accent-main cursor-pointer"
                  />
                  <span className="text-xs text-text-muted font-semibold">ALL DAY EVENT</span>
                </label>
              </>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3" id="gcal-task-fields">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] uppercase font-bold text-text-muted">Due Date</label>
                  <input
                    type="date"
                    value={formStartDate}
                    onChange={(e) => setFormStartDate(e.target.value)}
                    className="px-3 py-2 text-[13px] bg-black/5 dark:bg-white/5 border border-transparent hover:bg-black/10 dark:hover:bg-white/10 rounded-xl text-text-title focus:bg-transparent focus:border-accent-main focus:ring-4 focus:ring-accent-main/20 outline-none transition-all cursor-pointer"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] uppercase font-bold text-text-muted">Priority</label>
                  <select
                    value={formTaskPriority}
                    onChange={(e) => setFormTaskPriority(Number(e.target.value) as 1|2|3|4)}
                    className="px-3 py-2 text-[13px] bg-black/5 dark:bg-white/5 border border-transparent hover:bg-black/10 dark:hover:bg-white/10 rounded-xl text-text-title focus:bg-transparent focus:border-accent-main focus:ring-4 focus:ring-accent-main/20 outline-none transition-all cursor-pointer"
                  >
                    <option value={1}>P1 (Urgent)</option>
                    <option value={2}>P2 (High)</option>
                    <option value={3}>P3 (Medium)</option>
                    <option value={4}>P4 (Low)</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1 md:col-span-2">
                  <label className="text-[10px] uppercase font-bold text-text-muted">Labels (comma separated)</label>
                  <input
                    type="text"
                    placeholder="e.g. work, important, followup"
                    value={formTaskLabels}
                    onChange={(e) => setFormTaskLabels(e.target.value)}
                    className="px-3 py-2 text-[13px] bg-black/5 dark:bg-white/5 border border-transparent hover:bg-black/10 dark:hover:bg-white/10 rounded-xl text-text-title focus:bg-transparent focus:border-accent-main focus:ring-4 focus:ring-accent-main/20 outline-none transition-all"
                  />
                </div>
              </div>
            )}

            <div className="flex flex-col gap-1" id="gcal-editor-project-select-group">
              <label className="text-[10px] uppercase font-bold text-text-muted">Associated Project</label>
              <select
                value={formProjectId}
                onChange={(e) => setFormProjectId(e.target.value)}
                className="px-3 py-2 text-[13px] bg-black/5 dark:bg-white/5 border border-transparent hover:bg-black/10 dark:hover:bg-white/10 rounded-xl text-text-title focus:bg-transparent focus:border-accent-main focus:ring-4 focus:ring-accent-main/20 outline-none transition-all cursor-pointer font-sans"
                id="gcal-editor-project-select"
              >
                <option value="">-- Personal / Unassigned --</option>
                {projects.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            {/* Description Form Input with auto suggest guide */}
            <div className="flex flex-col gap-1" id="gcal-editor-desc-group">
              <label className="text-[10px] uppercase font-bold text-text-muted flex justify-between">
                <span>Description / Insights</span>
                <span className="text-[9px] text-[#EA4335] normal-case font-bold font-sans">Supports [[Page Title]] markdown notes</span>
              </label>
              <textarea
                placeholder="Details, context, or links..."
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 text-[13px] bg-black/5 dark:bg-white/5 border border-transparent hover:bg-black/10 dark:hover:bg-white/10 rounded-xl text-text-title focus:bg-transparent focus:border-accent-main focus:ring-4 focus:ring-accent-main/20 outline-none transition-all placeholder:text-slate-400"
                id="gcal-editor-desc-input"
              />
            </div>

            {/* Action Bar controls */}
            <div className="flex items-center justify-end gap-2.5 border-t border-border-theme/40 pt-4 mt-2" id="gcal-editor-actions">
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="px-5 py-2 text-[13px] font-medium text-text-title bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 rounded-full transition cursor-pointer"
                id="gcal-editor-cancel-btn"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!formTitle.trim()}
                className="px-6 py-2 text-[13px] font-semibold text-white bg-accent-main disabled:bg-slate-300 dark:disabled:bg-neutral-700 hover:bg-accent-hover rounded-full shadow-sm transition flex items-center gap-1.5 cursor-pointer"
                id="gcal-editor-save-btn"
              >
                <Check className="w-4 h-4" />
                <span>Save Event</span>
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
}
