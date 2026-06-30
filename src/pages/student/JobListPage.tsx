import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Briefcase, 
  Search, 
  Filter, 
  Building, 
  MapPin, 
  Award, 
  Calendar, 
  CheckCircle, 
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
        const jobsData = res.data.data || [];
        setJobs(jobsData);
        
        // Extract all unique branches from jobs
        const branchesSet = new Set<string>();
        jobsData.forEach((job: any) => {
          if (Array.isArray(job.allowed_departments)) {
            job.allowed_departments.forEach((b: string) => {
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
        fetchJobs(); // Reload to update applied state
      } else {
        toast.error(res.data?.message || "Failed to apply.");
      }
    } catch (err: any) {
      console.error("Apply failed:", err);
      toast.error(err.response?.data?.message || "Eligibility threshold or missing resume.");
    }
  };

  // Filter computation
  const filteredJobs = jobs.filter((job) => {
    // Search match (Title or Company name)
    const matchesSearch = 
      job.title.toLowerCase().includes(search.toLowerCase()) ||
      (job.company_name && job.company_name.toLowerCase().includes(search.toLowerCase()));

    // min CGPA check
    const matchesCgpa = 
      minCgpaFilter === "all" || 
      (job.min_cgpa || 0) <= parseFloat(minCgpaFilter);

    // Branch filter
    const matchesBranch = 
      branchFilter === "all" ||
      !job.allowed_departments ||
      job.allowed_departments.length === 0 ||
      job.allowed_departments.some((branch: string) => branch.toLowerCase().trim() === branchFilter.toLowerCase().trim());

    // Eligibility toggle filter
    const matchesEligible = !eligibleOnly || job.is_eligible;

    return matchesSearch && matchesCgpa && matchesBranch && matchesEligible;
  });

  const getStatusBadgeStyles = (status: string) => {
    const s = status.toLowerCase();
    if (s.includes("placed") || s.includes("selected")) return "bg-green-100 text-green-700 border-green-200";
    if (s.includes("interview")) return "bg-purple-100 text-purple-700 border-purple-200";
    if (s.includes("shortlist")) return "bg-indigo-100 text-indigo-700 border-indigo-200";
    if (s.includes("reject")) return "bg-red-100 text-red-700 border-red-200";
    return "bg-sky-100 text-sky-700 border-sky-200";
  };

  return (
    <div className="flex app-shell max-lg:flex-col bg-gray-50 overflow-hidden">
      <StudentNavigation />

      <main className="app-main overflow-y-auto overflow-x-hidden p-4 sm:p-6 lg:p-8 space-y-6 overflow-y-auto max-w-7xl mx-auto w-full">
        {/* Header Block */}
        <div className="bg-white p-6 rounded-2xl border border-sky-100 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-sky-50 text-sky-600 rounded-md border border-sky-100">
              Active Drives
            </span>
            <span className="text-xs text-gray-400">Real-time database synched</span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 tracking-tight">
            Campus Placement Jobs
          </h1>
          <p className="text-sm text-gray-500 mt-1 max-w-2xl leading-relaxed">
            Discover verified jobs corresponding to your batch year, CGPA threshold, and branch requirements. Check eligibility live to submit resumes.
          </p>
        </div>

        {/* Filters Toolbar */}
        <div className="bg-white p-5 rounded-2xl border border-sky-100 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100">
            <div className="flex items-center gap-2 text-gray-800 font-bold text-sm">
              <Filter className="w-4 h-4 text-sky-500" />
              <span>Search & Filter Parameters</span>
            </div>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 text-xs font-bold text-gray-600 cursor-pointer select-none">
                <input 
                  type="checkbox" 
                  checked={eligibleOnly}
                  onChange={(e) => setEligibleOnly(e.target.checked)}
                  className="rounded border-gray-300 bg-white text-sky-500 focus:ring-sky-500/40 w-4 h-4 cursor-pointer"
                />
                Show Only Eligible Roles
              </label>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {/* Search Query */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search company, job role..."
                className="w-full bg-sky-50/25 border border-sky-100 text-gray-900 placeholder-gray-400 text-xs rounded-xl pl-9 pr-4 py-2.5 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500/30 transition-all"
              />
            </div>

            {/* Min CGPA threshold dropdown */}
            <div>
              <select
                value={minCgpaFilter}
                onChange={(e) => setMinCgpaFilter(e.target.value)}
                className="w-full bg-sky-50/25 border border-sky-100 text-gray-700 text-xs rounded-xl px-3 py-2.5 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500/30 transition-all cursor-pointer"
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
                className="w-full bg-sky-50/25 border border-sky-100 text-gray-700 text-xs rounded-xl px-3 py-2.5 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500/30 transition-all cursor-pointer"
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
                className="w-full md:w-auto px-4 py-2.5 text-xs font-bold text-gray-400 hover:text-sky-600 bg-sky-50 hover:bg-sky-100 border border-sky-100 rounded-xl transition-all cursor-pointer"
              >
                Reset Controls
              </button>
            </div>
          </div>
        </div>

        {/* Loading Spinner */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
            <div className="w-10 h-10 border-4 border-sky-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-gray-400 text-xs font-mono">Fetching placement markets...</p>
          </div>
        ) : filteredJobs.length === 0 ? (
          <div className="bg-white rounded-2xl border border-sky-100 p-12 text-center max-w-xl mx-auto my-10 shadow-sm animate-in fade-in-50 duration-200">
            <Briefcase className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-gray-700">No Job Drives Found</h3>
            <p className="text-sm text-gray-400 mt-2">
              There are no job postings active matching your search filters at this time. Refine search guidelines or check back later!
            </p>
          </div>
        ) : (
          /* Cards Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredJobs.map((job) => {
              const formattedDate = new Date(job.apply_deadline).toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
                year: "numeric"
              });

              const appliedStatus = Array.isArray(job.job_applications) && job.job_applications.find((ja: any) => ja.student_id === axiosInstance.defaults.headers.common["Authorization"] || true)?.status; // Fallback or read from already_applied
              const alreadyApplied = job.already_applied;

              return (
                <div
                  key={job.id}
                  onClick={() => navigate(`/student/jobs/${job.id}`)}
                  className="group bg-white p-6 rounded-2xl border border-gray-200 hover:border-sky-300 transition-all duration-200 cursor-pointer shadow-xs relative flex flex-col justify-between"
                >
                  <div>
                    {/* Top Section */}
                    <div className="flex justify-between items-start gap-2 mb-4">
                      <div>
                        <div className="flex items-center gap-1.5 text-gray-450 text-xs font-bold mb-1">
                          <Building className="w-3.5 h-3.5 text-sky-500 shrink-0" />
                          <span className="truncate max-w-[200px]">{job.company_name || "Unknown Company"}</span>
                        </div>
                        <h3 className="text-base font-bold text-gray-900 group-hover:text-sky-600 transition-colors leading-tight">
                          {job.title}
                        </h3>
                      </div>

                      <div className="bg-sky-50 text-sky-700 rounded-lg px-2.5 py-1 text-xs font-bold border border-sky-100 whitespace-nowrap">
                        {job.package_max ? `${job.package_min ? job.package_min + '-' : ''}${job.package_max} LPA` : "N/A"}
                      </div>
                    </div>

                    {/* Metadata tags */}
                    <div className="flex flex-wrap gap-2 mb-6 text-xs text-gray-500">
                      <div className="flex items-center gap-1 bg-sky-50/35 px-2 py-0.5 rounded-md border border-sky-100">
                        <MapPin className="w-3.5 h-3.5 text-gray-400" />
                        <span>{job.location || "N/A"}</span>
                      </div>
                      <div className="flex items-center gap-1 bg-sky-50/35 px-2 py-0.5 rounded-md border border-sky-100">
                        <Award className="w-3.5 h-3.5 text-gray-400" />
                        <span>Min CGPA: {(job.min_cgpa || 0).toFixed(1)}</span>
                      </div>
                      <div className="flex items-center gap-1 bg-sky-50/35 px-2 py-0.5 rounded-md border border-sky-100">
                        <Calendar className="w-3.5 h-3.5 text-gray-400" />
                        <span>Apply by: {formattedDate}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions & Eligibility Row */}
                  <div className="pt-4 border-t border-gray-100 flex items-center justify-between gap-4 mt-auto">
                    {/* Eligibility details badge */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {job.is_eligible ? (
                        <div className="flex items-center gap-1 text-[10px] font-bold text-green-700 bg-green-50 px-2 py-0.5 rounded-md border border-green-150">
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>Eligible to Apply</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-[10px] font-bold text-red-700 bg-red-50 px-2 py-0.5 rounded-md border border-red-150 group/tooltip relative">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                          <span>Not Eligible</span>
                          
                          {/* Rich inline hover details of failure rule */}
                          <div className="hidden group-hover/tooltip:block absolute bottom-full left-0 mb-2 w-64 bg-white border border-red-200 p-3 rounded-xl shadow-xl text-[10px] text-gray-600 z-20">
                            <span className="font-bold text-red-600 block mb-1">Constraints Failed:</span>
                            {job.eligibility_reasons && job.eligibility_reasons.map((reason: string, rIdx: number) => (
                              <p key={rIdx} className="block text-gray-500 mt-0.5">• {reason}</p>
                            ))}
                            {(!job.eligibility_reasons || job.eligibility_reasons.length === 0) && (
                              <p className="text-gray-400">Academic criteria mismatch</p>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Display applied status */}
                      {alreadyApplied && (
                        <span className="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-md border bg-sky-100 text-sky-700 border-sky-200">
                          Applied
                        </span>
                      )}
                    </div>

                    {/* Apply actions */}
                    {alreadyApplied ? (
                      <span className="text-gray-400 text-xs font-bold flex items-center gap-1 py-1">
                        Applied <CheckCircle className="w-3.5 h-3.5 text-sky-500" />
                      </span>
                    ) : job.is_eligible ? (
                      <button
                        onClick={(e) => handleApply(job.id, e)}
                        className="px-4 py-2 text-xs font-bold text-white bg-sky-500 hover:bg-sky-600 rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
                      >
                        Apply <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    ) : (
                      <button
                        disabled
                        className="px-4 py-2 text-xs font-semibold text-gray-400 bg-gray-50 border border-gray-200 rounded-xl cursor-not-allowed"
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
