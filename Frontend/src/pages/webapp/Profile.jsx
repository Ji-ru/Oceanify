import { useEffect, useState } from "react";
import supabase from "../../supabaseClient";
import { useAuth } from "../../contexts/AuthContext";
import Navbar from "../../components/Navbar";
import ProfileLogo from "../../assets/images/default_profile.jpg";

export default function Profile() {
  const { user, userRole, isAdmin, loading } = useAuth();

  const [profile, setProfile] = useState({
    email: "",
    first_name: "",
    last_name: "",
    role: "",
  });
  const [isSaving, setIsSaving] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const loadProfile = async () => {
      if (!user) return;
      setFetching(true);
      setError("");
      setSuccess("");
      try {
        const { data, error: fetchError } = await supabase
          .from("profiles")
          .select("email, first_name, last_name, role")
          .eq("id", user.id)
          .single();

        if (fetchError) throw fetchError;

        setProfile({
          email: data?.email || user.email || "",
          first_name: data?.first_name || "",
          last_name: data?.last_name || "",
          role: data?.role || userRole || "user",
        });
      } catch (e) {
        setError(e?.message || "Failed to load profile.");
        setProfile({
          email: user?.email || "",
          first_name: "",
          last_name: "",
          role: userRole || "user",
        });
      } finally {
        setFetching(false);
      }
    };

    if (!loading) {
      loadProfile();
    }
  }, [user, userRole, loading]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfile((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!user) return;
    setIsSaving(true);
    setError("");
    setSuccess("");
    try {
      const payload = {
        first_name: profile.first_name?.trim() || null,
        last_name: profile.last_name?.trim() || null,
      };
      if (isAdmin) {
        payload.role = profile.role || "user";
      }

      const { error: updateError } = await supabase
        .from("profiles")
        .update(payload)
        .eq("id", user.id);

      if (updateError) throw updateError;
      setSuccess("Profile updated successfully.");
    } catch (e) {
      setError(e?.message || "Failed to save profile.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <article className="min-h-screen pt-24 pb-16 bg-[#0f0f0f] text-white">
      <Navbar />
      <div className="max-w-3xl px-4 mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold">Profile</h1>
          <p className="text-gray-400">View and update your information.</p>
        </header>

        <section className="grid gap-6 md:grid-cols-[160px_1fr] items-start">
          <div className="w-40 h-40 overflow-hidden rounded-full bg-[#1e1e1e] flex items-center justify-center">
            <img
              src={ProfileLogo}
              alt="default_profile"
              className="object-cover w-full h-full"
            />
          </div>

          <form onSubmit={handleSave} className="p-6 rounded-lg bg-[#1a1a1a]">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="col-span-2">
                <label className="block mb-1 text-sm text-gray-300">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={profile.email}
                  readOnly
                  className="w-full px-3 py-2 text-gray-300 bg-[#111] border border-[#333] rounded outline-none cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block mb-1 text-sm text-gray-300">
                  First name
                </label>
                <input
                  type="text"
                  name="first_name"
                  value={profile.first_name}
                  onChange={handleChange}
                  placeholder="Enter first name"
                  className="w-full px-3 py-2 text-white bg-[#111] border border-[#333] rounded outline-none"
                />
              </div>

              <div>
                <label className="block mb-1 text-sm text-gray-300">
                  Last name
                </label>
                <input
                  type="text"
                  name="last_name"
                  value={profile.last_name}
                  onChange={handleChange}
                  placeholder="Enter last name"
                  className="w-full px-3 py-2 text-white bg-[#111] border border-[#333] rounded outline-none"
                />
              </div>

              <div className="col-span-2">
                <label className="block mb-1 text-sm text-gray-300">Role</label>
                {isAdmin ? (
                  <select
                    name="role"
                    value={profile.role}
                    onChange={handleChange}
                    className="w-full px-3 py-2 text-white bg-[#111] border border-[#333] rounded outline-none"
                  >
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </select>
                ) : (
                  <div className="inline-flex px-2 py-1 text-xs font-semibold rounded bg-blue-600/80">
                    {profile.role?.toUpperCase() || "USER"}
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3 mt-6">
              <button
                type="submit"
                disabled={isSaving || fetching}
                className="px-4 py-2 font-semibold text-white bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-60"
              >
                {isSaving ? "Saving..." : "Save changes"}
              </button>

              {(fetching || loading) && (
                <span className="text-sm text-gray-400">
                  Loading profile...
                </span>
              )}
            </div>

            {error && <p className="mt-3 text-sm text-red-400">{error}</p>}
            {success && (
              <p className="mt-3 text-sm text-green-400">{success}</p>
            )}
          </form>
        </section>
      </div>
    </article>
  );
}

// export default function Profile() {

//   return (
//     <article className="min-h-screen bg-[#0f0f0f]">
//       {/* Default Image */}
//       <section>
//         {/* <img src={require('../assets/images/default_profile.jpg')} alt="default_page" /> */}
//       </section>

//       {/* Personal Information */}
//       <section>HELLO</section>

//       {/* Number of Times the user called for rescue */}
//       <section></section>
//     </article>
//   );
// }
