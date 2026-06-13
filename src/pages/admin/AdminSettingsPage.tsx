import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import adminService from "../../lib/adminService";
import axiosInstance from "../../lib/axiosInstance";
import {
  Save,
  User,
  Mail,
  Phone,
  BookOpen,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  CheckCircle,
  Shield,
} from "lucide-react";
import toast from "react-hot-toast";
import AdminNavigation from "../../components/AdminNavigation";

export default function AdminSettingsPage() {
  const { user, refetchUser } = useAuth() as any;

  const [profileForm, setProfileForm] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: user?.phone || "",
    department: user?.department || "",
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
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <AdminNavigation />
      <main className="flex-1 overflow-y-auto p-6 lg:p-10">
        <div className="max-w-2xl mx-auto space-y-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
            <p className="text-sm text-gray-500 mt-1">Manage your account profile and security</p>
          </div>

          {/* Profile Section */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-purple-600 flex items-center justify-center text-white font-bold text-xl">
                {user?.name?.charAt(0)?.toUpperCase()}
              </div>
              <div>
                <h2 className="font-bold text-gray-900">{user?.name}</h2>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <Shield className="w-3.5 h-3.5 text-purple-500" />
                  <span className="text-xs text-purple-600 font-semibold uppercase">System Administrator</span>
                </div>
              </div>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      value={profileForm.name}
                      onChange={(e) => setProfileForm(p => ({ ...p, name: e.target.value }))}
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-400 focus:outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="email"
                      value={profileForm.email}
                      disabled
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm bg-gray-50 text-gray-400"
                    />
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5">Phone Number</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      value={profileForm.phone}
                      onChange={(e) => setProfileForm(p => ({ ...p, phone: e.target.value }))}
                      placeholder="+91 XXXXXXXXXX"
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-400 focus:outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5">Department</label>
                  <div className="relative">
                    <BookOpen className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      value={profileForm.department}
                      onChange={(e) => setProfileForm(p => ({ ...p, department: e.target.value }))}
                      placeholder="e.g. Administration"
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-400 focus:outline-none"
                    />
                  </div>
                </div>
              </div>
              <button type="submit" disabled={savingProfile} className="w-full flex items-center justify-center gap-2 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-semibold disabled:opacity-50">
                {savingProfile ? <Loader2 className="w-4 h-4 animate-spin" /> : profileSaved ? <CheckCircle className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                {savingProfile ? "Saving..." : profileSaved ? "Saved!" : "Save Profile"}
              </button>
            </form>
          </div>

          {/* Password Section */}
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
                      className="w-full pl-10 pr-10 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-400 focus:outline-none"
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

          {/* Info Card */}
          <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 flex gap-3">
            <Shield className="w-5 h-5 text-purple-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-purple-800">Administrator Account</p>
              <p className="text-xs text-purple-600 mt-0.5">
                This account has full system access. Keep your credentials secure and use a strong password.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
