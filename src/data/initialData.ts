/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { WorkspaceState } from "../types";

export const INITIAL_STATE: WorkspaceState = {
  notebooks: [
    { id: "nb-cs", title: "💻 Computer Science", createdAt: Date.now() - 1000 * 60 * 60 * 24 * 7 },
    { id: "nb-chem", title: "🧪 Organic Chemistry", createdAt: Date.now() - 1000 * 60 * 60 * 24 * 5 },
    { id: "nb-lit", title: "📚 English Literature", createdAt: Date.now() - 1000 * 60 * 60 * 24 * 3 }
  ],
  sections: [
    // Computer Science Sections
    { id: "sec-ds", notebookId: "nb-cs", title: "Data Structures", color: "indigo" },
    { id: "sec-algo", notebookId: "nb-cs", title: "Algorithms", color: "sky" },
    // Chemistry Sections
    { id: "sec-alkanes", notebookId: "nb-chem", title: "Alkanes & Alkynes", color: "emerald" },
    { id: "sec-lab", notebookId: "nb-chem", title: "Lab Prep", color: "teal" },
    // Literature Sections
    { id: "sec-shak", notebookId: "nb-lit", title: "Shakespeare", color: "amber" }
  ],
  pages: [
    // Data Structures Pages
    {
      id: "page-binary-tree",
      sectionId: "sec-ds",
      notebookId: "nb-cs",
      title: "Binary Search Trees",
      content: `# Binary Search Trees (BST)

A **Binary Search Tree** is a node-based binary tree data structure with the following properties:
- The left subtree of a node contains only nodes with keys less than the node's key.
- The right subtree of a node contains only nodes with keys greater than the node's key.
- Both left and right subtrees must also be binary search trees.

### Space & Time Complexity
- **Search**: O(log n) average | O(n) worst-case
- **Insertion**: O(log n) average | O(n) worst-case
- **Deletion**: O(log n) average | O(n) worst-case

### Related Concepts
- Read the main page on [[Data Structures]] for a bird's eye view.
- Contrast these with [[Recursion]] processes which are commonly used to implement BST traversal (In-order, Pre-order, Post-order).

#study #comp-sci #trees`,
      tags: ["study", "comp-sci", "trees"],
      updatedAt: Date.now() - 1000 * 60 * 60 * 6
    },
    {
      id: "page-ds-summary",
      sectionId: "sec-ds",
      notebookId: "nb-cs",
      title: "Data Structures",
      content: `# Big-O Data Structures Summary

Understanding memory structures is fundamental to choosing correct algorithm paths.

### Fundamental Structures
1. **Arrays**: Contiguous memory slots with instant indexed retrieval.
2. **Linked Lists**: Linked series of nodes carrying local cargo and pointers to neighbor nodes.
3. **Trees**: Hierarchical nodes with parent-child connections. A notable implementation is [[Binary Search Trees]].

Let's organize code paradigms using [[Recursion]] approaches for tree-related traversals.

#review #core-prep`,
      tags: ["review", "core-prep"],
      updatedAt: Date.now() - 1000 * 60 * 60 * 24
    },
    // Algorithms Pages
    {
      id: "page-recursion",
      sectionId: "sec-algo",
      notebookId: "nb-cs",
      title: "Recursion",
      content: `# Recursion Basics

Recursion occurs when a function calls itself, directly or indirectly, to solve smaller instances of the same problem.

### Essential Components
1. **Base Case**: The termination condition that yields an immediate value. Without this, recursion runs into infinite stack overflow.
2. **Recursive Step**: Reducing the problem's size and invoking itself.

### Tree Traversal Application
Recursion is widely implemented across [[Binary Search Trees]] depth-first listings because each subtree is itself a BST node system!

Review [[Data Structures]] to see other recursive frameworks.

#computations #foundational`,
      tags: ["computations", "foundational"],
      updatedAt: Date.now() - 1000 * 60 * 60 * 12
    },
    // Organic Chemistry Pages
    {
      id: "page-alkanes",
      sectionId: "sec-alkanes",
      notebookId: "nb-chem",
      title: "Alkanes Nomenclature",
      content: `# Alkanes Nomenclature

Alkanes are saturated hydrocarbons containing only single covalent bonds between carbon atoms.

### IUPAC Naming System Rules:
1. Locate the **longest continuous carbon chain** (parent alkane).
2. Number the carbon chain starting from the end closest to any substituent branches.
3. Identify and name substituents (e.g., methyl, ethyl, propyl groups).
4. Order multiple substituents alphabetically. Prefix counts with di-, tri-, tetra- etc.

Ensure variables are logged correctly in [[Lab Prep]] notebooks for synthesis evaluations.

#chemistry #synth #exam-2`,
      tags: ["chemistry", "synth", "exam-2"],
      updatedAt: Date.now() - 1000 * 60 * 60 * 48
    },
    {
      id: "page-lab-prep",
      sectionId: "sec-lab",
      notebookId: "nb-chem",
      title: "Lab Prep",
      content: `# Lab Week 4 Prep: Hydrocarbon Reactions

### Objective:
Classifying saturated vs unsaturated hydrocarbons using bromine water and potassium permanganate screening indicators.

### Safety Note:
- Bromine water is volatile and irritating. Handle exclusively within active fume hoods.
- Wear proper chemical splash face guards at all times!

### Pre-Lab Concept Checklist:
- Read [[Alkanes Nomenclature]] properties to understand structural limits of butane vs hexane reaction rates.

#lab-report #safety #pre-lab`,
      tags: ["lab-report", "safety", "pre-lab"],
      updatedAt: Date.now() - 1000 * 60 * 60 * 2
    },
    // Shakespeare Pages
    {
      id: "page-hamlet",
      sectionId: "sec-shak",
      notebookId: "nb-lit",
      title: "Hamlet Themes",
      content: `# Shakespeare's Hamlet: Core Themes

*Hamlet* remains a pivotal tragedy tracking the psychological descent of its titular Danish prince.

### Major Themes Explored:
1. **Action vs. Inaction**: Hamlet's obsessive philosophical hesitation contrasted alongside Laertes' impulsive vengeance.
2. **Appearance vs. Reality**: Characters acting under layers of deceit (Polonius spying behind tapestries, Claudius wearing a righteous mask, Hamlet feigning madness).
3. **Mortality & Corruption**: The rot of Denmark symbolized through soil, skulls, and poison.

Compare Hamlet's madness structure with Ophelia's grief-induced madness.

#lit #plays #shakespeare #philosophy`,
      tags: ["lit", "plays", "shakespeare", "philosophy"],
      updatedAt: Date.now() - 1000 * 60 * 60 * 72
    }
  ],
  projects: [
    { id: "proj-inbox", name: "📥 Inbox", color: "#3B82F6" },
    { id: "proj-cs101", name: "💻 CS 101 Study", color: "#6366F1" },
    { id: "proj-chem2", name: "🧪 Chem Lab Prep", color: "#10B981" },
    { id: "proj-lit", name: "📚 Lit Essays", color: "#F59E0B" }
  ],
  tasks: [
    {
      id: "task-1",
      title: "Confirm Lab Prep reagents inventory",
      priority: 1,
      dueDate: new Date().toISOString().split("T")[0], // Today
      completed: false,
      projectId: "proj-chem2",
      labels: ["lab", "reagents"],
      linkedPageId: "page-lab-prep",
      createdAt: Date.now() - 1000 * 60 * 60 * 12
    },
    {
      id: "task-2",
      title: "Practice Binary Search Tree traversals",
      priority: 2,
      dueDate: new Date().toISOString().split("T")[0], // Today
      completed: false,
      projectId: "proj-cs101",
      labels: ["recursion", "coding"],
      linkedPageId: "page-binary-tree",
      createdAt: Date.now() - 1000 * 60 * 60 * 10
    },
    {
      id: "task-3",
      title: "Revise Alkanes naming rules for Quiz-1",
      priority: 3,
      dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString().split("T")[0], // Tomorrow
      completed: false,
      projectId: "proj-chem2",
      labels: ["quiz-prep"],
      linkedPageId: "page-alkanes",
      createdAt: Date.now() - 1000 * 60 * 60 * 24
    },
    {
      id: "task-4",
      title: "Outline Hamlet thesis structure",
      priority: 2,
      dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 3).toISOString().split("T")[0], // In 3 days
      completed: false,
      projectId: "proj-lit",
      labels: ["essay", "outline"],
      linkedPageId: "page-hamlet",
      createdAt: Date.now() - 1000 * 60 * 60 * 8
    },
    {
      id: "task-5",
      title: "Review Recursion homework tasks",
      priority: 4,
      completed: true,
      projectId: "proj-cs101",
      labels: ["done"],
      linkedPageId: "page-recursion",
      createdAt: Date.now() - 1000 * 60 * 60 * 30
    },
    {
      id: "task-6",
      title: "Draft abstract for Shakespeare paper",
      priority: 1,
      completed: true,
      projectId: "proj-lit",
      labels: ["draft"],
      linkedPageId: "page-hamlet",
      createdAt: Date.now() - 1000 * 60 * 60 * 36
    }
  ],
  events: [
    {
      id: "event-1",
      title: "💻 CS 101 Lecture: Binary Trees",
      description: "Review BST traversals and Big-O computational complexity. Look at [[Binary Search Trees]].",
      start: "2026-05-26T10:00",
      end: "2026-05-26T11:30",
      color: "#6366F1",
      projectId: "proj-cs101"
    },
    {
      id: "event-2",
      title: "🧪 Organic Chem Lab Prep",
      description: "Handle reagents under active fume hoods. Safety goggles required! Link to note [[Lab Prep]].",
      start: "2026-05-27T13:00",
      end: "2026-05-27T15:00",
      color: "#10B981",
      projectId: "proj-chem2"
    },
    {
      id: "event-3",
      title: "📚 Shakespeare Hamlet Seminar",
      description: "Discussion on Action vs Inaction in Hamlet Act III. Focus on theme outlines.",
      start: "2026-05-28T09:00",
      end: "2026-05-28T10:30",
      color: "#F59E0B",
      projectId: "proj-lit"
    },
    {
      id: "event-4",
      title: "🚀 Algorithm Study Marathon",
      description: "Review recursive structures and sorting paradigms with study group.",
      start: "2026-05-29T14:00",
      end: "2026-05-29T18:00",
      color: "#6366F1",
      projectId: "proj-cs101"
    },
    {
      id: "event-5",
      title: "📝 English Literature Essay due",
      description: "Submit final outline drafts of Shakespeare tragedies comparison.",
      start: "2026-05-29T08:00",
      end: "2026-05-29T09:00",
      color: "#F59E0B",
      projectId: "proj-lit",
      allDay: true
    },
    {
      id: "event-6",
      title: "💬 CS 101 Office Hours",
      description: "Ask professor regarding worst-case algorithmic runtime queries.",
      start: "2026-05-26T15:00",
      end: "2026-05-26T16:00",
      color: "#6366F1",
      projectId: "proj-cs101"
    }
  ]
};
