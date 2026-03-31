import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { roadmapApi } from "../api/roadmap";
import { getErrorMessage } from "../utils/getErrorMessage";
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
      } catch (e) {
        toast.error(getErrorMessage(e));
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

  const catButtonBase =
    "flex-shrink-0 whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-medium transition";
  const catActive = "bg-swamp-700 text-white";
  const catInactive =
    "bg-white border border-numa-border-soft text-[#5a4e3a] hover:border-swamp-700/30 hover:text-swamp-700";

  return (
    <div>
      <PageHead title="探す" description="公開されているロードマップを探しましょう" />
      <h1 className="mb-6 text-2xl font-bold text-numa-text">ロードマップを探す</h1>

      {/* Category filter — horizontal scroll */}
      <div
        className="mb-6 flex gap-2 overflow-x-auto pb-2"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        <style>{`.cat-scroll::-webkit-scrollbar { display: none; }`}</style>
        <button
          onClick={() => handleCategoryClick("")}
          className={`${catButtonBase} ${activeCategory === "" ? catActive : catInactive}`}
        >
          すべて
        </button>
        {Object.entries(CATEGORIES).map(([id, name]) => (
          <button
            key={id}
            onClick={() => handleCategoryClick(id)}
            className={`${catButtonBase} ${activeCategory === id ? catActive : catInactive}`}
          >
            {name}
          </button>
        ))}
      </div>

      {/* Loading */}
      {isLoading ? (
        <LoadingSpinner />
      ) : roadmaps.length === 0 ? (
        <div className="mt-6 rounded-md border border-numa-border-light bg-white py-20 text-center">
          <p className="mb-2 text-xl text-numa-text-muted">
            {activeCategory
              ? "このカテゴリにはまだロードマップがありません"
              : "まだ公開ロードマップがありません"}
          </p>
          <p className="mb-6 text-sm text-numa-text-hint">
            最初の沼の住人になりませんか？
          </p>
          <Link
            to="/roadmaps/new"
            className="inline-block rounded bg-swamp-700 px-6 py-3 font-bold text-white hover:bg-swamp-800 transition"
          >
            ロードマップを作る
          </Link>
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
                className="rounded border border-numa-border px-6 py-2 text-sm text-numa-text-muted hover:bg-[#f5f0e8] transition disabled:opacity-50"
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
