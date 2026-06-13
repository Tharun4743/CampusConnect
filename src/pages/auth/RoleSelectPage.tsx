import { Link, useSearchParams } from "react-router-dom";
import { GraduationCap, Award, Briefcase, Shield, ArrowRight } from "lucide-react";

export default function RoleSelectPage() {
  const [searchParams] = useSearchParams();
  const email = searchParams.get("email") || "";
  const name = searchParams.get("name") || "";
  const queryStr = email ? `?email=${encodeURIComponent(email)}&name=${encodeURIComponent(name)}` : "";

  const roles = [
    {
      id: "student",
      title: "Student Core",
      desc: "Apply for placements, manage academic resume profiles, and track jobs.",
      route: "/signup/student",
      icon: GraduationCap,
      color: "bg-blue-500",
      lightColor: "bg-blue-50 text-blue-600 border-blue-100",
      disabled: false,
    },
    {
      id: "tpo",
      title: "Placement Officer (TPO)",
      desc: "Verify college student GPAs, administer job drives, and manage HR relationships.",
      route: "/signup/tpo",
      icon: Award,
      color: "bg-sky-500",
      lightColor: "bg-sky-50 text-sky-600 border-sky-100",
      disabled: false,
    },
    {
      id: "hr",
      title: "Corporate HR / Recruiter",
      desc: "Post openings, coordinate campus selection rounds, and select candidates.",
      route: "/signup/hr",
      icon: Briefcase,
      color: "bg-indigo-500",
      lightColor: "bg-indigo-50 text-indigo-600 border-indigo-100",
      disabled: false,
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-4xl w-full space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight sm:text-4xl">
            Choose Your Portal Access
          </h2>
          <p className="mt-3 text-lg text-slate-500 max-w-xl mx-auto">
            Select the role matching your profile to proceed with account registration and placement onboarding
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-12">
          {roles.map((r) => {
            const IconComponent = r.icon;
            if (r.disabled) {
              return (
                <div
                  key={r.id}
                  className="relative p-6 rounded-2xl border border-slate-200 bg-slate-50/50 opacity-60 flex flex-col justify-between cursor-not-allowed select-none"
                >
                  <div>
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-slate-100 text-slate-400 border border-slate-200 mb-4">
                      <IconComponent className="w-6 h-6" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-400 flex items-center gap-2">
                      {r.title}
                      <span className="text-[10px] tracking-wider uppercase font-bold px-2 py-0.5 roundedbg rounded-full bg-slate-200 text-slate-500">
                        Seed Only
                      </span>
                    </h3>
                    <p className="mt-2 text-sm text-slate-400 leading-relaxed">
                      {r.desc}
                    </p>
                  </div>
                </div>
              );
            }

            return (
              <Link
                key={r.id}
                to={`${r.route}${queryStr}`}
                className="group relative p-6 rounded-2xl border border-slate-200 bg-white hover:border-blue-300 hover:shadow-md transition-all flex flex-col justify-between cursor-pointer"
              >
                <div>
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center border ${r.lightColor} mb-4 group-hover:scale-105 transition-transform`}>
                    <IconComponent className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 group-hover:text-blue-600 transition-colors flex items-center gap-1.5">
                    {r.title}
                  </h3>
                  <p className="mt-2 text-sm text-slate-500 leading-relaxed">
                    {r.desc}
                  </p>
                </div>
                <div className="pt-6 flex items-center justify-end text-sm font-bold text-blue-600 gap-1 opacity-80 group-hover:opacity-100 group-hover:translate-x-1 transition-all">
                  <span>Register Profile</span>
                  <ArrowRight className="w-4 h-4" />
                </div>
              </Link>
            );
          })}
        </div>

        <div className="text-center pt-4">
          <p className="text-sm text-slate-500">
            Already registered?{" "}
            <Link to="/login" className="font-bold text-blue-600 hover:underline">
              Return to Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
