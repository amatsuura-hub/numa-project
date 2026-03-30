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

  const handleClick = () => {
    if (onToggleComplete && nodeId) {
      onToggleComplete(nodeId);
    }
  };

  const s = nodeStyle(color);

  return (
    <div
      className={`rounded-md border-l-[3px] shadow-sm transition-shadow ${
        selected ? "shadow-md ring-2 ring-swamp-400" : ""
      } ${onToggleComplete ? "cursor-pointer hover:shadow-md" : ""}`}
      style={{
        borderLeftColor: s.border,
        borderTop: "1px solid rgba(80,60,30,0.1)",
        borderRight: "1px solid rgba(80,60,30,0.1)",
        borderBottom: "1px solid rgba(80,60,30,0.1)",
        backgroundColor: s.bg,
        minWidth: 180,
        maxWidth: 260,
        padding: "12px 16px",
      }}
      onClick={handleClick}
    >
      <Handle type="target" position={Position.Top} className="!bg-swamp-600" />

      <div className="flex items-center gap-2">
        {isCompleted !== undefined && (
          <span
            className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs ${
              isCompleted
                ? "bg-swamp-700 text-white"
                : "border-2 border-gray-300"
            }`}
          >
            {isCompleted && "✓"}
          </span>
        )}
        <div
          className={`text-[14px] font-semibold leading-snug ${isCompleted ? "line-through opacity-70" : ""}`}
          style={{ color: s.text }}
        >
          {label}
        </div>
      </div>

      {description && (
        <div
          className="mt-1.5 line-clamp-2 text-xs leading-relaxed"
          style={{ color: s.sub }}
        >
          {description}
        </div>
      )}

      <Handle type="source" position={Position.Bottom} className="!bg-swamp-600" />
    </div>
  );
}

export default memo(RoadmapNode);
