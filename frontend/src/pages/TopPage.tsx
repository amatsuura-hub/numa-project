import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuthStore } from "../stores/authStore";
import { roadmapApi } from "../api/roadmap";
import type { RoadmapMeta, Category } from "../types";
import { CATEGORIES, CATEGORY_ICONS } from "../types";
import RoadmapCard from "../components/common/RoadmapCard";
import PageHead from "../components/common/PageHead";

/** Sample node preview for hero section (DTM theme) */
function HeroNodePreview() {
  return (
    <div className="mx-auto mt-8 max-w-md">
      <svg viewBox="0 0 400 260" className="w-full" aria-hidden="true">
        {/* Edges */}
        <line x1="200" y1="45" x2="120" y2="105" stroke="#86efac" strokeWidth="2" />
        <line x1="200" y1="45" x2="280" y2="105" stroke="#86efac" strokeWidth="2" />
        <line x1="120" y1="135" x2="80" y2="195" stroke="#86efac" strokeWidth="2" />
        <line x1="120" y1="135" x2="160" y2="195" stroke="#86efac" strokeWidth="2" />
        <line x1="280" y1="135" x2="280" y2="195" stroke="#86efac" strokeWidth="2" />

        {/* Root node */}
        <rect x="140" y="15" width="120" height="35" rx="8" fill="#16a34a" />
        <text x="200" y="38" textAnchor="middle" fill="white" fontSize="13" fontWeight="bold">DTM入門</text>

        {/* Level 2 nodes */}
        <rect x="60" y="105" width="120" height="30" rx="6" fill="#22c55e" />
        <text x="120" y="125" textAnchor="middle" fill="white" fontSize="11">DAWの選び方</text>

        <rect x="220" y="105" width="120" height="30" rx="6" fill="#22c55e" />
        <text x="280" y="125" textAnchor="middle" fill="white" fontSize="11">音楽理論の基礎</text>

        {/* Level 3 nodes */}
        <rect x="20" y="195" width="120" height="30" rx="6" fill="#4ade80" />
        <text x="80" y="215" textAnchor="middle" fill="#14532d" fontSize="10">ミックス基礎</text>

        <rect x="100" y="195" width="120" height="30" rx="6" fill="#4ade80" />
        <text x="160" y="215" textAnchor="middle" fill="#14532d" fontSize="10">シンセサイザー</text>

        <rect x="220" y="195" width="120" height="30" rx="6" fill="#4ade80" />
        <text x="280" y="215" textAnchor="middle" fill="#14532d" fontSize="10">コード進行</text>
      </svg>
    </div>
  );
}

/** Depth bar visualization for roadmap cards */
function DepthBar({ depth }: { depth: number }) {
  const colors = [
    "bg-numa-100",
    "bg-numa-200",
    "bg-numa-300",
    "bg-numa-400",
    "bg-numa-500",
    "bg-numa-600",
    "bg-numa-700",
    "bg-numa-800",
  ];
  return (
    <div className="flex gap-0.5">
      {colors.slice(0, depth).map((cls, i) => (
        <div key={i} className={`h-1.5 w-3 rounded-sm ${cls}`} />
      ))}
      {Array.from({ length: 8 - depth }).map((_, i) => (
        <div key={`empty-${i}`} className="h-1.5 w-3 rounded-sm bg-gray-100" />
      ))}
    </div>
  );
}

const categoryEntries = Object.entries(CATEGORIES) as [Category, string][];

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

      {/* ─── Hero Section ─── */}
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

        {/* Sample Roadmap Node Preview */}
        <HeroNodePreview />

        {/* Depth indicator */}
        <div className="relative mx-auto mt-8 flex max-w-xs items-center gap-1">
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

      {/* ─── Category Grid ─── */}
      <div className="py-10">
        <h2 className="mb-6 text-xl font-bold text-gray-900">カテゴリから探す</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-4">
          {categoryEntries.map(([key, name]) => (
            <Link
              key={key}
              to={`/explore?category=${key}`}
              className="flex items-center gap-3 rounded-lg border border-numa-100 bg-white p-4 transition-all hover:border-numa-300 hover:shadow-md"
            >
              <span className="text-2xl">{CATEGORY_ICONS[key]}</span>
              <span className="text-sm font-medium text-gray-700">{name}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* ─── Popular Roadmaps ─── */}
      <div className="py-8">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">人気のロードマップ</h2>
          <Link to="/explore" className="text-sm text-numa-600 hover:underline">
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
              <div key={roadmap.roadmapId} className="flex flex-col">
                <RoadmapCard roadmap={roadmap} />
                <div className="mt-2 px-1">
                  <DepthBar depth={Math.min(8, Math.max(1, Math.ceil(roadmap.likeCount / 3) + 2))} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ─── How It Works ─── */}
      <div className="py-10">
        <h2 className="mb-8 text-center text-xl font-bold text-gray-900">
          Numaの使い方
        </h2>
        <div className="grid gap-6 sm:grid-cols-3">
          {[
            {
              step: "1",
              title: "沼を見つける",
              desc: "カテゴリや検索から、興味のあるロードマップを探しましょう。",
              icon: "🔍",
            },
            {
              step: "2",
              title: "沼にハマる",
              desc: "ノードをひとつずつクリアして、沼の深みへ進みましょう。",
              icon: "🐸",
            },
            {
              step: "3",
              title: "沼を共有する",
              desc: "あなたの知識をロードマップにして、次の人に共有しましょう。",
              icon: "🌿",
            },
          ].map((item) => (
            <div
              key={item.step}
              className="flex flex-col items-center rounded-lg border border-numa-100 bg-white p-6 text-center"
            >
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-numa-50 text-2xl">
                {item.icon}
              </div>
              <div className="mb-1 text-xs font-bold text-numa-400">
                STEP {item.step}
              </div>
              <h3 className="mb-2 text-lg font-bold text-gray-900">
                {item.title}
              </h3>
              <p className="text-sm text-gray-500">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ─── Footer CTA ─── */}
      <div className="rounded-lg bg-numa-50 p-8 text-center sm:p-12">
        <h2 className="mb-3 text-2xl font-bold text-gray-900">
          あなたも沼を作りませんか？
        </h2>
        <p className="mb-6 text-sm text-gray-500">
          熟練者の知識を、マインドマップ形式のロードマップにして共有しましょう。
        </p>
        {user ? (
          <Link
            to="/roadmaps/new"
            className="inline-block rounded-md bg-numa-600 px-8 py-3 font-medium text-white hover:bg-numa-700"
          >
            ロードマップを作成する
          </Link>
        ) : (
          <Link
            to="/signup"
            className="inline-block rounded-md bg-numa-600 px-8 py-3 font-medium text-white hover:bg-numa-700"
          >
            無料で始める
          </Link>
        )}
      </div>
    </div>
  );
}

export default TopPage;
