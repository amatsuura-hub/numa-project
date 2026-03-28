import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useEditorStore } from "../stores/editorStore";
import { CATEGORIES } from "../types";
import RoadmapEditor from "../components/editor/RoadmapEditor";

function RoadmapEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { loadRoadmap, createRoadmap, isLoading, reset } = useEditorStore();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");

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
    if (!title) return;

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
        <h1 className="mb-8 text-center text-2xl font-bold">
          新規ロードマップ作成
        </h1>

        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              タイトル
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              maxLength={100}
              placeholder="例: Go言語マスターへの道"
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-numa-500 focus:outline-none focus:ring-1 focus:ring-numa-500"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              説明
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={1000}
              rows={3}
              placeholder="ロードマップの概要を入力..."
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-numa-500 focus:outline-none focus:ring-1 focus:ring-numa-500"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              カテゴリ
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-numa-500 focus:outline-none"
            >
              <option value="">選択してください</option>
              {Object.entries(CATEGORIES).map(([id, name]) => (
                <option key={id} value={id}>
                  {name}
                </option>
              ))}
            </select>
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
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-numa-600 border-t-transparent" />
      </div>
    );
  }

  return <RoadmapEditor />;
}

export default RoadmapEditPage;
