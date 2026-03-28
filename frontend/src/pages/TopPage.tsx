import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuthStore } from "../stores/authStore";
import { roadmapApi } from "../api/roadmap";
import type { RoadmapMeta } from "../types";
import RoadmapCard from "../components/common/RoadmapCard";

function TopPage() {
  const { user } = useAuthStore();
  const [popularRoadmaps, setPopularRoadmaps] = useState<RoadmapMeta[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadPopular();
  }, []);

  const loadPopular = async () => {
    try {
      const { data } = await roadmapApi.explore({ limit: 6 });
      setPopularRoadmaps(data.roadmaps || []);
    } catch {
      // non-critical
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      {/* Hero */}
      <div className="px-4 py-10 text-center sm:py-16">
        <h1 className="mb-4 text-4xl font-bold text-gray-900 sm:text-5xl">
          <span className="text-numa-600">Numa</span>
        </h1>
        <p className="mb-2 text-lg text-gray-600 sm:text-xl">
          あなたの知識を、ロードマップに。
        </p>
        <p className="mb-8 text-sm text-gray-500 sm:text-base">
          熟練者が作る学習ロードマップで、新しい「沼」に飛び込もう。
        </p>

        <div className="flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
          <Link
            to="/explore"
            className="rounded-md border border-numa-600 px-6 py-3 font-medium text-numa-600 hover:bg-numa-50"
          >
            ロードマップを探す
          </Link>
          {user ? (
            <Link
              to="/roadmaps/new"
              className="rounded-md bg-numa-600 px-6 py-3 font-medium text-white hover:bg-numa-700"
            >
              ロードマップを作成
            </Link>
          ) : (
            <Link
              to="/signup"
              className="rounded-md bg-numa-600 px-6 py-3 font-medium text-white hover:bg-numa-700"
            >
              無料で始める
            </Link>
          )}
        </div>
      </div>

      {/* Popular roadmaps */}
      <div className="py-8">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">
            人気のロードマップ
          </h2>
          <Link
            to="/explore"
            className="text-sm text-numa-600 hover:underline"
          >
            もっと見る →
          </Link>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-numa-600 border-t-transparent" />
          </div>
        ) : popularRoadmaps.length === 0 ? (
          <div className="rounded-lg border border-gray-200 bg-white p-8 text-center">
            <p className="text-gray-500">
              まだロードマップがありません。最初のロードマップを作成しましょう！
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {popularRoadmaps.map((roadmap) => (
              <RoadmapCard key={roadmap.roadmapId} roadmap={roadmap} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default TopPage;
