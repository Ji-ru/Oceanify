// src/pages/Admin/AlertMGMT.jsx
import { useCallback, useEffect, useMemo, useState } from "react";
import Navbar from "../../components/Navbar";
import { useAlerts } from "../../contexts/AlertContext";
import { usePagination } from "../../hooks/usePagination";

/**
 * Allows admin to create, edit, delete, and auto generate alerts.
 * Uses AlertContext for cached data management.
 */
export default function AlertManagementPage() {
  // Get alerts from context (cached)
  const { 
    alerts, 
    loading, 
    loadAlerts, 
    createAlert, 
    updateAlert, 
    deleteAlert,
    lastFetched 
  } = useAlerts();

  // Local UI state
  const [alertTitle, setAlertTitle] = useState("");
  const [alertMsg, setAlertMsg] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  // Filter and Search States
  const [filterType, setFilterType] = useState("all"); // all, custom, auto
  const [searchTerm, setSearchTerm] = useState("");

  // Predefined alert messages
  const predefinedMessages = useMemo(() => [
    "⚠️ Strong winds detected: vessels advised to stay in port.",
    "🚨 Tropical storm warning: avoid sailing until further notice.",
    "🌊 Rough sea conditions expected. Exercise caution near coastal areas.",
    "🌧️ Heavy rainfall expected: visibility may be low at sea.",
    "🌀 Typhoon alert: monitor updates and follow safety protocols.",
  ], []);

  // Filter alerts based on type and search term
  const filteredAlerts = useMemo(() => {
    let filtered = alerts;

    // Filter by type
    if (filterType !== "all") {
      filtered = filtered.filter(alert => 
        alert.type?.toLowerCase() === filterType.toLowerCase()
      );
    }

    // Filter by search term (searches in title and message)
    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(alert =>
        alert.title?.toLowerCase().includes(search) ||
        alert.message?.toLowerCase().includes(search)
      );
    }

    return filtered;
  }, [alerts, filterType, searchTerm]);

  // Pagination on filtered alerts
  const {
    currentPage,
    totalPages,
    currentData: paginatedAlerts,
    nextPage,
    prevPage,
    goToPage,
  } = usePagination(filteredAlerts, 5);

  // Load alerts on mount (will use cache if available)
  useEffect(() => {
    loadAlerts();
  }, [loadAlerts]);

  /**
   * Handle create or update alert
   */
  const handleSendAlert = useCallback(async () => {
    if (!alertMsg.trim() || !alertTitle.trim()) {
      alert("Please provide both title and message");
      return;
    }

    setSubmitting(true);
    // Format: ISO 8601 format for Supabase/PostgreSQL
    const now = new Date();
    const formattedTime = now.toISOString();

    const alertData = {
      title: alertTitle,
      message: alertMsg,
      time: formattedTime,
      type: "custom",
    };

    try {
      let result;
      
      if (editingId) {
        // Update existing alert
        result = await updateAlert(editingId, alertData);
      } else {
        // Create new alert
        result = await createAlert(alertData);
      }

      if (result.success) {
        alert(editingId ? "Alert updated successfully!" : "Alert created successfully!");
        
        // Close modal and reset form
        setIsModalOpen(false);
        setAlertTitle("");
        setAlertMsg("");
        setEditingId(null);
      } else {
        alert(`Failed to ${editingId ? 'update' : 'create'} alert: ${result.error}`);
      }
    } catch (error) {
      console.error("Error saving alert:", error);
      alert("An unexpected error occurred. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }, [alertTitle, alertMsg, editingId, createAlert, updateAlert]);

  /**
   * Handle edit alert
   */
  const handleEditAlert = useCallback((alert) => {
    setAlertTitle(alert.title || "");
    setAlertMsg(alert.message || "");
    setEditingId(alert.id);
    setIsModalOpen(true);
  }, []);

  /**
   * Handle delete alert
   */
  const handleDeleteAlert = useCallback(async (id) => {
    if (!window.confirm("Are you sure you want to delete this alert?")) {
      return;
    }

    const result = await deleteAlert(id);
    
    if (result.success) {
      alert("Alert deleted successfully!");
    } else {
      alert(`Failed to delete alert: ${result.error}`);
    }
  }, [deleteAlert]);

  /**
   * Reset modal form
   */
  const resetModal = useCallback(() => {
    setIsModalOpen(false);
    setEditingId(null);
    setAlertTitle("");
    setAlertMsg("");
  }, []);

  // Stats
  const customAlerts = useMemo(() => 
    alerts.filter(alert => alert.type === "custom").length, 
    [alerts]
  );
  
  const autoAlerts = useMemo(() => 
    alerts.filter(alert => alert.type === "auto").length, 
    [alerts]
  );

  return (
    <div className="min-h-screen bg-[#0f0f0f]">
      {/* Navbar */}
      <div className="fixed top-0 left-0 right-0 z-50">
        <Navbar />
      </div>

      {/* Main Content */}
      <div className="flex justify-center pt-20 mx-auto lg:pt-28 lg:px-6">
        <div className="flex flex-col w-full max-w-5xl p-4 space-y-6">
          {/* Header */}
          <div className="flex flex-col gap-2 mb-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold text-white sm:text-3xl">
                Alert Management
              </h1>
              <p className="mt-1 text-sm text-gray-400 sm:text-base">
                Send, edit, or manage alerts for seafarers
              </p>
              {lastFetched && (
                <p className="mt-1 text-xs text-gray-500">
                  Last updated: {new Date(lastFetched).toLocaleTimeString()}
                </p>
              )}
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 gap-4 mb-4 sm:grid-cols-3">
            <div className="p-4 bg-[#1e1e1e] rounded-xl">
              <div className="text-sm text-gray-400">Total Alerts</div>
              <div className="mt-1 text-2xl font-bold text-white">
                {alerts.length}
              </div>
            </div>
            <div className="p-4 bg-[#1e1e1e] rounded-xl">
              <div className="text-sm text-gray-400">Custom Alerts</div>
              <div className="mt-1 text-2xl font-bold text-blue-400">
                {customAlerts}
              </div>
            </div>
            <div className="p-4 bg-[#1e1e1e] rounded-xl">
              <div className="text-sm text-gray-400">Auto Alerts</div>
              <div className="mt-1 text-2xl font-bold text-purple-400">
                {autoAlerts}
              </div>
            </div>
          </div>

          {/* Create Alert Button */}
          <button
            onClick={() => {
              setIsModalOpen(true);
              setEditingId(null);
              setAlertTitle("");
              setAlertMsg("");
            }}
            className="px-4 py-2 mb-4 text-white bg-red-600 rounded-lg hover:bg-red-700 focus:outline-none w-full sm:w-auto"
          >
            Create New Alert
          </button>

          {/* Search and Filters */}
          <div className="p-4 bg-[#1e1e1e] rounded-xl">
            <div className="flex flex-col gap-4 sm:flex-row">
              {/* Search */}
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Search alerts by title or message..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full p-3 text-white bg-[#272727] border border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:outline-none"
                />
              </div>

              {/* Type Filter */}
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="p-3 text-white bg-[#272727] border border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:outline-none"
              >
                <option value="all">All Types</option>
                <option value="custom">Custom</option>
                <option value="auto">Auto</option>
              </select>

              {/* Clear Filters Button */}
              {(filterType !== "all" || searchTerm) && (
                <button
                  onClick={() => {
                    setFilterType("all");
                    setSearchTerm("");
                  }}
                  className="px-4 py-3 text-white bg-gray-600 rounded-lg hover:bg-gray-700 whitespace-nowrap"
                >
                  Clear Filters
                </button>
              )}
            </div>

            {/* Results Count */}
            <div className="mt-3 text-sm text-gray-400">
              Showing {filteredAlerts.length} of {alerts.length} alerts
            </div>
          </div>

          {/* Modal */}
          {isModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
              <div className="w-full max-w-lg p-6 bg-[#1e1e1e] rounded-2xl shadow-xl overflow-y-auto max-h-[90vh] relative">
                <button
                  onClick={resetModal}
                  className="absolute top-3 right-3 text-white text-2xl font-bold hover:text-red-500 transition-colors"
                >
                  &times;
                </button>

                <h2 className="flex items-center gap-2 mb-6 text-lg font-bold text-white sm:text-xl">
                  <span className="text-red-400">⚠️</span>
                  {editingId ? "Edit Alert" : "Create New Alert"}
                </h2>

                <div className="space-y-4">
                  <div>
                    <label className="block mb-2 text-sm font-medium text-gray-400">
                      Alert Title *
                    </label>
                    <input
                      type="text"
                      placeholder="Enter alert title..."
                      value={alertTitle}
                      onChange={(e) => setAlertTitle(e.target.value)}
                      className="w-full p-3 text-white bg-[#272727] border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block mb-2 text-sm font-medium text-gray-400">
                      Choose Predefined Message
                    </label>
                    <select
                      onChange={(e) => setAlertMsg(e.target.value)}
                      value={alertMsg || ""}
                      className="w-full p-3 text-white bg-[#272727] border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    >
                      <option value="">Select a message</option>
                      {predefinedMessages.map((msg, index) => (
                        <option key={index} value={msg}>
                          {msg.length > 60 ? msg.slice(0, 60) + "..." : msg}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block mb-2 text-sm font-medium text-gray-400">
                      Alert Message *
                    </label>
                    <textarea
                      rows={5}
                      placeholder="Type or edit an alert message..."
                      value={alertMsg}
                      onChange={(e) => setAlertMsg(e.target.value)}
                      className="w-full p-3 text-white bg-[#272727] border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>

                  <button
                    onClick={handleSendAlert}
                    disabled={submitting}
                    className={`w-full py-3 text-white font-medium rounded-lg transition-all ${
                      editingId
                        ? "bg-green-600 hover:bg-green-700"
                        : "bg-red-600 hover:bg-red-700"
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {submitting
                      ? "Sending..."
                      : editingId
                      ? "Update Alert"
                      : "Send Alert"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Alert List */}
          <div className="p-4 bg-[#1e1e1e] rounded-2xl sm:p-6">
            <h2 className="flex items-center gap-2 mb-4 text-lg font-bold text-white sm:text-xl">
              <span className="text-blue-400">📋</span>
              Active Alerts
            </h2>

            {loading && alerts.length === 0 ? (
              <div className="py-8 text-center">
                <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                <p className="mt-2 text-gray-400">Loading alerts...</p>
              </div>
            ) : filteredAlerts.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-gray-400">
                  {searchTerm || filterType !== "all" 
                    ? "No alerts match your search criteria" 
                    : "No alerts yet"}
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-gray-700">
                {paginatedAlerts.map((alert) => (
                  <li
                    key={alert.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between py-3"
                  >
                    <div className="flex-1 min-w-0">
                      <h3 className="text-white font-bold text-lg break-words">
                        {alert.title || "No Title"}
                      </h3>
                      <p className="text-gray-300 break-words">
                        {alert.message}
                      </p>
                      <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-gray-400">
                        <span>{new Date(alert.time).toLocaleString()}</span>
                        <span className={`px-2 py-1 rounded ${
                          alert.type === 'custom' 
                            ? 'bg-blue-500/20 text-blue-400' 
                            : 'bg-purple-500/20 text-purple-400'
                        }`}>
                          {alert.type}
                        </span>
                      </div>
                    </div>

                    {alert.type !== "auto" && (
                      <div className="flex gap-2 mt-3 sm:mt-0 sm:flex-col">
                        <button
                          onClick={() => handleEditAlert(alert)}
                          className="px-3 py-2 text-sm text-white bg-yellow-600 rounded-lg hover:bg-yellow-700"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteAlert(alert.id)}
                          className="px-3 py-2 text-sm text-white bg-red-600 rounded-lg hover:bg-red-700"
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex flex-wrap justify-center gap-2 mt-6">
                <button
                  onClick={prevPage}
                  disabled={currentPage === 1}
                  className="px-3 py-1 text-sm font-semibold rounded bg-blue-600 text-white disabled:bg-gray-700"
                >
                  Prev
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                  (page) => (
                    <button
                      key={page}
                      onClick={() => goToPage(page)}
                      className={`px-3 py-1 text-sm font-semibold rounded ${
                        page === currentPage
                          ? "bg-blue-600 text-white"
                          : "bg-gray-700 text-gray-400"
                      }`}
                    >
                      {page}
                    </button>
                  )
                )}
                <button
                  onClick={nextPage}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 text-sm font-semibold rounded bg-blue-600 text-white disabled:bg-gray-700"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}