import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import toast from "react-hot-toast";
import { userApi } from "../api/user";
import { roadmapApi } from "../api/roadmap";
import type { User, RoadmapMeta } from "../types";
import RoadmapCard from "../components/common/RoadmapCard";

function UserPage() {
  const { id } = useParams<{ id: string }>();
  const [userProfile, setUserProfile] = useState<User | null>(null);
  const [roadmaps, setRoadmaps] = useState<RoadmapMeta[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    loadUser(id);
  }, [id]);

  const loadUser = async (userId: string) => {
    try {
      const { data: user } = await userApi.getUser(userId);
      setUserProfile(user);

      // TODO: dedicated endpoint for user's public roadmaps
      // For now we use explore and filter client-side
      const { data } = await roadmapApi.explore({ limit: 50 });
      const userRoadmaps = (data.roadmaps || []).filter(
        (r) => r.userId === userId,
      );
      setRoadmaps(userRoadmaps);
    } catch (e) {
      const msg = (e as Error).message;
      setError(msg);
      toast.error(msg || "ユーザー情報の読み込みに失敗しました");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-numa-600 border-t-transparent" />
      </div>
    );
  }

  if (error || !userProfile) {
    return (
      <div className="py-20 text-center">
        <p className="text-gray-500">
          {error || "ユーザーが見つかりません"}
        </p>
        <Link
          to="/explore"
          className="mt-4 inline-block text-sm text-numa-600 hover:underline"
        >
          ロードマップを探す
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold">{userProfile.displayName}</h1>
        {userProfile.bio && (
          <p className="mt-1 text-gray-500">{userProfile.bio}</p>
        )}
        {userProfile.xHandle && (
          <p className="mt-1 text-sm text-gray-400">
            @{userProfile.xHandle}
          </p>
        )}
      </div>

      <h2 className="mb-4 text-lg font-semibold">公開ロードマップ</h2>

      {roadmaps.length === 0 ? (
        <p className="text-gray-500">
          公開されているロードマップはありません。
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {roadmaps.map((roadmap) => (
            <RoadmapCard key={roadmap.roadmapId} roadmap={roadmap} />
          ))}
        </div>
      )}
    </div>
  );
}

export default UserPage;
