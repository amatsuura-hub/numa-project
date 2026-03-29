import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuthStore } from "../stores/authStore";
import { roadmapApi } from "../api/roadmap";
import type { RoadmapMeta } from "../types";
import RoadmapCard from "../components/common/RoadmapCard";
import PageHead from "../components/common/PageHead";

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
      <PageHead />
      {/* Hero */}
      <div className="numa-ripple-bg relative overflow-hidden px-4 py-12 text-center sm:py-20">
        {/* Decorative creatures */}
        <div className="numa-creature-frog numa-bubble-slow" style={{ top: 10, left: "8%" }} />
        <div className="numa-creature-fish numa-bubble-delay" style={{ bottom: 20, right: "12%" }} />
        <div className="numa-creature-turtle numa-bubble" style={{ top: 30, right: "5%" }} />

        {/* Decorative bubbles */}
        <div className="pointer-events-none absolute left-[15%] top-[20%] h-3 w-3 rounded-full bg-numa-300/20 numa-bubble" />
        <div className="pointer-events-none absolute left-[70%] top-[60%] h-2 w-2 rounded-full bg-numa-400/15 numa-bubble-delay" />
        <div className="pointer-events-none absolute left-[45%] top-[75%] h-4 w-4 rounded-full bg-numa-200/20 numa-bubble-slow" />

        <h1 className="relative mb-4 text-4xl font-bold text-gray-900 sm:text-5xl">
          <span className="text-numa-600">Numa</span>
        </h1>
        <p className="relative mb-2 text-lg text-gray-600 sm:text-xl">
          あなたの知識を、ロードマップに。
        </p>
        <p className="relative mb-8 text-sm text-gray-500 sm:text-base">
          熟練者が作る学習ロードマップで、新しい「沼」に飛び込もう。
        </p>

        <div className="relative flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
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

        {/* Depth indicator */}
        <div className="relative mx-auto mt-12 flex max-w-xs items-center gap-1">
          <span className="text-xs text-gray-400">浅い</span>
          <div className="flex flex-1 gap-0.5">
            {["bg-numa-100", "bg-numa-200", "bg-numa-300", "bg-numa-400", "bg-numa-500", "bg-numa-600", "bg-numa-700", "bg-numa-800"].map((cls, i) => (
              <div key={i} className={`h-2 flex-1 ${i === 0 ? "rounded-l-full" : ""} ${i === 7 ? "rounded-r-full" : ""} ${cls}`} />
            ))}
          </div>
          <span className="text-xs text-gray-400">深い</span>
        </div>
        <p className="relative mt-1 text-xs text-gray-400">
          沼の深さ = あなたの成長
        </p>
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
          <div className="rounded-lg border border-numa-200 bg-numa-50/50 p-8 text-center">
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
