import { create } from "zustand";
import type { Node, Edge, OnNodesChange, OnEdgesChange, Connection } from "@xyflow/react";
import { applyNodeChanges, applyEdgeChanges, addEdge } from "@xyflow/react";
import toast from "react-hot-toast";
import { roadmapApi } from "../api/roadmap";
import type { RoadmapMeta, RoadmapNode, RoadmapEdge } from "../types";
import { DEFAULT_NODE_COLOR } from "../constants/depth";
import { getErrorMessage } from "../utils/getErrorMessage";

interface EditorState {
  roadmapId: string | null;
  meta: RoadmapMeta | null;
  nodes: Node[];
  edges: Edge[];
  isSaving: boolean;
  isLoading: boolean;
  isDirty: boolean;
  saveTimer: ReturnType<typeof setTimeout> | null;

  // Actions
  loadRoadmap: (id: string) => Promise<void>;
  createRoadmap: (data: {
    title: string;
    description: string;
    category: string;
    tags: string[];
    isPublic: boolean;
  }) => Promise<string>;
  updateMeta: (data: {
    title: string;
    description: string;
    category: string;
    tags: string[];
    isPublic: boolean;
  }) => Promise<void>;

  onNodesChange: OnNodesChange;
  onEdgesChange: OnEdgesChange;
  onConnect: (connection: Connection) => void;

  addNode: (posX: number, posY: number) => void;
  updateNodeData: (
    nodeId: string,
    data: { label: string; description?: string; color?: string; url?: string },
  ) => void;
  deleteNode: (nodeId: string) => void;
  deleteEdge: (edgeId: string) => void;

  scheduleSave: () => void;
  save: () => Promise<void>;
  reset: () => void;
}

function toFlowNode(n: RoadmapNode): Node {
  return {
    id: n.nodeId,
    position: { x: n.posX, y: n.posY },
    data: {
      label: n.label,
      description: n.description || "",
      color: n.color || DEFAULT_NODE_COLOR,
      url: n.url || "",
      order: n.order,
    },
    type: "roadmapNode",
  };
}

function toFlowEdge(e: RoadmapEdge): Edge {
  return {
    id: e.edgeId,
    source: e.sourceNodeId,
    target: e.targetNodeId,
    label: e.label || "",
    type: "smoothstep",
    animated: true,
  };
}

function fromFlowNode(n: Node): RoadmapNode {
  return {
    nodeId: n.id,
    label: (n.data.label as string) || "",
    description: (n.data.description as string) || "",
    posX: n.position.x,
    posY: n.position.y,
    color: (n.data.color as string) || DEFAULT_NODE_COLOR,
    url: (n.data.url as string) || "",
    order: (n.data.order as number) || 0,
  };
}

let nodeCounter = 0;

