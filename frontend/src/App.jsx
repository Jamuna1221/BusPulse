import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { GoogleOAuthProvider } from "@react-oauth/google";

// User Auth
import { UserAuthProvider } from "./context/UserAuthContext";
import UserProtectedRoute from "./components/UserProtectedRoute";
import UserLogin from "./pages/UserLogin";

// Landing Page
import LandingPage from "./pages/LandingPage";

// User flow
import UserFlow from "./pages/UserFlow";

// User Dashboard
import UserDashboardLayout from "./pages/dashboard/UserDashboardLayout";
import UserOverview from "./pages/dashboard/UserOverview";
import UserSavedPlaces from "./pages/dashboard/UserSavedPlaces";
import UserActivity from "./pages/dashboard/UserActivity";
import UserProfile from "./pages/dashboard/UserProfile";

// SCHEDULER
import SchedulerLogin from "./pages/SchedulerLogin";
import SchedulerProtectedRoute from "./components/SchedulerProtectedRoute";
import SchedulerLayout from "./pages/scheduler/SchedulerLayout";
import SchedulerDashboard from "./pages/scheduler/SchedulerDashboard";
import SchedulerBusManagement from "./pages/scheduler/BusManagement";
import SchedulerRouteManagement from "./pages/scheduler/RouteManagement";
import ScheduleManagement from "./pages/scheduler/ScheduleManagement";
import DriverManagement from "./pages/scheduler/DriverManagement";
import ReportsAnalytics from "./pages/scheduler/ReportsAnalytics";
import SchedulerNotifications from "./pages/scheduler/Notifications";
import ActivityLogs from "./pages/scheduler/ActivityLogs";
import SchedulerSearchPage from "./pages/scheduler/SearchPage";
import ProfileSecurity from "./pages/scheduler/ProfileSecurity";

// ADMIN - Authentication
import AdminLogin from "./pages/admin/AdminLogin";
import ProtectedRoute from "./components/ProtectedRoute";

// ADMIN - Layout and Pages
import AdminLayout from "./pages/admin/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import Users from "./pages/admin/Users";
import Devices from "./pages/admin/Devices";
import BusManagement from "./pages/admin/BusManagement";
import Analytics from "./pages/admin/Analytics";
import Alerts from "./pages/admin/Alerts";
import IncidentManagement from "./pages/admin/IncidentManagement";
import Feedback from "./pages/admin/Feedback";
import Reports from "./pages/admin/Reports";
import Settings from "./pages/admin/Settings";
import BusSchedulers from "./pages/admin/busSchedulers";
import VerifyEmail from "./pages/VerifyEmail";

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";
const GOOGLE_ENABLED = Boolean(GOOGLE_CLIENT_ID && GOOGLE_CLIENT_ID.length > 10);

function App() {
  const content = (
    <UserAuthProvider>
      <BrowserRouter>
        <Routes>
          {/* ==================== PUBLIC LANDING ==================== */}
          <Route path="/" element={<LandingPage />} />

          {/* ==================== USER AUTH ==================== */}
          <Route path="/user/login" element={<UserLogin />} />

          {/* ==================== USER ROUTES (Protected) ==================== */}
          <Route
            path="/home"
            element={
              <UserProtectedRoute>
                <UserFlow />
              </UserProtectedRoute>
            }
          />

          {/* ==================== USER DASHBOARD (Protected) ==================== */}
          <Route
            path="/user/dashboard"
            element={
              <UserProtectedRoute>
                <UserDashboardLayout />
              </UserProtectedRoute>
            }
          >
            <Route index element={<Navigate to="overview" replace />} />
            <Route path="overview" element={<UserOverview />} />
            <Route path="places" element={<UserSavedPlaces />} />
            <Route path="activity" element={<UserActivity />} />
            <Route path="profile" element={<UserProfile />} />
          </Route>

          {/* ==================== SCHEDULER ROUTES ==================== */}
          <Route path="/login" element={<SchedulerLogin />} />
          <Route
            path="/scheduler"
            element={
              <SchedulerProtectedRoute>
                <SchedulerLayout />
              </SchedulerProtectedRoute>
            }
          >
            <Route path="dashboard" element={<SchedulerDashboard />} />
            <Route path="buses" element={<SchedulerBusManagement />} />
            <Route path="routes" element={<SchedulerRouteManagement />} />
            <Route path="schedules" element={<ScheduleManagement />} />
            <Route path="drivers" element={<DriverManagement />} />
            <Route path="reports" element={<ReportsAnalytics />} />
            <Route path="notifications" element={<SchedulerNotifications />} />
            <Route path="activity" element={<ActivityLogs />} />
            <Route path="search" element={<SchedulerSearchPage />} />
            <Route path="profile" element={<ProfileSecurity />} />
          </Route>

          {/* ==================== ADMIN ROUTES (Protected) ==================== */}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="users" element={<Users />} />
            <Route path="/admin/schedulers" element={<BusSchedulers />} />
            <Route path="devices" element={<Devices />} />
            <Route path="bus-management" element={<BusManagement />} />
            <Route path="analytics" element={<Analytics />} />
            <Route path="alerts" element={<Alerts />} />
            <Route path="incidents" element={<IncidentManagement />} />
            <Route path="feedback" element={<Feedback />} />
            <Route path="reports" element={<Reports />} />
            <Route path="settings" element={<Settings />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </UserAuthProvider>
  );

  return GOOGLE_ENABLED
    ? <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>{content}</GoogleOAuthProvider>
    : content;
}

export default App;