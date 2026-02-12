import { BrowserRouter, Routes, Route } from "react-router-dom";

// EXISTING user flow (unchanged)
import UserFlow from "./pages/UserFlow";

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

// USER AUTH (commented out as per your original)
//import UserSignup from "./pages/UserSignup";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* ==================== USER ROUTES (Unchanged) ==================== */}
        {/* User main flow */}
        <Route path="/" element={<UserFlow />} />

        {/* User auth - Uncomment when needed
        <Route path="/signup" element={<UserSignup />} />
        */}

        {/* ==================== ADMIN ROUTES (Protected) ==================== */}
        
        {/* Admin Login - Public Route */}
        <Route path="/admin/login" element={<AdminLogin />} />

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