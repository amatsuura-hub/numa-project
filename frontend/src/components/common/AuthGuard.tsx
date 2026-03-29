import { Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "../../stores/authStore";
import LoadingSpinner from "./LoadingSpinner";

function AuthGuard() {
  const { user, isLoading } = useAuthStore();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}

export default AuthGuard;
