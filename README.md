# 🎓 CampusConnect
### *Automating & Streamlining Campus Placements & Recruitments*

<p align="center">
  <img src="assets/logo.jpeg" alt="CampusConnect Logo" width="220" style="border-radius: 16px; box-shadow: 0 10px 25px rgba(0,0,0,0.15); margin-bottom: 20px;" />
</p>

<p align="center">
  <a href="https://campusconnect-yg4h.onrender.com" target="_blank">
    <img src="https://img.shields.io/badge/🚀_Live_Demo-CampusConnect-6366f1?style=for-the-badge&logo=render&logoColor=white" alt="Live Demo" />
  </a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-19.0-61DAFB?style=flat-square&logo=react&logoColor=black" alt="React 19" />
  <img src="https://img.shields.io/badge/Vite-6.2-646CFF?style=flat-square&logo=vite&logoColor=white" alt="Vite 6" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-v4.0-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white" alt="Tailwind 4" />
  <img src="https://img.shields.io/badge/TypeScript-5.8-3178C6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Node.js-20+-339933?style=flat-square&logo=nodedotjs&logoColor=white" alt="Node" />
  <img src="https://img.shields.io/badge/Supabase-Database-3ECF8E?style=flat-square&logo=supabase&logoColor=white" alt="Supabase" />
</p>

---

## 🌟 Overview
**CampusConnect** is a premium, enterprise-grade placement management platform designed to automate training and placement office (TPO) workflows, facilitate seamless recruiter engagement, and help students transition smoothly into their professional careers. 

Built as a secure, full-stack application, it integrates modern web technologies, real-time web sockets, and secure file storage to deliver a state-of-the-art campus placement experience.

---

## 🚀 Key Features by User Role

### 👨‍🎓 Students
* **📂 Interactive Document Vault:** Upload, organize, and view academic transcripts, resumes, and certificates securely (backed by Cloudinary).
* **📈 Real-Time Application Tracker:** Step-by-step visual timeline tracking application progress (`Applied`, `Shortlisted`, `Interviewing`, `Offered`, `Rejected`).
* **🎯 Profile Completeness Index:** Guided onboarding ensuring all academic credentials, skills, and projects are documented before application submission.

### 🏫 Training & Placement Officers (TPO)
* **✅ Profile Verification Pipeline:** Review and approve pending student profiles to maintain placement database integrity.
* **📩 Invite Management:** Securely generate and send platform invitation links to partner companies and HR leads.
* **📊 Analytics & Reports:** Graphical metrics tracking placement ratios, package averages, and top recruiting sectors.
* **📢 Broadcasts & Notices:** Instantly dispatch email and in-app notices to students, specific departments, or entire cohorts.

### 🏢 HR & Recruiters
* **💼 Job Drive Creator:** Post vacancies, set eligibility criteria (minimum CGPA, department restrictions, active backlogs limit), and manage active drives.
* **🔍 Multi-Filter Screening:** Advanced filters allowing HRs to query student databases by CGPA, arrears history, and core skills.
* **📅 Interview Scheduler:** Seamless scheduler for organizing online/offline interviews with automatic candidate notification dispatches.
* **🏆 Selection & Offer Manager:** Directly publish results and package packages onto student dashboards.

### 🔑 Platform Administrators
* **🛡️ Moderation Desk:** System-wide access control to manage HR, TPO, and student accounts.
* **📑 Detailed Audit Logs:** Activity logs capturing administrative changes, system logs, and security events.
* **💾 Database Seeding:** Direct utilities to seed configurations and predefined system profiles.

---

## 🛠️ Technology Stack

| Layer | Technologies Used | Description |
| :--- | :--- | :--- |
| **Frontend** | React 19, Vite, Tailwind CSS v4, React Router v7, React Query, Framer Motion, Lucide Icons | Single Page Application (SPA) with smooth animations and reactive query fetching. |
| **Backend** | Node.js, Express, TypeScript (`tsx`), Socket.IO, Nodemailer, Axios | Robust REST API server with real-time websocket connections and email routing. |
| **Database** | PostgreSQL hosted on Supabase | Relational database utilizing structured schemas, foreign keys, and indexes. |
| **Cloud Storage** | Cloudinary API | Secure cloud hosting for resumes, transcripts, and organizational assets. |
| **Security** | JWT (HttpOnly Cookies), CSRF Same-Origin Guard, Helmet, Express Rate Limit | Hardened defense-in-depth security matching modern production requirements. |

---

## 📐 System Architecture

