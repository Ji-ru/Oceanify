// React core
import { useState } from "react";
// Router
import { Link, useNavigate } from "react-router-dom";
// Assets / Images
import Logo from "../assets/images/oceanify.png";
import AvatarImg from "../assets/images/default_profile.jpg";
// Auth
import { useAuth } from "../contexts/AuthContext";
// Lucide Icons
import { AlertTriangle, Users, MapPin, Activity, Home, LifeBuoy } from "lucide-react";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
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

  // Consistent rescue button styles for both desktop and mobile
  const rescueButtonStyles = {
    admin: {
      className:
        "relative inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white duration-300 border-2 border-red-500 rounded-lg hover:bg-red-500 text-decoration-none",
      icon: <LifeBuoy className="w-4 h-4" />,
      text: "Rescue Management",
    },
    user: {
      className:
        "relative inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white rounded-lg bg-red-600 hover:bg-red-700 active:scale-[0.98] transition-all shadow-md hover:shadow-lg",
      icon: <LifeBuoy className="w-4 h-4" />,
      text: "Emergency Rescue",
    },
  };

  const currentRescueStyle = isAdmin
    ? rescueButtonStyles.admin
    : rescueButtonStyles.user;

  return (
    <nav className="fixed top-0 z-20 w-full bg-[#1e1e1e] shadow-xl">
      <div className="flex flex-wrap items-center justify-between max-w-screen-xl p-2 mx-auto ">
        {/* Logo */}
        <Link
          to="/dashboard"
          className="flex items-center space-x-3 text-decoration-none"
        >
          <img src={Logo} className="h-12" alt="Logo" />
          <span className="self-center text-2xl font-semibold tracking-tight text-white/95 whitespace-nowrap">
            Oceanify
          </span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex md:items-center md:gap-4 ">
          {/* Regular Navigation Links */}
          <div className="flex items-center space-x-6 ">
            {/* Dashboard */}
            <Link
              to="/dashboard"
              className="font-medium text-white duration-300 text-decoration-none hover:text-white/80 flex items-center gap-1"
            >
              <Home className="w-4 h-4" /> Dashboard
            </Link>

            {/* Users - Admin Only */}
            {isAdmin && (
              <Link
                to="/accounts-management"
                className="font-medium text-white duration-300 text-decoration-none hover:text-white/80 flex items-center gap-1"
              >
                <Users className="w-4 h-4" /> Users
              </Link>
            )}

            {/* Alerts - Admin Only */}
            {isAdmin && (
              <Link
                to="/alerts-management"
                className="font-medium text-white duration-300 text-decoration-none hover:text-white/80 flex items-center gap-1"
              >
                <AlertTriangle className="w-4 h-4" /> Alerts
              </Link>
            )}

            <Link
              to="/activity-logs"
              className="font-medium text-white duration-300 text-decoration-none hover:text-white/80 flex items-center gap-1"
            >
              <Activity className="w-4 h-4" /> Activity Logs
            </Link>

            {/* Maps */}
            <Link
              to="/map"
              className="font-medium text-white duration-300 text-decoration-none hover:text-white/80 flex items-center gap-1"
            >
              <MapPin className="w-4 h-4" /> Maps
            </Link>
          </div>

          {/* CRITICAL: Rescue Button - Consistent styling */}
          <div className="relative flex items-center gap-4 pl-4 ">
            <Link
              to={isAdmin ? "/rescue-management" : "/rescue"}
              className={currentRescueStyle.className}
              aria-label={currentRescueStyle.text}
            >
              {currentRescueStyle.icon}
              <span>{currentRescueStyle.text}</span>
            </Link>
          </div>

          {/* Role Badge & Profile Menu */}
          <div className="flex items-center gap-3 pl-4 ml-4 border-l border-gray-600">
            {/* Profile Avatar with dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsProfileOpen((v) => !v)}
                className="flex items-center justify-center w-10 h-10 overflow-hidden transition-all hover:scale-110"
              >
                <img
                  src={AvatarImg}
                  alt="Profile"
                  className="object-cover w-full h-full rounded-full"
                />
              </button>

              {isProfileOpen && (
                <div className="absolute right-0 z-30 w-44 mt-4 overflow-hidden bg-[#1f1f1f] border border-gray-700 rounded-lg shadow-xl">
                  <Link
                    to="/profile"
                    onClick={() => setIsProfileOpen(false)}
                    className="block px-4 py-2 text-sm text-white hover:bg-[#2a2a2a] text-decoration-none"
                  >
                    View Profile
                  </Link>
                  <button
                    onClick={async () => {
                      setIsProfileOpen(false);
                      await handleLogout();
                    }}
                    className="block w-full px-4 py-2 text-left text-sm text-red-300 hover:bg-[#2a2a2a]"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>

            {/* Role Badge */}
            {userRole && (
              <span
                className={`px-2 py-1 text-xs font-semibold rounded ${
                  isAdmin
                    ? "bg-purple-600 text-white"
                    : "bg-blue-600 text-white"
                }`}
              >
                {userRole.toUpperCase()}
              </span>
            )}
          </div>
        </div>

        {/* Mobile toggle */}
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="inline-flex items-center justify-center w-10 h-10 p-2 text-gray-500 rounded-lg md:hidden focus:outline-none dark:text-gray-400 "
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
        <div className="p-4 md:hidden bg-[#1f1f1f]">
          {/* CRITICAL: Mobile Rescue Button - Consistent styling */}
          <Link
            to={isAdmin ? "/rescue-management" : "/rescue"}
            className={`flex items-center gap-3 px-4 py-3 mb-3 text-sm font-bold text-white transition-all duration-300 rounded-lg shadow-lg  group ${
              isAdmin
                ? "border-2 border-red-500 hover:bg-red-500 duration-300"
                : "border-2 border-red-500 hover:bg-red-500 duration-300"
            }`}
          >
            <LifeBuoy className="w-5 h-5 transition-transform duration-300 group-hover:scale-110" />
            <div className="flex flex-col">
              <span className="text-base font-black text-decoration-none">
                {isAdmin ? "Rescue Management" : "Rescue Management"}
              </span>
            </div>
          </Link>

          {/* Divider */}
          <div className="mb-3 border-t border-gray-600"></div>

          {/* Regular Navigation Links */}
          <Link
            to="/dashboard"
            className="block py-2 text-white text-decoration-none flex items-center gap-1"
            onClick={() => setIsOpen(false)}
          >
            <Home className="w-4 h-4" /> Dashboard
          </Link>

          {isAdmin && (
            <Link
              to="/accounts-management"
              className="block py-2 text-white text-decoration-none flex items-center gap-1"
              onClick={() => setIsOpen(false)}
            >
              <Users className="w-4 h-4" /> Users
            </Link>
          )}

          <Link
            to="/map"
            className="block py-2 text-white text-decoration-none flex items-center gap-1"
            onClick={() => setIsOpen(false)}
          >
            <MapPin className="w-4 h-4" /> Maps
          </Link>

          {isAdmin && (
            <Link
              to="/alerts-management"
              className="block py-2 text-white text-decoration-none flex items-center gap-1"
              onClick={() => setIsOpen(false)}
            >
              <AlertTriangle className="w-4 h-4" /> Alerts
            </Link>
          )}

          {/* Divider */}
          <div className="my-2 border-t border-gray-600"></div>

          {/* Role Badge */}
          {userRole && (
            <div className="py-2">
              <span
                className={`px-2 py-1 text-[10px] font-semibold rounded tracking-wide ${
                  isAdmin
                    ? "bg-purple-600/90 text-white"
                    : "bg-blue-600/90 text-white"
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
