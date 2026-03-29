import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";

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

function RoadmapNode({ data, selected }: NodeProps) {
  const { label, description, color, isCompleted, onToggleComplete, nodeId } =
    data as unknown as RoadmapNodeData;

  const handleClick = () => {
    if (onToggleComplete && nodeId) {
      onToggleComplete(nodeId);
    }
  };

  return (
    <div
      className={`rounded-lg border-2 bg-white px-4 py-3 shadow-sm transition-shadow ${
        selected ? "shadow-md ring-2 ring-numa-400" : ""
      } ${onToggleComplete ? "cursor-pointer hover:shadow-md" : ""}`}
      style={{ borderColor: color || "#16a34a", minWidth: 150, maxWidth: 250 }}
      onClick={handleClick}
    >
      <Handle type="target" position={Position.Top} className="!bg-numa-400" />

      <div className="flex items-center gap-2">
        {isCompleted !== undefined && (
          <span
            className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs ${
              isCompleted
                ? "bg-numa-500 text-white"
                : "border-2 border-gray-300"
            }`}
          >
            {isCompleted && "✓"}
          </span>
        )}
        <div
          className={`text-sm font-semibold ${isCompleted ? "line-through opacity-70" : ""}`}
          style={{ color: color || "#16a34a" }}
        >
          {label}
        </div>
      </div>

      {description && (
        <div className="mt-1 line-clamp-2 text-xs text-gray-500">{description}</div>
      )}

      <Handle type="source" position={Position.Bottom} className="!bg-numa-400" />
    </div>
  );
}

export default memo(RoadmapNode);
