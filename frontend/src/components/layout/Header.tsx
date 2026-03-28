import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuthStore } from "../../stores/authStore";

function Header() {
  const { user, logout } = useAuthStore();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <Link to="/" className="text-2xl font-bold text-numa-700">
          Numa
        </Link>

        {/* Mobile menu button */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="inline-flex items-center justify-center rounded-md p-2 text-gray-500 hover:text-gray-700 sm:hidden"
          aria-label="メニュー"
        >
          {menuOpen ? (
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-4 sm:flex">
          <Link
            to="/explore"
            className="text-gray-600 hover:text-gray-900"
          >
            探す
          </Link>

          {user ? (
            <>
              <Link
                to="/dashboard"
                className="text-gray-600 hover:text-gray-900"
              >
                ダッシュボード
              </Link>
              <Link
                to="/roadmaps/new"
                className="rounded-md bg-numa-600 px-4 py-2 text-sm font-medium text-white hover:bg-numa-700"
              >
                作成
              </Link>
              <button
                onClick={logout}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                ログアウト
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="text-gray-600 hover:text-gray-900"
              >
                ログイン
              </Link>
              <Link
                to="/signup"
                className="rounded-md bg-numa-600 px-4 py-2 text-sm font-medium text-white hover:bg-numa-700"
              >
                サインアップ
              </Link>
            </>
          )}
        </nav>
      </div>

      {/* Mobile nav */}
      {menuOpen && (
        <nav className="border-t border-gray-100 px-4 pb-4 pt-2 sm:hidden">
          <div className="flex flex-col gap-3">
            <Link
              to="/explore"
              onClick={() => setMenuOpen(false)}
              className="text-gray-600 hover:text-gray-900"
            >
              探す
            </Link>

            {user ? (
              <>
                <Link
                  to="/dashboard"
                  onClick={() => setMenuOpen(false)}
                  className="text-gray-600 hover:text-gray-900"
                >
                  ダッシュボード
                </Link>
                <Link
                  to="/roadmaps/new"
                  onClick={() => setMenuOpen(false)}
                  className="rounded-md bg-numa-600 px-4 py-2 text-center text-sm font-medium text-white hover:bg-numa-700"
                >
                  作成
                </Link>
                <button
                  onClick={() => {
                    logout();
                    setMenuOpen(false);
                  }}
                  className="text-left text-sm text-gray-500 hover:text-gray-700"
                >
                  ログアウト
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  onClick={() => setMenuOpen(false)}
                  className="text-gray-600 hover:text-gray-900"
                >
                  ログイン
                </Link>
                <Link
                  to="/signup"
                  onClick={() => setMenuOpen(false)}
                  className="rounded-md bg-numa-600 px-4 py-2 text-center text-sm font-medium text-white hover:bg-numa-700"
                >
                  サインアップ
                </Link>
              </>
            )}
          </div>
        </nav>
      )}
    </header>
  );
}

export default Header;
