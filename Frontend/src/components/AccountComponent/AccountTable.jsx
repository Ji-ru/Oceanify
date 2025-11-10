import React from "react";
import API from "../../api";

const AccountTable = ({ accounts, onEdit, onReload }) => {
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this account?")) return;

    try {
      await API.delete(`/accounts/${id}`);
      onReload();
    } catch (error) {
      console.error("Error deleting account:", error);
    }
  };

  const roleHandler = (role) => (
    role == 'admin' ? 'Admin' : 'User' 
  );

  return (
    <section aria-labelledby="accounts-heading" className="w-full mx-auto px-4 mt-3 mb-3">
      <h2 id="accounts-heading" className="sr-only">Accounts</h2>

      <div className="border border-[#7F7F7F] bg-gradient-to-br from-[#2F72A1] to-black rounded-xl">
        <div className="w-full overflow-x-auto rounded-xl">
          <table className="min-w-full text-sm text-white">
            <thead className="bg-stone-800 text-left">
              <tr>
                <th scope="col" className="px-4 py-3 font-semibold text-gray-300 whitespace-nowrap">#</th>
                <th scope="col" className="px-4 py-3 font-semibold whitespace-nowrap">Role</th>
                <th scope="col" className="px-4 py-3 font-semibold whitespace-nowrap">First Name</th>
                <th scope="col" className="px-4 py-3 font-semibold whitespace-nowrap">Last Name</th>
                <th scope="col" className="px-4 py-3 font-semibold whitespace-nowrap">Email</th>
                <th scope="col" className="px-4 py-3 font-semibold text-right whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody>
              {accounts.map((acc, index) => (
                <tr key={acc.id} className="odd:bg-[#323232]/40 even:bg-[#323232]/20 hover:bg-gray-700 transition-colors">
                  <td className="px-4 py-8 font-mono text-gray-300 align-middle whitespace-nowrap">{index + 1}</td>
                  <td className="px-4 py-8 align-middle whitespace-nowrap">{roleHandler(acc.role)}</td>
                  <td className="px-4 py-8 align-middle whitespace-nowrap">{acc.first_name}</td>
                  <td className="px-4 py-8 align-middle whitespace-nowrap">{acc.last_name}</td>
                  <td className="px-4 py-8 align-middle max-w-[240px]">
                    <span className="block truncate" title={acc.email}>{acc.email}</span>
                  </td>
                  <td className="px-4 py-8 text-right whitespace-nowrap align-sub">
                    <div className="inline-flex gap-2">
                      <button
                        onClick={() => onEdit(acc)}
                        className="px-3 py-1 text-white bg-yellow-500 rounded hover:bg-yellow-600 transition-colors"
                        aria-label={`Edit ${acc.email}`}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(acc.id)}
                        className="px-3 py-1 text-white bg-red-600 rounded hover:bg-red-700 transition-colors"
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
                  <td colSpan={5} className="px-4 py-8">
                    <div className="text-center text-gray-400 bg-gray-800 rounded-lg py-8">
                      <svg
                        className="w-16 h-16 mx-auto mb-4 text-gray-600"
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
                      <p className="mt-1 text-sm text-gray-500">Click "Add Account" to create your first account</p>
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