export const useEditorStore = create<EditorState>((set, get) => ({
  roadmapId: null,
  meta: null,
  nodes: [],
  edges: [],
  isSaving: false,
  isLoading: false,
  isDirty: false,
  saveTimer: null,

  loadRoadmap: async (id: string) => {
    set({ isLoading: true });
    try {
      const { data } = await roadmapApi.get(id);
      set({
        roadmapId: id,
        meta: data.meta,
        nodes: data.nodes.map(toFlowNode),
        edges: data.edges.map(toFlowEdge),
        isLoading: false,
        isDirty: false,
      });
      nodeCounter = data.nodes.length;
    } catch {
      set({ isLoading: false });
      toast.error("ロードマップの読み込みに失敗しました");
    }
  },

  createRoadmap: async (data) => {
    const { data: meta } = await roadmapApi.create(data);
    set({
      roadmapId: meta.roadmapId,
      meta,
      nodes: [],
      edges: [],
      isDirty: false,
    });
    nodeCounter = 0;
    return meta.roadmapId;
  },

  updateMeta: async (data) => {
    const { roadmapId } = get();
    if (!roadmapId) return;

    const { data: meta } = await roadmapApi.update(roadmapId, data);
    set({ meta });
  },

  onNodesChange: (changes) => {
    set((state) => ({
      nodes: applyNodeChanges(changes, state.nodes),
      isDirty: true,
    }));
    get().scheduleSave();
  },

  onEdgesChange: (changes) => {
    set((state) => ({
      edges: applyEdgeChanges(changes, state.edges),
      isDirty: true,
    }));
    get().scheduleSave();
  },

  onConnect: (connection) => {
    const edgeId = `edge-${crypto.randomUUID()}`;
    set((state) => ({
      edges: addEdge({ ...connection, id: edgeId, type: "smoothstep", animated: true }, state.edges),
      isDirty: true,
    }));
    get().scheduleSave();
  },

  addNode: (posX: number, posY: number) => {
    nodeCounter++;
    const nodeId = `node-${crypto.randomUUID()}`;
    const newNode: Node = {
      id: nodeId,
      position: { x: posX, y: posY },
      data: {
        label: `ステップ ${nodeCounter}`,
        description: "",
        color: DEFAULT_NODE_COLOR,
        url: "",
        order: nodeCounter,
      },
      type: "roadmapNode",
    };

    set((state) => ({
      nodes: [...state.nodes, newNode],
      isDirty: true,
    }));
    get().scheduleSave();
  },

  updateNodeData: (nodeId, data) => {
    set((state) => ({
      nodes: state.nodes.map((n) =>
        n.id === nodeId ? { ...n, data: { ...n.data, ...data } } : n,
      ),
      isDirty: true,
    }));
    get().scheduleSave();
  },

  deleteNode: (nodeId: string) => {
    set((state) => ({
      nodes: state.nodes.filter((n) => n.id !== nodeId),
      edges: state.edges.filter((e) => e.source !== nodeId && e.target !== nodeId),
      isDirty: true,
    }));
    get().scheduleSave();
  },

  deleteEdge: (edgeId: string) => {
    set((state) => ({
      edges: state.edges.filter((e) => e.id !== edgeId),
      isDirty: true,
    }));
    get().scheduleSave();
  },

  scheduleSave: () => {
    const { saveTimer } = get();
    if (saveTimer) clearTimeout(saveTimer);
    const timer = setTimeout(() => {
      get().save();
    }, 2000);
    set({ saveTimer: timer });
  },

  save: async () => {
    const { roadmapId, nodes, edges, isDirty } = get();
    if (!roadmapId || !isDirty) return;

    set({ isSaving: true });
    try {
      // Batch update all nodes
      if (nodes.length > 0) {
        await roadmapApi.batchUpdateNodes(roadmapId, nodes.map(fromFlowNode));
      }

      // Save edges: for simplicity, we track new edges via API
      // In MVP, edges are synced on explicit save
      // New edges (created client-side) need to be persisted
      for (const edge of edges) {
        if (edge.id.startsWith("edge-")) {
          try {
            const { data: savedEdge } = await roadmapApi.createEdge(roadmapId, {
              sourceNodeId: edge.source,
              targetNodeId: edge.target,
              label: (edge.label as string) || "",
            });
            // Update local edge with server ID
            set((state) => ({
              edges: state.edges.map((e) =>
                e.id === edge.id ? { ...e, id: savedEdge.edgeId } : e,
              ),
            }));
          } catch (err) {
            const msg = getErrorMessage(err);
            if (!msg.includes("already exists")) {
              toast.error("エッジの保存に失敗しました");
            }
          }
        }
      }

      set({ isDirty: false, isSaving: false });
    } catch {
      set({ isSaving: false });
      toast.error("保存に失敗しました");
    }
  },

  reset: () => {
    const { saveTimer } = get();
    if (saveTimer) clearTimeout(saveTimer);
    set({
      roadmapId: null,
      meta: null,
      nodes: [],
      edges: [],
      isSaving: false,
      isLoading: false,
      isDirty: false,
      saveTimer: null,
    });
  },
}));
