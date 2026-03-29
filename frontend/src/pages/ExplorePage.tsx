import { useEffect, useState, useCallback } from "react";
import toast from "react-hot-toast";
import { roadmapApi } from "../api/roadmap";
import type { RoadmapMeta } from "../types";
import { CATEGORIES } from "../types";
import RoadmapCard from "../components/common/RoadmapCard";
import PageHead from "../components/common/PageHead";
import LoadingSpinner from "../components/common/LoadingSpinner";

function ExplorePage() {
  const [roadmaps, setRoadmaps] = useState<RoadmapMeta[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [cursor, setCursor] = useState<string | undefined>();
  const [hasMore, setHasMore] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>("");
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const fetchRoadmaps = useCallback(
    async (category: string, loadMore = false) => {
      if (loadMore) {
        setIsLoadingMore(true);
      } else {
        setIsLoading(true);
      }

      try {
        const { data } = await roadmapApi.explore({
          category: category || undefined,
          limit: 20,
          cursor: loadMore ? cursor : undefined,
        });

        const fetched = data.roadmaps || [];
        if (loadMore) {
          setRoadmaps((prev) => [...prev, ...fetched]);
        } else {
          setRoadmaps(fetched);
        }
        setCursor(data.cursor);
        setHasMore(!!data.cursor);
      } catch {
        toast.error("ロードマップの読み込みに失敗しました");
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    },
    [cursor],
  );

  useEffect(() => {
    fetchRoadmaps(activeCategory);
  }, [activeCategory]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleCategoryClick = (category: string) => {
    setActiveCategory(category);
    setCursor(undefined);
  };

  return (
    <div>
      <PageHead title="探す" description="公開されているロードマップを探しましょう" />
      <h1 className="mb-6 text-2xl font-bold">ロードマップを探す</h1>

      {/* Category filter */}
      <div className="mb-6 flex flex-wrap gap-2">
        <button
          onClick={() => handleCategoryClick("")}
          className={`rounded-full px-4 py-1.5 text-sm ${
            activeCategory === ""
              ? "bg-numa-600 text-white"
              : "border border-gray-300 text-gray-600 hover:border-numa-400 hover:text-numa-600"
          }`}
        >
          すべて
        </button>
        {Object.entries(CATEGORIES).map(([id, name]) => (
          <button
            key={id}
            onClick={() => handleCategoryClick(id)}
            className={`rounded-full px-4 py-1.5 text-sm ${
              activeCategory === id
                ? "bg-numa-600 text-white"
                : "border border-gray-300 text-gray-600 hover:border-numa-400 hover:text-numa-600"
            }`}
          >
            {name}
          </button>
        ))}
      </div>

      {/* Loading */}
      {isLoading ? (
        <LoadingSpinner />
      ) : roadmaps.length === 0 ? (
        <div className="rounded-lg border border-numa-100 bg-numa-50/30 p-8 text-center">
          <p className="text-gray-500">
            {activeCategory
              ? "このカテゴリにはまだロードマップがありません。"
              : "公開されているロードマップはまだありません。"}
          </p>
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {roadmaps.map((roadmap) => (
              <RoadmapCard key={roadmap.roadmapId} roadmap={roadmap} />
            ))}
          </div>

          {/* Load more */}
          {hasMore && (
            <div className="mt-8 text-center">
              <button
                onClick={() => fetchRoadmaps(activeCategory, true)}
                disabled={isLoadingMore}
                className="rounded-md border border-gray-300 px-6 py-2 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50"
              >
                {isLoadingMore ? "読み込み中..." : "もっと見る"}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default ExplorePage;
