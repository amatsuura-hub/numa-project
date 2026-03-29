import { lazy, Suspense } from "react";
import { Routes, Route } from "react-router-dom";
import Layout from "./components/layout/Layout";
import TopPage from "./pages/TopPage";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import ExplorePage from "./pages/ExplorePage";
import NotFoundPage from "./pages/NotFoundPage";
import AuthGuard from "./components/common/AuthGuard";

const DashboardPage = lazy(() => import("./pages/DashboardPage"));
const RoadmapDetailPage = lazy(() => import("./pages/RoadmapDetailPage"));
const RoadmapEditPage = lazy(() => import("./pages/RoadmapEditPage"));
const ProfilePage = lazy(() => import("./pages/ProfilePage"));
const UserPage = lazy(() => import("./pages/UserPage"));

function LazyFallback() {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-numa-600 border-t-transparent" />
    </div>
  );
}

function App() {
  return (
    <Suspense fallback={<LazyFallback />}>
      <Routes>
        <Route element={<Layout />}>
          {/* Public routes */}
          <Route path="/" element={<TopPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/explore" element={<ExplorePage />} />
          <Route path="/roadmaps/:id" element={<RoadmapDetailPage />} />
          <Route path="/users/:id" element={<UserPage />} />

          {/* Protected routes */}
          <Route element={<AuthGuard />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/roadmaps/new" element={<RoadmapEditPage />} />
            <Route path="/roadmaps/:id/edit" element={<RoadmapEditPage />} />
            <Route path="/profile" element={<ProfilePage />} />
          </Route>

          {/* 404 */}
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </Suspense>
  );
}

export default App;
