import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import dagre from "dagre";
import toast from "react-hot-toast";
import { roadmapApi } from "../api/roadmap";
import { CATEGORIES } from "../types";
import { depthColor } from "../constants/depth";
import { getErrorMessage } from "../utils/getErrorMessage";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface DraftNode {
  id: string;
  label: string;
  description: string;
  color: string;
  url: string;
}

interface DraftEdge {
  id: string;
  sourceId: string;
  targetId: string;
}

function isDeepColor(hex: string): boolean {
  return hex === "#2d5a32" || hex === "#5a9a52";
}

/* ------------------------------------------------------------------ */
/*  SortableNode                                                       */
/* ------------------------------------------------------------------ */

interface SortableNodeProps {
  node: DraftNode;
  index: number;
  total: number;
  onUpdate: (id: string, field: keyof DraftNode, value: string) => void;
  onRemove: (id: string) => void;
}

function SortableNode({ node, index, total, onUpdate, onRemove }: SortableNodeProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: node.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const bg = depthColor(index, total);
  const deep = isDeepColor(bg);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-start gap-3 rounded-md border border-[rgba(90,70,40,.08)] bg-white p-3"
    >
      {/* Drag handle */}
      <button
        {...attributes}
        {...listeners}
        className="mt-1 cursor-grab touch-none text-numa-text-muted hover:text-numa-brown"
        aria-label="並べ替え"
      >
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
        </svg>
      </button>

      {/* Depth indicator */}
      <div
        className={`mt-1.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded text-[10px] font-bold ${
          deep ? "text-white" : "text-numa-text"
        }`}
        style={{ backgroundColor: bg }}
      >
        {index + 1}
      </div>

      {/* Fields */}
      <div className="flex-1 space-y-2">
        <div>
          <input
            type="text"
            value={node.label}
            onChange={(e) => onUpdate(node.id, "label", e.target.value)}
            maxLength={50}
            placeholder="ステップ名"
            className={`w-full rounded border bg-transparent px-2 py-1 text-sm text-numa-text placeholder:text-numa-text-muted/50 focus:border-swamp-600 focus:outline-none ${
              node.label.length >= 50 ? "border-red-400" : "border-[rgba(90,70,40,.1)]"
            }`}
          />
          <div className="text-right text-[10px] text-numa-text-hint mt-0.5">
            {node.label.length} / 50
          </div>
        </div>
        <div>
          <input
            type="text"
            value={node.description}
            onChange={(e) => onUpdate(node.id, "description", e.target.value)}
            maxLength={500}
            placeholder="説明（任意）"
            className="w-full rounded border border-[rgba(90,70,40,.06)] bg-transparent px-2 py-1 text-xs text-numa-text-muted placeholder:text-numa-text-muted/40 focus:border-swamp-600 focus:outline-none"
          />
          {node.description.length > 0 && (
            <div className="text-right text-[10px] text-numa-text-hint mt-0.5">
              {node.description.length} / 500
            </div>
          )}
        </div>
        <input
          type="url"
          value={node.url}
          onChange={(e) => onUpdate(node.id, "url", e.target.value)}
          placeholder="参考URL（任意）"
          className="w-full rounded border border-[rgba(90,70,40,.06)] bg-transparent px-2 py-1 text-xs text-numa-text-muted placeholder:text-numa-text-muted/40 focus:border-swamp-600 focus:outline-none"
        />
      </div>

      {/* Remove */}
      <button
        onClick={() => onRemove(node.id)}
        className="mt-1 text-numa-text-muted hover:text-red-500"
        aria-label="削除"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Preview Modal (React Flow-less dagre layout)                       */
/* ------------------------------------------------------------------ */

interface PreviewModalProps {
  nodes: DraftNode[];
  edges: DraftEdge[];
  onClose: () => void;
}

function PreviewModal({ nodes, edges, onClose }: PreviewModalProps) {
  // Compute dagre layout
  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({ rankdir: "TB", nodesep: 60, ranksep: 80 });

  nodes.forEach((n, i) => {
    g.setNode(n.id, { width: 180, height: 50, label: n.label, index: i });
  });
  edges.forEach((e) => {
    g.setEdge(e.sourceId, e.targetId);
  });

  dagre.layout(g);

  const positioned = nodes.map((n) => {
    const gn = g.node(n.id);
    return { ...n, x: gn.x - 90, y: gn.y - 25 };
  });

  // Calculate SVG viewBox
  const minX = Math.min(...positioned.map((n) => n.x)) - 20;
  const minY = Math.min(...positioned.map((n) => n.y)) - 20;
  const maxX = Math.max(...positioned.map((n) => n.x + 180)) + 20;
  const maxY = Math.max(...positioned.map((n) => n.y + 50)) + 20;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div
        className="relative mx-4 max-h-[80vh] w-full max-w-2xl overflow-auto rounded-lg bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-bold text-numa-text">プレビュー</h3>
          <button onClick={onClose} className="text-numa-text-muted hover:text-numa-brown">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <svg
          viewBox={`${minX} ${minY} ${maxX - minX} ${maxY - minY}`}
          className="w-full"
          style={{ minHeight: 200 }}
        >
          {/* Edges */}
          {edges.map((e) => {
            const src = positioned.find((n) => n.id === e.sourceId);
            const tgt = positioned.find((n) => n.id === e.targetId);
            if (!src || !tgt) return null;
            return (
              <line
                key={e.id}
                x1={src.x + 90}
                y1={src.y + 50}
                x2={tgt.x + 90}
                y2={tgt.y}
                stroke="#8a7e6e"
                strokeWidth={1.5}
                markerEnd="url(#arrowhead)"
              />
            );
          })}
          {/* Arrow marker */}
          <defs>
            <marker id="arrowhead" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
              <polygon points="0 0, 8 3, 0 6" fill="#8a7e6e" />
            </marker>
          </defs>
          {/* Nodes */}
          {positioned.map((n, i) => {
            const bg = depthColor(i, positioned.length);
            const deep = isDeepColor(bg);
            return (
              <g key={n.id}>
                <rect
                  x={n.x}
                  y={n.y}
                  width={180}
                  height={50}
                  rx={6}
                  fill={bg}
                  stroke="rgba(90,70,40,.12)"
                />
                <text
                  x={n.x + 90}
                  y={n.y + 29}
                  textAnchor="middle"
                  fontSize={12}
                  fontWeight={600}
                  fill={deep ? "#fff" : "#3a3428"}
                >
                  {n.label || `ステップ ${i + 1}`}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Page                                                          */
/* ------------------------------------------------------------------ */

let nodeIdCounter = 0;

function RoadmapCreate() {
  const navigate = useNavigate();

  // Meta
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [errors, setErrors] = useState<{ title?: string; category?: string }>({});

  // Nodes & Edges
  const [nodes, setNodes] = useState<DraftNode[]>([
    { id: `draft-${++nodeIdCounter}`, label: "", description: "", color: "", url: "" },
  ]);
  const [edges, setEdges] = useState<DraftEdge[]>([]);
  const [edgeSource, setEdgeSource] = useState("");
  const [edgeTarget, setEdgeTarget] = useState("");

  // UI
  const [isSaving, setIsSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  /* ---- Node CRUD ---- */

  const addNode = useCallback(() => {
    setNodes((prev) => [
      ...prev,
      { id: `draft-${++nodeIdCounter}`, label: "", description: "", color: "", url: "" },
    ]);
  }, []);

  const updateNode = useCallback((id: string, field: keyof DraftNode, value: string) => {
    setNodes((prev) => prev.map((n) => (n.id === id ? { ...n, [field]: value } : n)));
  }, []);

  const removeNode = useCallback(
    (id: string) => {
      if (nodes.length <= 1) return;
      setNodes((prev) => prev.filter((n) => n.id !== id));
      setEdges((prev) => prev.filter((e) => e.sourceId !== id && e.targetId !== id));
    },
    [nodes.length],
  );

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setNodes((prev) => {
        const oldIndex = prev.findIndex((n) => n.id === active.id);
        const newIndex = prev.findIndex((n) => n.id === over.id);
        return arrayMove(prev, oldIndex, newIndex);
      });
    }
  }, []);

  /* ---- Edge CRUD ---- */

  const addEdge = useCallback(() => {
    if (!edgeSource || !edgeTarget || edgeSource === edgeTarget) return;
    // Prevent duplicate
    if (edges.some((e) => e.sourceId === edgeSource && e.targetId === edgeTarget)) return;
    setEdges((prev) => [
      ...prev,
      { id: `edge-${Date.now()}`, sourceId: edgeSource, targetId: edgeTarget },
    ]);
    setEdgeSource("");
    setEdgeTarget("");
  }, [edgeSource, edgeTarget, edges]);

  const removeEdge = useCallback((id: string) => {
    setEdges((prev) => prev.filter((e) => e.id !== id));
  }, []);

  /* ---- Auto-connect sequential ---- */

  const autoConnect = useCallback(() => {
    const newEdges: DraftEdge[] = [];
    for (let i = 0; i < nodes.length - 1; i++) {
      newEdges.push({
        id: `edge-auto-${Date.now()}-${i}`,
        sourceId: nodes[i].id,
        targetId: nodes[i + 1].id,
      });
    }
    setEdges(newEdges);
  }, [nodes]);

  /* ---- Save ---- */

  const handleSave = async () => {
    const newErrors: { title?: string; category?: string } = {};
    if (!title.trim()) newErrors.title = "タイトルを入力してください";
    if (!category) newErrors.category = "カテゴリを選択してください";
    const validNodes = nodes.filter((n) => n.label.trim());
    if (validNodes.length === 0) {
      toast.error("少なくとも1つのステップに名前を入力してください");
      return;
    }
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    setErrors({});
    setIsSaving(true);

    try {
      // 1. Create roadmap
      const { data: meta } = await roadmapApi.create({
        title,
        description,
        category,
        tags: [],
        isPublic: false,
      });
      const roadmapId = meta.roadmapId;

      // 2. Build dagre layout for positions
      const g = new dagre.graphlib.Graph();
      g.setDefaultEdgeLabel(() => ({}));
      g.setGraph({ rankdir: "TB", nodesep: 80, ranksep: 100 });

      const validNodeIds = new Set(validNodes.map((n) => n.id));
      validNodes.forEach((n) => {
        g.setNode(n.id, { width: 200, height: 60 });
      });
      const validEdges = edges.filter(
        (e) => validNodeIds.has(e.sourceId) && validNodeIds.has(e.targetId),
      );
      validEdges.forEach((e) => {
        g.setEdge(e.sourceId, e.targetId);
      });

      dagre.layout(g);

      // 3. Create nodes with positions
      const nodeIdMap = new Map<string, string>(); // draft id → server id
      for (let i = 0; i < validNodes.length; i++) {
        const n = validNodes[i];
        const gn = g.node(n.id);
        const { data: savedNode } = await roadmapApi.createNode(roadmapId, {
          label: n.label,
          description: n.description || undefined,
          posX: gn.x,
          posY: gn.y,
          color: depthColor(i, validNodes.length),
          url: n.url || undefined,
          order: i,
        });
        nodeIdMap.set(n.id, savedNode.nodeId);
      }

      // 4. Create edges
      for (const e of validEdges) {
        const src = nodeIdMap.get(e.sourceId);
        const tgt = nodeIdMap.get(e.targetId);
        if (src && tgt) {
          await roadmapApi.createEdge(roadmapId, {
            sourceNodeId: src,
            targetNodeId: tgt,
          });
        }
      }

      toast.success("ロードマップを作成しました");
      navigate(`/roadmaps/${roadmapId}/edit`, { replace: true });
    } catch (e: unknown) {
      toast.error(getErrorMessage(e));
    } finally {
      setIsSaving(false);
    }
  };

  /* ---- Render ---- */

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="text-numa-text-muted hover:text-numa-brown"
            aria-label="戻る"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-xl font-bold text-numa-text">新規ロードマップ</h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => nodes.filter((n) => n.label.trim()).length > 0 && setShowPreview(true)}
            className="rounded border border-[rgba(90,70,40,.15)] px-4 py-1.5 text-sm text-numa-text-muted hover:border-swamp-600/30 hover:text-numa-brown transition"
          >
            プレビュー
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="rounded bg-swamp-700 px-5 py-1.5 text-sm font-semibold text-green-50 hover:bg-swamp-800 transition disabled:opacity-50"
          >
            {isSaving ? "保存中..." : "作成"}
          </button>
        </div>
      </div>

      {/* Meta form */}
      <section className="mb-8 space-y-4 rounded-md border border-[rgba(90,70,40,.08)] bg-white p-5">
        <div>
          <label htmlFor="create-title" className="mb-1 block text-sm font-medium text-numa-text">
            タイトル
          </label>
          <input
            id="create-title"
            type="text"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              if (errors.title) setErrors((prev) => ({ ...prev, title: undefined }));
            }}
            maxLength={100}
            placeholder="例: Go言語マスターへの道"
            className={`w-full rounded border px-3 py-2 text-sm focus:outline-none focus:ring-1 ${
              errors.title
                ? "border-red-400 focus:border-red-500 focus:ring-red-500"
                : "border-[rgba(90,70,40,.12)] focus:border-swamp-600 focus:ring-swamp-600"
            }`}
          />
          <div className="mt-1 flex justify-between">
            <span className="text-xs text-red-600">{errors.title ?? "\u00A0"}</span>
            <span className={`text-xs ${title.length >= 100 ? "text-red-600" : "text-numa-text-muted/60"}`}>
              {title.length} / 100
            </span>
          </div>
        </div>

        <div>
          <label htmlFor="create-desc" className="mb-1 block text-sm font-medium text-numa-text">
            説明
          </label>
          <textarea
            id="create-desc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={1000}
            rows={3}
            placeholder="ロードマップの概要を入力..."
            className="w-full rounded border border-[rgba(90,70,40,.12)] px-3 py-2 text-sm focus:border-swamp-600 focus:outline-none focus:ring-1 focus:ring-swamp-600"
          />
        </div>

        <div>
          <label htmlFor="create-category" className="mb-1 block text-sm font-medium text-numa-text">
            カテゴリ
          </label>
          <select
            id="create-category"
            value={category}
            onChange={(e) => {
              setCategory(e.target.value);
              if (errors.category) setErrors((prev) => ({ ...prev, category: undefined }));
            }}
            className={`w-full rounded border px-3 py-2 text-sm focus:outline-none ${
              errors.category
                ? "border-red-400 focus:border-red-500 focus:ring-red-500"
                : "border-[rgba(90,70,40,.12)] focus:border-swamp-600"
            }`}
          >
            <option value="">選択してください</option>
            {Object.entries(CATEGORIES).map(([id, name]) => (
              <option key={id} value={id}>
                {name}
              </option>
            ))}
          </select>
          {errors.category && <p className="mt-1 text-xs text-red-600">{errors.category}</p>}
        </div>
      </section>

      {/* Nodes */}
      <section className="mb-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-bold text-numa-text">ステップ</h2>
          <span className="text-xs text-numa-text-muted">{nodes.length} 個</span>
        </div>

        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={nodes.map((n) => n.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-2">
              {nodes.map((node, index) => (
                <SortableNode
                  key={node.id}
                  node={node}
                  index={index}
                  total={nodes.length}
                  onUpdate={updateNode}
                  onRemove={removeNode}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>

        <button
          onClick={addNode}
          className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-md border border-dashed border-[rgba(90,70,40,.15)] py-2.5 text-sm text-numa-text-muted hover:border-swamp-600/30 hover:text-swamp-700 transition"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          ステップを追加
        </button>
      </section>

      {/* Edges */}
      <section className="mb-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-bold text-numa-text">つながり</h2>
          <button
            onClick={autoConnect}
            className="text-xs text-swamp-700 hover:text-swamp-800 font-medium"
          >
            順番に自動接続
          </button>
        </div>

        {/* Existing edges */}
        {edges.length > 0 && (
          <div className="mb-3 space-y-1.5">
            {edges.map((e) => {
              const src = nodes.find((n) => n.id === e.sourceId);
              const tgt = nodes.find((n) => n.id === e.targetId);
              return (
                <div
                  key={e.id}
                  className="flex items-center justify-between rounded border border-[rgba(90,70,40,.06)] bg-white px-3 py-1.5 text-xs"
                >
                  <span className="text-numa-text-muted">
                    {src?.label || "（未入力）"} → {tgt?.label || "（未入力）"}
                  </span>
                  <button
                    onClick={() => removeEdge(e.id)}
                    className="text-numa-text-muted hover:text-red-500"
                    aria-label="接続を削除"
                  >
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* Add edge */}
        <div className="flex items-center gap-2">
          <select
            value={edgeSource}
            onChange={(e) => setEdgeSource(e.target.value)}
            className="flex-1 rounded border border-[rgba(90,70,40,.12)] px-2 py-1.5 text-xs focus:border-swamp-600 focus:outline-none"
          >
            <option value="">From...</option>
            {nodes.map((n, i) => (
              <option key={n.id} value={n.id}>
                {n.label || `ステップ ${i + 1}`}
              </option>
            ))}
          </select>
          <span className="text-numa-text-muted text-xs">→</span>
          <select
            value={edgeTarget}
            onChange={(e) => setEdgeTarget(e.target.value)}
            className="flex-1 rounded border border-[rgba(90,70,40,.12)] px-2 py-1.5 text-xs focus:border-swamp-600 focus:outline-none"
          >
            <option value="">To...</option>
            {nodes.map((n, i) => (
              <option key={n.id} value={n.id}>
                {n.label || `ステップ ${i + 1}`}
              </option>
            ))}
          </select>
          <button
            onClick={addEdge}
            disabled={!edgeSource || !edgeTarget || edgeSource === edgeTarget}
            className="rounded bg-swamp-700 px-3 py-1.5 text-xs font-semibold text-green-50 hover:bg-swamp-800 transition disabled:opacity-40"
          >
            追加
          </button>
        </div>
      </section>

      {/* Preview modal */}
      {showPreview && (
        <PreviewModal
          nodes={nodes.filter((n) => n.label.trim())}
          edges={edges}
          onClose={() => setShowPreview(false)}
        />
      )}
    </div>
  );
}

export default RoadmapCreate;
