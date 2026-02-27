import { BrowserRouter, Routes, Route } from "react-router-dom";

// user flow
import UserFlow from "./pages/UserFlow";

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
// USER AUTH (commented out as per your original)
//import UserSignup from "./pages/UserSignup";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* ==================== USER ROUTES (Unchanged) ==================== */}
        {/* User main flow */}
        <Route path="/" element={<UserFlow />} />

        {/* Scheduler Login */}
        <Route path="/login" element={<SchedulerLogin />} />

        {/* User auth - Uncomment when needed
        <Route path="/signup" element={<UserSignup />} />
        */}

        {/* ==================== SCHEDULER ROUTES (Protected) ==================== */}
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
        
        {/* Admin Login - Public Route */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
        {/* Admin Dashboard - Protected Routes */}
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
  );
}

export default App;