// src/pages/Admin/AlertMGMT.jsx
import { useCallback, useEffect, useMemo, useState } from "react";
import Navbar from "../../components/Navbar";
import { createClient } from "@supabase/supabase-js";
import API from "../../api";
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

      {/* Content - Added proper top padding to prevent navbar overlap */}
      <div className="flex items-center justify-center pt-20 mx-auto lg:p-6 lg:pt-28">
        {" "}
        <div className="flex flex-col w-full max-w-4xl p-4">
          {/* Header Section */}
          <div className="flex flex-col items-start justify-between gap-4 mb-6 lg:flex-row lg:items-center">
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold text-white sm:text-3xl">
                Alert Management
              </h1>
              <p className="mt-2 text-sm text-gray-400 sm:text-base">
                Send, edit, or manage alerts for seafarers
              </p>
            </div>
          </div>

          {/* Alert Creation Card */}
          <div className="p-4 mb-6 bg-[#1e1e1e] rounded-xl sm:p-6">
            <h2 className="flex items-center gap-2 mb-4 text-lg font-bold text-white sm:text-xl">
              <span className="text-red-400">⚠️</span>
              {editingId ? "Edit Alert" : "Create New Alert"}
            </h2>

            {/* Alert Title Input */}
            <div className="mb-4">
              <label className="block mb-2 text-sm font-medium text-gray-400">
                Alert Title *
              </label>
              <input
                type="text"
                className="w-full p-3 text-white bg-[#272727] border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:outline-none transition-all duration-200"
                placeholder="Enter alert title..."
                value={alertTitle}
                onChange={(e) => setAlertTitle(e.target.value)}
              />
            </div>

            {/* Predefined Messages */}
            <div className="mb-4">
              <label className="block mb-2 text-sm font-medium text-gray-400">
                Choose Predefined Message
              </label>
              <select
                onChange={(e) => setAlertMsg(e.target.value)}
                className="w-full p-3 text-white bg-[#272727] border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:outline-none transition-all duration-200"
                value={alertMsg || ""}
              >
                <option value=""> Select a message </option>
                {predefinedMessages.map((msg, index) => (
                  <option key={index} value={msg}>
                    {msg.length > 60 ? msg.slice(0, 60) + "..." : msg}
                  </option>
                ))}
              </select>
            </div>

            {/* Alert Message Text area */}
            <div className="mb-4">
              <label className="block mb-2 text-sm font-medium text-gray-400">
                Alert Message *
              </label>
              <textarea
                className="w-full p-3 text-white bg-[#272727] border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:outline-none transition-all duration-200"
                rows={4}
                placeholder="Type or edit an alert message..."
                value={alertMsg}
                onChange={(e) => setAlertMsg(e.target.value)}
              />
            </div>

            {/* Action Button */}
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

          {/* Alert List Section */}
          <div className="p-4 bg-[#1e1e1e] rounded-xl sm:p-6">
            <h2 className="flex items-center gap-2 mb-4 text-lg font-bold text-white sm:text-xl">
              <span className="text-blue-400">📋</span>
              Active Alerts ({alertList.length})
            </h2>

            {alertList.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-gray-400">No alerts yet.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {alertList.map((alert) => (
                  <div
                    key={alert.id}
                    className={`p-4 rounded-lg transition-all duration-200 ${
                      alert.type === "auto"
                        ? "bg-yellow-900/20 border-yellow-600"
                        : "bg-[#272727] border-blue-600"
                    }`}
                  >
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div className="flex-1 min-w-0">
                        <h3 className="mb-1 text-lg font-bold text-white break-words">
                          {alert.title || "No Title"}
                        </h3>
                        <p className="mb-2 text-gray-300 break-words">
                          {alert.message}
                        </p>
                        <div className="flex flex-wrap items-center gap-2 text-xs text-gray-400">
                          <span>{new Date(alert.time).toLocaleString()}</span>
                          <span className="px-2 py-1 rounded bg-[#272727]">
                            {alert.type}
                          </span>
                        </div>
                      </div>

                      {alert.type !== "auto" && (
                        <div className="flex gap-2 mt-2 sm:mt-0 sm:flex-col">
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
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
