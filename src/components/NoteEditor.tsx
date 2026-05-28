/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useRef } from "react";
import { NotePage, Section, Notebook, Task, Backlink, getPagePlaintext } from "../types";
import GraphView from "./GraphView";
import { 
  BookOpen, 
  Folder, 
  Plus, 
  Trash2, 
  Edit3, 
  Eye, 
  Columns, 
  Link2, 
  Tag, 
  CheckSquare, 
  ChevronRight, 
  ChevronDown, 
  Sparkles,
  Layers,
  StickyNote,
  X,
  GripHorizontal,
  Info,
  HelpCircle,
  Check,
  Grid,
  PanelLeft,
  PanelLeftClose,
  PenTool,
  MousePointer2,
  Eraser,
  Network
} from "lucide-react";

export interface Stroke {
  id: string;
  color: string;
  width: number;
  points: {x: number, y: number}[];
}

export interface OneNoteBlock {
  id: string;
  x: number;
  y: number;
  w: number;
  text: string;
}

interface NoteEditorProps {
  notebooks: Notebook[];
  sections: Section[];
  pages: NotePage[];
  tasks: Task[];
  onAddNotebook: (title: string) => void;
  onAddSection: (notebookId: string, title: string, color: string) => void;
  onAddPage: (notebookId: string, sectionId: string) => void;
  onUpdatePage: (id: string, updates: Partial<NotePage>) => void;
  onDeletePage: (id: string) => void;
  onAddLinkedTask: (title: string, pageId: string) => void;
  onToggleTaskComplete: (id: string) => void;
  
  // Navigation trigger
  selectedPageId: string | null;
  onSelectPage: (id: string | null) => void;
  isSyncing: boolean;
}

// Colors for OneNote sections
const COLOR_OPTIONS = ["indigo", "sky", "emerald", "teal", "amber", "rose", "purple"];

