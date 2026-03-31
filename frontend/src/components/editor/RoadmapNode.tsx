import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { DEFAULT_NODE_COLOR } from "../../constants/depth";

interface RoadmapNodeData {
  label: string;
  description: string;
  color: string;
  url: string;
  isCompleted?: boolean;
  onToggleComplete?: (nodeId: string) => void;
  nodeId?: string;
  [key: string]: unknown;
}

function nodeStyle(color: string) {
  const c = color || DEFAULT_NODE_COLOR;
  // Parse hex to determine lightness for text contrast
  const r = parseInt(c.slice(1, 3), 16);
  const g = parseInt(c.slice(3, 5), 16);
  const b = parseInt(c.slice(5, 7), 16);
  const lum = (r * 299 + g * 587 + b * 114) / 1000;
  const isDark = lum < 140;
  return {
    bg: isDark ? c : `${c}18`,
    border: c,
    text: isDark ? "#ffffff" : "#252018",
    sub: isDark ? "rgba(255,255,255,0.7)" : "#6a6050",
  };
}

function RoadmapNode({ data, selected }: NodeProps) {
  const { label, description, color, isCompleted, onToggleComplete, nodeId } =
    data as unknown as RoadmapNodeData;

  const s = nodeStyle(color);
  const showCheck = !!onToggleComplete;

  return (
    <div
      className={`rounded border-l-[3px] shadow-sm transition-shadow ${
        selected ? "shadow-md ring-2 ring-swamp-400" : ""
      }`}
      style={{
        borderLeftColor: s.border,
        borderTop: "1px solid rgba(80,60,30,0.1)",
        borderRight: "1px solid rgba(80,60,30,0.1)",
        borderBottom: "1px solid rgba(80,60,30,0.1)",
        backgroundColor: s.bg,
        minWidth: 280,
        maxWidth: 380,
        padding: "18px 24px",
        opacity: isCompleted ? 0.7 : 1,
        boxShadow: "0 2px 6px rgba(0,0,0,0.08)",
        pointerEvents: "all" as const,
      }}
    >
      <Handle type="target" position={Position.Top} className="!bg-swamp-600" />

      <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
        {showCheck && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (nodeId) onToggleComplete(nodeId);
            }}
            aria-label={isCompleted ? "完了を取り消す" : "完了にする"}
            style={{
              width: 28,
              height: 28,
              borderRadius: "50%",
              border: isCompleted
                ? "2px solid #2d5a32"
                : "2px solid rgba(80,60,30,0.2)",
              background: isCompleted ? "#2d5a32" : "transparent",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              flexShrink: 0,
              marginTop: 2,
              padding: 0,
            }}
          >
            {isCompleted && (
              <svg width="14" height="14" viewBox="0 0 12 12" fill="none">
                <path
                  d="M2 6L5 9L10 3"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            )}
          </button>
        )}

        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: 17,
              fontWeight: 600,
              lineHeight: 1.4,
              color: s.text,
              textDecoration: isCompleted ? "line-through" : "none",
            }}
          >
            {label}
          </div>
          {description && (
            <div
              className="line-clamp-2"
              style={{
                fontSize: 13,
                lineHeight: 1.5,
                marginTop: 5,
                color: s.sub,
              }}
            >
              {description}
            </div>
          )}
        </div>
      </div>

      <Handle type="source" position={Position.Bottom} className="!bg-swamp-600" />
    </div>
  );
}

export default memo(RoadmapNode);
