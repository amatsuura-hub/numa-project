import { useState } from "react";
import toast from "react-hot-toast";
import { roadmapApi } from "../../api/roadmap";
import { useAuthStore } from "../../stores/authStore";
import { getErrorMessage } from "../../utils/getErrorMessage";

interface BookmarkButtonProps {
  roadmapId: string;
  initialBookmarked: boolean;
}

function BookmarkButton({ roadmapId, initialBookmarked }: BookmarkButtonProps) {
  const { user } = useAuthStore();
  const [isBookmarked, setIsBookmarked] = useState(initialBookmarked);
  const [isLoading, setIsLoading] = useState(false);

  const handleToggle = async () => {
    if (!user || isLoading) return;

    setIsLoading(true);
    try {
      if (isBookmarked) {
        await roadmapApi.unbookmark(roadmapId);
        setIsBookmarked(false);
      } else {
        await roadmapApi.bookmark(roadmapId);
        setIsBookmarked(true);
      }
    } catch (e) {
      toast.error(getErrorMessage(e));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleToggle}
      disabled={!user || isLoading}
      aria-label={isBookmarked ? "ブックマークを解除" : "ブックマーク"}
      className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-colors ${
        isBookmarked
          ? "border-numa-300 bg-numa-50 text-numa-600"
          : "border-gray-300 text-gray-500 hover:border-numa-300 hover:text-numa-500"
      } disabled:cursor-not-allowed disabled:opacity-50`}
    >
      {isLoading ? (
        <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      ) : (
        <span>{isBookmarked ? "★" : "☆"}</span>
      )}
      <span>{isBookmarked ? "保存済み" : "保存"}</span>
    </button>
  );
}

export default BookmarkButton;