export default function NoteEditor({
  notebooks,
  sections,
  pages,
  tasks,
  onAddNotebook,
  onAddSection,
  onAddPage,
  onUpdatePage,
  onDeletePage,
  onAddLinkedTask,
  onToggleTaskComplete,
  selectedPageId,
  onSelectPage,
  isSyncing
}: NoteEditorProps) {
  
  // Selection states
  const [activeNotebookId, setActiveNotebookId] = useState<string>("");
  const [activeSectionId, setActiveSectionId] = useState<string>("");
  
  // Tabbed notes states
  const [openTabs, setOpenTabs] = useState<string[]>(() => {
    if (selectedPageId) {
      return [selectedPageId];
    }
    return [];
  });
  const [activeTabId, setActiveTabId] = useState<string>(selectedPageId || "");

  // UI Display toggles
  const [showAddNotebook, setShowAddNotebook] = useState(false);
  const [showAddSection, setShowAddSection] = useState(false);
  const [isNotebooksSidebarOpen, setIsNotebooksSidebarOpen] = useState(true);
  const [isPagesSidebarOpen, setIsPagesSidebarOpen] = useState(true);
  
  // Annotate Mode States
  const [interactionMode, setInteractionMode] = useState<"text" | "annotate">("text");
  const [penColor, setPenColor] = useState<string>("#ef4444"); // Default red
  const [penWidth, setPenWidth] = useState<number>(3);
  const [currentStroke, setCurrentStroke] = useState<Stroke | null>(null);

  // Form inputs
  const [newNotebookTitle, setNewNotebookTitle] = useState("");
  const [newSectionTitle, setNewSectionTitle] = useState("");
  const [newSectionColor, setNewSectionColor] = useState("indigo");
  const [newLinkedTaskTitle, setNewLinkedTaskTitle] = useState("");

  // Custom Confirm Modal overlay state
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  } | null>(null);

  // WikiLink Autocomplete States
  const [bracketsTerm, setBracketsTerm] = useState<string | null>(null); // term after [[
  const [autocompleteIndex, setAutocompleteIndex] = useState(0);

  // Synchronize top selectors on first render or when page selected from outside (like Dashboard or Graph)
  useEffect(() => {
    if (selectedPageId) {
      if (selectedPageId === "__graph__") {
        setActiveTabId("__graph__");
        setOpenTabs(prev => {
          if (!prev.includes("__graph__")) {
            return [...prev, "__graph__"];
          }
          return prev;
        });
      } else {
        const activePage = pages.find(p => p.id === selectedPageId);
        if (activePage) {
          setActiveNotebookId(activePage.notebookId);
          setActiveSectionId(activePage.sectionId);
        }
        setOpenTabs(prev => {
          if (!prev.includes(selectedPageId)) {
            return [...prev, selectedPageId];
          }
          return prev;
        });
        setActiveTabId(selectedPageId);
      }
    } else if (notebooks.length > 0 && !activeNotebookId) {
      setActiveNotebookId(notebooks[0].id);
    }
  }, [selectedPageId, pages, notebooks]);

  const handleSelectTab = (tabId: string) => {
    setActiveTabId(tabId);
    onSelectPage(tabId);
  };

  const handleCloseTab = (e: React.MouseEvent, tabId: string) => {
    e.stopPropagation();
    const nextTabs = openTabs.filter(id => id !== tabId);
    setOpenTabs(nextTabs);

    if (activeTabId === tabId) {
      if (nextTabs.length > 0) {
        const idx = openTabs.indexOf(tabId);
        const newActive = nextTabs[Math.min(idx, nextTabs.length - 1)];
        setActiveTabId(newActive);
        onSelectPage(newActive);
      } else {
        setActiveTabId("");
        onSelectPage(null);
      }
    }
  };

  const handleOpenGraphTab = () => {
    setOpenTabs(prev => {
      if (!prev.includes("__graph__")) {
        return [...prev, "__graph__"];
      }
      return prev;
    });
    setActiveTabId("__graph__");
    onSelectPage("__graph__");
  };

  const handleSelectPageFromSidebar = (pageId: string) => {
    setOpenTabs(prev => {
      if (!prev.includes(pageId)) {
        return [...prev, pageId];
      }
      return prev;
    });
    setActiveTabId(pageId);
    onSelectPage(pageId);
  };

  const handleCloseAndDeletePage = (pageId: string) => {
    const nextTabs = openTabs.filter(id => id !== pageId);
    setOpenTabs(nextTabs);
    if (activeTabId === pageId) {
      if (nextTabs.length > 0) {
        const idx = openTabs.indexOf(pageId);
        const newActive = nextTabs[Math.min(idx, nextTabs.length - 1)];
        setActiveTabId(newActive);
        onSelectPage(newActive);
      } else {
        setActiveTabId("");
        onSelectPage(null);
      }
    }
    onDeletePage(pageId);
  };

  // Synchronize section selectors when active notebook changes
  useEffect(() => {
    if (activeNotebookId) {
      const parentSections = sections.filter(s => s.notebookId === activeNotebookId);
      if (parentSections.length > 0) {
        // Only set active section if current active section is not in this notebook
        const isCurrentValInBook = parentSections.some(s => s.id === activeSectionId);
        if (!isCurrentValInBook) {
          setActiveSectionId(parentSections[0].id);
        }
      } else {
        setActiveSectionId("");
      }
    }
  }, [activeNotebookId, sections]);

  // Autoselect first page in section if no page selected, but only if they are directly browsing
  useEffect(() => {
    if (activeSectionId && !selectedPageId) {
      const secPages = pages.filter(p => p.sectionId === activeSectionId);
      if (secPages.length > 0) {
        onSelectPage(secPages[0].id);
      }
    }
  }, [activeSectionId, selectedPageId, pages]);

  // Retrieve active selected page
  const activePage = useMemo(() => {
    return pages.find(p => p.id === selectedPageId) || null;
  }, [pages, selectedPageId]);

  // OneNote Coordinate Board UI States
  const [editingBlockId, setEditingBlockId] = useState<string | null>(null);
  const [tempText, setTempText] = useState<string>("");
  const [draggingBlockId, setDraggingBlockId] = useState<string | null>(null);
  const dragStartRef = useRef<{ mX: number; mY: number; bX: number; bY: number } | null>(null);

  // OneNote Block & Paper Style Deserializer
  const pageCanvasData = useMemo(() => {
    if (!activePage) return { blocks: [] as OneNoteBlock[], paperStyle: "ruled", strokes: [] as Stroke[] };
    if (activePage.content.startsWith("<!--ONENOTE_SCHEMA-->")) {
      try {
        const jsonStr = activePage.content.slice("<!--ONENOTE_SCHEMA-->".length);
        const parsed = JSON.parse(jsonStr);
        if (parsed) {
          const blocks = Array.isArray(parsed.blocks) ? parsed.blocks : [];
          const strokes = Array.isArray(parsed.strokes) ? parsed.strokes : [];
          const paperStyle = parsed.paperStyle || "ruled";
          return { blocks: blocks as OneNoteBlock[], paperStyle: paperStyle as string, strokes: strokes as Stroke[] };
        }
      } catch (e) {
        console.error("Failed to parse OneNote content schema:", e);
      }
    }
    
    // Fallback: upgrade old markdown notes into a clean starting block
    return {
      blocks: [
        {
          id: "block-legacy",
          x: 80,
          y: 60,
          w: 600,
          text: activePage.content
        }
      ] as OneNoteBlock[],
      paperStyle: "ruled",
      strokes: [] as Stroke[]
    };
  }, [activePage?.id, activePage?.content]);

  const activePageBlocks = pageCanvasData.blocks;
  const activePagePaperStyle = pageCanvasData.paperStyle;
  const activePageStrokes = pageCanvasData.strokes;

  // Serializer
  const savePageData = (blocks: OneNoteBlock[], paperStyle: string = "ruled", strokes: Stroke[] = activePageStrokes) => {
    if (!activePage) return;
    const serialized = "<!--ONENOTE_SCHEMA-->" + JSON.stringify({ blocks, paperStyle, strokes });
    onUpdatePage(activePage.id, { content: serialized, updatedAt: Date.now() });
  };

  // Auto grow textareas
  const adjustHeight = (el: HTMLTextAreaElement | null) => {
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.max(120, el.scrollHeight)}px`;
  };

  // Spawns block cleanly on single-click on the background
  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Only spawn if click hits the canvas background, not container children
    if (e.target !== e.currentTarget) return;
    if (interactionMode !== "text") return;
    
    // Check if we already have an empty active block to prevent endless note spam
    const activeEmptyBlock = activePageBlocks.find(b => !b.text.trim());
    if (activeEmptyBlock) {
      setEditingBlockId(activeEmptyBlock.id);
      setTempText("");
      setTimeout(() => {
        const txt = document.getElementById(`textarea-${activeEmptyBlock.id}`) as HTMLTextAreaElement;
        if (txt) {
          txt.focus();
          adjustHeight(txt);
        }
      }, 50);
      return;
    }

    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.max(15, Math.round(e.clientX - rect.left));
    const y = Math.max(15, Math.round(e.clientY - rect.top));
    
    const newBlock: OneNoteBlock = {
      id: `block-${Date.now()}`,
      x,
      y,
      w: 360,
      text: ""
    };
    
    const updated = [...activePageBlocks, newBlock];
    savePageData(updated, activePagePaperStyle);
    setEditingBlockId(newBlock.id);
    setTempText("");
    
    setTimeout(() => {
      const textarea = document.getElementById(`textarea-${newBlock.id}`) as HTMLTextAreaElement;
      if (textarea) {
        textarea.focus();
        adjustHeight(textarea);
      }
    }, 70);
  };

  // Annotation Drawing Mechanics
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (interactionMode !== "annotate") return;
    // We only want to draw on the canvas background directly
    if (e.target !== e.currentTarget && (e.target as HTMLElement).tagName !== "svg") return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left + e.currentTarget.scrollLeft;
    const y = e.clientY - rect.top + e.currentTarget.scrollTop;
    
    setCurrentStroke({
      id: `stroke-${Date.now()}`,
      color: penColor,
      width: penWidth,
      points: [{ x, y }]
    });
    
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (interactionMode !== "annotate" || !currentStroke) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left + e.currentTarget.scrollLeft;
    const y = e.clientY - rect.top + e.currentTarget.scrollTop;
    
    setCurrentStroke(prev => prev ? { ...prev, points: [...prev.points, { x, y }] } : null);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (interactionMode !== "annotate" || !currentStroke) return;
    
    savePageData(activePageBlocks, activePagePaperStyle, [...activePageStrokes, currentStroke]);
    setCurrentStroke(null);
    e.currentTarget.releasePointerCapture(e.pointerId);
  };

  // Dragging mechanics
  const handleDragStart = (e: React.MouseEvent, block: OneNoteBlock) => {
    e.preventDefault();
    setDraggingBlockId(block.id);
    
    dragStartRef.current = {
      mX: e.clientX,
      mY: e.clientY,
      bX: block.x,
      bY: block.y
    };
    
    const handleMouseMove = (mvEvent: MouseEvent) => {
      if (!dragStartRef.current) return;
      const deltaX = mvEvent.clientX - dragStartRef.current.mX;
      const deltaY = mvEvent.clientY - dragStartRef.current.mY;
      
      const newX = Math.max(10, dragStartRef.current.bX + deltaX);
      const newY = Math.max(10, dragStartRef.current.bY + deltaY);
      
      const element = document.getElementById(`block-container-${block.id}`);
      if (element) {
        element.style.left = `${newX}px`;
        element.style.top = `${newY}px`;
      }
    };
    
    const handleMouseUp = (upEvent: MouseEvent) => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      
      if (dragStartRef.current) {
        const deltaX = upEvent.clientX - dragStartRef.current.mX;
        const deltaY = upEvent.clientY - dragStartRef.current.mY;
        const newX = Math.max(10, dragStartRef.current.bX + deltaX);
        const newY = Math.max(10, dragStartRef.current.bY + deltaY);
        
        const updated = activePageBlocks.map(b => b.id === block.id ? { ...b, x: newX, y: newY } : b);
        savePageData(updated, activePagePaperStyle);
      }
      setDraggingBlockId(null);
      dragStartRef.current = null;
    };
    
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  };

  const handleResizeStart = (e: React.MouseEvent, block: OneNoteBlock) => {
    e.preventDefault();
    e.stopPropagation();
    
    const startX = e.clientX;
    const startW = block.w || 250;
    
    const handleMouseMove = (mvEvent: MouseEvent) => {
      const deltaX = mvEvent.clientX - startX;
      const newW = Math.max(150, startW + deltaX);
      
      const element = document.getElementById(`block-container-${block.id}`);
      if (element) {
        element.style.width = `${newW}px`;
      }
    };
    
    const handleMouseUp = (upEvent: MouseEvent) => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      
      const deltaX = upEvent.clientX - startX;
      const newW = Math.max(150, startW + deltaX);
      
      const updated = activePageBlocks.map(b => b.id === block.id ? { ...b, w: newW } : b);
      savePageData(updated, activePagePaperStyle);
    };
    
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  };

  const startEditing = (block: OneNoteBlock) => {
    setEditingBlockId(block.id);
    setTempText(block.text);
    setTimeout(() => {
      const txt = document.getElementById(`textarea-${block.id}`) as HTMLTextAreaElement;
      if (txt) {
        txt.focus();
        adjustHeight(txt);
      }
    }, 50);
  };

  // Saves notes or purges empty box completely on blur
  const finishEditing = (blockId: string) => {
    const trimmed = tempText.trim();
    if (!trimmed) {
      // Auto-prune notes with empty text
      const updated = activePageBlocks.filter(b => b.id !== blockId);
      savePageData(updated, activePagePaperStyle);
    } else {
      const updated = activePageBlocks.map(b => b.id === blockId ? { ...b, text: tempText } : b);
      savePageData(updated, activePagePaperStyle);
    }
    setEditingBlockId(null);
    setBracketsTerm(null);
  };

  const handleBlockChange = (blockId: string, val: string, selectionStart: number) => {
    setTempText(val);
    
    const textBeforeCursor = val.slice(0, selectionStart);
    const bracketIndex = textBeforeCursor.lastIndexOf("[[");
    
    if (bracketIndex !== -1 && bracketIndex >= textBeforeCursor.lastIndexOf("]]")) {
      const keyword = textBeforeCursor.slice(bracketIndex + 2);
      setBracketsTerm(keyword);
      setAutocompleteIndex(0);
    } else {
      setBracketsTerm(null);
    }

    // Auto grow height
    const txt = document.getElementById(`textarea-${blockId}`) as HTMLTextAreaElement;
    if (txt) adjustHeight(txt);
  };

  // Markdown format shortcut inserts
  const insertShortcut = (blockId: string, prefix: string, suffix: string) => {
    const textarea = document.getElementById(`textarea-${blockId}`) as HTMLTextAreaElement;
    if (!textarea) return;
    
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const currentVal = tempText;
    const selection = currentVal.substring(start, end);
    const inserted = prefix + selection + suffix;
    const newVal = currentVal.substring(0, start) + inserted + currentVal.substring(end);
    
    setTempText(newVal);
    
    // Maintain state blocks
    const updated = activePageBlocks.map(b => b.id === blockId ? { ...b, text: newVal } : b);
    savePageData(updated, activePagePaperStyle);

    setTimeout(() => {
      textarea.focus();
      const newCursorPos = start + prefix.length + selection.length + suffix.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
      adjustHeight(textarea);
    }, 50);
  };

  const insertBlockWikiLink = (blockId: string, title: string) => {
    const textarea = document.getElementById(`textarea-${blockId}`) as HTMLTextAreaElement;
    if (!textarea) return;
    
    const value = tempText;
    const cursor = textarea.selectionStart;
    const textBeforeCursor = value.slice(0, cursor);
    const bracketIndex = textBeforeCursor.lastIndexOf("[[");
    
    if (bracketIndex !== -1) {
      const beforeStr = value.slice(0, bracketIndex);
      const afterStr = value.slice(cursor);
      const insertStr = `[[${title}]]`;
      const newVal = beforeStr + insertStr + afterStr;
      
      setTempText(newVal);
      setBracketsTerm(null);
      
      const updated = activePageBlocks.map(b => b.id === blockId ? { ...b, text: newVal } : b);
      savePageData(updated, activePagePaperStyle);
      
      setTimeout(() => {
        textarea.focus();
        const newCursorPos = bracketIndex + insertStr.length;
        textarea.setSelectionRange(newCursorPos, newCursorPos);
        adjustHeight(textarea);
      }, 50);
    }
  };

  const deleteBlock = (blockId: string) => {
    const updated = activePageBlocks.filter(b => b.id !== blockId);
    savePageData(updated, activePagePaperStyle);
    if (editingBlockId === blockId) {
      setEditingBlockId(null);
    }
  };

  const handleAddNewManualBlock = () => {
    const newBlock: OneNoteBlock = {
      id: `block-${Date.now()}`,
      x: 80,
      y: 100,
      w: 360,
      text: "Double-click to write down descriptions in markdown format here. Arrange anyway."
    };
    savePageData([...activePageBlocks, newBlock], activePagePaperStyle);
  };

  // Interactive Checklist - Toggles checkbox state directly from the read-only visual note block!
  const toggleMarkdownCheckbox = (blockId: string, lineIndex: number) => {
    const updated = activePageBlocks.map(block => {
      if (block.id !== blockId) return block;
      
      const lines = block.text.split("\n");
      if (lines[lineIndex] !== undefined) {
        const line = lines[lineIndex];
        if (line.trim().startsWith("- [ ]")) {
          lines[lineIndex] = line.replace("- [ ]", "- [x]");
        } else if (line.trim().startsWith("- [x]")) {
          lines[lineIndex] = line.replace("- [x]", "- [ ]");
        }
      }
      return { ...block, text: lines.join("\n") };
    });
    
    savePageData(updated, activePagePaperStyle);
  };

  // Filter sections and notebooks
  const currentSections = useMemo(() => {
    return sections.filter(s => s.notebookId === activeNotebookId);
  }, [sections, activeNotebookId]);

  const currentPages = useMemo(() => {
    return pages.filter(p => p.sectionId === activeSectionId);
  }, [pages, activeSectionId]);

  // OBSIDIAN BACKLINKS: Find all notes pointing to the current active note via [[Page Title]]
  const backlinks = useMemo<Backlink[]>(() => {
    if (!activePage) return [];
    
    const results: Backlink[] = [];
    pages.forEach(otherPage => {
      if (otherPage.id === activePage.id) return;
      
      const escapedTitle = activePage.title.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&");
      const linkReg = new RegExp(`\\[\\[\\s*(${escapedTitle})\\s*\\]\\]`, "i");
      
      if (linkReg.test(getPagePlaintext(otherPage.content))) {
        // Extract a simple snippet of text around the match
        const content = getPagePlaintext(otherPage.content);
        const idx = content.toLocaleLowerCase().indexOf(`[[${activePage.title.toLowerCase()}`);
        const start = Math.max(0, idx - 40);
        const end = Math.min(content.length, idx + activePage.title.length + 50);
        let snippet = content.slice(start, end).replace(/[#*`_]/g, "").trim();
        if (start > 0) snippet = "..." + snippet;
        if (end < content.length) snippet = snippet + "...";
  
        results.push({
          sourcePageId: otherPage.id,
          sourcePageTitle: otherPage.title,
          snippet
        });
      }
    });

    return results;
  }, [activePage, pages]);

  // FILTERED OBSIDIAN PAGES FOR AUTOCOMPLETE MODAL
  const autocompletePages = useMemo(() => {
    if (bracketsTerm === null) return [];
    return pages.filter(p => 
      p.title.toLowerCase().includes(bracketsTerm.toLowerCase()) &&
      (!activePage || p.id !== activePage.id)
    );
  }, [pages, bracketsTerm, activePage]);

  // TASKS ASSOCIATED TO THIS SPECIFIC NOTE PAGE
  const associatedTasks = useMemo(() => {
    if (!activePage) return [];
    return tasks.filter(t => t.linkedPageId === activePage.id);
  }, [tasks, activePage]);

  // HANDLERS FOR CREATION
  const handleCreateNotebook = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNotebookTitle.trim()) return;
    onAddNotebook(newNotebookTitle.trim());
    setNewNotebookTitle("");
    setShowAddNotebook(false);
  };

  const handleCreateSection = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSectionTitle.trim() || !activeNotebookId) return;
    onAddSection(activeNotebookId, newSectionTitle.trim(), newSectionColor);
    setNewSectionTitle("");
    setShowAddSection(false);
  };

  const handleCreatePage = () => {
    if (!activeNotebookId || !activeSectionId) return;
    onAddPage(activeNotebookId, activeSectionId);
  };

  const handleCreateLinkedTaskSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLinkedTaskTitle.trim() || !activePage) return;
    onAddLinkedTask(newLinkedTaskTitle.trim(), activePage.id);
    setNewLinkedTaskTitle("");
  };

  // MICRO CUSTOM MARKDOWN PARSER WITH GRAPH LINKS ROUTING
  const parseMarkdownToReact = (text: string, blockId: string) => {
    if (!text) return <p className="text-zinc-400 text-xs italic">Empty note. Double-click here to write descriptions...</p>;

    const lines = text.split("\n");
    const elements: React.JSX.Element[] = [];
    let stateInCodeBlock = false;
    let codeContent: string[] = [];

    lines.forEach((line, index) => {
      // 1. Code Block logic
      if (line.trim().startsWith("```")) {
        if (stateInCodeBlock) {
          elements.push(
            <pre key={`code-${index}`} className="bg-zinc-100 border border-zinc-200 p-2.5 rounded-lg text-[11px] font-mono text-zinc-805 overflow-x-auto my-1.5 select-text leading-relaxed">
              <code>{codeContent.join("\n")}</code>
            </pre>
          );
          codeContent = [];
          stateInCodeBlock = false;
        } else {
          stateInCodeBlock = true;
        }
        return;
      }

      if (stateInCodeBlock) {
        codeContent.push(line);
        return;
      }

      // 2. Headings
      if (line.startsWith("# ")) {
        elements.push(
          <h1 key={index} className="text-xl font-bold font-sans text-slate-900 border-b border-indigo-50/50 pb-1 mt-3 mb-1.5 tracking-tight">
            {parseWikiAndFormatText(line.slice(2))}
          </h1>
        );
        return;
      }
      if (line.startsWith("## ")) {
        elements.push(
          <h2 key={index} className="text-base font-bold font-sans text-slate-800 mt-2.5 mb-1 tracking-tight">
            {parseWikiAndFormatText(line.slice(3))}
          </h2>
        );
        return;
      }
      if (line.startsWith("### ")) {
        elements.push(
          <h3 key={index} className="text-sm font-semibold font-sans text-slate-700 mt-2 mb-1">
            {parseWikiAndFormatText(line.slice(4))}
          </h3>
        );
        return;
      }

      // 3. Lists and Tasks checkboxes with active toggle functionality!
      if (line.trim().startsWith("- [ ]") || line.trim().startsWith("- [x]")) {
        const completed = line.trim().startsWith("- [x]");
        const labelText = line.substring(line.indexOf("]") + 1).trim();
        elements.push(
          <div 
            key={index} 
            onClick={(e) => {
              e.stopPropagation();
              toggleMarkdownCheckbox(blockId, index);
            }}
            className="flex items-center gap-2 my-1 cursor-pointer select-none group"
            id={`md-check-${index}`}
          >
            <span className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${
              completed 
                ? "bg-indigo-500 border-indigo-500 text-white" 
                : "border-slate-300 hover:border-indigo-400 bg-white"
            }`}>
              {completed && <span className="text-[10px] font-bold">✓</span>}
            </span>
            <span className={`text-sm tracking-wide font-sans transition-all ${
              completed ? "line-through text-slate-400" : "text-slate-700 group-hover:text-slate-900"
            }`}>
              {parseWikiAndFormatText(labelText)}
            </span>
          </div>
        );
        return;
      }

      if (line.startsWith("- ") || line.startsWith("* ")) {
        elements.push(
          <li key={index} className="ml-4 list-disc text-sm text-slate-700 my-0.5 leading-relaxed">
            {parseWikiAndFormatText(line.slice(2))}
          </li>
        );
        return;
      }

      // 4. Paragraph tags / empty spacers
      if (line.trim() === "") {
        elements.push(<div key={index} className="h-1.5" />);
      } else {
        elements.push(
          <p key={index} className="text-sm text-slate-705 leading-relaxed my-0.5 select-text">
            {parseWikiAndFormatText(line)}
          </p>
        );
      }
    });

    return <div className="space-y-0.5 font-sans">{elements}</div>;
  };

  // Convert WikiLink bracket syntaxes to buttons
  const parseWikiAndFormatText = (rawText: string) => {
    const wikiReg = /\[\[(.*?)\]\]/g;
    const parts: any[] = [];
    let lastIndex = 0;
    let match;

    wikiReg.lastIndex = 0;
    while ((match = wikiReg.exec(rawText)) !== null) {
      const matchIndex = match.index;
      if (matchIndex > lastIndex) {
        parts.push(formatInlineStyling(rawText.slice(lastIndex, matchIndex)));
      }

      const wikiTitle = match[1].trim();
      const linkedPage = pages.find(p => p.title.toLowerCase() === wikiTitle.toLowerCase());

      if (linkedPage) {
        parts.push(
          <button
            key={`wiki-${matchIndex}`}
            onClick={(e) => {
              e.stopPropagation();
              onSelectPage(linkedPage.id);
            }}
            className="px-1.5 py-0.5 mx-0.5 rounded cursor-pointer bg-indigo-550/10 text-indigo-600 border border-indigo-550/20 hover:bg-indigo-500 hover:text-white font-semibold text-xs transition inline-flex items-center gap-0.5 align-baseline font-sans"
            title={`Navigate to note: ${linkedPage.title}`}
          >
            <Link2 className="w-3 h-3 shrink-0" />
            <span>{wikiTitle}</span>
          </button>
        );
      } else {
        parts.push(
          <span
            key={`wiki-uncreated-${matchIndex}`}
            className="px-1.5 py-0.5 mx-0.5 rounded text-zinc-400 bg-zinc-100 border border-zinc-200 line-through text-xs inline-block text-[11px] font-sans"
            title={`Note "${wikiTitle}" does not exist yet`}
          >
            {wikiTitle}
          </span>
        );
      }

      lastIndex = wikiReg.lastIndex;
    }

    if (lastIndex < rawText.length) {
      parts.push(formatInlineStyling(rawText.slice(lastIndex)));
    }

    return <>{parts}</>;
  };

  const formatInlineStyling = (textStr: string) => {
    return textStr.split(" ").map((word, wIdx) => {
      if (word.startsWith("#") && word.length > 2) {
        return (
          <span key={wIdx} className="text-indigo-500 font-bold font-sans mr-0.5" id={`md-tag-${wIdx}`}>
            {word}{" "}
          </span>
        );
      }
      if (word.startsWith("**") && word.endsWith("**") && word.length > 4) {
        return (
          <strong key={wIdx} className="text-slate-900 font-extrabold mr-0.5" id={`md-bold-${wIdx}`}>
            {word.slice(2, -2)}{" "}
          </strong>
        );
      }
      return word + " ";
    });
  };  return (
    <div className="flex-1 flex overflow-hidden bg-slate-50" id="onenote-obsidian-workspace">
        {/* 2-tier Accordion Left Sidebar: Notebook list & Section Tabs */}
        <div 
          className={`bg-white border-r border-slate-200 flex flex-col select-none shrink-0 shadow-sm transition-all duration-300 ease-in-out ${isNotebooksSidebarOpen ? 'w-56' : 'w-12 bg-slate-50/70'}`} 
          id="onenote-sidebar"
        >
          {isNotebooksSidebarOpen ? (
            <div className="w-56 flex flex-col h-full bg-white" id="notebooks-sidebar-expanded">
              {/* Tier 1 Header (Consistent height and action placement) */}
              <div className="h-[52px] px-4 border-b border-slate-100 flex items-center justify-between bg-white shrink-0" id="notebook-rail-header">
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider font-sans">Notebooks</span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setShowAddNotebook(!showAddNotebook)}
                    className="text-slate-400 hover:text-indigo-600 transition cursor-pointer p-1 rounded-lg hover:bg-slate-50"
                    id="add-notebook-toggle-btn"
                    title="Create a new notebook"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setIsNotebooksSidebarOpen(false)}
                    className="text-slate-400 hover:text-indigo-600 transition cursor-pointer p-1 rounded-lg hover:bg-slate-50"
                    title="Collapse notebooks"
                    id="collapse-notebooks-side-btn"
                  >
                    <PanelLeftClose className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="flex-1 p-4 flex flex-col gap-6 overflow-y-auto" id="notebooks-expanded-content">
                {/* Knowledge Graph Global Action */}
                <button
                  onClick={handleOpenGraphTab}
                  className="w-full flex items-center justify-between px-3 py-2 bg-indigo-50/50 hover:bg-indigo-50 border border-dashed border-indigo-200/60 rounded-xl text-xs font-bold font-sans text-indigo-700 transition cursor-pointer shadow-xs group"
                  id="notebook-sidebar-graph-tab-btn"
                  title="Open Knowledge Graph"
                >
                  <div className="flex items-center gap-2">
                    <Network className="w-4 h-4 text-indigo-600 group-hover:animate-pulse" />
                    <span>Knowledge Graph</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-indigo-400 group-hover:translate-x-0.5 transition-transform" />
                </button>

                {/* Tier 1: Notebook Selector Dropdown */}
                <div className="flex flex-col gap-2" id="notebook-selectors-section">
                  {/* Quick Add Notebook Box */}
                  {showAddNotebook && (
                    <form onSubmit={handleCreateNotebook} className="p-3 bg-black/5 dark:bg-white/5 rounded-[14px] border border-black/5 dark:border-white/5 flex flex-col gap-2 mb-2 animate-fade-in" id="add-notebook-form">
                      <input
                        type="text"
                        placeholder="Notebook title..."
                        value={newNotebookTitle}
                        onChange={(e) => setNewNotebookTitle(e.target.value)}
                        className="px-3 py-1.5 text-[13px] bg-card-bg text-text-title rounded-lg border border-transparent focus:outline-none focus:ring-2 focus:ring-accent-main/20 placeholder:text-slate-400"
                        id="notebook-name-input"
                      />
                      <button type="submit" className="w-full px-3 py-1.5 bg-accent-main hover:bg-accent-hover text-white rounded-lg text-[12px] font-semibold font-sans cursor-pointer transition-colors" id="notebook-submit-btn">
                        Create
                      </button>
                    </form>
                  )}

                  <select
                    value={activeNotebookId}
                    onChange={(e) => setActiveNotebookId(e.target.value)}
                    className="w-full text-[13px] font-semibold px-3 py-2.5 bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-text-title rounded-xl border border-transparent focus:outline-none focus:ring-2 focus:ring-accent-main/20 font-sans cursor-pointer transition-colors"
                    id="notebook-dropdown"
                  >
                    {notebooks.map(nb => (
                      <option key={nb.id} value={nb.id}>{nb.title}</option>
                    ))}
                  </select>
                </div>

                {/* Tier 2: OneNote-like Sections inside selected notebook */}
                <div className="flex flex-col gap-1.5" id="sections-hierarchy">
                  <div className="flex items-center justify-between mb-1" id="sections-header">
                    <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider font-sans">Section Tabs</span>
                    <button
                      onClick={() => setShowAddSection(!showAddSection)}
                      className="text-slate-400 hover:text-indigo-600 transition cursor-pointer p-1 rounded-lg hover:bg-slate-50"
                      id="add-section-toggle-btn"
                      title="Add a section channel"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Quick Add Section Box */}
                  {showAddSection && (
                    <form onSubmit={handleCreateSection} className="p-3 bg-black/5 dark:bg-white/5 rounded-[14px] border border-black/5 dark:border-white/5 flex flex-col gap-2.5 mb-2 animate-fade-in" id="add-section-form">
                      <input
                        type="text"
                        placeholder="Section title..."
                        value={newSectionTitle}
                        onChange={(e) => setNewSectionTitle(e.target.value)}
                        className="px-3 py-1.5 text-[13px] bg-card-bg text-text-title rounded-lg border border-transparent focus:outline-none focus:ring-2 focus:ring-accent-main/20 placeholder:text-slate-400"
                        id="section-name-input"
                      />
                      <div className="flex justify-between gap-1 px-0.5" id="section-colors-picker">
                        {COLOR_OPTIONS.map(color => (
                          <button
                            type="button"
                            key={color}
                            onClick={() => setNewSectionColor(color)}
                            className={`w-5 h-5 rounded-full border border-black/10 transition-transform cursor-pointer ${newSectionColor === color ? "scale-125 saturate-150 ring-2 ring-offset-1 ring-accent-main ring-offset-card-bg" : "hover:scale-110"}`}
                            style={{
                              backgroundColor:
                                color === "indigo" ? "#6366F1" :
                                color === "sky" ? "#0EA5E9" :
                                color === "emerald" ? "#10B981" :
                                color === "teal" ? "#14B8A6" :
                                color === "amber" ? "#F59E0B" :
                                color === "rose" ? "#F43F5E" : "#8B5CF6"
                            }}
                            id={`section-color-${color}`}
                          />
                        ))}
                      </div>
                      <button type="submit" className="w-full px-3 py-1.5 mt-1 bg-accent-main hover:bg-accent-hover text-white rounded-lg text-[12px] font-semibold font-sans cursor-pointer transition-colors" id="section-submit-btn">
                        Add Tab
                      </button>
                    </form>
                  )}

                  {/* Sections vertical bar tabs (OneNote layout!) */}
                  <div className="flex flex-col gap-1.5 mt-1 max-h-[320px] overflow-y-auto" id="sections-list">
                    {currentSections.map(sec => {
                      const works = activeSectionId === sec.id;
                      const activeBg =
                        sec.color === "indigo" ? "bg-indigo-50 border-indigo-150 text-indigo-700" :
                        sec.color === "sky" ? "bg-sky-50 border-sky-150 text-sky-800" :
                        sec.color === "emerald" ? "bg-emerald-50 border-emerald-150 text-emerald-800" :
                        sec.color === "teal" ? "bg-teal-50 border-teal-150 text-teal-800" :
                        sec.color === "amber" ? "bg-amber-50 border-amber-150 text-amber-800" :
                        sec.color === "rose" ? "bg-rose-50 border-rose-150 text-rose-800" : "bg-purple-50 border-purple-150 text-purple-800";

                      return (
                        <button
                          key={sec.id}
                          onClick={() => {
                            setActiveSectionId(sec.id);
                            onSelectPage(null); // Force autoselect first page in this section
                          }}
                          className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold font-sans transition cursor-pointer ${works
                            ? `${activeBg} border shadow-sm`
                            : "text-slate-600 hover:text-indigo-600 hover:bg-slate-50"
                            }`}
                          id={`section-btn-${sec.id}`}
                        >
                          <div className="flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full`} style={{
                              backgroundColor:
                                sec.color === "indigo" ? "#6366F1" :
                                sec.color === "sky" ? "#0EA5E9" :
                                sec.color === "emerald" ? "#10B981" :
                                sec.color === "teal" ? "#14B8A6" :
                                sec.color === "amber" ? "#F59E0B" :
                                sec.color === "rose" ? "#F43F5E" : "#8B5CF6"
                            }} />
                            <span className="truncate max-w-[110px]">{sec.title}</span>
                          </div>
                        </button>
                      );
                    })}

                    {currentSections.length === 0 && (
                      <span className="text-[10px] text-slate-400 italic font-sans" id="sections-empty-hint">No categories...</span>
                    )}
                  </div>

                  {/* Graph tab removed */}
                </div>
              </div>
            </div>
          ) : (
            <div className="w-12 flex flex-col items-center justify-start h-full bg-slate-50/70" id="notebooks-sidebar-collapsed">
              {/* Perfectly consistent collapsed header height */}
              <div className="h-[52px] border-b border-slate-100 flex items-center justify-center w-full" id="notebook-rail-header-collapsed">
                <button
                  onClick={() => setIsNotebooksSidebarOpen(true)}
                  className="p-1.5 hover:bg-white hover:shadow-xs hover:text-indigo-600 text-slate-400 rounded-lg cursor-pointer transition border border-transparent hover:border-slate-200 bg-white"
                  title="Expand Notebooks"
                  id="expand-notebooks-side-btn"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
              
              <div className="flex-1 flex flex-col items-center justify-start mt-4 gap-4">
                <BookOpen className="w-4.5 h-4.5 text-slate-400/85" />
                <span className="text-[9px] font-extrabold text-slate-420 uppercase tracking-widest leading-none [writing-mode:vertical-lr] select-none">
                  Notebooks
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Pages secondary Vertical Rail */}
        <div 
          className={`bg-white border-r border-slate-200 flex flex-col select-none shrink-0 shadow-sm transition-all duration-300 ease-in-out ${isPagesSidebarOpen ? 'w-52' : 'w-12 bg-slate-50/70'}`} 
          id="pages-rail"
        >
          {isPagesSidebarOpen ? (
            <div className="w-52 flex flex-col h-full bg-white" id="pages-sidebar-expanded">
              {/* Aligned expanded Pages header layout */}
              <div className="h-[52px] px-4 border-b border-slate-100 flex items-center justify-between bg-white shrink-0" id="pages-rail-header">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-sans">Pages</span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={handleCreatePage}
                    disabled={!activeSectionId}
                    className="text-slate-450 enabled:text-slate-500 disabled:opacity-40 hover:text-indigo-600 transition cursor-pointer p-1 rounded-lg hover:bg-slate-50"
                    id="add-page-btn"
                    title="Create a new study record"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setIsPagesSidebarOpen(false)}
                    className="text-slate-400 hover:text-indigo-600 transition cursor-pointer p-1 rounded-lg hover:bg-slate-50"
                    title="Collapse pages list"
                    id="collapse-pages-side-btn"
                  >
                    <PanelLeftClose className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Page Titles listings */}
              <div className="flex-1 p-2 space-y-1 overflow-y-auto" id="pages-list">
                {currentPages.map(page => {
                  const isSelected = selectedPageId === page.id;
                  return (
                    <div
                      key={page.id}
                      onClick={() => handleSelectPageFromSidebar(page.id)}
                      className={`group px-3 py-2.5 rounded-xl text-left cursor-pointer transition ${isSelected
                        ? "bg-indigo-55 border border-indigo-120 text-indigo-750 font-bold"
                        : "hover:bg-slate-50 text-slate-600 hover:text-slate-950"
                        }`}
                      id={`page-link-${page.id}`}
                    >
                      <div className="flex justify-between items-start" id={`page-lnk-top-${page.id}`}>
                        <h4 className="text-xs font-semibold font-sans truncate pr-2 max-w-[130px]">{page.title || "(Untitled Page)"}</h4>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setConfirmModal({
                              isOpen: true,
                              title: "Delete Study Page?",
                              message: `Are you sure you want to permanently delete "${page.title || 'Untitled Page'}"? This action cannot be undone and will remove it from all notebooks, tab groups, and concept map nodes.`,
                              onConfirm: () => handleCloseAndDeletePage(page.id)
                            });
                          }}
                          className="p-0.5 rounded text-slate-400 hover:text-red-500 hover:bg-rose-55 opacity-0 group-hover:opacity-100 transition shrink-0 cursor-pointer"
                          id={`page-delete-btn-${page.id}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      {/* Visual Tags list below */}
                      {page.tags && page.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1.5" id={`page-lnk-tags-${page.id}`}>
                          {page.tags.slice(0, 2).map((tg, i) => (
                            <span key={i} className="text-[9px] bg-slate-100 text-slate-500 font-bold rounded px-1.5 py-0.5 font-sans">
                              #{tg}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}

                {currentPages.length === 0 && (
                  <div className="text-center py-10 px-2 text-slate-400 text-xs italic" id="pages-empty-state">
                    <StickyNote className="w-6 h-6 text-slate-300 mx-auto mb-2" />
                    <span>No pages here.</span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="w-12 flex flex-col items-center justify-start h-full bg-slate-50/70" id="pages-sidebar-collapsed">
              {/* Aligned collapsed Pages header */}
              <div className="h-[52px] border-b border-slate-100 flex items-center justify-center w-full" id="pages-rail-header-collapsed">
                <button
                  onClick={() => setIsPagesSidebarOpen(true)}
                  className="p-1.5 hover:bg-white hover:shadow-xs hover:text-indigo-600 text-slate-400 rounded-lg cursor-pointer transition border border-transparent hover:border-slate-200 bg-white"
                  title="Expand Pages"
                  id="expand-pages-side-btn"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
              
              <div className="flex-1 flex flex-col items-center justify-start mt-4 gap-4">
                <StickyNote className="w-4.5 h-4.5 text-slate-400/85" />
                <span className="text-[9px] font-extrabold text-slate-420 uppercase tracking-widest leading-none [writing-mode:vertical-lr] select-none">
                  Pages
                </span>
              </div>
            </div>
          )}
        </div>
        
        {/* Main Focus Area: Tabbed Content Container */}
        <div className="flex-1 flex flex-col overflow-hidden bg-white" id="editor-active-canvas">
          {/* Note Tabs Bar */}
          {openTabs.length > 0 && (
            <div className="bg-slate-50 border-b border-slate-200 flex items-center px-4 h-11 shrink-0 gap-1.5 overflow-x-auto select-none font-sans" id="note-tabs-container">
              {openTabs.map(tabId => {
                const isTabActive = activeTabId === tabId;
                let tabTitle = "Untitled note";
                let TabIcon = StickyNote;

                if (tabId === "__graph__") {
                  tabTitle = "Knowledge Graph";
                  TabIcon = Network;
                } else {
                  const foundPage = pages.find(p => p.id === tabId);
                  if (foundPage) {
                    tabTitle = foundPage.title || "Untitled Note";
                  }
                }

                return (
                  <div
                    key={tabId}
                    onClick={() => handleSelectTab(tabId)}
                    className={`group flex items-center gap-2 px-3.5 py-1.5 rounded-t-xl transition-all duration-150 cursor-pointer text-xs font-sans h-9 relative outline-none border-b-0 ${
                      isTabActive
                        ? "bg-white text-indigo-700 font-bold border-t-2 border-t-indigo-600 border-x border-slate-205/60 -mb-px z-10 shadow-[0_-2px_4px_rgba(0,0,0,0.02)]"
                        : "text-slate-500 hover:text-slate-800 hover:bg-slate-100/60 border border-transparent"
                    }`}
                    id={`note-tab-${tabId}`}
                  >
                    <TabIcon className={`w-3.5 h-3.5 ${isTabActive ? "text-indigo-600 animate-pulse" : "text-slate-400 group-hover:text-slate-500"}`} />
                    <span className="truncate max-w-[140px]">{tabTitle}</span>
                    <button
                      onClick={(e) => handleCloseTab(e, tabId)}
                      className="p-0.5 rounded-full hover:bg-slate-205 text-slate-400 hover:text-slate-605 transition duration-100 cursor-pointer ml-1 flex items-center justify-center opacity-60 group-hover:opacity-100"
                      title="Close tab"
                      id={`note-tab-close-${tabId}`}
                    >
                      <X className="w-2.5 h-2.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* Active Canvas Body Selection */}
          {openTabs.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 bg-white text-center text-slate-400 select-none relative" id="editor-empty">
              {(!isNotebooksSidebarOpen || !isPagesSidebarOpen) && (
                <button
                  onClick={() => { setIsNotebooksSidebarOpen(true); setIsPagesSidebarOpen(true); }}
                  className="absolute top-6 left-6 p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded cursor-pointer transition shadow-sm"
                  title="Expand sidebars"
                >
                  <PanelLeft className="w-5 h-5" />
                </button>
              )}
              <BookOpen className="w-10 h-10 text-slate-250 animate-bounce mb-3" />
              <h4 className="font-bold text-slate-700 font-sans" id="editor-empty-heading">Select or Create a Study Page</h4>
              <p className="text-xs text-slate-400 mt-1.5 max-w-sm leading-relaxed" id="editor-empty-body">Click any section tab grouped under the OneNote notebooks side panels, then select a page to launch your Obsidian coordinate visual workspace!</p>
            </div>
          ) : activeTabId === "__graph__" ? (
            <div className="flex-1 flex flex-col overflow-hidden bg-slate-50" id="editor-graph-view-tab">
              <GraphView
                pages={pages}
                onSelectPage={(id) => {
                  if (id) {
                    setOpenTabs(prev => {
                      if (!prev.includes(id)) {
                        return [...prev, id];
                      }
                      return prev;
                    });
                    setActiveTabId(id);
                    onSelectPage(id);
                  }
                }}
                currentPageId={selectedPageId || undefined}
              />
            </div>
          ) : activePage ? (
            <div className="flex-1 flex flex-col overflow-hidden bg-main-bg" id="editor-active-canvas-inner">
              
              {/* Dynamic properties segment: Title input & Tags string */}
              <div className="px-8 pt-6 pb-4 border-b border-border-theme bg-main-bg flex flex-col gap-2 relative" id="editor-properties">
                
                <div className="absolute top-6 right-8 flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-full border bg-card-bg shadow-xs border-border-theme text-text-muted select-none">
                  {isSyncing ? (
                    <>
                      <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                      <span>Syncing...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-3 h-3 text-emerald-500" />
                      <span>Saved</span>
                    </>
                  )}
                </div>

              <input
                type="text"
                value={activePage.title}
                placeholder="Give your note a title..."
                onChange={(e) => onUpdatePage(activePage.id, { title: e.target.value, updatedAt: Date.now() })}
                className="text-2xl font-bold font-display tracking-tight text-text-title border-none bg-transparent focus:outline-none placeholder:text-slate-350 w-full"
                id="active-title-input"
              />
              
              {/* Tag Inputs */}
              <div className="flex items-center gap-2" id="tags-row">
                <Tag className="w-3.5 h-3.5 text-text-muted shrink-0" />
                <input
                  type="text"
                  placeholder="Course tags (comma-separated, e.g. formulas, homework)..."
                  value={activePage.tags ? activePage.tags.join(", ") : ""}
                  onChange={(e) => {
                    const cleaned = e.target.value.split(",").map(tg => tg.trim()).filter(tg => tg.length > 0);
                    onUpdatePage(activePage.id, { tags: cleaned });
                  }}
                  className="text-xs bg-transparent border-none text-text-muted focus:outline-none w-full font-sans font-medium placeholder:text-slate-400"
                  id="active-tags-input"
                />
              </div>

            </div>

            {/* Core Body Container - editor pane / live preview rendering */}
            <div 
              onClick={handleCanvasClick}
              className="flex-1 h-full overflow-auto relative min-h-[440px] pb-40 bg-white cursor-text"
              id="split-workspace-panels"
            >

              {/* Active Blocks Render Layout */}
              {activePageBlocks.map((block) => {
                const isEditing = editingBlockId === block.id;

                return (
                  <div
                    key={block.id}
                    id={`block-container-${block.id}`}
                    className={`absolute border rounded-lg transition-colors duration-150 bg-transparent group ${
                      isEditing 
                        ? "border-indigo-400/85 z-30" 
                        : draggingBlockId === block.id
                          ? "border-indigo-500/85 border-dashed z-30 scale-[1.01]"
                          : "border-transparent hover:border-slate-300/80 z-10"
                    }`}
                    style={{
                      left: `${block.x}px`,
                      top: `${block.y}px`,
                      width: `${block.w}px`,
                      minWidth: "220px",
                      overflow: "visible"
                    }}
                  >
                    {/* Quiet minimalist OneNote Header Bar on top of container (fades in on hover / visible during drag/edit) */}
                    <div 
                      className={`absolute top-0 left-0 right-0 h-7 bg-slate-100/90 border-b border-slate-200 rounded-t-lg flex items-center justify-between px-2 text-slate-400 select-none z-20 transition-opacity duration-150 ${
                        isEditing || draggingBlockId === block.id 
                          ? "opacity-100" 
                          : "opacity-0 group-hover:opacity-100"
                      }`}
                    >
                      {/* Quiet Trash/Delete on far left */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setConfirmModal({
                            isOpen: true,
                            title: "Delete Note Box?",
                            message: "Are you sure you want to delete this text container? You will lose any un-saved thoughts or notes inside.",
                            onConfirm: () => deleteBlock(block.id)
                          });
                        }}
                        className="p-1 hover:bg-rose-50 text-slate-300 hover:text-red-500 rounded transition duration-150 cursor-pointer pointer-events-auto"
                        title="Delete note container"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>

                      {/* Center: Dotted dragging handle */}
                      <div
                        onMouseDown={(e) => handleDragStart(e, block)}
                        className="flex gap-0.5 items-center justify-center cursor-move px-3 py-1 hover:bg-slate-200/80 rounded transition pointer-events-auto"
                        title="Drag Note Container"
                      >
                        <span className="text-[13px] font-extrabold text-slate-400 tracking-[0.2em] leading-none select-none">••••</span>
                      </div>

                      {/* Right: Custom drag-to-resize ◀▶ button */}
                      <button
                        onMouseDown={(e) => handleResizeStart(e, block)}
                        className="p-1 hover:bg-slate-200 text-slate-500 hover:text-slate-800 rounded transition cursor-ew-resize flex items-center justify-center gap-0.5 pointer-events-auto select-none"
                        title="Drag to resize horizontally"
                      >
                        <span className="text-[11px] font-extrabold leading-none select-none">◀▶</span>
                      </button>
                    </div>

                    {/* Block body contents (Blended transparent WYSIWYG style) */}
                    <div 
                      className="p-4 pt-8" 
                      onClick={(e) => {
                        e.stopPropagation(); // Avoid spawning new boxes on click
                      }}
                      onDoubleClick={(e) => {
                        e.stopPropagation();
                        startEditing(block);
                      }}
                    >
                      {isEditing ? (
                        <div className="relative font-sans text-sm select-text">
                          <textarea
                            id={`textarea-${block.id}`}
                            defaultValue={block.text}
                            onChange={(e) => handleBlockChange(block.id, e.target.value, e.target.selectionStart)}
                            onBlur={() => {
                              // Wrap in slight timeout to let wiki suggestions clicked registry successfully
                              setTimeout(() => {
                                finishEditing(block.id);
                              }, 250);
                            }}
                            ref={(el) => adjustHeight(el)}
                            placeholder="Type markdown, study points, checklists. Use double brackets [[Page]] to link notes..."
                            className="w-full text-sm font-sans bg-transparent border-none p-1 focus:outline-none font-medium leading-relaxed resize-none text-slate-800 placeholder:text-slate-300 pointer-events-auto select-text overflow-hidden"
                            title="Add your notes"
                          />

                          {/* SUGGESTION LISTS INSIDE ACTIVE TEXT CONTAINER */}
                          {bracketsTerm !== null && autocompletePages.length > 0 && (
                            <div 
                              className="absolute left-0 bottom-full mb-2 w-full max-h-40 bg-white border border-slate-200 rounded-xl shadow-xl p-1 overflow-y-auto z-45"
                              id="canvas-wikilink-popup"
                            >
                              <p className="text-[9px] uppercase tracking-wider font-extrabold text-indigo-600 px-2 py-1 flex items-center gap-1 font-sans select-none pointer-events-none">
                                <Sparkles className="w-2.5 h-2.5" />
                                <span>Note targets Suggestions</span>
                              </p>
                              {autocompletePages.map((pageOpt) => (
                                <button
                                  key={pageOpt.id}
                                  type="button"
                                  onMouseDown={(e) => {
                                    e.preventDefault(); // Stop blur from triggering
                                    insertBlockWikiLink(block.id, pageOpt.title);
                                  }}
                                  className="w-full flex items-center gap-2 text-left text-xs px-2 py-1.5 rounded-lg hover:bg-indigo-50 hover:text-indigo-700 font-medium transition cursor-pointer font-sans"
                                >
                                  <StickyNote className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                  <span className="truncate">{pageOpt.title}</span>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      ) : (
                        <article 
                          className="prose prose-slate prose-sm max-w-none prose-headings:font-bold prose-headings:tracking-tight cursor-text select-text pointer-events-auto leading-relaxed"
                          onClick={(e) => {
                            // Single click inside prose preview edit trigger option
                            const selection = window.getSelection();
                            if (!selection || selection.toString().trim() === "") {
                              // Only edit if user didn't select text intentionally
                              startEditing(block);
                            }
                          }}
                        >
                          {parseMarkdownToReact(block.text, block.id)}
                          {!block.text && (
                            <p className="text-[11px] text-slate-300 italic">Double-click here to write text...</p>
                          )}
                        </article>
                      )}
                    </div>
                  </div>
                );
              })}

              {activePageBlocks.length === 0 && (
                <div className="absolute inset-x-0 top-1/3 flex flex-col items-center justify-center p-8 bg-transparent text-center text-slate-400 select-none pointer-events-none z-0">
                  <StickyNote className="w-10 h-10 text-slate-300 mb-2" />
                  <h4 className="font-bold text-slate-700 text-sm">Empty Visual Page Canvas</h4>
                  <p className="text-xs text-slate-450 mt-1 max-w-sm leading-relaxed font-sans">
                    Single-click anywhere around this paper background to pop up standard note blocks, draw connections, and arrange ideas or tasks!
                  </p>
                </div>
              )}
            </div>

            {/* Footer Drawers: Bi-directional Links & Attached Todoist checklist summary */}
            <div className="border-t border-slate-200 bg-slate-50/50 px-8 py-5 flex flex-col md:flex-row gap-8 shrink-0 min-h-[140px]" id="editor-drawers">
              
              {/* Left box: Backlinks */}
              <div className="flex-1 flex flex-col gap-2" id="backlinks-drawer">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 font-sans">
                  <Link2 className="w-3.5 h-3.5 text-indigo-505" />
                  <span>Obsidian Bi-directional Backlinks</span>
                </span>

                <div className="flex flex-col gap-1.5 overflow-y-auto max-h-[120px]" id="backlinks-container">
                  {backlinks.length > 0 ? (
                    backlinks.map(b => (
                      <div
                        key={b.sourcePageId}
                        onClick={() => onSelectPage(b.sourcePageId)}
                        className="text-xs p-2 rounded-xl border border-slate-200 bg-white hover:bg-indigo-50/30 hover:border-indigo-200 cursor-pointer transition flex flex-col gap-1 select-none font-sans"
                        id={`backlink-${b.sourcePageId}`}
                      >
                        <span className="font-bold text-indigo-600 font-sans flex items-center gap-1">
                          <Columns className="w-3 h-3 text-indigo-500" />
                          {b.sourcePageTitle}
                        </span>
                        <p className="text-[11px] text-slate-450 italic line-clamp-1">{b.snippet}</p>
                      </div>
                    ))
                  ) : (
                    <span className="text-xs text-slate-450 italic font-sans" id="backlinks-empty-label">
                      No active backlinks pointing to this note. Tag it elsewhere using [[{activePage.title}]]
                    </span>
                  )}
                </div>
              </div>

              {/* Right box: Associated Todoist list */}
              <div className="flex-1 flex flex-col gap-4 border-t md:border-t-0 md:border-l border-slate-200 md:pl-8 pt-4 md:pt-0 font-sans" id="tasks-drawer">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 font-sans">
                  <CheckSquare className="w-3.5 h-3.5 text-indigo-505" />
                  <span>Linked Todoist Tasks ({associatedTasks.length})</span>
                </span>

                {/* Dynamic Task list inside Obsidian note */}
                <div className="flex-1 flex flex-col gap-2 max-h-[100px] overflow-y-auto mb-2" id="linked-tasks-list">
                  {associatedTasks.map(task => (
                    <div key={task.id} className="flex items-center justify-between gap-4 p-1.5 hover:bg-slate-50 rounded transition" id={`linked-task-row-${task.id}`}>
                      <label className="flex items-center gap-2 text-xs text-slate-700 font-sans cursor-pointer truncate max-w-[200px]" id={`linked-task-label-${task.id}`}>
                        <input
                          type="checkbox"
                          checked={task.completed}
                          onChange={() => onToggleTaskComplete(task.id)}
                          className="rounded border-slate-300 bg-white text-indigo-600 focus:ring-none cursor-pointer"
                          id={`linked-task-check-${task.id}`}
                        />
                        <span className={task.completed ? "line-through text-slate-400" : "font-semibold text-slate-700"}>{task.title}</span>
                      </label>
                      <span className="text-[9px] font-mono font-bold uppercase text-red-500" id={`linked-task-prio-${task.id}`}>P{task.priority}</span>
                    </div>
                  ))}
                  {associatedTasks.length === 0 && (
                    <span className="text-xs text-slate-440 italic font-sans py-1" id="linked-tasks-empty">
                      No connected tasks. Create one immediately below.
                    </span>
                  )}
                </div>

                {/* Instant Link Add Task */}
                <form onSubmit={handleCreateLinkedTaskSubmit} className="flex gap-2" id="linked-task-add-form font-sans">
                  <input
                    type="text"
                    placeholder="Create task for this note..."
                    value={newLinkedTaskTitle}
                    onChange={(e) => setNewLinkedTaskTitle(e.target.value)}
                    className="flex-1 px-3 py-1.5 text-[13px] bg-black/5 dark:bg-white/5 border border-transparent rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-main/20 text-text-title placeholder:text-slate-400 font-sans font-medium hover:bg-black/10 dark:hover:bg-white/10 transition-colors pointer-event-auto"
                    id="linked-task-add-input"
                  />
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-accent-main hover:bg-accent-hover text-white rounded-xl text-[12px] font-semibold font-sans cursor-pointer transition-colors shadow-sm"
                    id="linked-task-submit-btn"
                  >
                    Add
                  </button>
                </form>
              </div>

            </div>

          </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 bg-white text-center text-slate-400 select-none relative" id="editor-tab-not-found">
              <StickyNote className="w-10 h-10 text-slate-250 mb-3" />
              <h4 className="font-bold text-slate-700 font-sans">Tab Note Unloaded</h4>
              <p className="text-xs text-slate-400 mt-1">This page is no longer active or was deleted.</p>
            </div>
          )}

        </div>

        {/* Premium Frameless Custom Confirmation Modal */}
        {confirmModal && confirmModal.isOpen && (
          <div className="fixed inset-0 bg-black/20 dark:bg-black/40 backdrop-blur-sm flex items-center justify-center z-[1000] animate-fade-in animate-duration-150" id="custom-confirm-modal-overlay">
            <div className="bg-card-bg/90 backdrop-blur-xl border border-black/5 dark:border-white/10 rounded-[24px] max-w-sm w-full p-6 shadow-[0_20px_60px_rgba(0,0,0,0.15)] flex flex-col gap-4 text-left font-sans select-none" id="custom-confirm-modal-box">
              <h3 className="font-semibold text-text-title text-base flex items-center gap-2" id="custom-confirm-title">
                <span className="w-2 h-2 bg-rose-500 rounded-full animate-pulse" />
                {confirmModal.title}
              </h3>
              <p className="text-[13px] text-text-muted leading-relaxed font-medium" id="custom-confirm-msg">
                {confirmModal.message}
              </p>
              <div className="flex items-center justify-end gap-2.5 pt-2" id="custom-confirm-actions">
                <button
                  onClick={() => setConfirmModal(null)}
                  className="px-5 py-2 bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 text-text-title rounded-full text-[13px] font-medium transition cursor-pointer"
                  id="custom-confirm-cancel-btn"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    confirmModal.onConfirm();
                    setConfirmModal(null);
                  }}
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-full text-[13px] font-semibold transition cursor-pointer shadow-sm"
                  id="custom-confirm-confirm-btn"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
  );
}
