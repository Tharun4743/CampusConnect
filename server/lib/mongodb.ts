import { MongoClient, Db } from "mongodb";
import crypto from "crypto";
import bcrypt from "bcryptjs";

export interface User {
  id: string;
  name: string;
  email: string;
  password_hash: string;
  role: "student" | "tpo" | "hr" | "admin";
  status: "pending" | "active" | "rejected";
  college_name: string | null;
  created_at: string;
}

export interface Address {
  street?: string;
  city?: string;
  state?: string;
  pincode?: string;
  country?: string;
}

export interface EmergencyContact {
  name?: string;
  relationship?: string;
  phoneNumber?: string;
}

export interface PersonalInfo {
  dateOfBirth?: string;
  gender?: "male" | "female" | "other" | "";
  bloodGroup?: "O+" | "O-" | "A+" | "A-" | "B+" | "B-" | "AB+" | "AB-" | "";
  phoneNumber?: string;
  parentPhoneNumber?: string;
  address?: Address;
  emergencyContact?: EmergencyContact;
}

export interface Certification {
  _id: string;
  name: string;
  issuedBy: string;
  issueDate: string;
  expiryDate?: string;
  credentialUrl?: string;
}

export interface Internship {
  _id: string;
  companyName: string;
  position: string;
  duration: { startDate: string; endDate?: string };
  currentlyWorking?: boolean;
  description: string;
  skills: string[];
}

export interface WorkExperience {
  _id: string;
  companyName: string;
  position: string;
  duration: { startDate: string; endDate?: string };
  currentlyWorking?: boolean;
  description: string;
  skills: string[];
}

export interface Project {
  _id: string;
  title: string;
  description: string;
  technologies: string[];
  startDate?: string;
  endDate?: string;
  githubUrl?: string;
  liveUrl?: string;
  highlights?: string[];
}

export interface ProfessionalInfo {
  summary?: string;
  skills?: string[];
  certifications?: Certification[];
  internships?: Internship[];
  workExperience?: WorkExperience[];
  projects?: Project[];
}

export interface AcademicInfo {
  class10Percentage?: number;
  class12Percentage?: number;
  schoolName?: string;
  schoolCity?: string;
  collegeName?: string;
  collegeCity?: string;
}

export interface ResumeItem {
  _id: string;
  fileName: string;
  originalName: string;
  uploadedAt: string;
  fileUrl: string;
  fileSize: number;
  isPrimary: boolean;
  version: number;
}

export interface DocumentItem {
  _id: string;
  fileName: string;
  originalName: string;
  documentType: "academic" | "certification" | "offer_letter" | "internship" | "other";
  fileUrl: string;
  fileSize: number;
  uploadedAt: string;
  description?: string;
  tags?: string[];
  isPublic?: boolean;
  expiryDate?: string;
}

export interface DocumentsVault {
  resumes?: ResumeItem[];
  documents?: DocumentItem[];
}

export interface ProfileCompletion {
  personalInfo: number;
  academicInfo: number;
  professionalInfo: number;
  documentsUploaded: number;
  overallCompletion: number;
}

export interface ProfileSettings {
  profileVisibility: "private" | "tpo_only" | "recruiters_only" | "public";
  lastProfileUpdate?: string;
}

export interface StudentDetails {
  user_id: string;
  roll_number: string;
  branch: string;
  batch_year: number;
  cgpa: number;
  
  // New visual and professional fields for Module 2:
  personalInfo?: PersonalInfo;
  professionalInfo?: ProfessionalInfo;
  academicInfo?: AcademicInfo;
  documentsVault?: DocumentsVault;
  profileCompletion?: ProfileCompletion;
  profileSettings?: ProfileSettings;

  // Status metrics
  semester?: number;
  class10Percentage?: number;
  class12Percentage?: number;
  backlogs?: number;
  placementStatus?: "unplaced" | "placed" | "dream_placed" | "not_interested";
  placedInCompany?: string | null;
  placedAt?: string | null;
  offeredSalary?: number | null;
}

export interface DocumentAuditLog {
  id: string;
  userId: string;
  action: "uploaded" | "deleted" | "downloaded" | "updated";
  documentId: string;
  fileName: string;
  documentType: string;
  fileSize: number;
  ipAddress?: string;
  userAgent?: string;
  timestamp: string;
  createdAt: string;
}

export interface Company {
  id: string;
  name: string;
  website?: string;
  industry?: string;
  size?: "startup" | "small" | "medium" | "large" | "enterprise";
  location?: { city?: string; state?: string; country?: string };
  hrContact?: string; // userId of HR Profile
  logo?: string;
  description?: string;
}

export interface HRDetails {
  user_id: string;
  company_name: string;
  designation: string;
  linkedin_url: string | null;
}

