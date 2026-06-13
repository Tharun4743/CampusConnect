# CampusConnect 🎓💼
### *Automating and Streamlining Campus Placements & Recruitment Lifecycle*

CampusConnect is a premium, enterprise-grade placement management platform designed to automate training and placement office workflows, facilitate seamless recruiter engagement, and help students transition smoothly into their professional careers. Built as a secure, full-stack monolithic application, it integrates modern web technologies, real-time web sockets, secure file storage, and AI-driven ATS resume scanning to deliver a state-of-the-art campus placement experience.

---

## 🚀 Key Features by User Role

### 1. 👨‍🎓 Students
* **A.I. ATS Optimizer:** Integrated with Google Gemini API to analyze uploaded resumes against job descriptions, yielding a match score, gaps, and recommendations.
* **Interactive Document Vault:** Securely upload, organize, and view academic transcripts, resumes, and certifications backed by Cloudinary.
* **Real-time Application Tracker:** A visual step-by-step timeline detailing the status of every job application (Applied, Shortlisted, Interviewing, Offered, Rejected).
* **Profile Completeness Index:** Guided profile configuration ensuring all academic credentials, skillsets, and projects are fully documented before applying.

### 2. 🏫 Training & Placement Officers (TPO)
* **Student Verification Pipeline:** Review and approve pending student profiles to maintain database integrity.
* **Recruiter Invite Management:** Generate and send secure invitation links to target companies and HR leads.
* **Analytics Dashboard:** Graphical placement metrics tracking placed vs. unplaced student ratios, package averages, and top recruiting sectors.
* **Broadcasting System:** Instantly dispatch notices and reminders to students, departments, or entire cohorts.

### 3. 🏢 HR & Recruiters
* **Job Board Management:** Post new vacancies, define eligibility criteria (minimum CGPA, department restrictions, active backlog counts), and manage active listings.
* **Candidate Shortlisting:** Multi-filter screening allowing HRs to filter profiles by CGPA, arrears history, and core skills.
* **Interview Scheduler:** Integrated scheduler to organize online/offline interviews with automatic notification dispatches.
* **Offer Manager:** Directly publish and record student selection results and package packages.

### 4. 🔑 Platform Administrators
* **User Moderation:** System-wide access control to manage and review HR, TPO, and student accounts.
* **Audit Logs:** Activity logs capturing administrative changes, system logs, and security events.
* **Database Management:** Direct access to seed configurations and predefined system profiles.

---

## 🛠️ Technology Stack

| Layer | Technologies Used |
| :--- | :--- |
| **Frontend** | React 19, Vite, Tailwind CSS v4, React Router v7, React Query, Lucide Icons, Framer Motion |
| **Backend** | Node.js, Express, TypeScript (`tsx`), Socket.IO, Nodemailer, Axios |
| **Database** | PostgreSQL hosted on Supabase (using relational schemas) |
| **Storage** | Cloudinary API (for resumes, certifications, and media files) |
| **AI Engine** | Google Gemini API (for ATS resume matching and job criteria scoring) |
| **Security** | JWT Cookies (httpOnly), CSRF Same-Origin Guard, Helmet, Express Rate Limit |

---

## 📐 System Architecture

The project leverages a monolithic model featuring a decoupled React Single Page Application (SPA) frontend and a RESTful Express.js API backend, sharing real-time event updates via WebSockets:

```mermaid
graph TD
    Client[React SPA Client - Vite] -->|HTTPS REST API| Server[Express.js Backend - Node]
    Client -->|Bi-directional WebSockets| SocketServer[Socket.IO Server]
    Server -->|PostgreSQL Queries| DB[(Supabase DB)]
    Server -->|Resume Analysis| Gemini[Google Gemini AI]
    Server -->|Secure Storage CDN| Cloudinary[Cloudinary Cloud]
    Server -->|Transactional Emails| EmailAPI[SendGrid / Resend Web APIs]
```

---

## 🔒 Security & Performance Features

