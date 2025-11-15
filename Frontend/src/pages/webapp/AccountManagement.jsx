// React core
import React, { useState, useEffect, useMemo } from "react";
// Components
import Navbar from "../../components/Navbar";
import AccountTable from "../../components/AccountTable";
import EditAccountModal from "../../components/EditAccountModal";
import CreateAccountModal from "../../components/CreateAccountModal";
// Context
import { useAccounts } from "../../contexts/AccountContext";

/**
 * Displays Account Information of existing users (Admin and Users)
 * Allows creating and updating user accounts
 * @returns existing accounts from the database
 */
const AccountManagementPage = () => {
  // Context: account data, loading state, and reload function
  const { accounts, loading, loadAccounts } = useAccounts();
  // Selected Account for Updating State
  const [editAccount, setEditAccount] = useState(null);
  // Visible or Invisible State of Create Account Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  // Resets whenever events (Insert, Update, and Delete user) happens
  const [lastLoaded, setLastLoaded] = useState(new Date());
  
  // Filter and Search States
  const [filterStatus, setFilterStatus] = useState("all"); // all, active, inactive
  const [filterRole, setFilterRole] = useState("all"); // all, admin, user
  const [searchTerm, setSearchTerm] = useState("");

  // ===============================================
  // DATA LOADING
  // ===============================================

  /**
   * Load existing accounts on initial mount (render/display)
   */
  useEffect(() => {
    loadAccounts();
  }, [loadAccounts]);

  useEffect(() => {
    setLastLoaded(new Date());
  }, [accounts]);

  /**
   * Reload accounts on demand based on event:
   * - Handles reload when inserting new user
   * - Handles reload when updating information of the existing user
   */
  const handleReload = () => {
    // Force refresh when needed
    loadAccounts(true);
  };

  // ===============================================
  // COMPUTED VALUES WITH FILTERS
  // ===============================================

  /**
   * Filter accounts based on status, role, and search term
   */
  const filteredAccounts = useMemo(() => {
    let filtered = accounts;

    // Filter by status
    if (filterStatus !== "all") {
      const isActive = filterStatus === "active";
      filtered = filtered.filter(acc => 
        acc.status === isActive || acc.status === (isActive ? 'true' : 'false')
      );
    }

    // Filter by role
    if (filterRole !== "all") {
      filtered = filtered.filter(acc => 
        acc.role.toLowerCase() === filterRole.toLowerCase()
      );
    }

    // Filter by search term (searches in first name, last name, and email)
    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(acc =>
        acc.first_name?.toLowerCase().includes(search) ||
        acc.last_name?.toLowerCase().includes(search) ||
        acc.email?.toLowerCase().includes(search)
      );
    }

    return filtered;
  }, [accounts, filterStatus, filterRole, searchTerm]);

  /**
   * Total number of accounts (memoized for performance)
   */
  const totalAccounts = useMemo(() => accounts.length, [accounts]);

  /**
   * Total active users (memoized for performance)
   */
  const activeUsers = useMemo(() => 
    accounts.filter(acc => acc.status === true || acc.status === 'true').length, 
    [accounts]
  );

  /**
   * Total inactive users
   */
  const inactiveUsers = useMemo(() => 
    accounts.filter(acc => acc.status === false || acc.status === 'false').length, 
    [accounts]
  );

  /**
   * Admin count
   */
  const adminCount = useMemo(() => 
    accounts.filter(acc => acc.role.toLowerCase() === 'admin').length, 
    [accounts]
  );

  // ===============================================
  // UI RENDERING + IMPLEMENTED FUNCTIONS
  // ===============================================

  return (
    <div className="min-h-screen bg-[#0f0f0f]">
      <div className="fixed top-0 left-0 right-0 z-50">
        <Navbar />
      </div>

      <div className="flex items-center justify-center pt-20 mx-auto lg:p-6 lg:pt-28">
        {/* Content */}
        <div className="flex flex-col w-full p-4 pt-20 mx-auto lg:p-6 lg:pt-24 max-w-7xl">
          <div className="flex flex-col items-start justify-between gap-4 mb-6 lg:flex-row lg:items-center">
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold text-white sm:text-3xl">
                Account Management
              </h1>
              <p className="mt-2 text-sm text-gray-400 sm:text-base">
                Manage user accounts and permissions
              </p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-4 py-2 text-sm text-white transition-all duration-200 bg-green-600 rounded-lg hover:bg-green-700 sm:px-6 sm:py-3 sm:text-base"
            >
              <svg
                className="w-4 h-4 sm:w-5 sm:h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                />
              </svg>
              Add Account
            </button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 gap-4 mb-6 sm:grid-cols-4">
            <div className="p-4 bg-[#1e1e1e] rounded-xl">
              <div className="text-sm text-gray-400">Total Accounts</div>
              <div className="mt-1 text-2xl font-bold text-white">
                {totalAccounts}
              </div>
            </div>
            <div className="p-4 bg-[#1e1e1e] rounded-xl">
              <div className="text-sm text-gray-400">Active Users</div>
              <div className="mt-1 text-2xl font-bold text-green-400">
                {activeUsers}
              </div>
            </div>
            <div className="p-4 bg-[#1e1e1e] rounded-xl">
              <div className="text-sm text-gray-400">Inactive Users</div>
              <div className="mt-1 text-2xl font-bold text-gray-400">
                {inactiveUsers}
              </div>
            </div>
            <div className="p-4 bg-[#1e1e1e] rounded-xl">
              <div className="text-sm text-gray-400">Admins</div>
              <div className="mt-1 text-2xl font-bold text-blue-400">
                {adminCount}
              </div>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="p-4 bg-[#1e1e1e] rounded-xl mb-6">
            <div className="flex flex-col gap-4 lg:flex-row">
              {/* Search */}
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Search by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full p-3 text-white bg-[#272727] border border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none"
                />
              </div>

              {/* Status Filter */}
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="p-3 text-white bg-[#272727] border border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>

              {/* Role Filter */}
              <select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
                className="p-3 text-white bg-[#272727] border border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none"
              >
                <option value="all">All Roles</option>
                <option value="admin">Admin</option>
                <option value="user">User</option>
              </select>

              {/* Clear Filters Button */}
              {(filterStatus !== "all" || filterRole !== "all" || searchTerm) && (
                <button
                  onClick={() => {
                    setFilterStatus("all");
                    setFilterRole("all");
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
              Showing {filteredAccounts.length} of {totalAccounts} accounts
            </div>
          </div>

          {/* Account Table Container */}
          <div className="overflow-x-auto bg-[#1e1e1e] rounded-xl">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-12 h-12 border-4 border-green-600 rounded-full border-t-transparent animate-spin"></div>
                  <p className="text-gray-400">Loading accounts...</p>
                </div>
              </div>
            ) : (
              <AccountTable
                accounts={filteredAccounts}
                onEdit={(acc) => setEditAccount(acc)}
                onReload={handleReload}
              />
            )}
          </div>
        </div>
      </div>

      {/* Create Account Modal */}
      <CreateAccountModal
        show={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onReload={handleReload}
      />

      {/* Edit Account Modal */}
      {editAccount && (
        <EditAccountModal
          account={editAccount}
          onClose={() => setEditAccount(null)}
          onReload={handleReload}
        />
      )}
    </div>
  );
};

export default AccountManagementPage;