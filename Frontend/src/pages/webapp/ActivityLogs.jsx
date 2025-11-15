// src/pages/Admin/ActivityLogs.jsx
import { useEffect, useState, useMemo } from "react";
import Navbar from "../../components/Navbar";
import { useActivityLogs } from "../../contexts/ActivityLogContext";
import { usePagination } from "../../hooks/usePagination";

export default function ActivityLogsPage() {
  const { logs, loading, loadLogs, refreshLogs, lastFetched } = useActivityLogs();
  const [filterAction, setFilterAction] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  // Load logs on mount
  useEffect(() => {
    loadLogs(false, 100); // Load last 100 logs
  }, [loadLogs]);

  // Filter logs based on action and search term
  const filteredLogs = useMemo(() => {
    let filtered = logs;

    // Filter by action type
    if (filterAction !== "all") {
      filtered = filtered.filter(log => 
        log.action.toLowerCase().includes(filterAction.toLowerCase())
      );
    }

    // Filter by search term (searches in action and details)
    if (searchTerm.trim()) {
      filtered = filtered.filter(log =>
        log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.details?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return filtered;
  }, [logs, filterAction, searchTerm]);

  // Pagination
  const {
    currentPage,
    totalPages,
    currentData: paginatedLogs,
    nextPage,
    prevPage,
    goToPage,
  } = usePagination(filteredLogs, 20);

  // Get unique action types for filter
  const actionTypes = useMemo(() => {
    const types = new Set();
    logs.forEach(log => {
      const action = log.action.toLowerCase();
      if (action.includes('created')) types.add('created');
      if (action.includes('updated')) types.add('updated');
      if (action.includes('deleted')) types.add('deleted');
    });
    return Array.from(types);
  }, [logs]);

  // Get action badge color
  const getActionBadge = (action) => {
    const lowerAction = action.toLowerCase();
    if (lowerAction.includes('created')) {
      return 'bg-green-500/20 text-green-400';
    } else if (lowerAction.includes('updated')) {
      return 'bg-blue-500/20 text-blue-400';
    } else if (lowerAction.includes('deleted')) {
      return 'bg-red-500/20 text-red-400';
    }
    return 'bg-gray-500/20 text-gray-400';
  };

  return (
    <div className="min-h-screen bg-[#0f0f0f]">
      {/* Navbar */}
      <div className="fixed top-0 left-0 right-0 z-50">
        <Navbar />
      </div>

      {/* Main Content */}
      <div className="flex justify-center pt-20 mx-auto lg:pt-28 lg:px-6">
        <div className="flex flex-col w-full max-w-7xl p-4 space-y-6">
          {/* Header */}
          <div className="flex flex-col gap-4 mb-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold text-white sm:text-3xl">
                Activity Logs
              </h1>
              <p className="mt-1 text-sm text-gray-400 sm:text-base">
                Track all system activities and changes
              </p>
              {lastFetched && (
                <p className="mt-1 text-xs text-gray-500">
                  Last updated: {new Date(lastFetched).toLocaleTimeString()}
                </p>
              )}
            </div>
            <button
              onClick={() => refreshLogs(100)}
              disabled={loading}
              className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Refreshing..." : "Refresh Logs"}
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
            <div className="p-4 bg-[#1e1e1e] rounded-xl">
              <div className="text-sm text-gray-400">Total Logs</div>
              <div className="mt-1 text-2xl font-bold text-white">
                {logs.length}
              </div>
            </div>
            <div className="p-4 bg-[#1e1e1e] rounded-xl">
              <div className="text-sm text-gray-400">Filtered</div>
              <div className="mt-1 text-2xl font-bold text-white">
                {filteredLogs.length}
              </div>
            </div>
            <div className="p-4 bg-[#1e1e1e] rounded-xl">
              <div className="text-sm text-gray-400">Created</div>
              <div className="mt-1 text-2xl font-bold text-green-400">
                {logs.filter(l => l.action.toLowerCase().includes('created')).length}
              </div>
            </div>
            <div className="p-4 bg-[#1e1e1e] rounded-xl">
              <div className="text-sm text-gray-400">Deleted</div>
              <div className="mt-1 text-2xl font-bold text-red-400">
                {logs.filter(l => l.action.toLowerCase().includes('deleted')).length}
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="p-4 bg-[#1e1e1e] rounded-xl">
            <div className="flex flex-col gap-4 sm:flex-row">
              {/* Search */}
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Search logs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full p-3 text-white bg-[#272727] border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              {/* Action Filter */}
              <select
                value={filterAction}
                onChange={(e) => setFilterAction(e.target.value)}
                className="p-3 text-white bg-[#272727] border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value="all">All Actions</option>
                {actionTypes.map(type => (
                  <option key={type} value={type}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Logs Table */}
          <div className="bg-[#1e1e1e] rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              {loading && logs.length === 0 ? (
                <div className="flex items-center justify-center py-12">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-12 h-12 border-4 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
                    <p className="text-gray-400">Loading activity logs...</p>
                  </div>
                </div>
              ) : filteredLogs.length === 0 ? (
                <div className="py-12 text-center">
                  <p className="text-gray-400">No activity logs found</p>
                </div>
              ) : (
                <table className="w-full text-sm text-white">
                  <thead className="text-left bg-[#2a2a2a]">
                    <tr>
                      <th className="px-4 py-3 font-semibold text-gray-300 whitespace-nowrap">
                        Timestamp
                      </th>
                      <th className="px-4 py-3 font-semibold whitespace-nowrap">
                        Action
                      </th>
                      <th className="px-4 py-3 font-semibold whitespace-nowrap">
                        Details
                      </th>
                      <th className="px-4 py-3 font-semibold whitespace-nowrap">
                        User ID
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedLogs.map((log, index) => (
                      <tr
                        key={log.id || index}
                        className="odd:bg-[#323232]/40 even:bg-[#323232]/20 hover:bg-gray-700 transition-colors"
                      >
                        <td className="px-4 py-4 font-mono text-xs text-gray-300 align-middle whitespace-nowrap">
                          {new Date(log.created_at).toLocaleString()}
                        </td>
                        <td className="px-4 py-4 align-middle whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getActionBadge(log.action)}`}>
                            {log.action}
                          </span>
                        </td>
                        <td className="px-4 py-4 align-middle max-w-md">
                          <span className="block truncate text-gray-300" title={log.details}>
                            {log.details || 'N/A'}
                          </span>
                        </td>
                        <td className="px-4 py-4 font-mono text-xs text-gray-400 align-middle whitespace-nowrap">
                          {log.user_id ? log.user_id.substring(0, 8) + '...' : 'System'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex flex-wrap justify-center gap-2 p-4 border-t border-gray-700">
                <button
                  onClick={prevPage}
                  disabled={currentPage === 1}
                  className="px-3 py-1 text-sm font-semibold text-white bg-blue-600 rounded disabled:bg-gray-700"
                >
                  Prev
                </button>
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  let page;
                  if (totalPages <= 5) {
                    page = i + 1;
                  } else if (currentPage <= 3) {
                    page = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    page = totalPages - 4 + i;
                  } else {
                    page = currentPage - 2 + i;
                  }
                  return (
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
                  );
                })}
                <button
                  onClick={nextPage}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 text-sm font-semibold text-white bg-blue-600 rounded disabled:bg-gray-700"
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