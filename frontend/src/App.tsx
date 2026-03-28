import { Routes, Route } from "react-router-dom";
import Layout from "./components/layout/Layout";
import TopPage from "./pages/TopPage";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import DashboardPage from "./pages/DashboardPage";
import ExplorePage from "./pages/ExplorePage";
import RoadmapDetailPage from "./pages/RoadmapDetailPage";
import RoadmapEditPage from "./pages/RoadmapEditPage";
import ProfilePage from "./pages/ProfilePage";
import UserPage from "./pages/UserPage";
import NotFoundPage from "./pages/NotFoundPage";
import AuthGuard from "./components/common/AuthGuard";

function App() {
  return (
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
  );
}

export default App;
