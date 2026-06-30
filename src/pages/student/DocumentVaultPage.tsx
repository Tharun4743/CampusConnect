import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import StudentNavigation from "../../components/StudentNavigation";
import { documentService } from "../../lib/documentService";
import {
  Upload,
  File,
  FileText,
  Trash2,
  Star,
  Download,
  Plus,
  AlertCircle,
  CheckCircle,
  Loader2,
  Eye,
  X,
} from "lucide-react";
import toast from "react-hot-toast";

interface Document {
  id: string;
  name?: string;
  file_name?: string;
  document_type: string;
  file_url?: string;
  url?: string;
  is_primary?: boolean;
  created_at: string;
  size?: number;
}

const DOC_TYPES = [
  { value: "resume", label: "Resume / CV" },
  { value: "sslc_marksheet", label: "SSLC Marksheet" },
  { value: "hsc_marksheet", label: "HSC Marksheet" },
  { value: "semester_marksheet", label: "Semester Marksheet" },
  { value: "certificate", label: "Certificate" },
  { value: "other", label: "Other" },
];

const TYPE_COLORS: Record<string, string> = {
  resume: "bg-blue-100 text-blue-700 border-blue-200",
  sslc_marksheet: "bg-purple-100 text-purple-700 border-purple-200",
  hsc_marksheet: "bg-indigo-100 text-indigo-700 border-indigo-200",
  semester_marksheet: "bg-green-100 text-green-700 border-green-200",
  certificate: "bg-amber-100 text-amber-700 border-amber-200",
  other: "bg-gray-100 text-gray-700 border-gray-250",
};

