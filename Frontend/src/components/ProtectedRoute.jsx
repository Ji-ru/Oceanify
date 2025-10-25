// components/ProtectedRoute.jsx
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const ProtectedRoute = ({ children, requireAdmin = false }) => {
  const { user, userRole, loading } = useAuth();

  // Show loading spinner while checking auth and role
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0C0623]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 border-4 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
          <p className="text-white">Loading...</p>
        </div>
      </div>
    );
  }

  // Not authenticated - redirect to signin
  if (!user) {
    return <Navigate to="/signin" replace />;
  }

  // Requires admin but user is not admin - redirect to dashboard
  if (requireAdmin && userRole !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  // All checks passed - render the protected component
  return children;
};

export default ProtectedRoute;