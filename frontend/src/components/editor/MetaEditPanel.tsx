import { useState, useEffect, useCallback } from "react";
import toast from "react-hot-toast";
import { useEditorStore } from "../../stores/editorStore";
import { getErrorMessage } from "../../utils/getErrorMessage";
import { CATEGORIES } from "../../types";

function MetaEditPanel() {
  const { meta, updateMeta } = useEditorStore();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (meta) {
      setTitle(meta.title);
      setDescription(meta.description);
      setCategory(meta.category);
      setIsPublic(meta.isPublic);
    }
  }, [meta]);

  const saveWith = useCallback(
    async (overrides: { title?: string; description?: string; category?: string; isPublic?: boolean } = {}) => {
      setIsSaving(true);
      try {
        await updateMeta({
          title: overrides.title ?? title,
          description: overrides.description ?? description,
          category: overrides.category ?? category,
          tags: meta?.tags || [],
          isPublic: overrides.isPublic ?? isPublic,
        });
      } catch (e) {
        toast.error(getErrorMessage(e));
      } finally {
        setIsSaving(false);
      }
    },
    [title, description, category, isPublic, meta?.tags, updateMeta],
  );

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
        <div className="mt-2 w-72 rounded-lg border border-numa-border-subtle bg-white p-4 shadow-lg">
          <div className="space-y-3">
            <div>
              <label htmlFor="meta-title" className="mb-1 block text-sm font-semibold text-[#5a4e3a]">
                タイトル
              </label>
              <input
                id="meta-title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={() => saveWith()}
                maxLength={100}
                className="w-full rounded border border-numa-border px-3 py-1.5 text-sm text-numa-text focus:border-swamp-700 focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="meta-description" className="mb-1 block text-sm font-semibold text-[#5a4e3a]">
                説明
              </label>
              <textarea
                id="meta-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                onBlur={() => saveWith()}
                maxLength={1000}
                rows={2}
                className="w-full rounded border border-numa-border px-3 py-1.5 text-sm text-numa-text focus:border-swamp-700 focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="meta-category" className="mb-1 block text-sm font-semibold text-[#5a4e3a]">
                カテゴリ
              </label>
              <select
                id="meta-category"
                value={category}
                onChange={(e) => {
                  const val = e.target.value;
                  setCategory(val);
                  saveWith({ category: val });
                }}
                className="w-full rounded border border-numa-border px-3 py-1.5 text-sm text-numa-text focus:border-swamp-700 focus:outline-none"
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
                  const val = e.target.checked;
                  setIsPublic(val);
                  saveWith({ isPublic: val });
                }}
                className="h-4 w-4 rounded border-gray-300 text-swamp-700 focus:ring-swamp-700"
              />
              <label htmlFor="isPublic" className="text-sm font-medium text-numa-text">
                公開する
              </label>
            </div>

            <button
              onClick={() => saveWith()}
              disabled={isSaving}
              className="w-full rounded bg-swamp-700 px-4 py-2 text-sm font-bold text-white hover:bg-swamp-800 transition disabled:opacity-50"
            >
              {isSaving ? "保存中..." : "設定を保存"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default MetaEditPanel;
