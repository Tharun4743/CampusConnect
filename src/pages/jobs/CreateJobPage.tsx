import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  ArrowLeft, 
  Briefcase, 
  MapPin, 
  Calendar, 
  DollarSign, 
  Award, 
  BookOpen, 
  Check 
} from "lucide-react";
import toast from "react-hot-toast";
import axiosInstance from "../../lib/axiosInstance";

export default function CreateJobPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  // Form Fields State
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("San Francisco, CA (Hybrid)");
  const [minCgpa, setMinCgpa] = useState("0");
  const [salary, setSalary] = useState("12 LPA");
  const [batchYear, setBatchYear] = useState("2026");
  const [lastDate, setLastDate] = useState(() => {
    // Default to 14 days from now
    const d = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
    return d.toISOString().split("T")[0];
  });

  // Allowed branches array selections
  const availableBranches = [
    "Computer Science",
    "Information Technology",
    "Electronics",
    "Electrical",
    "Mechanical",
    "Civil"
  ];
  const [selectedBranches, setSelectedBranches] = useState<string[]>(["Computer Science", "Information Technology"]);

  const handleBranchClick = (branch: string) => {
    if (selectedBranches.includes(branch)) {
      setSelectedBranches(selectedBranches.filter((b) => b !== branch));
    } else {
      setSelectedBranches([...selectedBranches, branch]);
    }
  };

  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      return toast.error("Job position title is required.");
    }

    try {
      setLoading(true);
      const res = await axiosInstance.post("/api/jobs/create", {
        job_title: title,
        job_description: description,
        location,
        min_cgpa: parseFloat(minCgpa) || 0,
        salary_package: salary,
        batch_year: parseInt(batchYear) || new Date().getFullYear(),
        last_date: new Date(lastDate).toISOString(),
        allowed_branches: selectedBranches
      });

      if (res.data?.success) {
        toast.success("Job drive published and opened successfully!");
        navigate("/hr/dashboard");
      } else {
        toast.error(res.data?.message || "Failed to publish job opening.");
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || "Error communicating with server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans p-6 lg:p-8">
      <div className="max-w-3xl mx-auto">
        {/* Navigation row */}
        <button
          onClick={() => navigate(-1)}
          className="mb-8 flex items-center gap-2 px-3 py-1.5 text-xs text-slate-400 hover:text-white bg-slate-950 border border-slate-800 rounded-lg transition-all font-mono cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Recruiter Hub</span>
        </button>

        {/* Title banner */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2 font-mono">
            <span className="px-2 py-0.5 text-[10px] font-bold bg-indigo-505/10 text-indigo-400 rounded-md border border-indigo-500/20 uppercase tracking-wider">
              Publishing Desk
            </span>
            <span className="text-xs text-slate-500">Auto-validating applicant requirements</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Create Corporate Hiring Drive</h1>
          <p className="text-sm text-slate-400 mt-1 leading-relaxed">
            Specify professional requirements, minimal educational cut-off parameters, and branch limitations. This restricts applications only to matching students.
          </p>
        </div>

        {/* Create post form sheet */}
        <form onSubmit={handlePublish} className="bg-slate-950 p-6 sm:p-8 rounded-2xl border border-slate-800/80 shadow-md space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Job Title */}
            <div className="md:col-span-2">
              <label className="text-xs font-bold text-slate-400 mb-2 block font-mono">Job Drive Title / Designation *</label>
              <div className="relative">
                <Briefcase className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-500" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Associate Cloud Engineer"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-11 pr-4 py-3 placeholder:text-slate-500 text-sm text-slate-100 focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-505/30 transition-all font-mono"
                />
              </div>
            </div>

            {/* Location */}
            <div>
              <label className="text-xs font-bold text-slate-400 mb-2 block font-mono">Work Location</label>
              <div className="relative">
                <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-500" />
                <input
                  type="text"
                  placeholder="e.g. Bangalore, IN (On-site)"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-11 pr-4 py-3 placeholder:text-slate-500 text-sm text-slate-100 focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-505/30 transition-all font-mono"
                />
              </div>
            </div>

            {/* Salary */}
            <div>
              <label className="text-xs font-bold text-slate-400 mb-2 block font-mono">Package (Compensation)</label>
              <div className="relative">
                <DollarSign className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-500" />
                <input
                  type="text"
                  placeholder="e.g. 15 LPA"
                  value={salary}
                  onChange={(e) => setSalary(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-11 pr-4 py-3 placeholder:text-slate-500 text-sm text-slate-100 focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-505/30 transition-all font-mono"
                />
              </div>
            </div>

            {/* Minimum CGPA */}
            <div>
              <label className="text-xs font-bold text-slate-400 mb-2 block font-mono">Minimum Required CGPA</label>
              <div className="relative">
                <Award className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-500" />
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="10"
                  placeholder="e.g. 7.5"
                  value={minCgpa}
                  onChange={(e) => setMinCgpa(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-11 pr-4 py-3 placeholder:text-slate-500 text-sm text-slate-100 focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-505/30 transition-all font-mono"
                />
              </div>
            </div>

            {/* Target Batch graduations */}
            <div>
              <label className="text-xs font-bold text-slate-400 mb-2 block font-mono">Eligible Graduating Batch Year</label>
              <div className="relative">
                <BookOpen className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-500" />
                <input
                  type="number"
                  placeholder="e.g. 2026"
                  value={batchYear}
                  onChange={(e) => setBatchYear(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-11 pr-4 py-3 placeholder:text-slate-500 text-sm text-slate-100 focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-505/30 transition-all font-mono"
                />
              </div>
            </div>

            {/* Deadline limit */}
            <div className="md:col-span-2">
              <label className="text-xs font-bold text-slate-400 mb-2 block font-mono">Application Closing Date</label>
              <div className="relative">
                <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-500" />
                <input
                  type="date"
                  value={lastDate}
                  onChange={(e) => setLastDate(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-11 pr-4 py-3 text-sm text-slate-100 focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-505/30 transition-all font-mono"
                />
              </div>
            </div>

            {/* Branch Limitations multi-check list */}
            <div className="md:col-span-2">
              <label className="text-xs font-bold text-slate-400 mb-2 block font-mono">Allowed Branches Cut-off Restrictions</label>
              <p className="text-[11px] text-slate-500 mb-3 block">Only candidates matching selected options can file applications.</p>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {availableBranches.map((branch) => {
                  const active = selectedBranches.includes(branch);
                  return (
                    <button
                      key={branch}
                      type="button"
                      onClick={() => handleBranchClick(branch)}
                      className={`px-3 py-2.5 rounded-xl border text-xs font-bold transition-all flex items-center justify-between cursor-pointer ${
                        active 
                          ? "bg-indigo-500/15 border-indigo-500 text-indigo-400" 
                          : "bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      <span>{branch}</span>
                      {active && <Check className="w-4 h-4 text-indigo-400" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Job Description */}
            <div className="md:col-span-2">
              <label className="text-xs font-bold text-slate-400 mb-2 block font-mono">Full Work Specifications & Scope</label>
              <textarea
                rows={5}
                placeholder="Include responsibilities, technical skill requirements, interview process guidelines..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 placeholder:text-slate-500 text-sm text-slate-100 focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-505/30 transition-all font-sans leading-relaxed"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-900 flex justify-end gap-3 font-mono">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="px-4 py-2.5 text-xs font-bold text-slate-400 hover:text-white bg-slate-900 hover:bg-slate-805 rounded-xl border border-slate-800 transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-extrabold rounded-xl transition-all shadow-md shadow-indigo-600/10 cursor-pointer disabled:opacity-40"
            >
              {loading ? "Publishing Opening..." : "Publish Job Drive"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
