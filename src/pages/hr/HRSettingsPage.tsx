import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import HRNavigation from "../../components/HRNavigation";
import { useAuth } from "../../context/AuthContext";
import axiosInstance from "../../lib/axiosInstance";
import {
  User,
  Mail,
  Building,
  Phone,
  Save,
  Lock,
  Eye,
  EyeOff,
  CheckCircle,
  Loader2,
} from "lucide-react";
import toast from "react-hot-toast";

export default function HRSettingsPage() {
  const { user, refetchUser } = useAuth() as any;
  const navigate = useNavigate();

  const [profileForm, setProfileForm] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: user?.phone || "",
    company: user?.college_name || "",
    designation: user?.designation || "",
  });

  const [passwordForm, setPasswordForm] = useState({
    current_password: "",
    new_password: "",
    confirm_password: "",
  });

  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setProfileForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPasswordForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSavingProfile(true);
      const res = await axiosInstance.put("/api/auth/profile", profileForm);
      if (res.data?.success) {
        toast.success("Profile updated successfully!");
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
      toast.error("New passwords do not match.");
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

  const InputField = ({
    label,
    name,
    value,
    onChange,
    icon: Icon,
    type = "text",
    disabled = false,
    placeholder = "",
  }: any) => (
    <div>
      <label className="block text-xs font-semibold text-gray-500 mb-1.5">{label}</label>
      <div className="relative">
        <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          disabled={disabled}
          placeholder={placeholder}
          className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-400 focus:outline-none disabled:bg-gray-50 disabled:text-gray-400"
        />
      </div>
    </div>
  );

  return (
    <div className="flex app-shell max-lg:flex-col bg-gray-50 overflow-hidden">
      <HRNavigation />
      <main className="app-main overflow-y-auto p-4 sm:p-6 lg:p-10">
        <div className="max-w-2xl mx-auto space-y-8">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
            <p className="text-sm text-gray-500 mt-1">Manage your account profile and security</p>
          </div>

          {/* Profile Section */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-emerald-500 flex items-center justify-center text-white font-bold text-xl">
                {user?.name?.charAt(0)?.toUpperCase()}
              </div>
              <div>
                <h2 className="font-bold text-gray-900">{user?.name}</h2>
                <p className="text-xs text-emerald-600 uppercase font-semibold">HR Recruiter</p>
              </div>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <InputField label="Full Name" name="name" value={profileForm.name} onChange={handleProfileChange} icon={User} />
                <InputField label="Email Address" name="email" value={profileForm.email} onChange={handleProfileChange} icon={Mail} disabled />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <InputField label="Phone Number" name="phone" value={profileForm.phone} onChange={handleProfileChange} icon={Phone} placeholder="+91 XXXXXXXXXX" />
                <InputField label="Company / Organization" name="company" value={profileForm.company} onChange={handleProfileChange} icon={Building} />
              </div>
              <InputField label="Designation" name="designation" value={profileForm.designation} onChange={handleProfileChange} icon={User} placeholder="e.g. Senior Recruiter" />

              <button
                type="submit"
                disabled={savingProfile}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors text-sm font-semibold disabled:opacity-50"
              >
                {savingProfile ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : profileSaved ? (
                  <CheckCircle className="w-4 h-4" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                {savingProfile ? "Saving..." : profileSaved ? "Saved!" : "Save Profile"}
              </button>
            </form>
          </div>

          {/* Change Password Section */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
            <div>
              <h2 className="font-bold text-gray-900 flex items-center gap-2">
                <Lock className="w-5 h-5 text-gray-500" />
                Change Password
              </h2>
              <p className="text-xs text-gray-500 mt-1">Use a strong password with at least 8 characters</p>
            </div>

            <form onSubmit={handleChangePassword} className="space-y-4">
              {[
                { label: "Current Password", name: "current_password", key: "current" as const },
                { label: "New Password", name: "new_password", key: "new" as const },
                { label: "Confirm New Password", name: "confirm_password", key: "confirm" as const },
              ].map(({ label, name, key }) => (
                <div key={name}>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5">{label}</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type={showPasswords[key] ? "text" : "password"}
                      name={name}
                      value={passwordForm[name as keyof typeof passwordForm]}
                      onChange={handlePasswordChange}
                      required
                      className="w-full pl-10 pr-10 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-400 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords((p) => ({ ...p, [key]: !p[key] }))}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPasswords[key] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              ))}

              <button
                type="submit"
                disabled={savingPassword}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors text-sm font-semibold disabled:opacity-50"
              >
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
