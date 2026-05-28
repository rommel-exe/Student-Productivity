/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { 
  Sparkles, 
  Grid, 
  BookOpen, 
  CheckSquare,
  Layers,
  GraduationCap,
  ChevronLeft,
  ChevronRight,
  Calendar
} from "lucide-react";

interface SidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
  userEmail?: string;
  notebooksCount: number;
  pendingTasksCount: number;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export default function Sidebar({ 
  activeSection, 
  onSectionChange, 
  userEmail = "student@university.edu",
  notebooksCount,
  pendingTasksCount,
  isCollapsed = false,
  onToggleCollapse
}: SidebarProps) {
  
  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: Grid },
    { id: "gcal", label: "Calendar & Tasks", icon: Calendar, badge: pendingTasksCount > 0 ? pendingTasksCount : undefined },
    { id: "notes", label: "Notebooks", icon: BookOpen, badge: notebooksCount > 0 ? notebooksCount : undefined }
  ];

  if (isCollapsed) {
    return (
      <div className="w-[68px] bg-sidebar-bg border-r border-border-theme flex flex-col items-center h-full shrink-0 transition-all duration-300" id="sidebar-container">
        {/* Brand Workspace Header in Collapsed Mode */}
        <div className="p-4 border-b border-border-theme flex flex-col items-center gap-4 w-full" id="brand-header-collapsed">
          <div className="w-[34px] h-[34px] bg-accent-main text-white font-bold text-lg shadow-[0_2px_10px_rgba(0,113,227,0.3)] flex items-center justify-center relative overflow-hidden" style={{ borderRadius: "22%" }} id="brand-logo-collapsed" title="Almanac">
            <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent" />
            <GraduationCap className="w-4 h-4 relative z-10 drop-shadow-sm" />
          </div>
          {onToggleCollapse && (
            <button 
              onClick={onToggleCollapse} 
              className="p-1.5 rounded-lg text-text-muted hover:text-accent-main hover:bg-accent-light transition cursor-pointer border border-transparent hover:border-border-theme bg-card-bg"
              title="Expand Sidebar"
              id="sidebar-expand-btn"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Navigation icon-only buttons with tooltips and badge counters */}
        <div className="flex-1 w-full px-2 py-6 flex flex-col items-center gap-3.5 overflow-y-auto" id="sidebar-nav-collapsed">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => onSectionChange(item.id)}
                className={`relative p-3 rounded-xl transition-all duration-200 group flex items-center justify-center cursor-pointer ${
                  isActive 
                    ? "bg-accent-light text-accent-text border border-accent-main/20" 
                    : "text-text-muted hover:text-accent-main hover:bg-accent-light"
                }`}
                title={item.label}
                id={`nav-btn-${item.id}-collapsed`}
              >
                <Icon className={`w-5 h-5 transition-colors ${
                  isActive ? "text-accent-text" : "text-text-muted group-hover:text-accent-text"
                }`} />
                
                {item.badge !== undefined && (
                  <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-accent-main text-white font-mono font-bold text-[9px] rounded-full flex items-center justify-center border border-card-bg shadow-xs" id={`nav-badge-${item.id}-collapsed`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Footer in Collapsed Mode */}
        <div className="p-4 border-t border-border-theme bg-main-bg/30 w-full flex flex-col items-center gap-4" id="sidebar-footer-collapsed">
          <div 
            onClick={() => onSectionChange("settings")}
            className="w-8.5 h-8.5 rounded-full bg-accent-light border border-accent-main/20 flex items-center justify-center text-xs font-bold text-accent-text cursor-pointer hover:bg-accent-main/10 transition" id="user-badge-collapsed" title={`Student Account: ${userEmail}`}
          >
            {userEmail.substring(0, 2).toUpperCase()}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-64 bg-sidebar-bg border-r border-border-theme flex flex-col h-full shrink-0 transition-all duration-300" id="sidebar-container">
      {/* Brand Workspace Header */}
      <div className="p-5 border-b border-border-theme flex items-center justify-between" id="brand-header">
        <div className="flex items-center gap-3" id="brand-info">
          <div className="w-[38px] h-[38px] bg-accent-main text-white font-bold text-lg shadow-[0_2px_10px_rgba(0,113,227,0.3)] flex items-center justify-center relative overflow-hidden" style={{ borderRadius: "22%" }} id="brand-logo">
            <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent" />
            <GraduationCap className="w-5 h-5 relative z-10 drop-shadow-sm" />
          </div>
          <div>
            <h1 className="font-display font-semibold text-[17px] leading-tight text-text-title tracking-tight" id="brand-name">Almanac</h1>
            <p className="text-[11px] text-text-muted font-medium tracking-wide mt-0.5" id="brand-tagline">Student Workspace</p>
          </div>
        </div>
        {onToggleCollapse && (
          <button 
            onClick={onToggleCollapse} 
            className="p-1.5 rounded-lg text-text-muted hover:text-accent-main hover:bg-accent-light transition cursor-pointer border border-transparent hover:border-border-theme bg-card-bg flex items-center justify-center"
            title="Collapse Sidebar"
            id="sidebar-collapse-btn"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Main Navigation Links */}
      <div className="flex-1 px-4 py-6 flex flex-col gap-1.5 overflow-y-auto" id="sidebar-nav">
        <p className="px-3 text-[10px] uppercase font-bold text-text-muted tracking-wider mb-2" id="nav-header-label">Main Hub</p>
        
        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = activeSection === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => onSectionChange(item.id)}
              className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-sm transition-all duration-200 group font-sans cursor-pointer ${
                isActive 
                  ? "bg-black/10 dark:bg-white/15 text-text-title font-medium" 
                  : "text-text-muted hover:text-text-title hover:bg-black/5 dark:hover:bg-white/5"
              }`}
              id={`nav-btn-${item.id}`}
            >
              <div className="flex items-center gap-2.5">
                <Icon className={`w-[18px] h-[18px] transition-colors ${
                  isActive ? "text-accent-main" : "text-text-muted group-hover:text-text-title"
                }`} />
                <span>{item.label}</span>
              </div>
              
              {item.badge !== undefined && (
                <span className={`px-2 py-0.5 text-[10px] rounded-full font-mono font-semibold ${
                  isActive
                    ? "bg-accent-main text-white"
                    : "bg-card-bg text-text-muted border border-border-theme group-hover:bg-accent-light group-hover:text-accent-text"
                }`} id={`nav-badge-${item.id}`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Footer Profile Segment */}
      <div className="p-4 border-t border-border-theme bg-main-bg/30" id="sidebar-footer">
        <div 
          onClick={() => onSectionChange("settings")}
          className="flex items-center gap-3 p-2 rounded-xl hover:bg-card-bg transition cursor-pointer" id="user-badge"
        >
          <div className="w-8.5 h-8.5 rounded-full bg-accent-light border border-accent-main/20 flex items-center justify-center text-xs font-bold text-accent-text" id="user-avatar">
            {userEmail.substring(0, 2).toUpperCase()}
          </div>
          <div className="overflow-hidden text-left">
            <p className="text-xs font-semibold text-text-title truncate" id="user-display-email" title={userEmail}>
              {userEmail}
            </p>
            <p className="text-[10px] text-text-muted font-sans" id="user-display-role">Student Account</p>
          </div>
        </div>
      </div>
    </div>
  );
}
