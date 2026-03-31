import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useEditorStore } from "../stores/editorStore";
import { CATEGORIES } from "../types";
import RoadmapEditor from "../components/editor/RoadmapEditor";
import PageHead from "../components/common/PageHead";
import LoadingSpinner from "../components/common/LoadingSpinner";

function useUnsavedChangesWarning(isDirty: boolean) {
  const handleBeforeUnload = useCallback(
    (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
      }
    },
    [isDirty],
  );

  useEffect(() => {
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [handleBeforeUnload]);
}

function RoadmapEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { loadRoadmap, createRoadmap, isLoading, isDirty, reset } = useEditorStore();
  const [showCreateForm, setShowCreateForm] = useState(false);

  useUnsavedChangesWarning(isDirty);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [errors, setErrors] = useState<{ title?: string; category?: string }>({});

  useEffect(() => {
    if (id) {
      loadRoadmap(id);
    } else {
      reset();
      setShowCreateForm(true);
    }

    return () => {
      reset();
    };
  }, [id, loadRoadmap, reset]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: { title?: string; category?: string } = {};
    if (!title.trim()) {
      newErrors.title = "タイトルを入力してください";
    }
    if (!category) {
      newErrors.category = "カテゴリを選択してください";
    }
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    setErrors({});

    try {
      const newId = await createRoadmap({
        title,
        description,
        category,
        tags: [],
        isPublic: false,
      });
      setShowCreateForm(false);
      navigate(`/roadmaps/${newId}/edit`, { replace: true });
    } catch {
      toast.error("ロードマップの作成に失敗しました");
    }
  };

  if (showCreateForm && !id) {
    return (
      <div className="mx-auto max-w-md py-12">
        <PageHead title="新規ロードマップ作成" />
        <h1 className="mb-8 text-center text-2xl font-bold">
          新規ロードマップ作成
        </h1>

        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label htmlFor="new-title" className="mb-1 block text-sm font-medium text-gray-700">
              タイトル
            </label>
            <input
              id="new-title"
              type="text"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (errors.title) setErrors((prev) => ({ ...prev, title: undefined }));
              }}
              maxLength={100}
              placeholder="例: Go言語マスターへの道"
              className={`w-full rounded-md border px-3 py-2 focus:outline-none focus:ring-1 ${
                errors.title
                  ? "border-red-400 focus:border-red-500 focus:ring-red-500"
                  : "border-gray-300 focus:border-numa-500 focus:ring-numa-500"
              }`}
            />
            <div className="mt-1 flex justify-between">
              <span className="text-sm text-red-600">{errors.title ?? "\u00A0"}</span>
              <span className={`text-sm ${title.length >= 100 ? "text-red-600" : "text-gray-400"}`}>
                {title.length} / 100
              </span>
            </div>
          </div>

          <div>
            <label htmlFor="new-description" className="mb-1 block text-sm font-medium text-gray-700">
              説明
            </label>
            <textarea
              id="new-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={1000}
              rows={3}
              placeholder="ロードマップの概要を入力..."
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-numa-500 focus:outline-none focus:ring-1 focus:ring-numa-500"
            />
          </div>

          <div>
            <label htmlFor="new-category" className="mb-1 block text-sm font-medium text-gray-700">
              カテゴリ
            </label>
            <select
              id="new-category"
              value={category}
              onChange={(e) => {
                setCategory(e.target.value);
                if (errors.category) setErrors((prev) => ({ ...prev, category: undefined }));
              }}
              className={`w-full rounded-md border px-3 py-2 focus:outline-none ${
                errors.category
                  ? "border-red-400 focus:border-red-500 focus:ring-red-500"
                  : "border-gray-300 focus:border-numa-500"
              }`}
            >
              <option value="">選択してください</option>
              {Object.entries(CATEGORIES).map(([id, name]) => (
                <option key={id} value={id}>
                  {name}
                </option>
              ))}
            </select>
            {errors.category && (
              <p className="mt-1 text-sm text-red-600">{errors.category}</p>
            )}
          </div>

          <button
            type="submit"
            className="w-full rounded-md bg-numa-600 px-4 py-2 font-medium text-white hover:bg-numa-700"
          >
            作成してエディタを開く
          </button>
        </form>
      </div>
    );
  }

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <>
      <PageHead title="ロードマップ編集" />
      <RoadmapEditor />
    </>
  );
}

export default RoadmapEditPage;
