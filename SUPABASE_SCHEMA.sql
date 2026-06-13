-- ============================================
-- CLEANUP EXISTING TABLES (Drop to recreate)
-- ============================================
DROP TABLE IF EXISTS activity_logs CASCADE;
DROP TABLE IF EXISTS invite_tokens CASCADE;
DROP TABLE IF EXISTS otp_tokens CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS offers CASCADE;
DROP TABLE IF EXISTS interviews CASCADE;
DROP TABLE IF EXISTS application_timeline CASCADE;
DROP TABLE IF EXISTS job_applications CASCADE;
DROP TABLE IF EXISTS saved_jobs CASCADE;
DROP TABLE IF EXISTS job_posts CASCADE;
DROP TABLE IF EXISTS hr_details CASCADE;
DROP TABLE IF EXISTS companies CASCADE;
DROP TABLE IF EXISTS student_documents CASCADE;
DROP TABLE IF EXISTS student_education CASCADE;
DROP TABLE IF EXISTS student_details CASCADE;
DROP TABLE IF EXISTS student_projects CASCADE;
DROP TABLE IF EXISTS student_certifications CASCADE;
DROP TABLE IF EXISTS resumes CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- ============================================
-- USERS TABLE (keep existing, add missing cols)
-- ============================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('student','tpo','hr','admin')),
  status VARCHAR(20) DEFAULT 'pending' 
    CHECK (status IN ('pending','active','rejected','inactive')),
  email_verified BOOLEAN DEFAULT false,
  email_verified_at TIMESTAMPTZ,
  college_name VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- STUDENT PROFILE TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS student_details (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  
  -- Personal
  roll_number VARCHAR(100),
  phone VARCHAR(20),
  date_of_birth DATE,
  gender VARCHAR(20),
  address TEXT,
  
  -- Academic
  department VARCHAR(100),
  batch_year INTEGER,
  cgpa DECIMAL(3,2) DEFAULT 0,
  sslc_percentage DECIMAL(5,2) DEFAULT 0,
  hsc_percentage DECIMAL(5,2) DEFAULT 0,
  diploma_percentage DECIMAL(5,2),
  current_arrears INTEGER DEFAULT 0,
  history_of_arrears INTEGER DEFAULT 0,
  
  -- Skills
  technical_skills TEXT[] DEFAULT '{}',
  soft_skills TEXT[] DEFAULT '{}',
  
  -- Status
  profile_completion INTEGER DEFAULT 0,
  ats_score INTEGER DEFAULT 0,
  placement_status VARCHAR(20) DEFAULT 'unplaced'
    CHECK (placement_status IN ('unplaced','placed','opted_out')),
  
  -- Placed info
  placed_company VARCHAR(255),
  placed_role VARCHAR(255),
  placed_package DECIMAL(10,2),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- STUDENT PROJECTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS student_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  technologies TEXT[],
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- STUDENT CERTIFICATIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS student_certifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  issuer VARCHAR(255),
  certificate_url VARCHAR(500),
  uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- RESUMES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS resumes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  filename VARCHAR(255),
  file_url VARCHAR(500),
  file_size INTEGER,
  is_primary BOOLEAN DEFAULT false,
  uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- EDUCATION RECORDS (student)
-- ============================================
CREATE TABLE IF NOT EXISTS student_education (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  institution VARCHAR(255) NOT NULL,
  degree VARCHAR(255),
  field_of_study VARCHAR(255),
  start_year INTEGER,
  end_year INTEGER,
  percentage DECIMAL(5,2),
  cgpa DECIMAL(4,2),
  type VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- DOCUMENTS TABLE (marksheets, aadhaar)
-- ============================================
CREATE TABLE IF NOT EXISTS student_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  document_type VARCHAR(50) 
    CHECK (document_type IN ('sslc','hsc','semester','aadhaar','other')),
  filename VARCHAR(255),
  file_url VARCHAR(500),
  uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- COMPANIES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  logo_url VARCHAR(500),
  website VARCHAR(500),
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- HR DETAILS (optional normalized HR metadata)
-- ============================================
CREATE TABLE IF NOT EXISTS hr_details (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  company_name VARCHAR(255),
  designation VARCHAR(255),
  linkedin_url VARCHAR(500),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- JOBS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS job_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id),
  created_by UUID REFERENCES users(id),
  
  -- Job info
  title VARCHAR(255) NOT NULL,
  role VARCHAR(255),
  package_min DECIMAL(10,2),
  package_max DECIMAL(10,2),
  location VARCHAR(255),
  description TEXT,
  job_type VARCHAR(50) DEFAULT 'full_time'
    CHECK (job_type IN ('full_time','internship','contract')),
  
  -- Eligibility rules
  min_cgpa DECIMAL(3,2) DEFAULT 0,
  allowed_departments TEXT[] DEFAULT '{}',
  allowed_batches INTEGER[],
  max_arrears INTEGER DEFAULT 0,
  arrears_policy VARCHAR(50) DEFAULT 'no_arrears'
    CHECK (arrears_policy IN ('no_arrears','allow_history','allow_current')),
  
  -- Dates
  apply_deadline TIMESTAMPTZ,
  
  -- Status
  status VARCHAR(20) DEFAULT 'pending'
    CHECK (status IN ('pending','approved','active','closed','rejected')),
  tpo_approved_by UUID REFERENCES users(id),
  tpo_approved_at TIMESTAMPTZ,
  tpo_rejection_reason TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- SAVED JOBS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS saved_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES users(id) ON DELETE CASCADE,
  job_id UUID REFERENCES job_posts(id) ON DELETE CASCADE,
  saved_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(student_id, job_id)
);

-- ============================================
-- APPLICATIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS job_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES users(id),
  job_id UUID REFERENCES job_posts(id),
  resume_id UUID REFERENCES resumes(id),
  status VARCHAR(30) DEFAULT 'applied'
    CHECK (status IN (
      'applied','under_review','shortlisted',
      'interview_scheduled','selected','rejected'
    )),
  applied_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(student_id, job_id)
);

