import React from "react";
import API from "../api";

const AccountTable = ({ accounts, onEdit, onReload }) => {
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this account?"))
      return;

    try {
      await API.delete(`/accounts/${id}`);
      onReload();
    } catch (error) {
      console.error("Error deleting account:", error);
    }
  };

  const roleHandler = (role) => (role == "admin" ? "Admin" : "User");

  const getStatusBadge = (status) => {
    if (status === true || status === 'true') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-500/20 text-green-400">
          Active
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-500/20 text-gray-400">
          Inactive
        </span>
      );
    }
  };

  return (
    <section
      aria-labelledby="accounts-heading"
      className="w-full px-4 mx-auto mt-3 mb-3"
    >
      <h2 id="accounts-heading" className="sr-only">
        Accounts
      </h2>

      <div className="bg-transparent rounded-xl">
        <div className="w-full overflow-x-auto">
          <table className="w-full text-sm text-white">
            <thead className="text-left bg-[#2a2a2a]">
              <tr>
                <th
                  scope="col"
                  className="px-4 py-3 font-semibold text-gray-300 whitespace-nowrap"
                >
                  #
                </th>
                <th
                  scope="col"
                  className="px-4 py-3 font-semibold whitespace-nowrap"
                >
                  Status
                </th>
                <th
                  scope="col"
                  className="px-4 py-3 font-semibold whitespace-nowrap"
                >
                  Role
                </th>
                <th
                  scope="col"
                  className="px-4 py-3 font-semibold whitespace-nowrap"
                >
                  First Name
                </th>
                <th
                  scope="col"
                  className="px-4 py-3 font-semibold whitespace-nowrap"
                >
                  Last Name
                </th>
                <th
                  scope="col"
                  className="px-4 py-3 font-semibold whitespace-nowrap"
                >
                  Email
                </th>
                <th
                  scope="col"
                  className="px-4 py-3 font-semibold text-right whitespace-nowrap"
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {accounts.map((acc, index) => (
                <tr
                  key={acc.id}
                  className="odd:bg-[#323232]/40 even:bg-[#323232]/20 hover:bg-gray-700 transition-colors"
                >
                  <td className="px-4 py-8 font-mono text-gray-300 align-middle whitespace-nowrap">
                    {index + 1}
                  </td>
                  <td className="px-4 py-8 align-middle whitespace-nowrap">
                    {getStatusBadge(acc.status)}
                  </td>
                  <td className="px-4 py-8 align-middle whitespace-nowrap">
                    {roleHandler(acc.role)}
                  </td>
                  <td className="px-4 py-8 align-middle whitespace-nowrap">
                    {acc.first_name}
                  </td>
                  <td className="px-4 py-8 align-middle whitespace-nowrap">
                    {acc.last_name}
                  </td>
                  <td className="px-4 py-8 align-middle max-w-[240px]">
                    <span className="block truncate" title={acc.email}>
                      {acc.email}
                    </span>
                  </td>
                  <td className="px-4 py-8 text-right whitespace-nowrap align-sub">
                    <div className="inline-flex gap-2">
                      <button
                        onClick={() => onEdit(acc)}
                        className="px-3 py-1 text-white transition-colors bg-yellow-500 rounded hover:bg-yellow-600"
                        aria-label={`Edit ${acc.email}`}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(acc.id)}
                        className="px-3 py-1 text-white transition-colors bg-red-600 rounded hover:bg-red-700"
                        aria-label={`Delete ${acc.email}`}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {accounts.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8">
                    <div className="flex items-center justify-center w-full py-16 text-center text-gray-400 bg-[#2a2a2a] rounded-lg">
                      <div className="max-w-md mx-auto">
                        <svg
                          className="w-16 h-16 mx-auto mb-4 text-gray-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          aria-hidden="true"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 009.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                          />
                        </svg>
                        <p className="text-lg font-medium">No accounts found</p>
                        <p className="mt-1 text-sm text-gray-400">
                          Click "Add Account" to create your first account
                        </p>
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
};

export default AccountTable;