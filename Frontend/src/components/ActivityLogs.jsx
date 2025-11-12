import { useState, useEffect } from 'react';
import apiClient from '../utils/apiClient';
import Navbar from '../components/Navbar';

const ActivityLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/activity-logs');
      setLogs(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching activity logs:', err);
      setError('Failed to load activity logs');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-gray-900">
      <Navbar />
      
      <div className="container px-4 py-8 mx-auto mt-20">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-white">Activity Logs</h1>
          <p className="mt-2 text-gray-400">Track all user actions and system events</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-white">Loading activity logs...</div>
          </div>
        ) : error ? (
          <div className="p-4 text-red-400 bg-red-900 rounded-lg">
            {error}
          </div>
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
                  {logs.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="px-6 py-4 text-center text-gray-400">
                        No activity logs found
                      </td>
                    </tr>
                  ) : (
                    logs.map((log) => (
                      <tr key={log.id} className="transition-colors hover:bg-gray-750">
                        <td className="px-6 py-4 text-sm text-gray-300 whitespace-nowrap">
                          {formatDate(log.created_at)}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-300">
                          <span className="font-mono text-xs">
                            {log.user_id ? log.user_id.slice(0, 8) + '...' : 'N/A'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm font-medium text-white whitespace-nowrap">
                          <span className={`px-2 py-1 rounded text-xs ${
                            log.action.includes('Created') ? 'bg-green-600' :
                            log.action.includes('Updated') ? 'bg-blue-600' :
                            log.action.includes('Deleted') ? 'bg-red-600' :
                            'bg-gray-600'
                          }`}>
                            {log.action}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-300">
                          {log.details}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            
            {/* Pagination info */}
            {logs.length > 0 && (
              <div className="px-6 py-4 border-t border-gray-700">
                <p className="text-sm text-gray-400">
                  Showing {logs.length} activity log{logs.length !== 1 ? 's' : ''}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ActivityLogs;