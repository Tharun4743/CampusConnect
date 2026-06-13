import { createClient, type PostgrestError, type SupabaseClient } from "@supabase/supabase-js";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { emitToUser, emitToUsers } from "../socket.js";

// Database Types / Interfaces
export interface User {
  id: string;
  name: string;
  email: string;
  password_hash: string;
  role: "student" | "tpo" | "hr" | "admin";
  status: "pending" | "active" | "rejected" | "inactive";
  email_verified: boolean;
  email_verified_at?: string;
  college_name: string | null;
  created_at: string;
  updated_at: string;
}

export interface StudentDetails {
  id: string;
  user_id: string;
  roll_number: string | null;
  phone: string | null;
  date_of_birth: string | null;
  gender: string | null;
  address: string | null;
  department: string | null;
  batch_year: number | null;
  cgpa: number;
  sslc_percentage: number;
  hsc_percentage: number;
  diploma_percentage: number | null;
  current_arrears: number;
  history_of_arrears: number;
  technical_skills: string[];
  soft_skills: string[];
  profile_completion: number;
  ats_score: number;
  placement_status: "unplaced" | "placed" | "opted_out";
  placed_company: string | null;
  placed_role: string | null;
  placed_package: number | null;
  created_at: string;
  updated_at: string;
}

export interface JobPost {
  id: string;
  company_id: string;
  created_by: string;
  title: string;
  role: string | null;
  package_min: number | null;
  package_max: number | null;
  location: string | null;
  description: string | null;
  job_type: "full_time" | "internship" | "contract";
  min_cgpa: number;
  allowed_departments: string[];
  allowed_batches: number[];
  max_arrears: number;
  arrears_policy: "no_arrears" | "allow_history" | "allow_current";
  apply_deadline: string;
  status: "pending" | "approved" | "active" | "closed" | "rejected";
  tpo_approved_by: string | null;
  tpo_approved_at: string | null;
  tpo_rejection_reason: string | null;
  created_at: string;
  updated_at: string;
}

export interface JobApplication {
  id: string;
  student_id: string;
  job_id: string;
  resume_id: string;
  status: "applied" | "under_review" | "shortlisted" | "interview_scheduled" | "selected" | "rejected";
  applied_at: string;
  updated_at: string;
}

export interface EducationRecord {
  id: string;
  user_id: string;
  institution: string;
  degree?: string | null;
  field_of_study?: string | null;
  start_year?: number | null;
  end_year?: number | null;
  percentage?: number | null;
  cgpa?: number | null;
  type?: string | null;
  created_at?: string;
}

export interface InviteToken {
  id: string;
  token: string;
  role: "hr" | "tpo";
  created_by: string | null;
  used: boolean;
  created_at: string;
}

export interface OtpToken {
  id: string;
  email: string;
  otp_code: string;
  purpose: "signup" | "login" | "forgot_password";
  expires_at: string;
  attempts: number;
  locked_until: string | null;
  created_at: string;
}

let supabaseClient: SupabaseClient | null = null;

function getSupabaseUrl(): string {
  const url = process.env.SUPABASE_URL?.trim();
  if (!url) {
    throw new Error("SUPABASE_URL environment variable is required.");
  }
  return url;
}

function getSupabaseKey(): string {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() || process.env.SUPABASE_ANON_KEY?.trim();
  if (!key) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY or SUPABASE_ANON_KEY environment variable is required.");
  }
  return key;
}

export async function createSupabaseClient(): Promise<SupabaseClient> {
  if (supabaseClient) return supabaseClient;
  const supabaseUrl = getSupabaseUrl();
  const supabaseKey = getSupabaseKey();
  supabaseClient = createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false },
  });
  return supabaseClient;
}

export async function initializeDatabase(): Promise<void> {
  const client = await createSupabaseClient();
  await ensurePredefinedUsers(client);
  console.log("✅ Database initialized and predefined users verified.");
}

async function ensurePredefinedUsers(client: SupabaseClient) {
  // Only ensure Super Admin is present. Other user accounts must be created via signup.
  const adminEmail = "campusconnectvsb@gmail.com";
  const { data: existing } = await client.from("users").select("id").eq("email", adminEmail).maybeSingle();
  if (!existing) {
    console.warn("Super Admin not found in database. Please run SUPABASE_SCHEMA.sql to seed the admin account.");
  }
}

