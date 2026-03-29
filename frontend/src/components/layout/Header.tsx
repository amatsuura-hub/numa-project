import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuthStore } from "../../stores/authStore";

function Header() {
  const { user, logout } = useAuthStore();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="border-b border-[rgba(90,70,40,.1)] bg-numa-bg">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-8 py-3.5">
        <Link to="/" className="font-serif text-2xl font-black text-numa-brown tracking-[1px]">
          Numa
        </Link>

        {/* Mobile menu button */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="inline-flex items-center justify-center rounded-md p-2 text-numa-text-muted hover:text-numa-text sm:hidden"
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
        <nav className="hidden items-center gap-5 sm:flex text-[13px] text-numa-text-muted">
          <Link to="/explore" className="hover:text-numa-brown">
            探す
          </Link>

          {user ? (
            <>
              <Link to="/dashboard" className="hover:text-numa-brown">
                ダッシュボード
              </Link>
              <Link to="/profile" className="hover:text-numa-brown">
                プロフィール
              </Link>
              <Link
                to="/roadmaps/new"
                className="bg-swamp-700 text-green-50 rounded px-5 py-1.5 text-sm font-semibold hover:bg-swamp-800 transition"
              >
                作成
              </Link>
              <button
                onClick={logout}
                className="text-numa-text-hint hover:text-numa-brown"
              >
                ログアウト
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="hover:text-numa-brown">
                ログイン
              </Link>
              <Link
                to="/signup"
                className="bg-swamp-700 text-green-50 rounded px-5 py-1.5 text-sm font-semibold hover:bg-swamp-800 transition"
              >
                はじめる
              </Link>
            </>
          )}
        </nav>
      </div>

      {/* Mobile nav */}
      {menuOpen && (
        <nav className="border-t border-[rgba(90,70,40,.08)] px-8 pb-4 pt-2 sm:hidden">
          <div className="flex flex-col gap-3 text-[13px] text-numa-text-muted">
            <Link to="/explore" onClick={() => setMenuOpen(false)} className="hover:text-numa-brown">
              探す
            </Link>

            {user ? (
              <>
                <Link to="/dashboard" onClick={() => setMenuOpen(false)} className="hover:text-numa-brown">
                  ダッシュボード
                </Link>
                <Link to="/profile" onClick={() => setMenuOpen(false)} className="hover:text-numa-brown">
                  プロフィール
                </Link>
                <Link
                  to="/roadmaps/new"
                  onClick={() => setMenuOpen(false)}
                  className="bg-swamp-700 text-green-50 rounded px-5 py-1.5 text-center text-sm font-semibold hover:bg-swamp-800 transition"
                >
                  作成
                </Link>
                <button
                  onClick={() => { logout(); setMenuOpen(false); }}
                  className="text-left text-numa-text-hint hover:text-numa-brown"
                >
                  ログアウト
                </button>
              </>
            ) : (
              <>
                <Link to="/login" onClick={() => setMenuOpen(false)} className="hover:text-numa-brown">
                  ログイン
                </Link>
                <Link
                  to="/signup"
                  onClick={() => setMenuOpen(false)}
                  className="bg-swamp-700 text-green-50 rounded px-5 py-1.5 text-center text-sm font-semibold hover:bg-swamp-800 transition"
                >
                  はじめる
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
