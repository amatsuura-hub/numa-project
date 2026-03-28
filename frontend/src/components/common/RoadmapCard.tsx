import { Link } from "react-router-dom";
import type { RoadmapMeta, Category } from "../../types";
import { CATEGORIES } from "../../types";

interface RoadmapCardProps {
  roadmap: RoadmapMeta;
}

function RoadmapCard({ roadmap }: RoadmapCardProps) {
  return (
    <Link
      to={`/roadmaps/${roadmap.roadmapId}`}
      className="block rounded-lg border border-gray-200 bg-white p-4 transition-shadow hover:shadow-md"
    >
      <h3 className="text-lg font-semibold text-gray-900">{roadmap.title}</h3>

      {roadmap.description && (
        <p className="mt-1 line-clamp-2 text-sm text-gray-500">
          {roadmap.description}
        </p>
      )}

      <div className="mt-3 flex items-center gap-2">
        {roadmap.category && (
          <span className="rounded-full bg-numa-50 px-2 py-0.5 text-xs text-numa-600">
            {CATEGORIES[roadmap.category as Category] || roadmap.category}
          </span>
        )}
        {roadmap.tags?.map((tag) => (
          <span
            key={tag}
            className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500"
          >
            {tag}
          </span>
        ))}
      </div>

      <div className="mt-3 flex items-center gap-2 text-xs text-gray-400">
        <span>♡ {roadmap.likeCount}</span>
        <span>·</span>
        <span>
          {new Date(roadmap.createdAt).toLocaleDateString("ja-JP")}
        </span>
      </div>
    </Link>
  );
}

export default RoadmapCard;
