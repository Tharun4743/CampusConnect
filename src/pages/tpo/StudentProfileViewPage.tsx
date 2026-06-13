import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axiosInstance from "../../lib/axiosInstance";
import { 
  User, 
  BookOpen, 
  Wrench, 
  ArrowLeft,
  Calendar,
  Building,
  GraduationCap,
  Briefcase,
  Layers,
  Award,
  Check,
  X,
  Clock
} from "lucide-react";
import toast from "react-hot-toast";
import TPONavigation from "../../components/TPONavigation";

export default function StudentProfileViewPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [student, setStudent] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchStudentDetails = async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get("/api/tpo/students");
      if (res.data?.success) {
        const found = (res.data.data || []).find((s: any) => s.id === id);
        if (found) {
          setStudent(found);
        } else {
          toast.error("Student profile not found.");
          navigate("/tpo/students");
        }
      }
    } catch (err: any) {
      console.error("Failed to fetch student details:", err);
      toast.error("Failed to load student details.");
      navigate("/tpo/students");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (targetStatus: string) => {
    try {
      await axiosInstance.put(`/api/tpo/students/${id}/status`, { status: targetStatus });
      toast.success(`Student status changed to ${targetStatus}`);
      fetchStudentDetails();
    } catch (err) {
      toast.error("Failed to update status.");
    }
  };

  useEffect(() => {
    if (id) {
      fetchStudentDetails();
    }
  }, [id]);

  if (loading) {
    return (
      <div className="flex h-screen bg-gray-50 overflow-hidden">
        <TPONavigation />
        <main className="flex-1 flex items-center justify-center">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </main>
      </div>
    );
  }

  if (!student) return null;

  const details = student.details || {};
  const statusColor = student.status === "active" ? "bg-green-50 text-green-700 border-green-200" : student.status === "pending" ? "bg-yellow-50 text-yellow-755 border-yellow-200" : "bg-red-50 text-red-600 border-red-200";

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <TPONavigation />

      <main className="flex-1 overflow-y-auto p-6 lg:p-10">
        {/* Back Button */}
        <button
          onClick={() => navigate("/tpo/students")}
          className="inline-flex items-center gap-1.5 text-xs font-extrabold text-slate-500 hover:text-slate-800 transition-colors uppercase tracking-wider mb-6 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Students List</span>
        </button>

        {/* Profile Card Header */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-amber-500 text-white flex items-center justify-center text-2xl font-black shadow-sm uppercase shrink-0">
                {student.name ? student.name.charAt(0).toUpperCase() : "S"}
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-2xl font-black text-slate-900 tracking-tight leading-none">{student.name}</h1>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border uppercase ${statusColor}`}>
                    {student.status}
                  </span>
                </div>
                <p className="text-sm text-slate-500 mt-1.5 font-mono">{student.email} • Roll: {details.roll_number || "N/A"}</p>
              </div>
            </div>

            {/* Quick Status Approval Controls */}
            <div className="flex items-center gap-2 font-mono text-xs">
              {student.status !== "active" && (
                <button
                  onClick={() => handleStatusChange("active")}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-extrabold rounded-xl transition-all cursor-pointer shadow-sm flex items-center gap-1"
                >
                  <Check className="w-4 h-4" /> Approve
                </button>
              )}
              {student.status !== "rejected" && (
                <button
                  onClick={() => handleStatusChange("rejected")}
                  className="px-4 py-2 bg-red-650 hover:bg-red-700 text-white font-extrabold rounded-xl transition-all cursor-pointer shadow-sm flex items-center gap-1"
                >
                  <X className="w-4 h-4" /> Reject
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Main Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Left / Main Info */}
          <div className="md:col-span-2 space-y-6">
            {/* Academic Details */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
                <BookOpen className="w-5 h-5 text-amber-500" />
                <span>Academic Records</span>
              </h3>
              <div className="grid grid-cols-2 gap-6 text-xs font-mono">
                <div>
                  <span className="text-slate-500">Department / Branch:</span>
                  <span className="text-slate-900 font-bold block mt-1 uppercase">{details.branch || details.department || "N/A"}</span>
                </div>
                <div>
                  <span className="text-slate-500">Graduation Batch Year:</span>
                  <span className="text-slate-900 font-bold block mt-1">{details.batch_year || "N/A"}</span>
                </div>
                <div>
                  <span className="text-slate-500">University CGPA:</span>
                  <span className="text-amber-600 font-black text-sm block mt-1">{details.cgpa ? `${details.cgpa} / 10.0` : "N/A"}</span>
                </div>
                <div>
                  <span className="text-slate-500">Placement Status:</span>
                  <span className="text-slate-900 font-bold block mt-1 uppercase">{details.placement_status || "UNPLACED"}</span>
                </div>
              </div>
            </div>

            {/* Resume Docs or Vault */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
                <Briefcase className="w-5 h-5 text-amber-500" />
                <span>Student Documents Vault</span>
              </h3>
              <p className="text-xs text-slate-505 italic">
                Resumes and other documents uploaded by this student can be viewed in the Document Vault page under applicant timelines.
              </p>
            </div>
          </div>

          {/* Right Side Info */}
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
                <Wrench className="w-5 h-5 text-amber-500" />
                <span>Technical Profile</span>
              </h3>

              <div>
                <span className="text-[10px] text-slate-500 uppercase font-bold tracking-widest block mb-2">Key Skills</span>
                {Array.isArray(details.technical_skills) && details.technical_skills.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {details.technical_skills.map((skill: string, idx: number) => (
                      <span key={idx} className="px-2.5 py-1 bg-slate-50 border border-slate-250 rounded-lg text-xs font-mono font-bold text-slate-700">
                        {skill}
                      </span>
                    ))}
                  </div>
                ) : (
                  <span className="text-xs text-slate-500 italic block">No skills registered.</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
