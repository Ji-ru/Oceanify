// React core
import React, { useState, useEffect } from "react";
// Components
import Navbar from "../../components/Navbar";
import { useNavigate } from "react-router-dom";
import AccountTable from "../../components/AccountTable";
import EditAccountModal from "../../components/EditAccountModal";
import CreateAccountModal from "../../components/CreateAccountModal";
// Context
import { useAccounts } from "../../contexts/AccountContext";

const AccountManagementPage = () => {
  const { accounts, loading, loadAccounts } = useAccounts();
  const [editAccount, setEditAccount] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // This will only fetch if accounts are empty
    loadAccounts();
  }, []);

  const handleReload = () => {
    // Force refresh when needed
    loadAccounts(true);
  };

  return (
    <div className="min-h-screen text-white bg-[#0C0623]">
      {/* Navbar fixed */}
      <div className="fixed top-0 left-0 right-0 z-50">
        <Navbar />
      </div>

      {/* Content */}
      <div className="flex flex-col w-full p-6 pt-16 mx-auto max-w-7xl">
        {/* Page Header with Add Button */}
        <div className="flex flex-col items-start justify-between gap-4 mb-6 md:flex-row md:items-center">
          <div>
            <h1 className="mt-5 text-3xl font-bold">Account Management</h1>
            <p className="mt-2 text-gray-400">
              Manage user accounts and permissions
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-6 py-3 mt-5 text-white transition-colors duration-200 bg-green-600 rounded-lg hover:bg-green-700 md:mt-0"
          >
            <svg
              className="w-5 h-5"
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

        {/* Stats Card (Optional) */}
        <div className="grid grid-cols-1 gap-4 mb-6 md:grid-cols-3">
          <div className="p-4 bg-gray-800 rounded-lg">
            <div className="text-sm text-gray-400">Total Accounts</div>
            <div className="mt-1 text-2xl font-bold">{accounts.length}</div>
          </div>
          <div className="p-4 bg-gray-800 rounded-lg">
            <div className="text-sm text-gray-400">Active Users</div>
            <div className="mt-1 text-2xl font-bold">{accounts.length}</div>
          </div>
          <div className="p-4 bg-gray-800 rounded-lg">
            <div className="text-sm text-gray-400">Last Updated</div>
            <div className="mt-1 text-sm font-medium text-gray-300">Just now</div>
          </div>
        </div>

        {/* Account Table */}
        <div className="overflow-x-auto bg-gray-800 rounded-lg">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="flex flex-col items-center gap-3">
                <div className="w-12 h-12 border-4 border-green-600 rounded-full border-t-transparent animate-spin"></div>
                <p className="text-gray-400">Loading accounts...</p>
              </div>
            </div>
          ) : (
            <AccountTable
              accounts={accounts}
              onEdit={(acc) => setEditAccount(acc)}
              onReload={handleReload}
            />
          )}
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