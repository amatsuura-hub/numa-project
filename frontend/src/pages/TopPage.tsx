import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuthStore } from "../stores/authStore";
import { roadmapApi } from "../api/roadmap";
import type { RoadmapMeta, Category } from "../types";
import { CATEGORIES } from "../types";
import PageHead from "../components/common/PageHead";
import RoadmapCard from "../components/common/RoadmapCard";
import LoadingSpinner from "../components/common/LoadingSpinner";

/* ── Fallback roadmaps (shown when API returns empty) ── */
const FALLBACK_ROADMAPS: RoadmapMeta[] = [
  {
    roadmapId: "mock-1",
    title: "格ゲー初心者脱出ロードマップ",
    description: "格闘ゲームの基礎から対戦で勝てるまで",
    userId: "mock-user-1",
    category: "gaming",
    tags: ["格ゲー", "スト6"],
    isPublic: true,
    likeCount: 203,
    createdAt: "2026-03-01T00:00:00Z",
    updatedAt: "2026-03-01T00:00:00Z",
  },
  {
    roadmapId: "mock-2",
    title: "Go言語で始めるバックエンド開発",
    description: "環境構築からAPI完成まで12ステップ",
    userId: "mock-user-2",
    category: "programming",
    tags: ["Go", "Lambda"],
    isPublic: true,
    likeCount: 156,
    createdAt: "2026-03-10T00:00:00Z",
    updatedAt: "2026-03-10T00:00:00Z",
  },
  {
    roadmapId: "mock-3",
    title: "ボカロPになるまでの道のり",
    description: "曲を作ったことがない人が1曲完成させるまで",
    userId: "mock-user-3",
    category: "dtm",
    tags: ["ボカロ", "DTM"],
    isPublic: true,
    likeCount: 142,
    createdAt: "2026-03-15T00:00:00Z",
    updatedAt: "2026-03-15T00:00:00Z",
  },
];

