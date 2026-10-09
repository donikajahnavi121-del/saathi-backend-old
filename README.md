# Saathi — Tuberculosis Treatment Adherence & Dropout Prevention Backend

Saathi is a mission-critical healthcare backend engineered for patient treatment adherence, counsellor intervention prioritization, and clinical supervisor oversight in national tuberculosis elimination programs.

Built with **Node.js 20**, **Express 4**, **TypeScript**, **PostgreSQL (Prisma ORM)**, and **Redis (ioredis)**, the platform strictly enforces zero-stigma healthcare data-privacy guardrails, explainable decision-support risk modeling, and resilient offline-first check-ins.

---

## 1. Quick Start & Execution

### Prerequisites
- Node.js 20 LTS
- Docker & Docker Compose (or local PostgreSQL 16 & Redis 7)

### Step 1: Environment Configuration
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

### Step 2: Start Infrastructure (PostgreSQL & Redis)
```bash
docker compose up -d postgres redis
```

### Step 3: Database Migration & Seeding
```bash
npx prisma db push
npm run seed
```
> The seed script populates 200 synthetic patients, 8 counsellors, 1 supervisor, 90 days of check-in records (~82% adherence), follow-up logs, and UI demo accounts matching the React prototype (`P-0142 Anita`, `P-0089 Ramesh`, `P-0204 Vikram`, `P-0118 Sunita`, `P-0177 Imran`, `P-0056 Pooja`).

