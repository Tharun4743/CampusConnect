import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Award,
  FileText,
  Calendar,
  DollarSign,
  CheckCircle,
  XCircle,
  Clock,
  Building,
  AlertCircle,
  Download,
  Briefcase,
  Search,
  Filter,
  MapPin,
  ArrowRight,
} from "lucide-react";
import toast from "react-hot-toast";
import StudentNavigation from "../../components/StudentNavigation";
import axiosInstance from "../../lib/axiosInstance";
import { Offer } from "../../types";

type Tab = "browse" | "applications" | "offers";

function OffersPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<Tab>((searchParams.get("tab") as Tab) || "offers");

  const tabs: { key: Tab; label: string; icon: any }[] = [
    { key: "browse", label: "Browse Jobs", icon: Briefcase },
    { key: "applications", label: "Applications", icon: FileText },
    { key: "offers", label: "Job Offers", icon: Award },
  ];

  return (
    <div className="flex app-shell max-lg:flex-col bg-gray-50 overflow-hidden">
      <StudentNavigation />
      <main className="flex-1 min-w-0 overflow-x-hidden p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6 overflow-y-auto max-w-7xl mx-auto w-full">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Jobs & Offers</h1>
            <p className="text-sm text-gray-500 mt-1">Browse openings, track applications, and manage offers</p>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 bg-white rounded-xl border border-gray-200 p-1 shadow-sm">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                    activeTab === tab.key
                      ? "bg-blue-50 text-blue-700 shadow-sm"
                      : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Tab Content */}
          {activeTab === "browse" && <BrowseJobsTab />}
          {activeTab === "applications" && <ApplicationsTab />}
          {activeTab === "offers" && <OffersTab />}
      </main>
    </div>
  );
}

