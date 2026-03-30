import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { roadmapApi } from "../api/roadmap";
import type { RoadmapMeta, BookmarkItem, ProgressWithRoadmap } from "../types";
import { CATEGORIES, NUMA_LEVELS, type Category } from "../types";
import PageHead from "../components/common/PageHead";
import LoadingSpinner from "../components/common/LoadingSpinner";

type Tab = "my" | "bookmarks" | "progress";

function DashboardPage() {
  const [tab, setTab] = useState<Tab>("my");
  const [roadmaps, setRoadmaps] = useState<RoadmapMeta[]>([]);
  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>([]);
  const [progressList, setProgressList] = useState<ProgressWithRoadmap[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  useEffect(() => {
    if (tab === "my") {
      loadRoadmaps();
    } else if (tab === "bookmarks") {
      loadBookmarks();
    } else {
      loadProgress();
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

  const loadProgress = async () => {
    setIsLoading(true);
    try {
      const { data } = await roadmapApi.getMyProgress();
      setProgressList(data.progress || []);
    } catch {
      toast.error("進捗データの読み込みに失敗しました");
    } finally {
      setIsLoading(false);
    }
  };

  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());

  const handleDelete = async (id: string) => {
    setConfirmDeleteId(null);

    // Prevent duplicate deletes
    if (deletingIds.has(id)) return;

    const target = roadmaps.find((r) => r.roadmapId === id);
    if (!target) return;

    setDeletingIds((prev) => new Set(prev).add(id));

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
              setDeletingIds((prev) => {
                const next = new Set(prev);
                next.delete(id);
                return next;
              });
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
      } finally {
        setDeletingIds((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
      }
    }, 4500);
  };

  const tabs: { key: Tab; label: string }[] = [
    { key: "my", label: "マイロードマップ" },
    { key: "bookmarks", label: "ブックマーク" },
    { key: "progress", label: "進捗中" },
  ];

  return (
    <div>
      <PageHead title="ダッシュボード" />
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-numa-text">ダッシュボード</h1>
        <Link
          to="/roadmaps/new"
          className="rounded bg-swamp-700 px-5 py-2 text-sm font-bold text-white hover:bg-swamp-800 transition"
        >
          新規作成
        </Link>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex border-b border-numa-border-light">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 text-sm transition ${
              tab === t.key
                ? "border-b-2 border-swamp-700 font-bold text-swamp-700"
                : "text-numa-text-hint hover:text-numa-text-muted"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <LoadingSpinner />
      ) : tab === "my" ? (
        // My roadmaps
        roadmaps.length === 0 ? (
          <div className="py-20 text-center">
            <p className="mb-3 text-lg text-numa-text-muted">
              まだロードマップがありません
            </p>
            <p className="mb-6 text-sm text-numa-text-hint">
              あなたの知識をロードマップにして共有しましょう
            </p>
            <Link
              to="/roadmaps/new"
              className="inline-block rounded bg-swamp-700 px-6 py-3 font-bold text-white hover:bg-swamp-800 transition"
            >
              最初のロードマップを作る
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {roadmaps.map((roadmap) => (
              <div
                key={roadmap.roadmapId}
                className="rounded-md border border-numa-border-soft bg-white p-4 transition hover:border-swamp-700/25 hover:-translate-y-0.5"
              >
                <div className="mb-2 flex items-start justify-between">
                  <Link
                    to={`/roadmaps/${roadmap.roadmapId}`}
                    className="text-base font-bold text-numa-text hover:text-swamp-700"
                  >
                    {roadmap.title}
                  </Link>
                  <span
                    className={`ml-2 shrink-0 rounded border px-2 py-0.5 text-xs font-medium ${
                      roadmap.isPublic
                        ? "border-swamp-700/20 bg-swamp-50 text-swamp-700"
                        : "border-numa-border bg-[#f0ead8] text-numa-text-muted"
                    }`}
                  >
                    {roadmap.isPublic ? "公開" : "非公開"}
                  </span>
                </div>

                {roadmap.description && (
                  <p className="mb-2 line-clamp-2 text-sm text-numa-text-muted">
                    {roadmap.description}
                  </p>
                )}

                {roadmap.category && (
                  <span className="mb-2 inline-block rounded border border-swamp-700/20 bg-swamp-50 px-2 py-0.5 text-xs text-swamp-700">
                    {CATEGORIES[roadmap.category as Category] || roadmap.category}
                  </span>
                )}

                <div className="mt-3 flex items-center gap-2 text-sm text-[#8a7e6e]">
                  <span>♡ {roadmap.likeCount}</span>
                  <span>·</span>
                  <span>
                    {new Date(roadmap.updatedAt).toLocaleDateString("ja-JP")}
                  </span>
                </div>

                <div className="mt-3 flex gap-2">
                  <Link
                    to={`/roadmaps/${roadmap.roadmapId}/edit`}
                    className="rounded border border-numa-border-medium px-3 py-1 text-sm text-numa-text-muted hover:bg-[#f5f0e8] transition"
                  >
                    編集
                  </Link>
                  {confirmDeleteId === roadmap.roadmapId ? (
                    <>
                      <button
                        onClick={() => handleDelete(roadmap.roadmapId)}
                        className="rounded bg-red-600 px-3 py-1 text-sm font-bold text-white hover:bg-red-700 transition"
                      >
                        削除する
                      </button>
                      <button
                        onClick={() => setConfirmDeleteId(null)}
                        className="rounded border border-numa-border-medium px-3 py-1 text-sm text-numa-text-muted hover:bg-[#f5f0e8] transition"
                      >
                        キャンセル
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => setConfirmDeleteId(roadmap.roadmapId)}
                      className="rounded border border-[rgba(180,100,100,0.3)] px-3 py-1 text-sm text-[#a06060] hover:bg-red-50 transition"
                    >
                      削除
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )
      ) : tab === "bookmarks" ? (
        // Bookmarks
        bookmarks.length === 0 ? (
          <div className="py-20 text-center">
            <p className="mb-3 text-lg text-numa-text-muted">
              ブックマークしたロードマップはまだありません
            </p>
            <p className="mb-6 text-sm text-numa-text-hint">
              気になるロードマップを保存しておきましょう
            </p>
            <Link
              to="/explore"
              className="inline-block rounded bg-swamp-700 px-6 py-3 font-bold text-white hover:bg-swamp-800 transition"
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
                  className="block rounded-md border border-numa-border-soft bg-white p-4 transition hover:border-swamp-700/25 hover:-translate-y-0.5"
                >
                  <h3 className="text-base font-bold text-numa-text">
                    {item.roadmap.title}
                  </h3>
                  {item.roadmap.description && (
                    <p className="mt-1 line-clamp-2 text-sm text-numa-text-muted">
                      {item.roadmap.description}
                    </p>
                  )}
                  <div className="mt-3 flex items-center gap-2 text-xs text-numa-text-hint">
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
      ) : (
        // Progress tab
        progressList.length === 0 ? (
          <div className="py-20 text-center">
            <p className="mb-3 text-lg text-numa-text-muted">
              進捗中のロードマップはまだありません
            </p>
            <p className="mb-6 text-sm text-numa-text-hint">
              ロードマップのノードをクリックして学習を始めましょう
            </p>
            <Link
              to="/explore"
              className="inline-block rounded bg-swamp-700 px-6 py-3 font-bold text-white hover:bg-swamp-800 transition"
            >
              ロードマップを探す
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {progressList.map((p) => {
              const rate =
                p.totalNodes > 0
                  ? Math.round(
                      (p.completedNodes.length / p.totalNodes) * 100,
                    )
                  : 0;
              const levelInfo = NUMA_LEVELS[p.numaLevel] || NUMA_LEVELS[0];

              return (
                <Link
                  key={p.roadmapId}
                  to={`/roadmaps/${p.roadmapId}`}
                  className="block rounded-md border border-numa-border-soft bg-white p-4 transition hover:border-swamp-700/25 hover:-translate-y-0.5"
                >
                  <div className="mb-2 flex items-center justify-between">
                    <h3 className="text-base font-bold text-numa-text">
                      {p.roadmap?.title || p.roadmapId}
                    </h3>
                    <span
                      className="rounded-full px-2 py-0.5 text-xs font-bold"
                      style={{
                        backgroundColor: levelInfo.color + "22",
                        color: levelInfo.color,
                      }}
                    >
                      Lv.{p.numaLevel} {levelInfo.name}
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="mb-1 h-2 w-full overflow-hidden rounded-full bg-[#f0ead8]">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${rate}%`,
                        backgroundColor: levelInfo.color,
                      }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-xs text-numa-text-hint">
                    <span>
                      {p.completedNodes.length}/{p.totalNodes} ノード完了
                    </span>
                    <span>{rate}%</span>
                  </div>
                </Link>
              );
            })}
          </div>
        )
      )}
    </div>
  );
}

export default DashboardPage;
