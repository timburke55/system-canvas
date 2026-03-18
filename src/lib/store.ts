import { create } from "zustand";
import type { Node, Edge, Viewport, OnNodesChange, OnEdgesChange, applyNodeChanges, applyEdgeChanges } from "@xyflow/react";

export interface DiagramState {
  diagramId: string | null;
  title: string;
  nodes: Node[];
  edges: Edge[];
  viewport: Viewport;

  // Actions
  setDiagram: (id: string, title: string, nodes: Node[], edges: Edge[], viewport: Viewport) => void;
  setTitle: (title: string) => void;
  setNodes: (nodes: Node[]) => void;
  setEdges: (edges: Edge[]) => void;
  onNodesChange: OnNodesChange;
  onEdgesChange: OnEdgesChange;
  setViewport: (viewport: Viewport) => void;
  markDirty: () => void;

  // Auto-save
  isDirty: boolean;
  lastSavedAt: number | null;
}

// We need to import these at the module level for the store
let _applyNodeChanges: typeof applyNodeChanges;
let _applyEdgeChanges: typeof applyEdgeChanges;

// Dynamically import to avoid SSR issues
const initHelpers = async () => {
  const rf = await import("@xyflow/react");
  _applyNodeChanges = rf.applyNodeChanges;
  _applyEdgeChanges = rf.applyEdgeChanges;
};
initHelpers();

export const useDiagramStore = create<DiagramState>((set) => ({
  diagramId: null,
  title: "Untitled Diagram",
  nodes: [],
  edges: [],
  viewport: { x: 0, y: 0, zoom: 1 },
  isDirty: false,
  lastSavedAt: null,

  setDiagram: (id, title, nodes, edges, viewport) =>
    set({ diagramId: id, title, nodes, edges, viewport, isDirty: false }),

  setTitle: (title) => set({ title, isDirty: true }),

  setNodes: (nodes) => set({ nodes, isDirty: true }),

  setEdges: (edges) => set({ edges, isDirty: true }),

  onNodesChange: (changes) =>
    set((state) => ({
      nodes: _applyNodeChanges(changes, state.nodes),
      isDirty: true,
    })),

  onEdgesChange: (changes) =>
    set((state) => ({
      edges: _applyEdgeChanges(changes, state.edges),
      isDirty: true,
    })),

  setViewport: (viewport) => set({ viewport }),

  markDirty: () => set({ isDirty: true }),
}));

// Auto-save logic: debounced save to API
let saveTimeout: ReturnType<typeof setTimeout> | null = null;

export function setupAutoSave() {
  return useDiagramStore.subscribe((state, prevState) => {
    if (!state.isDirty || !state.diagramId) return;
    if (state.isDirty === prevState.isDirty && state.nodes === prevState.nodes && state.edges === prevState.edges && state.title === prevState.title) return;

    if (saveTimeout) clearTimeout(saveTimeout);
    saveTimeout = setTimeout(async () => {
      const { diagramId, title, nodes, edges, viewport } = useDiagramStore.getState();
      if (!diagramId) return;

      try {
        await fetch(`/api/diagrams/${diagramId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title,
            data: { nodes, edges, viewport },
          }),
        });
        useDiagramStore.setState({ isDirty: false, lastSavedAt: Date.now() });
      } catch (e) {
        console.error("Auto-save failed:", e);
      }
    }, 1500);
  });
}
