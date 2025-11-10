// src/pages/Admin/AlertMGMT.jsx
import { useEffect, useState } from "react";
import Navbar from "../../components/Navbar";
import { createClient } from "@supabase/supabase-js";
import API from "../../api";

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

export default function AlertMGMT() {
  const [alertMsg, setAlertMsg] = useState("");
  const [alertTitle, setAlertTitle] = useState(""); // New state for title
  const [alertList, setAlertList] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [theme, setTheme] = useState("dark");
  const [loading, setLoading] = useState(false);

  const predefinedMessages = [
    "⚠️ Strong winds detected: vessels advised to stay in port.",
    "🚨 Tropical storm warning: avoid sailing until further notice.",
    "🌊 Rough sea conditions expected. Exercise caution near coastal areas.",
    "🌧️ Heavy rainfall expected: visibility may be low at sea.",
    "🌀 Typhoon alert: monitor updates and follow safety protocols.",
  ];

  // 🔹 Load theme
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") || "dark";
    setTheme(savedTheme);
    document.documentElement.classList.toggle("dark", savedTheme === "dark");
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    document.documentElement.classList.toggle("dark", newTheme === "dark");
    localStorage.setItem("theme", newTheme);
  };

  // 🔹 Load alerts from Laravel API
  useEffect(() => {
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
    loadAlerts();
  }, []);

  // 🔹 Auto Alert Generator (local) - Also posts to Laravel
  useEffect(() => {
    const interval = setInterval(() => {
      const randomStormLevel = Math.floor(Math.random() * 10);
      if (randomStormLevel > 7) {
        const autoAlert = {
          title: `Auto Alert: Storm Intensity ${randomStormLevel}`,
          message: `⚠️ Auto Alert: Storm intensity ${randomStormLevel} detected at sea.`,
          type: "auto",
          time: new Date().toISOString(),
        };

        // Post to Laravel
        postAlertToLaravel(autoAlert);

        // Update local state
        setAlertList((prev) => [{ ...autoAlert, id: Date.now() }, ...prev]);
      }
    }, 20000);
    return () => clearInterval(interval);
  }, []);

  // 🔹 Post alert to Laravel backend
  const postAlertToLaravel = async (alertData) => {
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
  };

  // 🔹 Send or update alert
  const handleSendAlert = async () => {
    if (!alertMsg.trim() || !alertTitle.trim()) {
      alert("Please provide both title and message");
      return;
    }

    setLoading(true);
    const now = new Date().toISOString();

    if (editingId) {
      // Update existing alert
      const updatedAlert = {
        title: alertTitle,
        message: alertMsg,
        time: now,
      };

      try {
        // Update in Laravel via axios API client
        const response = await API.put("/alerts", updatedAlert);

        if (response.status >= 200 && response.status < 300) {
          setAlertList((prev) =>
            prev.map((a) =>
              a.id === editingId ? { ...a, ...updatedAlert } : a
            )
          );
        } else {
          // Fallback to Supabase
          const { error: updateError } = await supabase
            .from("alerts")
            .update(updatedAlert)
            .eq("id", editingId);
          if (!updateError) {
            setAlertList((prev) =>
              prev.map((a) =>
                a.id === editingId ? { ...a, ...updatedAlert } : a
              )
            );
          }
        }
      } catch (updateError) {
        console.error("Error updating alert:", updateError);
      }

      setEditingId(null);
      setAlertTitle("");
      setAlertMsg("");
      setLoading(false);
      return;
    }

    // Insert new alert
    const newAlert = {
      title: alertTitle,
      message: alertMsg,
      type: "custom",
      time: now,
    };

    try {
      // First try to post to Laravel
      const laravelResult = await postAlertToLaravel(newAlert);

      if (laravelResult) {
        // Use the response from Laravel which includes the ID
        setAlertList((prev) => [laravelResult, ...prev]);
      } else {
        // Fallback to Supabase
        const { data: supabaseData, error: supabaseError } = await supabase
          .from("alerts")
          .insert([newAlert])
          .select();

        if (supabaseError) {
          console.error("Failed to insert alert:", supabaseError);
          // Final fallback to local state
          setAlertList((prev) => [{ ...newAlert, id: Date.now() }, ...prev]);
        } else {
          setAlertList((prev) => [supabaseData[0], ...prev]);
        }
      }
    } catch (createError) {
      console.error("Error creating alert:", createError);
      // Fallback to local state
      setAlertList((prev) => [{ ...newAlert, id: Date.now() }, ...prev]);
    }

    setAlertTitle("");
    setAlertMsg("");
    setLoading(false);
  };

  // 🔹 Edit existing alert
  const handleEditAlert = (alert) => {
    setAlertTitle(alert.title || "");
    setAlertMsg(alert.message);
    setEditingId(alert.id);
  };

  // 🔹 Delete alert
  const handleDeleteAlert = async (id) => {
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
      // Fallback to Supabase
      const { error: supabaseError } = await supabase
        .from("alerts")
        .delete()
        .eq("id", id);
      if (!supabaseError) {
        setAlertList((prev) => prev.filter((a) => a.id !== id));
      }
    }
  };

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
