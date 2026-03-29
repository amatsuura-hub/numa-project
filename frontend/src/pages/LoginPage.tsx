import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuthStore } from "../stores/authStore";
import PageHead from "../components/common/PageHead";

function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { login, error, isLoading } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(email, password);
      navigate("/dashboard");
    } catch {
      // error is set in store
    }
  };

  return (
    <div className="mx-auto max-w-md py-12">
      <PageHead title="ログイン" />
      <h1 className="mb-8 text-center text-2xl font-bold">ログイン</h1>

      {error && (
        <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="mb-1 block text-sm font-medium text-gray-700">
            メールアドレス
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-numa-500 focus:outline-none focus:ring-1 focus:ring-numa-500"
          />
        </div>

        <div>
          <label htmlFor="password" className="mb-1 block text-sm font-medium text-gray-700">
            パスワード
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-numa-500 focus:outline-none focus:ring-1 focus:ring-numa-500"
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full rounded-md bg-numa-600 px-4 py-2 font-medium text-white hover:bg-numa-700 disabled:opacity-50"
        >
          {isLoading ? "ログイン中..." : "ログイン"}
        </button>
      </form>

      <p className="mt-4 text-center text-sm text-gray-600">
        アカウントをお持ちでない方は{" "}
        <Link to="/signup" className="text-numa-600 hover:underline">
          サインアップ
        </Link>
      </p>
    </div>
  );
}

export default LoginPage;