/* ─────── BROWSE JOBS TAB ─────── */
function BrowseJobsTab() {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [minCgpaFilter, setMinCgpaFilter] = useState("all");
  const [branchFilter, setBranchFilter] = useState("all");
  const [eligibleOnly, setEligibleOnly] = useState(false);
  const [extractedBranches, setExtractedBranches] = useState<string[]>([]);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get("/api/jobs/available");
      if (res.data?.success) {
        const jobsData = res.data.data || [];
        setJobs(jobsData);
        const branchesSet = new Set<string>();
        jobsData.forEach((job: any) => {
          if (Array.isArray(job.allowed_departments)) {
            job.allowed_departments.forEach((b: string) => {
              if (b && b.trim() !== "") branchesSet.add(b.trim());
            });
          }
        });
        setExtractedBranches(Array.from(branchesSet));
      }
    } catch (err: any) {
      toast.error("Failed to load jobs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchJobs(); }, []);

  const handleApply = async (jobId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const res = await axiosInstance.post(`/api/jobs/apply/${jobId}`);
      if (res.data?.success) {
        toast.success("Applied successfully!");
        fetchJobs();
      } else {
        toast.error(res.data?.message || "Failed to apply.");
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Eligibility threshold or missing resume.");
    }
  };

  const filteredJobs = jobs.filter((job) => {
    const matchesSearch =
      job.title.toLowerCase().includes(search.toLowerCase()) ||
      (job.company_name && job.company_name.toLowerCase().includes(search.toLowerCase()));
    const matchesCgpa =
      minCgpaFilter === "all" ||
      (job.min_cgpa || 0) <= parseFloat(minCgpaFilter);
    const matchesBranch =
      branchFilter === "all" ||
      !job.allowed_departments ||
      job.allowed_departments.length === 0 ||
      job.allowed_departments.some((b: string) => b.toLowerCase().trim() === branchFilter.toLowerCase().trim());
    const matchesEligible = !eligibleOnly || job.is_eligible;
    return matchesSearch && matchesCgpa && matchesBranch && matchesEligible;
  });

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100">
          <div className="flex items-center gap-2 text-gray-800 font-bold text-sm">
            <Filter className="w-4 h-4 text-blue-500" />
            <span>Search & Filter</span>
          </div>
          <label className="flex items-center gap-2 text-xs font-bold text-gray-600 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={eligibleOnly}
              onChange={(e) => setEligibleOnly(e.target.checked)}
              className="rounded border-gray-300 bg-white text-blue-500 focus:ring-blue-500/40 w-4 h-4 cursor-pointer"
            />
            Show Only Eligible Roles
          </label>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search company, job role..."
              className="w-full bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-400 text-xs rounded-lg pl-9 pr-4 py-2.5 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 transition-all"
            />
          </div>
          <select
            value={minCgpaFilter}
            onChange={(e) => setMinCgpaFilter(e.target.value)}
            className="w-full bg-gray-50 border border-gray-200 text-gray-700 text-xs rounded-lg px-3 py-2.5 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 transition-all cursor-pointer"
          >
            <option value="all">Any CGPA Requirement</option>
            <option value="6.0">Under 6.0 CGPA</option>
            <option value="7.0">Under 7.0 CGPA</option>
            <option value="8.0">Under 8.0 CGPA</option>
            <option value="9.0">Under 9.0 CGPA</option>
          </select>
          <select
            value={branchFilter}
            onChange={(e) => setBranchFilter(e.target.value)}
            className="w-full bg-gray-50 border border-gray-200 text-gray-700 text-xs rounded-lg px-3 py-2.5 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 transition-all cursor-pointer"
          >
            <option value="all">Any Branch</option>
            {extractedBranches.map((branch) => (
              <option key={branch} value={branch}>{branch}</option>
            ))}
          </select>
          <button
            onClick={() => { setSearch(""); setMinCgpaFilter("all"); setBranchFilter("all"); setEligibleOnly(false); }}
            className="w-full px-4 py-2.5 text-xs font-bold text-gray-400 hover:text-blue-600 bg-gray-50 hover:bg-blue-50 border border-gray-200 rounded-lg transition-all cursor-pointer"
          >
            Reset Filters
          </button>
        </div>
      </div>

      {/* Job Cards */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filteredJobs.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <Briefcase className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-gray-700">No Jobs Found</h3>
          <p className="text-sm text-gray-400 mt-2">No job postings match your filters. Try adjusting your search.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredJobs.map((job) => {
            const formattedDate = new Date(job.apply_deadline).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
            const alreadyApplied = job.already_applied;
            return (
              <div
                key={job.id}
                onClick={() => navigate(`/student/jobs/${job.id}`)}
                className="bg-white rounded-xl border border-gray-200 hover:border-blue-300 p-5 transition-all cursor-pointer shadow-sm flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-start gap-2 mb-3">
                    <div>
                      <div className="flex items-center gap-1.5 text-xs font-bold text-gray-400 mb-1">
                        <Building className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                        <span className="truncate max-w-[200px]">{job.company_name || "Unknown"}</span>
                      </div>
                      <h3 className="text-base font-bold text-gray-900 leading-tight">{job.title}</h3>
                    </div>
                    <div className="bg-blue-50 text-blue-700 rounded-lg px-2.5 py-1 text-xs font-bold border border-blue-100 whitespace-nowrap">
                      {job.package_max ? `${job.package_min ? job.package_min + '-' : ''}${job.package_max} LPA` : "N/A"}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 mb-4 text-xs text-gray-500">
                    <div className="flex items-center gap-1 bg-gray-50 px-2 py-0.5 rounded-md border border-gray-100">
                      <MapPin className="w-3.5 h-3.5 text-gray-400" />
                      <span>{job.location || "N/A"}</span>
                    </div>
                    <div className="flex items-center gap-1 bg-gray-50 px-2 py-0.5 rounded-md border border-gray-100">
                      <Award className="w-3.5 h-3.5 text-gray-400" />
                      <span>Min CGPA: {(job.min_cgpa || 0).toFixed(1)}</span>
                    </div>
                    <div className="flex items-center gap-1 bg-gray-50 px-2 py-0.5 rounded-md border border-gray-100">
                      <Calendar className="w-3.5 h-3.5 text-gray-400" />
                      <span>Apply by: {formattedDate}</span>
                    </div>
                  </div>
                </div>
                <div className="pt-4 border-t border-gray-100 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {job.is_eligible ? (
                      <div className="flex items-center gap-1 text-[10px] font-bold text-green-700 bg-green-50 px-2 py-0.5 rounded-md border border-green-200">
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>Eligible</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 text-[10px] font-bold text-red-700 bg-red-50 px-2 py-0.5 rounded-md border border-red-200">
                        <AlertCircle className="w-3.5 h-3.5" />
                        <span>Not Eligible</span>
                      </div>
                    )}
                    {alreadyApplied && (
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-md border bg-blue-100 text-blue-700 border-blue-200">
                        Applied
                      </span>
                    )}
                  </div>
                  {alreadyApplied ? (
                    <span className="text-gray-400 text-xs font-bold flex items-center gap-1">
                      Applied <CheckCircle className="w-3.5 h-3.5 text-blue-500" />
                    </span>
                  ) : job.is_eligible ? (
                    <button onClick={(e) => handleApply(job.id, e)} className="px-4 py-2 text-xs font-bold text-white bg-blue-500 hover:bg-blue-600 rounded-lg transition-all cursor-pointer flex items-center gap-1.5">
                      Apply <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  ) : (
                    <button disabled className="px-4 py-2 text-xs font-semibold text-gray-400 bg-gray-50 border border-gray-200 rounded-lg cursor-not-allowed">
                      Ineligible
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ─────── APPLICATIONS TAB ─────── */
function ApplicationsTab() {
  const navigate = useNavigate();
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMyApplications = async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get("/api/jobs/my-applications");
      if (res.data?.success) setApplications(res.data.data || []);
    } catch {
      toast.error("Failed to load applications.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchMyApplications(); }, []);

  const getStatusBadgeStyles = (status: string) => {
    const s = status.toLowerCase();
    if (s.includes("selected") || s.includes("offer")) return "bg-green-100 text-green-700 border-green-200";
    if (s.includes("reject")) return "bg-red-100 text-red-700 border-red-200";
    if (s.includes("interview")) return "bg-purple-100 text-purple-700 border-purple-200";
    if (s.includes("shortlist")) return "bg-indigo-100 text-indigo-700 border-indigo-200";
    if (s.includes("applied")) return "bg-blue-100 text-blue-700 border-blue-200";
    return "bg-gray-100 text-gray-600 border-gray-200";
  };

  return (
    <div>
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : applications.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <Clock className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-gray-700">No Applications Found</h3>
          <p className="text-sm text-gray-400 mt-2 mb-6">You haven't applied to any job drives yet.</p>
          <button
            onClick={() => document.querySelector('[data-tab="browse"]')?.dispatchEvent(new MouseEvent("click"))}
            className="px-5 py-2.5 text-xs font-bold text-white bg-blue-500 hover:bg-blue-600 rounded-lg transition-all cursor-pointer"
          >
            Browse Jobs
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {applications.map((app) => {
            const job = app.jobDetails || {};
            const appliedDateTime = new Date(app.applied_at).toLocaleString(undefined, {
              month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit"
            });
            return (
              <div
                key={app.id}
                onClick={() => navigate(`/student/jobs/${job.id}/application`)}
                className="bg-white rounded-xl border border-gray-200 hover:border-blue-200 p-5 transition-all cursor-pointer shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center font-extrabold text-blue-600 text-sm shrink-0 uppercase">
                    {job.company_name ? job.company_name.charAt(0) : "J"}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5 text-xs font-medium text-gray-400 mb-0.5">
                      <Building className="w-3.5 h-3.5 text-gray-400" />
                      <span>{job.company_name || "Unknown"}</span>
                    </div>
                    <h3 className="text-base font-bold text-gray-900 leading-snug">{job.job_title || "Job Drive"}</h3>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-xs text-gray-400">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5" />
                        <span>{job.location || "N/A"}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <DollarSign className="w-3.5 h-3.5" />
                        <span>Package: {job.salary_package || "N/A"}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between md:justify-end gap-4 border-t md:border-t-0 border-gray-100 pt-3 md:pt-0">
                  <div className="text-left md:text-right">
                    <span className="text-[10px] text-gray-400 block mb-1">Status</span>
                    <span className={`px-3 py-1 rounded-lg text-xs font-bold border ${getStatusBadgeStyles(app.status)} uppercase tracking-wider`}>
                      {app.status}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-gray-400 block mb-1">Applied</span>
                    <span className="text-xs text-gray-700 font-bold whitespace-nowrap">{appliedDateTime}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ─────── OFFERS TAB ─────── */
function OffersTab() {
  const navigate = useNavigate();
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingSince, setProcessingSince] = useState<{ [key: string]: boolean }>({});

  const fetchOffers = async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get("/api/offers");
      if (res.data?.success) setOffers(res.data.data || []);
    } catch {
      toast.error("Error loading offers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchOffers(); }, []);

  const handleAcceptOffer = async (offerId: string) => {
    try {
      setProcessingSince(prev => ({ ...prev, [offerId]: true }));
      const res = await axiosInstance.post(`/api/offers/${offerId}/accept`);
      if (res.data?.success) {
        toast.success("Offer accepted successfully!");
        fetchOffers();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to accept offer");
    } finally {
      setProcessingSince(prev => ({ ...prev, [offerId]: false }));
    }
  };

  const handleRejectOffer = async (offerId: string) => {
    if (!confirm("Are you sure you want to reject this offer? This cannot be undone.")) return;
    try {
      setProcessingSince(prev => ({ ...prev, [offerId]: true }));
      const res = await axiosInstance.post(`/api/offers/${offerId}/reject`);
      if (res.data?.success) {
        toast.success("Offer rejected");
        fetchOffers();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to reject offer");
    } finally {
      setProcessingSince(prev => ({ ...prev, [offerId]: false }));
    }
  };

  const isExpired = (offer: Offer) => {
    if (offer.status === "expired") return true;
    return new Date(offer.expires_at) < new Date();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-md bg-amber-50 text-amber-700 border border-amber-200"><Clock className="w-3 h-3" /> Pending</span>;
      case "accepted":
        return <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-md bg-green-50 text-green-700 border border-green-200"><CheckCircle className="w-3 h-3" /> Accepted</span>;
      case "rejected":
        return <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-md bg-red-50 text-red-700 border border-red-200"><XCircle className="w-3 h-3" /> Rejected</span>;
      case "expired":
        return <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-md bg-gray-50 text-gray-500 border border-gray-200"><AlertCircle className="w-3 h-3" /> Expired</span>;
    }
  };

  return (
    <div>
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : offers.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <Award className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-gray-700 mb-2">No Offers Yet</h3>
          <p className="text-sm text-gray-500">Keep applying to jobs and recruiters will send you offers soon!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {offers.map((offer) => (
            <div
              key={offer.id}
              className={`rounded-xl border p-5 transition-all ${
                offer.status === "accepted"
                  ? "bg-white border-green-200 shadow-sm"
                  : offer.status === "rejected"
                  ? "bg-white border-red-200 shadow-sm"
                  : isExpired(offer)
                  ? "bg-gray-50 border-gray-200"
                  : "bg-white border-gray-200 hover:border-blue-300 shadow-sm hover:shadow-md"
              }`}
            >
              <div className="mb-4">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Building className="w-4 h-4 text-gray-400" />
                      <p className="text-xs font-bold text-gray-500 uppercase">{offer.company_name}</p>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">{offer.job_title}</h3>
                  </div>
                  {getStatusBadge(offer.status)}
                </div>
                <div className="flex items-center gap-2 text-sm text-blue-600 font-bold">
                  <DollarSign className="w-4 h-4" />
                  <span>{offer.salary_package}</span>
                </div>
              </div>
              <div className="space-y-2 mb-4 pb-4 border-t border-gray-100">
                <div className="flex justify-between items-center text-xs text-gray-500 pt-3">
                  <span>Offer Date</span>
                  <span className="font-mono text-gray-700">{new Date(offer.created_at).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between items-center text-xs text-gray-500">
                  <span>Expires</span>
                  <span className={`font-mono text-gray-700 ${isExpired(offer) ? "text-red-500 font-semibold" : ""}`}>
                    {new Date(offer.expires_at).toLocaleDateString()}
                  </span>
                </div>
                {offer.acceptance_date && (
                  <div className="flex justify-between items-center text-xs text-green-600 font-bold">
                    <span>Accepted On</span>
                    <span className="font-mono">{new Date(offer.acceptance_date).toLocaleDateString()}</span>
                  </div>
                )}
              </div>
              {offer.status === "pending" && !isExpired(offer) ? (
                <div className="flex gap-2">
                  <button onClick={() => handleAcceptOffer(offer.id)} disabled={processingSince[offer.id]}
                    className="flex-1 px-4 py-2.5 bg-blue-500 hover:bg-blue-600 text-white text-sm font-bold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                    <CheckCircle className="w-4 h-4" /> {processingSince[offer.id] ? "Processing..." : "Accept"}
                  </button>
                  <button onClick={() => handleRejectOffer(offer.id)} disabled={processingSince[offer.id]}
                    className="flex-1 px-4 py-2.5 bg-white hover:bg-red-50 text-red-600 text-sm font-bold rounded-lg border border-red-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                    <XCircle className="w-4 h-4" /> {processingSince[offer.id] ? "Processing..." : "Reject"}
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  {offer.offer_letter_url && (
                    <button onClick={() => window.open(offer.offer_letter_url, "_blank")}
                      className="flex-1 px-4 py-2.5 bg-white hover:bg-gray-50 text-gray-700 text-sm font-bold rounded-lg border border-gray-200 transition-all flex items-center justify-center gap-2">
                      <Download className="w-4 h-4" /> Download Letter
                    </button>
                  )}
                  {isExpired(offer) && (
                    <div className="flex-1 px-4 py-2.5 bg-gray-50 text-gray-400 text-sm font-bold rounded-lg border border-gray-200 flex items-center justify-center">
                      Offer Expired
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default OffersPage;
