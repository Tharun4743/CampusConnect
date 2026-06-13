export interface Notification {
  id: string;
  user_id: string;
  type: "job_update" | "interview" | "offer" | "application_status" | "profile_review";
  title: string;
  message: string;
  related_job_id?: string;
  related_application_id?: string;
  is_read: boolean;
  created_at: string;
  updated_at: string;
}

export interface Offer {
  id: string;
  student_id: string;
  job_id: string;
  hr_id: string;
  company_name: string;
  job_title: string;
  salary_package: string;
  offer_letter_url?: string;
  status: "pending" | "accepted" | "rejected" | "expired";
  created_at: string;
  updated_at: string;
  expires_at: string;
  acceptance_date?: string;
}

export interface InterviewSlot {
  id: string;
  student_id: string;
  job_id: string;
  hr_id: string;
  company_name: string;
  job_title: string;
  interview_type: string;
  scheduled_at: string;
  duration_minutes: number;
  interview_mode: string;
  location?: string;
  interview_link?: string;
  status: string;
  result: string;
  feedback?: string;
  created_at: string;
}

export interface SavedJob {
  id: string;
  student_id: string;
  job_id: string;
  company_name: string;
  job_title: string;
  saved_at: string;
}

export interface PlacementRecord {
  id: string;
  student_id: string;
  company_name: string;
  job_title: string;
  salary_package: string;
  job_id: string;
  offer_id: string;
  status: string;
  placed_on: string;
  joining_date?: string;
}

export interface PlacementStatus {
  placementStatus: string;
  placedInCompany: string | null;
  offeredSalary: number | null;
  placedAt: string | null;
  placementRecord: PlacementRecord | null;
}

export interface Job {
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
  status: string;
  created_at: string;
  updated_at: string;
}
