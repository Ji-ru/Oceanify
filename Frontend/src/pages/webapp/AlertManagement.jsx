// src/pages/Admin/AlertMGMT.jsx
import { useCallback, useEffect, useMemo, useState } from "react";
import Navbar from "../../components/Navbar";
import { createClient } from "@supabase/supabase-js";
import API from "../../api";
import { usePagination } from "../../hooks/usePagination";

/**
 * Initializes Supabase Client using evironment varibales
 */
const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

/**
 * Allows admin to create, edit, delete, and auto generate alters.
 * Syncs data between backend and database (Laravel API and Supabase).
 * @returns lists of existing alert data
 */
export default function AlertManagementPage() {
  // INITIALIZE STATE

  // Alert Title Input State
  const [alertTitle, setAlertTitle] = useState(""); // New state for title

  // Alert Message Input State
  const [alertMsg, setAlertMsg] = useState("");

  // List of All Alerts State
  const [alertList, setAlertList] = useState([]);

  // Editing Alter ID (null if creating new)
  const [editingId, setEditingId] = useState(null);

  // Theme Mode (Dark)
  const [theme, setTheme] = useState("dark");

  // Loading Indicator for API Operations State
  const [loading, setLoading] = useState(false);

  // Modal toggle state
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Predefined alert messages (memoized to prevent recreation on render)
  const predefinedMessages = useMemo(() => [
    "⚠️ Strong winds detected: vessels advised to stay in port.",
    "🚨 Tropical storm warning: avoid sailing until further notice.",
    "🌊 Rough sea conditions expected. Exercise caution near coastal areas.",
    "🌧️ Heavy rainfall expected: visibility may be low at sea.",
    "🌀 Typhoon alert: monitor updates and follow safety protocols.",
  ]);

  // ===============================================
  // THEME HANDLING
  // ===============================================

  /**
   * Handles Theme (Dark Mode)
   * Load and applu saved them on mount (renders in the component)
   * This mount only once
   */
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") || "dark";
    setTheme(savedTheme);
    document.documentElement.classList.toggle("dark", savedTheme === "dark");
  }, []);

  /**
   * Changes the theme by toggling between light and dark theme
   * UNUSED Function Expression
   */
  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    document.documentElement.classList.toggle("dark", newTheme === "dark");
    localStorage.setItem("theme", newTheme);
  };

  // ================================
  // PAGINATION HOOK
  // ================================
  const {
    currentPage,
    totalPages,
    currentData: paginatedAlerts,
    nextPage,
    prevPage,
    goToPage,
  } = usePagination(alertList, 5); // 5 alerts per page

  // ===============================================
  // DATA FETCHING
  // ===============================================

  /**
   * Loads alert data from Laravel API (with Supabase fallback if failed to fetch)
   * Queries all the attributes in a data from the table ordered by time (ASC)
   */
  const loadAlerts = async () => {
    try {
      const response = await fetch("http://localhost:8000/api/alerts", {
        method: "GET",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        setAlertList(data);
      } else {
        console.error("Failed to fetch alerts from Laravel");
        // Fallback to Supabase if Laravel fails
        const { data: supabaseData, error: supabaseError } = await supabase
          .from("alerts")
          .select("*")
          .order("time", { ascending: false });
        if (!supabaseError && supabaseData) setAlertList(supabaseData);
      }
    } catch (fetchError) {
      console.error("Error fetching alerts:", fetchError);
      // Fallback to Supabase
      const { data: supabaseData, error: supabaseError } = await supabase
        .from("alerts")
        .select("*")
        .order("time", { ascending: false });
      if (!supabaseError && supabaseData) setAlertList(supabaseData);
    }
  };

  /**
   * Fetch alert data on first render
   * Fetches alert data mutiple times if there's any changes or updates from editing or deletion of certain data
   */
  useEffect(() => {
    loadAlerts();
  }, [loadAlerts]);

  // ===============================================
  // ALERT OPERATIONS
  // ===============================================

  /**
   * Used useCallback react hook to save function preventing recreating the function in memory every time the component re-render
   * Post and alert to the Backend (Laravel API)
   * Falls back to Supabase if fails to fetch (NO LINE OF CODE YET)
   * @param {Object} alertData - alert object to send
   */
  const postAlertToLaravel = useCallback(async (alertData) => {
    try {
      const response = await fetch("http://localhost:8000/api/alerts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          "X-CSRF-TOKEN":
            document
              .querySelector('meta[name="csrf-token"]')
              ?.getAttribute("content") || "",
        },
        credentials: "include",
        body: JSON.stringify(alertData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log("Alert posted to Laravel:", result);
      return result;
    } catch (postError) {
      console.error("Error posting alert to Laravel:", postError);
      return null;
    }
  }, []);

  /**
   * Handles Creation or Update of Alerts
   * Falls back to Supabase of Laravel API fails to create or update alert information
   * @returns created and updated alert information set the by Admin.
   */
  const handleSendAlert = useCallback(async () => {
    if (!alertMsg.trim() || !alertTitle.trim()) {
      alert("Please provide both title and message");
      return;
    }

    setLoading(true);
    const now = new Date().toISOString();

    // Prepare alert object
    const alertData = {
      title: alertTitle,
      message: alertMsg,
      time: now,
      type: editingId ? undefined : "custom", // type only for new alerts
    };

    try {
      if (editingId) {
        // ---------------------------
        // UPDATE EXISTING ALERT
        // ---------------------------
        let updatedAlert = null;

        try {
          // Try Laravel first
          const response = await API.put(`/alerts/${editingId}`, alertData);
          if (response.status >= 200 && response.status < 300) {
            updatedAlert = { ...alertData, id: editingId };
          } else {
            // Fallback to Supabase
            const { error } = await supabase
              .from("alerts")
              .update(alertData)
              .eq("id", editingId);
            if (!error) {
              updatedAlert = { ...alertData, id: editingId };
            }
          }
        } catch (updateError) {
          console.error("Error updating alert:", updateError);
          // Final fallback to Supabase
          const { error } = await supabase
            .from("alerts")
            .update(alertData)
            .eq("id", editingId);
          if (!error) updatedAlert = { ...alertData, id: editingId };
        }

        if (updatedAlert) {
          setAlertList((prev) =>
            prev.map((a) => (a.id === editingId ? updatedAlert : a))
          );
        }

        setEditingId(null); // Clear editing state
      } else {
        // ---------------------------
        // CREATE NEW ALERT
        // ---------------------------
        let newAlertResult = null;

        const laravelResult = await postAlertToLaravel(alertData);
        if (laravelResult) {
          newAlertResult = laravelResult;
        } else {
          const { data: supabaseData, error } = await supabase
            .from("alerts")
            .insert([alertData])
            .select();
          if (!error && supabaseData?.length > 0) {
            newAlertResult = supabaseData[0];
          } else {
            // Final fallback to local state
            newAlertResult = { ...alertData, id: Date.now() };
          }
        }

        setAlertList((prev) => [newAlertResult, ...prev]);
      }
    } catch (error) {
      console.error("Error creating/updating alert:", error);
    } finally {
      // Reset form & loading
      setAlertTitle("");
      setAlertMsg("");
      setLoading(false);
    }

    /**
     * Below are the dependencies, which checks whenever changes have been done between renders
     * @returns same function (cached one) if no changes, else creates new version of function replacing the old one (cached it)
     */
  }, [alertTitle, alertMsg, editingId, postAlertToLaravel]);

  /**
   * Selects the data for editing by populating the form
   * This will be passed on to the handleSendAlert function
   * @param {Object} alert - The alert data to be edited
   */
  const handleEditAlert = useCallback((alert) => {
    setAlertTitle(alert.title || "");
    setAlertMsg(alert.message || "");
    setEditingId(alert.id);
  }, []);

  /**
   * Delete the selected alert information
   * Fallback to Supabase if Laravel API fails to change the information
   * @param {number} id - ID of the selected Alert Information
   */
  const handleDeleteAlert = useCallback(async (id) => {
    try {
      // Try to delete from Laravel first
      const response = await API.put("/alerts", updatedAlert);

      if (response.ok) {
        setAlertList((prev) => prev.filter((a) => a.id !== id));
      } else {
        // Fallback to Supabase
        const { error: deleteError } = await supabase
          .from("alerts")
          .delete()
          .eq("id", id);
        if (!deleteError) {
          setAlertList((prev) => prev.filter((a) => a.id !== id));
        }
      }
    } catch (deleteError) {
      console.error("Error deleting alert:", deleteError);
    }
  });

  // ===============================================
  // UI RENDERING + IMPLEMENTED FUNCTIONS
  // ===============================================

  return (
    <div className="min-h-screen bg-[#0f0f0f]">
      {/* Navbar fixed */}
      <div className="fixed top-0 left-0 right-0 z-50">
        <Navbar />
      </div>

      {/* Main Content */}
      <div className="flex justify-center pt-20 mx-auto lg:pt-28 lg:px-6">
        <div className="flex flex-col w-full max-w-5xl p-4 space-y-6">
          {/* Header Section */}
          <div className="flex flex-col gap-2 mb-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold text-white sm:text-3xl">
                Alert Management
              </h1>
              <p className="mt-1 text-sm text-gray-400 sm:text-base">
                Send, edit, or manage alerts for seafarers
              </p>
            </div>
          </div>

          {/* Create New Alert Button */}
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 mb-4 text-white bg-red-600 rounded-lg hover:bg-red-700 focus:outline-none w-full sm:w-auto"
          >
            Create New Alert
          </button>

          {/* Modal */}
          {isModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
              <div className="w-full max-w-lg p-6 bg-[#1e1e1e] rounded-2xl shadow-xl overflow-y-auto max-h-[90vh] relative">
                {/* Close Button */}
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="absolute top-3 right-3 text-white text-2xl font-bold hover:text-red-500 transition-colors"
                >
                  &times;
                </button>

                {/* Modal Header */}
                <h2 className="flex items-center gap-2 mb-6 text-lg font-bold text-white sm:text-xl">
                  <span className="text-red-400">⚠️</span>
                  {editingId ? "Edit Alert" : "Create New Alert"}
                </h2>

                {/* Form */}
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
                      className="w-full p-3 text-white bg-[#272727] border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all duration-200"
                    />
                  </div>

                  <div>
                    <label className="block mb-2 text-sm font-medium text-gray-400">
                      Choose Predefined Message
                    </label>
                    <select
                      onChange={(e) => setAlertMsg(e.target.value)}
                      value={alertMsg || ""}
                      className="w-full p-3 text-white bg-[#272727] border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all duration-200"
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
                      className="w-full p-3 text-white bg-[#272727] border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all duration-200"
                    />
                  </div>

                  <button
                    onClick={handleSendAlert}
                    disabled={loading}
                    className={`w-full py-3 text-white font-medium rounded-lg transition-all duration-200 ${
                      editingId
                        ? "bg-green-600 hover:bg-green-700"
                        : "bg-red-600 hover:bg-red-700"
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {loading
                      ? "Sending..."
                      : editingId
                      ? "Update Alert"
                      : "Send Alert"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Alert List Section */}
          <div className="p-4 bg-[#1e1e1e] rounded-2xl sm:p-6">
            <h2 className="flex items-center gap-2 mb-4 text-lg font-bold text-white sm:text-xl">
              <span className="text-blue-400">📋</span>
              Active Alerts ({alertList.length})
            </h2>

            {alertList.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-gray-400">No alerts yet.</p>
              </div>
            ) : (
              <ul className="divide-y divide-gray-700">
                {paginatedAlerts.map((alert) => (
                  <li
                    key={alert.id}
                    className={`flex flex-col sm:flex-row sm:items-center justify-between py-3`}
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
                        <span className="px-2 py-1 rounded bg-[#272727]">
                          {alert.type}
                        </span>
                      </div>
                    </div>

                    {alert.type !== "auto" && (
                      <div className="flex gap-2 mt-3 sm:mt-0 sm:flex-col">
                        <button
                          onClick={() => handleEditAlert(alert)}
                          className="px-3 py-2 text-sm text-white transition-colors bg-yellow-600 rounded-lg hover:bg-yellow-700"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteAlert(alert.id)}
                          className="px-3 py-2 text-sm text-white transition-colors bg-red-600 rounded-lg hover:bg-red-700"
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