The client-server architecture utilizes a decoupled React SPA frontend and a RESTful Express.js API backend, sharing real-time event updates via WebSockets:

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

## 🔒 Security & Performance Engineering

* **Cross-Origin Popups Optimization:** Configured custom Helmet policies to selectively bypass `Cross-Origin-Opener-Policy` headers, enabling secure Google Identity Services SSO.
* **Same-Origin CSRF Guard:** Enforces strict domain validation checking that state-modifying requests (POST, PUT, DELETE) originate from verified application domains.
* **Proxy-Aware Rate Limiting:** Configured Express Rate Limiting with `app.set("trust proxy", 1)` to prevent load balancer IP collision and ensure reliable API abuse prevention.
* **Graceful Shutdown Protocols:** Intercepts system signals (`SIGTERM` & `SIGINT`), closing database pools and active HTTP connections cleanly to ensure zero-downtime deployments.

---

## ⚙️ Environment Variables

Create a `.env` file in the root directory based on the following configurations (refer to [.env.example](file:///c:/Users/tharu/Downloads/CampusConnect/.env.example)):

```env
# ==========================================
# Supabase / PostgreSQL Database (REQUIRED)
# ==========================================
SUPABASE_URL="https://your-project-ref.supabase.co"
SUPABASE_SERVICE_ROLE_KEY="your-supabase-service-role-key"
SUPABASE_ANON_KEY="your-supabase-anon-key"

# ==========================================
# JWT Authentication Configurations
# ==========================================
JWT_SECRET="your-jwt-signing-secret"

# ==========================================
# Web Service URLs (Used for CORS & CSRF guards)
# ==========================================
APP_URL="http://localhost:5173"
CLIENT_URL="http://localhost:5173"
VITE_API_URL="http://localhost:3000"

# ==========================================
# Nodemailer / SMTP Configurations
# ==========================================
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-gmail-app-password"
SMTP_FROM="your-email@gmail.com"

# ==========================================
# High-Priority Email Web APIs
# ==========================================
# Set either of the keys below to override SMTP and bypass blocked ports.
SENDGRID_API_KEY="your-sendgrid-api-key"
RESEND_API_KEY="your-resend-api-key"

# ==========================================
# Google Single Sign-On (OAuth 2.0)
# ==========================================
GOOGLE_CLIENT_ID="your-google-client-id.apps.googleusercontent.com"
VITE_GOOGLE_CLIENT_ID="your-google-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# ==========================================
# Cloudinary Configuration (Secure CV Uploads)
# ==========================================
CLOUDINARY_URL="cloudinary://API_KEY:API_SECRET@CLOUD_NAME"
CLOUDINARY_CLOUD_NAME="your-cloud-name"
CLOUDINARY_API_KEY="your-api-key"
CLOUDINARY_API_SECRET="your-api-secret"
```

---

## 💻 Local Installation & Setup

### Prerequisites
* **Node.js** (v18.0.0 or higher)
* An active **Supabase/PostgreSQL** project

### 1. Install Dependencies
```bash
npm install
```

### 2. Database Initialization
1. Navigate to your **Supabase Dashboard**.
2. Open the **SQL Editor** and run the contents of [SUPABASE_SCHEMA.sql](file:///c:/Users/tharu/Downloads/CampusConnect/SUPABASE_SCHEMA.sql).
3. This creates all relational tables, schema triggers, and seeds the default administrator.

### 3. Spin Up Development Servers
```bash
npm run dev
```
* Frontend client: `http://localhost:5173`
* Backend API: `http://localhost:3000`

### 4. Build for Production
To bundle the frontend application assets and compile backend TS source files:
```bash
npm run build
npm run start
```

---

## ☁️ Production Deployment on Render

This project is optimized and ready for zero-config deployments on **Render** using the [render.yaml](file:///c:/Users/tharu/Downloads/CampusConnect/render.yaml) configuration file:

1. **Connect Repo**: Create a new **Web Service** on Render pointing to your GitHub fork of the project.
2. **Build Settings**:
   * **Runtime**: `Node`
   * **Build Command**: `npm install && npm run build`
   * **Start Command**: `npm start`
3. **Configure Envs**: Input credentials (Supabase, Cloudinary, Google Client ID, etc.) in the Render Environment panel.
4. **SSO Whitelisting**: Ensure your Render live domain (e.g. `https://campusconnect-yg4h.onrender.com`) is whitelisted under **Authorized JavaScript origins** in your Google Cloud Developer Console.
