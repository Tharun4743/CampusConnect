import StudentNavigation from "../../components/StudentNavigation";
import { useInterviews } from "../../hooks";

export default function InterviewsPage() {
  const { interviews, loading, error } = useInterviews();

  if (loading) {
    return (
      <div className="flex h-screen bg-gray-50 overflow-hidden">
        <StudentNavigation />
        <main className="flex-1 flex items-center justify-center">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen bg-gray-50 overflow-hidden">
        <StudentNavigation />
        <div className="flex-1 p-6">
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-800">
            <p>Failed to load interviews: {error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <StudentNavigation />
      <main className="flex-1 p-6 lg:p-8 space-y-6 overflow-y-auto max-w-7xl mx-auto w-full">
        <div className="bg-white rounded-xl p-6 border border-sky-100 shadow-xs">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Interview Schedule</h1>
          
          {interviews && interviews.length > 0 ? (
            <div className="space-y-4">
              {interviews.map((interview: any) => (
                <div
                  key={interview.id}
                  className="rounded-xl border border-sky-100 p-6 cursor-pointer transition-all hover:shadow-md bg-white"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-gray-900">{interview.company_name}</h3>
                      <p className="text-sm text-gray-600 mt-1">{interview.job_title}</p>
                      <p className="text-xs text-gray-500 mt-2">
                        {new Date(interview.scheduled_at).toLocaleString()}
                      </p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      interview.status === "scheduled" ? "bg-sky-50 text-sky-700" :
                      interview.status === "completed" ? "bg-sky-50 text-sky-700" :
                      "bg-gray-50 text-gray-700"
                    }`}>
                      {interview.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500">No interviews scheduled</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
