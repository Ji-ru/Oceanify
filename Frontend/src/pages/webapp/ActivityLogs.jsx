import { useState, useEffect, useCallback, useMemo } from "react";
import apiClient from "../../utils/apiClient";
import Navbar from "../../components/Navbar";
import { useLocalStorage } from "../../hooks/useLocalStorage";
import { usePagination } from "../../hooks/usePagination";

/**
 * An Acitivity Logs containing data that was tampered/modified by an admin
 * @returns - Displays a table containing activity logs data fetched from backend to frontend
 */

const ActivityLogs = () => {
  // Stores the lists of activity logs data
  const [logs, setLogs] = useLocalStorage("activityLogs", []);
  // Indicates if the data are currently being fetched
  const [loading, setLoading] = useState(logs.length === 0); // show loading only if no cached logs
  // Renders any error message encountered during fetch
  const [error, setError] = useState(null);
  // Renders pagination hooks to limit the display of the data
  const { currentPage, totalPages, currentData, nextPage, prevPage, goToPage } =
    usePagination(logs, 6);

  // ===============================================
  // DATA FETCHING
  // ===============================================

  /**
   * Fetches activity logs data
   * Use useCallback to ensure function identity is stable across renders
   */
  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiClient.get("/activity-logs");
      setLogs(response.data);
      setError(null);
    } catch (err) {
      console.error("Error fetching activity logs:", err);
      setError("Failed to load activity logs");
    } finally {
      setLoading(false);
    }
  }, [setLogs]);

  // ===============================================
  // OPERATIONS
  // ===============================================

  /**
   * Formats a date string into a human-readable timestamp
   *
   * @param {string} dateString ISO date string from the log entry
   * @returns - formatted date and time the data was tampered
   */
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  /**
   * Automatically fetch logs when the component mounts (render).
   * Cleans up safely if the component unmounts mid-request.
   */
  useEffect(() => {
    let isMounted = true;

    const loadLogs = async () => {
      try {
        setLoading(true);
        const response = await apiClient.get("/activity-logs");
        if (isMounted) {
          setLogs(response.data);
          setError(null);
        }
      } catch (err) {
        if (isMounted) {
          console.error("Error fetching activity logs:", err);
          setError("Failed to load activity logs");
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadLogs();

    return () => {
      isMounted = false;
    };
  }, [fetchLogs, setLogs]);

  /**
   * Memoized JSX rendering of table rows to avoid re-rendering when unnecessary.
   */
  const renderedLogs = useMemo(() => {
    if (logs.length === 0) {
      return (
        <tr>
          <td colSpan="4" className="px-6 py-4 text-center text-gray-400">
            No activity logs found
          </td>
        </tr>
      );
    }

    return logs.map((log) => (
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

      <div className="container px-4 py-8 mx-auto mt-10">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-white">Activity Logs</h1>
          <p className="mt-2 text-gray-400">
            Track all user actions and system events
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-white">Loading activity logs...</div>
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

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 px-6 py-4 border-t border-gray-700">
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
        )}
      </div>
    </div>
  );
};

export default ActivityLogs;
