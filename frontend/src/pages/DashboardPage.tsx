import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { roadmapApi } from "../api/roadmap";
import type { RoadmapMeta } from "../types";
import { CATEGORIES, type Category } from "../types";
import PageHead from "../components/common/PageHead";

type Tab = "my" | "bookmarks";

interface BookmarkItem {
  roadmapId: string;
  createdAt: string;
  roadmap?: RoadmapMeta;
}

function DashboardPage() {
  const [tab, setTab] = useState<Tab>("my");
  const [roadmaps, setRoadmaps] = useState<RoadmapMeta[]>([]);
  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (tab === "my") {
      loadRoadmaps();
    } else {
      loadBookmarks();
    }
  }, [tab]);

  const loadRoadmaps = async () => {
    setIsLoading(true);
    try {
      const { data } = await roadmapApi.getMy();
      setRoadmaps(data.roadmaps || []);
    } catch {
      toast.error("ロードマップの読み込みに失敗しました");
    } finally {
      setIsLoading(false);
    }
  };

  const loadBookmarks = async () => {
    setIsLoading(true);
    try {
      const { data } = await roadmapApi.getBookmarks();
      setBookmarks(data.bookmarks || []);
    } catch {
      toast.error("ブックマークの読み込みに失敗しました");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    const target = roadmaps.find((r) => r.roadmapId === id);
    if (!target) return;

    // Optimistically remove from UI
    setRoadmaps((prev) => prev.filter((r) => r.roadmapId !== id));

    let cancelled = false;

    toast(
      (t) => (
        <div className="flex items-center gap-3">
          <span className="text-sm">削除しました</span>
          <button
            onClick={() => {
              cancelled = true;
              toast.dismiss(t.id);
              setRoadmaps((prev) => [...prev, target]);
            }}
            className="rounded bg-gray-200 px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-300"
          >
            取り消し
          </button>
        </div>
      ),
      { duration: 4000 },
    );

    // Wait for undo window, then actually delete
    setTimeout(async () => {
      if (cancelled) return;
      try {
        await roadmapApi.delete(id);
      } catch {
        toast.error("削除に失敗しました");
        setRoadmaps((prev) => [...prev, target]);
      }
    }, 4500);
  };

  return (
    <div>
      <PageHead title="ダッシュボード" />
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">ダッシュボード</h1>
        <Link
          to="/roadmaps/new"
          className="rounded-md bg-numa-600 px-4 py-2 text-sm font-medium text-white hover:bg-numa-700"
        >
          新規作成
        </Link>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex border-b border-gray-200">
        <button
          onClick={() => setTab("my")}
          className={`px-4 py-2 text-sm font-medium ${
            tab === "my"
              ? "border-b-2 border-numa-600 text-numa-600"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          マイロードマップ
        </button>
        <button
          onClick={() => setTab("bookmarks")}
          className={`px-4 py-2 text-sm font-medium ${
            tab === "bookmarks"
              ? "border-b-2 border-numa-600 text-numa-600"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          ブックマーク
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-numa-600 border-t-transparent" />
        </div>
      ) : tab === "my" ? (
        // My roadmaps
        roadmaps.length === 0 ? (
          <div className="rounded-lg border border-numa-100 bg-numa-50/30 p-8 text-center">
            <p className="text-gray-500">
              まだロードマップがありません。最初のロードマップを作成しましょう！
            </p>
            <Link
              to="/roadmaps/new"
              className="mt-4 inline-block rounded-md bg-numa-600 px-6 py-2 text-sm font-medium text-white hover:bg-numa-700"
            >
              ロードマップを作成
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {roadmaps.map((roadmap) => (
              <div
                key={roadmap.roadmapId}
                className="rounded-lg border border-numa-100 bg-white p-4"
              >
                <div className="mb-2 flex items-start justify-between">
                  <Link
                    to={`/roadmaps/${roadmap.roadmapId}`}
                    className="text-lg font-semibold text-gray-900 hover:text-numa-600"
                  >
                    {roadmap.title}
                  </Link>
                  <span
                    className={`ml-2 shrink-0 rounded-full px-2 py-0.5 text-xs ${
                      roadmap.isPublic
                        ? "bg-numa-100 text-numa-700"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {roadmap.isPublic ? "公開" : "非公開"}
                  </span>
                </div>

                {roadmap.description && (
                  <p className="mb-2 line-clamp-2 text-sm text-gray-500">
                    {roadmap.description}
                  </p>
                )}

                {roadmap.category && (
                  <span className="mb-2 inline-block rounded-full bg-numa-50 px-2 py-0.5 text-xs text-numa-600">
                    {CATEGORIES[roadmap.category as Category] || roadmap.category}
                  </span>
                )}

                <div className="mt-3 flex items-center gap-2 text-xs text-gray-400">
                  <span>♡ {roadmap.likeCount}</span>
                  <span>·</span>
                  <span>
                    {new Date(roadmap.updatedAt).toLocaleDateString("ja-JP")}
                  </span>
                </div>

                <div className="mt-3 flex gap-2">
                  <Link
                    to={`/roadmaps/${roadmap.roadmapId}/edit`}
                    className="rounded-md border border-numa-300 px-3 py-1 text-xs text-numa-600 hover:bg-numa-50"
                  >
                    編集
                  </Link>
                  <button
                    onClick={() => handleDelete(roadmap.roadmapId)}
                    className="rounded-md border border-red-300 px-3 py-1 text-xs text-red-600 hover:bg-red-50"
                  >
                    削除
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        // Bookmarks
        bookmarks.length === 0 ? (
          <div className="rounded-lg border border-numa-100 bg-numa-50/30 p-8 text-center">
            <p className="text-gray-500">
              ブックマークしたロードマップはまだありません。
            </p>
            <Link
              to="/explore"
              className="mt-4 inline-block rounded-md bg-numa-600 px-6 py-2 text-sm font-medium text-white hover:bg-numa-700"
            >
              ロードマップを探す
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {bookmarks.map((item) =>
              item.roadmap ? (
                <Link
                  key={item.roadmapId}
                  to={`/roadmaps/${item.roadmapId}`}
                  className="block rounded-lg border border-numa-100 bg-white p-4 transition-all hover:border-numa-200 hover:shadow-md"
                >
                  <h3 className="text-lg font-semibold text-gray-900">
                    {item.roadmap.title}
                  </h3>
                  {item.roadmap.description && (
                    <p className="mt-1 line-clamp-2 text-sm text-gray-500">
                      {item.roadmap.description}
                    </p>
                  )}
                  <div className="mt-3 flex items-center gap-2 text-xs text-gray-400">
                    <span>♡ {item.roadmap.likeCount}</span>
                    <span>·</span>
                    <span>
                      保存日:{" "}
                      {new Date(item.createdAt).toLocaleDateString("ja-JP")}
                    </span>
                  </div>
                </Link>
              ) : null,
            )}
          </div>
        )
      )}
    </div>
  );
}

export default DashboardPage;
