import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuthStore } from "../stores/authStore";
import { roadmapApi } from "../api/roadmap";
import type { RoadmapMeta, Category } from "../types";
import { CATEGORIES } from "../types";
import PageHead from "../components/common/PageHead";
import LoadingSpinner from "../components/common/LoadingSpinner";
import { Heron, Crocodile, Frog, Turtle, Owl } from "../components/creatures";

/* ── Mock data for fallback ── */
const MOCK_CARDS = [
  {
    category: "Game",
    title: "格ゲー初心者脱出ロードマップ",
    author: "@fgc_master",
    nodes: 14,
    likes: 203,
  },
  {
    category: "Code",
    title: "Go言語で始めるバックエンド開発",
    author: "@go_sensei",
    nodes: 12,
    likes: 156,
  },
  {
    category: "DTM",
    title: "ボカロPになるまでの道のり",
    author: "@vocaloid_numa",
    nodes: 18,
    likes: 142,
  },
];

/* ── Depth bar (5-stop swamp gradient) ── */
function DepthBar() {
  const stops = [
    "bg-[#e0d8c4]",
    "bg-[#c8dab8]",
    "bg-[#8aba82]",
    "bg-[#5a9a52]",
    "bg-[#2d5a32]",
  ];
  return (
    <div className="flex gap-0.5 mt-2.5">
      {stops.map((color, i) => (
        <div key={i} className={`h-[3px] flex-1 rounded-sm ${color}`} />
      ))}
    </div>
  );
}

