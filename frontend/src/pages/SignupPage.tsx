import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuthStore } from "../stores/authStore";

function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [confirmationCode, setConfirmationCode] = useState("");
  const [step, setStep] = useState<"signup" | "confirm">("signup");
  const { signup, confirmSignup, error } = useAuthStore();
  const navigate = useNavigate();

  const validatePassword = (pw: string): string | null => {
    if (pw.length < 8) return "パスワードは8文字以上にしてください";
    if (!/[A-Z]/.test(pw)) return "大文字を含めてください";
    if (!/[a-z]/.test(pw)) return "小文字を含めてください";
    if (!/[0-9]/.test(pw)) return "数字を含めてください";
    if (!/[^A-Za-z0-9]/.test(pw)) return "記号を含めてください";
    return null;
  };

  const passwordError = password ? validatePassword(password) : null;

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword || passwordError) {
      return;
    }
    try {
      await signup(email, password);
      setStep("confirm");
    } catch {
      // error is set in store
    }
  };

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await confirmSignup(email, confirmationCode);
      navigate("/login");
    } catch {
      // error is set in store
    }
  };

  if (step === "confirm") {
    return (
      <div className="mx-auto max-w-md py-12">
        <h1 className="mb-4 text-center text-2xl font-bold">メール確認</h1>
        <p className="mb-8 text-center text-sm text-gray-600">
          {email} に確認コードを送信しました。
        </p>

        {error && (
          <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleConfirm} className="space-y-4">
          <div>
            <label htmlFor="code" className="mb-1 block text-sm font-medium text-gray-700">
              確認コード
            </label>
            <input
              id="code"
              type="text"
              value={confirmationCode}
              onChange={(e) => setConfirmationCode(e.target.value)}
              required
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-numa-500 focus:outline-none focus:ring-1 focus:ring-numa-500"
            />
          </div>

          <button
            type="submit"
            className="w-full rounded-md bg-numa-600 px-4 py-2 font-medium text-white hover:bg-numa-700"
          >
            確認
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md py-12">
      <h1 className="mb-8 text-center text-2xl font-bold">サインアップ</h1>

      {error && (
        <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSignup} className="space-y-4">
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
            minLength={8}
            className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-numa-500 focus:outline-none focus:ring-1 focus:ring-numa-500"
          />
          {passwordError ? (
            <p className="mt-1 text-xs text-red-500">{passwordError}</p>
          ) : (
            <p className="mt-1 text-xs text-gray-500">
              8文字以上、大文字・小文字・数字・記号を含む
            </p>
          )}
        </div>

        <div>
          <label htmlFor="confirmPassword" className="mb-1 block text-sm font-medium text-gray-700">
            パスワード（確認）
          </label>
          <input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-numa-500 focus:outline-none focus:ring-1 focus:ring-numa-500"
          />
          {password !== confirmPassword && confirmPassword && (
            <p className="mt-1 text-xs text-red-500">パスワードが一致しません</p>
          )}
        </div>

        <button
          type="submit"
          disabled={password !== confirmPassword || !!passwordError}
          className="w-full rounded-md bg-numa-600 px-4 py-2 font-medium text-white hover:bg-numa-700 disabled:opacity-50"
        >
          サインアップ
        </button>
      </form>

      <p className="mt-4 text-center text-sm text-gray-600">
        既にアカウントをお持ちの方は{" "}
        <Link to="/login" className="text-numa-600 hover:underline">
          ログイン
        </Link>
      </p>
    </div>
  );
}

export default SignupPage;
