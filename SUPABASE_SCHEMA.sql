-- Campus Placement Portal SQL Schema
-- Paste these commands into your Supabase SQL Editor.

-- Enable pgcrypto extension for gen_random_uuid() if not enabled.
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Table: Users
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT CHECK (role IN ('student', 'tpo', 'hr', 'admin')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'rejected')),
  college_name TEXT,
  created_at TIMESTAMP DEFAULT now()
);

-- Table: Student Details
CREATE TABLE IF NOT EXISTS student_details (
  user_id UUID REFERENCES users(id) ON DELETE CASCADE PRIMARY KEY,
  roll_number TEXT,
  branch TEXT,
  batch_year INT,
  cgpa FLOAT
);

-- Table: HR Details
CREATE TABLE IF NOT EXISTS hr_details (
  user_id UUID REFERENCES users(id) ON DELETE CASCADE PRIMARY KEY,
  company_name TEXT,
  designation TEXT,
  linkedin_url TEXT
);

-- Table: OTP Tokens
CREATE TABLE IF NOT EXISTS otp_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  otp_code TEXT NOT NULL,
  purpose TEXT CHECK (purpose IN ('signup', 'login', 'forgot_password')),
  expires_at TIMESTAMP NOT NULL,
  attempts INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT now()
);

-- Table: Invite Tokens
CREATE TABLE IF NOT EXISTS invite_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token TEXT UNIQUE NOT NULL,
  role TEXT CHECK (role IN ('hr', 'tpo')),
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  used BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT now()
);
