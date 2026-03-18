import { create } from "zustand";
import {
  type Node,
  type Edge,
  type Viewport,
  applyNodeChanges,
  applyEdgeChanges,
  type NodeChange,
  type EdgeChange,
} from "@xyflow/react";

export interface DiagramState {
  diagramId: string | null;
  title: string;
  nodes: Node[];
  edges: Edge[];
  viewport: Viewport;

  // Actions
  setDiagram: (id: string, title: string, nodes: Node[], edges: Edge[], viewport: Viewport) => void;
  setTitle: (title: string) => void;
  onNodesChange: (changes: NodeChange[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
  setNodes: (nodes: Node[]) => void;
  setEdges: (edges: Edge[]) => void;
  setViewport: (viewport: Viewport) => void;
}

export const useDiagramStore = create<DiagramState>((set) => ({
  diagramId: null,
  title: "Untitled Diagram",
  nodes: [],
  edges: [],
  viewport: { x: 0, y: 0, zoom: 1 },

  setDiagram: (id, title, nodes, edges, viewport) =>
    set({ diagramId: id, title, nodes, edges, viewport }),

  setTitle: (title) => set({ title }),

  onNodesChange: (changes) =>
    set((state) => ({ nodes: applyNodeChanges(changes, state.nodes) })),

  onEdgesChange: (changes) =>
    set((state) => ({ edges: applyEdgeChanges(changes, state.edges) })),

  setNodes: (nodes) => set({ nodes }),

  setEdges: (edges) => set({ edges }),

  setViewport: (viewport) => set({ viewport }),
}));
