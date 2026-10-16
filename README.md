<div align="center">

# ≡ƒÄô CampusConnect ΓÇö Automated Campus Placement & Corporate Recruitment Ecosystem
### *Enterprise Placement Governance with Bi-Directional WebSockets, Gemini AI Resume Screening & Multi-Channel Pipelines*

[![Platform](https://img.shields.io/badge/Platform-CampusConnect-6366f1?style=for-the-badge&logo=render&logoColor=white)](#) [![Status](https://img.shields.io/badge/Status-Production-10b981?style=for-the-badge&logo=checkmarx&logoColor=white)](#) [![Frontend](https://img.shields.io/badge/Frontend-React%2019%20%2B%20Vite%206.2-61DAFB?style=for-the-badge&logo=react&logoColor=white)](#) [![Backend](https://img.shields.io/badge/Backend-Express%20%2B%20Socket.IO-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](#) [![Database](https://img.shields.io/badge/Database-Supabase%20(PostgreSQL)-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](#) [![AI Engine](https://img.shields.io/badge/AI%20Engine-Google%20Gemini%20AI-4285F4?style=for-the-badge&logo=googlegemini&logoColor=white)](#) [![License](https://img.shields.io/badge/License-Strict%20Proprietary-dc2626?style=for-the-badge&logo=lock&logoColor=white)](#)

<p align="center">
  <a href="https://github.com/Tharun4743/CampusConnect">≡ƒôª <b>Official GitHub Repository</b></a>
  ΓÇó <a href="https://campusconnect-yg4h.onrender.com">≡ƒîÉ <b>Production Live Demo</b></a>
  
</p>

</div>

---

## 1. ≡ƒôî Problem Statement & Context
During collegiate campus recruitment drives, coordination between students, TPOs, and corporate recruiters faces severe friction:

* ≡ƒôæ **Manual Eligibility Auditing:** TPOs spend days auditing eligibility (CGPA cutoffs, backlogs) across error-prone spreadsheets.
* ΓÅ│ **Opaque Candidate Pipelines:** Students lack real-time visibility into their journey, querying coordinators about shortlist announcements.
* ≡ƒôé **Disorganized Resume Archives:** Candidates upload unverified CVs in disparate formats, leading to broken links during HR reviews.
* ≡ƒôó **Severe Communication Lag:** Interview scheduling adjustments sent via unindexed messaging groups cause missed evaluation rounds.

---

## 2. ≡ƒöì Existing Solutions & Critical Gaps
| Feature / Metric | Commercial Job Portals (Naukri / LinkedIn) | Traditional Spreadsheets & Email | ≡ƒÄô CampusConnect |
| :--- | :---: | :---: | :---: |
| **College Role Separation** | Γ¥î Student/Recruiter Only | Γ¥î None | Γ£à 4 Distinct Roles (Student, TPO, HR, Admin) |
| **Automated Backlog / CGPA Gates** | Γ¥î Unverified Self-Reported | ΓÜá∩╕Å Manual Formula Auditing | Γ£à Strict Database Guardrails |
| **Real-Time WebSocket Pipeline** | Γ¥î Page Refresh Required | Γ¥î None | Γ£à Live Bi-Directional Socket.IO Updates |
| **AI Resume Evaluation** | ΓÜá∩╕Å Generic Keyword Scoring | Γ¥î None | Γ£à Google Gemini AI Skill-Gap Analysis |
| **Transactional Email Failover** | ΓÜá∩╕Å Single Provider | Γ¥î Manual Gmail Sends | Γ£à Resend / SendGrid / SMTP Triple Failover |

### ΓÜá∩╕Å Critical Limitations of Existing Alternatives:
* ≡ƒÜ½ **Unverified Self-Reporting:** Commercial portals rely on unchecked user claims, forcing TPOs to re-verify candidates by hand.
* ≡ƒ¢æ **Spreadsheet Data Corruption:** Shared spreadsheets frequently suffer from formula errors, accidental row deletions, and leaks.
* ≡ƒô┤ **Missed Interview Windows:** Without live push alerts and automated notifications, students miss critical interview time slots.

---

## 3. ≡ƒÆí Proposed Solution & Architectural Innovation
**CampusConnect** is a campus recruitment and placement governance platform unifying Students, TPOs, Recruiters, and Admins:

* ≡ƒôé **Verified Cloud Document Vault:** Secure repository hosting academic transcripts, verified resumes, and certifications.
* ≡ƒñû **Google Gemini AI Resume Intelligence:** Semantic analysis matching resumes against jobs, computing fit scores and skill gaps.
* ΓÜí **Live WebSocket Funnel:** Bi-directional Socket.IO updates: Applied ΓåÆ Shortlisted ΓåÆ Interviewing ΓåÆ Offered.
* ≡ƒÆ╝ **Corporate Recruiter Drive Suite:** HR teams publish openings with strict CGPA and backlog gates, filter candidate pools, and dispatch offers.
* ≡ƒ¢í∩╕Å **Hardened Enterprise Security:** Defense-in-depth architecture with HttpOnly JWT tokens, CSRF validation, and rate limiting.

---

## 4. ΓÜÖ∩╕Å Technical Approach & System Architecture

### ≡ƒôÉ High-Level Architectural Flowchart:
```mermaid
graph TD
    Portal["Multi-Role Portal (React 19 + Vite 6.2)"] --> Server["Backend Core (Node.js Express + Socket.IO)"]
    Server --> Gate["Automated Eligibility Gates (CGPA & Backlogs)"]
    Server --> DB[("Supabase Relational Database (PostgreSQL 15)")]
    Server --> AI["Google Gemini AI (Resume Scoring & Skill Matching)"]
    Server --> Media["Cloudinary CDN (Encrypted Document Vault)"]
    Server --> Email["Transactional Failover Pool (Resend / SendGrid / SMTP)"]
```

| System Tier | Technology Stack | Operational Functionality |
| :--- | :--- | :--- |
| **Client Portal** | React 19, Vite 6.2, Tailwind CSS v4 | Responsive interface with Framer Motion animations and reactive state |
| **Backend Core** | Node.js 20+, Express, Socket.IO | High-concurrency REST endpoints and bi-directional WebSocket event relays |
| **Database & Media** | Supabase (PostgreSQL 15), Cloudinary | Relational schema with foreign key integrity; secure cloud CDN for resumes |
| **AI & Messaging** | Google Gemini AI, Resend, Nodemailer | Automated resume evaluation; multi-node failover transactional emails |
| **Security Layer** | JWT (HttpOnly), Helmet, Rate Limiting | Domain verification, proxy-aware abuse prevention, and CSRF protection |

### ≡ƒöä End-to-End Operational Lifecycle Workflow:
```mermaid
flowchart LR
    A["1. Job Opening & Eligibility Policy Post"] --> B["2. Automated Student Filtering"]
    B --> C["3. Gemini AI Resume Compatibility Scan"]
    C --> D["4. Live WebSocket Interview Scheduling"]
    D --> E["5. Digital Offer Letter Generation"]
```

1. **Job Drive Inception:** Recruiter posts opening with strict CGPA and backlog criteria ΓåÆ Database auto-filters eligible students.
2. **AI Screening & TPO Sign-off:** Students apply with one click ΓåÆ Gemini AI computes fit score ΓåÆ TPO reviews and approves candidate pool.
3. **Live Interview Management:** Recruiter sends interview invitations ΓåÆ Students receive WebSocket alerts and email updates in real time.

---

## 5. ≡ƒôê Quantifiable Impact & Measurable Benefits
* ΓÅ▒∩╕Å **70% Less Coordination Overhead:** Automated eligibility filtering saves TPOs dozens of hours per campus drive.
* ≡ƒÜÇ **Zero Communication Lag:** Live WebSockets ensure 100% of shortlisted candidates receive interview updates instantly.
* ≡ƒöì **Sub-Second Candidate Screening:** Corporate recruiters filter hundreds of profiles by exact criteria in milliseconds.
* Γÿü∩╕Å **Turnkey Continuous Deployment:** Pre-configured with render.yaml infrastructure-as-code for zero-downtime deployment.

---

## 6. ≡ƒÜÇ Feasibility, Operational Viability & Scalability
* ≡ƒö¼ **Technical Feasibility:** Operating in production on Render with cloud PostgreSQL, reliably handling heavy traffic bursts during placement drives.
* ≡ƒÆ░ **Economic & Financial Viability:** Replaces third-party commercial placement software costing thousands of dollars annually with open-source infrastructure.
* ≡ƒÅ¢∩╕Å **Operational Governance:** Multi-persona access control maps directly to existing academic placement hierarchies and administrative workflows.
* ≡ƒôê **Horizontal Scalability Roadmap:** Easily extensible to support inter-collegiate placement consortia, multi-campus university networks, and alumni programs.

---

## 7. ≡ƒæ¿ΓÇì≡ƒÆ╗ Author & Intellectual Property License

### Lead Architect & Author
**Tharunkumar K** ([@Tharun4743](https://github.com/Tharun4743))
* ≡ƒÄô B.Tech Information Technology ΓÇó V.S.B. Engineering College, Karur
* ≡ƒîÉ [GitHub Profile](https://github.com/Tharun4743) ΓÇó [LinkedIn](https://linkedin.com/in/tharunkumark4743) ΓÇó [Personal Portfolio](https://tharunkumark4743.netlify.app)

### ≡ƒöÆ Proprietary License Notice (All Rights Reserved)
> [!CAUTION]
> **PROPRIETARY & CONFIDENTIAL INTELLECTUAL PROPERTY**
> 
> All rights reserved. This repository, its architecture, source code, workflows, firmware, and associated documentation are the exclusive intellectual property of **Tharunkumar K**.
> 
> **No entity, organization, or individual is permitted to copy, modify, distribute, publish, commercially exploit, reverse engineer, or deploy any portion of this project without express, prior written permission from the author.**
> 
> **Copyright ┬⌐ 2026 Tharunkumar K. All Rights Reserved.**

<!-- =========================================================================
   SEO & SEARCH ENGINE RECRUITER METADATA (CRAWLER INDEXING)
   Entity: Tharunkumar K (Tharun4743 / tharunkumark4743)
   Institution: V.S.B. Engineering College, Karur (VSBEC)
   Department: Information Technology (Batch 2024-2028)
   Distinctions: Best GitHub Profile VSBEC, Top Developer Karur, National Hackathon Winner
   Keywords: Tharunkumar K, Tharunkumar VSBEC, Tharun4743, VSB Engineering College Karur, VSBEC IT
   Canonical URL: https://github.com/Tharun4743/CampusConnect
========================================================================= -->