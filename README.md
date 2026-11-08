# 🌿 EcoTrack - Smart Waste Management Portal

EcoTrack is an intelligent, full-stack civic waste management platform connecting citizens, municipal workers, and administrative supervisors. It provides automated complaint routing, real-time geolocation mapping, duplicate report detection, and before/after cleanup verification.

---

## 🚀 Key Features

- **👤 Citizen Portal**: Report waste issues with photos, automatic GPS coordinates, interactive map picker, and live tracking of resolution status.
- **👷 Sanitation Worker Dashboard**: View assigned tasks prioritized by severity and distance, update status to *In Progress*, and upload photographic proof upon completion.
- **🏛️ Municipal Admin Command Center**: Real-time KPI analytics, complaint lifecycle management, AI duplicate detection review, worker assignment, and CSV export.
- **🗺️ Interactive Map View**: Visualize waste hotspots across wards and localities with Leaflet / OpenStreetMap.
- **📸 Visual Evidence Verification**: Before & After split-view inspection for supervisors.

---

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, Leaflet, Lucide Icons, Recharts
- **Backend**: Node.js, Express, TypeScript, SQLite (`node:sqlite` built-in) / MongoDB
- **Authentication**: JWT with secure HTTP-only cookies and Bearer tokens

---

## ⚡ Quick Start (Local Development)

### 1. Install Dependencies
```bash
npm run install:all
```

### 2. Seed Database with Sample Data
```bash
npm run seed
```

### 3. Run Development Servers
```bash
npm run dev
```
- **Frontend**: [http://127.0.0.1:5173](http://127.0.0.1:5173)
- **Backend API**: [http://127.0.0.1:3000](http://127.0.0.1:3000)
- **API Health**: [http://127.0.0.1:3000/api/health](http://127.0.0.1:3000/api/health)

---

## 🔑 Default Test Accounts

| Role | Email | Password |
|---|---|---|
| **Municipal Admin** | `admin@ecotrack.gov.in` | `Admin@123` |
| **Sanitation Worker** | `worker@ecotrack.gov.in` | `Worker@123` |
| **Citizen** | `citizen@ecotrack.gov.in` | `Citizen@123` |

---

## 🌐 Live Hosting Options

### Option 1: Render (Recommended - Free & Fullstack)
EcoTrack is configured to run both frontend and backend on Render as a unified service.

1. Push this repository to your **GitHub** account.
2. Sign in to [Render.com](https://render.com).
3. Click **New +** -> **Blueprint**.
4. Select your GitHub repository.
5. Render will automatically read `render.yaml`, run `npm run render:build`, and start the app with `npm start`!

*Alternatively, create a Web Service manually on Render:*
- **Build Command**: `npm run render:build`
- **Start Command**: `npm start`
- **Environment Variables**:
  - `NODE_ENV`: `production`

---

### Option 2: Vercel (Frontend) + Render (Backend)

1. **Deploy Backend to Render** using `server/` with Start Command `npm run start`.
2. **Deploy Frontend to Vercel**:
   - Import your GitHub repo on [Vercel](https://vercel.com).
   - Set **Root Directory** to `client` (or leave root with the included `vercel.json`).
   - Add Environment Variable:
     - `VITE_API_URL`: `https://your-backend-app.onrender.com`
3. In your Render backend settings, set `CLIENT_ORIGIN` to your Vercel URL (e.g. `https://your-app.vercel.app`).

---

## 📂 Project Structure

```
├── client/              # React + Vite frontend
│   ├── src/
│   │   ├── components/  # Layout, map, badges, before-after viewer
│   │   ├── pages/       # Admin, Worker, Citizen, and Landing pages
│   │   ├── services/    # API client
│   │   └── types/       # TypeScript interfaces
├── server/              # Express backend API
│   ├── src/
│   │   ├── controllers/ # Route handlers
│   │   ├── database/    # SQLite and MongoDB adapters & seeds
│   │   ├── middleware/  # Auth, validation, error handler
│   │   └── routes/      # REST API endpoints
├── database/            # SQLite storage directory
├── render.yaml          # 1-click Render blueprint deployment
└── vercel.json          # Vercel deployment configuration
```

---

## 📄 License
MIT
