import { useState, useEffect, useCallback } from "react";
import { useEditorStore } from "../../stores/editorStore";
import { CATEGORIES } from "../../types";

function MetaEditPanel() {
  const { meta, updateMeta } = useEditorStore();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (meta) {
      setTitle(meta.title);
      setDescription(meta.description);
      setCategory(meta.category);
      setIsPublic(meta.isPublic);
    }
  }, [meta]);

  const handleSave = async () => {
    await updateMeta({
      title,
      description,
      category,
      tags: meta?.tags || [],
      isPublic,
    });
  };

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    },
    [isOpen],
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      return () => document.removeEventListener("keydown", handleKeyDown);
    }
  }, [isOpen, handleKeyDown]);

  return (
    <div className="absolute left-4 top-4 z-10">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="rounded-md bg-white px-3 py-2 text-sm font-medium shadow-md hover:bg-gray-50"
        aria-expanded={isOpen}
        aria-label="ロードマップ設定"
      >
        {isOpen ? "閉じる" : "設定"}
      </button>

      {isOpen && (
        <div className="mt-2 w-72 rounded-lg bg-white p-4 shadow-lg">
          <div className="space-y-3">
            <div>
              <label htmlFor="meta-title" className="mb-1 block text-sm font-medium text-gray-700">
                タイトル
              </label>
              <input
                id="meta-title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={handleSave}
                maxLength={100}
                className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-numa-500 focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="meta-description" className="mb-1 block text-sm font-medium text-gray-700">
                説明
              </label>
              <textarea
                id="meta-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                onBlur={handleSave}
                maxLength={1000}
                rows={2}
                className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-numa-500 focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="meta-category" className="mb-1 block text-sm font-medium text-gray-700">
                カテゴリ
              </label>
              <select
                id="meta-category"
                value={category}
                onChange={(e) => {
                  setCategory(e.target.value);
                  setTimeout(handleSave, 0);
                }}
                className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-numa-500 focus:outline-none"
              >
                <option value="">選択してください</option>
                {Object.entries(CATEGORIES).map(([id, name]) => (
                  <option key={id} value={id}>
                    {name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isPublic"
                checked={isPublic}
                onChange={(e) => {
                  setIsPublic(e.target.checked);
                  setTimeout(handleSave, 0);
                }}
                className="h-4 w-4 rounded border-gray-300 text-numa-600 focus:ring-numa-500"
              />
              <label htmlFor="isPublic" className="text-sm text-gray-700">
                公開する
              </label>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MetaEditPanel;
