import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import toast from "react-hot-toast";
import { userApi } from "../api/user";
import type { User, RoadmapMeta } from "../types";
import { getErrorMessage } from "../utils/getErrorMessage";
import RoadmapCard from "../components/common/RoadmapCard";
import PageHead from "../components/common/PageHead";
import LoadingSpinner from "../components/common/LoadingSpinner";

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

      const { data } = await userApi.getUserRoadmaps(userId, { limit: 50 });
      setRoadmaps(data.roadmaps || []);
    } catch (e) {
      const msg = getErrorMessage(e);
      setError(msg);
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <LoadingSpinner />;
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
      <PageHead
        title={`${userProfile.displayName} のプロフィール`}
        description={userProfile.bio || `${userProfile.displayName} の公開ロードマップ一覧`}
      />
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
