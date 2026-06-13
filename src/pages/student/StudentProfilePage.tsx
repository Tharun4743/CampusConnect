import React, { useState, useEffect } from "react";
import { 
  User, 
  BookOpen, 
  Wrench, 
  Plus, 
  Trash2, 
  Check, 
  AlertTriangle, 
  PlusCircle, 
  Calendar, 
  Briefcase, 
  Award, 
  Layers, 
  Link as LinkIcon, 
  FileText,
  Clock,
  ExternalLink
} from "lucide-react";
import toast from "react-hot-toast";
import StudentNavigation from "../../components/StudentNavigation";
import { 
  getStudentProfile, 
  updateProfile, 
  updateSkills, 
  updateCertifications, 
  updateInternships, 
  updateWorkExperience, 
  updateProjects 
} from "../../lib/profileService";

export default function StudentProfilePage() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<"personal" | "academic" | "professional">("personal");

  // Local form states
  const [personalForm, setPersonalForm] = useState({
    dateOfBirth: "",
    gender: "",
    bloodGroup: "",
    phoneNumber: "",
    parentPhoneNumber: "",
    address: { street: "", city: "", state: "", pincode: "", country: "India" },
    emergencyContact: { name: "", relationship: "", phoneNumber: "" }
  });

  const [academicForm, setAcademicForm] = useState({
    class10Percentage: 0,
    class12Percentage: 0,
    schoolName: "",
    schoolCity: "",
    collegeName: "AI Studio University",
    collegeCity: ""
  });

  const [careerSummary, setCareerSummary] = useState("");
  const [skillInput, setSkillInput] = useState("");

  // Expanded editor sections for arrays
  const [showCertForm, setShowCertForm] = useState(false);
  const [newCert, setNewCert] = useState({ name: "", issuedBy: "", issueDate: "", expiryDate: "", credentialUrl: "" });

  const [showInternForm, setShowInternForm] = useState(false);
  const [newIntern, setNewIntern] = useState({ 
    companyName: "", position: "", startDate: "", endDate: "", currentlyWorking: false, description: "", skills: "" 
  });

  const [showWorkForm, setShowWorkForm] = useState(false);
  const [newWork, setNewWork] = useState({ 
    companyName: "", position: "", startDate: "", endDate: "", currentlyWorking: false, description: "", skills: "" 
  });

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
            }
          });
        }

        if (p.academicInfo) {
          setAcademicForm({
            class10Percentage: p.academicInfo.class10Percentage || p.class10Percentage || 0,
            class12Percentage: p.academicInfo.class12Percentage || p.class12Percentage || 0,
            schoolName: p.academicInfo.schoolName || "",
            schoolCity: p.academicInfo.schoolCity || "",
            collegeName: p.academicInfo.collegeName || "AI Studio University",
            collegeCity: p.academicInfo.collegeCity || ""
          });
        }

        if (p.professionalInfo) {
          setCareerSummary(p.professionalInfo.summary || "");
        }
      }
    } catch (err) {
      console.error("Failed to load student profile:", err);
      toast.error("Failed to load your profile details database logs.");
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
      // Validations
      if (activeTab === "personal") {
        if (personalForm.phoneNumber && !/^\d{10}$/.test(personalForm.phoneNumber)) {
          toast.error("Your primary phone number must be exactly 10 digits.");
          setSaving(false);
          return;
        }
        if (personalForm.emergencyContact?.phoneNumber && !/^\d{10}$/.test(personalForm.emergencyContact.phoneNumber)) {
          toast.error("The emergency telephone number must be exactly 10 digits.");
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
          toast.error("10th class percentage standard must be inside bounds [0-100%].");
          setSaving(false);
          return;
        }
        if (academicForm.class12Percentage < 0 || academicForm.class12Percentage > 100) {
          toast.error("12th class percentage standard must be inside bounds [0-100%].");
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

  const saveCareerSummary = async () => {
    if (careerSummary.length > 500) {
      toast.error("Career summary breaches 500 character limits.");
      return;
    }
    setSaving(true);
    try {
      const res = await updateProfile({ professionalInfo: { summary: careerSummary } });
      if (res.success) {
        setProfile(res.data);
        toast.success("Profile Career summary successfully updated.");
      }
    } catch (err: any) {
      toast.error("Failed to commit career summary updates.");
    } finally {
      setSaving(false);
    }
  };

  // Skill administration
  const handleAddSkill = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = skillInput.trim();
    if (!clean) return;

    const currentSkills = profile?.professionalInfo?.skills || [];
    if (currentSkills.some((s: string) => s.toLowerCase() === clean.toLowerCase())) {
      toast.error(`The skill "${clean}" already exists on your professional profile.`);
      return;
    }

    if (currentSkills.length >= 20) {
      toast.error("Maximum 20 technologies are permitted on your student profile index.");
      return;
    }

    try {
      const res = await updateSkills("add", clean);
      if (res.success) {
        setProfile((prev: any) => ({
          ...prev,
          professionalInfo: { ...prev.professionalInfo, skills: res.data.skills }
        }));
        setSkillInput("");
        toast.success(`Skill "${clean}" registered.`);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Could not save skill.");
    }
  };

  const handleRemoveSkill = async (skill: string) => {
    try {
      const res = await updateSkills("remove", skill);
      if (res.success) {
        setProfile((prev: any) => ({
          ...prev,
          professionalInfo: { ...prev.professionalInfo, skills: res.data.skills }
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
      const res = await updateCertifications("add", newCert);
      if (res.success) {
        setProfile((prev: any) => ({
          ...prev,
          professionalInfo: res.data
        }));
        setNewCert({ name: "", issuedBy: "", issueDate: "", expiryDate: "", credentialUrl: "" });
        setShowCertForm(false);
        toast.success("New certificate added successfully.");
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

  // Internships list editor
  const handleAddIntern = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newIntern.companyName || !newIntern.position || !newIntern.startDate) {
      toast.error("Company name, job role, and starting date are mandatory.");
      return;
    }
    try {
      const formatted = {
        companyName: newIntern.companyName,
        position: newIntern.position,
        duration: {
          startDate: newIntern.startDate,
          endDate: newIntern.currentlyWorking ? undefined : newIntern.endDate
        },
        currentlyWorking: newIntern.currentlyWorking,
        description: newIntern.description,
        skills: newIntern.skills ? newIntern.skills.split(",").map(s => s.trim()) : []
      };

      const res = await updateInternships("add", formatted);
      if (res.success) {
        setProfile((prev: any) => ({ ...prev, professionalInfo: res.data }));
        setNewIntern({ companyName: "", position: "", startDate: "", endDate: "", currentlyWorking: false, description: "", skills: "" });
        setShowInternForm(false);
        toast.success("Internship record registered.");
      }
    } catch (err) {
      toast.error("Failed to register internship.");
    }
  };

  const handleRemoveIntern = async (id: string) => {
    try {
      const res = await updateInternships("delete", { _id: id });
      if (res.success) {
        setProfile((prev: any) => ({ ...prev, professionalInfo: res.data }));
        toast.success("Internship record cleared from archives.");
      }
    } catch (err) {
      toast.error("Failed to clear internship.");
    }
  };

  // Work experience list edit
  const handleAddWork = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWork.companyName || !newWork.position || !newWork.startDate) {
      toast.error("Employer details, job role, and starting date are required.");
      return;
    }
    try {
      const formatted = {
        companyName: newWork.companyName,
        position: newWork.position,
        duration: {
          startDate: newWork.startDate,
          endDate: newWork.currentlyWorking ? undefined : newWork.endDate
        },
        currentlyWorking: newWork.currentlyWorking,
        description: newWork.description,
        skills: newWork.skills ? newWork.skills.split(",").map(s => s.trim()) : []
      };

      const res = await updateWorkExperience("add", formatted);
      if (res.success) {
        setProfile((prev: any) => ({ ...prev, professionalInfo: res.data }));
        setNewWork({ companyName: "", position: "", startDate: "", endDate: "", currentlyWorking: false, description: "", skills: "" });
        setShowWorkForm(false);
        toast.success("Work experience added to portfolio.");
      }
    } catch (err) {
      toast.error("Failed to save work experience details.");
    }
  };

  const handleRemoveWork = async (id: string) => {
    try {
      const res = await updateWorkExperience("delete", { _id: id });
      if (res.success) {
        setProfile((prev: any) => ({ ...prev, professionalInfo: res.data }));
        toast.success("Work experience deleted.");
      }
    } catch (err) {
      toast.error("Failed to delete work experience record.");
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

      const res = await updateProjects("add", formatted);
      if (res.success) {
        setProfile((prev: any) => ({ ...prev, professionalInfo: res.data }));
        setNewProj({ title: "", description: "", technologies: "", startDate: "", endDate: "", githubUrl: "", liveUrl: "" });
        setShowProjForm(false);
        toast.success("Personal portfolio project registered.");
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

  if (loading) {
    return (
      <div className="flex flex-col lg:flex-row min-h-screen bg-slate-900 text-slate-100">
        <StudentNavigation />
        <div className="flex-1 flex items-center justify-center py-20">
          <div className="text-center space-y-4">
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-slate-400 font-medium text-sm font-mono">Synchronizing Profile settings...</p>
          </div>
        </div>
      </div>
    );
  }

  const skillsList = profile?.professionalInfo?.skills || [];
  const certsList = profile?.professionalInfo?.certifications || [];
  const intersList = profile?.professionalInfo?.internships || [];
  const workList = profile?.professionalInfo?.workExperience || [];
  const projectsList = profile?.professionalInfo?.projects || [];

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-slate-950 text-slate-100 font-sans">
      <StudentNavigation />

      {/* Profile workspace */}
      <main className="flex-1 p-6 lg:p-10 space-y-8 overflow-y-auto max-w-7xl mx-auto w-full">
        
        {/* Workspace Title bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-900 pb-5">
          <div className="space-y-1">
            <h1 className="text-2xl lg:text-3xl font-black text-slate-100 tracking-tight">Onboarding Profile Builder</h1>
            <p className="text-xs text-slate-400">Complete your profile records sheets to make your candidacy searchable for HR corporate reviewers.</p>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-900 p-2.5 rounded-xl border border-slate-800">
            <Clock className="w-4 h-4 text-slate-600" />
            <span>Updated: <strong className="text-slate-300">{profile?.profileSettings?.lastProfileUpdate ? new Date(profile.profileSettings.lastProfileUpdate).toLocaleDateString() : "Just Now"}</strong></span>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-slate-900 p-1 bg-slate-900/40 rounded-xl max-w-lg">
          <button
            onClick={() => setActiveTab("personal")}
            className={`flex-1 py-2.5 px-4 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === "personal" ? "bg-blue-600 text-white shadow-md shadow-blue-600/10" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <User className="w-4 h-4" />
            <span>Personal Details</span>
          </button>
          <button
            onClick={() => setActiveTab("academic")}
            className={`flex-1 py-2.5 px-4 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === "academic" ? "bg-blue-600 text-white shadow-md shadow-blue-600/10" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Academic Scores</span>
          </button>
          <button
            onClick={() => setActiveTab("professional")}
            className={`flex-1 py-2.5 px-4 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === "professional" ? "bg-blue-600 text-white shadow-md shadow-blue-600/10" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Wrench className="w-4 h-4" />
            <span>Professional Career</span>
          </button>
        </div>

        {/* Form Container */}
        <div className="bg-slate-900/20 rounded-2xl border border-slate-800/85">
          
          {/* Active Tab Elements */}

          {/* 1. PERSONAL TAB */}
          {activeTab === "personal" && (
            <form onSubmit={saveGeneralProfile} className="p-6 lg:p-8 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Dob */}
                <div className="space-y-1.5Col">
                  <label className="text-xs font-bold text-slate-300 block">Date of Birth</label>
                  <input
                    type="date"
                    required
                    value={personalForm.dateOfBirth}
                    onChange={(e) => setPersonalForm({ ...personalForm, dateOfBirth: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-mono"
                  />
                </div>

                {/* Gender */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300 block">Gender</label>
                  <select
                    required
                    value={personalForm.gender}
                    onChange={(e) => setPersonalForm({ ...personalForm, gender: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                  >
                    <option value="">Select gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                {/* Blood Group */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300 block">Blood Group</label>
                  <select
                    value={personalForm.bloodGroup}
                    onChange={(e) => setPersonalForm({ ...personalForm, bloodGroup: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
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
                  <label className="text-xs font-bold text-slate-300 block">Phone Number (10 digits)</label>
                  <input
                    type="tel"
                    required
                    placeholder="e.g. 9876543210"
                    value={personalForm.phoneNumber}
                    onChange={(e) => setPersonalForm({ ...personalForm, phoneNumber: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-mono"
                  />
                </div>

                {/* Parent Phone */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300 block">Parent Phone Number</label>
                  <input
                    type="tel"
                    placeholder="e.g. 9112233445"
                    value={personalForm.parentPhoneNumber}
                    onChange={(e) => setPersonalForm({ ...personalForm, parentPhoneNumber: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-mono"
                  />
                </div>
              </div>

              {/* Mailing Address nested object */}
              <div className="border-t border-slate-900 pt-6 space-y-4">
                <span className="text-xs font-extrabold uppercase text-slate-400 tracking-wider block">Mailing Address</span>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="md:col-span-2 space-y-1.5">
                    <label className="text-[10px] uppercase font-bold text-slate-500">Street Address</label>
                    <input
                      type="text"
                      placeholder="e.g. Flat 302, Phase 2, Royal Heights"
                      value={personalForm.address.street}
                      onChange={(e) => setPersonalForm({
                        ...personalForm,
                        address: { ...personalForm.address, street: e.target.value }
                      })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-bold text-slate-500">City / District</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Hyderabad"
                      value={personalForm.address.city}
                      onChange={(e) => setPersonalForm({
                        ...personalForm,
                        address: { ...personalForm.address, city: e.target.value }
                      })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-bold text-slate-500">State / Region</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Telangana"
                      value={personalForm.address.state}
                      onChange={(e) => setPersonalForm({
                        ...personalForm,
                        address: { ...personalForm.address, state: e.target.value }
                      })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-bold text-slate-500">Pincode / Zip</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 500001"
                      value={personalForm.address.pincode}
                      onChange={(e) => setPersonalForm({
                        ...personalForm,
                        address: { ...personalForm.address, pincode: e.target.value }
                      })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-mono"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-bold text-slate-500">Country</label>
                    <input
                      type="text"
                      required
                      value={personalForm.address.country}
                      onChange={(e) => setPersonalForm({
                        ...personalForm,
                        address: { ...personalForm.address, country: e.target.value }
                      })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Emergency details nested object */}
              <div className="border-t border-slate-900 pt-6 space-y-4">
                <span className="text-xs font-extrabold uppercase text-slate-400 tracking-wider block">Emergency Contact Persons</span>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-bold text-slate-500">contact full Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Rajesh Kumar"
                      value={personalForm.emergencyContact.name}
                      onChange={(e) => setPersonalForm({
                        ...personalForm,
                        emergencyContact: { ...personalForm.emergencyContact, name: e.target.value }
                      })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-bold text-slate-500">Relationship</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Father"
                      value={personalForm.emergencyContact.relationship}
                      onChange={(e) => setPersonalForm({
                        ...personalForm,
                        emergencyContact: { ...personalForm.emergencyContact, relationship: e.target.value }
                      })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-bold text-slate-500">Phone Number (10 digits)</label>
                    <input
                      type="tel"
                      required
                      placeholder="e.g. 9876543210"
                      value={personalForm.emergencyContact.phoneNumber}
                      onChange={(e) => setPersonalForm({
                        ...personalForm,
                        emergencyContact: { ...personalForm.emergencyContact, phoneNumber: e.target.value }
                      })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="border-t border-slate-900 pt-6 flex justify-end gap-3">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white font-extrabold text-xs tracking-wider uppercase rounded-xl transition-all cursor-pointer flex items-center gap-2 shadow-lg shadow-blue-600/10"
                >
                  {saving ? "Saving Fields..." : "Commit Personal Info"}
                </button>
              </div>
            </form>
          )}

          {/* 2. ACADEMIC TAB */}
          {activeTab === "academic" && (
            <form onSubmit={saveGeneralProfile} className="p-6 lg:p-8 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                
                {/* 10th Marks */}
                <div className="space-y-4 p-5 bg-slate-900/30 rounded-2xl border border-slate-800/40">
                  <span className="text-xs font-extrabold uppercase text-slate-400 tracking-wider block">Class 10th / Secondary Boards</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] uppercase font-bold text-slate-500">Aggregate Percentage (%)</label>
                      <input
                        type="number"
                        step="0.01"
                        required
                        max="100"
                        min="0"
                        value={academicForm.class10Percentage || ""}
                        onChange={(e) => setAcademicForm({ ...academicForm, class10Percentage: parseFloat(e.target.value) || 0 })}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-mono"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-bold text-slate-500">School Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. St. Joseph's High School"
                      value={academicForm.schoolName}
                      onChange={(e) => setAcademicForm({ ...academicForm, schoolName: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-200"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-bold text-slate-500">School City</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Hyderabad"
                      value={academicForm.schoolCity}
                      onChange={(e) => setAcademicForm({ ...academicForm, schoolCity: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-200"
                    />
                  </div>
                </div>

                {/* 12th Marks */}
                <div className="space-y-4 p-5 bg-slate-900/30 rounded-2xl border border-slate-800/40">
                  <span className="text-xs font-extrabold uppercase text-slate-400 tracking-wider block">Class 12th / Senior Secondary</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] uppercase font-bold text-slate-500">Aggregate Percentage (%)</label>
                      <input
                        type="number"
                        step="0.01"
                        required
                        max="100"
                        min="0"
                        value={academicForm.class12Percentage || ""}
                        onChange={(e) => setAcademicForm({ ...academicForm, class12Percentage: parseFloat(e.target.value) || 0 })}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-mono"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-bold text-slate-500">Undergraduate Junior College / High school name</label>
                    <input
                      type="text"
                      placeholder="e.g. Little Flower Junior College"
                      value={academicForm.collegeName}
                      onChange={(e) => setAcademicForm({ ...academicForm, collegeName: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-200"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-bold text-slate-500">College / High School City</label>
                    <input
                      type="text"
                      placeholder="e.g. Hyderabad"
                      value={academicForm.collegeCity}
                      onChange={(e) => setAcademicForm({ ...academicForm, collegeCity: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-200"
                    />
                  </div>
                </div>

              </div>

              {/* Submit Button */}
              <div className="border-t border-slate-900 pt-6 flex justify-end">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white font-extrabold text-xs tracking-wider uppercase rounded-xl transition-all cursor-pointer shadow-lg shadow-blue-600/10"
                >
                  {saving ? "Updating Marks..." : "Commit Academic Records"}
                </button>
              </div>
            </form>
          )}

          {/* 3. PROFESSIONAL ADVANCED TAB */}
          {activeTab === "professional" && (
            <div className="p-6 lg:p-8 space-y-10">
              
              {/* Career summary character counting card */}
              <div className="p-5 bg-slate-900/4 w-full rounded-2xl border border-slate-800/60 space-y-4">
                <div className="flex justify-between items-center flex-wrap gap-2">
                  <div>
                    <h3 className="font-bold text-sm text-slate-200">Career Summary Profile</h3>
                    <p className="text-[11px] text-slate-500 mt-0.5">Write a brief overview of your professional aspirations, engineering strengths and core focus.</p>
                  </div>
                  <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded-lg border ${
                    careerSummary.length > 500 ? "text-red-400 bg-red-950 border-red-900/50" : "text-slate-400 bg-slate-950 border-slate-800"
                  }`}>
                    {careerSummary.length} / 500 chars limit
                  </span>
                </div>

                <textarea
                  rows={4}
                  maxLength={510}
                  placeholder="e.g. Diligent computer science undergraduate with experience in designing robust fullstack web applications. Skilled in React, Express routers, and MongoDB data mapping. Looking to contribute skills towards a collaborative SDE role..."
                  value={careerSummary}
                  onChange={(e) => setCareerSummary(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-4 text-xs text-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all leading-relaxed"
                />

                <div className="flex justify-end">
                  <button
                    onClick={saveCareerSummary}
                    disabled={saving || careerSummary.length > 500}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-lg transition-colors cursor-pointer"
                  >
                    Update Career Statement
                  </button>
                </div>
              </div>

              {/* Skills tags administration */}
              <div className="p-5 bg-slate-900/4 rounded-2xl border border-slate-800/60 space-y-4">
                <div>
                  <h3 className="font-bold text-sm text-slate-200 flex items-center justify-between">
                    <span>Technology Stack Tags</span>
                    <span className="text-[10px] font-mono text-slate-500">Max 20 skills • {skillsList.length} defined</span>
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">Identify primary programming languages, frameworks, deployment tools, or database architectures.</p>
                </div>

                {/* Form to add */}
                <form onSubmit={handleAddSkill} className="flex gap-2 max-w-sm">
                  <input
                    type="text"
                    placeholder="e.g. Node.js, Docker, Tailwind"
                    value={skillInput}
                    onChange={(e) => setSkillInput(e.target.value)}
                    className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-xs text-slate-200 focus:border-blue-500"
                  />
                  <button
                    type="submit"
                    className="p-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white transition-all cursor-pointer shrink-0"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </form>

                {/* Active Tag visual render */}
                {skillsList.length === 0 ? (
                  <p className="text-[11px] text-slate-600 italic">No technology tags specified. Type a skill and click plus to record.</p>
                ) : (
                  <div className="flex flex-wrap gap-2.5 pt-2">
                    {skillsList.map((skill: string) => (
                      <span
                        key={skill}
                        className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-900 text-slate-300 font-bold text-xs rounded-lg border border-slate-800 font-mono"
                      >
                        <span>{skill}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveSkill(skill)}
                          className="hover:text-red-400 transition-colors cursor-pointer"
                        >
                          &times;
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Expandable cert list editor */}
              <div className="p-5 bg-slate-900/4 rounded-2xl border border-slate-800/60 space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-bold text-sm text-slate-200">Certificates & Licenses</h3>
                    <p className="text-[11px] text-slate-500 mt-0.5">Certificates and links to verify licenses from cloud providers or tech universities.</p>
                  </div>
                  <button
                    onClick={() => setShowCertForm(!showCertForm)}
                    className="py-1 px-3 border border-slate-800 hover:bg-slate-900 hover:text-white transition-all rounded-lg text-xs font-bold font-mono text-blue-400 flex items-center gap-1.5 cursor-pointer"
                  >
                    {showCertForm ? "Close Form" : "Add Certificate"}
                  </button>
                </div>

                {showCertForm && (
                  <form onSubmit={handleAddCert} className="p-4 bg-slate-950 border border-slate-800/80 rounded-xl space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] uppercase font-bold text-slate-500">Certificate Name *</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. AWS Certified Solutions Architect"
                          value={newCert.name}
                          onChange={(e) => setNewCert({ ...newCert, name: e.target.value })}
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] uppercase font-bold text-slate-500">Issued By *</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Amazon Web Services (AWS)"
                          value={newCert.issuedBy}
                          onChange={(e) => setNewCert({ ...newCert, issuedBy: e.target.value })}
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] uppercase font-bold text-slate-500">Issue Date *</label>
                        <input
                          type="date"
                          required
                          value={newCert.issueDate}
                          onChange={(e) => setNewCert({ ...newCert, issueDate: e.target.value })}
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 font-mono"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] uppercase font-bold text-slate-500">Expiration Date (Optional)</label>
                        <input
                          type="date"
                          value={newCert.expiryDate}
                          onChange={(e) => setNewCert({ ...newCert, expiryDate: e.target.value })}
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 font-mono"
                        />
                      </div>
                      <div className="space-y-1.5 md:col-span-2">
                        <label className="text-[10px] uppercase font-bold text-slate-500">Verification URL</label>
                        <input
                          type="url"
                          placeholder="e.g. https://aws.verify-link.com/id/123"
                          value={newCert.credentialUrl}
                          onChange={(e) => setNewCert({ ...newCert, credentialUrl: e.target.value })}
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 font-mono"
                        />
                      </div>
                    </div>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-bold text-xs cursor-pointer"
                    >
                      Save Certificate
                    </button>
                  </form>
                )}

                {/* List of certs */}
                {certsList.length === 0 ? (
                  <p className="text-[11px] text-slate-600 italic">No certifications listed.</p>
                ) : (
                  <div className="space-y-3">
                    {certsList.map((cert: any) => (
                      <div key={cert._id} className="p-3 bg-slate-900/60 rounded-xl border border-slate-800/40 hover:border-slate-800 transition-colors flex items-center justify-between gap-4">
                        <div className="space-y-1">
                          <span className="font-bold text-sm text-slate-200 block">{cert.name}</span>
                          <p className="text-xs text-slate-400">Issued by {cert.issuedBy} • {new Date(cert.issueDate).toLocaleDateString()}</p>
                          {cert.credentialUrl && (
                            <a
                              href={cert.credentialUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[10px] text-blue-400 font-mono inline-flex items-center gap-1"
                            >
                              <span>Verify Credential</span>
                              <ExternalLink className="w-2.5 h-2.5" />
                            </a>
                          )}
                        </div>
                        <button
                          onClick={() => handleRemoveCert(cert._id)}
                          className="p-1.5 hover:text-red-400 transition-colors text-slate-500 cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Expansions 4: INTERNSHIPS SECTIONS */}
              <div className="p-5 bg-slate-900/4 rounded-2xl border border-slate-800/60 space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-bold text-sm text-slate-200">Internship Experience</h3>
                    <p className="text-[11px] text-slate-500 mt-0.5">Add internships or industrial training experience to your profile.</p>
                  </div>
                  <button
                    onClick={() => setShowInternForm(!showInternForm)}
                    className="py-1 px-3 border border-slate-800 hover:bg-slate-900 hover:text-white rounded-lg text-xs font-bold font-mono text-blue-400 flex items-center gap-1.5 cursor-pointer"
                  >
                    {showInternForm ? "Close Form" : "Add Internship"}
                  </button>
                </div>

                {showInternForm && (
                  <form onSubmit={handleAddIntern} className="p-4 bg-slate-950 border border-slate-800/80 rounded-xl space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] uppercase font-bold text-slate-500">Company Name *</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Google India"
                          value={newIntern.companyName}
                          onChange={(e) => setNewIntern({ ...newIntern, companyName: e.target.value })}
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] uppercase font-bold text-slate-500">Intern Position / Role *</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Software Engineering Intern"
                          value={newIntern.position}
                          onChange={(e) => setNewIntern({ ...newIntern, position: e.target.value })}
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] uppercase font-bold text-slate-500">Start Date *</label>
                        <input
                          type="date"
                          required
                          value={newIntern.startDate}
                          onChange={(e) => setNewIntern({ ...newIntern, startDate: e.target.value })}
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 font-mono"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] uppercase font-bold text-slate-500">End Date</label>
                        <input
                          type="date"
                          disabled={newIntern.currentlyWorking}
                          value={newIntern.endDate}
                          onChange={(e) => setNewIntern({ ...newIntern, endDate: e.target.value })}
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 font-mono disabled:opacity-40"
                        />
                      </div>
                      <div className="md:col-span-2 flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="curr_work_interns"
                          checked={newIntern.currentlyWorking}
                          onChange={(e) => setNewIntern({ ...newIntern, currentlyWorking: e.target.checked })}
                          className="rounded text-blue-600 focus:ring-blue-500 bg-slate-900 border-slate-850"
                        />
                        <label htmlFor="curr_work_interns" className="text-xs text-slate-400 font-bold">Currently working as intern here</label>
                      </div>
                      <div className="space-y-1.5 md:col-span-2">
                        <label className="text-[10px] uppercase font-bold text-slate-500">Skills Gained (comma-separated)</label>
                        <input
                          type="text"
                          placeholder="e.g. Python, Flask, PyTest"
                          value={newIntern.skills}
                          onChange={(e) => setNewIntern({ ...newIntern, skills: e.target.value })}
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 font-mono"
                        />
                      </div>
                      <div className="space-y-1.5 md:col-span-2">
                        <label className="text-[10px] uppercase font-bold text-slate-500">Description</label>
                        <textarea
                          rows={3}
                          placeholder="Describe your role, contributions and achievements..."
                          value={newIntern.description}
                          onChange={(e) => setNewIntern({ ...newIntern, description: e.target.value })}
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-slate-200"
                        />
                      </div>
                    </div>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-bold text-xs cursor-pointer"
                    >
                      Save Internship
                    </button>
                  </form>
                )}

                {/* List */}
                {intersList.length === 0 ? (
                  <p className="text-[11px] text-slate-600 italic">No internships registered.</p>
                ) : (
                  <div className="space-y-3.5">
                    {intersList.map((item: any) => (
                      <div key={item._id} className="p-4 bg-slate-900/60 rounded-xl border border-slate-800/40 hover:border-slate-800 transition-colors flex items-start justify-between gap-4">
                        <div className="space-y-2 flex-1">
                          <div>
                            <span className="font-bold text-slate-100 text-sm">{item.position}</span>
                            <span className="text-xs text-blue-400 font-semibold block">{item.companyName}</span>
                          </div>
                          
                          <p className="text-xs text-slate-400 leading-relaxed">{item.description}</p>
                          
                          {item.skills && item.skills.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 pt-1">
                              {item.skills.map((s: string) => (
                                <span key={s} className="px-2 py-0.5 bg-slate-950 font-mono text-[9px] font-bold text-slate-500 rounded border border-slate-900">{s}</span>
                              ))}
                            </div>
                          )}

                          <span className="text-[10px] text-slate-500 font-mono block">
                            Duration: {new Date(item.duration.startDate).toLocaleDateString()} - {item.currentlyWorking ? "Present" : new Date(item.duration.endDate).toLocaleDateString()}
                          </span>
                        </div>
                        <button
                          onClick={() => handleRemoveIntern(item._id)}
                          className="p-1.5 hover:text-red-400 transition-colors text-slate-500 cursor-pointer mt-1"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Expansions 5: WORK EXPERIENCES SECTIONS */}
              <div className="p-5 bg-slate-900/4 rounded-2xl border border-slate-800/60 space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-bold text-sm text-slate-200">Work History</h3>
                    <p className="text-[11px] text-slate-500 mt-0.5">Include any industrial SDE employment history, freelancing, or contract work.</p>
                  </div>
                  <button
                    onClick={() => setShowWorkForm(!showWorkForm)}
                    className="py-1 px-3 border border-slate-800 hover:bg-slate-900 hover:text-white rounded-lg text-xs font-bold font-mono text-blue-400 flex items-center gap-1.5 cursor-pointer"
                  >
                    {showWorkForm ? "Close Form" : "Add Work History"}
                  </button>
                </div>

                {showWorkForm && (
                  <form onSubmit={handleAddWork} className="p-4 bg-slate-950 border border-slate-800/80 rounded-xl space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] uppercase font-bold text-slate-500">Corporate Employer *</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Acme Corp"
                          value={newWork.companyName}
                          onChange={(e) => setNewWork({ ...newWork, companyName: e.target.value })}
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] uppercase font-bold text-slate-500">Position / Title *</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Associate Developer"
                          value={newWork.position}
                          onChange={(e) => setNewWork({ ...newWork, position: e.target.value })}
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] uppercase font-bold text-slate-500">Start Date *</label>
                        <input
                          type="date"
                          required
                          value={newWork.startDate}
                          onChange={(e) => setNewWork({ ...newWork, startDate: e.target.value })}
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 font-mono"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] uppercase font-bold text-slate-500">End Date</label>
                        <input
                          type="date"
                          disabled={newWork.currentlyWorking}
                          value={newWork.endDate}
                          onChange={(e) => setNewWork({ ...newWork, endDate: e.target.value })}
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 font-mono disabled:opacity-40"
                        />
                      </div>
                      <div className="md:col-span-2 flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="curr_work_active"
                          checked={newWork.currentlyWorking}
                          onChange={(e) => setNewWork({ ...newWork, currentlyWorking: e.target.checked })}
                          className="rounded text-blue-600 focus:ring-blue-500 bg-slate-900 border-slate-850"
                        />
                        <label htmlFor="curr_work_active" className="text-xs text-slate-400 font-bold">Currently working here</label>
                      </div>
                      <div className="space-y-1.5 md:col-span-2">
                        <label className="text-[10px] uppercase font-bold text-slate-500">Technologies Utilized (comma-separated)</label>
                        <input
                          type="text"
                          placeholder="e.g. TypeScript, React Native, Redis"
                          value={newWork.skills}
                          onChange={(e) => setNewWork({ ...newWork, skills: e.target.value })}
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 font-mono"
                        />
                      </div>
                      <div className="space-y-1.5 md:col-span-2">
                        <label className="text-[10px] uppercase font-bold text-slate-500">Job Description</label>
                        <textarea
                          rows={3}
                          placeholder="Summarize your coding, features delivered, and technical roles..."
                          value={newWork.description}
                          onChange={(e) => setNewWork({ ...newWork, description: e.target.value })}
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-slate-200"
                        />
                      </div>
                    </div>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-bold text-xs cursor-pointer"
                    >
                      Save Employment History
                    </button>
                  </form>
                )}

                {/* List */}
                {workList.length === 0 ? (
                  <p className="text-[11px] text-slate-600 italic">No job employment logs registered.</p>
                ) : (
                  <div className="space-y-3.5">
                    {workList.map((item: any) => (
                      <div key={item._id} className="p-4 bg-slate-900/60 rounded-xl border border-slate-800/40 hover:border-slate-800 transition-colors flex items-start justify-between gap-4">
                        <div className="space-y-2 flex-1">
                          <div>
                            <span className="font-bold text-slate-100 text-sm">{item.position}</span>
                            <span className="text-xs text-indigo-450 font-semibold block">{item.companyName}</span>
                          </div>

                          <p className="text-xs text-slate-400 leading-relaxed">{item.description}</p>

                          {item.skills && item.skills.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 pt-1">
                              {item.skills.map((s: string) => (
                                <span key={s} className="px-2 py-0.5 bg-slate-950 font-mono text-[9px] font-bold text-slate-500 rounded border border-slate-900">{s}</span>
                              ))}
                            </div>
                          )}

                          <span className="text-[10px] text-slate-500 font-mono block">
                            Duration: {new Date(item.duration.startDate).toLocaleDateString()} - {item.currentlyWorking ? "Present" : new Date(item.duration.endDate).toLocaleDateString()}
                          </span>
                        </div>
                        <button
                          onClick={() => handleRemoveWork(item._id)}
                          className="p-1.5 hover:text-red-400 transition-colors text-slate-500 cursor-pointer mt-1"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Expansions 6: PORTFOLIO PROJECTS SECTIONS */}
              <div className="p-5 bg-slate-900/4 rounded-2xl border border-slate-800/60 space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-bold text-sm text-slate-200">Portfolio Projects</h3>
                    <p className="text-[11px] text-slate-500 mt-0.5">Showcase your personal or academic projects with links to GitHub, live hosting and technical descriptions.</p>
                  </div>
                  <button
                    onClick={() => setShowProjForm(!showProjForm)}
                    className="py-1 px-3 border border-slate-800 hover:bg-slate-900 hover:text-white rounded-lg text-xs font-bold font-mono text-blue-400 flex items-center gap-1.5 cursor-pointer"
                  >
                    {showProjForm ? "Close Form" : "Add Project"}
                  </button>
                </div>

                {showProjForm && (
                  <form onSubmit={handleAddProj} className="p-4 bg-slate-950 border border-slate-800/80 rounded-xl space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5 md:col-span-2">
                        <label className="text-[10px] uppercase font-bold text-slate-500">Project Title *</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Collaborative Real-time Kanban Board"
                          value={newProj.title}
                          onChange={(e) => setNewProj({ ...newProj, title: e.target.value })}
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200"
                        />
                      </div>
                      <div className="space-y-1.5 md:col-span-2">
                        <label className="text-[10px] uppercase font-bold text-slate-500">Project Description *</label>
                        <textarea
                          rows={3}
                          required
                          placeholder="Provide a comprehensive technical overview of components built and problems solved..."
                          value={newProj.description}
                          onChange={(e) => setNewProj({ ...newProj, description: e.target.value })}
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-slate-200"
                        />
                      </div>
                      <div className="space-y-1.5 md:col-span-2">
                        <label className="text-[10px] uppercase font-bold text-slate-500">Core Tools / Frameworks used (comma-separated)</label>
                        <input
                          type="text"
                          placeholder="e.g. Next.js, Redux Toolkit, Socket.io"
                          value={newProj.technologies}
                          onChange={(e) => setNewProj({ ...newProj, technologies: e.target.value })}
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 font-mono"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] uppercase font-bold text-slate-500">GitHub Source Code Link URL</label>
                        <input
                          type="url"
                          placeholder="e.g. https://github.com/profile/repo"
                          value={newProj.githubUrl}
                          onChange={(e) => setNewProj({ ...newProj, githubUrl: e.target.value })}
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2 text-xs text-slate-200 font-mono"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] uppercase font-bold text-slate-500">Live Website / Demo URL</label>
                        <input
                          type="url"
                          placeholder="e.g. https://myproject-interactive.com"
                          value={newProj.liveUrl}
                          onChange={(e) => setNewProj({ ...newProj, liveUrl: e.target.value })}
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2 text-xs text-slate-200 font-mono"
                        />
                      </div>
                    </div>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-bold text-xs cursor-pointer"
                    >
                      Save Portfolio Project
                    </button>
                  </form>
                )}

                {/* List */}
                {projectsList.length === 0 ? (
                  <p className="text-[11px] text-slate-600 italic font-medium">No projects listed.</p>
                ) : (
                  <div className="space-y-3.5">
                    {projectsList.map((proj: any) => (
                      <div key={proj._id} className="p-4 bg-slate-900/60 rounded-xl border border-slate-800/40 hover:border-slate-800 transition-colors flex items-start justify-between gap-4">
                        <div className="space-y-2 flex-1">
                          <span className="font-bold text-slate-100 text-sm block">{proj.title}</span>
                          <p className="text-xs text-slate-400 leading-relaxed">{proj.description}</p>
                          
                          {proj.technologies && proj.technologies.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 pt-1">
                              {proj.technologies.map((t: string) => (
                                <span key={t} className="px-2 py-0.5 bg-slate-950 font-mono text-[9px] font-bold text-slate-500 rounded border border-slate-900">{t}</span>
                              ))}
                            </div>
                          )}

                          <div className="flex gap-4 pt-1">
                            {proj.githubUrl && (
                              <a
                                href={proj.githubUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="text-[10px] text-blue-400 font-mono inline-flex items-center gap-1 hover:underline"
                              >
                                <span>Code Base</span>
                                <ExternalLink className="w-2.5 h-2.5" />
                              </a>
                            )}
                            {proj.liveUrl && (
                              <a
                                href={proj.liveUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="text-[10px] text-emerald-400 font-mono inline-flex items-center gap-1 hover:underline"
                              >
                                <span>Live Demo</span>
                                <ExternalLink className="w-2.5 h-2.5" />
                              </a>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => handleRemoveProj(proj._id)}
                          className="p-1.5 hover:text-red-400 transition-colors text-slate-500 cursor-pointer mt-1"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
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
