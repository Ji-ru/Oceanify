import { useEffect, useState } from "react";
import Navbar from "../../components/Navbar";
import supabase from "../../supabaseClient";

export default function AdminRescueManagement() {
  const [rescueRequests, setRescueRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [selectedRequest, setSelectedRequest] = useState(null);

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

      alert("✅ Rescue request acknowledged successfully!");
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

      alert("🗑️ Rescue request deleted successfully!");
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

  // Get counts for each status
  const pendingCount = rescueRequests.filter((r) => r.status === "pending").length;
  const acknowledgedCount = rescueRequests.filter((r) => r.status === "acknowledged").length;

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

  return (
    <div className="min-h-screen bg-[#0f0f0f]">
      <Navbar />

      <div className="px-4 pt-24 pb-12 mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="text-5xl">🚨</div>
            <div>
              <h1 className="text-4xl font-bold text-white">
                Emergency Rescue Management
              </h1>
              <p className="text-lg text-gray-400">
                Monitor and respond to rescue requests from users
              </p>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 gap-4 mt-6 md:grid-cols-3">
            <div className="p-4 border bg-gradient-to-br from-blue-900/20 to-blue-800/10 border-blue-500/30 rounded-xl backdrop-blur-xl">
              <div className="text-sm text-gray-400">Total Requests</div>
              <div className="text-3xl font-bold text-white">{rescueRequests.length}</div>
            </div>
            <div className="p-4 border bg-gradient-to-br from-red-900/20 to-red-800/10 border-red-500/30 rounded-xl backdrop-blur-xl">
              <div className="flex items-center gap-2">
                <div className="relative flex w-2 h-2">
                  <span className="absolute inline-flex w-full h-full bg-red-500 rounded-full opacity-75 animate-ping"></span>
                  <span className="relative inline-flex w-2 h-2 bg-red-600 rounded-full"></span>
                </div>
                <div className="text-sm text-gray-400">Pending</div>
              </div>
              <div className="text-3xl font-bold text-red-400">{pendingCount}</div>
            </div>
            <div className="p-4 border bg-gradient-to-br from-green-900/20 to-green-800/10 border-green-500/30 rounded-xl backdrop-blur-xl">
              <div className="text-sm text-gray-400">Acknowledged</div>
              <div className="text-3xl font-bold text-green-400">{acknowledgedCount}</div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-3 mb-6">
          <button
            onClick={() => setFilter("all")}
            className={`px-4 py-2 font-semibold rounded-lg transition-all ${
              filter === "all"
                ? "bg-blue-600 text-white"
                : "bg-white/10 text-gray-400 hover:bg-white/20"
            }`}
          >
            All ({rescueRequests.length})
          </button>
          <button
            onClick={() => setFilter("pending")}
            className={`px-4 py-2 font-semibold rounded-lg transition-all ${
              filter === "pending"
                ? "bg-red-600 text-white"
                : "bg-white/10 text-gray-400 hover:bg-white/20"
            }`}
          >
            Pending ({pendingCount})
          </button>
          <button
            onClick={() => setFilter("acknowledged")}
            className={`px-4 py-2 font-semibold rounded-lg transition-all ${
              filter === "acknowledged"
                ? "bg-green-600 text-white"
                : "bg-white/10 text-gray-400 hover:bg-white/20"
            }`}
          >
            Acknowledged ({acknowledgedCount})
          </button>
        </div>

        {/* Rescue Requests List */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 border-b-2 border-blue-500 rounded-full animate-spin"></div>
              <p className="text-white">Loading rescue requests...</p>
            </div>
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="p-12 text-center border bg-white/5 border-white/10 rounded-2xl">
            <div className="mb-4 text-6xl">📭</div>
            <h3 className="mb-2 text-xl font-bold text-white">
              No {filter !== "all" ? filter : ""} rescue requests
            </h3>
            <p className="text-gray-400">
              {filter === "pending"
                ? "All rescue requests have been acknowledged"
                : filter === "acknowledged"
                ? "No acknowledged requests yet"
                : "No rescue requests have been submitted"}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredRequests.map((request) => (
              <div
                key={request.id}
                className={`p-6 border rounded-2xl backdrop-blur-xl transition-all hover:scale-[1.01] ${
                  request.status === "pending"
                    ? "bg-gradient-to-br from-red-900/30 to-orange-900/20 border-red-500/40 animate-pulse"
                    : "bg-gradient-to-br from-white/10 to-white/5 border-white/20"
                }`}
              >
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  {/* Left: Request Info */}
                  <div className="flex-1">
                    <div className="flex items-start gap-3 mb-3">
                      <span className="text-4xl">
                        {getReasonIcon(request.reason)}
                      </span>
                      <div>
                        <div className="flex items-center gap-3 mb-1">
                          <h3 className="text-xl font-bold text-white">
                            {getReasonDisplay(request.reason)}
                          </h3>
                          {request.status === "pending" ? (
                            <span className="px-3 py-1 text-xs font-bold text-white bg-red-600 rounded-full animate-pulse">
                              URGENT
                            </span>
                          ) : (
                            <span className="px-3 py-1 text-xs font-bold text-white bg-green-600 rounded-full">
                              ✓ ACKNOWLEDGED
                            </span>
                          )}
                        </div>
                        <div className="space-y-1 text-sm text-gray-400">
                          <div>📍 Location: {request.latitude.toFixed(4)}°N, {request.longitude.toFixed(4)}°E</div>
                          <div>🕐 Received: {formatDate(request.timestamp)}</div>
                          {request.acknowledged_at && (
                            <div className="text-green-400">
                              ✓ Acknowledged: {formatDate(request.acknowledged_at)}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Weather Info */}
                    {request.weather && (
                      <div className="flex flex-wrap gap-4 mt-3">
                        {request.weather.temperature_2m && (
                          <div className="px-3 py-1 text-xs rounded-lg bg-white/5">
                            🌡️ {Math.round(request.weather.temperature_2m)}°C
                          </div>
                        )}
                        {request.weather.wind_speed_10m && (
                          <div className="px-3 py-1 text-xs rounded-lg bg-white/5">
                            💨 {Math.round(request.weather.wind_speed_10m)} km/h
                          </div>
                        )}
                        {request.marine?.wave_height && (
                          <div className="px-3 py-1 text-xs rounded-lg bg-white/5">
                            🌊 {request.marine.wave_height.toFixed(1)}m
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Right: Action Buttons */}
                  <div className="flex gap-2 md:flex-col">
                    <button
                      onClick={() => setSelectedRequest(request)}
                      className="flex-1 px-4 py-2 font-semibold text-white transition-all bg-blue-600 rounded-lg hover:bg-blue-700 hover:scale-105"
                    >
                      📋 View Details
                    </button>
                    {request.status === "pending" && (
                      <button
                        onClick={() => handleAcknowledge(request.id)}
                        className="flex-1 px-4 py-2 font-semibold text-white transition-all bg-green-600 rounded-lg hover:bg-green-700 hover:scale-105"
                      >
                        ✓ Acknowledge
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(request.id)}
                      className="px-4 py-2 font-semibold text-white transition-all bg-red-600 rounded-lg hover:bg-red-700 hover:scale-105"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 z-[3000] flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-2xl p-6 border bg-gradient-to-br from-gray-900 to-gray-800 border-white/20 rounded-2xl shadow-2xl animate-in zoom-in duration-300 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-3">
                <span className="text-5xl">{getReasonIcon(selectedRequest.reason)}</span>
                <div>
                  <h2 className="text-2xl font-bold text-white">
                    {getReasonDisplay(selectedRequest.reason)}
                  </h2>
                  <p className="text-sm text-gray-400">Rescue Request Details</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedRequest(null)}
                className="text-2xl text-gray-400 transition-colors hover:text-white"
              >
                ✕
              </button>
            </div>

            {/* Status Badge */}
            <div className="mb-6">
              {selectedRequest.status === "pending" ? (
                <span className="px-4 py-2 text-sm font-bold text-white bg-red-600 rounded-full animate-pulse">
                  ⚠️ PENDING - REQUIRES ATTENTION
                </span>
              ) : (
                <span className="px-4 py-2 text-sm font-bold text-white bg-green-600 rounded-full">
                  ✓ ACKNOWLEDGED
                </span>
              )}
            </div>

            {/* Details Grid */}
            <div className="space-y-4">
              {/* Timestamps */}
              <div className="p-4 border rounded-lg bg-white/5 border-white/10">
                <h3 className="mb-3 text-sm font-semibold text-gray-400">TIMELINE</h3>
                <div className="space-y-2 text-sm text-white">
                  <div>📥 <strong>Received:</strong> {formatDate(selectedRequest.timestamp)}</div>
                  {selectedRequest.acknowledged_at && (
                    <div className="text-green-400">
                      ✓ <strong>Acknowledged:</strong> {formatDate(selectedRequest.acknowledged_at)}
                    </div>
                  )}
                </div>
              </div>

              {/* Location */}
              <div className="p-4 border rounded-lg bg-white/5 border-white/10">
                <h3 className="mb-3 text-sm font-semibold text-gray-400">LOCATION</h3>
                <div className="space-y-2 text-sm text-white">
                  <div><strong>Latitude:</strong> {selectedRequest.latitude.toFixed(6)}°N</div>
                  <div><strong>Longitude:</strong> {selectedRequest.longitude.toFixed(6)}°E</div>
                  <a
                    href={`https://www.google.com/maps?q=${selectedRequest.latitude},${selectedRequest.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block px-3 py-1 mt-2 text-xs font-semibold text-white transition-all bg-blue-600 rounded hover:bg-blue-700"
                  >
                    🗺️ Open in Google Maps
                  </a>
                </div>
              </div>

              {/* Weather Conditions */}
              {selectedRequest.weather && (
                <div className="p-4 border rounded-lg bg-white/5 border-white/10">
                  <h3 className="mb-3 text-sm font-semibold text-gray-400">WEATHER CONDITIONS</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {selectedRequest.weather.temperature_2m && (
                      <div className="p-3 rounded bg-white/5">
                        <div className="text-xs text-gray-400">Temperature</div>
                        <div className="text-lg font-bold text-white">
                          {Math.round(selectedRequest.weather.temperature_2m)}°C
                        </div>
                      </div>
                    )}
                    {selectedRequest.weather.wind_speed_10m && (
                      <div className="p-3 rounded bg-white/5">
                        <div className="text-xs text-gray-400">Wind Speed</div>
                        <div className="text-lg font-bold text-white">
                          {Math.round(selectedRequest.weather.wind_speed_10m)} km/h
                        </div>
                      </div>
                    )}
                    {selectedRequest.weather.precipitation !== undefined && (
                      <div className="p-3 rounded bg-white/5">
                        <div className="text-xs text-gray-400">Precipitation</div>
                        <div className="text-lg font-bold text-white">
                          {selectedRequest.weather.precipitation} mm
                        </div>
                      </div>
                    )}
                    {selectedRequest.marine?.wave_height && (
                      <div className="p-3 rounded bg-white/5">
                        <div className="text-xs text-gray-400">Wave Height</div>
                        <div className="text-lg font-bold text-white">
                          {selectedRequest.marine.wave_height.toFixed(1)} m
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 mt-6">
              {selectedRequest.status === "pending" && (
                <button
                  onClick={() => handleAcknowledge(selectedRequest.id)}
                  className="flex-1 px-6 py-3 text-lg font-bold text-white transition-all bg-green-600 rounded-lg hover:bg-green-700 hover:scale-105"
                >
                  ✓ Acknowledge Request
                </button>
              )}
              <button
                onClick={() => setSelectedRequest(null)}
                className="px-6 py-3 text-lg font-bold text-white transition-all bg-gray-600 rounded-lg hover:bg-gray-700 hover:scale-105"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}