export interface OtpToken {
  id: string;
  email: string;
  otp_code: string;
  purpose: "signup" | "login" | "forgot_password";
  expires_at: string;
  attempts: number;
  created_at: string;
}

export interface InviteToken {
  id: string;
  token: string;
  role: "hr" | "tpo";
  created_by: string | null;
  used: boolean;
  created_at: string;
}

export interface JobPost {
  id: string;
  hr_id: string;
  company_name: string;
  job_title: string;
  job_description: string;
  location: string;
  min_cgpa: number;
  allowed_branches: string[];
  batch_year: number;
  salary_package: string;
  last_date: string;
  status: "active" | "closed";
  created_at: string;
}

export interface JobApplication {
  id: string;
  job_id: string;
  student_id: string;
  status: "applied" | "shortlisted" | "rejected" | "selected";
  resume_url: string;
  applied_at: string;
  updated_at: string;
}

export interface ApplicationLog {
  id: string;
  application_id: string;
  status: string;
  note: string;
  created_at: string;
}

export interface AtsScore {
  job_id: string;
  match_score: number;
  missing_skills: string[];
  suggestions: string[];
}

export interface ResumeAnalysis {
  id: string;
  student_id: string;
  resume_text: string;
  skills: string[];
  experience_years: number;
  ats_scores: AtsScore[];
  overall_score: number;
  created_at: string;
}

// In-Memory Database Fallback for development/preview experience
class InMemoryDB {
  users: User[] = [];
  studentDetails: StudentDetails[] = [];
  hrDetails: HRDetails[] = [];
  otpTokens: OtpToken[] = [];
  inviteTokens: InviteToken[] = [];
  documentAuditLogs: DocumentAuditLog[] = [];
  companies: Company[] = [];
  jobPosts: JobPost[] = [];
  jobApplications: JobApplication[] = [];
  applicationLogs: ApplicationLog[] = [];
  resumeAnalyses: ResumeAnalysis[] = [];

  constructor() {
    const mockAdminId = "99999999-9999-9999-9999-999999999999";
    this.users.push({
      id: mockAdminId,
      name: "Global Admin",
      email: "admin@college.edu",
      password_hash: "", // Bypass for fresh sandbox authentication
      role: "admin",
      status: "active",
      college_name: "AI Studio University",
      created_at: new Date().toISOString(),
    });

    // Seed super admin in-memory database fallback to ensure seamless local preview capabilities if MongoDB connection is pending whitelist
    const superAdminEmail = "campusconnectvsb@gmail.com";
    const superAdminPasswordHash = bcrypt.hashSync("123456", 10);
    this.users.push({
      id: "super-admin-inmemory-uuid-id",
      name: "Campus Connect Super Admin",
      email: superAdminEmail,
      password_hash: superAdminPasswordHash,
      role: "admin",
      status: "active",
      college_name: "AI Studio University",
      created_at: new Date().toISOString(),
    });

    // Seed student test account
    const studentEmail = "student@college.edu";
    const studentPasswordHash = bcrypt.hashSync("123456", 10);
    const mockStudentId = "student-mock-uuid-id";
    this.users.push({
      id: mockStudentId,
      name: "John Student",
      email: studentEmail,
      password_hash: studentPasswordHash,
      role: "student",
      status: "active",
      college_name: "AI Studio University",
      created_at: new Date().toISOString(),
    });
    this.studentDetails.push({
      user_id: mockStudentId,
      roll_number: "ROLL-101",
      branch: "Computer Science",
      batch_year: 2026,
      cgpa: 9.0,
      placementStatus: "unplaced",
      backlogs: 0,
    });

    // Seed TPO test account
    const tpoEmail = "tpo@college.edu";
    const tpoPasswordHash = bcrypt.hashSync("123456", 10);
    const mockTpoId = "tpo-mock-uuid-id";
    this.users.push({
      id: mockTpoId,
      name: "Professor TPO",
      email: tpoEmail,
      password_hash: tpoPasswordHash,
      role: "tpo",
      status: "active",
      college_name: "AI Studio University",
      created_at: new Date().toISOString(),
    });

    // Seed HR test account
    const hrEmail = "hr@company.com";
    const hrPasswordHash = bcrypt.hashSync("123456", 10);
    const mockHrId = "hr-mock-uuid-id";
    this.users.push({
      id: mockHrId,
      name: "Alice Recruiter",
      email: hrEmail,
      password_hash: hrPasswordHash,
      role: "hr",
      status: "active",
      college_name: "Tech Corp",
      created_at: new Date().toISOString(),
    });
    this.hrDetails.push({
      user_id: mockHrId,
      company_name: "Tech Corp",
      designation: "Lead Recruiter",
      linkedin_url: "https://linkedin.com",
    });

    this.inviteTokens.push({
      id: "i1111111-1111-1111-1111-111111111111",
      token: "TPO-INVITE-123",
      role: "tpo",
      created_by: mockAdminId,
      used: false,
      created_at: new Date().toISOString(),
    });
    this.inviteTokens.push({
      id: "i2222222-2222-2222-2222-222222222222",
      token: "HR-INVITE-xyz",
      role: "hr",
      created_by: mockAdminId,
      used: false,
      created_at: new Date().toISOString(),
    });

    // Seed mock jobs in InMemoryDB
    const mockJobId1 = "j1111111-1111-1111-1111-111111111111";
    const mockJobId2 = "j2222222-2222-2222-2222-222222222222";
    this.jobPosts.push({
      id: mockJobId1,
      hr_id: "hr-mock-uuid-id",
      company_name: "Tech Corp",
      job_title: "Associate Software Engineer",
      job_description: "We are seeking a motivated Associate Software Engineer to join our core development team. You will work on writing clean, scalable TypeScript/React code, participating in daily standups, and shipping features to production. Experience with databases and APIs is highly preferred.",
      location: "San Francisco, CA (Hybrid)",
      min_cgpa: 7.5,
      allowed_branches: ["Computer Science", "Information Technology", "Electronics"],
      batch_year: 2026,
      salary_package: "14 LPA",
      last_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), // 14 days from now
      status: "active",
      created_at: new Date().toISOString()
    });

