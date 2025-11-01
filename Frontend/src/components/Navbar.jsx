// React core
import { useState } from "react";
// Router
import { Link, useNavigate } from "react-router-dom";
// Assets / Images
import Logo from "../assets/images/oceanify.png";
// Auth
import { useAuth } from "../contexts/AuthContext";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const { userRole, signOut, isAdmin } = useAuth();

  const handleLogout = async () => {
    try {
      await signOut();
      navigate("/signin");
    } catch (error) {
      console.error("Error signing out:", error);
      navigate("/signin");
    }
  };

  return (
    <nav className="fixed top-0 z-20 w-full bg-[#1e1e1e]">
      <div className="flex flex-wrap items-center justify-between max-w-screen-xl p-2 mx-auto">
        {/* Logo */}
        <Link to="/dashboard" className="flex items-center space-x-3">
          <img src={Logo} className="h-12" alt="Logo" />
          <span className="self-center text-2xl font-semibold text-white whitespace-nowrap">
            Oceanify
          </span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex md:items-center md:gap-4">
          {/* Regular Navigation Links */}
          <div className="flex items-center space-x-6">
            {/* Dashboard */}
            <Link
              to="/dashboard"
              className="text-white duration-300 hover:text-blue-700"
            >
              Dashboard
            </Link>

            {/* Users - Admin Only */}
            {isAdmin && (
              <Link
                to="/accounts-management"
                className="text-white duration-300 hover:text-blue-700"
              >
                Users
              </Link>
            )}

            {/* Alerts - Admin Only */}
            {isAdmin && (
              <Link
                to="/alerts-management"
                className="text-white duration-300 hover:text-blue-700"
              >
                Alerts
              </Link>
            )}

            {/* Maps */}
            <Link
              to="/map"
              className="text-white duration-300 hover:text-blue-700"
            >
              Maps
            </Link>
          </div>

          {/* CRITICAL: Rescue Button - Different for Admin vs User */}
          <div className="relative flex items-center gap-4 pl-4 ml-4 border-l-2 border-red-500/30">
            {/* Pulsing Alert Indicator */}
            <div className="absolute flex w-3 h-3 -left-1.5">
              <span className="absolute inline-flex w-full h-full bg-red-500 rounded-full opacity-75 animate-ping"></span>
              <span className="relative inline-flex w-3 h-3 bg-red-600 rounded-full"></span>
            </div>

            {isAdmin ? (
              // Admin: Rescue Management Button
              <Link
                to="/rescue-management"
                className="relative flex items-center gap-3 px-5 py-2.5 text-base font-bold text-white transition-all duration-300 border-2 border-orange-500 shadow-2xl bg-gradient-to-r from-orange-600 via-orange-700 to-red-700 rounded-xl hover:from-orange-700 hover:via-orange-800 hover:to-red-800 hover:scale-110 hover:shadow-orange-500/60 animate-pulse group"
              >
                {/* Icon with rotation animation */}
                <span className="text-2xl transition-transform duration-300 group-hover:rotate-12 group-hover:scale-125">
                  🚨
                </span>
                
                {/* Text with emphasis */}
                <div className="flex flex-col items-start">
                  <span className="text-xs font-semibold tracking-wider text-orange-200 uppercase">
                    Manage
                  </span>
                  <span className="text-sm font-black tracking-wide">
                    RESCUES
                  </span>
                </div>

                {/* Urgency stripe animation */}
                <div className="absolute inset-0 overflow-hidden rounded-xl opacity-20">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent animate-shimmer"></div>
                </div>
              </Link>
            ) : (
              // User: Emergency Rescue Button
              <Link
                to="/rescue"
                className="relative flex items-center gap-3 px-5 py-2.5 text-base font-bold text-white transition-all duration-300 border-2 border-red-500 shadow-2xl bg-gradient-to-r from-red-600 via-red-700 to-red-800 rounded-xl hover:from-red-700 hover:via-red-800 hover:to-red-900 hover:scale-110 hover:shadow-red-500/60 animate-pulse group"
              >
                {/* Icon with rotation animation */}
                <span className="text-2xl transition-transform duration-300 group-hover:rotate-12 group-hover:scale-125">
                  🆘
                </span>
                
                {/* Text with emphasis */}
                <div className="flex flex-col items-start">
                  <span className="text-xs font-semibold tracking-wider text-red-200 uppercase">
                    Emergency
                  </span>
                  <span className="text-sm font-black tracking-wide">
                    RESCUE
                  </span>
                </div>

                {/* Urgency stripe animation */}
                <div className="absolute inset-0 overflow-hidden rounded-xl opacity-20">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent animate-shimmer"></div>
                </div>
              </Link>
            )}
          </div>

          {/* Role Badge & Logout - Separated */}
          <div className="flex items-center gap-3 pl-4 ml-4 border-l border-gray-600">
            {/* Role Badge */}
            {userRole && (
              <span
                className={`px-2 py-1 text-xs font-semibold rounded ${
                  isAdmin ? "bg-purple-600 text-white" : "bg-blue-600 text-white"
                }`}
              >
                {userRole.toUpperCase()}
              </span>
            )}

            <button
              onClick={handleLogout}
              className="px-3 py-1 text-white duration-300 bg-gray-700 rounded hover:bg-gray-800"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Mobile toggle */}
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="inline-flex items-center justify-center w-10 h-10 p-2 text-gray-500 rounded-lg md:hidden hover:bg-gray-100 focus:outline-none dark:text-gray-400 dark:hover:bg-gray-700"
        >
          <span className="sr-only">Open main menu</span>
          <svg
            className="w-5 h-5"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 17 14"
          >
            <path
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M1 1h15M1 7h15M1 13h15"
            />
          </svg>
        </button>
      </div>

      {/* Mobile menu */}
      {isOpen && (
        <div className="p-4 md:hidden bg-gray-50 dark:bg-gray-800">
          {/* CRITICAL: Mobile Rescue Button - Different for Admin vs User */}
          {isAdmin ? (
            // Admin: Rescue Management
            <Link
              to="/rescue-management"
              className="relative flex items-center gap-3 px-4 py-3 mb-3 text-sm font-bold text-white transition-all duration-300 border-2 border-orange-500 shadow-lg bg-gradient-to-r from-orange-600 to-red-600 rounded-lg hover:scale-105 animate-pulse group"
            >
              {/* Pulsing indicator */}
              <div className="absolute flex w-2 h-2 -left-1 top-1/2 -translate-y-1/2">
                <span className="absolute inline-flex w-full h-full bg-orange-400 rounded-full opacity-75 animate-ping"></span>
                <span className="relative inline-flex w-2 h-2 bg-orange-500 rounded-full"></span>
              </div>

              <span className="text-xl transition-transform duration-300 group-hover:scale-110">
                🚨
              </span>
              <div className="flex flex-col">
                <span className="text-xs tracking-wider text-orange-200 uppercase">Manage</span>
                <span className="text-base font-black">RESCUES</span>
              </div>
            </Link>
          ) : (
            // User: Emergency Rescue
            <Link
              to="/rescue"
              className="relative flex items-center gap-3 px-4 py-3 mb-3 text-sm font-bold text-white transition-all duration-300 border-2 border-red-500 shadow-lg bg-gradient-to-r from-red-600 to-red-700 rounded-lg hover:scale-105 animate-pulse group"
            >
              {/* Pulsing indicator */}
              <div className="absolute flex w-2 h-2 -left-1 top-1/2 -translate-y-1/2">
                <span className="absolute inline-flex w-full h-full bg-red-400 rounded-full opacity-75 animate-ping"></span>
                <span className="relative inline-flex w-2 h-2 bg-red-500 rounded-full"></span>
              </div>

              <span className="text-xl transition-transform duration-300 group-hover:scale-110">
                🆘
              </span>
              <div className="flex flex-col">
                <span className="text-xs tracking-wider text-red-200 uppercase">Emergency</span>
                <span className="text-base font-black">RESCUE</span>
              </div>
            </Link>
          )}

          {/* Divider */}
          <div className="mb-3 border-t border-gray-600"></div>

          {/* Regular Navigation Links */}
          <Link
            to="/dashboard"
            className="block py-2 text-gray-900 hover:text-blue-700 dark:text-white"
          >
            Dashboard
          </Link>

          {isAdmin && (
            <Link
              to="/accounts-management"
              className="block py-2 text-gray-900 hover:text-blue-700 dark:text-white"
            >
              Users
            </Link>
          )}

          <Link
            to="/map"
            className="block py-2 text-gray-900 hover:text-blue-700 dark:text-white"
          >
            Maps
          </Link>

          {isAdmin && (
            <Link
              to="/alerts-management"
              className="block py-2 text-gray-900 hover:text-blue-700 dark:text-white"
            >
              Alerts
            </Link>
          )}

          {/* Divider */}
          <div className="my-4 border-t border-gray-600"></div>

          {/* Role Badge */}
          {userRole && (
            <div className="py-2">
              <span
                className={`px-2 py-1 text-xs font-semibold rounded ${
                  isAdmin
                    ? "bg-purple-600 text-white"
                    : "bg-blue-600 text-white"
                }`}
              >
                {userRole.toUpperCase()}
              </span>
            </div>
          )}

          <button
            onClick={handleLogout}
            className="block w-full py-2 mt-2 text-white bg-gray-700 rounded hover:bg-gray-800"
          >
            Logout
          </button>
        </div>
      )}

      {/* Add custom animation keyframes */}
      <style jsx>{`
        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }
        .animate-shimmer {
          animation: shimmer 2s infinite;
        }
      `}</style>
    </nav>
  );
};

export default Navbar;