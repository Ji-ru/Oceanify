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
import Dashboard from "./pages/webapp/Dashboard";
import Profile from "./pages/webapp/Profile";
import RescueButton from "./components/RescueButton";
import LandingPage from "./pages/weblanding/LandingPage";

function App() {
  return (
    <AuthProvider>
      <AccountProvider>
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
        </Routes>
      </AccountProvider>
    </AuthProvider>
  );
}

export default App;