### Step 4: Run the Backend API
```bash
npm run dev
```
The server will start on `http://localhost:5000`.
- **OpenAPI / Swagger Documentation**: [http://localhost:5000/docs](http://localhost:5000/docs)
- **Health Check**: [http://localhost:5000/health](http://localhost:5000/health)

### Step 5: Run Automated Tests
```bash
npm test
```

---

## 2. Hard Healthcare Data-Privacy Rules

| Rule | Implementation & Guarantee |
| :--- | :--- |
| **Zero Diagnosis Leakage** | The words "TB", "tuberculosis", or any clinical diagnosis/drug names never appear in patient-facing responses, SMS reminders, or IVR scripts. The middleware `enforcePatientPrivacy` intercepts and deep-sanitizes patient payloads, transforming references to neutral terms like *"your medicine"* and *"Saathi"*. |
| **Non-Judgmental Language** | Guilt-inducing terms (*"streak broken"*, *"failed"*, *"non-compliant"*, *"defaulter"*) are strictly barred. The platform always uses supportive framing (*"missed yesterday"*, *"needs a check-in"*). |
| **Patient-Reported Status** | Daily photos or SMS/IVR responses are categorized as `patient-reported check-in`, never as *"proof of swallowing"* or *"verified"*. |
| **Phone Number Masking** | Cohort lists, queue tables, and dashboards mask numbers as `+91 98••• ••210`. The full phone number is only decrypted on the dedicated call initiation endpoint (`POST /patients/:id/call`). |
| **Full Phone Access Audit Logging** | Every access to a patient's unmasked phone number or call initiation is immutably logged to the `AuditLog` table with user ID, IP address, user agent, and timestamp. |
| **Field-Level Encryption at Rest** | Phone numbers and clinical notes are encrypted using **AES-256-GCM** with unique IVs and authenticated tags before database persistence. |
| **Zero PII Logging** | Pino logging configuration automatically redacts tokens, API keys, passwords, PINs, phone numbers, and notes. |
| **30-Day Photo Retention** | Blister strip photos have EXIF metadata stripped on upload, compressed to under 300 KB with Sharp, and are automatically purged after 30 days via a background cleanup job. |

---

## 3. Two-Layer Authentication Model

```
Request ────────► Layer 1: API Key Check (Header: x-api-key)
                       │  - Validates client / service scope
                       │  - Hashed (SHA-256) in DB, cached in Redis
                       ▼
                  Layer 2: JWT User Auth (Header: Authorization: Bearer <token>)
                       │  - Roles: patient | counsellor | supervisor
                       │  - 15-min Access Token + 7-day Rotating Refresh Token
                       ▼
                  RBAC & Patient Isolation
                          - Counsellors can only view assigned patients
                          - Supervisors can view full district cohort
```

### Layer 1: API Key Scopes
- `frontend`: Permitted for mobile web patient check-in and counsellor web portals.
- `ivr_webhook`: Restricted to IVR telephony and SMS callback webhooks.
- `admin_tool`: Restricted to supervisor and system CLI administration tools.

CLI Script to manage API keys:
```bash
npx tsx scripts/manage-api-keys.ts list
npx tsx scripts/manage-api-keys.ts create "New Portal" frontend
npx tsx scripts/manage-api-keys.ts rotate <keyId>
npx tsx scripts/manage-api-keys.ts revoke <keyId>
```
*(Raw keys are printed only once upon creation).*

### Layer 2: User Roles & PIN Lockout
- **Patient**: Phone + OTP on first session (`123456` in development), then 4-digit PIN for future sessions.
- **PIN Lockout Defense**: 5 consecutive incorrect PIN attempts locks the patient session for 15 minutes (Redis-enforced counter returning HTTP 423).
- **Counsellor / Supervisor**: Email + Password with refresh token reuse detection.

---

## 4. Explainable Risk Scoring & Urgency Priority Formula

The Saathi Risk Engine provides transparent, explainable decision support without black-box ML jargon.

### Mathematical Specification

#### 1. Base Risk Score (`riskScore` $\in [0, 100]$)
$$\text{riskScore} = \text{clamp}\left(\sum_{i=1}^{n} w_i \cdot f_i, 0, 100\right)$$

Where contributing features $f_i$ include:
1. **Missed Doses (Last 3 Days)**: $15 \text{ pts} \times \text{misses}$
2. **Missed Doses (Last 7 Days)**: $10 \text{ pts} \times \text{additional misses}$
3. **Consecutive Missed Days**: $14 \text{ pts} \times \text{consecutive days}$ (if $\ge 2$)
4. **Reported Side Effects (Past 14 Days)**: $28 \text{ pts}$ (severe) or $16 \text{ pts}$ (mild)
5. **Days Since Counsellor Contact**: $\min(25, (\text{days} - 3) \times 4)$ (if $\ge 4$)
6. **Unreachable Phone Attempts**: $20 \text{ pts} \times \text{unanswered calls}$
7. **Distance to Clinic**: $\min(20, (\text{distance} - 3) \times 3)$ (if $> 4 \text{ km}$)
8. **Intensive Phase Critical Window**: $18 \text{ pts}$ (Month 1 or 2)

#### 2. Risk Level Thresholds
- **HIGH**: $\text{riskScore} \ge 70$
- **MEDIUM**: $40 \le \text{riskScore} < 70$
- **LOW**: $\text{riskScore} < 40$

#### 3. Urgency & Priority Ranking (`priorityScore`)
To ensure counsellors prioritize patients who are both at risk and actively falling through the cracks:
$$\text{urgency} = (\text{daysSinceContact} \times 2.5) + (\text{isOverdueFollowup} \times 15) + (\text{consecutiveMisses} \times 5)$$
$$\text{priorityScore} = \text{riskScore} + \text{urgency}$$

#### 4. Plain-Language Contributor Mapping
Feature contributions are mapped directly to human-friendly phrases and percentage weights for the counsellor UI:
- `missed_last_3` $\rightarrow$ *"Missed 3 check-ins in last 5 days"* ($85\%$ weight)
- `side_effects` $\rightarrow$ *"Reported side effects last week"* ($62\%$ weight)
- `distance_clinic` $\rightarrow$ *"Lives far from clinic (8.5 km)"* ($45\%$ weight)
- `unreachable_phone` $\rightarrow$ *"Phone unreachable twice"* ($30\%$ weight)

---

## 5. Frontend Screen to Backend Endpoint Mapping

The table below maps every screen and component in the existing React frontend (`localhost:3000`) to its corresponding Saathi backend endpoint:

| # | Frontend Screen / Component | Screen File | Backend Endpoint | Method | Key Headers / Payload | Description |
|---|---|---|---|---|---|---|
| **1** | Style Guide | `ScreenStyleGuide.tsx` | N/A | - | - | Client-side UI tokens & typography |
| **2** | Patient Home (Normal) | `ScreenHomeNormal.tsx` | `/api/v1/patient/today`<br>`/api/v1/patient/preferences` | GET | `x-api-key: frontend`<br>`Bearer <token>` | Fetches daily status (`done` / `not_done`), current streak, reminder time, and language |
| **3** | Patient Home (Missed) | `ScreenHomeMissed.tsx` | `/api/v1/patient/today` | GET | `x-api-key: frontend`<br>`Bearer <token>` | Renders status `missed_yesterday` with neutral supportive text |
| **4** | Photo Check-in Camera | `ScreenPhotoCheckIn.tsx` | Client Camera Capture | - | - | Captures raw blister strip photo |
| **5** | Photo Check-in Review | `ScreenReviewPhoto.tsx` | `/api/v1/patient/checkins` | POST | `x-api-key: frontend`<br>`Idempotency-Key: <uuid>`<br>Multipart `photo` | Uploads photo, strips EXIF, compresses $< 300\text{ KB}$, and saves check-in |
| **6** | Check-in Success | `ScreenCheckInSuccess.tsx` | `/api/v1/patient/checkins` | POST | Returns `messageKey: 'patient.checkin_saved'` | Displays confirmation: *"Check-in saved. Thank you. See you tomorrow."* |
| **7** | Side Effects Report | `ScreenSideEffects.tsx` | `/api/v1/patient/side-effects` | POST | `{ symptoms: ['sick', 'stomach'], freeText?: string }` | Logs reported symptoms; triggers alert task for counsellor if severe |
| **8** | My History (Adherence Calendar) | `ScreenMyHistory.tsx` | `/api/v1/patient/calendar?month=YYYY-MM` | GET | `x-api-key: frontend`<br>`Bearer <token>` | Monthly calendar grid (`checked_in`, `not_recorded`, `upcoming`) + summary *"22 of 30 days"* |
| **9** | Help & Language Settings | `ScreenHelpLanguage.tsx` | `/api/v1/patient/preferences`<br>`/api/v1/patient/help-request` | GET / PUT<br>POST | `{ language, textSize }`<br>`{}` | Saves user preferences; submits *"I need help"* counsellor task |
| **10**| Patient Sign In (OTP / PIN) | `ScreenSignIn.tsx` | `/api/v1/patient/auth/request-otp`<br>`/api/v1/patient/auth/verify-otp`<br>`/api/v1/patient/auth/login-pin` | POST | `{ phone }`<br>`{ phone, otp }`<br>`{ phone, pin }` | Phone + OTP verification or 4-digit PIN authentication with 5-attempt lockout |
| **11**| Counsellor Login | `ScreenCounsellorLogin.tsx` | `/api/v1/counsellor/auth/login` | POST | `{ email, password }` | Authenticates counsellor or supervisor; returns access & refresh tokens |
| **12**| Counsellor Dashboard | `ScreenCounsellorDashboard.tsx` | `/api/v1/counsellor/dashboard` | GET | `x-api-key: frontend`<br>`Bearer <token>` | Cached (60s) metrics: Total Patients (200), Checked In (164), Need Attention (12), Follow-ups Due (7) |
| **13**| Priority Queue | `ScreenPriorityQueue.tsx` | `/api/v1/counsellor/queue?risk=All&page=1` | GET | `x-api-key: frontend`<br>`Bearer <token>` | Ranked patient queue by `priorityScore` DESC with masked phone numbers |
| **14**| Patient Profile & Timeline | `ScreenPatientProfile.tsx` | `/api/v1/counsellor/patients/:id` | GET | `x-api-key: frontend`<br>`Bearer <token>` | Patient header, clinical phase, adherence %, and combined chronological timeline |
| **15**| Why Flagged Panel | `ScreenWhyFlaggedPanel.tsx` | `/api/v1/counsellor/patients/:id/why-flagged` | GET | `x-api-key: frontend`<br>`Bearer <token>` | Top 3-5 plain-language contributing drivers with impact % bars + suggested next step |
| **16**| Log Follow-up Drawer | `DrawerLogFollowUp.tsx` | `/api/v1/counsellor/patients/:id/followups` | POST | `{ reason, outcome, notes, nextFollowupDate }` | Logs call outcome, encrypts notes, invalidates dashboard cache, and recomputes risk |
| **17**| Follow-up History | `ScreenFollowUps.tsx` | `/api/v1/counsellor/patients/:id/contact-history` | GET | `x-api-key: frontend`<br>`Bearer <token>` | List of past counsellor calls and outreach outcomes |
| **18**| Reports & District Summary | `ScreenReports.tsx` | `/api/v1/admin/programme-summary` | GET | `x-api-key: admin_tool` or `frontend`<br>`Bearer <token>` | Cohort adherence rate ($89.4\%$), potential defaults prevented, hours saved, and counsellor workloads |
| **19**| Direct Telephone Call | `ScreenPatientProfile.tsx` (Call button) | `/api/v1/counsellor/patients/:id/call` | POST | `x-api-key: frontend`<br>`Bearer <token>` | Returns unmasked full phone number for dialing AND writes immutable `AuditLog` entry |
| **20**| IVR Telephony Callback | External Telephony System | `/api/v1/webhooks/ivr` | POST | `x-api-key: ivr_webhook`<br>`{ from, digitsPressed: '1'\|'2' }` | Press 1: Logs check-in via IVR; Press 2: Generates counsellor task for immediate outreach |

---

## 6. Demo Accounts & Seed Credentials

| Role | Name | Identifier / Email | Credentials | Assigned Demo Patients |
| :--- | :--- | :--- | :--- | :--- |
| **Supervisor** | Dr. Meenakshi Sundaram | `supervisor@saathi.care` | Password: `saathi123` | Full District Cohort (200 patients) |
| **Counsellor** | Sunita Rao | `sunita.rao@saathi.care` | Password: `saathi123` | P-0142, P-0089, P-0204, P-0118, P-0177, P-0056, P-0221 |
| **Patient (High Risk)** | Anita Sharma | Phone: `9876543210` (`P-0142`) | PIN: `1234` (or OTP `123456`) | Assigned to Sunita Rao |
| **Patient (Med Risk)** | Ramesh Kumar | Phone: `9412378901` (`P-0089`) | PIN: `1234` (or OTP `123456`) | Assigned to Sunita Rao |
| **Patient (Critical)** | Vikram Singh | Phone: `9811233445` (`P-0204`) | PIN: `1234` (or OTP `123456`) | Assigned to Sunita Rao |
| **Patient (Adherent)** | Pooja Verma | Phone: `9871099887` (`P-0056`) | PIN: `1234` (or OTP `123456`) | Assigned to Sunita Rao |

### Default API Keys (Pre-configured for local testing)
- **Frontend Key (`x-api-key`)**: `saathi_fe_key_2026_prod_demo_live`
- **IVR Webhook Key (`x-api-key`)**: `saathi_ivr_key_2026_webhook_secure`
- **Admin Tool Key (`x-api-key`)**: `saathi_adm_key_2026_supervisor_tool`
