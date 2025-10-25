// App.jsx
import "./styles/App.css";
import React from "react";
import { Routes, Route } from "react-router-dom";

// Context Providers
import { AuthProvider } from "./contexts/AuthContext";
import { AccountProvider } from "./contexts/AccountContext";

// Components
import ProtectedRoute from "./components/ProtectedRoute";

// Pages
import SignIn from "./pages/SignIn";
import SignUp from "./pages/SignUp";
import AccountMGMT from "./pages/admin/AccountMGMT";
import AdminMap from "./pages/admin/AdminMap";
import Dashboard from "./pages/admin/Dashboard";
import AlertMGMT from "./pages/admin/AlertMGMT";
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