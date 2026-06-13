import { useEffect, useState } from "react";
import axiosInstance from "../../lib/axiosInstance";
import { Search, Check, X } from "lucide-react";
import toast from "react-hot-toast";
import TPONavigation from "../../components/TPONavigation";

interface Student {
  id: string;
  name: string;
  email: string;
  status: string;
  details: {
    roll_number: string;
    branch: string;
    batch_year: number;
    cgpa: number;
  } | null;
}

export default function TPOStudentManagementPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axiosInstance.get("/api/tpo/students")
      .then(res => setStudents(Array.isArray(res.data.data) ? res.data.data : []))
      .catch(() => toast.error("Failed to load students"))
      .finally(() => setLoading(false));
  }, []);

  const handleStatus = async (userId: string, status: string) => {
    try {
      await axiosInstance.patch(`/api/tpo/students/${userId}/status`, { status });
      toast.success(`Student ${status}`);
      setStudents(prev => prev.map(s => s.id === userId ? { ...s, status } : s));
    } catch { toast.error("Failed to update"); }
  };

  const filtered = students.filter(s =>
    s.name?.toLowerCase().includes(search.toLowerCase()) ||
    s.email?.toLowerCase().includes(search.toLowerCase()) ||
    s.details?.roll_number?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <TPONavigation />
      <main className="flex-1 overflow-y-auto p-6 lg:p-10">
        <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Student Management</h1>
            <p className="text-sm text-gray-500 mt-1">Manage and verify student profiles</p>
          </div>
          <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">{students.length} total</span>
        </div>

        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input type="text" placeholder="Search by name, email, or roll number..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border focus:ring-2 focus:ring-blue-500 outline-none" />
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-500">Loading...</div>
        ) : (
          <div className="bg-white rounded-xl border overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Name</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Roll No</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Branch</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Batch</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">CGPA</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Status</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filtered.map(s => (
                  <tr key={s.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3"><p className="font-medium">{s.name}</p><p className="text-sm text-gray-500">{s.email}</p></td>
                    <td className="px-4 py-3 text-sm">{s.details?.roll_number || "N/A"}</td>
                    <td className="px-4 py-3 text-sm">{s.details?.branch || "N/A"}</td>
                    <td className="px-4 py-3 text-sm">{s.details?.batch_year || "N/A"}</td>
                    <td className="px-4 py-3 text-sm">{s.details?.cgpa || "N/A"}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${s.status === "active" ? "bg-green-100 text-green-700" : s.status === "pending" ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700"}`}>
                        {s.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        {s.status === "pending" && (
                          <>
                            <button onClick={() => handleStatus(s.id, "active")} className="p-1.5 bg-green-100 text-green-600 rounded hover:bg-green-200"><Check className="w-4 h-4" /></button>
                            <button onClick={() => handleStatus(s.id, "rejected")} className="p-1.5 bg-red-100 text-red-600 rounded hover:bg-red-200"><X className="w-4 h-4" /></button>
                          </>
                        )}
                        {s.status === "active" && (
                          <button onClick={() => handleStatus(s.id, "rejected")} className="p-1.5 bg-red-100 text-red-600 rounded hover:bg-red-200"><X className="w-4 h-4" /></button>
                        )}
                        {s.status === "rejected" && (
                          <button onClick={() => handleStatus(s.id, "active")} className="p-1.5 bg-green-100 text-green-600 rounded hover:bg-green-200"><Check className="w-4 h-4" /></button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        </div>
      </main>
    </div>
  );
}
