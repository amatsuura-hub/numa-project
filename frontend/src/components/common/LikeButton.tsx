import { useState } from "react";
import toast from "react-hot-toast";
import { roadmapApi } from "../../api/roadmap";
import { useAuthStore } from "../../stores/authStore";

interface LikeButtonProps {
  roadmapId: string;
  initialLiked: boolean;
  initialCount: number;
}

function LikeButton({ roadmapId, initialLiked, initialCount }: LikeButtonProps) {
  const { user } = useAuthStore();
  const [isLiked, setIsLiked] = useState(initialLiked);
  const [count, setCount] = useState(initialCount);
  const [isLoading, setIsLoading] = useState(false);

  const handleToggle = async () => {
    if (!user || isLoading) return;

    setIsLoading(true);
    try {
      if (isLiked) {
        await roadmapApi.unlike(roadmapId);
        setIsLiked(false);
        setCount((c) => Math.max(0, c - 1));
      } else {
        await roadmapApi.like(roadmapId);
        setIsLiked(true);
        setCount((c) => c + 1);
      }
    } catch {
      toast.error("操作に失敗しました");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleToggle}
      disabled={!user || isLoading}
      aria-label={isLiked ? "いいねを取り消す" : "いいね"}
      className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-colors ${
        isLiked
          ? "border-red-300 bg-red-50 text-red-600"
          : "border-gray-300 text-gray-500 hover:border-red-300 hover:text-red-500"
      } disabled:cursor-not-allowed disabled:opacity-50`}
    >
      {isLoading ? (
        <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      ) : (
        <span>{isLiked ? "♥" : "♡"}</span>
      )}
      <span>{count}</span>
    </button>
  );
}

export default LikeButton;