    this.jobPosts.push({
      id: mockJobId2,
      hr_id: "hr-mock-uuid-id",
      company_name: "Tech Corp",
      job_title: "Frontend Developer (React)",
      job_description: "Join us as a Frontend Developer Intern/Full-time. You're expected to build pixel-perfect interactive UI dashboards using Tailwind CSS, maintain unit tests list, and collaborate with UX designers.",
      location: "Bengaluru, India (On-site)",
      min_cgpa: 8.0,
      allowed_branches: ["Computer Science", "Information Technology"],
      batch_year: 2026,
      salary_package: "12 LPA",
      last_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
      status: "active",
      created_at: new Date().toISOString()
    });
  }
}

const memoryDb = new InMemoryDB();

let mongoClientInstance: MongoClient | null = null;
let mongoDbInstance: Db | null = null;
let isConfigured = false;
let isSeeded = false;
let mongoConnectionFailed = false;

// Lazy initialization of MongoDB
export async function getMongoDb(): Promise<Db | null> {
  if (mongoDbInstance) return mongoDbInstance;
  if (mongoConnectionFailed) return null;

  const mongoUri = process.env.MONGODB_URI;
  if (mongoUri && mongoUri.trim() !== "") {
    try {
      // Connect with fast timeout limits to avoid blocking client requests on TLS alert 80 or IP whitelist blocks
      const client = new MongoClient(mongoUri, {
        connectTimeoutMS: 4000,
        serverSelectionTimeoutMS: 4000,
        socketTimeoutMS: 15000,
      });
      await client.connect();
      
      const dbName = process.env.MONGODB_DB_NAME || "placement_portal";
      const db = client.db(dbName);
      
      mongoClientInstance = client;
      mongoDbInstance = db;
      isConfigured = true;
      console.log(`Database Connection: Successfully initialized MongoDB database "${dbName}".`);

      // Seed MongoDB once if not seeded
      if (!isSeeded) {
        await seedMongoDatabase(db);
        isSeeded = true;
      }

      return mongoDbInstance;
    } catch (err) {
      mongoConnectionFailed = true;
      console.error("Database Connection: Failed to connect to MongoDB. Falling back to memory.", err);
    }
  } else {
    console.warn("🔌 Database Connection: MONGODB_URI is not configured in environment. Falling back to in-memory database.");
    mongoConnectionFailed = true;
  }
  return null;
}

export function isMongoConfigured(): boolean {
  return isConfigured;
}

