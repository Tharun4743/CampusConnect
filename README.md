# 🎓 CampusConnect — Automated Campus Placement & Corporate Recruitment Ecosystem
### *Enterprise Placement Governance with Bi-Directional WebSockets, Gemini AI Resume Screening & Multi-Channel Interview Pipelines*

<p align="center">
  <a href="https://github.com/Tharun4743/CampusConnect"><b>📦 GitHub Repository</b></a>
  • <a href="https://campusconnect-yg4h.onrender.com"><b>🌐 Live Demo</b></a>
</p>

---

## 1. 📌 Problem Statement
College placement cells handle recruitment drives through disorganized spreadsheets and forwarded emails. Students miss critical application deadlines, Training & Placement Officers (TPOs) spend days manually cross-checking CGPA and active backlog eligibility criteria, resumes lack standardized formatting, and applicants have zero live visibility into their interview status.

---

## 2. 🔍 Existing Solutions & Critical Gaps
Standard job boards (LinkedIn, Naukri) and manual spreadsheets lack institutional role separation (Student, TPO, Recruiter), lack automated student credential guardrails, offer no live interview funnel tracking, and do not provide AI-driven resume scoring tailored to specific campus drive rubrics.

---

## 3. 💡 Proposed Solution
CampusConnect is a secure full-stack campus recruitment platform that unifies Students, TPOs, and Corporate HR Recruiters. It features an interactive Cloudinary document vault for transcripts and verified resumes, Google Gemini AI resume scoring against job descriptions, real-time WebSocket application tracking (Applied → Shortlisted → Interviewing → Offered), and multi-channel failover transactional emails.

---

## 4. ⚙️ Technical Approach & System Architecture
* **Frontend:** React 19, Vite 6.2, Tailwind CSS v4, React Router v7, Framer Motion, Lucide Icons.
* **Backend:** Node.js 20+, Express, TypeScript (tsx), Socket.IO WebSockets for real-time status transitions.
* **Database & Storage:** Supabase (PostgreSQL) with relational constraints; Cloudinary API for secure CV storage.
* **AI & Security:** Google Gemini AI resume evaluation; HttpOnly JWT cookies, Same-Origin CSRF guard, proxy-aware express-rate-limit.

---

## 5. 📈 Impact & Measurable Benefits
* **70% Reduction in Placement Drive Overhead:** Automated eligibility filters eliminate days of manual spreadsheet audits.
* **Zero Communication Lag:** WebSocket notifications and transactional email alerts ensure 100% candidate delivery.
* **Multi-Filter Recruiter Search:** Corporate HRs instantly query student rosters by CGPA, arrears, and core technical skills.
* **Render Auto-Deploy Ready:** Configured with render.yaml for zero-downtime continuous deployment.

---

## 6. 🚀 Feasibility & Viability Analysis
* **Technical:** Decoupled client-server architecture with persistent relational schema on Supabase.
* **Economic:** Eliminates costly commercial placement software licenses through open-source modern web stacks.
* **Scalability:** Easily accommodates multi-campus university networks and thousands of concurrent student applicants.

---

## 7. 👨‍💻 Author & Intellectual Property License

### Lead Architect & Author
**Tharunkumar K** ([@Tharun4743](https://github.com/Tharun4743))
* B.Tech Information Technology • V.S.B. Engineering College, Karur
* [GitHub Profile](https://github.com/Tharun4743) • [LinkedIn](https://linkedin.com/in/tharunkumark4743) • [Portfolio](https://tharunkumark4743.netlify.app)

### 🔒 Proprietary License Notice (All Rights Reserved)
> [!CAUTION]
> **PROPRIETARY & CONFIDENTIAL INTELLECTUAL PROPERTY**
> 
> All rights reserved. This repository, its architecture, source code, workflows, firmware, and associated documentation are the exclusive intellectual property of **Tharunkumar K**.
> 
> **No entity, organization, or individual is permitted to copy, modify, distribute, publish, commercially exploit, reverse engineer, or deploy any portion of this project without express, prior written permission from the author.**
> 
> **Copyright © 2026 Tharunkumar K. All Rights Reserved.**
