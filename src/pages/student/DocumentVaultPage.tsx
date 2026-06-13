import React, { useState, useEffect, useRef } from "react";
import { 
  FolderLock, 
  Upload, 
  FileText, 
  CheckCircle, 
  Trash2, 
  Download, 
  Eye, 
  EyeOff, 
  HelpCircle,
  Clock,
  Filter,
  ArrowUpDown,
  Search,
  Check,
  AlertCircle,
  FileSpreadsheet,
  FileArchive,
  Image,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Sparkles
} from "lucide-react";
import toast from "react-hot-toast";
import StudentNavigation from "../../components/StudentNavigation";
import { 
  uploadResume, 
  uploadDocument, 
  getResumes, 
  getDocuments, 
  deleteDocument, 
  setPrimaryResume, 
  getDownloadUrl 
} from "../../lib/fileUploadService";

export default function DocumentVaultPage() {
  const [resumes, setResumes] = useState<any[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [totalDocsCount, setTotalDocsCount] = useState(0);

  // States
  const [loading, setLoading] = useState(true);
  const [resuploading, setResUploading] = useState(false);
  const [docuploading, setDocUploading] = useState(false);

  // Filters state
  const [docTypeFilter, setDocTypeFilter] = useState("all");
  const [sortBy, setSortBy] = useState("uploadedAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  // New Upload states
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [resumeIsPrimary, setResumeIsPrimary] = useState(false);

  // Support Docs fields
  const [supportFile, setSupportFile] = useState<File | null>(null);
  const [docType, setDocType] = useState<"academic" | "certification" | "offer_letter" | "internship" | "other">("academic");
  const [docDescription, setDocDescription] = useState("");
  const [docTags, setDocTags] = useState("");
  const [docIsPublic, setDocIsPublic] = useState(true);
  const [docExpiryDate, setDocExpiryDate] = useState("");

  // Refs for drag & drop
  const resumeInputRef = useRef<HTMLInputElement>(null);
  const documentInputRef = useRef<HTMLInputElement>(null);
  const [resumeDragOver, setResumeDragOver] = useState(false);
  const [docDragOver, setDocDragOver] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const resData = await getResumes();
      if (resData.success) {
        setResumes(resData.data.resumes || []);
      }

      const docsData = await getDocuments({
        documentType: docTypeFilter,
        sort: sortBy,
        order: sortOrder,
        page: currentPage,
        limit: itemsPerPage
      });
      if (docsData.success) {
        setDocuments(docsData.data.documents || []);
        setTotalDocsCount(docsData.data.total || 0);
      }
    } catch (err) {
      console.error("Failed to load documents vault:", err);
      toast.error("Failed to synchronize documents vault.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [docTypeFilter, sortBy, sortOrder, currentPage]);

  const handleSetPrimary = async (resumeId: string) => {
    try {
      const res = await setPrimaryResume(resumeId);
      if (res.success) {
        toast.success("Primary resume revised.");
        // Hot-reload resume states
        const resData = await getResumes();
        if (resData.success) {
          setResumes(resData.data.resumes);
        }
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to make this resume your primary copy.");
    }
  };

  const handleDeleteFile = async (id: string, isResume: boolean) => {
    if (!window.confirm("Are you sure you want to delete this file from your placement vault? This cannot be undone.")) {
      return;
    }
    try {
      const res = await deleteDocument(id);
      if (res.success) {
        toast.success("File securely purged from vault.");
        loadData();
      }
    } catch (err) {
      toast.error("Database deletion pipeline failed.");
    }
  };

  // Submit resume upload
  const handleResumeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resumeFile) {
      toast.error("Please pick a file first.");
      return;
    }

    // Format check
    const ext = resumeFile.name.split(".").pop()?.toLowerCase();
    const allowed = ["pdf", "doc", "docx"];
    if (!ext || !allowed.includes(ext)) {
      toast.error("Invalid format: Resumes must be PDF, DOC, or DOCX files.");
      return;
    }

    // Size limit check (5MB)
    if (resumeFile.size > 5 * 1024 * 1024) {
      toast.error("File is too large! Maximum allowed size is 5MB for resumes.");
      return;
    }

    try {
      setResUploading(true);
      const res = await uploadResume(resumeFile, resumeIsPrimary);
      if (res.success) {
        toast.success("Resume successfully uploaded.");
        setResumeFile(null);
        setResumeIsPrimary(false);
        loadData();
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to complete upload.");
    } finally {
      setResUploading(false);
    }
  };

  // Submit supporting documents
  const handleSupportDocSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supportFile) {
      toast.error("Please pick a verification file first.");
      return;
    }

    // Format validate
    const ext = supportFile.name.split(".").pop()?.toLowerCase() || "";
    const allowed = ["pdf", "doc", "docx", "xls", "xlsx", "jpg", "jpeg", "png", "zip"];
    if (!allowed.includes(ext)) {
      toast.error(`Format error: "${ext}" is not supported. Supported: PDF, DOC, DOCX, XLS, XLSX, JPG, PNG, ZIP.`);
      return;
    }

    // Size check (10MB)
    if (supportFile.size > 10 * 1024 * 1024) {
      toast.error("File is too large! Supporting documents must not exceed 10MB.");
      return;
    }

    try {
      setDocUploading(true);
      const res = await uploadDocument({
        file: supportFile,
        documentType: docType,
        description: docDescription,
        tags: docTags,
        isPublic: docIsPublic,
        expiryDate: docExpiryDate || undefined
      });
      if (res.success) {
        toast.success("Document uploaded successfully.");
        // clear states
        setSupportFile(null);
        setDocDescription("");
        setDocTags("");
        setDocExpiryDate("");
        loadData();
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to upload supportive document.");
    } finally {
      setDocUploading(false);
    }
  };

  const getFileIcon = (fileName: string) => {
    const ext = fileName.split(".").pop()?.toLowerCase();
    switch (ext) {
      case "pdf":
        return <FileText className="w-8 h-8 text-red-500" />;
      case "xls":
      case "xlsx":
        return <FileSpreadsheet className="w-8 h-8 text-emerald-500" />;
      case "jpg":
      case "jpeg":
      case "png":
        return <Image className="w-8 h-8 text-amber-500" />;
      case "zip":
        return <FileArchive className="w-8 h-8 text-yellow-500" />;
      default:
        return <FileText className="w-8 h-8 text-blue-500" />;
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const dm = 1;
    const sizes = ["Bytes", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
  };

  const totalPages = Math.ceil(totalDocsCount / itemsPerPage) || 1;

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-slate-950 text-slate-100 font-sans">
      <StudentNavigation />

      {/* Main Workspace */}
      <main className="flex-1 p-6 lg:p-10 space-y-8 overflow-y-auto max-w-7xl mx-auto w-full">
        
        {/* Workspace Title */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-900 pb-5">
          <div className="space-y-1">
            <h1 className="text-2xl lg:text-3xl font-black text-slate-100 tracking-tight flex items-center gap-2">
              <FolderLock className="w-8 h-8 text-blue-500 shrink-0" />
              Document Vault & Archives
            </h1>
            <p className="text-xs text-slate-400">Secure cloud repository for your primary resumes and verified academic credentials.</p>
          </div>
          <button
            onClick={() => loadData()}
            className="p-2.5 bg-slate-900 hover:bg-slate-800 transition-colors text-slate-400 hover:text-white rounded-xl border border-slate-800 cursor-pointer flex items-center gap-1 text-xs font-bold"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Sync Vault</span>
          </button>
        </div>

        {/* Upload Panels Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Panel 1: Primary Resumes */}
          <div className="bg-slate-900/40 rounded-2xl p-6 border border-slate-800/80 space-y-5">
            <div>
              <h2 className="font-bold text-slate-200 text-base flex items-center gap-2">
                <FileText className="w-5 h-5 text-red-400" />
                Upload Resume Version
              </h2>
              <p className="text-[11px] text-slate-500 mt-1">Supports PDF, DOC, or DOCX formats only. Maximum size allowed: 5MB.</p>
            </div>

            {/* Resume Upload Form */}
            <form onSubmit={handleResumeSubmit} className="space-y-4">
              
              {/* Drag and drop panel */}
              <div
                onDragOver={(e) => { e.preventDefault(); setResumeDragOver(true); }}
                onDragLeave={() => setResumeDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setResumeDragOver(false);
                  if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                    setResumeFile(e.dataTransfer.files[0]);
                  }
                }}
                onClick={() => resumeInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
                  resumeDragOver ? "border-blue-500 bg-blue-950/10" : "border-slate-800 bg-slate-950 hover:border-slate-700"
                }`}
              >
                <input
                  type="file"
                  ref={resumeInputRef}
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setResumeFile(e.target.files[0]);
                    }
                  }}
                  accept=".pdf,.doc,.docx"
                  className="hidden"
                />
                
                <Upload className="w-8 h-8 text-slate-650 mx-auto mb-3" />
                {resumeFile ? (
                  <div className="space-y-1">
                    <span className="text-xs font-bold text-blue-400 block truncate">{resumeFile.name}</span>
                    <span className="text-[10px] text-slate-500 block">{formatBytes(resumeFile.size)}</span>
                  </div>
                ) : (
                  <div>
                    <span className="text-xs font-bold text-slate-300 block">Drag & Drop Resume File</span>
                    <span className="text-[10px] text-slate-500 block mt-1">or click here to manually upload file</span>
                  </div>
                )}
              </div>

              {/* Set Primary Toggle checkbox */}
              <div className="flex items-center gap-2 bg-slate-900/60 p-3 rounded-lg text-xs border border-slate-800">
                <input
                  type="checkbox"
                  id="res_primary_checkbox"
                  checked={resumeIsPrimary}
                  onChange={(e) => setResumeIsPrimary(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500 bg-slate-950 border-slate-800"
                />
                <label htmlFor="res_primary_checkbox" className="text-slate-400 font-bold">
                  Make this the Primary Active Resume Version
                </label>
              </div>

              {/* Action trigger */}
              <button
                type="submit"
                disabled={resuploading || !resumeFile}
                className="w-full py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white font-extrabold text-xs tracking-wider uppercase rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-blue-500/10"
              >
                {resuploading ? "Uploading resume..." : "Upload & Compile Resume"}
              </button>
            </form>
          </div>

          {/* Panel 2: Supporting verification Docs */}
          <div className="bg-slate-900/40 rounded-2xl p-6 border border-slate-800/80 space-y-5">
            <div>
              <h2 className="font-bold text-slate-200 text-base flex items-center gap-2">
                <FolderLock className="w-5 h-5 text-emerald-400" />
                Add Supporting Verification Documents
              </h2>
              <p className="text-[11px] text-slate-500 mt-1">Transcripts, offer letters, or stack credentials. Max size: 10MB. Formats: PDF, Spreadsheet, Zip, Images.</p>
            </div>

            {/* Supporting Doc Form */}
            <form onSubmit={handleSupportDocSubmit} className="space-y-4">
              
              {/* Drag and Drop panel for supporting files */}
              <div
                onDragOver={(e) => { e.preventDefault(); setDocDragOver(true); }}
                onDragLeave={() => setDocDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDocDragOver(false);
                  if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                    setSupportFile(e.dataTransfer.files[0]);
                  }
                }}
                onClick={() => documentInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-5 text-center cursor-pointer transition-all ${
                  docDragOver ? "border-blue-500 bg-blue-950/10" : "border-slate-800 bg-slate-950 hover:border-slate-700"
                }`}
              >
                <input
                  type="file"
                  ref={documentInputRef}
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setSupportFile(e.target.files[0]);
                    }
                  }}
                  className="hidden"
                />

                <Upload className="w-8 h-8 text-slate-650 mx-auto mb-3" />
                {supportFile ? (
                  <div className="space-y-1">
                    <span className="text-xs font-bold text-emerald-400 block truncate">{supportFile.name}</span>
                    <span className="text-[10px] text-slate-500 block">{formatBytes(supportFile.size)}</span>
                  </div>
                ) : (
                  <div>
                    <span className="text-xs font-bold text-slate-300 block">Drag & Drop Verification File</span>
                    <span className="text-[10px] text-slate-500 block mt-1">or click here to search local directories</span>
                  </div>
                )}
              </div>

              {/* Metadata Form Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-500">Document Category *</label>
                  <select
                    value={docType}
                    onChange={(e: any) => setDocType(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:border-blue-500"
                  >
                    <option value="academic">Academic Marksheets / Transcripts</option>
                    <option value="certification">Course certifications</option>
                    <option value="internship">Internship Completion Letters</option>
                    <option value="offer_letter">HR Corporate Offer Letters</option>
                    <option value="other">Other supporting files</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-500">Validity Expiry (Optional)</label>
                  <input
                    type="date"
                    value={docExpiryDate}
                    onChange={(e) => setDocExpiryDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 font-mono"
                  />
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <label className="text-[10px] uppercase font-bold text-slate-500">Comma-separated Search Tags</label>
                  <input
                    type="text"
                    placeholder="e.g. sem3, transcript, backlogs_cleared"
                    value={docTags}
                    onChange={(e) => setDocTags(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 font-mono"
                  />
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <label className="text-[10px] uppercase font-bold text-slate-500">Brief Description</label>
                  <input
                    type="text"
                    placeholder="e.g. 5th Semester aggregate grading sheet authorized by registrar"
                    value={docDescription}
                    onChange={(e) => setDocDescription(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200"
                  />
                </div>

                <div className="sm:col-span-2 flex items-center gap-2 bg-slate-900/40 p-2.5 rounded-lg border border-slate-850">
                  <input
                    type="checkbox"
                    id="doc_is_public"
                    checked={docIsPublic}
                    onChange={(e) => setDocIsPublic(e.target.checked)}
                    className="rounded text-blue-600 bg-slate-950 border-slate-800 focus:ring-blue-500"
                  />
                  <label htmlFor="doc_is_public" className="text-[11px] text-slate-400 font-bold">
                    Visible to verified Recruiter companies (Recommended)
                  </label>
                </div>
              </div>

              {/* Action trigger */}
              <button
                type="submit"
                disabled={docuploading || !supportFile}
                className="w-full py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white font-extrabold text-xs tracking-wider uppercase rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-blue-500/10"
              >
                {docuploading ? "Uploading document..." : "Save Verification Document"}
              </button>
            </form>
          </div>

        </div>

        {/* Resumes Versions List */}
        <div className="bg-slate-900/30 rounded-2xl p-6 border border-slate-800/80 space-y-4">
          <div>
            <h2 className="font-bold text-slate-200 text-lg flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-500" />
              Active Resumes Library
            </h2>
            <p className="text-xs text-slate-400 mt-1">Only the resume designated as **Primary** will be displayed inside recruiter searches.</p>
          </div>

          {resumes.length === 0 ? (
            <p className="text-xs text-slate-500 italic p-4 bg-slate-955 rounded-xl border border-dashed border-slate-800 text-center">No resume versions uploaded. Complete the uploader form above to list.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {resumes.map((item) => (
                <div 
                  key={item._id || item.fileName} 
                  className={`p-4 rounded-xl border transition-all flex items-start justify-between gap-4 ${
                    item.isPrimary 
                      ? "bg-blue-900/10 border-blue-600/40 shadow-md shadow-blue-900/5" 
                      : "bg-slate-900/40 border-slate-800/40 hover:border-slate-800"
                  }`}
                >
                  <div className="space-y-2 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-[9px] font-extrabold px-1.5 py-0.5 bg-slate-900 text-slate-400 border border-slate-800 rounded">
                        Ver #{item.version}
                      </span>
                      {item.isPrimary && (
                        <span className="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded-full bg-blue-950 text-blue-400 border border-blue-900/50 flex items-center gap-1">
                          <Check className="w-2.5 h-2.5" />
                          <span>Primary active resume</span>
                        </span>
                      )}
                    </div>

                    <span className="font-bold text-slate-200 text-xs tracking-tight block truncate">
                      {item.originalName}
                    </span>

                    <span className="text-[10px] text-slate-500 font-mono block">
                      Size: {formatBytes(item.fileSize)} • Saved: {new Date(item.uploadedAt).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    {!item.isPrimary && (
                      <button
                        onClick={() => handleSetPrimary(item._id || item.id)}
                        className="p-1 px-2.5 bg-blue-600/20 hover:bg-blue-600 rounded text-[10px] font-bold text-blue-400 transition-colors cursor-pointer"
                        title="Make primary active"
                      >
                        Set Primary
                      </button>
                    )}
                    <a
                      href={getDownloadUrl(item._id)}
                      download
                      target="_blank"
                      rel="noreferrer"
                      className="p-1.5 bg-slate-900 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition-colors cursor-pointer"
                      title="Download file"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </a>
                    <button
                      onClick={() => handleDeleteFile(item._id, true)}
                      className="p-1.5 hover:text-red-405 text-slate-500 hover:text-red-400 transition-colors cursor-pointer"
                      title="Delete version"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Verification Supplementary Archives with searching/filtering */}
        <div className="bg-slate-900/30 rounded-2xl p-6 border border-slate-800/80 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="font-bold text-slate-100 text-lg flex items-center gap-2">
                <FolderLock className="w-5 h-5 text-emerald-500" />
                Verified Academic & Experience Credential Archives
              </h2>
              <p className="text-xs text-slate-400 mt-1">Lists all supporting marksheets, offer letters, or external certificates saved.</p>
            </div>
            
            <div className="flex flex-wrap gap-2.5 items-center">
              
              {/* Category Filter */}
              <div className="flex items-center bg-slate-950 px-2.5 py-1 rounded-xl border border-slate-800">
                <Filter className="w-3.5 h-3.5 text-slate-500 mr-1.5" />
                <select
                  value={docTypeFilter}
                  onChange={(e) => { setDocTypeFilter(e.target.value); setCurrentPage(1); }}
                  className="bg-transparent border-0 text-slate-300 font-mono text-xs focus:ring-0 p-0 pr-6"
                >
                  <option value="all">All Documents</option>
                  <option value="academic">Academic Marksheets</option>
                  <option value="certification">Course Certificates</option>
                  <option value="internship">Internships</option>
                  <option value="offer_letter">Offer Letters</option>
                  <option value="other">Others</option>
                </select>
              </div>

              {/* Sort field order */}
              <div className="flex items-center bg-slate-950 px-2.5 py-1 rounded-xl border border-slate-800">
                <ArrowUpDown className="w-3.5 h-3.5 text-slate-500 mr-1.5" />
                <select
                  value={`${sortBy}-${sortOrder}`}
                  onChange={(e) => {
                    const [field, dir] = e.target.value.split("-");
                    setSortBy(field);
                    setSortOrder(dir as any);
                    setCurrentPage(1);
                  }}
                  className="bg-transparent border-0 text-slate-300 font-mono text-xs focus:ring-0 p-0 pr-6"
                >
                  <option value="uploadedAt-desc">Newest First</option>
                  <option value="uploadedAt-asc">Oldest First</option>
                  <option value="fileName-asc">Name A-Z</option>
                  <option value="fileName-desc">Name Z-A</option>
                  <option value="fileSize-desc">Size Large-Small</option>
                  <option value="fileSize-asc">Size Small-Large</option>
                </select>
              </div>

            </div>
          </div>

          {/* List of documents */}
          {documents.length === 0 ? (
            <div className="p-12 text-center text-slate-500 space-y-2 border border-dashed border-slate-800 rounded-xl bg-slate-955">
              <FolderLock className="w-8 h-8 text-slate-700 animate-pulse mx-auto" />
              <p className="text-xs font-semibold">No documents found matching selected category filters.</p>
              <p className="text-[10px] text-slate-600 max-w-xs mx-auto">Upload certificates and aggregate sheets inside the form above to build proof.</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {documents.map((doc) => (
                  <div 
                    key={doc._id} 
                    className="p-4 bg-slate-900/60 rounded-xl border border-slate-800/40 hover:border-slate-800 hover:bg-slate-900/80 transition-all flex flex-col justify-between"
                  >
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800 shrink-0">
                          {getFileIcon(doc.fileName)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <span className="font-bold text-slate-200 text-xs truncate block" title={doc.originalName}>
                            {doc.originalName}
                          </span>
                          <span className="font-mono text-[9px] text-slate-500 uppercase font-extrabold tracking-widest block mt-0.5">
                            Category: {doc.documentType}
                          </span>
                        </div>
                      </div>

                      {doc.description && (
                        <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed bg-slate-950/20 p-2 rounded border border-slate-900">
                          {doc.description}
                        </p>
                      )}

                      {doc.tags && doc.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {doc.tags.map((t: string) => (
                            <span 
                              key={t} 
                              className="px-1.5 py-0.5 bg-slate-950 text-slate-500 font-mono text-[8px] font-bold rounded"
                            >
                              #{t}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="pt-4 mt-4 border-t border-slate-900 flex items-center justify-between gap-2.5">
                      <div className="flex flex-col text-[10px] text-slate-500 font-mono leading-tight">
                        <span>Size: {formatBytes(doc.fileSize)}</span>
                        <span>Saved: {new Date(doc.uploadedAt).toLocaleDateString()}</span>
                      </div>

                      <div className="flex gap-1.5 items-center">
                        <span 
                          className={`p-1 rounded-full border ${
                            doc.isPublic 
                              ? "bg-emerald-950 text-emerald-400 border-emerald-900/30" 
                              : "bg-slate-900 text-slate-500 border-slate-800"
                          }`}
                          title={doc.isPublic ? "Visible to Companies" : "Private (TPO Only)"}
                        >
                          {doc.isPublic ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                        </span>
                        
                        <a
                          href={getDownloadUrl(doc._id)}
                          download
                          target="_blank"
                          rel="noreferrer"
                          className="p-1 px-2.5 bg-blue-600/20 hover:bg-blue-600 rounded text-[10px] font-bold text-blue-400 hover:text-white transition-all cursor-pointer flex items-center gap-1"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Get</span>
                        </a>

                        <button
                          onClick={() => handleDeleteFile(doc._id, false)}
                          className="p-1.5 hover:text-red-400 text-slate-500 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination controls */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between border-t border-slate-900 pt-4 mt-6">
                  <span className="text-xs text-slate-500">
                    Showing Page <strong>{currentPage}</strong> of <strong>{totalPages}</strong> ({totalDocsCount} documents)
                  </span>
                  <div className="flex gap-2">
                    <button
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage((c) => Math.max(c - 1, 1))}
                      className="p-2 bg-slate-955 border border-slate-800 hover:bg-slate-900 disabled:opacity-40 rounded-xl cursor-pointer"
                    >
                      <ChevronLeft className="w-4 h-4 text-slate-300" />
                    </button>
                    <button
                      disabled={currentPage === totalPages}
                      onClick={() => setCurrentPage((c) => Math.min(c + 1, totalPages))}
                      className="p-2 bg-slate-955 border border-slate-800 hover:bg-slate-100/10 disabled:opacity-40 rounded-xl cursor-pointer"
                    >
                      <ChevronRight className="w-4 h-4 text-slate-300" />
                    </button>
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
