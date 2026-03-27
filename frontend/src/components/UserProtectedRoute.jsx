import { Navigate } from "react-router-dom";
import { useUserAuth } from "../context/UserAuthContext";

/**
 * Wraps any route that requires a logged-in USER.
 * Redirects to /user/login if not authenticated.
 */
export default function UserProtectedRoute({ children }) {
  const { token } = useUserAuth();
  if (!token) return <Navigate to="/user/login" replace />;
  return children;
}
