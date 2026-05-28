/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Notebook {
  id: string;
  title: string;
  createdAt: number;
}

export interface Section {
  id: string;
  notebookId: string;
  title: string;
  color: string; // Tailwind class color or hex code
}

export interface NotePage {
  id: string;
  sectionId: string;
  notebookId: string;
  title: string;
  content: string;
  tags: string[];
  updatedAt: number;
}

export interface Task {
  id: string;
  title: string;
  priority: 1 | 2 | 3 | 4; // 1 = High, 2 = Medium, 3 = Low, 4 = None (P1-P4 standard in Todoist)
  dueDate?: string; // YYYY-MM-DD
  completed: boolean;
  projectId?: string; // Links to TaskProject
  labels: string[];
  description?: string;
  linkedPageId?: string; // Dynamic linkage: OneNote/Obsidian Page id
  createdAt: number;
}

export interface TaskProject {
  id: string;
  name: string;
  color: string;
}

export interface Backlink {
  sourcePageId: string;
  sourcePageTitle: string;
  snippet: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  start: string; // "YYYY-MM-DDTHH:MM"
  end: string;   // "YYYY-MM-DDTHH:MM"
  color: string; // hex color or tailwind
  projectId?: string; // Links to TaskProject (calendar filter checks)
  allDay?: boolean;
}

export interface WorkspaceState {
  notebooks: Notebook[];
  sections: Section[];
  pages: NotePage[];
  tasks: Task[];
  projects: TaskProject[];
  events?: CalendarEvent[];
}

export function getPagePlaintext(content: string | undefined): string {
  if (!content) return "";
  if (content.startsWith("<!--ONENOTE_SCHEMA-->")) {
    try {
      const jsonStr = content.slice("<!--ONENOTE_SCHEMA-->".length);
      const data = JSON.parse(jsonStr);
      if (data && Array.isArray(data.blocks)) {
        return data.blocks.map((b: any) => b.text || "").join("\n\n");
      }
    } catch (e) {
      console.error("Failed to parse OneNote content schema:", e);
    }
  }
  return content;
}