// ===== DATABASE INTERFACE IMPLEMENTATION =====
export const db = {
  // --- AUTH FUNCTIONS ---
  async createUser(data: any) {
    const client = await createSupabaseClient();
    const { data: user, error } = await client.from("users").insert({
      name: data.name,
      email: (data.email || "").toLowerCase().trim(),
      password_hash: data.password_hash,
      role: data.role,
      status: data.status || 'pending',
      email_verified: data.email_verified || false,
      email_verified_at: data.email_verified_at || null,
      college_name: data.college_name || null
    }).select("*").single();
    if (error) throw error;
    return user;
  },

  async getUserByEmail(email: string) {
    const client = await createSupabaseClient();
    const { data: user, error } = await client.from("users").select("*").eq("email", email.toLowerCase().trim()).maybeSingle();
    if (error) throw error;
    return user;
  },

  async getUserById(id: string) {
    const client = await createSupabaseClient();
    const { data: user, error } = await client.from("users").select("*").eq("id", id).maybeSingle();
    if (error) throw error;
    return user;
  },

  async updateUserStatus(id: string, status: string) {
    const client = await createSupabaseClient();
    const { data: user, error } = await client.from("users").update({ status, updated_at: new Date().toISOString() }).eq("id", id).select("*").single();
    if (error) throw error;
    return user;
  },

  async updateUserPassword(id: string, hash: string) {
    const client = await createSupabaseClient();
    const { error } = await client.from("users").update({ password_hash: hash, updated_at: new Date().toISOString() }).eq("id", id);
    if (error) throw error;
  },

  async verifyUserEmail(email: string) {
    const client = await createSupabaseClient();
    const { error } = await client.from("users").update({ email_verified: true, email_verified_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq("email", email.toLowerCase().trim());
    if (error) throw error;
  },

  async createOtp(email: string, code: string, purpose: string, expiresAt: Date) {
    const client = await createSupabaseClient();
    await client.from("otp_tokens").delete().eq("email", email.toLowerCase().trim()).eq("purpose", purpose);
    const { data: otp, error } = await client.from("otp_tokens").insert({
      email: email.toLowerCase().trim(),
      otp_code: code,
      purpose,
      expires_at: expiresAt.toISOString(),
      attempts: 0
    }).select("*").single();
    if (error) throw error;
    return otp;
  },

  async getOtp(email: string, purpose: string) {
    const client = await createSupabaseClient();
    const { data: otps, error } = await client.from("otp_tokens")
      .select("*")
      .eq("email", email.toLowerCase().trim())
      .eq("purpose", purpose)
      .order("created_at", { ascending: false });
    
    if (error) throw error;
    console.log("🔍 [getOtp] Found OTP records in DB:", JSON.stringify(otps));
    if (!otps || otps.length === 0) return null;

    const nowMs = Date.now();
    const unexpired = otps.filter(o => {
      const expTime = new Date(o.expires_at).getTime();
      const isOk = Number.isFinite(expTime) && expTime > nowMs;
      console.log(`🔍 [getOtp] Comparing expTime=${expTime} (${new Date(expTime).toISOString()}) with nowMs=${nowMs} (${new Date(nowMs).toISOString()}). Unexpired? ${isOk}`);
      return isOk;
    });

    if (unexpired.length === 0) {
      console.log("🔍 [getOtp] No unexpired OTP found.");
      return null;
    }

    // Filter locked tokens in JS for reliability
    const validOtp = unexpired.find(o => {
      if (!o.locked_until) return true;
      const lockTime = new Date(o.locked_until).getTime();
      return Number.isFinite(lockTime) && lockTime < nowMs;
    });
    console.log("🔍 [getOtp] Returning valid OTP:", JSON.stringify(validOtp));
    return validOtp || null;
  },

  async incrementOtpAttempts(id: string) {
    const client = await createSupabaseClient();
    const { data: token } = await client.from("otp_tokens").select("attempts").eq("id", id).single();
    const attempts = (token?.attempts || 0) + 1;
    const { data: updated } = await client.from("otp_tokens").update({ attempts }).eq("id", id).select("*").single();
    return updated;
  },

  async lockOtp(id: string, lockedUntil: Date) {
    const client = await createSupabaseClient();
    await client.from("otp_tokens").update({ locked_until: lockedUntil.toISOString() }).eq("id", id);
  },

  async deleteOtp(email: string, purpose: string) {
    const client = await createSupabaseClient();
    await client.from("otp_tokens").delete().eq("email", email.toLowerCase().trim()).eq("purpose", purpose);
  },

  async deleteExpiredOtps() {
    const client = await createSupabaseClient();
    try {
      await client.from("otp_tokens").delete().lt("expires_at", new Date().toISOString());
    } catch (err) {
      // non-fatal cleanup error
      console.warn("Failed to delete expired OTPs:", err);
    }
  },

  async createInviteToken(token: string, role: string, createdBy: string) {
    const client = await createSupabaseClient();
    const { data: invite, error } = await client.from("invite_tokens").insert({
      token,
      role,
      created_by: createdBy,
      used: false
    }).select("*").single();
    if (error) throw error;
    return invite;
  },

  async getInviteToken(token: string) {
    const client = await createSupabaseClient();
    const { data: invite, error } = await client.from("invite_tokens").select("*").eq("token", token).eq("used", false).maybeSingle();
    if (error) throw error;
    return invite;
  },

  async useInviteToken(id: string) {
    const client = await createSupabaseClient();
    await client.from("invite_tokens").update({ used: true }).eq("id", id);
  },

  // HR metadata helpers (stored in hr_details table)
  async createHRDetails(details: { user_id: string; company_name: string; designation?: string; linkedin_url?: string }) {
    const client = await createSupabaseClient();
    const { data, error } = await client.from("hr_details").insert({
      user_id: details.user_id,
      company_name: details.company_name,
      designation: details.designation || null,
      linkedin_url: details.linkedin_url || null,
      created_at: new Date().toISOString()
    }).select("*").single();
    if (error) {
      throw error;
    }
    return data;
  },

  async getHRDetails(userId: string) {
    const client = await createSupabaseClient();
    const { data, error } = await client.from("hr_details").select("*").eq("user_id", userId).maybeSingle();
    if (error) throw error;
    return data || null;
  },

  // --- STUDENT PROFILE FUNCTIONS ---
  async createStudentDetails(userIdOrData: any) {
    const client = await createSupabaseClient();
    // support either (userId: string) or (detailsObj: object)
    if (typeof userIdOrData === "string") {
      const { data: details, error } = await client.from("student_details").insert({ user_id: userIdOrData }).select("*").maybeSingle();
      if (error) throw error;
      return details;
    }

    const detailsObj: any = userIdOrData || {};
    const insertRow: any = {
      user_id: detailsObj.user_id || detailsObj.userId || null,
      roll_number: detailsObj.roll_number || detailsObj.rollNumber || null,
      phone: detailsObj.phone || null,
      date_of_birth: detailsObj.date_of_birth || detailsObj.dateOfBirth || null,
      gender: detailsObj.gender || null,
      address: detailsObj.address || null,
      department: detailsObj.department || detailsObj.branch || null,
      batch_year: detailsObj.batch_year || detailsObj.batchYear || null,
      cgpa: detailsObj.cgpa != null ? Number(detailsObj.cgpa) : 0,
      sslc_percentage: detailsObj.sslc_percentage || null,
      hsc_percentage: detailsObj.hsc_percentage || null,
      diploma_percentage: detailsObj.diploma_percentage || null,
      current_arrears: detailsObj.current_arrears || 0,
      history_of_arrears: detailsObj.history_of_arrears || 0,
      technical_skills: detailsObj.technical_skills || [],
      soft_skills: detailsObj.soft_skills || [],
      profile_completion: detailsObj.profile_completion || 0,
      ats_score: detailsObj.ats_score || 0,
      placement_status: detailsObj.placement_status || 'unplaced',
      placed_company: detailsObj.placed_company || null,
      placed_role: detailsObj.placed_role || null,
      placed_package: detailsObj.placed_package || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data: details, error } = await client.from("student_details").insert(insertRow).select("*").maybeSingle();
    if (error) {
      // PostgREST schema mismatch (column missing) — try a minimal insert to avoid crashes
      // PGRST204 indicates a missing column in server-side schema cache
      if ((error as any)?.code === "PGRST204") {
        const { data: minimal, error: minErr } = await client.from("student_details").insert({ user_id: insertRow.user_id }).select("*").maybeSingle();
        if (minErr) throw minErr;
        return minimal;
      }
      throw error;
    }
    return details;
  },

  async getStudentProfile(userId: string) {
    const client = await createSupabaseClient();
    const { data: user } = await client.from("users").select("*").eq("id", userId).maybeSingle();
    const { data: details } = await client.from("student_details").select("*").eq("user_id", userId).maybeSingle();
    const { data: projects } = await client.from("student_projects").select("*").eq("user_id", userId);
    const { data: certifications } = await client.from("student_certifications").select("*").eq("user_id", userId);

    return {
      ...(user || {}),
      ...(details || {}),
      projects: projects || [],
      certifications: certifications || []
    };
  },

  async updateStudentProfile(userId: string, data: any) {
    const client = await createSupabaseClient();
    
    // Read the current student_details to fetch the existing address JSON
    const { data: currentDetails } = await client.from("student_details").select("*").eq("user_id", userId).maybeSingle();
    let parsedAddress: any = {};
    if (currentDetails?.address && currentDetails.address.startsWith("{")) {
      try {
        parsedAddress = JSON.parse(currentDetails.address);
      } catch (e) {}
    } else if (currentDetails?.address) {
      parsedAddress.street = currentDetails.address;
    }

    const updates: any = {
      updated_at: new Date().toISOString()
    };

    if (data.personalInfo) {
      const p = data.personalInfo;
      if (p.name) {
        await client.from("users").update({ name: p.name }).eq("id", userId);
      }
      
      updates.roll_number = p.roll_number !== undefined ? p.roll_number : currentDetails?.roll_number;
      updates.phone = p.phoneNumber !== undefined ? p.phoneNumber : currentDetails?.phone;
      updates.date_of_birth = p.dateOfBirth !== undefined ? p.dateOfBirth : currentDetails?.date_of_birth;
      updates.gender = p.gender !== undefined ? p.gender : currentDetails?.gender;
      updates.department = p.department !== undefined ? p.department : currentDetails?.department;
      updates.batch_year = p.batch_year !== undefined ? (p.batch_year ? Number(p.batch_year) : null) : currentDetails?.batch_year;
      
      // Update address fields inside parsedAddress JSON
      if (p.address) {
        parsedAddress.street = p.address.street || parsedAddress.street || "";
        parsedAddress.city = p.address.city || parsedAddress.city || "";
        parsedAddress.state = p.address.state || parsedAddress.state || "";
        parsedAddress.pincode = p.address.pincode || parsedAddress.pincode || "";
        parsedAddress.country = p.address.country || parsedAddress.country || "India";
      }
      if (p.bloodGroup !== undefined) parsedAddress.bloodGroup = p.bloodGroup;
      if (p.parentPhoneNumber !== undefined) parsedAddress.parentPhoneNumber = p.parentPhoneNumber;
      if (p.emergencyContact !== undefined) parsedAddress.emergencyContact = p.emergencyContact;
      if (p.linkedin_url !== undefined) parsedAddress.linkedin_url = p.linkedin_url;
      if (p.github_url !== undefined) parsedAddress.github_url = p.github_url;

      updates.address = JSON.stringify(parsedAddress);
    } else if (data.academicInfo) {
      const a = data.academicInfo;
      updates.sslc_percentage = a.class10Percentage !== undefined ? Number(a.class10Percentage) : currentDetails?.sslc_percentage;
      updates.hsc_percentage = a.class12Percentage !== undefined ? Number(a.class12Percentage) : currentDetails?.hsc_percentage;
      updates.diploma_percentage = a.diplomaPercentage !== undefined ? (a.diplomaPercentage ? Number(a.diplomaPercentage) : null) : currentDetails?.diploma_percentage;
      updates.cgpa = a.cgpa !== undefined ? Number(a.cgpa) : currentDetails?.cgpa;
      updates.current_arrears = a.currentArrears !== undefined ? Number(a.currentArrears) : currentDetails?.current_arrears;
      updates.history_of_arrears = a.historyOfArrears !== undefined ? Number(a.historyOfArrears) : currentDetails?.history_of_arrears;

      // Update school/college info inside parsedAddress JSON
      if (a.schoolName !== undefined) parsedAddress.schoolName = a.schoolName;
      if (a.schoolCity !== undefined) parsedAddress.schoolCity = a.schoolCity;
      if (a.collegeName !== undefined) parsedAddress.collegeName = a.collegeName;
      if (a.collegeCity !== undefined) parsedAddress.collegeCity = a.collegeCity;

      updates.address = JSON.stringify(parsedAddress);
    } else {
      // Flat payload fallback
      if (data.roll_number !== undefined) updates.roll_number = data.roll_number;
      if (data.phone !== undefined) updates.phone = data.phone;
      if (data.date_of_birth !== undefined) updates.date_of_birth = data.date_of_birth;
      if (data.gender !== undefined) updates.gender = data.gender;
      if (data.address !== undefined) updates.address = data.address;
      if (data.department !== undefined) updates.department = data.department;
      if (data.batch_year !== undefined) updates.batch_year = data.batch_year ? Number(data.batch_year) : null;
      if (data.cgpa !== undefined) updates.cgpa = data.cgpa ? Number(data.cgpa) : 0;
      if (data.sslc_percentage !== undefined) updates.sslc_percentage = data.sslc_percentage ? Number(data.sslc_percentage) : 0;
      if (data.hsc_percentage !== undefined) updates.hsc_percentage = data.hsc_percentage ? Number(data.hsc_percentage) : 0;
      if (data.diploma_percentage !== undefined) updates.diploma_percentage = data.diploma_percentage ? Number(data.diploma_percentage) : null;
      if (data.current_arrears !== undefined) updates.current_arrears = data.current_arrears ? Number(data.current_arrears) : 0;
      if (data.history_of_arrears !== undefined) updates.history_of_arrears = data.history_of_arrears ? Number(data.history_of_arrears) : 0;
      if (data.technical_skills !== undefined) updates.technical_skills = data.technical_skills;
      if (data.soft_skills !== undefined) updates.soft_skills = data.soft_skills;
      if (data.placement_status !== undefined) updates.placement_status = data.placement_status;
      if (data.placed_company !== undefined) updates.placed_company = data.placed_company;
      if (data.placed_role !== undefined) updates.placed_role = data.placed_role;
      if (data.placed_package !== undefined) updates.placed_package = data.placed_package ? Number(data.placed_package) : null;
    }

    const { data: updated, error } = await client.from("student_details").update(updates).eq("user_id", userId).select("*").single();
    if (error) throw error;
    return updated;
  },

  async calculateAtsScore(userId: string) {
    const client = await createSupabaseClient();
    const { data: resumes } = await client.from("resumes").select("id").eq("user_id", userId).eq("is_primary", true).limit(1);
    const { data: details } = await client.from("student_details").select("cgpa, technical_skills").eq("user_id", userId).maybeSingle();
    const { data: projects } = await client.from("student_projects").select("id").eq("user_id", userId).limit(1);
    const { data: certs } = await client.from("student_certifications").select("id").eq("user_id", userId).limit(1);

    let score = 0;
    if (resumes && resumes.length > 0) score += 20;
    if (details && details.cgpa !== null && Number(details.cgpa) > 0) score += 20;
    if (details && Array.isArray(details.technical_skills) && details.technical_skills.length > 0) score += 20;
    if (projects && projects.length > 0) score += 20;
    if (certs && certs.length > 0) score += 20;

    await client.from("student_details").update({ ats_score: score }).eq("user_id", userId);
    return score;
  },

  async calculateProfileCompletion(userId: string) {
    const client = await createSupabaseClient();
    const { data: user } = await client.from("users").select("name").eq("id", userId).single();
    const { data: details } = await client.from("student_details").select("*").eq("user_id", userId).maybeSingle();
    const { data: projects } = await client.from("student_projects").select("id").eq("user_id", userId).limit(1);
    const { data: certs } = await client.from("student_certifications").select("id").eq("user_id", userId).limit(1);
    const { data: resumes } = await client.from("resumes").select("id").eq("user_id", userId).limit(1);

    let percentage = 0;
    if (user?.name) percentage += 10;
    if (details?.roll_number) percentage += 10;
    if (details?.phone) percentage += 5;
    if (details?.department) percentage += 10;
    if (details?.cgpa && Number(details.cgpa) > 0) percentage += 10;
    if (details?.sslc_percentage && Number(details.sslc_percentage) > 0) percentage += 5;
    if (details?.hsc_percentage && Number(details.hsc_percentage) > 0) percentage += 5;
    if (details?.technical_skills && Array.isArray(details.technical_skills) && details.technical_skills.length > 0) percentage += 10;
    if (projects && projects.length > 0) percentage += 10;
    if (certs && certs.length > 0) percentage += 10;
    if (resumes && resumes.length > 0) percentage += 15;

    await client.from("student_details").update({ profile_completion: percentage }).eq("user_id", userId);
    return percentage;
  },

  // --- PROJECTS ---
  async addProject(userId: string, data: any) {
    const client = await createSupabaseClient();
    const { data: proj, error } = await client.from("student_projects").insert({
      user_id: userId,
      title: data.title,
      technologies: data.technologies || [],
      description: data.description || ""
    }).select("*").single();
    if (error) throw error;
    return proj;
  },

  async getProjects(userId: string) {
    const client = await createSupabaseClient();
    const { data, error } = await client.from("student_projects").select("*").eq("user_id", userId);
    if (error) throw error;
    return data || [];
  },

  async updateProject(userId: string, projectId: string, data: any) {
    const client = await createSupabaseClient();
    const { data: proj, error } = await client.from("student_projects").update({
      title: data.title,
      technologies: data.technologies || [],
      description: data.description || ""
    }).eq("id", projectId).eq("user_id", userId).select("*").single();
    if (error) throw error;
    return proj;
  },

  async deleteProject(userId: string, projectId: string) {
    const client = await createSupabaseClient();
    const { error } = await client.from("student_projects").delete().eq("id", projectId).eq("user_id", userId);
    if (error) throw error;
  },

  // --- CERTIFICATIONS ---
  async addCertification(userId: string, data: any) {
    const client = await createSupabaseClient();
    const { data: cert, error } = await client.from("student_certifications").insert({
      user_id: userId,
      name: data.name,
      issuer: data.issuer || "",
      certificate_url: data.certificate_url || ""
    }).select("*").single();
    if (error) throw error;
    return cert;
  },

  async getCertifications(userId: string) {
    const client = await createSupabaseClient();
    const { data, error } = await client.from("student_certifications").select("*").eq("user_id", userId);
    if (error) throw error;
    return data || [];
  },

  async updateCertification(userId: string, certId: string, data: any) {
    const client = await createSupabaseClient();
    const { data: cert, error } = await client.from("student_certifications").update({
      name: data.name,
      issuer: data.issuer || "",
      certificate_url: data.certificate_url || ""
    }).eq("id", certId).eq("user_id", userId).select("*").single();
    if (error) throw error;
    return cert;
  },

  async deleteCertification(userId: string, certId: string) {
    const client = await createSupabaseClient();
    const { error } = await client.from("student_certifications").delete().eq("id", certId).eq("user_id", userId);
    if (error) throw error;
  },

  // --- RESUMES ---
  async uploadResume(userId: string, data: any) {
    const client = await createSupabaseClient();
    await client.from("resumes").update({ is_primary: false }).eq("user_id", userId);
    const { data: res, error } = await client.from("resumes").insert({
      user_id: userId,
      filename: data.filename,
      file_url: data.file_url,
      file_size: data.file_size,
      is_primary: true
    }).select("*").single();
    if (error) throw error;
    return res;
  },

  async getResumes(userId: string) {
    const client = await createSupabaseClient();
    const { data, error } = await client.from("resumes").select("*").eq("user_id", userId).order("uploaded_at", { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async getPrimaryResume(userId: string) {
    const client = await createSupabaseClient();
    const { data, error } = await client.from("resumes").select("*").eq("user_id", userId).eq("is_primary", true).limit(1);
    if (error) throw error;
    return data && data.length > 0 ? data[0] : null;
  },

  async setPrimaryResume(userId: string, resumeId: string) {
    const client = await createSupabaseClient();
    await client.from("resumes").update({ is_primary: false }).eq("user_id", userId);
    await client.from("resumes").update({ is_primary: true }).eq("id", resumeId).eq("user_id", userId);
  },

  async deleteResume(userId: string, resumeId: string) {
    const client = await createSupabaseClient();
    const { error } = await client.from("resumes").delete().eq("id", resumeId).eq("user_id", userId);
    if (error) throw error;
  },

  // --- DOCUMENTS ---
  async uploadDocument(userId: string, type: string, data: any) {
    const client = await createSupabaseClient();
    const { data: doc, error } = await client.from("student_documents").insert({
      user_id: userId,
      document_type: type,
      filename: data.filename,
      file_url: data.file_url
    }).select("*").single();
    if (error) throw error;
    return doc;
  },

  async getDocuments(userId: string) {
    const client = await createSupabaseClient();
    const { data, error } = await client.from("student_documents").select("*").eq("user_id", userId);
    if (error) throw error;
    return data || [];
  },

  async deleteDocument(userId: string, docId: string) {
    const client = await createSupabaseClient();
    const { error } = await client.from("student_documents").delete().eq("id", docId).eq("user_id", userId);
    if (error) throw error;
  },

  // --- JOBS (Student view) ---
  async getAvailableJobs(userId: string) {
    const client = await createSupabaseClient();
    const { data: details } = await client.from("student_details").select("*").eq("user_id", userId).maybeSingle();
    const studentCgpa = details?.cgpa ? Number(details.cgpa) : 0;
    const studentDept = details?.department || '';
    const studentArrears = details?.current_arrears ? Number(details.current_arrears) : 0;
    const studentBatch = details?.batch_year ? Number(details.batch_year) : 0;

    const { data: jobs, error } = await client
      .from("job_posts")
      .select(`
        *,
        company:companies(*),
        job_applications(*)
      `)
      .in("status", ["active", "approved"])
      .or(`apply_deadline.gt.${new Date().toISOString()},apply_deadline.is.null`)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return (jobs || []).map(job => {
      let is_eligible = true;
      let reasons: string[] = [];

      if (job.min_cgpa > 0 && studentCgpa < job.min_cgpa) {
        is_eligible = false;
        reasons.push(`CGPA is below the required ${job.min_cgpa.toFixed(2)} (Yours: ${studentCgpa.toFixed(2)})`);
      }
      if (job.max_arrears !== null && studentArrears > job.max_arrears) {
        is_eligible = false;
        reasons.push(`Current arrears (${studentArrears}) exceed the maximum allowed (${job.max_arrears})`);
      }
      if (Array.isArray(job.allowed_departments) && job.allowed_departments.length > 0) {
        if (!job.allowed_departments.includes(studentDept)) {
          is_eligible = false;
          reasons.push(`Department ${studentDept || 'N/A'} is not in the allowed departments (${job.allowed_departments.join(", ")})`);
        }
      }
      if (Array.isArray(job.allowed_batches) && job.allowed_batches.length > 0) {
        if (!job.allowed_batches.includes(studentBatch)) {
          is_eligible = false;
          reasons.push(`Batch year ${studentBatch || 'N/A'} is not in the allowed batches (${job.allowed_batches.join(", ")})`);
        }
      }

      const already_applied = Array.isArray(job.job_applications) && job.job_applications.some((ja: any) => ja.student_id === userId);
      return {
        ...job,
        company_name: job.company?.name || null,
        logo_url: job.company?.logo_url || null,
        is_eligible,
        eligibility_reasons: reasons,
        already_applied
      };
    });
  },

  async getJobDetailsForStudent(jobId: string, studentId: string) {
    const client = await createSupabaseClient();
    const { data: job, error } = await client.from("job_posts").select(`
      *,
      company:companies(*),
      job_applications(*)
    `).eq("id", jobId).single();

    if (error) throw error;
    if (!job) return null;

    let is_eligible = true;
    let reasons: string[] = [];
    let already_applied = false;
    let applicationDetails: any = null;

    const { data: details } = await client.from("student_details").select("*").eq("user_id", studentId).maybeSingle();
    const studentCgpa = details?.cgpa ? Number(details.cgpa) : 0;
    const studentDept = details?.department || '';
    const studentArrears = details?.current_arrears ? Number(details.current_arrears) : 0;
    const studentBatch = details?.batch_year ? Number(details.batch_year) : 0;

    if (job.min_cgpa > 0 && studentCgpa < job.min_cgpa) {
      is_eligible = false;
      reasons.push(`CGPA is below the required ${job.min_cgpa.toFixed(2)} (Yours: ${studentCgpa.toFixed(2)})`);
    }
    if (job.max_arrears !== null && studentArrears > job.max_arrears) {
      is_eligible = false;
      reasons.push(`Current arrears (${studentArrears}) exceed the maximum allowed (${job.max_arrears})`);
    }
    if (Array.isArray(job.allowed_departments) && job.allowed_departments.length > 0) {
      if (!job.allowed_departments.includes(studentDept)) {
        is_eligible = false;
        reasons.push(`Department ${studentDept || 'N/A'} is not in the allowed departments (${job.allowed_departments.join(", ")})`);
      }
    }
    if (Array.isArray(job.allowed_batches) && job.allowed_batches.length > 0) {
      if (!job.allowed_batches.includes(studentBatch)) {
        is_eligible = false;
        reasons.push(`Batch year ${studentBatch || 'N/A'} is not in the allowed batches (${job.allowed_batches.join(", ")})`);
      }
    }

    const app = Array.isArray(job.job_applications) ? job.job_applications.find((ja: any) => ja.student_id === studentId) : null;
    if (app) {
      already_applied = true;
      applicationDetails = app;
    }

    // Get logs (timeline) for this student's application if applied
    let logs: any[] = [];
    if (applicationDetails) {
      const { data: timeline } = await client.from("application_timeline").select(`
        *,
        changed_by_user:users!changed_by (
          name,
          role
        )
      `).eq("application_id", applicationDetails.id).order("changed_at", { ascending: true });
      logs = timeline || [];
    }

    return {
      job: {
        ...job,
        company_name: job.company?.name || null,
        logo_url: job.company?.logo_url || null,
        salary_package: job.package_max ? `${job.package_min ? job.package_min + '-' : ''}${job.package_max} LPA` : "N/A",
        job_description: job.description
      },
      is_eligible,
      eligibility_reasons: reasons,
      already_applied,
      applicationDetails,
      logs
    };
  },

  async getJobById(jobId: string, studentId?: string) {
    const client = await createSupabaseClient();
    const { data: job, error } = await client.from("job_posts").select(`
      *,
      company:companies(*),
      saved_jobs(*),
      job_applications(*)
    `).eq("id", jobId).single();

    if (error) throw error;
    if (!job) return null;

    let is_eligible = true;
    let is_saved = false;
    let already_applied = false;

    if (studentId) {
      const { data: details } = await client.from("student_details").select("*").eq("user_id", studentId).maybeSingle();
      const studentCgpa = details?.cgpa ? Number(details.cgpa) : 0;
      const studentDept = details?.department || '';
      const studentArrears = details?.current_arrears ? Number(details.current_arrears) : 0;
      const studentBatch = details?.batch_year ? Number(details.batch_year) : 0;

      if (job.min_cgpa > 0 && studentCgpa < job.min_cgpa) is_eligible = false;
      if (job.max_arrears !== null && studentArrears > job.max_arrears) is_eligible = false;
      if (Array.isArray(job.allowed_departments) && job.allowed_departments.length > 0) {
        if (!job.allowed_departments.includes(studentDept)) is_eligible = false;
      }
      if (Array.isArray(job.allowed_batches) && job.allowed_batches.length > 0) {
        if (!job.allowed_batches.includes(studentBatch)) is_eligible = false;
      }

      is_saved = Array.isArray(job.saved_jobs) && job.saved_jobs.some((sj: any) => sj.student_id === studentId);
      already_applied = Array.isArray(job.job_applications) && job.job_applications.some((ja: any) => ja.student_id === studentId);
    }

    return {
      ...job,
      company_name: job.company?.name || null,
      logo_url: job.company?.logo_url || null,
      is_eligible,
      is_saved,
      already_applied
    };
  },

  async applyToJob(studentId: string, jobId: string, resumeId: string) {
    const client = await createSupabaseClient();
    const job = await db.getJobById(jobId, studentId);
    if (!job) throw new Error("Job not found");
    if (job.status !== "active") throw new Error("Job is not active");
    if (new Date(job.apply_deadline) <= new Date()) throw new Error("Job deadline has passed");
    if (!job.is_eligible) throw new Error("You are not eligible for this job");
    if (job.already_applied) throw new Error("You have already applied for this job");

    const { data: app, error: appErr } = await client.from("job_applications").insert({
      student_id: studentId,
      job_id: jobId,
      resume_id: resumeId,
      status: "applied"
    }).select("*").single();
    if (appErr) throw appErr;

    await client.from("application_timeline").insert({
      application_id: app.id,
      new_status: "applied",
      changed_by: studentId,
      note: "Applied successfully"
    });

    const { data: studentNotif } = await client.from("notifications").insert({
      user_id: studentId,
      title: "Application Submitted",
      message: `Your application for ${job.title} at ${job.company_name} was submitted successfully.`,
      type: "application_update",
      related_id: app.id
    }).select("*").single();
    if (studentNotif) emitToUser(studentNotif.user_id, "notification", studentNotif);

    const { data: hrNotif } = await client.from("notifications").insert({
      user_id: job.created_by,
      title: "New Application Received",
      message: `A student has applied for "${job.title}" at ${job.company_name}.`,
      type: "application_update",
      related_id: app.id
    }).select("*").single();
    if (hrNotif) emitToUser(hrNotif.user_id, "notification", hrNotif);

    return app;
  },

  async getMyApplications(studentId: string) {
    const client = await createSupabaseClient();
    const { data: apps, error } = await client.from("job_applications").select(`
      *,
      job:job_posts(
        *,
        company:companies(*)
      )
    `).eq("student_id", studentId).order("applied_at", { ascending: false });

    if (error) throw error;

    return (apps || []).map((app: any) => {
      const job = app.job;
      return {
        ...app,
        title: job?.title,
        role: job?.role,
        location: job?.location,
        company_name: job?.company?.name,
        logo_url: job?.company?.logo_url,
        package_min: job?.package_min,
        package_max: job?.package_max
      };
    });
  },

  async getApplicationTimeline(applicationId: string, studentId: string) {
    const client = await createSupabaseClient();
    const { data, error } = await client.from("application_timeline")
      .select(`
        *,
        changed_by_user:users!changed_by (
          name,
          role
        )
      `)
      .eq("application_id", applicationId)
      .order("changed_at", { ascending: true });
    if (error) throw error;
    return data || [];
  },

  async saveJob(studentId: string, jobId: string) {
    const client = await createSupabaseClient();
    await client.from("saved_jobs").insert({
      student_id: studentId,
      job_id: jobId
    });
  },

  async unsaveJob(studentId: string, jobId: string) {
    const client = await createSupabaseClient();
    await client.from("saved_jobs").delete().eq("student_id", studentId).eq("job_id", jobId);
  },

  async getSavedJobs(studentId: string) {
    const client = await createSupabaseClient();
    const { data, error } = await client.from("saved_jobs").select(`
      *,
      job:job_posts(
        *,
        company:companies(*)
      )
    `).eq("student_id", studentId).order("saved_at", { ascending: false });

    if (error) throw error;

    return (data || []).map((item: any) => {
      const job = item.job;
      return {
        ...item,
        title: job?.title,
        role: job?.role,
        company_name: job?.company?.name,
        logo_url: job?.company?.logo_url,
        location: job?.location,
        package_max: job?.package_max
      };
    });
  },

  // --- INTERVIEWS (Student view) ---
  async getMyInterviews(studentId: string) {
    const client = await createSupabaseClient();
    const { data, error } = await client.from("interviews").select(`
      *,
      job:job_posts(
        *,
        company:companies(*)
      )
    `).eq("student_id", studentId).order("scheduled_date", { ascending: true });

    if (error) throw error;

    return (data || []).map((item: any) => {
      const job = item.job;
      return {
        ...item,
        title: job?.title,
        role: job?.role,
        company_name: job?.company?.name
      };
    });
  },

  // --- OFFERS (Student view) ---
  async getMyOffers(studentId: string) {
    const client = await createSupabaseClient();
    const { data, error } = await client.from("offers").select(`
      *,
      job:job_posts(
        *,
        company:companies(*)
      )
    `).eq("student_id", studentId).order("offered_at", { ascending: false });

    if (error) throw error;

    return (data || []).map((item: any) => {
      const job = item.job;
      return {
        ...item,
        title: job?.title,
        role: job?.role,
        company_name: job?.company?.name,
        logo_url: job?.company?.logo_url
      };
    });
  },

  async acceptOffer(offerId: string, studentId: string) {
    const client = await createSupabaseClient();
    const { data: offer } = await client.from("offers").update({
      status: "accepted",
      responded_at: new Date().toISOString()
    }).eq("id", offerId).eq("student_id", studentId).select(`
      *,
      company:companies(*)
    `).single();

    if (!offer) throw new Error("Offer not found");

    await client.from("student_details").update({
      placement_status: "placed",
      placed_company: offer.company?.name || null,
      placed_role: offer.role,
      placed_package: offer.package
    }).eq("user_id", studentId);

    const { data: n } = await client.from("notifications").insert({
      user_id: studentId,
      title: "Offer Accepted",
      message: `You have accepted the offer from ${offer.company?.name} for the role of ${offer.role}.`,
      type: "system"
    }).select("*").single();
    if (n) emitToUser(n.user_id, "notification", n);
  },

  async declineOffer(offerId: string, studentId: string) {
    const client = await createSupabaseClient();
    await client.from("offers").update({
      status: "declined",
      responded_at: new Date().toISOString()
    }).eq("id", offerId).eq("student_id", studentId);
  },

  // --- NOTIFICATIONS ---
  async getNotifications(userId: string) {
    const client = await createSupabaseClient();
    const { data, error } = await client.from("notifications").select("*").eq("user_id", userId).order("created_at", { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async getUnreadCount(userId: string) {
    const client = await createSupabaseClient();
    const { count, error } = await client.from("notifications").select("*", { count: "exact", head: true }).eq("user_id", userId).eq("read", false);
    if (error) throw error;
    return count || 0;
  },

  async markRead(notificationId: string, userId: string) {
    const client = await createSupabaseClient();
    await client.from("notifications").update({ read: true }).eq("id", notificationId).eq("user_id", userId);
  },

  async markAllRead(userId: string) {
    const client = await createSupabaseClient();
    await client.from("notifications").update({ read: true }).eq("user_id", userId);
  },

  // --- DASHBOARD (Student) ---
  async getStudentDashboardMetrics(userId: string) {
    const client = await createSupabaseClient();
    const { data: details } = await client.from("student_details").select("profile_completion, ats_score, placement_status").eq("user_id", userId).maybeSingle();
    const { count: appsCount } = await client.from("job_applications").select("*", { count: "exact", head: true }).eq("student_id", userId);
    const { count: shortlistedCount } = await client.from("job_applications").select("*", { count: "exact", head: true }).eq("student_id", userId).eq("status", "shortlisted");
    const { count: interviewCount } = await client.from("interviews").select("*", { count: "exact", head: true }).eq("student_id", userId);
    const { count: offerCount } = await client.from("offers").select("*", { count: "exact", head: true }).eq("student_id", userId);
    const { count: unreadNotif } = await client.from("notifications").select("*", { count: "exact", head: true }).eq("user_id", userId).eq("read", false);

    const eligibleJobs = await db.getAvailableJobs(userId);
    const eligibleCount = eligibleJobs.length;

    return {
      profile_completion: details?.profile_completion || 0,
      ats_score: details?.ats_score || 0,
      applications_count: appsCount || 0,
      shortlisted_count: shortlistedCount || 0,
      interview_count: interviewCount || 0,
      offer_count: offerCount || 0,
      unread_notifications: unreadNotif || 0,
      placement_status: details?.placement_status || "unplaced",
      eligible_jobs_count: eligibleCount || 0
    };
  },

  // --- TPO FUNCTIONS ---
  async getAllStudents(filters?: any) {
    const client = await createSupabaseClient();
    let query = client.from("users").select(`
      *,
      student_details!inner(*)
    `).eq("role", "student").eq("status", "active");

    if (filters?.department) {
      query = query.eq("student_details.department", filters.department);
    }
    if (filters?.batch_year) {
      query = query.eq("student_details.batch_year", Number(filters.batch_year));
    }
    if (filters?.cgpa_min) {
      query = query.gte("student_details.cgpa", Number(filters.cgpa_min));
    }
    if (filters?.ats_score_min) {
      query = query.gte("student_details.ats_score", Number(filters.ats_score_min));
    }

    const { data, error } = await query;
    if (error) throw error;

    return (data || []).map((item: any) => {
      const details = item.student_details;
      return {
        ...item,
        ...details
      };
    });
  },

  async getPendingJobs() {
    const client = await createSupabaseClient();
    const { data, error } = await client.from("job_posts").select(`
      *,
      company:companies(*),
      hr:users(*)
    `).eq("status", "pending").order("created_at", { ascending: false });

    if (error) throw error;

    return (data || []).map((job: any) => ({
      ...job,
      company_name: job.company?.name || null,
      hr_name: job.hr?.name || null
    }));
  },

  async approveJob(jobId: string, tpoId: string) {
    const client = await createSupabaseClient();
    const { data: job, error } = await client.from("job_posts").update({
      status: "active",
      tpo_approved_by: tpoId,
      tpo_approved_at: new Date().toISOString()
    }).eq("id", jobId).select("*").single();

    if (error) throw error;

    if (job) {
      const { data: hrNotif } = await client.from("notifications").insert({
        user_id: job.created_by,
        title: "Job Approved",
        message: `Your job posting "${job.title}" has been approved by the TPO and is now active.`,
        type: "job_approved"
      }).select("*").single();
      if (hrNotif) emitToUser(hrNotif.user_id, "notification", hrNotif);

      const { data: students } = await client.from("users")
        .select("id")
        .eq("role", "student")
        .eq("status", "active");
      if (students && students.length > 0) {
        const notifs = students.map((s: any) => ({
          user_id: s.id,
          title: "New Job Available",
          message: `A new job "${job.title}" has been approved and is now open for applications.`,
          type: "job_posted",
          related_id: job.id
        }));
        const inserted = await client.from("notifications").insert(notifs).select("*");
        if (inserted.data) {
          inserted.data.forEach((n: any) => emitToUser(n.user_id, "notification", n));
        }
      }
    }
  },

  async rejectJob(jobId: string, tpoId: string, reason: string) {
    const client = await createSupabaseClient();
    const { data: job, error } = await client.from("job_posts").update({
      status: "rejected",
      tpo_rejection_reason: reason
    }).eq("id", jobId).select("*").single();

    if (error) throw error;

    if (job) {
      const { data: n } = await client.from("notifications").insert({
        user_id: job.created_by,
        title: "Job Rejected",
        message: `Your job posting "${job.title}" was rejected. Reason: ${reason}`,
        type: "job_rejected"
      }).select("*").single();
      if (n) emitToUser(n.user_id, "notification", n);
    }
  },

  async sendNotificationToStudents(tpoId: string, target: string, message: string, title?: string) {
    const client = await createSupabaseClient();
    let students: any[] = [];
    if (target === "all") {
      const { data } = await client.from("users").select("id").eq("role", "student").eq("status", "active");
      students = data || [];
    } else if (target === "department") {
      const { data } = await client.from("student_details").select("user_id").eq("department", message);
      students = (data || []).map(d => ({ id: d.user_id }));
    } else {
      students = [{ id: target }];
    }

    const notifs = students.map(s => ({
      user_id: s.id,
      title: title || "Important Notification from TPO",
      message: message,
      type: "system"
    }));

    if (notifs.length > 0) {
      const inserted = await client.from("notifications").insert(notifs).select("*");
      if (inserted.data) {
        inserted.data.forEach((n: any) => emitToUser(n.user_id, "notification", n));
      }
    }
  },

  async getPlacementReport() {
    const client = await createSupabaseClient();
    const { data: students } = await client.from("student_details").select(`
      placement_status,
      users!inner(status)
    `).eq("users.status", "active");

    const total = students?.length || 0;
    const placed = students?.filter((s: any) => s.placement_status === "placed").length || 0;
    const unplaced = total - placed;
    const percentage = total > 0 ? Number(((placed * 100) / total).toFixed(2)) : 0;

    return {
      total_students: total,
      placed,
      unplaced,
      percentage
    };
  },

  // --- HR FUNCTIONS ---
  async createJob(hrId: string, rawData: any) {
    const client = await createSupabaseClient();
    
    // Normalize and map frontend fields to the DB schema
    const data = { ...rawData };
    
    // 1. Resolve company_name from HR Details or user record
    if (!data.company_name) {
      const hrDetails = await db.getHRDetails(hrId);
      if (hrDetails && hrDetails.company_name) {
        data.company_name = hrDetails.company_name;
      } else {
        const userObj = await db.getUserById(hrId);
        data.company_name = userObj?.college_name || "Unknown Company";
      }
    }
    
    // 2. Resolve title and role
    if (!data.title) {
      data.title = data.job_title || "Job Opening";
    }
    if (!data.role) {
      data.role = data.title;
    }
    
    // 3. Resolve description
    if (!data.description) {
      data.description = data.job_description || "";
    }
    
    // 4. Resolve package_min and package_max from salary_package (e.g. "12 LPA", "8 - 15 LPA")
    if (data.package_min === undefined && data.package_max === undefined) {
      const pkgStr = data.salary_package || "";
      const numbers = pkgStr.match(/\d+(\.\d+)?/g);
      if (numbers && numbers.length > 0) {
        if (numbers.length === 1) {
          data.package_max = parseFloat(numbers[0]);
          data.package_min = parseFloat(numbers[0]);
        } else {
          data.package_min = parseFloat(numbers[0]);
          data.package_max = parseFloat(numbers[1]);
        }
      }
    }
    
    // 5. Resolve apply_deadline
    if (!data.apply_deadline) {
      data.apply_deadline = data.last_date || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();
    }
    
    // 6. Resolve allowed_departments
    if (!data.allowed_departments) {
      data.allowed_departments = data.allowed_branches || [];
    }
    
    // 7. Resolve allowed_batches
    if (!data.allowed_batches) {
      data.allowed_batches = data.batch_year ? [Number(data.batch_year)] : [];
    }

    let companyId: string;
    const { data: existingCompany } = await client.from("companies").select("id").eq("name", data.company_name).limit(1);
    if (existingCompany && existingCompany.length > 0) {
      companyId = existingCompany[0].id;
    } else {
      const { data: newComp, error: compErr } = await client.from("companies").insert({
        name: data.company_name,
        logo_url: data.logo_url || null,
        website: data.website || null,
        created_by: hrId
      }).select("id").single();
      if (compErr) throw compErr;
      companyId = newComp.id;
    }

    const { data: job, error: jobErr } = await client.from("job_posts").insert({
      company_id: companyId,
      created_by: hrId,
      title: data.title,
      role: data.role,
      package_min: data.package_min ? Number(data.package_min) : null,
      package_max: data.package_max ? Number(data.package_max) : null,
      location: data.location,
      description: data.description,
      job_type: data.job_type || 'full_time',
      min_cgpa: data.min_cgpa ? Number(data.min_cgpa) : 0,
      allowed_departments: data.allowed_departments || [],
      allowed_batches: data.allowed_batches || [],
      max_arrears: data.max_arrears ? Number(data.max_arrears) : 0,
      arrears_policy: data.arrears_policy || 'no_arrears',
      apply_deadline: data.apply_deadline,
      status: 'active'
    }).select("*").single();

    if (jobErr) throw jobErr;

    await client.from("activity_logs").insert({
      actor_id: hrId,
      actor_role: 'hr',
      action: 'create_job',
      description: `Created job post "${data.title}"`,
      entity_type: 'job_posts',
      entity_id: job.id
    });

    const { data: tpos } = await client.from("users").select("id").eq("role", "tpo");
    if (tpos && tpos.length > 0) {
      const notifs = tpos.map(t => ({
        user_id: t.id,
        title: "New Job Posting Pending Approval",
        message: `HR has posted a new job "${data.title}" which requires your approval.`,
        type: "job_posted",
        related_id: job.id
      }));
      const inserted = await client.from("notifications").insert(notifs).select("*");
      if (inserted.data) {
        inserted.data.forEach((n: any) => emitToUser(n.user_id, "notification", n));
      }
    }

    const { data: admins } = await client.from("users").select("id").eq("role", "admin");
    if (admins && admins.length > 0) {
      const notifs = admins.map(a => ({
        user_id: a.id,
        title: "New Job Posted by HR",
        message: `HR has posted a new job "${data.title}" requiring TPO approval.`,
        type: "job_posted",
        related_id: job.id
      }));
      const inserted = await client.from("notifications").insert(notifs).select("*");
      if (inserted.data) {
        inserted.data.forEach((n: any) => emitToUser(n.user_id, "notification", n));
      }
    }

    return job;
  },

  async getHRJobs(hrId: string) {
    const client = await createSupabaseClient();
    const { data, error } = await client.from("job_posts").select(`
      *,
      company:companies(*),
      applications:job_applications(id)
    `).eq("created_by", hrId).order("created_at", { ascending: false });

    if (error) throw error;

    return (data || []).map((job: any) => ({
      ...job,
      company_name: job.company?.name || null,
      applications_count: job.applications?.length || 0
    }));
  },

  async getJobApplicants(jobId: string, hrId: string) {
    const client = await createSupabaseClient();
    const { data: job } = await client.from("job_posts").select("id").eq("id", jobId).eq("created_by", hrId).limit(1);
    if (!job || job.length === 0) throw new Error("Unauthorized or job not found");

    const { data, error } = await client.from("job_applications").select(`
      *,
      student:users(*),
      details:student_details(*),
      resume:resumes(*)
    `).eq("job_id", jobId);

    if (error) throw error;

    return (data || []).map((app: any) => {
      const student = app.student;
      const details = app.details;
      const resume = app.resume;

      return {
        ...app,
        name: student?.name,
        email: student?.email,
        cgpa: details?.cgpa,
        department: details?.department,
        ats_score: details?.ats_score,
        technical_skills: details?.technical_skills,
        resume_url: resume?.file_url || null
      };
    });
  },

  async updateApplicationStatus(applicationId: string, hrId: string, newStatus: string, note?: string) {
    const client = await createSupabaseClient();
    const { data: app } = await client.from("job_applications").select(`
      *,
      job:job_posts(*)
    `).eq("id", applicationId).single();

    if (!app) throw new Error("Application not found");
    if (app.job?.created_by !== hrId) throw new Error("Unauthorized");

    const oldStatus = app.status;
    await client.from("job_applications").update({
      status: newStatus,
      updated_at: new Date().toISOString()
    }).eq("id", applicationId);

    await client.from("application_timeline").insert({
      application_id: applicationId,
      old_status: oldStatus,
      new_status: newStatus,
      changed_by: hrId,
      note: note || `Status updated to ${newStatus}`
    });

    const { data: n } = await client.from("notifications").insert({
      user_id: app.student_id,
      title: "Application Status Update",
      message: `Your application status for "${app.job?.title}" was updated to ${newStatus}. Note: ${note || 'None'}`,
      type: newStatus === "shortlisted" ? "shortlisted" : newStatus === "rejected" ? "rejected_application" : "application_update",
      related_id: applicationId
    }).select("*").single();
    if (n) emitToUser(n.user_id, "notification", n);
  },

  async scheduleInterview(data: any) {
    const client = await createSupabaseClient();
    const { data: interview, error: intErr } = await client.from("interviews").insert({
      application_id: data.application_id,
      student_id: data.student_id,
      job_id: data.job_id,
      scheduled_date: data.scheduled_date,
      scheduled_time: data.scheduled_time,
      mode: data.mode,
      link: data.link || null,
      venue: data.venue || null,
      round: data.round || 'Technical',
      status: 'scheduled'
    }).select("*").single();

    if (intErr) throw intErr;

    await client.from("job_applications").update({
      status: 'interview_scheduled',
      updated_at: new Date().toISOString()
    }).eq("id", data.application_id);

    await client.from("application_timeline").insert({
      application_id: data.application_id,
      old_status: 'shortlisted',
      new_status: 'interview_scheduled',
      changed_by: data.hr_id,
      note: `Interview scheduled: ${data.round} round on ${data.scheduled_date}`
    });

    const { data: n } = await client.from("notifications").insert({
      user_id: data.student_id,
      title: "Interview Scheduled",
      message: `Your interview for round "${data.round}" has been scheduled. Mode: ${data.mode}. Link/Venue: ${data.link || data.venue}`,
      type: "interview_scheduled",
      related_id: interview.id
    }).select("*").single();
    if (n) emitToUser(n.user_id, "notification", n);

    return interview;
  },

  async releaseOffer(data: any) {
    const client = await createSupabaseClient();
    const { data: offer, error: offErr } = await client.from("offers").insert({
      application_id: data.application_id,
      student_id: data.student_id,
      job_id: data.job_id,
      company_id: data.company_id,
      role: data.role,
      package: Number(data.package),
      offer_letter_url: data.offer_letter_url,
      status: 'pending'
    }).select("*").single();

    if (offErr) throw offErr;

    await client.from("job_applications").update({
      status: 'selected',
      updated_at: new Date().toISOString()
    }).eq("id", data.application_id);

    await client.from("application_timeline").insert({
      application_id: data.application_id,
      old_status: 'interview_scheduled',
      new_status: 'selected',
      changed_by: data.hr_id,
      note: `Offer letter released with package: ${data.package}`
    });

    const { data: n } = await client.from("notifications").insert({
      user_id: data.student_id,
      title: "Offer Received!",
      message: `Congratulations! You have received a job offer for the role of "${data.role}". Check your Job Offers page to respond.`,
      type: "offer_received",
      related_id: offer.id
    }).select("*").single();
    if (n) emitToUser(n.user_id, "notification", n);

    return offer;
  },

  // --- ADMIN FUNCTIONS ---
  async getAllUsers(filters?: any) {
    const client = await createSupabaseClient();
    let query = client.from("users").select("*");
    if (filters?.role) {
      query = query.eq("role", filters.role);
    }
    if (filters?.status) {
      query = query.eq("status", filters.status);
    }
    const { data, error } = await query.order("created_at", { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async getSystemStats() {
    const client = await createSupabaseClient();
    const { count: students } = await client.from("users").select("*", { count: "exact", head: true }).eq("role", "student");
    const { count: hr_users } = await client.from("users").select("*", { count: "exact", head: true }).eq("role", "hr");
    const { count: tpo_users } = await client.from("users").select("*", { count: "exact", head: true }).eq("role", "tpo");

    return {
      students: students || 0,
      hr_users: hr_users || 0,
      tpo_users: tpo_users || 0
    };
  },

  async getActivityLogs() {
    const client = await createSupabaseClient();
    const { data, error } = await client.from("activity_logs").select("*").order("created_at", { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async logActivity(actorId: string, actorRole: string, action: string, description: string, entityType?: string, entityId?: string) {
    const client = await createSupabaseClient();
    await client.from("activity_logs").insert({
      actor_id: actorId,
      actor_role: actorRole,
      action,
      description,
      entity_type: entityType || null,
      entity_id: entityId || null
    });
  },

  // --- BACKWARDS COMPATIBILITY ALIASES ---
  async findUserByEmail(email: string) {
    return db.getUserByEmail(email);
  },

  async findUserById(id: string) {
    return db.getUserById(id);
  },

  async updateUser(userId: string, update: any) {
    const client = await createSupabaseClient();
    await client.from("users").update(update).eq("id", userId);
  },

  async deleteStudentAccount(userId: string, email?: string) {
    const client = await createSupabaseClient();
    await client.from("job_applications").delete().eq("student_id", userId);
    await client.from("saved_jobs").delete().eq("student_id", userId);
    await client.from("interviews").delete().eq("student_id", userId);
    await client.from("offers").delete().eq("student_id", userId);
    await client.from("resumes").delete().eq("user_id", userId);
    await client.from("student_documents").delete().eq("user_id", userId);
    await client.from("student_projects").delete().eq("user_id", userId);
    await client.from("student_certifications").delete().eq("user_id", userId);
    await client.from("notifications").delete().eq("user_id", userId);
    await client.from("student_details").delete().eq("user_id", userId);
    await client.from("users").delete().eq("id", userId);
    if (email) {
      await client.from("otp_tokens").delete().eq("email", email.toLowerCase().trim());
    }
  },

  async updateUserEmailVerified(userId: string, emailVerified: boolean, email?: string) {
    const client = await createSupabaseClient();
    await client.from("users").update({ email_verified: emailVerified, email_verified_at: emailVerified ? new Date().toISOString() : null }).eq("id", userId);
  },

  async isUserEmailVerified(user: any) {
    return !!user.email_verified;
  },

  async saveOtpToken(email: string, code: string, purpose: any, expiresAt: Date) {
    return db.createOtp(email, code, purpose, expiresAt);
  },

  async findOtpToken(email: string, purpose: any) {
    return db.getOtp(email, purpose);
  },

  async deleteOtpToken(tokenId: string) {
    const client = await createSupabaseClient();
    await client.from("otp_tokens").delete().eq("id", tokenId);
  },

  async deleteOtpTokensByEmailAndPurpose(email: string, purpose: any) {
    return db.deleteOtp(email, purpose);
  },

  async createNotification(n: any) {
    const client = await createSupabaseClient();
    const { data, error } = await client.from("notifications").insert({
      user_id: n.user_id,
      title: n.title,
      message: n.message,
      type: n.type
    }).select("*").single();
    if (error) throw error;
    if (data) emitToUser(data.user_id, "notification", data);
    return data;
  },

  async getNotificationsByUser(userId: string) {
    return db.getNotifications(userId);
  },

  async markNotificationAsRead(id: string) {
    const client = await createSupabaseClient();
    await client.from("notifications").update({ read: true }).eq("id", id);
  },

  async markAllNotificationsAsRead(userId: string) {
    return db.markAllRead(userId);
  },

  async verifyAndUseInviteToken(token: string, role: string) {
    if (process.env.NODE_ENV !== "production") {
      if (token === "TPO-INVITE-123" && role === "tpo") return true;
      if (token === "HR-INVITE-xyz" && role === "hr") return true;
    }
    const invite = await db.getInviteToken(token);
    if (invite && invite.role === role) {
      await db.useInviteToken(invite.id);
      return true;
    }
    return false;
  },

  async getStudentDetails(userId: string) {
    const client = await createSupabaseClient();
    const { data } = await client.from("student_details").select("*").eq("user_id", userId).maybeSingle();
    return data;
  },

  async updateStudentDetails(userId: string, update: any) {
    const client = await createSupabaseClient();
    const { data, error } = await client.from("student_details").update(update).eq("user_id", userId).select("*").single();
    if (error) throw error;
    return data;
  },

  async getStudentDetailsByUserId(userId: string) {
    return db.getStudentDetails(userId);
  },

  async updateStudentSkills(userId: string, skills: string[]) {
    const client = await createSupabaseClient();
    const { data, error } = await client.from("student_details").update({ technical_skills: skills }).eq("user_id", userId).select("*").single();
    if (error) throw error;
    return data;
  },

  async getStudentsWithDetails() {
    const client = await createSupabaseClient();
    const { data, error } = await client.from("users").select(`
      *,
      student_details(*)
    `).eq("role", "student");

    if (error) throw error;

    return (data || []).map((item: any) => ({
      ...item,
      details: item.student_details
    }));
  },

  async getTPOs() {
    const client = await createSupabaseClient();
    const { data } = await client.from("users").select("*").eq("role", "tpo");
    return data || [];
  },

  async getHRs() {
    const client = await createSupabaseClient();
    const { data } = await client.from("users").select("*").eq("role", "hr");
    return data || [];
  },

  async getPlacementStats() {
    const client = await createSupabaseClient();
    const { count: totalStudents } = await client.from("users").select("*", { count: "exact", head: true }).eq("role", "student").eq("status", "active");
    const { count: activeJobs } = await client.from("job_posts").select("*", { count: "exact", head: true }).eq("status", "active");
    const { count: totalApplications } = await client.from("job_applications").select("*", { count: "exact", head: true });
    const { count: placedStudents } = await client.from("student_details").select("*", { count: "exact", head: true }).eq("placement_status", "placed");

    return {
      totalStudents: totalStudents || 0,
      activeJobs: activeJobs || 0,
      totalApplications: totalApplications || 0,
      placedStudents: placedStudents || 0
    };
  },

  async deleteJob(id: string) {
    const client = await createSupabaseClient();
    await client.from("job_applications").delete().eq("job_id", id);
    await client.from("saved_jobs").delete().eq("job_id", id);
    await client.from("interviews").delete().eq("job_id", id);
    await client.from("offers").delete().eq("job_id", id);
    await client.from("job_posts").delete().eq("id", id);
  },

  async getJobsByHr(hrId: string) {
    return db.getHRJobs(hrId);
  },

  async getApplicationsForJob(jobId: string) {
    const client = await createSupabaseClient();
    const { data, error } = await client.from("job_applications").select("*").eq("job_id", jobId);
    if (error) throw error;
    return data || [];
  },

  async getJobApplication(jobId: string, studentId: string) {
    const client = await createSupabaseClient();
    const { data, error } = await client.from("job_applications").select("*").eq("job_id", jobId).eq("student_id", studentId).maybeSingle();
    if (error) throw error;
    return data;
  },

  async getApplicationById(id: string) {
    const client = await createSupabaseClient();
    const { data, error } = await client.from("job_applications").select("*").eq("id", id).maybeSingle();
    if (error) throw error;
    return data;
  },

  async getApplicationsByStudent(studentId: string) {
    const client = await createSupabaseClient();
    const { data, error } = await client.from("job_applications").select("*").eq("student_id", studentId);
    if (error) throw error;
    return data || [];
  },

  async createJobApplication(app: any) {
    const client = await createSupabaseClient();
    const { data, error } = await client.from("job_applications").insert({
      student_id: app.student_id,
      job_id: app.job_id,
      resume_id: app.resume_id,
      status: "applied"
    }).select("*").single();
    if (error) throw error;
    return data;
  },

  async createApplicationLog(log: any) {
    // Legacy mapping to timeline
    const client = await createSupabaseClient();
    const { data, error } = await client.from("application_timeline").insert({
      application_id: log.application_id,
      new_status: log.status,
      changed_by: log.application_id, // fallback
      note: log.note || ""
    }).select("*").single();
    if (error) throw error;
    return data;
  },

  async getApplicationLogs(applicationId: string) {
    // Legacy mapping to timeline
    const client = await createSupabaseClient();
    const { data, error } = await client.from("application_timeline").select("*").eq("application_id", applicationId);
    if (error) throw error;
    return (data || []).map((item: any) => ({
      ...item,
      status: item.new_status
    }));
  },

  async getJobsPendingApproval() {
    return db.getPendingJobs();
  },

  async updateJob(id: string, updates: any) {
    const client = await createSupabaseClient();
    await client.from("job_posts").update(updates).eq("id", id);
  },

  async approveJobLegacy(id: string) {
    return db.approveJob(id, "");
  },

  async rejectJobLegacy(id: string) {
    return db.rejectJob(id, "", "Rejected by TPO");
  },

  async getAllJobs() {
    const client = await createSupabaseClient();
    const { data, error } = await client.from("job_posts").select("*");
    if (error) throw error;
    return data || [];
  },

  async getOffersByHr(hrId: string) {
    const client = await createSupabaseClient();
    const { data, error } = await client.from("offers").select(`
      *,
      job:job_posts(
        created_by
      )
    `);
    if (error) throw error;
    return (data || []).filter((o: any) => o.job?.created_by === hrId);
  },

  async getOffersByStudent(studentId: string) {
    return db.getMyOffers(studentId);
  },

  async getOfferById(id: string) {
    const client = await createSupabaseClient();
    const { data, error } = await client.from("offers").select("*").eq("id", id).maybeSingle();
    if (error) throw error;
    return data;
  },

  async updateOfferStatus(offerId: string, status: string) {
    const client = await createSupabaseClient();
    await client.from("offers").update({ status, responded_at: new Date().toISOString() }).eq("id", offerId);
  },

  async getInterviewsByStudent(studentId: string) {
    return db.getMyInterviews(studentId);
  },

  async getInterviewsByHr(hrId: string) {
    const client = await createSupabaseClient();
    const { data, error } = await client.from("interviews").select(`
      *,
      job:job_posts(
        created_by
      )
    `);
    if (error) throw error;
    return (data || []).filter((i: any) => i.job?.created_by === hrId);
  },

  async getPlacementByStudent(studentId: string) {
    const client = await createSupabaseClient();
    const { data } = await client.from("student_details").select("placement_status, placed_company, placed_role, placed_package").eq("user_id", studentId).maybeSingle();
    if (data && data.placement_status === "placed") {
      return {
        student_id: studentId,
        company_name: data.placed_company,
        job_title: data.placed_role,
        salary_package: data.placed_package,
        status: data.placement_status
      };
    }
    return null;
  },

  async getAllPlacementRecords() {
    const client = await createSupabaseClient();
    const { data } = await client.from("student_details").select("user_id, placement_status, placed_company, placed_role, placed_package").eq("placement_status", "placed");
    return (data || []).map((d: any) => ({
      student_id: d.user_id,
      company_name: d.placed_company,
      job_title: d.placed_role,
      salary_package: d.placed_package,
      status: d.placement_status || 'placed'
    }));
  },

  async getDashboardMetricsLegacy(studentId: string) {
    const client = await createSupabaseClient();
    const stats = await db.getStudentDashboardMetrics(studentId);

    // Fetch upcoming interviews
    const { data: upcoming } = await client.from("interviews").select(`
      *,
      job:job_posts(
        title,
        company:companies(name)
      )
    `).eq("student_id", studentId).eq("status", "scheduled").order("scheduled_date", { ascending: true }).limit(5);

    const upcomingInterviewsList = (upcoming || []).map((i: any) => ({
      id: i.id,
      scheduled_at: `${i.scheduled_date}T${i.scheduled_time}`,
      mode: i.mode,
      link: i.link,
      venue: i.venue,
      round: i.round,
      status: i.status,
      company_name: i.job?.company?.name || "Unknown Company",
      job_title: i.job?.title || "Unknown Role"
    }));

    // Fetch recent applications
    const { data: recentApps } = await client.from("job_applications").select(`
      *,
      job:job_posts(
        *,
        company:companies(*)
      )
    `).eq("student_id", studentId).order("applied_at", { ascending: false }).limit(5);

    const recentApplications = (recentApps || []).map((app: any) => {
      const job = app.job;
      return {
        id: app.id,
        status: app.status,
        applied_at: app.applied_at,
        jobDetails: {
          id: job?.id,
          job_title: job?.title,
          company_name: job?.company?.name,
          logo_url: job?.company?.logo_url,
          location: job?.location,
          salary_package: job?.package_max ? `${job.package_min ? job.package_min + '-' : ''}${job.package_max} LPA` : "N/A"
        }
      };
    });

    // Derive placement status badge
    // Placement Status Badge: Not Applied, Applied, Shortlisted, Interview Scheduled, Placed
    let derivedStatus = "Not Applied";
    if (stats.placement_status === "placed" || stats.offer_count > 0) {
      derivedStatus = "Placed";
    } else if (upcomingInterviewsList.length > 0) {
      derivedStatus = "Interview Scheduled";
    } else if (stats.shortlisted_count > 0) {
      derivedStatus = "Shortlisted";
    } else if (stats.applications_count > 0) {
      derivedStatus = "Applied";
    }

    return {
      metrics: {
        applicationsCount: stats.applications_count,
        shortlistedCount: stats.shortlisted_count,
        interviewsCount: stats.interview_count,
        offersCount: stats.offer_count,
        atsScore: stats.ats_score,
        profileCompletion: stats.profile_completion,
        upcomingInterviews: upcomingInterviewsList.length,
        pendingOffers: stats.offer_count,
        eligibleJobsCount: stats.eligible_jobs_count
      },
      upcomingInterviewsList,
      recentApplications,
      recommendedJobs: [],
      placementStatus: {
        status: derivedStatus
      }
    };
  }

  ,
  // --- ADDITIONAL COMPATIBILITY / MISSING HELPERS ---
  async getInterviewById(interviewId: string) {
    const client = await createSupabaseClient();
    const { data, error } = await client.from("interviews").select("*").eq("id", interviewId).maybeSingle();
    if (error) throw error;
    return data || null;
  },

  async createInterviewSlot(payload: any) {
    const client = await createSupabaseClient();
    const { data, error } = await client.from("interviews").insert({
      application_id: payload.application_id || null,
      student_id: payload.student_id,
      job_id: payload.job_id,
      scheduled_date: payload.scheduled_at ? new Date(payload.scheduled_at).toISOString().split('T')[0] : null,
      scheduled_time: payload.scheduled_at ? new Date(payload.scheduled_at).toISOString().split('T')[1] : null,
      mode: payload.interview_mode || payload.mode || "online",
      link: payload.interview_link || payload.link || null,
      venue: payload.location || null,
      round: payload.interview_type || payload.round || "Technical",
      status: payload.status || "scheduled",
      feedback: payload.feedback || null,
      result: payload.result || "pending",
      created_at: new Date().toISOString()
    }).select("*").single();
    if (error) throw error;
    return data;
  },

  async updateInterviewStatus(interviewId: string, status: string, feedback?: string, result?: string) {
    const client = await createSupabaseClient();
    const updates: any = { status };
    if (feedback !== undefined) updates.feedback = feedback;
    if (result !== undefined) updates.result = result;
    await client.from("interviews").update(updates).eq("id", interviewId);
  },

  async updateJobStatus(jobId: string, status: string) {
    const client = await createSupabaseClient();
    const { data, error } = await client.from("job_posts").update({ status, updated_at: new Date().toISOString() }).eq("id", jobId).select("*").single();
    if (error) throw error;
    return data;
  },

  async getUsersByRole(role: string) {
    const client = await createSupabaseClient();
    const { data, error } = await client.from("users").select("*").eq("role", role);
    if (error) throw error;
    return data || [];
  },

  async createOffer(data: any) {
    return db.releaseOffer(data);
  },

  async getDashboardMetrics(userId: string) {
    return db.getDashboardMetricsLegacy(userId);
  },

  // --- EDUCATION CRUD ---
  async getEducationByUserId(userId: string) {
    const client = await createSupabaseClient();
    const { data, error } = await client.from("student_education").select("*").eq("user_id", userId).order("created_at", { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async addEducation(userId: string, data: any) {
    const client = await createSupabaseClient();
    const { data: rec, error } = await client.from("student_education").insert({
      user_id: userId,
      institution: data.institution,
      degree: data.degree || null,
      field_of_study: data.field_of_study || null,
      start_year: data.start_year || null,
      end_year: data.end_year || null,
      percentage: data.percentage || null,
      cgpa: data.cgpa || null,
      type: data.type || null,
      created_at: new Date().toISOString()
    }).select("*").single();
    if (error) throw error;
    return rec;
  },

  async updateEducation(userId: string, id: string, update: any) {
    const client = await createSupabaseClient();
    const { data, error } = await client.from("student_education").update(update).eq("id", id).eq("user_id", userId).select("*").maybeSingle();
    if (error) throw error;
    return data || null;
  },

  async deleteEducation(userId: string, id: string) {
    const client = await createSupabaseClient();
    await client.from("student_education").delete().eq("id", id).eq("user_id", userId);
  },
};
