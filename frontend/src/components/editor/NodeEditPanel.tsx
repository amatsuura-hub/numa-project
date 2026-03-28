import { useState, useEffect } from "react";
import type { Node } from "@xyflow/react";
import { useEditorStore } from "../../stores/editorStore";

interface NodeEditPanelProps {
  node: Node | null;
  onClose: () => void;
}

const NODE_COLORS = [
  "#4c6ef5",
  "#7950f2",
  "#e64980",
  "#e8590c",
  "#f59f00",
  "#40c057",
  "#15aabf",
  "#868e96",
];

function NodeEditPanel({ node, onClose }: NodeEditPanelProps) {
  const { updateNodeData, deleteNode } = useEditorStore();
  const [label, setLabel] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState("#4c6ef5");
  const [url, setUrl] = useState("");

  useEffect(() => {
    if (node) {
      setLabel((node.data.label as string) || "");
      setDescription((node.data.description as string) || "");
      setColor((node.data.color as string) || "#4c6ef5");
      setUrl((node.data.url as string) || "");
    }
  }, [node]);

  if (!node) return null;

  const handleSave = () => {
    updateNodeData(node.id, { label, description, color, url });
  };

  const handleDelete = () => {
    deleteNode(node.id);
    onClose();
  };

  return (
    <div className="absolute right-0 top-0 z-10 h-full w-80 border-l border-gray-200 bg-white p-4 shadow-lg">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold">ノード編集</h3>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600"
        >
          ✕
        </button>
      </div>

      <div className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            ラベル
          </label>
          <input
            type="text"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            onBlur={handleSave}
            maxLength={50}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-numa-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            説明
          </label>
          <textarea
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
            色
          </label>
          <div className="flex flex-wrap gap-2">
            {NODE_COLORS.map((c) => (
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
              />
            ))}
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            外部URL
          </label>
          <input
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
