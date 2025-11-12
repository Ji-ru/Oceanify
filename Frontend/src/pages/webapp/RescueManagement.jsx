// React core
import { useEffect, useState } from "react";
// Components
import Navbar from "../../components/Navbar";
// Database
import supabase from "../../supabaseClient";
// Icons
import {
  AlertTriangle,
  CheckCircle,
  Trash2,
  MapPin,
  Clock,
  Eye,
  X,
  Navigation,
  Waves,
  Wind,
  Thermometer,
  Droplets,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
/**
 * Admin Rescue Management - Emergency rescue request monitoring and response interface
 * Provides real-time monitoring, acknowledgment, and management of rescue requests
 */

export default function AdminRescueManagement() {
  const [rescueRequests, setRescueRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [selectedRequest, setSelectedRequest] = useState(null);

  // Pagination States
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  // Load rescue requests from Supabase
  useEffect(() => {
    loadRescueRequests();

    // Subscribe to real-time changes
    const channel = supabase
      .channel("rescue_requests_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "rescue_requests",
        },
        (payload) => {
          console.log("Real-time update:", payload);
          loadRescueRequests(); // Reload data when changes occur
        }
      )
      .subscribe();

    // Cleanup subscription
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadRescueRequests = async () => {
    try {
      const { data, error } = await supabase
        .from("rescue_requests")
        .select("*")
        .order("timestamp", { ascending: false });

      if (error) throw error;

      setRescueRequests(data || []);
      setLoading(false);
    } catch (err) {
      console.error("Failed to load rescue requests:", err);
      setLoading(false);
    }
  };

  const handleAcknowledge = async (requestId) => {
    try {
      const { error } = await supabase
        .from("rescue_requests")
        .update({
          status: "acknowledged",
          acknowledged_at: new Date().toISOString(),
          read: true,
        })
        .eq("id", requestId);

      if (error) throw error;

      // Update local state
      setRescueRequests((prev) =>
        prev.map((req) =>
          req.id === requestId
            ? {
                ...req,
                status: "acknowledged",
                acknowledged_at: new Date().toISOString(),
                read: true,
              }
            : req
        )
      );

      // Close modal if open
      if (selectedRequest?.id === requestId) {
        setSelectedRequest(null);
      }
    } catch (err) {
      console.error("Failed to acknowledge request:", err);
      alert("Failed to acknowledge request. Please try again.");
    }
  };

  const handleDelete = async (requestId) => {
    if (!confirm("Are you sure you want to delete this rescue request?")) {
      return;
    }

    try {
      const { error } = await supabase
        .from("rescue_requests")
        .delete()
        .eq("id", requestId);

      if (error) throw error;

      // Update local state
      setRescueRequests((prev) => prev.filter((req) => req.id !== requestId));

      if (selectedRequest?.id === requestId) {
        setSelectedRequest(null);
      }
    } catch (err) {
      console.error("Failed to delete request:", err);
      alert("Failed to delete request. Please try again.");
    }
  };

  // Filter requests based on status
  const filteredRequests = rescueRequests.filter((req) => {
    if (filter === "all") return true;
    if (filter === "pending") return req.status === "pending";
    if (filter === "acknowledged") return req.status === "acknowledged";
    return true;
  });

  // Pagination calculations
  const totalPages = Math.ceil(filteredRequests.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentRequests = filteredRequests.slice(startIndex, endIndex);

  // Reset to page 1 when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [filter]);

  // Get counts for each status
  const pendingCount = rescueRequests.filter(
    (r) => r.status === "pending"
  ).length;
  const acknowledgedCount = rescueRequests.filter(
    (r) => r.status === "acknowledged"
  ).length;

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getReasonDisplay = (reason) => {
    return reason.replace(/_/g, " ").toUpperCase();
  };

  const getReasonIcon = (reason) => {
    const icons = {
      sinking: "🌊",
      engine_failure: "⚙️",
      medical_emergency: "🏥",
      fire: "🔥",
      collision: "💥",
      man_overboard: "🆘",
      severe_weather: "⛈️",
      emergency_distress: "🆘",
      other: "⚠️",
    };
    return icons[reason] || "🆘";
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f0f0f]">
        <Navbar />
        <div className="flex items-center justify-center h-[calc(100vh-64px)]">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 border-b-2 border-blue-400 rounded-full animate-spin"></div>
            <div className="text-xl font-semibold text-white">
              Loading rescue requests...
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f0f0f]">
      <Navbar />

      <div className="px-3 pt-20 sm:px-4 lg:pt-24 lg:px-6">
        {/* Header */}
        <div className="mb-6 lg:mb-8">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold text-white truncate sm:text-3xl">
                Emergency Rescue Management
              </h1>
              <p className="text-sm text-gray-400 truncate sm:text-base">
                Monitor and respond to rescue requests from users
              </p>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 gap-3 mt-4 sm:gap-4 sm:grid-cols-3">
            <div className="p-3 bg-[#1e1e1e] rounded-xl sm:p-4">
              <div className="text-sm text-gray-400">Total Requests</div>
              <div className="text-2xl font-bold text-white sm:text-3xl">
                {rescueRequests.length}
              </div>
            </div>
            <div className="p-3 bg-[#1e1e1e] rounded-xl sm:p-4">
              <div className="flex items-center gap-2">
                <div className="relative flex w-2 h-2">
                  <span className="absolute inline-flex w-full h-full bg-red-500 rounded-full opacity-75 animate-ping"></span>
                  <span className="relative inline-flex w-2 h-2 bg-red-600 rounded-full"></span>
                </div>
                <div className="text-sm text-gray-400">Pending</div>
              </div>
              <div className="text-2xl font-bold text-red-400 sm:text-3xl">
                {pendingCount}
              </div>
            </div>
            <div className="p-3 bg-[#1e1e1e] rounded-xl sm:p-4">
              <div className="text-sm text-gray-400">Acknowledged</div>
              <div className="text-2xl font-bold text-green-400 sm:text-3xl">
                {acknowledgedCount}
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-4 sm:gap-3 sm:mb-6">
          <button
            onClick={() => setFilter("all")}
            className={`px-3 py-2 text-sm font-semibold rounded-lg transition-all sm:px-4 sm:text-base ${
              filter === "all"
                ? "bg-blue-600 text-white"
                : "bg-[#1e1e1e] text-gray-400 hover:bg-[#272727]"
            }`}
          >
            All ({rescueRequests.length})
          </button>
          <button
            onClick={() => setFilter("pending")}
            className={`px-3 py-2 text-sm font-semibold rounded-lg transition-all sm:px-4 sm:text-base ${
              filter === "pending"
                ? "bg-red-600 text-white"
                : "bg-[#1e1e1e] text-gray-400 hover:bg-[#272727]"
            }`}
          >
            Pending ({pendingCount})
          </button>
          <button
            onClick={() => setFilter("acknowledged")}
            className={`px-3 py-2 text-sm font-semibold rounded-lg transition-all sm:px-4 sm:text-base ${
              filter === "acknowledged"
                ? "bg-green-600 text-white"
                : "bg-[#1e1e1e] text-gray-400 hover:bg-[#272727]"
            }`}
          >
            Acknowledged ({acknowledgedCount})
          </button>
        </div>

        {/* Rescue Requests List */}
        {filteredRequests.length === 0 ? (
          <div className="p-8 text-center border bg-[#1e1e1e] border-white/10 rounded-xl sm:p-12 sm:rounded-2xl">
            <div className="mb-4 text-4xl sm:text-6xl">📭</div>
            <h3 className="mb-2 text-lg font-bold text-white sm:text-xl">
              No {filter !== "all" ? filter : ""} rescue requests
            </h3>
            <p className="text-sm text-gray-400 sm:text-base">
              {filter === "pending"
                ? "All rescue requests have been acknowledged"
                : filter === "acknowledged"
                ? "No acknowledged requests yet"
                : "No rescue requests have been submitted"}
            </p>
          </div>
        ) : (
          <div className="space-y-3 sm:space-y-4">
            {currentRequests.map((request) => (
              <div
                key={request.id}
                className={`p-4 border rounded-xl backdrop-blur-xl transition-all hover:scale-[1.01] sm:p-6 sm:rounded-2xl ${
                  request.status === "pending"
                    ? "bg-gradient-to-br from-red-900/30 to-orange-900/20 border-red-500/40 animate-pulse"
                    : "bg-[#1e1e1e] border-white/20"
                }`}
              >
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  {/* Left: Request Info */}
                  <div className="flex-1">
                    <div className="flex items-start gap-3 mb-3">
                      <span className="text-3xl sm:text-4xl">
                        {getReasonIcon(request.reason)}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 sm:gap-3">
                          <h3 className="text-lg font-bold text-white truncate sm:text-xl">
                            {getReasonDisplay(request.reason)}
                          </h3>
                          {request.status === "pending" ? (
                            <span className="px-2 py-1 text-xs font-bold text-white bg-red-600 rounded-full animate-pulse sm:px-3">
                              URGENT
                            </span>
                          ) : (
                            <span className="px-2 py-1 text-xs font-bold text-white bg-green-600 rounded-full sm:px-3">
                              ACKNOWLEDGED
                            </span>
                          )}
                        </div>
                        <div className="space-y-1 text-xs text-gray-400 sm:text-sm">
                          <div className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            Location: {request.latitude.toFixed(4)}°N,{" "}
                            {request.longitude.toFixed(4)}°E
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            Received: {formatDate(request.timestamp)}
                          </div>
                          {request.acknowledged_at && (
                            <div className="flex items-center gap-1 text-green-400">
                              <CheckCircle className="w-3 h-3" />
                              Acknowledged:{" "}
                              {formatDate(request.acknowledged_at)}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Weather Info */}
                    {request.weather && (
                      <div className="flex flex-wrap gap-2 mt-3 sm:gap-4">
                        {request.weather.temperature_2m && (
                          <div className="flex items-center gap-1 px-2 py-1 text-xs rounded-lg bg-white/50 sm:px-3">
                            <Thermometer className="w-3 h-3" />
                            {Math.round(request.weather.temperature_2m)}°C
                          </div>
                        )}
                        {request.weather.wind_speed_10m && (
                          <div className="flex items-center gap-1 px-2 py-1 text-xs rounded-lg bg-white/50 sm:px-3">
                            <Wind className="w-3 h-3" />
                            {Math.round(request.weather.wind_speed_10m)} km/h
                          </div>
                        )}
                        {request.marine?.wave_height && (
                          <div className="flex items-center gap-1 px-2 py-1 text-xs rounded-lg bg-white/ sm:px-3">
                            <Waves className="w-3 h-3" />
                            {request.marine.wave_height.toFixed(1)}m
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Right: Action Buttons */}
                  <div className="flex gap-2 sm:flex-col sm:gap-2">
                    <button
                      onClick={() => setSelectedRequest(request)}
                      className="flex items-center justify-center gap-1 px-3 py-2 text-sm font-semibold text-white transition-all bg-blue-600 rounded-lg hover:bg-blue-700 hover:scale-105 sm:px-4"
                    >
                      <Eye className="w-4 h-4" />
                      <span className="sm:hidden">View</span>
                      <span className="hidden sm:inline">Details</span>
                    </button>
                    {request.status === "pending" && (
                      <button
                        onClick={() => handleAcknowledge(request.id)}
                        className="flex items-center justify-center gap-1 px-3 py-2 text-sm font-semibold text-white transition-all bg-green-600 rounded-lg hover:bg-green-700 hover:scale-105 sm:px-4"
                      >
                        <CheckCircle className="w-4 h-4" />
                        <span className="sm:hidden">Ack</span>
                        <span className="hidden sm:inline">Acknowledge</span>
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(request.id)}
                      className="flex items-center justify-center gap-1 px-3 py-2 text-sm font-semibold text-white transition-all bg-red-600 rounded-lg hover:bg-red-700 hover:scale-105 sm:px-4"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span className="sr-only">Delete</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        {totalPages > 1 && (
          <div className="flex items-center justify-between gap-3 p-3 mt-4 border bg-[#1e1e1e] border-white/10 rounded-lg sm:p-4">
            {/* Previous Button */}
            <button
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className={`flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded transition-all sm:px-4 sm:py-2 sm:text-sm ${
                currentPage === 1
                  ? "bg-gray-700 text-gray-500 cursor-not-allowed"
                  : "bg-blue-600 text-white hover:bg-blue-700"
              }`}
            >
              <ChevronLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Previous</span>
              <span className="sm:hidden">Prev</span>
            </button>

            {/* Page Numbers */}
            <div className="flex items-center gap-2">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                (page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-2 py-1 text-xs font-semibold rounded transition-all sm:px-3 sm:py-1.5 sm:text-sm ${
                      page === currentPage
                        ? "bg-blue-600 text-white"
                        : "bg-[#272727] text-gray-400 hover:bg-blue-600 hover:text-white"
                    }`}
                  >
                    {page}
                  </button>
                )
              )}
            </div>

            {/* Next Button */}
            <button
              onClick={() =>
                setCurrentPage((prev) => Math.min(totalPages, prev + 1))
              }
              disabled={currentPage === totalPages}
              className={`flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded transition-all sm:px-4 sm:py-2 sm:text-sm ${
                currentPage === totalPages
                  ? "bg-gray-700 text-gray-500 cursor-not-allowed"
                  : "bg-blue-600 text-white hover:bg-blue-700"
              }`}
            >
              <span className="hidden sm:inline">Next</span>
              <span className="sm:hidden">Next</span>
              <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 z-[3000] flex items-center justify-center p-3 bg-black/85 backdrop-blur-sm sm:p-4">
          <div className="w-full max-w-2xl p-4 border bg-[#1e1e1e] border-white/20 rounded-xl shadow-2xl max-h-[90vh] overflow-y-auto sm:p-6 sm:rounded-2xl">
            {/* Header */}
            <div className="flex items-start justify-between mb-4 sm:mb-6">
              <div className="flex items-center gap-3">
                <span className="text-4xl sm:text-5xl">
                  {getReasonIcon(selectedRequest.reason)}
                </span>
                <div className="flex-1 min-w-0">
                  <h2 className="text-xl font-bold text-white truncate sm:text-2xl">
                    {getReasonDisplay(selectedRequest.reason)}
                  </h2>
                  <p className="text-sm text-gray-300">
                    Rescue Request Details
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedRequest(null)}
                className="text-2xl text-gray-300 transition-colors hover:text-white"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Status Badge */}
            <div className="mb-4 sm:mb-6">
              {selectedRequest.status === "pending" ? (
                <span className="inline-flex items-center gap-2 px-3 py-2 text-sm font-bold text-white bg-red-600 rounded-full animate-pulse sm:px-4">
                  <AlertTriangle className="w-4 h-4" />
                  PENDING - REQUIRES ATTENTION
                </span>
              ) : (
                <span className="inline-flex items-center gap-2 px-3 py-2 text-sm font-bold text-white bg-green-600 rounded-full sm:px-4">
                  <CheckCircle className="w-4 h-4" />
                  ACKNOWLEDGED
                </span>
              )}
            </div>

            {/* Details Grid */}
            <div className="space-y-3 sm:space-y-4">
              {/* Timestamps */}
              <div className="p-3 border rounded-lg bg-white/5 border-white/10 sm:p-4">
                <h3 className="mb-2 text-sm font-semibold text-white sm:mb-3">
                  TIMELINE
                </h3>
                <div className="space-y-2 text-sm text-white">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-gray-300" />
                    <strong className="text-gray-300">Received:</strong>
                    <span className="text-white">
                      {formatDate(selectedRequest.timestamp)}
                    </span>
                  </div>
                  {selectedRequest.acknowledged_at && (
                    <div className="flex items-center gap-2 text-green-400">
                      <CheckCircle className="w-4 h-4" />
                      <strong>Acknowledged:</strong>{" "}
                      {formatDate(selectedRequest.acknowledged_at)}
                    </div>
                  )}
                </div>
              </div>

              {/* Location */}
              <div className="p-3 border rounded-lg bg-white/5 border-white/10 sm:p-4">
                <h3 className="mb-2 text-sm font-semibold text-white sm:mb-3">
                  LOCATION
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="text-white">
                    <strong className="text-gray-300">Latitude:</strong>{" "}
                    {selectedRequest.latitude.toFixed(6)}°N
                  </div>
                  <div className="text-white">
                    <strong className="text-gray-300">Longitude:</strong>{" "}
                    {selectedRequest.longitude.toFixed(6)}°E
                  </div>
                  <a
                    href={`https://www.google.com/maps?q=${selectedRequest.latitude},${selectedRequest.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-3 py-2 mt-2 text-xs font-semibold text-white transition-all bg-blue-600 rounded hover:bg-blue-700 sm:text-sm"
                  >
                    <Navigation className="w-4 h-4" />
                    Open in Google Maps
                  </a>
                </div>
              </div>

              {/* Weather Conditions */}
              {selectedRequest.weather && (
                <div className="p-3 border rounded-lg bg-white/5 border-white/10 sm:p-4">
                  <h3 className="mb-2 text-sm font-semibold text-white sm:mb-3">
                    WEATHER CONDITIONS
                  </h3>
                  <div className="grid grid-cols-2 gap-2 sm:gap-3">
                    {selectedRequest.weather.temperature_2m && (
                      <div className="p-2 rounded bg-white/5 sm:p-3">
                        <div className="text-xs text-gray-300">Temperature</div>
                        <div className="flex items-center gap-1 text-lg font-bold text-white">
                          <Thermometer className="w-4 h-4 text-gray-300" />
                          {Math.round(selectedRequest.weather.temperature_2m)}°C
                        </div>
                      </div>
                    )}
                    {selectedRequest.weather.wind_speed_10m && (
                      <div className="p-2 rounded bg-white/5 sm:p-3">
                        <div className="text-xs text-gray-300">Wind Speed</div>
                        <div className="flex items-center gap-1 text-lg font-bold text-white">
                          <Wind className="w-4 h-4 text-gray-300" />
                          {Math.round(
                            selectedRequest.weather.wind_speed_10m
                          )}{" "}
                          km/h
                        </div>
                      </div>
                    )}
                    {selectedRequest.weather.precipitation !== undefined && (
                      <div className="p-2 rounded bg-white/5 sm:p-3">
                        <div className="text-xs text-gray-300">
                          Precipitation
                        </div>
                        <div className="flex items-center gap-1 text-lg font-bold text-white">
                          <Droplets className="w-4 h-4 text-gray-300" />
                          {selectedRequest.weather.precipitation} mm
                        </div>
                      </div>
                    )}
                    {selectedRequest.marine?.wave_height && (
                      <div className="p-2 rounded bg-white/5 sm:p-3">
                        <div className="text-xs text-gray-300">Wave Height</div>
                        <div className="flex items-center gap-1 text-lg font-bold text-white">
                          <Waves className="w-4 h-4 text-gray-300" />
                          {selectedRequest.marine.wave_height.toFixed(1)} m
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 mt-4 sm:gap-3 sm:mt-6">
              {selectedRequest.status === "pending" && (
                <button
                  onClick={() => handleAcknowledge(selectedRequest.id)}
                  className="flex items-center justify-center gap-2 flex-1 px-4 py-3 text-sm font-bold text-white transition-all bg-green-600 rounded-lg hover:bg-green-700 hover:scale-105 sm:text-lg"
                >
                  <CheckCircle className="w-5 h-5" />
                  Acknowledge Request
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