// Seeds the connected MongoDB with default initial parameters & admin profile
async function seedMongoDatabase(db: Db) {
  try {
    // Drop any unwanted collection tables that aren't defined in the system
    const officialCollections = [
      "users",
      "invite_tokens",
      "student_details",
      "hr_details",
      "document_audit_logs",
      "otp_tokens"
    ];

    try {
      const collections = await db.listCollections().toArray();
      const collectionNames = collections.map((col) => col.name);
      for (const colName of collectionNames) {
        if (!officialCollections.includes(colName) && !colName.startsWith("system.")) {
          console.log(`Database Cleanup: Dropping unwanted/unofficial collection: "${colName}"`);
          try {
            await db.collection(colName).drop();
          } catch (dropErr) {
            console.error(`Database Cleanup: Failed to drop "${colName}":`, dropErr);
          }
        }
      }
    } catch (listErr) {
      console.error("Database Cleanup: Error checking collections list:", listErr);
    }

    const usersColl = db.collection("users");
    const inviteColl = db.collection("invite_tokens");

    // Standard list of active system emails to keep
    const allowedEmails = [
      "admin@college.edu",
      "campusconnectvsb@gmail.com",
      "student@college.edu",
      "tpo@college.edu",
      "hr@company.com"
    ];

    // Preserve new student & tpo registrations by disabling database truncate on restarts
    console.log(`Database Initialization: User accounts from custom student/TPO registrations will be kept.`);

    // Check if Global Admin email exists in database
    const adminCheck = await usersColl.findOne({ email: "admin@college.edu" });
    const mockAdminId = "99999999-9999-9999-9999-999999999999";
    if (!adminCheck) {
      await usersColl.insertOne({
        id: mockAdminId,
        name: "Global Admin",
        email: "admin@college.edu",
        password_hash: "", // Empty hash so standard dev bypass works
        role: "admin",
        status: "active",
        college_name: "AI Studio University",
        created_at: new Date().toISOString(),
      });
      console.log("Database Seed: Successfully inserted Global Admin account profile.");
    }

    // Ensure campusconnectvsb@gmail.com is super admin with password 123456
    const superAdminEmail = "campusconnectvsb@gmail.com";
    const superAdminCheck = await usersColl.findOne({ email: superAdminEmail });
    const hashedPassword = await bcrypt.hash("123456", 10);

    if (!superAdminCheck) {
      await usersColl.insertOne({
        id: crypto.randomUUID(),
        name: "Campus Connect Super Admin",
        email: superAdminEmail,
        password_hash: hashedPassword,
        role: "admin",
        status: "active",
        college_name: "AI Studio University",
        created_at: new Date().toISOString(),
      });
      console.log(`Database Seed: Successfully inserted Super Admin: ${superAdminEmail}`);
    } else {
      await usersColl.updateOne(
        { email: superAdminEmail },
        { 
          $set: { 
            role: "admin", 
            status: "active", 
            password_hash: hashedPassword,
          } 
        }
      );
      console.log(`Database Seed: Successfully verified and updated existing user to Super Admin: ${superAdminEmail}`);
    }

    // Seed student test account in MongoDB if missing
    const studentCheck = await usersColl.findOne({ email: "student@college.edu" });
    if (!studentCheck) {
      const studentId = crypto.randomUUID();
      await usersColl.insertOne({
        id: studentId,
        name: "John Student",
        email: "student@college.edu",
        password_hash: hashedPassword,
        role: "student",
        status: "active",
        college_name: "AI Studio University",
        created_at: new Date().toISOString(),
      });
      await db.collection("student_details").insertOne({
        user_id: studentId,
        roll_number: "ROLL-101",
        branch: "Computer Science",
        batch_year: 2026,
        cgpa: 9.0,
        placementStatus: "unplaced",
        backlogs: 0,
      });
      console.log("Database Seed: Successfully inserted Student test account in MongoDB.");
    }

    // Seed TPO test account in MongoDB if missing
    const tpoCheck = await usersColl.findOne({ email: "tpo@college.edu" });
    if (!tpoCheck) {
      const tpostId = crypto.randomUUID();
      await usersColl.insertOne({
        id: tpostId,
        name: "Professor TPO",
        email: "tpo@college.edu",
        password_hash: hashedPassword,
        role: "tpo",
        status: "active",
        college_name: "AI Studio University",
        created_at: new Date().toISOString(),
      });
      console.log("Database Seed: Successfully inserted TPO test account in MongoDB.");
    }

    // Seed HR test account in MongoDB if missing
    const hrCheck = await usersColl.findOne({ email: "hr@company.com" });
    if (!hrCheck) {
      const hrId = crypto.randomUUID();
      await usersColl.insertOne({
        id: hrId,
        name: "Alice Recruiter",
        email: "hr@company.com",
        password_hash: hashedPassword,
        role: "hr",
        status: "active",
        college_name: "Tech Corp",
        created_at: new Date().toISOString(),
      });
      await db.collection("hr_details").insertOne({
        user_id: hrId,
        company_name: "Tech Corp",
        designation: "Lead Recruiter",
        linkedin_url: "https://linkedin.com",
      });
      console.log("Database Seed: Successfully inserted HR test account in MongoDB.");
    }

    // Check invite tokens
    const tpoInviteCheck = await inviteColl.findOne({ token: "TPO-INVITE-123" });
    if (!tpoInviteCheck) {
      await inviteColl.insertOne({
        id: "i1111111-1111-1111-1111-111111111111",
        token: "TPO-INVITE-123",
        role: "tpo",
        created_by: mockAdminId,
        used: false,
        created_at: new Date().toISOString(),
      });
    }

    const hrInviteCheck = await inviteColl.findOne({ token: "HR-INVITE-xyz" });
    if (!hrInviteCheck) {
      await inviteColl.insertOne({
        id: "i2222222-2222-2222-2222-222222222222",
        token: "HR-INVITE-xyz",
        role: "hr",
        created_by: mockAdminId,
        used: false,
        created_at: new Date().toISOString(),
      });
    }

    // Ensure database indices are created on unique/frequently queried fields
    await usersColl.createIndex({ id: 1 }, { unique: true, sparse: true });
    await usersColl.createIndex({ email: 1 }, { unique: true, sparse: true });
    await inviteColl.createIndex({ token: 1 });
    
  } catch (err) {
    console.error("Database Seed: Error seeding MongoDB default parameters.", err);
  }
}

