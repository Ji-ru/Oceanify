import React from "react";
import axios from "axios";

const AccountTable = ({ accounts, onEdit, onReload }) => {
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this account?"))
      return;

    try {
      await axios.delete(`http://localhost:8000/api/accounts/${id}`);
      onReload();
    } catch (error) {
      console.error("Error deleting account:", error);
    }
  };

  return (
    <div className="space-y-3 border-3 border-[#7F7F7F] bg-gradient-to-br from-[#2F72A1] to-black p-5 rounded-xl">

      {/* Table Header */}
      <div className="border-3 border-[#7F7F7F] bg-stone-800 grid grid-cols-5 gap-4 items-center text-white rounded-lg shadow p-4 font-semibold">
        <div className="font-mono text-gray-300">#</div>
        <div>First Name</div>
        <div>Last Name</div>
        <div>Email</div>
        <div className="text-right">Actions</div>
      </div>

      {/* Table Rows */}
      {accounts.map((acc, index) => (
        <div
          key={acc.id}
          className="border-3 border-[#7F7F7F] bg-[#323232]/50 grid grid-cols-5 gap-4 items-center text-white rounded-lg shadow p-4 hover:bg-gray-700 transition-colors duration-200"
        >
          <div className="font-mono text-gray-300">{index + 1}</div>
          <div>{acc.first_name}</div>
          <div>{acc.last_name}</div>
          <div className="truncate">{acc.email}</div>
          <div className="flex justify-end gap-2">
            <button
              onClick={() => onEdit(acc)}
              className="px-3 py-1 text-white bg-yellow-500 rounded hover:bg-yellow-600 transition-colors duration-200"
            >
              Edit
            </button>
            <button
              onClick={() => handleDelete(acc.id)}
              className="px-3 py-1 text-white bg-red-600 rounded hover:bg-red-700 transition-colors duration-200"
            >
              Delete
            </button>
          </div>
        </div>
      ))}

      {/* Empty State */}
      {accounts.length === 0 && (
        <div className="py-8 text-center text-gray-400 bg-gray-800 rounded-lg">
          <svg
            className="w-16 h-16 mx-auto mb-4 text-gray-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
            />
          </svg>
          <p className="text-lg font-medium">No accounts found</p>
          <p className="mt-1 text-sm text-gray-500">
            Click "Add Account" to create your first account
          </p>
        </div>
      )}
    </div>
  );
};

export default AccountTable;