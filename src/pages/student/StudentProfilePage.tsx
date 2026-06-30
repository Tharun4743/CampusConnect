import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { 
  User, 
  BookOpen, 
  Wrench, 
  Plus, 
  Trash2, 
  Pencil,
  Clock,
  ExternalLink,
  Linkedin,
  Github,
  Award,
  BookMarked,
  ShieldAlert
} from "lucide-react";
import toast from "react-hot-toast";
import StudentNavigation from "../../components/StudentNavigation";
import { 
  getStudentProfile, 
  updateProfile, 
  updateSkills, 
  updateCertifications, 
  updateProjects 
} from "../../lib/profileService";

export default function StudentProfilePage() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<"personal" | "academic" | "professional">("personal");
  const [editingCertId, setEditingCertId] = useState<string | null>(null);
  const [editingProjId, setEditingProjId] = useState<string | null>(null);

  // Local form states
  const [personalForm, setPersonalForm] = useState({
    dateOfBirth: "",
    gender: "",
    bloodGroup: "",
    phoneNumber: "",
    parentPhoneNumber: "",
    address: { street: "", city: "", state: "", pincode: "", country: "India" },
    emergencyContact: { name: "", relationship: "", phoneNumber: "" },
    linkedin_url: "",
    github_url: ""
  });

  const [academicForm, setAcademicForm] = useState({
    class10Percentage: 0,
    class12Percentage: 0,
    diplomaPercentage: 0,
    cgpa: 0,
    currentArrears: 0,
    historyOfArrears: 0,
    schoolName: "",
    schoolCity: "",
    collegeName: "",
    collegeCity: ""
  });

  const [techSkillInput, setTechSkillInput] = useState("");
  const [techSkillLevel, setTechSkillLevel] = useState<"Beginner" | "Intermediate" | "Advanced">("Intermediate");

  const [softSkillInput, setSoftSkillInput] = useState("");
  const [softSkillLevel, setSoftSkillLevel] = useState<"Beginner" | "Intermediate" | "Advanced">("Intermediate");

  // Expanded editor sections for arrays
  const [showCertForm, setShowCertForm] = useState(false);
  const [newCert, setNewCert] = useState({ name: "", issuedBy: "", issueDate: "", expiryDate: "", credentialUrl: "" });

  const [showProjForm, setShowProjForm] = useState(false);
  const [newProj, setNewProj] = useState({ 
    title: "", description: "", technologies: "", startDate: "", endDate: "", githubUrl: "", liveUrl: "" 
  });

  const loadProfile = async () => {
    try {
      setLoading(true);
      const res = await getStudentProfile();
      if (res.success && res.data) {
        const p = res.data;
        setProfile(p);
        
        // Initialize form states
        if (p.personalInfo) {
          setPersonalForm({
            dateOfBirth: p.personalInfo.dateOfBirth || "",
            gender: p.personalInfo.gender || "",
            bloodGroup: p.personalInfo.bloodGroup || "",
            phoneNumber: p.personalInfo.phoneNumber || "",
            parentPhoneNumber: p.personalInfo.parentPhoneNumber || "",
            address: {
              street: p.personalInfo.address?.street || "",
              city: p.personalInfo.address?.city || "",
              state: p.personalInfo.address?.state || "",
              pincode: p.personalInfo.address?.pincode || "",
              country: p.personalInfo.address?.country || "India"
            },
            emergencyContact: {
              name: p.personalInfo.emergencyContact?.name || "",
              relationship: p.personalInfo.emergencyContact?.relationship || "",
              phoneNumber: p.personalInfo.emergencyContact?.phoneNumber || ""
            },
            linkedin_url: p.personalInfo.linkedin_url || "",
            github_url: p.personalInfo.github_url || ""
          });
        }

        if (p.academicInfo) {
          setAcademicForm({
            class10Percentage: p.academicInfo.class10Percentage || 0,
            class12Percentage: p.academicInfo.class12Percentage || 0,
            diplomaPercentage: p.academicInfo.diplomaPercentage || 0,
            cgpa: parseFloat(String(p.academicInfo.cgpa || 0)) || 0,
            currentArrears: p.academicInfo.currentArrears || 0,
            historyOfArrears: p.academicInfo.historyOfArrears || 0,
            schoolName: p.academicInfo.schoolName || "",
            schoolCity: p.academicInfo.schoolCity || "",
            collegeName: p.academicInfo.collegeName || "VSB",
            collegeCity: p.academicInfo.collegeCity || ""
          });
        }
      }
    } catch (err) {
      console.error("Failed to load student profile:", err);
      toast.error("Failed to load your profile details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const saveGeneralProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (activeTab === "personal") {
        if (personalForm.phoneNumber && !/^\d{10}$/.test(personalForm.phoneNumber)) {
          toast.error("Your primary phone number must be exactly 10 digits.");
          setSaving(false);
          return;
        }
        if (personalForm.emergencyContact?.phoneNumber && !/^\d{10}$/.test(personalForm.emergencyContact.phoneNumber)) {
          toast.error("The emergency phone number must be exactly 10 digits.");
          setSaving(false);
          return;
        }

        const res = await updateProfile({ personalInfo: personalForm });
        if (res.success) {
          setProfile(res.data);
          toast.success("Personal information successfully saved.");
        }
      } else if (activeTab === "academic") {
        if (academicForm.class10Percentage < 0 || academicForm.class10Percentage > 100) {
          toast.error("10th class percentage must be between 0 and 100%.");
          setSaving(false);
          return;
        }
        if (academicForm.class12Percentage < 0 || academicForm.class12Percentage > 100) {
          toast.error("12th class percentage must be between 0 and 100%.");
          setSaving(false);
          return;
        }
        if (academicForm.diplomaPercentage < 0 || academicForm.diplomaPercentage > 100) {
          toast.error("Diploma percentage must be between 0 and 100%.");
          setSaving(false);
          return;
        }

        const res = await updateProfile({ academicInfo: academicForm });
        if (res.success) {
          setProfile(res.data);
          toast.success("Academic records updated.");
        }
      }
    } catch (err: any) {
      console.error("Profile updates failed:", err);
      toast.error(err.response?.data?.message || "Failed to save details to server.");
    } finally {
      setSaving(false);
    }
  };

  // Skill Management
  const handleAddSkill = async (e: React.FormEvent, type: "technical" | "soft") => {
    e.preventDefault();
    const skillName = type === "technical" ? techSkillInput.trim() : softSkillInput.trim();
    const skillLevel = type === "technical" ? techSkillLevel : softSkillLevel;
    
    if (!skillName) return;

    const currentList = type === "technical" 
      ? profile?.professionalInfo?.technical_skills || [] 
      : profile?.professionalInfo?.soft_skills || [];

    if (currentList.some((s: string) => s.split(":")[0].toLowerCase() === skillName.toLowerCase())) {
      toast.error(`The skill "${skillName}" already exists in your ${type} skills.`);
      return;
    }

    try {
      const res = await updateSkills("add", skillName, type, skillLevel);
      if (res.success) {
        setProfile((prev: any) => ({
          ...prev,
          professionalInfo: {
            ...prev.professionalInfo,
            skills: res.data.skills,
            technical_skills: res.data.technical_skills,
            soft_skills: res.data.soft_skills
          }
        }));
        if (type === "technical") {
          setTechSkillInput("");
          setTechSkillLevel("Intermediate");
        } else {
          setSoftSkillInput("");
          setSoftSkillLevel("Intermediate");
        }
        toast.success(`Skill "${skillName}" added.`);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Could not save skill.");
    }
  };

  const handleRemoveSkill = async (skillString: string, type: "technical" | "soft") => {
    const skillName = skillString.split(":")[0];
    try {
      const res = await updateSkills("remove", skillName, type);
      if (res.success) {
        setProfile((prev: any) => ({
          ...prev,
          professionalInfo: {
            ...prev.professionalInfo,
            skills: res.data.skills,
            technical_skills: res.data.technical_skills,
            soft_skills: res.data.soft_skills
          }
        }));
        toast.success("Skill removed.");
      }
    } catch (err: any) {
      toast.error("Could not remove skill.");
    }
  };

  // Certifications list admin
  const handleAddCert = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCert.name || !newCert.issuedBy || !newCert.issueDate) {
      toast.error("Certificate title, issuer, and date parameters are mandatory.");
      return;
    }
    try {
      const action = editingCertId ? "update" : "add";
      const payload = editingCertId ? { ...newCert, _id: editingCertId } : newCert;
      const res = await updateCertifications(action, payload);
      if (res.success) {
        setProfile((prev: any) => ({
          ...prev,
          professionalInfo: res.data
        }));
        setNewCert({ name: "", issuedBy: "", issueDate: "", expiryDate: "", credentialUrl: "" });
        setEditingCertId(null);
        setShowCertForm(false);
        toast.success(editingCertId ? "Certificate updated." : "New certificate added successfully.");
      }
    } catch (err) {
      toast.error("Could not add certificate.");
    }
  };

  const handleRemoveCert = async (id: string) => {
    try {
      const res = await updateCertifications("delete", { _id: id });
      if (res.success) {
        setProfile((prev: any) => ({
          ...prev,
          professionalInfo: res.data
        }));
        toast.success("Certificate deleted successfully.");
      }
    } catch (err) {
      toast.error("Failed to delete certification record.");
    }
  };

  // Projects list edits
  const handleAddProj = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProj.title || !newProj.description) {
      toast.error("Project title, and descriptions are mandatory.");
      return;
    }
    try {
      const formatted = {
        title: newProj.title,
        description: newProj.description,
        startDate: newProj.startDate || undefined,
        endDate: newProj.endDate || undefined,
        githubUrl: newProj.githubUrl || undefined,
        liveUrl: newProj.liveUrl || undefined,
        technologies: newProj.technologies ? newProj.technologies.split(",").map(s => s.trim()) : []
      };

      const action = editingProjId ? "update" : "add";
      const payload = editingProjId ? { ...formatted, _id: editingProjId } : formatted;
      const res = await updateProjects(action, payload);
      if (res.success) {
        setProfile((prev: any) => ({ ...prev, professionalInfo: res.data }));
        setNewProj({ title: "", description: "", technologies: "", startDate: "", endDate: "", githubUrl: "", liveUrl: "" });
        setEditingProjId(null);
        setShowProjForm(false);
        toast.success(editingProjId ? "Project updated." : "Personal portfolio project registered.");
      }
    } catch (err) {
      toast.error("Failed to register project.");
    }
  };

  const handleRemoveProj = async (id: string) => {
    try {
      const res = await updateProjects("delete", { _id: id });
      if (res.success) {
        setProfile((prev: any) => ({ ...prev, professionalInfo: res.data }));
        toast.success("Project removed from list.");
      }
    } catch (err) {
      toast.error("Failed to purge academic project.");
    }
  };

  const getSkillBadgeColor = (level: string) => {
    switch (level?.toLowerCase()) {
      case "advanced": return "bg-emerald-100 text-emerald-800 border-emerald-200";
      case "beginner": return "bg-gray-100 text-gray-700 border-gray-200";
      default: return "bg-sky-100 text-sky-850 border-sky-200";
    }
  };

  if (loading) {
    return (
      <div className="flex app-shell max-lg:flex-col bg-gray-50 overflow-hidden">
        <StudentNavigation />
        <main className="flex-1 min-w-0 overflow-x-hidden flex items-center justify-center p-4">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </main>
      </div>
    );
  }

  const technicalSkillsList = profile?.professionalInfo?.technical_skills || [];
  const softSkillsList = profile?.professionalInfo?.soft_skills || [];
  const certsList = profile?.professionalInfo?.certifications || [];
  const projectsList = profile?.professionalInfo?.projects || [];

  return (
    <div className="flex app-shell max-lg:flex-col bg-gray-50 overflow-hidden">
      <StudentNavigation />

      <main className="flex-1 min-w-0 overflow-x-hidden p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6 overflow-y-auto max-w-7xl mx-auto w-full">
        
        {/* Workspace Title bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-sky-100 pb-5">
          <div className="space-y-1">
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 tracking-tight">Onboarding Profile Builder</h1>
            <p className="text-xs text-gray-500">Complete your profile records sheets to make your candidacy searchable for HR corporate reviewers.</p>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-655 bg-white p-2.5 rounded-xl border border-sky-100">
            <Clock className="w-4 h-4 text-sky-400" />
            <span>Updated: <strong className="text-gray-800">{profile?.profileSettings?.lastProfileUpdate ? new Date(profile.profileSettings.lastProfileUpdate).toLocaleDateString() : "Just Now"}</strong></span>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex border border-sky-100 p-1 bg-white rounded-xl max-w-lg shadow-sm">
          <button
            onClick={() => setActiveTab("personal")}
            className={`flex-1 py-2.5 px-4 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === "personal" ? "bg-sky-500 text-white shadow-sm hover:bg-sky-600" : "text-sky-600 hover:text-sky-700 hover:bg-sky-50"
            }`}
          >
            <User className="w-4 h-4" />
            <span>Personal Details</span>
          </button>
          <button
            onClick={() => setActiveTab("academic")}
            className={`flex-1 py-2.5 px-4 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === "academic" ? "bg-sky-500 text-white shadow-sm hover:bg-sky-600" : "text-sky-600 hover:text-sky-700 hover:bg-sky-50"
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Academic Scores</span>
          </button>
          <button
            onClick={() => setActiveTab("professional")}
            className={`flex-1 py-2.5 px-4 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === "professional" ? "bg-sky-500 text-white shadow-sm hover:bg-sky-600" : "text-sky-600 hover:text-sky-700 hover:bg-sky-50"
            }`}
          >
            <Wrench className="w-4 h-4" />
            <span>Skills & Projects</span>
          </button>
        </div>

        {/* Form Container */}
        <div className="bg-white rounded-2xl border border-sky-100 shadow-sm">
          
          {/* 1. PERSONAL TAB */}
          {activeTab === "personal" && (
            <form onSubmit={saveGeneralProfile} className="p-6 lg:p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* DOB */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-700 block">Date of Birth</label>
                  <input
                    type="date"
                    required
                    value={personalForm.dateOfBirth}
                    onChange={(e) => setPersonalForm({ ...personalForm, dateOfBirth: e.target.value })}
                    className="w-full bg-sky-50/30 border border-sky-100 rounded-xl px-4 py-2.5 text-xs text-gray-900 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all font-mono"
                  />
                </div>

                {/* Gender */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-700 block">Gender</label>
                  <select
                    required
                    value={personalForm.gender}
                    onChange={(e) => setPersonalForm({ ...personalForm, gender: e.target.value })}
                    className="w-full bg-sky-50/30 border border-sky-100 rounded-xl px-4 py-2.5 text-xs text-gray-900 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all"
                  >
                    <option value="">Select gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                {/* Blood Group */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-700 block">Blood Group</label>
                  <select
                    value={personalForm.bloodGroup}
                    onChange={(e) => setPersonalForm({ ...personalForm, bloodGroup: e.target.value })}
                    className="w-full bg-sky-50/30 border border-sky-100 rounded-xl px-4 py-2.5 text-xs text-gray-900 focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                  >
                    <option value="">Select blood type</option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                  </select>
                </div>

                {/* Phone */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-700 block">Phone Number (10 digits)</label>
                  <input
                    type="tel"
                    required
                    placeholder="e.g. 9876543210"
                    value={personalForm.phoneNumber}
                    onChange={(e) => setPersonalForm({ ...personalForm, phoneNumber: e.target.value })}
                    className="w-full bg-sky-50/30 border border-sky-100 rounded-xl px-4 py-2.5 text-xs text-gray-900 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all font-mono"
                  />
                </div>

                {/* Parent Phone */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-700 block">Parent Phone Number</label>
                  <input
                    type="tel"
                    placeholder="e.g. 9112233445"
                    value={personalForm.parentPhoneNumber}
                    onChange={(e) => setPersonalForm({ ...personalForm, parentPhoneNumber: e.target.value })}
                    className="w-full bg-sky-50/30 border border-sky-100 rounded-xl px-4 py-2.5 text-xs text-gray-900 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 font-mono"
                  />
                </div>
              </div>

              {/* Profiles & Links */}
              <div className="border-t border-sky-100 pt-5 space-y-4">
                <span className="text-xs font-extrabold uppercase text-gray-400 tracking-wider block">Portfolio Profiles & Web Presence</span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-bold text-gray-700 flex items-center gap-1">
                      <Linkedin className="w-3.5 h-3.5 text-sky-600" /> LinkedIn Profile URL
                    </label>
                    <input
                      type="url"
                      placeholder="e.g. https://linkedin.com/in/username"
                      value={personalForm.linkedin_url}
                      onChange={(e) => setPersonalForm({ ...personalForm, linkedin_url: e.target.value })}
                      className="w-full bg-sky-50/30 border border-sky-100 rounded-xl px-4 py-2.5 text-xs text-gray-900 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 font-mono"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-bold text-gray-755 flex items-center gap-1">
                      <Github className="w-3.5 h-3.5 text-gray-800" /> GitHub Profile URL
                    </label>
                    <input
                      type="url"
                      placeholder="e.g. https://github.com/username"
                      value={personalForm.github_url}
                      onChange={(e) => setPersonalForm({ ...personalForm, github_url: e.target.value })}
                      className="w-full bg-sky-50/30 border border-sky-100 rounded-xl px-4 py-2.5 text-xs text-gray-900 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Mailing Address */}
              <div className="border-t border-sky-100 pt-5 space-y-4">
                <span className="text-xs font-extrabold uppercase text-gray-400 tracking-wider block">Mailing Address</span>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="md:col-span-2 space-y-1.5">
                    <label className="text-[10px] uppercase font-bold text-gray-500">Street Address</label>
                    <input
                      type="text"
                      placeholder="e.g. Flat 302, Phase 2, Royal Heights"
                      value={personalForm.address.street}
                      onChange={(e) => setPersonalForm({
                        ...personalForm,
                        address: { ...personalForm.address, street: e.target.value }
                      })}
                      className="w-full bg-sky-50/30 border border-sky-100 rounded-xl px-4 py-2.5 text-xs text-gray-900 focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-bold text-gray-500">City / District</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Tirupur"
                      value={personalForm.address.city}
                      onChange={(e) => setPersonalForm({
                        ...personalForm,
                        address: { ...personalForm.address, city: e.target.value }
                      })}
                      className="w-full bg-sky-50/30 border border-sky-100 rounded-xl px-4 py-2.5 text-xs text-gray-900 focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-bold text-gray-500">State / Region</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Tamil Nadu"
                      value={personalForm.address.state}
                      onChange={(e) => setPersonalForm({
                        ...personalForm,
                        address: { ...personalForm.address, state: e.target.value }
                      })}
                      className="w-full bg-sky-50/30 border border-sky-100 rounded-xl px-4 py-2.5 text-xs text-gray-900 focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-bold text-gray-500">Pincode / Zip</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 641601"
                      value={personalForm.address.pincode}
                      onChange={(e) => setPersonalForm({
                        ...personalForm,
                        address: { ...personalForm.address, pincode: e.target.value }
                      })}
                      className="w-full bg-sky-50/30 border border-sky-100 rounded-xl px-4 py-2.5 text-xs text-gray-900 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 font-mono"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-bold text-gray-500">Country</label>
                    <input
                      type="text"
                      required
                      value={personalForm.address.country}
                      onChange={(e) => setPersonalForm({
                        ...personalForm,
                        address: { ...personalForm.address, country: e.target.value }
                      })}
                      className="w-full bg-sky-50/30 border border-sky-100 rounded-xl px-4 py-2.5 text-xs text-gray-900 focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                    />
                  </div>
                </div>
              </div>

              {/* Emergency Contact */}
              <div className="border-t border-sky-100 pt-5 space-y-4">
                <span className="text-xs font-extrabold uppercase text-gray-400 tracking-wider block">Emergency Contact Person</span>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-bold text-gray-500">contact full Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Rajesh Kumar"
                      value={personalForm.emergencyContact.name}
                      onChange={(e) => setPersonalForm({
                        ...personalForm,
                        emergencyContact: { ...personalForm.emergencyContact, name: e.target.value }
                      })}
                      className="w-full bg-sky-50/30 border border-sky-100 rounded-xl px-4 py-2.5 text-xs text-gray-900 focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-bold text-gray-500">Relationship</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Father"
                      value={personalForm.emergencyContact.relationship}
                      onChange={(e) => setPersonalForm({
                        ...personalForm,
                        emergencyContact: { ...personalForm.emergencyContact, relationship: e.target.value }
                      })}
                      className="w-full bg-sky-50/30 border border-sky-100 rounded-xl px-4 py-2.5 text-xs text-gray-900 focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-bold text-gray-500">Phone Number (10 digits)</label>
                    <input
                      type="tel"
                      required
                      placeholder="e.g. 9876543210"
                      value={personalForm.emergencyContact.phoneNumber}
                      onChange={(e) => setPersonalForm({
                        ...personalForm,
                        emergencyContact: { ...personalForm.emergencyContact, phoneNumber: e.target.value }
                      })}
                      className="w-full bg-sky-50/30 border border-sky-100 rounded-xl px-4 py-2.5 text-xs text-gray-900 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="border-t border-sky-100 pt-6 flex justify-end">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 bg-sky-500 hover:bg-sky-600 disabled:bg-sky-300 text-white font-extrabold text-xs tracking-wider uppercase rounded-xl transition-all cursor-pointer flex items-center gap-2 shadow-sm"
                >
                  {saving ? "Saving Fields..." : "Commit Personal Info"}
                </button>
              </div>
            </form>
          )}

          {/* 2. ACADEMIC TAB */}
          {activeTab === "academic" && (
            <form onSubmit={saveGeneralProfile} className="p-6 lg:p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* 10th Marks */}
                <div className="space-y-4 p-5 bg-white rounded-2xl border border-sky-100 shadow-xs">
                  <span className="text-xs font-extrabold uppercase text-gray-700 tracking-wider block">Class 10th / Secondary Boards</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] uppercase font-bold text-gray-700">Aggregate Percentage (%)</label>
                      <input
                        type="number"
                        step="0.01"
                        required
                        max="100"
                        min="0"
                        value={academicForm.class10Percentage || ""}
                        onChange={(e) => setAcademicForm({ ...academicForm, class10Percentage: parseFloat(e.target.value) || 0 })}
                        className="w-full bg-sky-50/30 border border-sky-100 rounded-xl px-4 py-2.5 text-xs text-gray-900 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 font-mono"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-bold text-gray-700">School Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. St. Joseph's High School"
                      value={academicForm.schoolName}
                      onChange={(e) => setAcademicForm({ ...academicForm, schoolName: e.target.value })}
                      className="w-full bg-sky-50/30 border border-sky-100 rounded-xl px-4 py-2.5 text-xs text-gray-900 focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-bold text-gray-700">School City</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Tirupur"
                      value={academicForm.schoolCity}
                      onChange={(e) => setAcademicForm({ ...academicForm, schoolCity: e.target.value })}
                      className="w-full bg-sky-50/30 border border-sky-100 rounded-xl px-4 py-2.5 text-xs text-gray-900 focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                    />
                  </div>
                </div>

                {/* 12th or Diploma Marks */}
                <div className="space-y-4 p-5 bg-white rounded-2xl border border-sky-100 shadow-xs">
                  <span className="text-xs font-extrabold uppercase text-gray-700 tracking-wider block">Class 12th / Diploma Records</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] uppercase font-bold text-gray-700">12th Percentage (%)</label>
                      <input
                        type="number"
                        step="0.01"
                        max="100"
                        min="0"
                        placeholder="N/A"
                        value={academicForm.class12Percentage || ""}
                        onChange={(e) => setAcademicForm({ ...academicForm, class12Percentage: parseFloat(e.target.value) || 0 })}
                        className="w-full bg-sky-50/30 border border-sky-100 rounded-xl px-4 py-2.5 text-xs text-gray-900 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 font-mono"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] uppercase font-bold text-gray-700">Diploma Percentage (%)</label>
                      <input
                        type="number"
                        step="0.01"
                        max="100"
                        min="0"
                        placeholder="N/A"
                        value={academicForm.diplomaPercentage || ""}
                        onChange={(e) => setAcademicForm({ ...academicForm, diplomaPercentage: parseFloat(e.target.value) || 0 })}
                        className="w-full bg-sky-50/30 border border-sky-100 rounded-xl px-4 py-2.5 text-xs text-gray-900 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 font-mono"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-bold text-gray-755">College / High School Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Little Flower Junior College"
                      value={academicForm.collegeName}
                      onChange={(e) => setAcademicForm({ ...academicForm, collegeName: e.target.value })}
                      className="w-full bg-sky-50/30 border border-sky-100 rounded-xl px-4 py-2.5 text-xs text-gray-900 focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-bold text-gray-755">College / High School City</label>
                    <input
                      type="text"
                      placeholder="e.g. Tirupur"
                      value={academicForm.collegeCity}
                      onChange={(e) => setAcademicForm({ ...academicForm, collegeCity: e.target.value })}
                      className="w-full bg-sky-50/30 border border-sky-100 rounded-xl px-4 py-2.5 text-xs text-gray-900 focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                    />
                  </div>
                </div>

              </div>

              {/* Arrears Tracking & CGPA */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* University CGPA */}
                <div className="p-5 bg-white rounded-2xl border border-sky-100 shadow-xs space-y-4">
                  <span className="text-xs font-extrabold uppercase text-gray-700 tracking-wider block">University CGPA</span>
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-bold text-gray-700">CGPA (out of 10.0)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="10"
                      placeholder="e.g. 8.75"
                      value={academicForm.cgpa || ""}
                      onChange={(e) => setAcademicForm({ ...academicForm, cgpa: parseFloat(e.target.value) || 0 })}
                      className="w-full bg-sky-50/30 border border-sky-100 rounded-xl px-4 py-2.5 text-xs text-gray-900 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 font-mono"
                    />
                    <p className="text-[10px] text-gray-500">Enter your overall cumulative CGPA across completed semesters.</p>
                  </div>
                </div>

                {/* Arrears History */}
                <div className="p-5 bg-white rounded-2xl border border-sky-100 shadow-xs space-y-4">
                  <span className="text-xs font-extrabold uppercase text-gray-700 tracking-wider block flex items-center gap-1">
                    <ShieldAlert className="w-4 h-4 text-amber-500" /> Standing Arrears & History
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] uppercase font-bold text-gray-700">Current Arrears</label>
                      <input
                        type="number"
                        min="0"
                        placeholder="0"
                        value={academicForm.currentArrears}
                        onChange={(e) => setAcademicForm({ ...academicForm, currentArrears: parseInt(e.target.value) || 0 })}
                        className="w-full bg-sky-50/30 border border-sky-100 rounded-xl px-4 py-2.5 text-xs text-gray-900 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 font-mono"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] uppercase font-bold text-gray-700">History of Arrears</label>
                      <input
                        type="number"
                        min="0"
                        placeholder="0"
                        value={academicForm.historyOfArrears}
                        onChange={(e) => setAcademicForm({ ...academicForm, historyOfArrears: parseInt(e.target.value) || 0 })}
                        className="w-full bg-sky-50/30 border border-sky-100 rounded-xl px-4 py-2.5 text-xs text-gray-900 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 font-mono"
                      />
                    </div>
                  </div>
                  <p className="text-[10px] text-gray-400">Specify standing paper backlogs and total cumulative cleared backlogs.</p>
                </div>

              </div>

              {/* Submit Button */}
              <div className="border-t border-sky-100 pt-6 flex justify-end">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 bg-sky-500 hover:bg-sky-600 disabled:bg-sky-300 text-white font-extrabold text-xs tracking-wider uppercase rounded-xl transition-all cursor-pointer shadow-md shadow-sky-500/10"
                >
                  {saving ? "Updating Marks..." : "Commit Academic Records"}
                </button>
              </div>
            </form>
          )}

          {/* 3. SKILLS & PROJECTS TAB */}
          {activeTab === "professional" && (
            <div className="p-6 lg:p-8 space-y-8">

              {/* Combined Technical & Soft Skills sections */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* 1. TECHNICAL SKILLS PANEL */}
                <div className="p-5 bg-white rounded-2xl border border-sky-100 shadow-xs space-y-4">
                  <div>
                    <h3 className="font-bold text-sm text-gray-900 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <BookMarked className="w-4 h-4 text-sky-500" /> Technical Skills
                      </span>
                      <span className="text-[10px] font-mono text-gray-400 bg-sky-50 px-2 py-0.5 rounded">
                        {technicalSkillsList.length} tags
                      </span>
                    </h3>
                    <p className="text-[10px] text-gray-500 mt-1">Add programming languages, core libraries, frameworks, cloud databases, etc.</p>
                  </div>

                  <form onSubmit={(e) => handleAddSkill(e, "technical")} className="flex gap-2">
                    <input
                      type="text"
                      required
                      placeholder="e.g. React, Node.js"
                      value={techSkillInput}
                      onChange={(e) => setTechSkillInput(e.target.value)}
                      className="flex-1 bg-sky-50 border border-sky-100 rounded-xl px-3 py-1.5 text-xs text-gray-900 focus:border-sky-500"
                    />
                    <select
                      value={techSkillLevel}
                      onChange={(e: any) => setTechSkillLevel(e.target.value)}
                      className="bg-sky-50 border border-sky-100 rounded-xl px-2 py-1.5 text-xs text-gray-800"
                    >
                      <option value="Beginner">Beginner</option>
                      <option value="Intermediate">Intermediate</option>
                      <option value="Advanced">Advanced</option>
                    </select>
                    <button
                      type="submit"
                      className="p-2 bg-sky-500 hover:bg-sky-600 rounded-xl text-white transition-all cursor-pointer shrink-0"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </form>

                  <div className="flex flex-wrap gap-2 pt-2">
                    {technicalSkillsList.length === 0 ? (
                      <p className="text-[10px] text-gray-400 italic">No technical skills added yet.</p>
                    ) : (
                      technicalSkillsList.map((skillStr: string) => {
                        const [skillName, skillLvl] = skillStr.split(":");
                        return (
                          <span
                            key={skillStr}
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-bold rounded-lg border ${getSkillBadgeColor(skillLvl)}`}
                          >
                            <span>{skillName}</span>
                            <span className="text-[8px] uppercase tracking-wider opacity-60">({skillLvl || "Intermediate"})</span>
                            <button
                              type="button"
                              onClick={() => handleRemoveSkill(skillStr, "technical")}
                              className="hover:text-red-500 font-extrabold transition-colors cursor-pointer text-xs ml-1"
                            >
                              &times;
                            </button>
                          </span>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* 2. SOFT SKILLS PANEL */}
                <div className="p-5 bg-white rounded-2xl border border-sky-100 shadow-xs space-y-4">
                  <div>
                    <h3 className="font-bold text-sm text-gray-900 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Wrench className="w-4 h-4 text-teal-500" /> Soft Skills
                      </span>
                      <span className="text-[10px] font-mono text-gray-400 bg-teal-50 px-2 py-0.5 rounded text-teal-700">
                        {softSkillsList.length} tags
                      </span>
                    </h3>
                    <p className="text-[10px] text-gray-500 mt-1">Specify personal attributes, languages, team tools or work qualities.</p>
                  </div>

                  <form onSubmit={(e) => handleAddSkill(e, "soft")} className="flex gap-2">
                    <input
                      type="text"
                      required
                      placeholder="e.g. Communication, Leadership"
                      value={softSkillInput}
                      onChange={(e) => setSoftSkillInput(e.target.value)}
                      className="flex-1 bg-sky-50 border border-sky-100 rounded-xl px-3 py-1.5 text-xs text-gray-900 focus:border-sky-500"
                    />
                    <select
                      value={softSkillLevel}
                      onChange={(e: any) => setSoftSkillLevel(e.target.value)}
                      className="bg-sky-50 border border-sky-100 rounded-xl px-2 py-1.5 text-xs text-gray-800"
                    >
                      <option value="Beginner">Beginner</option>
                      <option value="Intermediate">Intermediate</option>
                      <option value="Advanced">Advanced</option>
                    </select>
                    <button
                      type="submit"
                      className="p-2 bg-sky-500 hover:bg-sky-600 rounded-xl text-white transition-all cursor-pointer shrink-0"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </form>

                  <div className="flex flex-wrap gap-2 pt-2">
                    {softSkillsList.length === 0 ? (
                      <p className="text-[10px] text-gray-400 italic">No soft skills added yet.</p>
                    ) : (
                      softSkillsList.map((skillStr: string) => {
                        const [skillName, skillLvl] = skillStr.split(":");
                        return (
                          <span
                            key={skillStr}
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-bold rounded-lg border ${getSkillBadgeColor(skillLvl)}`}
                          >
                            <span>{skillName}</span>
                            <span className="text-[8px] uppercase tracking-wider opacity-60">({skillLvl || "Intermediate"})</span>
                            <button
                              type="button"
                              onClick={() => handleRemoveSkill(skillStr, "soft")}
                              className="hover:text-red-500 font-extrabold transition-colors cursor-pointer text-xs ml-1"
                            >
                              &times;
                            </button>
                          </span>
                        );
                      })
                    )}
                  </div>
                </div>

              </div>

              {/* Certifications and Projects (maintaining fully working states) */}
              <div className="p-5 bg-white rounded-2xl border border-sky-100 shadow-sm space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-bold text-sm text-gray-900 flex items-center gap-1.5">
                      <Award className="w-4 h-4 text-emerald-500" /> Certificates & Licenses
                    </h3>
                    <p className="text-[11px] text-gray-500 mt-0.5">List professional course completions and credential links.</p>
                  </div>
                  <button
                    onClick={() => {
                      setEditingCertId(null);
                      setNewCert({ name: "", issuedBy: "", issueDate: "", expiryDate: "", credentialUrl: "" });
                      setShowCertForm(!showCertForm);
                    }}
                    className="py-1 px-3 border border-sky-100 hover:bg-sky-50 hover:text-sky-700 transition-all rounded-lg text-xs font-bold font-mono text-sky-600 flex items-center gap-1.5 cursor-pointer"
                  >
                    {showCertForm ? "Close Form" : "Add Certificate"}
                  </button>
                </div>

                {showCertForm && (
                  <form onSubmit={handleAddCert} className="p-4 bg-sky-50 border border-sky-100 rounded-xl space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] uppercase font-bold text-gray-700">Certificate Name *</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. AWS Certified Solutions Architect"
                          value={newCert.name}
                          onChange={(e) => setNewCert({ ...newCert, name: e.target.value })}
                          className="w-full bg-white border border-sky-100 rounded-xl px-3 py-2 text-xs text-gray-900 focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] uppercase font-bold text-gray-700">Issued By *</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Amazon Web Services (AWS)"
                          value={newCert.issuedBy}
                          onChange={(e) => setNewCert({ ...newCert, issuedBy: e.target.value })}
                          className="w-full bg-white border border-sky-100 rounded-xl px-3 py-2 text-xs text-gray-900 focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] uppercase font-bold text-gray-700">Issue Date *</label>
                        <input
                          type="date"
                          required
                          value={newCert.issueDate}
                          onChange={(e) => setNewCert({ ...newCert, issueDate: e.target.value })}
                          className="w-full bg-white border border-sky-100 rounded-xl px-3 py-2 text-xs text-gray-900 font-mono focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] uppercase font-bold text-gray-700">Expiration Date (Optional)</label>
                        <input
                          type="date"
                          value={newCert.expiryDate}
                          onChange={(e) => setNewCert({ ...newCert, expiryDate: e.target.value })}
                          className="w-full bg-white border border-sky-100 rounded-xl px-3 py-2 text-xs text-gray-900 font-mono focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                        />
                      </div>
                      <div className="space-y-1.5 md:col-span-2">
                        <label className="text-[10px] uppercase font-bold text-gray-700">Verification / Certificate URL</label>
                        <input
                          type="url"
                          placeholder="e.g. https://aws.verify-link.com/id/123"
                          value={newCert.credentialUrl}
                          onChange={(e) => setNewCert({ ...newCert, credentialUrl: e.target.value })}
                          className="w-full bg-white border border-sky-100 rounded-xl px-3 py-2 text-xs text-gray-900 font-mono focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                        />
                      </div>
                    </div>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-sky-500 hover:bg-sky-600 rounded-lg text-white font-bold text-xs cursor-pointer"
                    >
                      {editingCertId ? "Update Certificate" : "Save Certificate"}
                    </button>
                  </form>
                )}

                {/* List of certs */}
                {certsList.length === 0 ? (
                  <p className="text-[11px] text-gray-500 italic">No certifications listed.</p>
                ) : (
                  <div className="space-y-3">
                    {certsList.map((cert: any) => (
                      <div key={cert._id} className="p-3 bg-sky-50/50 rounded-xl border border-sky-100 hover:border-sky-200 transition-colors flex items-center justify-between gap-4">
                        <div className="space-y-1">
                          <span className="font-bold text-sm text-gray-950 block">{cert.name}</span>
                          <p className="text-xs text-gray-600">Issued by {cert.issuedBy} &bull; Issued: {new Date(cert.issueDate).toLocaleDateString()}</p>
                          {cert.credentialUrl && (
                            <a
                              href={cert.credentialUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[10px] text-sky-600 font-mono inline-flex items-center gap-1 hover:underline"
                            >
                              <span>Verify Credential</span>
                              <ExternalLink className="w-2.5 h-2.5" />
                            </a>
                          )}
                        </div>
                        <div className="flex gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingCertId(cert._id);
                              setNewCert({
                                name: cert.name,
                                issuedBy: cert.issuedBy,
                                issueDate: cert.issueDate?.slice?.(0, 10) || cert.issueDate,
                                expiryDate: cert.expiryDate || "",
                                credentialUrl: cert.credentialUrl || "",
                              });
                              setShowCertForm(true);
                            }}
                            className="p-1.5 hover:text-sky-500 text-gray-400"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveCert(cert._id)}
                            className="p-1.5 hover:text-red-400 text-gray-400"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Portfolio Projects */}
              <div className="p-5 bg-white rounded-2xl border border-sky-100 shadow-sm space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-bold text-sm text-gray-900 flex items-center gap-1.5">
                      <Github className="w-4 h-4 text-gray-800" /> Portfolio Projects
                    </h3>
                    <p className="text-[11px] text-gray-500 mt-0.5">Showcase your personal or academic projects with links and descriptions.</p>
                  </div>
                  <button
                    onClick={() => {
                      setEditingProjId(null);
                      setNewProj({ title: "", description: "", technologies: "", startDate: "", endDate: "", githubUrl: "", liveUrl: "" });
                      setShowProjForm(!showProjForm);
                    }}
                    className="py-1 px-3 border border-sky-100 hover:bg-sky-50 hover:text-sky-700 transition-all rounded-lg text-xs font-bold font-mono text-sky-600 flex items-center gap-1.5 cursor-pointer"
                  >
                    {showProjForm ? "Close Form" : "Add Project"}
                  </button>
                </div>

                {showProjForm && (
                  <form onSubmit={handleAddProj} className="p-4 bg-sky-50 border border-sky-100 rounded-xl space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5 md:col-span-2">
                        <label className="text-[10px] uppercase font-bold text-gray-700">Project Title *</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Collaborative Real-time Kanban Board"
                          value={newProj.title}
                          onChange={(e) => setNewProj({ ...newProj, title: e.target.value })}
                          className="w-full bg-white border border-sky-100 rounded-xl px-3 py-2 text-xs text-gray-900 focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                        />
                      </div>
                      <div className="space-y-1.5 md:col-span-2">
                        <label className="text-[10px] uppercase font-bold text-gray-700">Project Description *</label>
                        <textarea
                          rows={3}
                          required
                          placeholder="Provide a comprehensive technical overview..."
                          value={newProj.description}
                          onChange={(e) => setNewProj({ ...newProj, description: e.target.value })}
                          className="w-full bg-white border border-sky-100 rounded-xl p-3 text-xs text-gray-900 focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                        />
                      </div>
                      <div className="space-y-1.5 md:col-span-2">
                        <label className="text-[10px] uppercase font-bold text-gray-700">Core Tools / Frameworks used (comma-separated)</label>
                        <input
                          type="text"
                          placeholder="e.g. Next.js, Redux Toolkit, Socket.io"
                          value={newProj.technologies}
                          onChange={(e) => setNewProj({ ...newProj, technologies: e.target.value })}
                          className="w-full bg-white border border-sky-100 rounded-xl p-2.5 text-xs text-gray-900 font-mono focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] uppercase font-bold text-gray-700">GitHub Source Code Link URL</label>
                        <input
                          type="url"
                          placeholder="e.g. https://github.com/profile/repo"
                          value={newProj.githubUrl}
                          onChange={(e) => setNewProj({ ...newProj, githubUrl: e.target.value })}
                          className="w-full bg-white border border-sky-100 rounded-xl p-2 text-xs text-gray-900 font-mono focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] uppercase font-bold text-gray-700">Live Website / Demo URL</label>
                        <input
                          type="url"
                          placeholder="e.g. https://myproject-interactive.com"
                          value={newProj.liveUrl}
                          onChange={(e) => setNewProj({ ...newProj, liveUrl: e.target.value })}
                          className="w-full bg-white border border-sky-100 rounded-xl p-2 text-xs text-gray-900 font-mono focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                        />
                      </div>
                    </div>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-sky-500 hover:bg-sky-600 rounded-lg text-white font-bold text-xs cursor-pointer"
                    >
                      {editingProjId ? "Update Project" : "Save Portfolio Project"}
                    </button>
                  </form>
                )}

                {/* List of projects */}
                {projectsList.length === 0 ? (
                  <p className="text-[11px] text-gray-500 italic font-medium">No projects listed.</p>
                ) : (
                  <div className="space-y-3.5">
                    {projectsList.map((proj: any) => (
                      <div key={proj._id} className="p-4 bg-sky-50/50 rounded-xl border border-sky-100 hover:border-sky-200 transition-colors flex items-start justify-between gap-4">
                        <div className="space-y-2 flex-1">
                          <span className="font-bold text-gray-950 text-sm block">{proj.title}</span>
                          <p className="text-xs text-gray-600 leading-relaxed">{proj.description}</p>
                          
                          {proj.technologies && proj.technologies.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 pt-1">
                              {proj.technologies.map((t: string) => (
                                <span key={t} className="px-2 py-0.5 bg-sky-100 font-mono text-[9px] font-bold text-sky-600 rounded border border-sky-200">{t}</span>
                              ))}
                            </div>
                          )}

                          <div className="flex gap-4 pt-1">
                            {proj.githubUrl && (
                              <a
                                href={proj.githubUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="text-[10px] text-sky-600 font-mono inline-flex items-center gap-1 hover:underline"
                              >
                                <Github className="w-3 h-3 text-gray-800" />
                                <span>Code Base</span>
                              </a>
                            )}
                            {proj.liveUrl && (
                              <a
                                href={proj.liveUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="text-[10px] text-sky-600 font-mono inline-flex items-center gap-1 hover:underline"
                              >
                                <ExternalLink className="w-2.5 h-2.5 text-sky-550" />
                                <span>Live Demo</span>
                              </a>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-1 mt-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingProjId(proj._id);
                              setNewProj({
                                title: proj.title,
                                description: proj.description,
                                technologies: (proj.technologies || []).join(", "),
                                startDate: proj.startDate?.slice?.(0, 10) || proj.startDate || "",
                                endDate: proj.endDate?.slice?.(0, 10) || proj.endDate || "",
                                githubUrl: proj.githubUrl || "",
                                liveUrl: proj.liveUrl || "",
                              });
                              setShowProjForm(true);
                            }}
                            className="p-1.5 hover:text-sky-500 text-gray-400"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button type="button" onClick={() => handleRemoveProj(proj._id)} className="p-1.5 hover:text-red-400 text-gray-400">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          )}

        </div>

      </main>
    </div>
  );
}
