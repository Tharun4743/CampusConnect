import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Briefcase, 
  Search, 
  Filter, 
  Building, 
  MapPin, 
  DollarSign, 
  Award, 
  Calendar, 
  CheckCircle, 
  XSquare, 
  ArrowRight,
  AlertCircle
} from "lucide-react";
import toast from "react-hot-toast";
import StudentNavigation from "../../components/StudentNavigation";
import axiosInstance from "../../lib/axiosInstance";

export default function JobListPage() {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filtering States
  const [search, setSearch] = useState("");
  const [minCgpaFilter, setMinCgpaFilter] = useState("all");
  const [branchFilter, setBranchFilter] = useState("all");
  const [eligibleOnly, setEligibleOnly] = useState(false);

  // Extract branches dynamically to populate dropdown
  const [extractedBranches, setExtractedBranches] = useState<string[]>([]);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get("/api/jobs/available");
      if (res.data?.success) {
        setJobs(res.data.data || []);
        
        // Extract all unique branches from jobs
        const branchesSet = new Set<string>();
        res.data.data.forEach((job: any) => {
          if (Array.isArray(job.allowed_branches)) {
            job.allowed_branches.forEach((b: string) => {
              if (b && b.trim() !== "") {
                branchesSet.add(b.trim());
              }
            });
          }
        });
        setExtractedBranches(Array.from(branchesSet));
      } else {
        toast.error(res.data?.message || "Failed to retrieve available jobs.");
      }
    } catch (err: any) {
      console.error("Failed to load jobs list:", err);
      toast.error(err.response?.data?.message || "Error synchronizing with recruiting registry.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const handleApply = async (jobId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Avoid navigating to details page
    try {
      const res = await axiosInstance.post(`/api/jobs/apply/${jobId}`);
      if (res.data?.success) {
        toast.success("Applied successfully! Your profile is shared with recruiters.");
        // Reload list to update applied status
        fetchJobs();
      } else {
        toast.error(res.data?.message || "Failed to apply.");
      }
    } catch (err: any) {
      console.error("Apply failed:", err);
      toast.error(err.response?.data?.message || "Eligibility threshold or missing resume block.");
    }
  };

  // Filter computation
  const filteredJobs = jobs.filter((job) => {
    // Search match (Title or Company name)
    const matchesSearch = 
      job.job_title.toLowerCase().includes(search.toLowerCase()) ||
      job.company_name.toLowerCase().includes(search.toLowerCase());

    // min CGPA check
    const matchesCgpa = 
      minCgpaFilter === "all" || 
      job.min_cgpa <= parseFloat(minCgpaFilter);

    // Branch filter
    const matchesBranch = 
      branchFilter === "all" ||
      job.allowed_branches.length === 0 ||
      job.allowed_branches.some((branch: string) => branch.toLowerCase().trim() === branchFilter.toLowerCase().trim());

    // Eligibility toggle filter
    const matchesEligible = !eligibleOnly || job.isEligible;

    return matchesSearch && matchesCgpa && matchesBranch && matchesEligible;
  });

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-slate-900 text-slate-100">
      <StudentNavigation />

      <main className="flex-1 p-6 lg:p-8">
        {/* Header Block */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-1 text-[11px] font-bold uppercase tracking-widest bg-blue-500/10 text-blue-400 rounded-md border border-blue-500/20">
              Active Drives
            </span>
            <span className="text-xs text-slate-500 font-mono">Real-time database synched</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            Campus Placement Jobs
          </h1>
          <p className="text-sm text-slate-400 mt-1 max-w-2xl leading-relaxed">
            Discover verified jobs corresponding to your batch year, CGPA threshold, and branch requirements. Check eligibility live to submit resumes.
          </p>
        </div>

        {/* Dashboard Filters Toolbar */}
        <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800/80 shadow-md mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 mb-4 border-b border-slate-800/60">
            <div className="flex items-center gap-2 text-slate-300 font-semibold text-sm">
              <Filter className="w-4 h-4 text-blue-400" />
              <span>Search & Filter Parameters</span>
            </div>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 text-xs font-semibold text-slate-400 cursor-pointer select-none">
                <input 
                  type="checkbox" 
                  checked={eligibleOnly}
                  onChange={(e) => setEligibleOnly(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-900 text-blue-500 focus:ring-blue-500/40 w-4 h-4 cursor-pointer"
                />
                Show Only Eligible Roles
              </label>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search Query */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search company, job role..."
                className="w-full bg-slate-900 border border-slate-800 text-slate-100 placeholder-slate-500 text-xs rounded-xl pl-9 pr-4 py-2.5 focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 transition-all font-mono"
              />
            </div>

            {/* Min CGPA threshold dropdown */}
            <div>
              <select
                value={minCgpaFilter}
                onChange={(e) => setMinCgpaFilter(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 text-slate-300 text-xs rounded-xl px-3 py-2.5 focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 transition-all"
              >
                <option value="all">Any CGPA Requirement</option>
                <option value="6.0">Under 6.0 CGPA Requirements</option>
                <option value="7.0">Under 7.0 CGPA Requirements</option>
                <option value="8.0">Under 8.0 CGPA Requirements</option>
                <option value="9.0">Under 9.0 CGPA Requirements</option>
              </select>
            </div>

            {/* Branch match dropdown */}
            <div>
              <select
                value={branchFilter}
                onChange={(e) => setBranchFilter(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 text-slate-300 text-xs rounded-xl px-3 py-2.5 focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 transition-all"
              >
                <option value="all">Any Branch Allowed</option>
                {extractedBranches.map((branch) => (
                  <option key={branch} value={branch}>{branch}</option>
                ))}
              </select>
            </div>

            {/* Clear filters trigger */}
            <div className="flex md:justify-end">
              <button
                onClick={() => {
                  setSearch("");
                  setMinCgpaFilter("all");
                  setBranchFilter("all");
                  setEligibleOnly(false);
                }}
                className="w-full md:w-auto px-4 py-2.5 text-xs font-bold text-slate-400 hover:text-white bg-slate-900 hover:bg-slate-800/80 border border-slate-800 rounded-xl transition-all font-mono"
              >
                Reset Controls
              </button>
            </div>
          </div>
        </div>

        {/* Loading Spinner */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
            <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-slate-400 text-xs font-mono">Fetching placement markets...</p>
          </div>
        ) : filteredJobs.length === 0 ? (
          <div className="bg-slate-950/40 rounded-2xl border border-slate-800/60 p-12 text-center max-w-xl mx-auto my-10">
            <Briefcase className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-slate-200">No Job Drives Found</h3>
            <p className="text-sm text-slate-400 mt-2">
              There are no job postings active matching your search filters at this time. Refine search guidelines or check back later!
            </p>
          </div>
        ) : (
          /* Cards Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredJobs.map((job) => {
              const formattedDate = new Date(job.last_date).toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
                year: "numeric"
              });

              return (
                <div
                  key={job.id}
                  onClick={() => navigate(`/student/jobs/${job.id}`)}
                  className="group bg-slate-950 p-6 rounded-2xl border border-slate-800/80 hover:border-blue-500/50 transition-all duration-200 cursor-pointer shadow-sm relative flex flex-col justify-between"
                >
                  <div>
                    {/* Top Section */}
                    <div className="flex justify-between items-start gap-2 mb-4">
                      <div>
                        <div className="flex items-center gap-1.5 text-slate-400 text-xs font-bold mb-1">
                          <Building className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                          <span className="truncate max-w-[200px]">{job.company_name}</span>
                        </div>
                        <h3 className="text-lg font-bold text-white group-hover:text-blue-400 transition-colors leading-tight">
                          {job.job_title}
                        </h3>
                      </div>

                      {/* Package display */}
                      <div className="bg-blue-500/10 text-blue-400 rounded-lg px-2.5 py-1 text-xs font-bold font-mono border border-blue-500/20 whitespace-nowrap">
                        {job.salary_package}
                      </div>
                    </div>

                    {/* Metadata tags */}
                    <div className="flex flex-wrap gap-2.5 mb-6 text-xs text-slate-400 font-mono">
                      <div className="flex items-center gap-1 bg-slate-900 px-2 py-1 rounded-md border border-slate-800/80">
                        <MapPin className="w-3.5 h-3.5 text-slate-500" />
                        <span>{job.location}</span>
                      </div>
                      <div className="flex items-center gap-1 bg-slate-900 px-2 py-1 rounded-md border border-slate-800/80">
                        <Award className="w-3.5 h-3.5 text-slate-500" />
                        <span>Min CGPA: {job.min_cgpa.toFixed(1)}</span>
                      </div>
                      <div className="flex items-center gap-1 bg-slate-900 px-2 py-1 rounded-md border border-slate-800/80">
                        <Calendar className="w-3.5 h-3.5 text-slate-500" />
                        <span>Apply by: {formattedDate}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions & Eligibility Row */}
                  <div className="pt-4 border-t border-slate-800/60 flex items-center justify-between gap-4 mt-auto">
                    {/* Eligibility details badge */}
                    <div className="flex items-center gap-1.5">
                      {job.isEligible ? (
                        <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-400 font-mono bg-emerald-500/5 px-2 py-0.5 rounded-md border border-emerald-500/20">
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Eligible to Apply</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-[11px] font-medium text-red-400 font-mono bg-red-500/5 px-2 py-0.5 rounded-md border border-red-500/20 group/tooltip relative">
                          <AlertCircle className="w-3.5 h-3.5 text-red-400 shrink-0" />
                          <span>Not Eligible</span>
                          
                          {/* Rich inline hover details of failure rule */}
                          <div className="hidden group-hover/tooltip:block absolute bottom-full left-0 mb-2 w-64 bg-slate-900 border border-slate-800 p-2.5 rounded-xl shadow-xl text-[10px] text-slate-300 font-sans z-20">
                            <span className="font-bold text-red-400 block mb-1">Constraints Failed:</span>
                            {!job.eligibilityRules.cgpaPassed && (
                              <p className="block text-slate-400">• CGPA requirement is {job.min_cgpa.toFixed(1)} (You have {job.eligibilityRules.studentCgpa.toFixed(1)})</p>
                            )}
                            {!job.eligibilityRules.branchPassed && (
                              <p className="block text-slate-400">• Your branch ({job.eligibilityRules.studentBranch}) is not in: {job.allowed_branches.join(", ")}</p>
                            )}
                            {!job.eligibilityRules.batchPassed && (
                              <p className="block text-slate-400">• Batch restrictions: Only {job.batch_year}</p>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Display applied status */}
                      {job.appliedStatus && (
                        <span className={`text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-md border ${
                          job.appliedStatus === "selected" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                          job.appliedStatus === "shortlisted" ? "bg-amber-500/10 text-amber-400 border-amber-500/20" :
                          job.appliedStatus === "rejected" ? "bg-red-500/10 text-red-500 border-red-500/20" :
                          "bg-blue-500/10 text-blue-400 border-blue-500/20"
                        }`}>
                          {job.appliedStatus}
                        </span>
                      )}
                    </div>

                    {/* Apply actions */}
                    {job.appliedStatus ? (
                      <span className="text-slate-500 text-xs font-bold flex items-center gap-1 py-1 font-mono">
                        Applied <CheckCircle className="w-3.5 h-3.5 text-slate-500" />
                      </span>
                    ) : job.isEligible ? (
                      <button
                        onClick={(e) => handleApply(job.id, e)}
                        className="px-4 py-2 text-xs font-extrabold text-white bg-blue-600 hover:bg-blue-500 rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
                      >
                        Apply <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    ) : (
                      <button
                        disabled
                        className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-900 border border-slate-800 rounded-xl cursor-not-allowed"
                      >
                        Ineligible
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
