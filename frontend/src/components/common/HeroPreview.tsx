import { memo, useMemo } from "react";
import {
  ReactFlow,
  Background,
  Handle,
  Position,
  type Node,
  type Edge,
  type NodeProps,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

/* ── Depth color palette ── */
const DEPTH_COLORS = [
  { bg: "#f5efe4", border: "#b8976a", text: "#5a4628", desc: "#8a7e6e" },
  { bg: "#e8f0e4", border: "#6aaa5c", text: "#2d6a28", desc: "#5a8a52" },
  { bg: "#d4e8c8", border: "#43A047", text: "#1e5a20", desc: "#4a8a42" },
  { bg: "#a8cca0", border: "#2d5a32", text: "#1a4a18", desc: "#3a7a34" },
  { bg: "#2d5a32", border: "#1B5E20", text: "#e8f0e4", desc: "#c0dab4" },
];

/* ── Custom node ── */
interface HeroNodeData {
  label: string;
  description: string;
  depth: number;
  [key: string]: unknown;
}

const HeroNode = memo(function HeroNode({ data }: NodeProps) {
  const { label, description, depth } = data as unknown as HeroNodeData;
  const c = DEPTH_COLORS[Math.min(depth, DEPTH_COLORS.length - 1)];

  return (
    <div
      style={{
        background: c.bg,
        borderLeft: `3px solid ${c.border}`,
        borderRadius: 4,
        padding: "14px 20px",
        minWidth: 200,
        maxWidth: 240,
        boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
      }}
    >
      <Handle type="target" position={Position.Top} style={{ opacity: 0 }} />
      <div
        style={{
          fontSize: 15,
          fontWeight: 600,
          color: c.text,
          lineHeight: 1.3,
          marginBottom: 3,
        }}
      >
        {label}
      </div>
      <div style={{ fontSize: 12, color: c.desc, lineHeight: 1.3 }}>
        {description}
      </div>
      <Handle
        type="source"
        position={Position.Bottom}
        style={{ opacity: 0 }}
      />
    </div>
  );
});

/* ── Sample data ── */
const HERO_NODES: Node[] = [
  {
    id: "1",
    type: "heroNode",
    position: { x: 220, y: 0 },
    data: { label: "Go言語とは", description: "Google製の静的型付け言語", depth: 0 },
  },
  {
    id: "2",
    type: "heroNode",
    position: { x: 220, y: 120 },
    data: { label: "環境構築", description: "インストールとエディタ設定", depth: 1 },
  },
  {
    id: "3",
    type: "heroNode",
    position: { x: 220, y: 240 },
    data: { label: "基本文法", description: "変数、制御構文、スライス", depth: 1 },
  },
  {
    id: "4",
    type: "heroNode",
    position: { x: 20, y: 360 },
    data: { label: "関数と構造体", description: "メソッドとインターフェース", depth: 2 },
  },
  {
    id: "5",
    type: "heroNode",
    position: { x: 420, y: 360 },
    data: { label: "HTTPサーバー", description: "net/httpでWebサーバー実装", depth: 2 },
  },
  {
    id: "6",
    type: "heroNode",
    position: { x: 220, y: 480 },
    data: { label: "DB接続", description: "PostgreSQLへのCRUD", depth: 3 },
  },
  {
    id: "7",
    type: "heroNode",
    position: { x: 220, y: 600 },
    data: { label: "REST API設計", description: "ルーティングとミドルウェア", depth: 3 },
  },
  {
    id: "8",
    type: "heroNode",
    position: { x: 220, y: 720 },
    data: { label: "デプロイ", description: "Lambda + API Gateway", depth: 4 },
  },
];

const HERO_EDGES: Edge[] = [
  { id: "e1-2", source: "1", target: "2" },
  { id: "e2-3", source: "2", target: "3" },
  { id: "e3-4", source: "3", target: "4" },
  { id: "e3-5", source: "3", target: "5" },
  { id: "e4-6", source: "4", target: "6" },
  { id: "e5-6", source: "5", target: "6" },
  { id: "e6-7", source: "6", target: "7" },
  { id: "e7-8", source: "7", target: "8" },
];

const DEFAULT_EDGE_OPTIONS = {
  type: "smoothstep" as const,
  style: { stroke: "rgba(45,90,50,0.25)", strokeWidth: 2 },
  animated: true,
};

/* ── React Flow preview (read-only) ── */
function HeroPreview() {
  const nodeTypes = useMemo(() => ({ heroNode: HeroNode }), []);

  return (
    <div className="w-full h-full z-[1]">
      <ReactFlow
        nodes={HERO_NODES}
        edges={HERO_EDGES}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.03 }}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
        panOnDrag={false}
        zoomOnScroll={false}
        zoomOnPinch={false}
        zoomOnDoubleClick={false}
        preventScrolling={false}
        proOptions={{ hideAttribution: true }}
        defaultEdgeOptions={DEFAULT_EDGE_OPTIONS}
      >
        <Background color="rgba(45,90,50,0.06)" gap={20} size={1} />
      </ReactFlow>
    </div>
  );
}

export default HeroPreview;