/* ── Hero node preview ── */
function HeroNodePreview() {
  return (
    <div className="relative w-full max-w-[340px] min-h-[280px] z-[1]">
      <svg
        className="absolute inset-0 pointer-events-none"
        viewBox="0 0 340 280"
        aria-hidden="true"
      >
        <style>{`
          @keyframes draw { from { stroke-dashoffset: 200; } to { stroke-dashoffset: 0; } }
          .edge-line { stroke-dasharray: 200; animation: draw 2s ease-out forwards; }
        `}</style>
        <line className="edge-line" x1="170" y1="30" x2="60" y2="76" stroke="rgba(45,90,50,.18)" strokeWidth="1.5" style={{ animationDelay: "0s" }} />
        <line className="edge-line" x1="170" y1="30" x2="280" y2="76" stroke="rgba(45,90,50,.18)" strokeWidth="1.5" style={{ animationDelay: "0.2s" }} />
        <line className="edge-line" x1="50" y1="100" x2="50" y2="146" stroke="rgba(45,90,50,.15)" strokeWidth="1.5" style={{ animationDelay: "0.5s" }} />
        <line className="edge-line" x1="290" y1="100" x2="290" y2="146" stroke="rgba(45,90,50,.15)" strokeWidth="1.5" style={{ animationDelay: "0.6s" }} />
        <line className="edge-line" x1="50" y1="172" x2="170" y2="248" stroke="rgba(45,90,50,.12)" strokeWidth="1.5" style={{ animationDelay: "0.9s" }} />
        <line className="edge-line" x1="290" y1="172" x2="170" y2="248" stroke="rgba(45,90,50,.12)" strokeWidth="1.5" style={{ animationDelay: "1.0s" }} />
      </svg>
      <div className="absolute left-1/2 top-0 -translate-x-1/2 rounded px-4 py-2.5 text-xs font-semibold bg-[#e8dfc8] border-l-[3px] border-l-[#a07840] text-[#6a5530]">
        DTM入門
      </div>
      <div className="absolute left-0 top-[70px] rounded px-4 py-2.5 text-xs font-semibold bg-swamp-50 border-l-[3px] border-l-swamp-400 text-swamp-600">
        DAWの選び方
      </div>
      <div className="absolute right-0 top-[70px] rounded px-4 py-2.5 text-xs font-semibold bg-swamp-100 border-l-[3px] border-l-swamp-500 text-swamp-700">
        音楽理論の基礎
      </div>
      <div className="absolute left-[10px] top-[140px] rounded px-4 py-2.5 text-xs font-semibold bg-swamp-200 border-l-[3px] border-l-swamp-600 text-swamp-800">
        最初の1曲
      </div>
      <div className="absolute right-[10px] top-[140px] rounded px-4 py-2.5 text-xs font-semibold bg-swamp-300 border-l-[3px] border-l-swamp-700 text-swamp-800">
        ミキシング
      </div>
      <div className="absolute left-1/2 bottom-0 -translate-x-1/2 rounded px-4 py-2.5 text-xs font-bold bg-swamp-700 border-l-[3px] border-l-swamp-900 text-white">
        自作曲を公開する
      </div>
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
      // non-critical — fallback cards will show
    } finally {
      setIsLoading(false);
    }
  };

  const displayRoadmaps = popularRoadmaps.length > 0 ? popularRoadmaps.slice(0, 3) : FALLBACK_ROADMAPS;
  const isMockData = popularRoadmaps.length === 0;

  return (
    <div>
      <PageHead />

      {/* ─── Hero (2-col asymmetric) ─── */}
      <div className="grid md:grid-cols-2 min-h-[380px] relative overflow-hidden">
        {/* Left: text + CTA */}
        <div className="flex flex-col justify-center px-8 py-6 md:py-8 md:pr-10">
          <span className="text-[11px] tracking-[3px] text-numa-gold uppercase mb-2">
            roadmap sharing
          </span>
          <h1 className="text-4xl md:text-5xl font-black text-numa-text leading-tight mb-3.5">
            好きなこと、<br />
            <span className="numa-em-underline">沼</span>のように深く。
          </h1>
          <p className="text-sm text-numa-text-muted leading-relaxed max-w-[360px] mb-7">
            熟練者が作ったロードマップで、新しい世界に飛び込もう。
            ノードをクリアするたびに、沼は深くなる。
            気づいたら、あなたも沼の住人。
          </p>
          <div className="flex gap-3">
            <Link
              to="/explore"
              className="bg-swamp-700 text-green-50 rounded px-6 py-3 text-sm font-bold hover:bg-swamp-800 transition"
            >
              沼を探しに行く
            </Link>
            <Link
              to={user ? "/roadmaps/new" : "/signup"}
              className="bg-transparent text-numa-brown border border-numa-border-hover rounded px-6 py-3 text-sm font-semibold hover:border-numa-brown/40 transition"
            >
              ロードマップを作る
            </Link>
          </div>
        </div>

        {/* Right: warm bg + stripe pattern + node preview */}
        <div className="relative bg-numa-bg-warm flex items-center justify-center p-8 overflow-hidden">
          <div className="absolute inset-0 numa-stripe-pattern" />
          <HeroNodePreview />
        </div>
      </div>

      <hr className="border-t border-numa-border my-0" />

      {/* ─── Categories (horizontal scroll pills) ─── */}
      <div className="px-8 py-6">
        <div className="flex justify-between items-baseline mb-3">
          <h2 className="text-xl font-bold text-numa-text">カテゴリから沼を探す</h2>
          <Link to="/explore" className="text-sm text-numa-gold hover:underline">
            すべて見る
          </Link>
        </div>

        <div className="flex gap-2.5 overflow-x-auto pb-1">
          {categoryEntries.map(([key, name]) => (
            <Link
              key={key}
              to={`/explore?category=${key}`}
              className="flex-shrink-0 border border-numa-border bg-white rounded px-4 py-2.5 text-sm text-numa-text-muted whitespace-nowrap transition hover:border-swamp-600/30 hover:text-swamp-700"
            >
              {name}
            </Link>
          ))}
        </div>
      </div>

      {/* ─── Popular Roadmaps ─── */}
      <div className="px-8 pb-6">
        <div className="flex justify-between items-baseline mb-3">
          <h2 className="text-xl font-bold text-numa-text">いま熱い沼</h2>
          <Link to="/explore" className="text-sm text-numa-gold hover:underline">
            もっと見る
          </Link>
        </div>

        {isLoading ? (
          <LoadingSpinner />
        ) : (
          <div className="grid gap-3.5 grid-cols-1 md:grid-cols-[1.2fr_1fr_1fr]">
            {displayRoadmaps.map((roadmap) => (
              <RoadmapCard
                key={roadmap.roadmapId}
                roadmap={roadmap}
                linkTo={isMockData ? "/explore" : undefined}
              />
            ))}
          </div>
        )}
      </div>

      {/* ─── How It Works ─── */}
      <div className="bg-numa-bg-warm border-t border-b border-numa-border px-8 py-6">
        <h2 className="text-xl font-bold text-numa-text mb-3">Numaの使い方</h2>
        <div className="grid gap-6 md:grid-cols-3">
          {[
            {
              num: "01",
              title: "沼を見つける",
              desc: "カテゴリや検索から、興味のあるロードマップを探しましょう。",
            },
            {
              num: "02",
              title: "沼にハマる",
              desc: "ノードをひとつずつクリアして、沼の深みへ進みましょう。",
            },
            {
              num: "03",
              title: "沼を共有する",
              desc: "あなたの知識をロードマップにして、次の人に共有しましょう。",
            },
          ].map((step) => (
            <div
              key={step.num}
              className="border-l-2 border-numa-border pl-5"
            >
              <div className="text-3xl font-black text-numa-border leading-none mb-2">
                {step.num}
              </div>
              <div className="text-sm font-bold text-numa-text mb-1">{step.title}</div>
              <div className="text-xs text-numa-text-muted leading-relaxed">{step.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ─── Footer CTA ─── */}
      <div className="text-center px-8 py-8">
        <h2 className="text-[22px] font-black text-numa-text mb-2">
          さあ、あなたの沼を共有しよう。
        </h2>
        <p className="text-sm text-numa-text-muted mb-6">
          好きなことに詳しいあなたの知識が、誰かの道しるべになる。
        </p>
        <Link
          to={user ? "/roadmaps/new" : "/signup"}
          className="inline-block bg-swamp-700 text-green-50 rounded px-9 py-3.5 text-[15px] font-bold hover:bg-swamp-800 transition"
        >
          {user ? "ロードマップを作成する" : "無料ではじめる"}
        </Link>
      </div>

      {/* ─── Footer ─── */}
      <div className="text-center py-5 text-[11px] text-numa-text-hint border-t border-numa-border">
        Numa - ロードマップ作成＆共有プラットフォーム
      </div>
    </div>
  );
}

export default TopPage;
