import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import tpoService from "../../lib/tpoService";
import {
  BarChart2,
  TrendingUp,
  Users,
  Briefcase,
  Award,
  Download,
  Calendar,
  RefreshCw,
  GraduationCap,
} from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "../../context/AuthContext";
import TPONavigation from "../../components/TPONavigation";

interface PlacementData {
  overall_placement_rate: number;
  total_students: number;
  placed_students: number;
  average_package: string;
  highest_package: string;
  total_companies: number;
  branch_wise?: { branch: string; placed: number; total: number }[];
  monthly_placements?: { month: string; count: number }[];
  top_companies?: { name: string; offers: number }[];
}

export default function PlacementReportsPage() {
  const [data, setData] = useState<PlacementData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const res = await tpoService.getPlacementReport();
      if (res?.success) setData(res.data);
    } catch {
      toast.error("Failed to load placement reports.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchReports(); }, []);

  const exportCSV = () => {
    if (!data) return;
    const rows: string[] = [["Metric", "Value"].join(",")];
    rows.push(["Placement Rate", `${data.overall_placement_rate?.toFixed(1)}%`].join(","));
    rows.push(["Placed Students", `${data.placed_students}/${data.total_students}`].join(","));
    rows.push(["Average Package", data.average_package || "N/A"].join(","));
    rows.push(["Highest Package", data.highest_package || "N/A"].join(","));
    rows.push(["Companies Visited", String(data.total_companies)].join(","));
    rows.push(["Total Students", String(data.total_students)].join(","));
    if (data.branch_wise?.length) {
      rows.push("");
      rows.push(["Branch", "Placed", "Total", "Percentage"].join(","));
      data.branch_wise.forEach((b) => {
        const pct = b.total > 0 ? Math.round((b.placed / b.total) * 100) : 0;
        rows.push([b.branch, String(b.placed), String(b.total), `${pct}%`].join(","));
      });
    }
    if (data.top_companies?.length) {
      rows.push("");
      rows.push(["Company", "Offers"].join(","));
      data.top_companies.forEach((c) => rows.push([c.name, String(c.offers)].join(",")));
    }
    const blob = new Blob([rows.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `placement_report_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Report exported successfully");
  };

  const StatBox = ({ label, value, icon: Icon, color }: any) => (
    <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <div className={`w-10 h-10 rounded-lg ${color} flex items-center justify-center`}>
          <Icon className="w-5 h-5" />
        </div>
        <span className="text-2xl font-bold text-gray-900">{value}</span>
      </div>
      <p className="text-sm text-gray-500">{label}</p>
    </div>
  );

  return (
    <div className="flex app-shell max-lg:flex-col bg-gray-50 overflow-hidden">
      <TPONavigation />
      <main className="app-main overflow-y-auto p-4 sm:p-6 lg:p-10">
        <div className="max-w-6xl mx-auto space-y-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Placement Reports</h1>
              <p className="text-sm text-gray-500 mt-1">Analytics and placement statistics</p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={exportCSV} disabled={!data} className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                <Download className="w-4 h-4" /> Export CSV
              </button>
              <button onClick={fetchReports} className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm hover:bg-gray-50 transition-colors">
                <RefreshCw className="w-4 h-4" /> Refresh
              </button>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : !data ? (
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
              <BarChart2 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">No placement data available yet</p>
              <p className="text-xs text-gray-400 mt-1">Data will appear once students start getting placed</p>
            </div>
          ) : (
            <>
              {/* Overview Stats */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <StatBox label="Placement Rate" value={`${data.overall_placement_rate?.toFixed(1)}%`} icon={TrendingUp} color="bg-green-100 text-green-600" />
                <StatBox label="Placed Students" value={`${data.placed_students}/${data.total_students}`} icon={GraduationCap} color="bg-blue-100 text-blue-600" />
                <StatBox label="Average Package" value={data.average_package || "N/A"} icon={Award} color="bg-purple-100 text-purple-600" />
                <StatBox label="Highest Package" value={data.highest_package || "N/A"} icon={Award} color="bg-amber-100 text-amber-600" />
                <StatBox label="Companies Visited" value={data.total_companies || 0} icon={Briefcase} color="bg-red-100 text-red-600" />
                <StatBox label="Total Students" value={data.total_students} icon={Users} color="bg-sky-100 text-sky-600" />
              </div>

              {/* Branch-wise Breakdown */}
              {data.branch_wise && data.branch_wise.length > 0 && (
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <GraduationCap className="w-5 h-5 text-blue-500" /> Branch-wise Placement
                  </h2>
                  <div className="space-y-4">
                    {data.branch_wise.map((b) => {
                      const pct = b.total > 0 ? Math.round((b.placed / b.total) * 100) : 0;
                      return (
                        <div key={b.branch}>
                          <div className="flex items-center justify-between text-sm mb-1">
                            <span className="font-medium text-gray-700">{b.branch}</span>
                            <span className="text-gray-500">{b.placed}/{b.total} ({pct}%)</span>
                          </div>
                          <div className="w-full bg-gray-100 rounded-full h-2">
                            <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Top Companies */}
              {data.top_companies && data.top_companies.length > 0 && (
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Briefcase className="w-5 h-5 text-green-500" /> Top Recruiting Companies
                  </h2>
                  <div className="space-y-3">
                    {data.top_companies.map((c, i) => (
                      <div key={c.name} className="flex items-center gap-4">
                        <span className="w-6 h-6 rounded-full bg-gray-100 text-xs font-bold text-gray-600 flex items-center justify-center shrink-0">
                          {i + 1}
                        </span>
                        <span className="text-sm font-medium text-gray-800 flex-1">{c.name}</span>
                        <span className="text-sm font-bold text-blue-600">{c.offers} offers</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
