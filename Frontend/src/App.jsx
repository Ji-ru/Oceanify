// App.jsx
import { Route, Routes } from "react-router-dom";
import "./styles/App.css";

// Context Providers
import { AccountProvider } from "./contexts/AccountContext";
import { AuthProvider } from "./contexts/AuthContext";

// Components
import ProtectedRoute from "./components/ProtectedRoute";

// Pages
import SignIn from "./pages/webapp/SignIn";
import SignUp from "./pages/webapp/SignUp";
import AccountManagement from "./pages/webapp/AccountManagement";
import Map from "./pages/webapp/Map";
import RescueManagement from "./pages/webapp/RescueManagement";
import AlertManagement from "./pages/webapp/AlertManagement";
import ActivityLogs from "./pages/webapp/ActivityLogs";
import Dashboard from "./pages/webapp/Dashboard";
import Profile from "./pages/webapp/Profile";
import RescueButton from "./pages/webapp/EmergencyRescue";
import LandingPage from "./pages/weblanding/LandingPage";
import { AlertProvider } from './contexts/AlertContext';
import { ActivityLogProvider } from './contexts/ActivityLogContext';

function App() {
  return (
    <AuthProvider>
      <AccountProvider>
        <AlertProvider>
          <ActivityLogProvider>
            <Routes>
              {/* -----------------------------
                  Default Route
              ----------------------------- */}
              <Route path="/" element={<LandingPage />} />

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
                    <Map />
                  </ProtectedRoute>
                }
              />

              {/* SOS USER RESCUE PAGE */}
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
                    <AccountManagement />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/alerts-management"
                element={
                  <ProtectedRoute requireAdmin={true}>
                    <AlertManagement />
                  </ProtectedRoute>
                }
              />

              {/* 🚨 ADMIN RESCUE MANAGEMENT PAGE - ADD THIS */}
              <Route
                path="/rescue-management"
                element={
                  <ProtectedRoute requireAdmin={true}>
                    <RescueManagement />
                  </ProtectedRoute>
                }
              />

              {/* -----------------------------
                  Admin and User Page
              ----------------------------- */}
              {/* PROFILE PAGE */}

              <Route path="/profile" element={<Profile />} />

              {/* -----------------------------
                  Catch-all Route
                  Redirect unknown paths to SignIn
              ----------------------------- */}
              <Route path="*" element={<SignIn />} />

              <Route
                path="/activity-logs"
                element={
                  <ProtectedRoute requireAdmin={true}>
                    <ActivityLogs />
                  </ProtectedRoute>
                }
              />
            </Routes>
          </ActivityLogProvider>
        </AlertProvider>
      </AccountProvider>
    </AuthProvider>
  );
}

export default App;
