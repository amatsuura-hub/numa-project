import { Link } from "react-router-dom";

function NotFoundPage() {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <h1 className="mb-2 text-6xl font-bold text-gray-300">404</h1>
      <p className="mb-6 text-lg text-gray-500">
        ページが見つかりませんでした
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
