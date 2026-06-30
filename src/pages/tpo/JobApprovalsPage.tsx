import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../../lib/axiosInstance";
import { CheckCircle, XCircle, Building, MapPin, DollarSign, Layers, Users } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import toast from "react-hot-toast";
import TPONavigation from "../../components/TPONavigation";

interface PendingJob {
  id: string;
  company_name: string;
  job_title: string;
  location: string;
  salary_package: string;
  min_cgpa: number;
  allowed_branches: string[];
  batch_year: number;
  job_description: string;
  hrName: string;
  created_at: string;
}

export default function TPOJobApprovalPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<PendingJob[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchJobs = () => {
    setLoading(true);
    axiosInstance.get("/api/jobs/tpo/pending")
      .then(res => setJobs(res.data.data || []))
      .catch(err => {
        console.error("Error fetching pending jobs:", err);
        toast.error("Failed to load pending jobs");
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchJobs(); }, []);

  const handleApprove = async (jobId: string) => {
    try {
      await axiosInstance.patch(`/api/jobs/tpo/approve/${jobId}`);
      toast.success("Job approved successfully");
      fetchJobs();
    } catch (err: any) {
      console.error("Approve error:", err);
      toast.error(err.response?.data?.message || "Failed to approve");
    }
  };

  const handleReject = async (jobId: string) => {
    try {
      await axiosInstance.patch(`/api/jobs/tpo/reject/${jobId}`);
      toast.success("Job rejected");
      fetchJobs();
    } catch (err: any) {
      console.error("Reject error:", err);
      toast.error(err.response?.data?.message || "Failed to reject");
    }
  };

  return (
    <div className="flex app-shell max-lg:flex-col bg-gray-50 overflow-hidden">
      <TPONavigation />
      <main className="app-main overflow-y-auto p-4 sm:p-6 lg:p-10">
        <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Job Approvals</h1>
            <p className="text-sm text-gray-500 mt-1">Review and approve recruiter job postings</p>
          </div>
          <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-medium">{jobs.length} pending</span>
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-500">Loading...</div>
        ) : jobs.length === 0 ? (
          <div className="text-center py-12 text-gray-500 bg-white rounded-xl border">
            <CheckCircle className="w-12 h-12 mx-auto mb-3 text-green-400" />
            <p className="font-medium">No pending job approvals</p>
            <p className="text-sm">All jobs have been reviewed.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {jobs.map(job => (
              <div key={job.id} className="bg-white rounded-xl border p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-semibold">{job.job_title}</h3>
                    <div className="flex items-center gap-2 text-gray-500 mt-1">
                      <Building className="w-4 h-4" />
                      <span>{job.company_name}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleApprove(job.id)} className="flex items-center gap-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors">
                      <CheckCircle className="w-4 h-4" /> Approve
                    </button>
                    <button onClick={() => handleReject(job.id)} className="flex items-center gap-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors">
                      <XCircle className="w-4 h-4" /> Reject
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mt-4 text-sm">
                  <div className="flex items-center gap-2 text-gray-600">
                    <MapPin className="w-4 h-4" /> {job.location}
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <DollarSign className="w-4 h-4" /> {job.salary_package}
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Layers className="w-4 h-4" /> CGPA ≥ {job.min_cgpa}
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Users className="w-4 h-4" /> Batch {job.batch_year}
                  </div>
                </div>
                <div className="mt-3 text-sm">
                  <span className="text-gray-500">Branches: </span>
                  <span>{job.allowed_branches?.length ? job.allowed_branches.join(", ") : "All"}</span>
                </div>
                <div className="mt-2 text-sm text-gray-500">
                  <span>Posted by: {job.hrName} | </span>
                  <span>{new Date(job.created_at).toLocaleDateString()}</span>
                </div>
                {job.job_description && (
                  <p className="mt-3 text-sm text-gray-600 line-clamp-2">{job.job_description}</p>
                )}
              </div>
            ))}
          </div>
        )}
        </div>
      </main>
    </div>
  );
}
