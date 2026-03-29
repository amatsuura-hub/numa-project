import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";

interface RoadmapNodeData {
  label: string;
  description: string;
  color: string;
  url: string;
  [key: string]: unknown;
}

function RoadmapNode({ data, selected }: NodeProps) {
  const { label, description, color } = data as unknown as RoadmapNodeData;

  return (
    <div
      className={`rounded-lg border-2 bg-white px-4 py-3 shadow-sm transition-shadow ${
        selected ? "shadow-md ring-2 ring-numa-400" : ""
      }`}
      style={{ borderColor: color || "#16a34a", minWidth: 150, maxWidth: 250 }}
    >
      <Handle type="target" position={Position.Top} className="!bg-numa-400" />

      <div className="text-sm font-semibold" style={{ color: color || "#16a34a" }}>
        {label}
      </div>

      {description && (
        <div className="mt-1 line-clamp-2 text-xs text-gray-500">{description}</div>
      )}

      <Handle type="source" position={Position.Bottom} className="!bg-numa-400" />
    </div>
  );
}

export default memo(RoadmapNode);