-- ============================================
-- APPLICATION TIMELINE (status history)
-- ============================================
CREATE TABLE IF NOT EXISTS application_timeline (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID REFERENCES job_applications(id) ON DELETE CASCADE,
  old_status VARCHAR(30),
  new_status VARCHAR(30),
  changed_by UUID REFERENCES users(id),
  note TEXT,
  changed_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INTERVIEWS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS interviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID REFERENCES job_applications(id),
  student_id UUID REFERENCES users(id),
  job_id UUID REFERENCES job_posts(id),
  scheduled_date DATE,
  scheduled_time TIME,
  mode VARCHAR(20) CHECK (mode IN ('online','offline')),
  link VARCHAR(500),
  venue VARCHAR(255),
  round VARCHAR(100),
  status VARCHAR(20) DEFAULT 'scheduled'
    CHECK (status IN ('scheduled','completed','cancelled')),
  feedback TEXT,
  result VARCHAR(20) CHECK (result IN ('pass','fail','pending')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- OFFERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID REFERENCES job_applications(id),
  student_id UUID REFERENCES users(id),
  job_id UUID REFERENCES job_posts(id),
  company_id UUID REFERENCES companies(id),
  role VARCHAR(255),
  package DECIMAL(10,2),
  offer_letter_url VARCHAR(500),
  status VARCHAR(20) DEFAULT 'pending'
    CHECK (status IN ('pending','accepted','declined')),
  offered_at TIMESTAMPTZ DEFAULT NOW(),
  responded_at TIMESTAMPTZ
);

-- ============================================
-- NOTIFICATIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  message TEXT,
  type VARCHAR(50) CHECK (type IN (
    'job_posted','job_approved','job_rejected',
    'application_update','shortlisted','rejected_application',
    'interview_scheduled','offer_received','system'
  )),
  related_id UUID,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- OTP TOKENS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS otp_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL,
  otp_code VARCHAR(10) NOT NULL,
  purpose VARCHAR(30) CHECK (purpose IN ('signup','login','forgot_password')),
  expires_at TIMESTAMPTZ NOT NULL,
  attempts INTEGER DEFAULT 0,
  locked_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INVITE TOKENS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS invite_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token VARCHAR(255) UNIQUE NOT NULL,
  role VARCHAR(20) CHECK (role IN ('hr','tpo')),
  created_by UUID REFERENCES users(id),
  used BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- ACTIVITY LOGS TABLE (admin)
-- ============================================
CREATE TABLE IF NOT EXISTS activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES users(id),
  actor_role VARCHAR(20),
  action VARCHAR(100),
  description TEXT,
  entity_type VARCHAR(50),
  entity_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role, status);
CREATE INDEX IF NOT EXISTS idx_student_details_user ON student_details(user_id);
CREATE INDEX IF NOT EXISTS idx_job_posts_status ON job_posts(status);
CREATE INDEX IF NOT EXISTS idx_applications_student ON job_applications(student_id);
CREATE INDEX IF NOT EXISTS idx_applications_job ON job_applications(job_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, read);
CREATE INDEX IF NOT EXISTS idx_timeline_application ON application_timeline(application_id);

-- ============================================
-- SEED: Create default admin if not exists
-- ============================================
INSERT INTO users (name, email, password_hash, role, status, email_verified)
SELECT 
  'Super Admin',
  'campusconnectvsb@gmail.com',
  '$2b$10$c/41PNGkiXi.qWJgnWzm..455KtpD67x9cj7rxwPetaFzkZr14Hv6',
  'admin',
  'active',
  true
WHERE NOT EXISTS (
  SELECT 1 FROM users WHERE role = 'admin'
);
