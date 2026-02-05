import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, isReady } = useAuth();
  const location = useLocation();

  if (!isReady) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "50vh" }}>
        Loading...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
