# Playto KYC Portal

A full-stack KYC onboarding system for Playto Pay. Merchants submit KYC information, reviewers approve or reject it. Built with Django + DRF (backend) and React + Vite (frontend), deployed as a single service on Render.

## Tech Stack

- **Backend:** Django 4.2, Django REST Framework, SimpleJWT, WhiteNoise
- **Frontend:** React 18, Vite, Tailwind CSS
- **Database:** SQLite (dev) / PostgreSQL (prod)
- **Auth:** JWT tokens (7-day access, 30-day refresh)
- **Key Features:** Simulated AI Face ID Verification, Light/Dark Mode, Real-time Document Validation, Role-based Dashboards, CSV Export

---

## Local Development Setup

### 1. Clone the repo

```bash
git clone https://github.com/geniusInCode/PLAYTO-KYC-PORTAL.git
cd PLAYTO-KYC-PORTAL
```

### 2. Backend

```bash
cd backend
python -m venv venv
# Windows:
venv\Scripts\activate
# Mac/Linux:
# source venv/bin/activate

pip install -r requirements.txt
python manage.py migrate
python seed.py          # Creates demo accounts (idempotent — safe to re-run)
python manage.py runserver
```

Backend runs at: http://localhost:8000

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at: http://localhost:5173  
(Vite proxies `/api` and `/media` to the Django backend)

---

## Test Accounts (created by seed.py)

| Username   | Password   | Role     | Status                           |
|------------|------------|----------|----------------------------------|
| merchant1  | Test@1234  | merchant | draft                            |
| merchant2  | Test@1234  | merchant | under_review (AT RISK — 30h old) |
| reviewer1  | Test@1234  | reviewer | reviewer dashboard               |

---

## Merchant KYC Flow (5 Steps)

1. **Personal Details** — Name, Email, Phone
2. **Business Details** — Business Name, Type, Expected Monthly Volume
3. **Upload Documents** — Drag-and-drop PAN, Aadhaar, Bank Statement (PDF/JPG/PNG, max 5MB, magic-byte validated)
4. **Face Verification** — Live webcam selfie with simulated AI face-match scoring (includes "Upload Photo" fallback)
5. **Review & Submit** — Full summary before submission

---

## API Endpoints

All endpoints under `/api/v1/`

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/register/` | Create account |
| POST | `/auth/login/` | Login → JWT tokens |
| GET  | `/auth/me/` | Current user info |
| POST | `/auth/forgot-password/` | Request reset token |
| POST | `/auth/reset-password/` | Reset with token |
| POST | `/auth/change-password/` | Change while logged in |

### Merchant
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET  | `/kyc/my/` | Get own submission |
| PATCH | `/kyc/my/` | Save draft progress |
| POST | `/kyc/my/submit/` | Submit for review |
| POST | `/kyc/my/documents/` | Upload document |
| GET  | `/kyc/my/documents/` | List documents |

### Reviewer
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET  | `/reviewer/queue/` | Queue + metrics |
| GET  | `/reviewer/submissions/{id}/` | Submission detail |
| POST | `/reviewer/submissions/{id}/transition/` | Change state |

### State Machine (legal transitions only)
```
draft → submitted
submitted → under_review
under_review → approved | rejected | more_info_requested
more_info_requested → submitted   (merchant resubmits)
```
Terminal states: `approved`, `rejected` (no exits)

---

## Running Tests

```bash
cd backend
python manage.py test kyc
```

Tests cover: state machine unit tests, illegal transition 400s, merchant auth isolation, file validation.

---

## Deployment on Render

This project deploys as a **single Web Service** on Render. The Procfile builds the React frontend, runs Django migrations, seeds the DB (on first deploy only), then starts Gunicorn.

### Steps

1. **Push to GitHub**
2. **Create a new Web Service on Render** → Connect your GitHub repo
3. **Add a PostgreSQL database** on Render → copy the Internal Connection String
4. **Set Environment Variables** in the Render service dashboard:

| Variable | Value |
|----------|-------|
| `SECRET_KEY` | Generate: `python -c "import secrets; print(secrets.token_urlsafe(50))"` |
| `DEBUG` | `False` |
| `ALLOWED_HOSTS` | `your-app-name.onrender.com` |
| `DATABASE_URL` | Paste the Internal Connection String from your Render PostgreSQL |

5. **Build Command** (leave blank — handled by Procfile)
6. **Start Command:** Leave blank (Render reads Procfile automatically)
7. Deploy! First deploy takes ~5-8 min (npm install + build + migrate + collectstatic)

> **Note:** The seed script is idempotent — it only creates demo accounts once. Re-deploys will not wipe your data.

### Quick Deploy (render.yaml)

This repo includes a `render.yaml` file. You can use the **Deploy to Render** button or connect the repo and Render will auto-detect it:

1. Go to [https://render.com](https://render.com) → **New** → **Blueprint**
2. Connect your GitHub repo (`geniusInCode/PLAYTO-KYC-PORTAL`)
3. Render reads `render.yaml` and creates the **Web Service** + **PostgreSQL** database automatically
4. Set `SECRET_KEY` manually in the Render dashboard (or Render generates one if using `generateValue: true`)
5. Done — first deploy takes ~5-8 min

---

## Project Structure

```
playto-kyc/
├── render.yaml                # Render Blueprint (web service + PostgreSQL)
├── Procfile                   # Fallback start command for Render
├── .env.example               # Environment variable template
├── backend/
│   ├── accounts/              # User model, JWT auth, role permissions
│   ├── kyc/                   # KYC models, state machine, validators, views
│   │   ├── state_machine.py   # ← single source of truth for transitions
│   │   ├── validators.py      # ← file upload validation (magic bytes)
│   │   ├── models.py
│   │   ├── serializers.py
│   │   ├── views.py
│   │   └── tests.py
│   ├── notifications/         # NotificationEvent log
│   ├── config/                # Settings, URLs, exception handler
│   ├── seed.py                # Idempotent demo data seeder
│   └── requirements.txt
└── frontend/
    ├── index.html
    ├── vite.config.js
    └── src/
        ├── pages/
        │   ├── merchant/      # Multi-step KYC form, status page
        │   └── reviewer/      # Dashboard, detail view
        ├── components/        # Navbar, StatusBadge, Toast
        ├── utils/             # Notification store
        └── api/               # Axios client
```




DEMO LINK :-   https://playto-kyc-ready.onrender.com/login