/* ── Hero node preview ── */
function HeroNodePreview() {
  return (
    <div className="relative w-full max-w-[340px] min-h-[280px] z-[1]">
      <svg
        className="absolute inset-0 pointer-events-none"
        viewBox="0 0 340 280"
        aria-hidden="true"
      >
        {/* [2-1] Animated connection lines */}
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
      {/* [2-2] Nodes with stronger color steps */}
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

/* ── Roadmap card (API data) ── */
function PopularCard({ roadmap }: { roadmap: RoadmapMeta }) {
  return (
    <Link
      to={`/roadmaps/${roadmap.roadmapId}`}
      className="block border border-[rgba(90,70,40,.08)] rounded-md overflow-hidden bg-white transition hover:border-swamp-600/25 hover:-translate-y-0.5"
    >
      <div className="h-16 flex">
        {["#f0ead8", "#e8f0e4", "#d4e8c8", "#b8d4a8", "#8aba82"].map((c, i) => (
          <span key={i} className="flex-1" style={{ background: c }} />
        ))}
      </div>
      <div className="p-3.5">
        {roadmap.category && (
          <div className="text-[10px] font-semibold text-numa-gold tracking-[1px] uppercase mb-1.5">
            {CATEGORIES[roadmap.category as Category] || roadmap.category}
          </div>
        )}
        <div className="font-serif text-[15px] font-bold text-[#2a2418] leading-snug mb-1">
          {roadmap.title}
        </div>
        {roadmap.userId && (
          <div className="text-xs text-numa-text-hint mb-2.5">
            by {roadmap.userId.slice(0, 8)}...
          </div>
        )}
        <div className="flex justify-between items-center text-[11px]">
          <span className="text-numa-text-hint">
            {new Date(roadmap.createdAt).toLocaleDateString("ja-JP")}
          </span>
          <span className="text-numa-gold font-semibold">{roadmap.likeCount}</span>
        </div>
        <DepthBar />
      </div>
    </Link>
  );
}

/* ── Mock card (fallback) ── */
function MockCard({ card }: { card: typeof MOCK_CARDS[number] }) {
  return (
    <div className="block border border-[rgba(90,70,40,.08)] rounded-md overflow-hidden bg-white transition hover:border-swamp-600/25 hover:-translate-y-0.5 cursor-default">
      <div className="h-16 flex">
        {["#f0ead8", "#e8f0e4", "#d4e8c8", "#b8d4a8", "#8aba82"].map((c, i) => (
          <span key={i} className="flex-1" style={{ background: c }} />
        ))}
      </div>
      <div className="p-3.5">
        <div className="text-[10px] font-semibold text-numa-gold tracking-[1px] uppercase mb-1.5">
          {card.category}
        </div>
        <div className="font-serif text-[15px] font-bold text-[#2a2418] leading-snug mb-1">
          {card.title}
        </div>
        <div className="text-xs text-numa-text-hint mb-2.5">
          by {card.author}
        </div>
        <div className="flex justify-between items-center text-[11px]">
          <span className="text-numa-text-hint">{card.nodes} nodes</span>
          <span className="text-numa-gold font-semibold">{card.likes}</span>
        </div>
        <DepthBar />
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
      // non-critical — mock cards will show as fallback
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <PageHead />

      {/* ─── Hero (2-col asymmetric) ─── */}
      <div className="grid md:grid-cols-2 min-h-[420px] relative overflow-hidden">
        {/* Left: text + CTA */}
        {/* [1-3] Reduced top padding: py-12→py-8, md:py-16→md:py-10 */}
        <div className="relative flex flex-col justify-center px-8 py-8 md:py-10 md:pr-10">
          {/* [3] Heron: w-28→w-36, opacity 0.05→0.09 */}
          <Heron className="absolute top-4 right-0 w-36 text-swamp-700 opacity-[0.09] pointer-events-none" />

          {/* [1-3] Label-to-h1 gap: mb-4→mb-2, [5] darker gold */}
          <span className="font-serif text-[11px] tracking-[3px] text-[#7a6238] uppercase mb-2">
            roadmap sharing
          </span>
          {/* [1-2] h1: text-3xl→text-4xl / md:text-5xl, leading-[1.4]→leading-tight */}
          <h1 className="font-serif text-4xl md:text-5xl font-black text-[#2a2418] leading-tight mb-3.5">
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
              className="bg-transparent text-numa-brown border border-[rgba(90,70,40,.2)] rounded px-6 py-3 text-sm font-semibold hover:border-[rgba(90,70,40,.4)] transition"
            >
              ロードマップを作る
            </Link>
          </div>
        </div>

        {/* Right: warm bg + stripe pattern + node preview */}
        <div className="relative bg-numa-bg-warm flex items-center justify-center p-8 overflow-hidden">
          <div className="absolute inset-0 numa-stripe-pattern" />
          {/* [3] Crocodile: opacity 0.04→0.08 */}
          <Crocodile className="absolute bottom-5 left-3 w-20 text-swamp-700 opacity-[0.08] pointer-events-none" />
          <HeroNodePreview />
        </div>
      </div>

      <hr className="border-t border-[rgba(90,70,40,.08)]" />

      {/* ─── Categories (horizontal scroll pills) ─── */}
      <div className="relative px-8 py-10 overflow-hidden">
        {/* [3] Turtle: opacity 0.04→0.08 */}
        <Turtle className="absolute bottom-2 right-6 w-24 text-swamp-700 opacity-[0.08] pointer-events-none" />

        <div className="flex justify-between items-baseline mb-5">
          {/* [5] Darker section title */}
          <h2 className="font-serif text-xl font-bold text-[#2a2418]">カテゴリから沼を探す</h2>
          <Link to="/explore" className="text-sm text-numa-gold hover:underline">
            すべて見る
          </Link>
        </div>

        <div className="flex gap-2.5 overflow-x-auto pb-1">
          {categoryEntries.map(([key, name]) => (
            <Link
              key={key}
              to={`/explore?category=${key}`}
              className="flex-shrink-0 border border-[rgba(90,70,40,.1)] bg-white rounded px-4 py-2.5 text-sm text-[#5a4e3a] whitespace-nowrap transition hover:border-swamp-600/30 hover:text-swamp-700"
            >
              {name}
            </Link>
          ))}
        </div>
      </div>

      {/* ─── Popular Roadmaps (1.2fr 1fr 1fr grid) ─── */}
      <div className="relative px-8 pb-10 overflow-hidden">
        {/* [3] Owl at popular section: opacity 0.04→0.08 */}
        <Owl className="absolute top-0 right-10 w-16 text-swamp-700 opacity-[0.08] pointer-events-none" />

        <div className="flex justify-between items-baseline mb-5">
          {/* [5] Darker section title */}
          <h2 className="font-serif text-xl font-bold text-[#2a2418]">いま熱い沼</h2>
          <Link to="/explore" className="text-sm text-numa-gold hover:underline">
            もっと見る
          </Link>
        </div>

        {isLoading ? (
          <LoadingSpinner />
        ) : popularRoadmaps.length > 0 ? (
          /* [4] grid with 1.2fr 1fr 1fr */
          <div className="grid gap-3.5 md:grid-cols-[1.2fr_1fr_1fr]">
            {popularRoadmaps.slice(0, 3).map((roadmap) => (
              <PopularCard key={roadmap.roadmapId} roadmap={roadmap} />
            ))}
          </div>
        ) : (
          /* [4] Fallback: mock cards instead of empty state */
          <div className="grid gap-3.5 md:grid-cols-[1.2fr_1fr_1fr]">
            {MOCK_CARDS.map((card) => (
              <MockCard key={card.title} card={card} />
            ))}
          </div>
        )}
      </div>

      {/* ─── How It Works ─── */}
      {/* [5] Warmer background: bg-numa-bg-warm→bg-[#ede5d0] */}
      <div className="relative bg-[#ede5d0] border-t border-b border-[rgba(90,70,40,.06)] px-8 py-10 overflow-hidden">
        {/* [3] Owl: w-[70px]→w-24, opacity 0.05→0.09 */}
        <Owl className="absolute top-5 right-8 w-24 text-swamp-700 opacity-[0.09] pointer-events-none" />

        {/* [5] Darker section title */}
        <h2 className="font-serif text-xl font-bold text-[#2a2418] mb-5">Numaの使い方</h2>
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
              className="border-l-2 border-[rgba(90,70,40,.12)] pl-5"
            >
              <div className="font-serif text-3xl font-black text-[rgba(90,70,40,.12)] leading-none mb-2">
                {step.num}
              </div>
              <div className="text-sm font-bold text-[#2a2418] mb-1">{step.title}</div>
              <div className="text-xs text-numa-text-muted leading-relaxed">{step.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ─── Footer CTA ─── */}
      <div className="relative text-center px-8 py-12 overflow-hidden">
        {/* [3] Frog: w-12→w-20, opacity 0.04→0.09 */}
        <Frog className="absolute top-4 left-14 w-20 text-swamp-700 opacity-[0.09] -rotate-[10deg] pointer-events-none" />

        <h2 className="font-serif text-[22px] font-black text-[#2a2418] mb-2 relative z-[1]">
          さあ、あなたの沼を共有しよう。
        </h2>
        <p className="text-sm text-numa-text-muted mb-6 relative z-[1]">
          好きなことに詳しいあなたの知識が、誰かの道しるべになる。
        </p>
        <Link
          to={user ? "/roadmaps/new" : "/signup"}
          className="relative z-[1] inline-block bg-swamp-700 text-green-50 rounded px-9 py-3.5 text-[15px] font-bold hover:bg-swamp-800 transition"
        >
          {user ? "ロードマップを作成する" : "無料ではじめる"}
        </Link>
      </div>

      {/* ─── Footer ─── */}
      <div className="text-center py-5 text-[11px] text-numa-text-hint border-t border-[rgba(90,70,40,.06)]">
        Numa - ロードマップ作成＆共有プラットフォーム
      </div>
    </div>
  );
}

export default TopPage;
