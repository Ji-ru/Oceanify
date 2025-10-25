import { useEffect, useState } from "react";
import Navbar from "../../components/Navbar";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

export default function AlertMGMT() {
  const [alertMsg, setAlertMsg] = useState("");
  const [alertList, setAlertList] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [theme, setTheme] = useState("dark");

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

  // 🔹 Load alerts from Supabase
  useEffect(() => {
    const loadAlerts = async () => {
      const { data, error } = await supabase
        .from("alerts")
        .select("*")
        .order("time", { ascending: false });
      if (!error && data) setAlertList(data);
    };
    loadAlerts();
  }, []);

  // 🔹 Auto Alert Generator (local)
  useEffect(() => {
    const interval = setInterval(() => {
      const randomStormLevel = Math.floor(Math.random() * 10);
      if (randomStormLevel > 7) {
        const autoAlert = {
          id: Date.now(),
          message: `⚠️ Auto Alert: Storm intensity ${randomStormLevel} detected at sea.`,
          type: "auto",
          time: new Date().toISOString(),
        };
        setAlertList((prev) => [autoAlert, ...prev]);
      }
    }, 20000);
    return () => clearInterval(interval);
  }, []);

  // 🔹 Send or update alert
  const handleSendAlert = async () => {
    if (!alertMsg.trim()) return;

    const now = new Date().toISOString().slice(0, 19).replace("T", " ");
    if (editingId) {
      // Update existing alert in Supabase
      const { error } = await supabase
        .from("alerts")
        .update({ message: alertMsg, time: now })
        .eq("id", editingId);
      if (!error) {
        setAlertList((prev) =>
          prev.map((a) =>
            a.id === editingId ? { ...a, message: alertMsg, time: now } : a
          )
        );
      }
      setEditingId(null);
      setAlertMsg("");
      return;
    }

    // Insert new alert into Supabase
    const newAlert = { message: alertMsg, type: "custom", time: now };
    const { data, error } = await supabase.from("alerts").insert([newAlert]).select();
    if (error) {
      console.error("Failed to insert alert:", error);
      setAlertList((prev) => [{ ...newAlert, id: Date.now() }, ...prev]); // fallback
    } else {
      setAlertList((prev) => [data[0], ...prev]);
    }
    setAlertMsg("");
  };

  // 🔹 Edit existing alert
  const handleEditAlert = (alert) => {
    setAlertMsg(alert.message);
    setEditingId(alert.id);
  };

  // 🔹 Delete alert
  const handleDeleteAlert = async (id) => {
    const { error } = await supabase.from("alerts").delete().eq("id", id);
    if (!error) setAlertList((prev) => prev.filter((a) => a.id !== id));
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

          <textarea
            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md text-gray-800 dark:text-white bg-gray-50 dark:bg-[#0C0623] focus:ring-2 focus:ring-blue-500 focus:outline-none"
            rows={3}
            placeholder="Type or edit an alert message..."
            value={alertMsg}
            onChange={(e) => setAlertMsg(e.target.value)}
          />

          <button
            onClick={handleSendAlert}
            className={`w-full mt-3 ${
              editingId
                ? "bg-green-600 hover:bg-green-700"
                : "bg-blue-600 hover:bg-blue-700"
            } text-white py-2 rounded-md transition-colors duration-300`}
          >
            {editingId ? "Update Alert" : "Send Alert"}
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
                <p className="font-medium break-words">{alert.message}</p>
                <small className="mt-1 text-gray-600 dark:text-gray-300">
                  {alert.time} ({alert.type})
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
