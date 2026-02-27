import { Navigate } from "react-router-dom";

const SchedulerProtectedRoute = ({ children }) => {
  const token = localStorage.getItem("token");

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default SchedulerProtectedRoute;