* **Cross-Origin Popups Compatibility:** Custom Helmet configurations to disable `Cross-Origin-Opener-Policy` headers selectively, enabling secure Google Identity Services SSO.
* **CSRF & Same-Origin Guard:** Request validation validating that all modifying endpoints (POST, PUT, DELETE) originate from verified application domains.
* **Proxy-Aware Rate Limiting:** Express Rate Limiting configured with `app.set("trust proxy", 1)` to prevent load balancer IP collision and block API abuse.
* **Graceful Shutdown:** Application intercepts `SIGTERM` and `SIGINT` signals, closing database pools and active HTTP sockets cleanly to ensure zero-downtime production deployments.

---

## ⚙️ Environment Variables Setup

Create a `.env` file in the root directory based on this configuration:

```env
# Google Gemini API Configurations (ATS Resume Scoring)
GEMINI_ATS_API_KEY="your-gemini-api-key"
GEMINI_ATS_MODEL="gemini-3.5-flash"

# Supabase / PostgreSQL Database Connection (REQUIRED)
SUPABASE_URL="https://your-project-ref.supabase.co"
SUPABASE_SERVICE_ROLE_KEY="your-supabase-service-role-key"
SUPABASE_ANON_KEY="your-supabase-anon-key"

# JWT Authentication Configs
JWT_SECRET="your-jwt-signing-secret"

# Web Service URLs (Used for CORS and CSRF guards)
APP_URL="http://localhost:5173"
CLIENT_URL="http://localhost:5173"
VITE_API_URL="http://localhost:3000"

# Nodemailer / SMTP Configurations (Fallback local email routing)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-gmail-app-password"
SMTP_FROM="your-email@gmail.com"

# Transactional Email APIs (Highly Recommended for Deployed Platforms like Render)
# Set either of the keys below to override SMTP and bypass blocked ports.
SENDGRID_API_KEY="your-sendgrid-api-key"
RESEND_API_KEY="your-resend-api-key"

# Google Single Sign-On (OAuth 2.0)
GOOGLE_CLIENT_ID="your-google-client-id.apps.googleusercontent.com"
VITE_GOOGLE_CLIENT_ID="your-google-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# Cloudinary Configuration (Secure Resume Storage)
CLOUDINARY_URL="cloudinary://API_KEY:API_SECRET@CLOUD_NAME"
CLOUDINARY_CLOUD_NAME="your-cloud-name"
CLOUDINARY_API_KEY="your-api-key"
CLOUDINARY_API_SECRET="your-api-secret"
```

---

## 💻 Local Installation & Setup

### Prerequisites
* Node.js (version 18 or higher recommended)
* A Supabase/PostgreSQL instance

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/Tharun4743/CampusConnect.git
cd CampusConnect
npm install
```

### 2. Database Setup
1. Log into your Supabase console.
2. Open the SQL Editor and execute the contents of the [SUPABASE_SCHEMA.sql](file:///c:/Users/tharu/Downloads/campus-connect/SUPABASE_SCHEMA.sql) file. This will initialize the tables, constraints, and seed the default administrator account.

### 3. Run the Development Server
```bash
npm run dev
```
* **Frontend Port:** `http://localhost:5173`
* **Backend Port:** `http://localhost:3000`

### 4. Build for Production
To bundle the frontend assets and compile the TypeScript backend:
```bash
npm run build
npm run start
```

---

## ☁️ Production Deployment on Render

This project is fully configured for deployment on **Render** (via `render.yaml`):

1. **Connect your Repository:** Create a new **Web Service** on Render pointing to your fork of the repository.
2. **Configure Build Settings:**
   * **Runtime:** `Node`
   * **Build Command:** `npm install && npm run build`
   * **Start Command:** `npm start`
3. **Set Environment Variables:** Add your database, Cloudinary, Gemini, and Google OAuth credentials to the **Environment** settings. 
4. **Google SSO Configuration:** Ensure your Render domain (e.g. `https://campusconnect-yg4h.onrender.com`) is added under the **Authorized JavaScript origins** section in the Google Cloud Console for the client ID.