// Unified Database Provider Interface using MongoDB
export const db = {
  // USERS
  async findUserByEmail(email: string): Promise<User | null> {
    const mongo = await getMongoDb();
    const emailLower = email.toLowerCase().trim();
    if (mongo) {
      const doc = await mongo.collection("users").findOne({ email: emailLower });
      if (!doc) return null;
      // Convert mongo _id properties or cast correctly
      const { _id, ...user } = doc as any;
      return user as User;
    } else {
      return memoryDb.users.find((u) => u.email.toLowerCase() === emailLower) || null;
    }
  },

  async findUserById(id: string): Promise<User | null> {
    const mongo = await getMongoDb();
    if (mongo) {
      const doc = await mongo.collection("users").findOne({ id });
      if (!doc) return null;
      const { _id, ...user } = doc as any;
      return user as User;
    } else {
      return memoryDb.users.find((u) => u.id === id) || null;
    }
  },

  async createUser(user: Omit<User, "id" | "created_at">): Promise<User> {
    const newUser: User = {
      id: crypto.randomUUID(),
      name: user.name,
      email: user.email.toLowerCase().trim(),
      password_hash: user.password_hash,
      role: user.role,
      status: user.status,
      college_name: user.college_name,
      created_at: new Date().toISOString(),
    };

    const mongo = await getMongoDb();
    if (mongo) {
      await mongo.collection("users").insertOne({ ...newUser });
      return newUser;
    } else {
      memoryDb.users.push(newUser);
      return newUser;
    }
  },

  async updateUserStatus(userId: string, status: "pending" | "active" | "rejected"): Promise<void> {
    const mongo = await getMongoDb();
    if (mongo) {
      await mongo.collection("users").updateOne({ id: userId }, { $set: { status } });
    } else {
      const user = memoryDb.users.find((u) => u.id === userId);
      if (user) user.status = status;
    }
  },

  async updateUserPassword(userId: string, passwordHash: string): Promise<void> {
    const mongo = await getMongoDb();
    if (mongo) {
      await mongo.collection("users").updateOne({ id: userId }, { $set: { password_hash: passwordHash } });
    } else {
      const user = memoryDb.users.find((u) => u.id === userId);
      if (user) user.password_hash = passwordHash;
    }
  },

  // DETAILS
  async createStudentDetails(details: StudentDetails): Promise<void> {
    const defaultDetails: StudentDetails = {
      ...details,
      personalInfo: {
        dateOfBirth: "",
        gender: "",
        bloodGroup: "",
        phoneNumber: "",
        parentPhoneNumber: "",
        address: { street: "", city: "", state: "", pincode: "", country: "India" },
        emergencyContact: { name: "", relationship: "", phoneNumber: "" }
      },
      professionalInfo: {
        summary: "",
        skills: [],
        certifications: [],
        internships: [],
        workExperience: [],
        projects: []
      },
      academicInfo: {
        class10Percentage: 0,
        class12Percentage: 0,
        schoolName: "",
        schoolCity: "",
        collegeName: "AI Studio University",
        collegeCity: ""
      },
      documentsVault: {
        resumes: [],
        documents: []
      },
      profileCompletion: {
        personalInfo: 0,
        academicInfo: 0,
        professionalInfo: 0,
        documentsUploaded: 0,
        overallCompletion: 0
      },
      profileSettings: {
        profileVisibility: "tpo_only",
        lastProfileUpdate: new Date().toISOString()
      },
      backlogs: 0,
      placementStatus: "unplaced"
    };

    const mongo = await getMongoDb();
    if (mongo) {
      await mongo.collection("student_details").insertOne({ ...defaultDetails });
    } else {
      memoryDb.studentDetails.push(defaultDetails);
    }
  },

  async getStudentDetails(userId: string): Promise<StudentDetails | null> {
    const mongo = await getMongoDb();
    if (mongo) {
      const doc = await mongo.collection("student_details").findOne({ user_id: userId });
      if (!doc) return null;
      const { _id, ...details } = doc as any;
      return details as StudentDetails;
    } else {
      return memoryDb.studentDetails.find((d) => d.user_id === userId) || null;
    }
  },

  async updateStudentDetails(userId: string, update: Partial<StudentDetails>): Promise<StudentDetails> {
    const mongo = await getMongoDb();
    const current = await this.getStudentDetails(userId) || {
      user_id: userId,
      roll_number: "",
      branch: "",
      batch_year: 0,
      cgpa: 0.0
    };

    const merged: StudentDetails = { ...current, ...update, user_id: userId };
    
    // Deep merge for nesting structures in a clean robust way
    if (update.personalInfo) merged.personalInfo = { ...current.personalInfo, ...update.personalInfo };
    if (update.professionalInfo) merged.professionalInfo = { ...current.professionalInfo, ...update.professionalInfo };
    if (update.academicInfo) merged.academicInfo = { ...current.academicInfo, ...update.academicInfo };
    if (update.documentsVault) merged.documentsVault = { ...current.documentsVault, ...update.documentsVault };
    if (update.profileCompletion) merged.profileCompletion = { ...current.profileCompletion, ...update.profileCompletion };
    if (update.profileSettings) merged.profileSettings = { ...current.profileSettings, ...update.profileSettings };

    if (mongo) {
      await mongo.collection("student_details").updateOne({ user_id: userId }, { $set: merged }, { upsert: true });
      return merged;
    } else {
      const detailsIndex = memoryDb.studentDetails.findIndex((d) => d.user_id === userId);
      if (detailsIndex >= 0) {
        memoryDb.studentDetails[detailsIndex] = merged;
      } else {
        memoryDb.studentDetails.push(merged);
      }
      return merged;
    }
  },

  // AUDIT LOGS
  async logDocumentAction(log: Omit<DocumentAuditLog, "id" | "timestamp" | "createdAt">): Promise<void> {
    const mongo = await getMongoDb();
    const newLog: DocumentAuditLog = {
      ...log,
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };
    if (mongo) {
      await mongo.collection("document_audit_logs").insertOne(newLog);
    } else {
      memoryDb.documentAuditLogs.push(newLog);
    }
  },

  async getDocumentLogs(userId: string): Promise<DocumentAuditLog[]> {
    const mongo = await getMongoDb();
    if (mongo) {
      const docs = await mongo.collection("document_audit_logs")
        .find({ userId })
        .sort({ timestamp: -1 })
        .toArray();
      return docs.map((d: any) => {
        const { _id, ...log } = d;
        return log as DocumentAuditLog;
      });
    } else {
      return memoryDb.documentAuditLogs
        .filter((l) => l.userId === userId)
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    }
  },

  async createHRDetails(details: HRDetails): Promise<void> {
    const mongo = await getMongoDb();
    if (mongo) {
      await mongo.collection("hr_details").insertOne({ ...details });
    } else {
      memoryDb.hrDetails.push(details);
    }
  },

  async getHRDetails(userId: string): Promise<HRDetails | null> {
    const mongo = await getMongoDb();
    if (mongo) {
      const doc = await mongo.collection("hr_details").findOne({ user_id: userId });
      if (!doc) return null;
      const { _id, ...details } = doc as any;
      return details as HRDetails;
    } else {
      return memoryDb.hrDetails.find((d) => d.user_id === userId) || null;
    }
  },

  // OTP TOKENS
  async saveOtpToken(email: string, code: string, purpose: OtpToken["purpose"], expiresAt: Date): Promise<void> {
    const lowercaseEmail = email.toLowerCase().trim();
    const tokenDoc: OtpToken = {
      id: crypto.randomUUID(),
      email: lowercaseEmail,
      otp_code: code,
      purpose,
      expires_at: expiresAt.toISOString(),
      attempts: 0,
      created_at: new Date().toISOString(),
    };

    const mongo = await getMongoDb();
    if (mongo) {
      // Clear previous tokens for same email + purpose
      await mongo.collection("otp_tokens").deleteMany({ email: lowercaseEmail, purpose });
      await mongo.collection("otp_tokens").insertOne(tokenDoc);
    } else {
      memoryDb.otpTokens = memoryDb.otpTokens.filter(
        (t) => !(t.email === lowercaseEmail && t.purpose === purpose)
      );
      memoryDb.otpTokens.push(tokenDoc);
    }
  },

  async findOtpToken(email: string, purpose: OtpToken["purpose"]): Promise<OtpToken | null> {
    const lowercaseEmail = email.toLowerCase().trim();
    const mongo = await getMongoDb();
    if (mongo) {
      const doc = await mongo.collection("otp_tokens")
        .find({ email: lowercaseEmail, purpose })
        .sort({ created_at: -1 })
        .limit(1)
        .toArray();
      if (!doc || doc.length === 0) return null;
      const { _id, ...token } = doc[0] as any;
      return token as OtpToken;
    } else {
      const match = memoryDb.otpTokens
        .filter((t) => t.email === lowercaseEmail && t.purpose === purpose)
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      return match[0] || null;
    }
  },

  async incrementOtpAttempts(tokenId: string): Promise<number> {
    const mongo = await getMongoDb();
    if (mongo) {
      await mongo.collection("otp_tokens").updateOne({ id: tokenId }, { $inc: { attempts: 1 } });
      const doc = await mongo.collection("otp_tokens").findOne({ id: tokenId });
      return doc ? (doc.attempts || 0) : 0;
    } else {
      const token = memoryDb.otpTokens.find((t) => t.id === tokenId);
      if (token) {
        token.attempts += 1;
        return token.attempts;
      }
      return 0;
    }
  },

  async deleteOtpToken(tokenId: string): Promise<void> {
    const mongo = await getMongoDb();
    if (mongo) {
      await mongo.collection("otp_tokens").deleteOne({ id: tokenId });
    } else {
      memoryDb.otpTokens = memoryDb.otpTokens.filter((t) => t.id !== tokenId);
    }
  },

  // INVITE TOKENS
  async verifyAndUseInviteToken(token: string, role: "hr" | "tpo"): Promise<boolean> {
    const mongo = await getMongoDb();
    if (mongo) {
      const doc = await mongo.collection("invite_tokens").findOne({ token, role, used: false });
      if (!doc) return false;
      
      const res = await mongo.collection("invite_tokens").updateOne(
        { id: doc.id },
        { $set: { used: true } }
      );
      return res.modifiedCount > 0;
    } else {
      const match = memoryDb.inviteTokens.find(
        (t) => t.token === token && t.role === role && !t.used
      );
      if (match) {
        match.used = true;
        return true;
      }
      return false;
    }
  },

  // ADMIN OPERATIONS
  async getAllUsers(): Promise<User[]> {
    const mongo = await getMongoDb();
    if (mongo) {
      const list = await mongo.collection("users").find({}).toArray();
      return list.map((doc: any) => {
        const { _id, ...user } = doc;
        return user as User;
      });
    } else {
      return memoryDb.users;
    }
  },

  // JOB POSTS
  async createJob(job: Omit<JobPost, "id" | "status" | "created_at">): Promise<JobPost> {
    const newJob: JobPost = {
      ...job,
      id: crypto.randomUUID(),
      status: "active",
      created_at: new Date().toISOString()
    };
    const mongo = await getMongoDb();
    if (mongo) {
      await mongo.collection("job_posts").insertOne(newJob);
    } else {
      memoryDb.jobPosts.push(newJob);
    }
    return newJob;
  },

  async getJobById(id: string): Promise<JobPost | null> {
    const mongo = await getMongoDb();
    if (mongo) {
      const doc = await mongo.collection("job_posts").findOne({ id });
      if (!doc) return null;
      const { _id, ...job } = doc as any;
      return job as JobPost;
    } else {
      return memoryDb.jobPosts.find((j) => j.id === id) || null;
    }
  },

  async getJobsByHr(hrId: string): Promise<JobPost[]> {
    const mongo = await getMongoDb();
    if (mongo) {
      const docs = await mongo.collection("job_posts").find({ hr_id: hrId }).toArray();
      return docs.map((d: any) => {
        const { _id, ...j } = d;
        return j as JobPost;
      });
    } else {
      return memoryDb.jobPosts.filter((j) => j.hr_id === hrId);
    }
  },

  async getAvailableJobs(): Promise<JobPost[]> {
    const mongo = await getMongoDb();
    if (mongo) {
      const docs = await mongo.collection("job_posts").find({ status: "active" }).toArray();
      return docs.map((d: any) => {
        const { _id, ...j } = d;
        return j as JobPost;
      });
    } else {
      return memoryDb.jobPosts.filter((j) => j.status === "active");
    }
  },

  async updateJobStatus(id: string, status: "active" | "closed"): Promise<void> {
    const mongo = await getMongoDb();
    if (mongo) {
      await mongo.collection("job_posts").updateOne({ id }, { $set: { status } });
    } else {
      const j = memoryDb.jobPosts.find((j) => j.id === id);
      if (j) j.status = status;
    }
  },

  // APPLICATIONS
  async createJobApplication(app: Omit<JobApplication, "id" | "status" | "applied_at" | "updated_at">): Promise<JobApplication> {
    const newApp: JobApplication = {
      ...app,
      id: crypto.randomUUID(),
      status: "applied",
      applied_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    const mongo = await getMongoDb();
    if (mongo) {
      try {
        await mongo.collection("job_applications").createIndex({ job_id: 1, student_id: 1 }, { unique: true });
      } catch (err) {}
      await mongo.collection("job_applications").insertOne(newApp);
    } else {
      memoryDb.jobApplications = memoryDb.jobApplications.filter(
        (a) => !(a.job_id === app.job_id && a.student_id === app.student_id)
      );
      memoryDb.jobApplications.push(newApp);
    }
    return newApp;
  },

  async getJobApplication(jobId: string, studentId: string): Promise<JobApplication | null> {
    const mongo = await getMongoDb();
    if (mongo) {
      const doc = await mongo.collection("job_applications").findOne({ job_id: jobId, student_id: studentId });
      if (!doc) return null;
      const { _id, ...app } = doc as any;
      return app as JobApplication;
    } else {
      return memoryDb.jobApplications.find((a) => a.job_id === jobId && a.student_id === studentId) || null;
    }
  },

  async getApplicationById(id: string): Promise<JobApplication | null> {
    const mongo = await getMongoDb();
    if (mongo) {
      const doc = await mongo.collection("job_applications").findOne({ id });
      if (!doc) return null;
      const { _id, ...app } = doc as any;
      return app as JobApplication;
    } else {
      return memoryDb.jobApplications.find((a) => a.id === id) || null;
    }
  },

  async getApplicationsForJob(jobId: string): Promise<JobApplication[]> {
    const mongo = await getMongoDb();
    if (mongo) {
      const docs = await mongo.collection("job_applications").find({ job_id: jobId }).toArray();
      return docs.map((d: any) => {
        const { _id, ...app } = d;
        return app as JobApplication;
      });
    } else {
      return memoryDb.jobApplications.filter((a) => a.job_id === jobId);
    }
  },

  async getApplicationsByStudent(studentId: string): Promise<JobApplication[]> {
    const mongo = await getMongoDb();
    if (mongo) {
      const docs = await mongo.collection("job_applications").find({ student_id: studentId }).toArray();
      return docs.map((d: any) => {
        const { _id, ...app } = d;
        return app as JobApplication;
      });
    } else {
      return memoryDb.jobApplications.filter((a) => a.student_id === studentId);
    }
  },

  async updateApplicationStatus(id: string, status: JobApplication["status"]): Promise<void> {
    const now = new Date().toISOString();
    const mongo = await getMongoDb();
    if (mongo) {
      await mongo.collection("job_applications").updateOne(
        { id },
        { $set: { status, updated_at: now } }
      );
    } else {
      const app = memoryDb.jobApplications.find((a) => a.id === id);
      if (app) {
        app.status = status;
        app.updated_at = now;
      }
    }
  },

  // APPLICATION LOGS
  async createApplicationLog(log: Omit<ApplicationLog, "id" | "created_at">): Promise<ApplicationLog> {
    const newLog: ApplicationLog = {
      ...log,
      id: crypto.randomUUID(),
      created_at: new Date().toISOString()
    };
    const mongo = await getMongoDb();
    if (mongo) {
      await mongo.collection("application_logs").insertOne(newLog);
    } else {
      memoryDb.applicationLogs.push(newLog);
    }
    return newLog;
  },

  async getApplicationLogs(applicationId: string): Promise<ApplicationLog[]> {
    const mongo = await getMongoDb();
    if (mongo) {
      const docs = await mongo.collection("application_logs")
        .find({ application_id: applicationId })
        .sort({ created_at: -1 })
        .toArray();
      return docs.map((d: any) => {
        const { _id, ...log } = d;
        return log as ApplicationLog;
      });
    } else {
      return memoryDb.applicationLogs
        .filter((l) => l.application_id === applicationId)
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }
  },

  // RESUME ANALYSES
  async getResumeAnalysis(studentId: string): Promise<ResumeAnalysis | null> {
    const mongo = await getMongoDb();
    if (mongo) {
      const doc = await mongo.collection("resume_analyses").findOne({ student_id: studentId });
      if (!doc) return null;
      const { _id, ...analysis } = doc as any;
      return analysis as ResumeAnalysis;
    } else {
      return memoryDb.resumeAnalyses.find((a) => a.student_id === studentId) || null;
    }
  },

  async saveResumeAnalysis(analysis: ResumeAnalysis): Promise<void> {
    const mongo = await getMongoDb();
    if (mongo) {
      await mongo.collection("resume_analyses").updateOne(
        { student_id: analysis.student_id },
        { $set: analysis },
        { upsert: true }
      );
    } else {
      const idx = memoryDb.resumeAnalyses.findIndex((a) => a.student_id === analysis.student_id);
      if (idx >= 0) {
        memoryDb.resumeAnalyses[idx] = analysis;
      } else {
        memoryDb.resumeAnalyses.push(analysis);
      }
    }
  },

  async getAllResumeAnalyses(): Promise<ResumeAnalysis[]> {
    const mongo = await getMongoDb();
    if (mongo) {
      const docs = await mongo.collection("resume_analyses").find({}).toArray();
      return docs.map((d: any) => {
        const { _id, ...res } = d;
        return res as ResumeAnalysis;
      });
    } else {
      return memoryDb.resumeAnalyses;
    }
  }
};
