import { useAuthStore } from "@/stores/useAuthStores";
import { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router";

const ProtectedRoute = () => {
  const {
    accessToken,
    user,
    loading,
    refresh,
    fetchMe,
  } = useAuthStore();

  const [start, setStart] = useState(true);

  useEffect(() => {
    const init = async () => {
      try {
        if (!accessToken) {
          await refresh();
        }

        if (accessToken && !user) {
          await fetchMe();
        }
      } finally {
        setStart(false);
      }
    };

    init();
  }, []);

  if (start || loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        Loading...
      </div>
    );
  }

  if (!accessToken) {
    return <Navigate to="/signin" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;