import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  Save,
  User,
  Mail,
  Phone,
  Building,
  Lock,
  Eye,
  EyeOff,
  CheckCircle,
  Loader2,
} from "lucide-react";
import toast from "react-hot-toast";
import axiosInstance from "../../lib/axiosInstance";
import TPONavigation from "../../components/TPONavigation";

export default function TPOSettingsPage() {
  const { user, refetchUser } = useAuth() as any;

  const [profileForm, setProfileForm] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: user?.phone || "",
    college: user?.college_name || "",
  });

  const [passwordForm, setPasswordForm] = useState({
    current_password: "",
    new_password: "",
    confirm_password: "",
  });

  const [showPw, setShowPw] = useState({ current: false, new: false, confirm: false });
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSavingProfile(true);
      const res = await axiosInstance.put("/api/auth/profile", profileForm);
      if (res.data?.success) {
        toast.success("Profile updated!");
        setProfileSaved(true);
        if (refetchUser) await refetchUser();
        setTimeout(() => setProfileSaved(false), 3000);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to update profile.");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      toast.error("Passwords do not match.");
      return;
    }
    if (passwordForm.new_password.length < 8) {
      toast.error("Password must be at least 8 characters.");
      return;
    }
    try {
      setSavingPassword(true);
      const res = await axiosInstance.put("/api/auth/change-password", {
        current_password: passwordForm.current_password,
        new_password: passwordForm.new_password,
      });
      if (res.data?.success) {
        toast.success("Password changed successfully!");
        setPasswordForm({ current_password: "", new_password: "", confirm_password: "" });
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to change password.");
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div className="flex app-shell max-lg:flex-col bg-gray-50 overflow-hidden">
      <TPONavigation />
      <main className="app-main overflow-y-auto p-4 sm:p-6 lg:p-10">
        <div className="max-w-2xl mx-auto space-y-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
            <p className="text-sm text-gray-500 mt-1">Manage your account profile and security</p>
          </div>

          {/* Profile Card */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-xl">
                {user?.name?.charAt(0)?.toUpperCase()}
              </div>
              <div>
                <h2 className="font-bold text-gray-900">{user?.name}</h2>
                <p className="text-xs text-blue-600 uppercase font-semibold">Placement Officer</p>
              </div>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { label: "Full Name", key: "name", icon: User },
                  { label: "Email", key: "email", icon: Mail, disabled: true },
                  { label: "Phone", key: "phone", icon: Phone },
                  { label: "College", key: "college", icon: Building },
                ].map(({ label, key, icon: Icon, disabled }) => (
                  <div key={key}>
                    <label className="block text-xs font-semibold text-gray-500 mb-1.5">{label}</label>
                    <div className="relative">
                      <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        value={profileForm[key as keyof typeof profileForm]}
                        onChange={(e) => setProfileForm(p => ({ ...p, [key]: e.target.value }))}
                        disabled={disabled}
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-400 focus:outline-none disabled:bg-gray-50 disabled:text-gray-400"
                      />
                    </div>
                  </div>
                ))}
              </div>
              <button type="submit" disabled={savingProfile} className="w-full flex items-center justify-center gap-2 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-semibold disabled:opacity-50">
                {savingProfile ? <Loader2 className="w-4 h-4 animate-spin" /> : profileSaved ? <CheckCircle className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                {savingProfile ? "Saving..." : profileSaved ? "Saved!" : "Save Profile"}
              </button>
            </form>
          </div>

          {/* Password Card */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
            <h2 className="font-bold text-gray-900 flex items-center gap-2">
              <Lock className="w-5 h-5 text-gray-500" /> Change Password
            </h2>
            <p className="text-xs text-gray-500 mt-1">Use a strong password with at least 8 characters</p>
            <form onSubmit={handleChangePassword} className="space-y-4">
              {([
                { label: "Current Password", name: "current_password", key: "current" as const },
                { label: "New Password", name: "new_password", key: "new" as const },
                { label: "Confirm New Password", name: "confirm_password", key: "confirm" as const },
              ] as const).map(({ label, name, key }) => (
                <div key={name}>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5">{label}</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type={showPw[key] ? "text" : "password"}
                      value={passwordForm[name]}
                      onChange={(e) => setPasswordForm(p => ({ ...p, [name]: e.target.value }))}
                      required
                      className="w-full pl-10 pr-10 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-400 focus:outline-none"
                    />
                    <button type="button" onClick={() => setShowPw(p => ({ ...p, [key]: !p[key] }))} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      {showPw[key] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              ))}
              <button type="submit" disabled={savingPassword} className="w-full flex items-center justify-center gap-2 py-2.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors text-sm font-semibold disabled:opacity-50">
                {savingPassword ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                {savingPassword ? "Updating..." : "Change Password"}
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
