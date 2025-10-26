// src/pages/Admin/AlertMGMT.jsx
import { useEffect, useState } from "react";
import Navbar from "../../components/Navbar";
import { createClient } from "@supabase/supabase-js";

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
    "⚠️ Strong winds detected — vessels advised to stay in port.",
    "🚨 Tropical storm warning — avoid sailing until further notice.",
    "🌊 Rough sea conditions expected. Exercise caution near coastal areas.",
    "🌧️ Heavy rainfall expected — visibility may be low at sea.",
    "🌀 Typhoon alert — monitor updates and follow safety protocols.",
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
        // Update in Laravel
        const response = await fetch("http://localhost:8000/api/alerts", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            "X-CSRF-TOKEN":
              document
                .querySelector('meta[name="csrf-token"]')
                ?.getAttribute("content") || "",
          },
          credentials: "include",
          body: JSON.stringify(updatedAlert),
        });

        if (response.ok) {
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
      const response = await fetch("http://localhost:8000/api/alerts", {
        method: "DELETE",
        headers: {
          Accept: "application/json",
          "X-CSRF-TOKEN":
            document
              .querySelector('meta[name="csrf-token"]')
              ?.getAttribute("content") || "",
        },
        credentials: "include",
      });

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
    <div className="min-h-screen transition-colors duration-300 bg-gray-100 text-gray-900 dark:bg-[#0C0623] dark:text-white">
      <Navbar />

      {/* Theme toggle */}
      <div className="flex justify-end p-4">
        <button
          onClick={toggleTheme}
          className="px-4 py-2 text-sm text-gray-800 bg-gray-200 rounded-lg hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-100"
        >
          Toggle {theme === "dark" ? "Light" : "Dark"} Mode
        </button>
      </div>

      <div className="flex flex-col items-center justify-center py-6">
        <h1 className="mb-2 text-3xl font-bold">Alert Management</h1>
        <p className="mb-6 text-gray-600 dark:text-gray-400">
          Send, edit, or manage alerts for seafarers
        </p>

        {/* Input Section */}
        <div className="bg-white dark:bg-[#1A103A] p-6 rounded-2xl shadow-lg w-[90%] max-w-lg">
          {/* Alert Title Input */}
          <div className="mb-4">
            <label className="block mb-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
              Alert Title *
            </label>
            <input
              type="text"
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md text-gray-800 dark:text-white bg-gray-50 dark:bg-[#0C0623] focus:ring-2 focus:ring-blue-500 focus:outline-none"
              placeholder="Enter alert title..."
              value={alertTitle}
              onChange={(e) => setAlertTitle(e.target.value)}
            />
          </div>

          <label className="block mb-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
            Choose Predefined Message
          </label>
          <select
            onChange={(e) => setAlertMsg(e.target.value)}
            className="w-full mb-3 p-2 rounded-md border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-[#0C0623] text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
            value={alertMsg || ""}
          >
            <option value="">-- Select a message --</option>
            {predefinedMessages.map((msg, index) => (
              <option key={index} value={msg}>
                {msg.length > 60 ? msg.slice(0, 60) + "..." : msg}
              </option>
            ))}
          </select>

          <label className="block mb-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
            Alert Message *
          </label>
          <textarea
            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md text-gray-800 dark:text-white bg-gray-50 dark:bg-[#0C0623] focus:ring-2 focus:ring-blue-500 focus:outline-none"
            rows={3}
            placeholder="Type or edit an alert message..."
            value={alertMsg}
            onChange={(e) => setAlertMsg(e.target.value)}
          />

          <button
            onClick={handleSendAlert}
            disabled={loading}
            className={`w-full mt-3 ${
              editingId
                ? "bg-green-600 hover:bg-green-700"
                : "bg-blue-600 hover:bg-blue-700"
            } text-white py-2 rounded-md transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {loading ? "Sending..." : editingId ? "Update Alert" : "Send Alert"}
          </button>
        </div>

        {/* Alert List */}
        <div className="mt-8 w-[90%] max-w-lg space-y-3">
          {alertList.length === 0 ? (
            <p className="text-center text-gray-500 dark:text-gray-400">
              No alerts yet.
            </p>
          ) : (
            alertList.map((alert) => (
              <div
                key={alert.id}
                className={`p-4 rounded-lg border transition-colors duration-300 flex flex-col ${
                  alert.type === "auto"
                    ? "bg-yellow-100 dark:bg-yellow-800 border-yellow-400"
                    : "bg-green-100 dark:bg-green-800 border-green-400"
                }`}
              >
                <h3 className="mb-2 text-lg font-bold break-words">
                  {alert.title || "No Title"}
                </h3>
                <p className="mb-2 font-medium break-words">{alert.message}</p>
                <small className="text-gray-600 dark:text-gray-300">
                  {new Date(alert.time).toLocaleString()} ({alert.type})
                </small>

                {alert.type !== "auto" && (
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => handleEditAlert(alert)}
                      className="flex-1 py-1 text-sm text-white transition-colors bg-yellow-500 rounded-md hover:bg-yellow-600"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteAlert(alert.id)}
                      className="flex-1 py-1 text-sm text-white transition-colors bg-red-500 rounded-md hover:bg-red-600"
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