export default function DocumentVaultPage() {
  const navigate = useNavigate();
  const resumeInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);

  const [resumes, setResumes] = useState<Document[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedDocType, setSelectedDocType] = useState("semester_marksheet");
  const [activeTab, setActiveTab] = useState<"resumes" | "documents">("resumes");

  // Preview Modal States
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewTitle, setPreviewTitle] = useState("");

  const fetchAll = async () => {
    try {
      setLoading(true);
      const [resumeRes, docRes] = await Promise.all([
        documentService.getResumes(),
        documentService.getDocuments(),
      ]);
      if (resumeRes?.success) setResumes(resumeRes.data || []);
      if (docRes?.success) setDocuments(docRes.data || []);
    } catch (err) {
      toast.error("Failed to load documents");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const handleResumeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File too large. Maximum 5MB allowed.");
      return;
    }
    try {
      setUploading(true);
      const res = await documentService.uploadResume(file);
      if (res?.success) {
        toast.success("Resume uploaded successfully!");
        await fetchAll();
      }
    } catch {
      toast.error("Upload failed. Please try again.");
    } finally {
      setUploading(false);
      if (resumeInputRef.current) resumeInputRef.current.value = "";
    }
  };

  const handleDocUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File too large. Maximum 10MB allowed.");
      return;
    }
    try {
      setUploading(true);
      const res = await documentService.uploadDocument(file, selectedDocType);
      if (res?.success) {
        toast.success("Document uploaded successfully!");
        await fetchAll();
      }
    } catch {
      toast.error("Upload failed. Please try again.");
    } finally {
      setUploading(false);
      if (docInputRef.current) docInputRef.current.value = "";
    }
  };

  const handleSetPrimary = async (id: string) => {
    try {
      await documentService.setPrimaryResume(id);
      toast.success("Primary resume updated!");
      await fetchAll();
    } catch {
      toast.error("Failed to update primary resume.");
    }
  };

  const handleDeleteResume = async (id: string) => {
    if (!confirm("Delete this resume?")) return;
    try {
      await documentService.deleteResume(id);
      toast.success("Resume deleted.");
      await fetchAll();
    } catch {
      toast.error("Delete failed.");
    }
  };

  const handleDeleteDocument = async (id: string) => {
    if (!confirm("Delete this document?")) return;
    try {
      await documentService.deleteDocument(id);
      toast.success("Document deleted.");
      await fetchAll();
    } catch {
      toast.error("Delete failed.");
    }
  };

  const formatDate = (d: string) => new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

  return (
    <div className="flex app-shell max-lg:flex-col bg-gray-50 overflow-hidden">
      <StudentNavigation />
      
      <main className="flex-1 min-w-0 overflow-x-hidden p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6 overflow-y-auto max-w-7xl mx-auto w-full">
        {/* Header */}
        <div className="bg-white rounded-2xl p-6 border border-sky-100 shadow-sm">
          <h1 className="text-3xl font-bold text-gray-900">Document Vault</h1>
          <p className="text-sm text-gray-500 mt-1">Manage and preview your resumes and academic marksheet archives</p>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-250">
          {(["resumes", "documents"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-3 text-sm font-semibold capitalize border-b-2 transition-colors cursor-pointer ${
                activeTab === tab
                  ? "border-sky-500 text-sky-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab === "resumes" ? `Resumes (${resumes.length})` : `Academic Docs (${documents.length})`}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : activeTab === "resumes" ? (
          <div className="space-y-6">
            {/* Upload Resume */}
            <div
              onClick={() => !uploading && resumeInputRef.current?.click()}
              className="border-2 border-dashed border-sky-300 rounded-xl p-8 text-center cursor-pointer hover:bg-sky-50/50 transition-colors group bg-white shadow-xs"
            >
              <input
                ref={resumeInputRef}
                type="file"
                accept=".pdf,.doc,.docx"
                className="hidden"
                onChange={handleResumeUpload}
              />
              {uploading ? (
                <Loader2 className="w-8 h-8 text-sky-500 animate-spin mx-auto mb-3" />
              ) : (
                <Upload className="w-8 h-8 text-sky-400 mx-auto mb-3 group-hover:text-sky-600 transition-colors" />
              )}
              <p className="font-semibold text-gray-700 text-sm">
                {uploading ? "Uploading..." : "Click to upload resume"}
              </p>
              <p className="text-xs text-gray-400 mt-1">PDF, DOC, DOCX up to 5MB</p>
            </div>

            {/* Resume List */}
            {resumes.length === 0 ? (
              <div className="bg-white rounded-xl p-10 text-center border border-gray-200 shadow-xs">
                <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 font-medium">No resumes uploaded yet</p>
                <p className="text-xs text-gray-400">Upload a resume to get started</p>
              </div>
            ) : (
              <div className="space-y-3">
                {resumes.map((resume) => (
                  <div
                    key={resume.id}
                    className={`bg-white rounded-xl p-4 border flex items-center justify-between gap-4 hover:shadow-xs transition-shadow ${
                      resume.is_primary ? "border-sky-400 shadow-xs ring-1 ring-sky-300" : "border-gray-200"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-lg bg-sky-100 flex items-center justify-center shrink-0">
                        <FileText className="w-5 h-5 text-sky-600" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-gray-900 text-sm truncate">
                            {resume.name || resume.file_name || "Resume"}
                          </p>
                          {resume.is_primary && (
                            <span className="bg-sky-100 text-sky-700 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                              <CheckCircle className="w-3 h-3" /> Primary
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-400 mt-0.5">
                          Uploaded {formatDate(resume.created_at)}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 shrink-0">
                      {!resume.is_primary && (
                        <button
                          onClick={() => handleSetPrimary(resume.id)}
                          title="Set as Primary"
                          className="p-2 rounded-lg text-gray-400 hover:text-amber-500 hover:bg-amber-50 transition-colors cursor-pointer"
                        >
                          <Star className="w-4 h-4" />
                        </button>
                      )}
                      
                      {(resume.file_url || resume.url) && (
                        <>
                          <button
                            onClick={() => {
                              setPreviewUrl(resume.file_url || resume.url || null);
                              setPreviewTitle(resume.name || resume.file_name || "Resume");
                            }}
                            className="p-2 rounded-lg text-gray-400 hover:text-sky-600 hover:bg-sky-50 transition-colors cursor-pointer"
                            title="Preview"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          
                          <a
                            href={resume.file_url || resume.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 rounded-lg text-gray-400 hover:text-sky-600 hover:bg-sky-50 transition-colors cursor-pointer"
                            title="Download"
                          >
                            <Download className="w-4 h-4" />
                          </a>
                        </>
                      )}
                      
                      <button
                        onClick={() => handleDeleteResume(resume.id)}
                        title="Delete"
                        className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-55 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {/* Upload Document */}
            <div className="bg-white rounded-xl p-6 border border-gray-250 space-y-4 shadow-xs">
              <h3 className="font-bold text-gray-800 text-sm">Upload New Document</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-gray-500 block mb-1.5">Document Type</label>
                  <select
                    value={selectedDocType}
                    onChange={(e) => setSelectedDocType(e.target.value)}
                    className="w-full px-3 py-2 border border-sky-100 bg-sky-50/25 rounded-lg text-xs focus:ring-2 focus:ring-sky-400 focus:outline-none"
                  >
                    {DOC_TYPES.filter((t) => t.value !== "resume").map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>
                <div className="flex items-end">
                  <button
                    onClick={() => !uploading && docInputRef.current?.click()}
                    disabled={uploading}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-sky-500 text-white rounded-lg hover:bg-sky-600 transition-colors text-xs font-bold disabled:opacity-50 cursor-pointer"
                  >
                    <input
                      ref={docInputRef}
                      type="file"
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                      className="hidden"
                      onChange={handleDocUpload}
                    />
                    {uploading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Plus className="w-4 h-4" />
                    )}
                    {uploading ? "Uploading..." : "Choose File"}
                  </button>
                </div>
              </div>
              <p className="text-xs text-gray-400">PDF, DOC, DOCX, JPG, PNG up to 10MB</p>
            </div>

            {/* Document List */}
            {documents.length === 0 ? (
              <div className="bg-white rounded-xl p-10 text-center border border-gray-200 shadow-xs">
                <File className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 font-medium">No documents uploaded yet</p>
                <p className="text-xs text-gray-400">Upload transcripts, certificates, and more</p>
              </div>
            ) : (
              <div className="space-y-3">
                {documents.map((doc) => {
                  const typeLabel = DOC_TYPES.find((t) => t.value === doc.document_type)?.label || doc.document_type;
                  return (
                    <div key={doc.id} className="bg-white rounded-xl p-4 border border-gray-200 flex items-center justify-between gap-4 hover:shadow-xs transition-shadow">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-lg bg-sky-50 flex items-center justify-center shrink-0 border border-sky-100">
                          <File className="w-5 h-5 text-sky-600" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-bold text-gray-900 text-sm truncate">
                              {doc.name || doc.file_name || "Document"}
                            </p>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${TYPE_COLORS[doc.document_type] || "bg-gray-100 text-gray-705"}`}>
                              {typeLabel}
                            </span>
                          </div>
                          <p className="text-xs text-gray-400 mt-0.5">
                            Uploaded {formatDate(doc.created_at)}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 shrink-0">
                        {(doc.file_url || doc.url) && (
                          <>
                            <button
                              onClick={() => {
                                setPreviewUrl(doc.file_url || doc.url || null);
                                setPreviewTitle(doc.name || doc.file_name || "Document");
                              }}
                              className="p-2 rounded-lg text-gray-400 hover:text-sky-600 hover:bg-sky-50 transition-colors cursor-pointer"
                              title="Preview"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            
                            <a
                              href={doc.file_url || doc.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2 rounded-lg text-gray-400 hover:text-sky-600 hover:bg-sky-50 transition-colors cursor-pointer"
                              title="Download"
                            >
                              <Download className="w-4 h-4" />
                            </a>
                          </>
                        )}
                        <button
                          onClick={() => handleDeleteDocument(doc.id)}
                          className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Tip */}
        <div className="bg-sky-55 border border-sky-200 rounded-xl p-4 flex gap-3 bg-sky-50">
          <AlertCircle className="w-5 h-5 text-sky-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-sky-850">Keep your documents up to date</p>
            <p className="text-xs text-sky-600 mt-0.5">
              Your primary resume is automatically shared with job applications. Mark your latest resume as primary.
            </p>
          </div>
        </div>
      </main>

      {/* Document Preview Modal */}
      {previewUrl && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-4xl h-[85vh] flex flex-col shadow-2xl border border-gray-100 animate-in fade-in-50 zoom-in-95 duration-200">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-bold text-gray-900 truncate max-w-md">{previewTitle}</h3>
              <button
                onClick={() => {
                  setPreviewUrl(null);
                  setPreviewTitle("");
                }}
                className="p-1 rounded-lg hover:bg-gray-150 text-gray-500 hover:text-gray-800 transition-colors cursor-pointer"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="flex-1 bg-gray-50 p-2 rounded-b-2xl relative overflow-hidden">
              <iframe
                src={previewUrl}
                title="Document Preview"
                className="w-full h-full rounded-xl border border-gray-250 bg-white"
                frameBorder="0"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
