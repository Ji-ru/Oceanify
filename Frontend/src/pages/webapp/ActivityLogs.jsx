import { useState, useEffect, useCallback, useMemo } from "react";
import apiClient from "../../utils/apiClient";
import Navbar from "../../components/Navbar";
import { useLocalStorage } from "../../hooks/useLocalStorage";
import { usePagination } from "../../hooks/usePagination";

/**
 * An Activity Logs containing data that was tampered/modified by an admin
 * @returns - Displays a table containing activity logs data fetched from backend to frontend
 */

const ActivityLogs = () => {
  // Stores the lists of activity logs data
  const [logs, setLogs] = useLocalStorage("activityLogs", []);
  // Indicates if the data are currently being fetched
  const [loading, setLoading] = useState(logs.length === 0); // show loading only if no cached logs
  // Renders any error message encountered during fetch
  const [error, setError] = useState(null);
  // Track last fetch time
  const [lastFetch, setLastFetch] = useLocalStorage("activityLogsLastFetch", null);
  // Renders pagination hooks to limit the display of the data
  const { currentPage, totalPages, currentData, nextPage, prevPage, goToPage } =
    usePagination(logs, 10);

  // ===============================================
  // DATA FETCHING
  // ===============================================

  /**
   * Fetches activity logs data
   * Use useCallback to ensure function identity is stable across renders
   */
  const fetchLogs = useCallback(async (forceRefresh = false) => {
    // If we have cached data and it's not a forced refresh, skip fetching
    if (!forceRefresh && logs.length > 0) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await apiClient.get("/activity-logs");
      setLogs(response.data);
      setLastFetch(new Date().toISOString());
      setError(null);
    } catch (err) {
      console.error("Error fetching activity logs:", err);
      setError("Failed to load activity logs");
    } finally {
      setLoading(false);
    }
  }, [logs.length, setLogs, setLastFetch]);

  // ===============================================
  // OPERATIONS
  // ===============================================

  /**
   * Formats a date string into a human-readable timestamp
   *
   * @param {string} dateString ISO date string from the log entry
   * @returns - formatted date and time the data was tampered
   */
  const formatDate = useCallback((dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  }, []);

  /**
   * Automatically fetch logs when the component mounts (render).
   * Only fetches if no cached data exists.
   */
  useEffect(() => {
    fetchLogs(false);
  }, []); // Empty dependency - only run once on mount

  /**
   * Memoized JSX rendering of table rows to avoid re-rendering when unnecessary.
   */
  const renderedLogs = useMemo(() => {
    if (currentData.length === 0) {
      return (
        <tr>
          <td colSpan="4" className="px-6 py-4 text-center text-gray-400">
            No activity logs found
          </td>
        </tr>
      );
    }

    return currentData.map((log) => (
      <tr key={log.id} className="transition-colors hover:bg-gray-750">
        <td className="px-6 py-4 text-sm text-gray-300 whitespace-nowrap">
          {formatDate(log.created_at)}
        </td>
        <td className="px-6 py-4 text-sm text-gray-300">
          <span className="font-mono text-xs">
            {log.user_id ? log.user_id.slice(0, 8) + "..." : "N/A"}
          </span>
        </td>
        <td className="px-6 py-4 text-sm font-medium text-white whitespace-nowrap">
          <span
            className={`px-2 py-1 rounded text-xs ${
              log.action.includes("Created")
                ? "bg-green-600"
                : log.action.includes("Updated")
                ? "bg-blue-600"
                : log.action.includes("Deleted")
                ? "bg-red-600"
                : "bg-gray-600"
            }`}
          >
            {log.action}
          </span>
        </td>
        <td className="px-6 py-4 text-sm text-gray-300">{log.details}</td>
      </tr>
    ));
  }, [currentData, formatDate]);

  // ===============================================
  // UI RENDERING + IMPLEMENTED FUNCTIONS
  // ===============================================

  return (
    <div className="min-h-screen bg-[#0f0f0f]">
      <Navbar />

      <div className="container px-4 py-8 mx-auto mt-20">
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white">Activity Logs</h1>
              <p className="mt-2 text-gray-400">
                Track all user actions and system events
              </p>
              {lastFetch && (
                <p className="mt-1 text-xs text-gray-500">
                  Last updated: {formatDate(lastFetch)}
                </p>
              )}
            </div>
            <button
              onClick={() => fetchLogs(true)}
              disabled={loading}
              className="px-4 py-2 text-white transition-colors bg-blue-600 rounded-lg hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Refreshing...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                  Refresh
                </span>
              )}
            </button>
          </div>
        </div>

        {loading && logs.length === 0 ? (
          <div className="flex items-center justify-center h-64">
            <div className="flex flex-col items-center gap-3">
              <div className="w-12 h-12 border-4 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
              <p className="text-gray-400">Loading activity logs...</p>
            </div>
          </div>
        ) : error ? (
          <div className="p-4 text-red-400 bg-red-900 rounded-lg">{error}</div>
        ) : (
          <div className="overflow-hidden bg-gray-800 rounded-lg shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-300 uppercase">
                      Date & Time
                    </th>
                    <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-300 uppercase">
                      User ID
                    </th>
                    <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-300 uppercase">
                      Action
                    </th>
                    <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-300 uppercase">
                      Details
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-gray-800 divide-y divide-gray-700">
                  {renderedLogs}
                </tbody>
              </table>
            </div>

            {/* Pagination info & controls */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-700">
              <p className="text-sm text-gray-400">
                Showing {logs.length === 0 ? 0 : (currentPage - 1) * 10 + 1} to{" "}
                {Math.min(currentPage * 10, logs.length)} of {logs.length} logs
              </p>

              {totalPages > 1 && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={prevPage}
                    disabled={currentPage === 1}
                    className="px-3 py-1 text-sm font-semibold text-white bg-blue-600 rounded disabled:bg-gray-700 disabled:cursor-not-allowed"
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
                            : "bg-gray-700 text-gray-400 hover:bg-gray-600"
                        }`}
                      >
                        {page}
                      </button>
                    )
                  )}
                  <button
                    onClick={nextPage}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 text-sm font-semibold text-white bg-blue-600 rounded disabled:bg-gray-700 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ActivityLogs;