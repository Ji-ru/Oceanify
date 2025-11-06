import React, { useEffect, useState } from "react";
import { getAccounts, createAccount, updateAccount, deleteAccount } from "../services/accountService";

const AccountManager = () => {
  const [accounts, setAccounts] = useState([]);
  const [form, setForm] = useState({ email: "", first_name: "", last_name: "" });

  useEffect(() => {
    loadAccounts();
  }, []);

  const loadAccounts = async () => {
    try {
      setAccounts(getAccounts);
    } catch (error) {
    }
  };

  const handleCreate = async () => {
    await createAccount(form);
    setForm({ email: "", first_name: "", last_name: "" });
    loadAccounts();
  };

  const handleUpdate = async (id) => {
    await updateAccount(id, { first_name: "Updated", last_name: "User" });
    loadAccounts();
  };

  const handleDelete = async (id) => {
    await deleteAccount(id);
    loadAccounts();
  };

  return (
    <main className="bg-[#323232] text-white min-h-screen">
      <div className="w-full mx-auto px-4 py-6 max-w-sm">
        <header className="mb-6">
          <h1 className="text-2xl font-bold">Account Management</h1>
        </header>

        {/* Form */}
        <section aria-labelledby="account-form-heading" className="mb-6">
          <h2 id="account-form-heading" className="sr-only">Create account</h2>
          <form
            className="flex flex-col gap-3"
            onSubmit={(e) => {
              e.preventDefault();
              handleCreate();
            }}
          >
            <label className="flex flex-col gap-1">
              <span className="text-sm text-gray-200">Email</span>
              <input
                type="email"
                className="border border-[#7F7F7F] bg-[#2C2C2C] rounded px-3 py-2 w-full placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600"
                placeholder="email@example.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-sm text-gray-200">First name</span>
              <input
                type="text"
                className="border border-[#7F7F7F] bg-[#2C2C2C] rounded px-3 py-2 w-full placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600"
                placeholder="First name"
                value={form.first_name}
                onChange={(e) => setForm({ ...form, first_name: e.target.value })}
                required
              />
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-sm text-gray-200">Last name</span>
              <input
                type="text"
                className="border border-[#7F7F7F] bg-[#2C2C2C] rounded px-3 py-2 w-full placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600"
                placeholder="Last name"
                value={form.last_name}
                onChange={(e) => setForm({ ...form, last_name: e.target.value })}
                required
              />
            </label>

            <div className="pt-1">
              <button
                type="submit"
                className="w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                Add
              </button>
            </div>
          </form>
        </section>

        {/* Accounts List */}
        <section aria-labelledby="accounts-list-heading" className="">
          <h2 id="accounts-list-heading" className="sr-only">Accounts</h2>
          <div className="space-y-3 border border-[#7F7F7F] bg-[#2C2C2C] p-4 rounded-xl">
            {accounts.length > 0 && (
              <ul role="list" className="divide-y divide-[#3a3a3a]">
                {accounts.map((acc, index) => (
                  <li key={acc.id} className="py-3 first:pt-0 last:pb-0">
                    <article className="grid grid-cols-1 gap-3">
                      <header className="flex items-center justify-between text-gray-300 text-sm">
                        <span className="font-mono">#{index + 1}</span>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleUpdate(acc.id)}
                            className="bg-yellow-500 text-white px-3 py-1 rounded hover:bg-yellow-600"
                            aria-label={`Update ${acc.email}`}
                          >
                            Update
                          </button>
                          <button
                            onClick={() => handleDelete(acc.id)}
                            className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
                            aria-label={`Delete ${acc.email}`}
                          >
                            Delete
                          </button>
                        </div>
                      </header>

                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <p className="text-gray-400">First name</p>
                          <p className="text-white">{acc.first_name}</p>
                        </div>
                        <div>
                          <p className="text-gray-400">Last name</p>
                          <p className="text-white">{acc.last_name}</p>
                        </div>
                        <div className="col-span-2">
                          <p className="text-gray-400">Email</p>
                          <p className="truncate">{acc.email}</p>
                        </div>
                      </div>
                    </article>
                  </li>
                ))}
              </ul>
            )}

            {accounts.length === 0 && (
              <p className="text-center py-6 text-gray-400 bg-gray-800 rounded-lg">
                No accounts found
              </p>
            )}
          </div>
        </section>
      </div>
    </main>
  );
};

export default AccountManager;
