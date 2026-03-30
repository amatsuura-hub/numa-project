import { useState, useEffect, useRef, useCallback } from "react";
import type { Node } from "@xyflow/react";
import { useEditorStore } from "../../stores/editorStore";
import { NODE_COLORS, DEFAULT_NODE_COLOR } from "../../constants/depth";

interface NodeEditPanelProps {
  node: Node | null;
  onClose: () => void;
}

function NodeEditPanel({ node, onClose }: NodeEditPanelProps) {
  const { updateNodeData, deleteNode } = useEditorStore();
  const [label, setLabel] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState(DEFAULT_NODE_COLOR);
  const [url, setUrl] = useState("");
  const panelRef = useRef<HTMLDivElement>(null);
  const labelInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (node) {
      setLabel((node.data.label as string) || "");
      setDescription((node.data.description as string) || "");
      setColor((node.data.color as string) || DEFAULT_NODE_COLOR);
      setUrl((node.data.url as string) || "");
      // Focus the label input when panel opens
      setTimeout(() => labelInputRef.current?.focus(), 0);
    }
  }, [node]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    },
    [onClose],
  );

  useEffect(() => {
    if (node) {
      document.addEventListener("keydown", handleKeyDown);
      return () => document.removeEventListener("keydown", handleKeyDown);
    }
  }, [node, handleKeyDown]);

  if (!node) return null;

  const isValidUrl = (value: string): boolean => {
    if (!value) return true;
    try {
      const parsed = new URL(value);
      return ["http:", "https:"].includes(parsed.protocol);
    } catch {
      return false;
    }
  };

  const handleSave = () => {
    const safeUrl = isValidUrl(url) ? url : "";
    updateNodeData(node.id, { label, description, color, url: safeUrl });
  };

  const handleDelete = () => {
    deleteNode(node.id);
    onClose();
  };

  return (
    <div ref={panelRef} role="dialog" aria-label="ノード編集" className="absolute right-0 top-0 z-10 h-full w-80 border-l border-gray-200 bg-white p-4 shadow-lg">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold">ノード編集</h3>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600"
          aria-label="閉じる"
        >
          ✕
        </button>
      </div>

      <div className="space-y-4">
        <div>
          <label htmlFor="node-label" className="mb-1 block text-sm font-medium text-gray-700">
            ラベル
          </label>
          <input
            ref={labelInputRef}
            id="node-label"
            type="text"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            onBlur={handleSave}
            maxLength={50}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-numa-500 focus:outline-none"
          />
        </div>

        <div>
          <label htmlFor="node-description" className="mb-1 block text-sm font-medium text-gray-700">
            説明
          </label>
          <textarea
            id="node-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            onBlur={handleSave}
            maxLength={500}
            rows={3}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-numa-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            深さ（色）
          </label>
          <p className="mb-2 text-xs text-gray-400">浅い → 深い</p>
          <div className="flex flex-wrap gap-2">
            {NODE_COLORS.map((c, i) => {
              const depthNames = ["とても浅い", "浅い", "ふつう", "深い", "とても深い"];
              const depthName = depthNames[Math.min(i, depthNames.length - 1)] || `深さ ${i + 1}`;
              return (
                <button
                  key={c}
                  onClick={() => {
                    setColor(c);
                    updateNodeData(node.id, { label, description, color: c, url });
                  }}
                  className={`h-7 w-7 rounded-full border-2 ${
                    color === c ? "border-gray-800" : "border-transparent"
                  }`}
                  style={{ backgroundColor: c }}
                  aria-label={depthName}
                  aria-pressed={color === c}
                />
              );
            })}
          </div>
        </div>

        <div>
          <label htmlFor="node-url" className="mb-1 block text-sm font-medium text-gray-700">
            外部URL
          </label>
          <input
            id="node-url"
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onBlur={handleSave}
            placeholder="https://..."
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-numa-500 focus:outline-none"
          />
        </div>

        <button
          onClick={handleDelete}
          className="w-full rounded-md border border-red-300 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
        >
          ノードを削除
        </button>
      </div>
    </div>
  );
}

export default NodeEditPanel;
