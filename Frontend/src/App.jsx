// App.jsx
import { Route, Routes } from "react-router-dom";
import "./styles/App.css";

// Context Providers
import { AccountProvider } from "./contexts/AccountContext";
import { AuthProvider } from "./contexts/AuthContext";

// Components
import ProtectedRoute from "./components/ProtectedRoute";

// Pages
import SignIn from "./pages/SignIn";
import SignUp from "./pages/SignUp";
import AccountMGMT from "./pages/admin/AccountMGMT";
import AdminMap from "./pages/admin/AdminMap";
import AdminRescueManagement from "./pages/admin/AdminRescueManagement"; // ← ADD THIS
import AlertMGMT from "./pages/admin/AlertMGMT";
import Dashboard from "./pages/admin/Dashboard";
import RescueButton from "./pages/user/RescueButton";
import UserMap from "./pages/user/UserMap";

function App() {
  return (
    <AuthProvider>
      <AccountProvider>
        <Routes>
          {/* -----------------------------
              Default Route
          ----------------------------- */}
          <Route path="/" element={<SignIn />} />

          {/* -----------------------------
              Public Pages
          ----------------------------- */}
          <Route path="/signin" element={<SignIn />} />
          <Route path="/signup" element={<SignUp />} />

          {/* -----------------------------
              Protected Pages - All Authenticated Users
          ----------------------------- */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/map"
            element={
              <ProtectedRoute>
                <AdminMap />
              </ProtectedRoute>
            }
          />
          
          {/* 🆘 USER RESCUE PAGE */}
          <Route
            path="/rescue"
            element={
              <ProtectedRoute>
                <RescueButton />
              </ProtectedRoute>
            }
          />

          {/* -----------------------------
              Protected Pages - Admin Only
          ----------------------------- */}
          <Route
            path="/accounts-management"
            element={
              <ProtectedRoute requireAdmin={true}>
                <AccountMGMT />
              </ProtectedRoute>
            }
          />
          <Route
            path="/alerts-management"
            element={
              <ProtectedRoute requireAdmin={true}>
                <AlertMGMT />
              </ProtectedRoute>
            }
          />
          
          {/* 🚨 ADMIN RESCUE MANAGEMENT PAGE - ADD THIS */}
          <Route
            path="/rescue-management"
            element={
              <ProtectedRoute requireAdmin={true}>
                <AdminRescueManagement />
              </ProtectedRoute>
            }
          />

          {/* -----------------------------
              Internal / User Page
          ----------------------------- */}
          <Route
            path="/user/home"
            element={
              <ProtectedRoute>
                <UserMap />
              </ProtectedRoute>
            }
          />

          {/* -----------------------------
              Catch-all Route
              Redirect unknown paths to SignIn
          ----------------------------- */}
          <Route path="*" element={<SignIn />} />
        </Routes>
      </AccountProvider>
    </AuthProvider>
  );
}

export default App;