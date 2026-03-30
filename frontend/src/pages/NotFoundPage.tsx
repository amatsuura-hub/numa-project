import { Link } from "react-router-dom";

function NotFoundPage() {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      {/* Playful 404 */}
      <div className="mb-4 text-numa-200">
        <svg width="80" height="80" viewBox="0 0 100 100" fill="currentColor">
          <path d="M30 70c0-20 10-35 20-40 10 5 20 20 20 40-5 5-15 8-20 8s-15-3-20-8zm-8-38c-5-5-3-15 3-18s15 0 15 8c0 5-3 8-8 8-4 0-8-1-10 2zm56 0c5-5 3-15-3-18s-15 0-15 8c0 5 3 8 8 8 4 0 8-1 10 2z" />
          <circle cx="35" cy="35" r="4" />
          <circle cx="65" cy="35" r="4" />
        </svg>
      </div>
      <h1 className="mb-2 text-6xl font-bold text-numa-200">404</h1>
      <p className="mb-2 text-lg text-gray-500">
        この沼は見つかりませんでした
      </p>
      <p className="mb-6 text-sm text-gray-400">
        お探しのページは存在しないか、移動した可能性があります。
      </p>
      <Link
        to="/"
        className="rounded-md bg-numa-600 px-6 py-2 text-sm font-medium text-white hover:bg-numa-700"
      >
        トップページへ戻る
      </Link>
    </div>
  );
}

export default NotFoundPage;
