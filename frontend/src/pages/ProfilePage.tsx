import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { userApi } from "../api/user";
import { useAuthStore } from "../stores/authStore";
import PageHead from "../components/common/PageHead";

function ProfilePage() {
  const { user } = useAuthStore();
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [xHandle, setXHandle] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const { data } = await userApi.getMe();
      setDisplayName(data.displayName || "");
      setBio(data.bio || "");
      setXHandle(data.xHandle || "");
    } catch {
      // user may not exist yet
    } finally {
      setIsLoading(false);
    }
  };

  const xHandleError =
    xHandle && !/^[A-Za-z0-9_]{1,15}$/.test(xHandle)
      ? "英数字とアンダースコアのみ、1〜15文字で入力してください"
      : null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (xHandleError) return;
    setIsSaving(true);

    try {
      await userApi.updateMe({ displayName, bio, xHandle });
      toast.success("プロフィールを更新しました");
    } catch {
      toast.error("更新に失敗しました");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-numa-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md py-8">
      <PageHead title="プロフィール編集" />
      <h1 className="mb-8 text-2xl font-bold">プロフィール編集</h1>

      <form onSubmit={handleSave} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            メールアドレス
          </label>
          <input
            type="email"
            value={user?.email || ""}
            disabled
            className="w-full rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-500"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            表示名
          </label>
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            required
            className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-numa-500 focus:outline-none focus:ring-1 focus:ring-numa-500"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            自己紹介
          </label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={3}
            maxLength={500}
            placeholder="自己紹介を入力..."
            className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-numa-500 focus:outline-none focus:ring-1 focus:ring-numa-500"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            X (Twitter) ハンドル
          </label>
          <div className="flex items-center">
            <span className="mr-1 text-gray-400">@</span>
            <input
              type="text"
              value={xHandle}
              onChange={(e) => setXHandle(e.target.value.replace(/^@/, ""))}
              placeholder="username"
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-numa-500 focus:outline-none focus:ring-1 focus:ring-numa-500"
            />
          </div>
          {xHandleError && (
            <p className="mt-1 text-xs text-red-500">{xHandleError}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={isSaving || !!xHandleError}
          className="w-full rounded-md bg-numa-600 px-4 py-2 font-medium text-white hover:bg-numa-700 disabled:opacity-50"
        >
          {isSaving ? "保存中..." : "保存"}
        </button>
      </form>
    </div>
  );
}

export default ProfilePage;
