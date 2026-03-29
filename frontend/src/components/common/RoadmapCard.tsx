import { memo } from "react";
import { Link } from "react-router-dom";
import type { RoadmapMeta, Category } from "../../types";
import { CATEGORIES } from "../../types";

interface RoadmapCardProps {
  roadmap: RoadmapMeta;
}

const RoadmapCard = memo(function RoadmapCard({ roadmap }: RoadmapCardProps) {
  return (
    <Link
      to={`/roadmaps/${roadmap.roadmapId}`}
      className="block rounded-md border border-[rgba(90,70,40,.08)] bg-white p-4 transition hover:border-swamp-600/25 hover:-translate-y-0.5"
    >
      <h3 className="font-serif text-[15px] font-bold text-numa-text leading-snug">
        {roadmap.title}
      </h3>

      {roadmap.description && (
        <p className="mt-1 line-clamp-2 text-xs text-numa-text-muted leading-relaxed">
          {roadmap.description}
        </p>
      )}

      <div className="mt-3 flex items-center gap-2">
        {roadmap.category && (
          <span className="text-[10px] font-semibold text-numa-gold tracking-[1px] uppercase">
            {CATEGORIES[roadmap.category as Category] || roadmap.category}
          </span>
        )}
        {roadmap.tags?.map((tag) => (
          <span
            key={tag}
            className="text-[10px] text-numa-text-hint"
          >
            {tag}
          </span>
        ))}
      </div>

      <div className="mt-3 flex items-center justify-between text-[11px]">
        <span className="text-numa-text-hint">
          {new Date(roadmap.createdAt).toLocaleDateString("ja-JP")}
        </span>
        <span className="text-numa-gold font-semibold">{roadmap.likeCount}</span>
      </div>

      {/* Depth bar */}
      <div className="flex gap-0.5 mt-2.5">
        {["bg-[#e0d8c4]", "bg-[#c8dab8]", "bg-[#8aba82]", "bg-[#5a9a52]", "bg-[#2d5a32]"].map(
          (color, i) => (
            <div key={i} className={`h-[3px] flex-1 rounded-sm ${color}`} />
          ),
        )}
      </div>
    </Link>
  );
});

export default RoadmapCard;
