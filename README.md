# Saha-Bhagi Real-Time Prototype

A clean, fast prototype for a civic-tech app with:
- Citizen App at `/` (mobile-first issue reporting)
- Ward Dashboard at `/admin` (desktop issue management)
- Real-time sync using Firebase Firestore `onSnapshot`

## 1) Project Structure

```txt
src/
  components/
    DashboardPanel.tsx
    MapView.tsx
    ReportForm.tsx
    ReportList.tsx
  context/
    ReportsContext.tsx
  firebase/
    config.ts
  hooks/
    useReports.ts
  pages/
    AdminPage.tsx
    CitizenPage.tsx
  services/
    reportService.ts
  types/
    report.ts
  App.tsx
  index.css
  main.tsx
```

This keeps Citizen and Dashboard page logic separate while sharing one Firestore data layer.

## 2) Firebase Setup (Step-by-Step)

1. Go to [Firebase Console](https://console.firebase.google.com/) and create a project named `saha-bhagi`.
2. In project settings, add a **Web App**.
3. Copy config values.
4. In Firebase Console, open **Firestore Database**:
   - Click **Create database**
   - Start in test mode (for prototype)
   - Select region near your users
5. Create `.env` in project root from `.env.example` and paste your values:

```bash
cp .env.example .env
```

6. Firestore rules for quick prototype:

```txt
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /reports/{reportId} {
      allow read, write: if true;
    }
  }
}
```

> Later lock these rules with auth.

## 3) Firestore Data Model

Collection: `reports`

Document shape:

```ts
{
  id: string;
  type: "pothole" | "waste" | "drain" | "streetlight" | "other";
  location: { lat: number; lng: number };
  status: "Reported" | "Dispatched" | "Resolved";
  timestamp: number;
  description?: string;
}
```

## 4) Real-Time Sync Flow

Implemented in `src/services/reportService.ts`:
- `addReport()` adds a report from citizen app
- `subscribeToReports()` uses `onSnapshot` for live updates
- `updateReportStatus()` updates status from dashboard

Both views use the same React Context (`ReportsContext`) so they stay synced instantly across devices.

## 5) Routing

Implemented with React Router:
- `/` -> `CitizenPage`
- `/admin` -> `AdminPage`

## 6) Run Locally

```bash
npm install
npm run dev
```

Open:
- Citizen App: `http://localhost:5173/`
- Dashboard: `http://localhost:5173/admin`

To test real-time:
1. Open citizen app on phone/browser A
2. Open dashboard on browser B
3. Create report from A, status-update from B
4. Watch both update instantly

## 7) Vercel Deployment (Step-by-Step)

1. Push project to GitHub.
2. Go to [Vercel](https://vercel.com/) -> **New Project** -> import repo.
3. In Vercel project settings, add env vars from `.env`:
   - `VITE_FIREBASE_API_KEY`
   - `VITE_FIREBASE_AUTH_DOMAIN`
   - `VITE_FIREBASE_PROJECT_ID`
   - `VITE_FIREBASE_STORAGE_BUCKET`
   - `VITE_FIREBASE_MESSAGING_SENDER_ID`
   - `VITE_FIREBASE_APP_ID`
4. Deploy.
5. Add Vercel domain to Firebase authorized domains if needed.

## 8) Best Practices Followed

- Feature-aware folders (`services`, `hooks`, `context`, `components`, `pages`)
- Shared typed model in `types/report.ts`
- Firebase logic isolated from UI
- Simple and beginner-friendly state flow
- Clean naming (`addReport`, `subscribeToReports`, `changeReportStatus`)

## 9) Bonus Roadmap

### Add authentication (Firebase Auth)
- Add login (phone OTP/email/password)
- Store ward role in Firestore (`users` collection)
- Restrict `/admin` based on role
- Update Firestore rules to role-based access

### Add image upload (Firebase Storage)
- Add file input in `ReportForm`
- Upload image to Storage path `reports/{reportId}/...`
- Save image URL into report doc

### Scale backend (Node.js later)
- Move sensitive logic to Cloud Functions or Node API
- Add validation and moderation pipeline
- Add geospatial queries and analytics

## 10) What Is Completed Now

- Full Vite + React + TypeScript + Tailwind setup
- Citizen app UI (clean mobile-first form + live list + map)
- Ward dashboard UI (status management + map)
- Firebase config integration points
- Real-time Firestore sync architecture
- Deployment and setup instructions

## 11) Prompt For Next AI (if continuing)

Use this exact prompt:

```txt
Continue from current Saha-Bhagi prototype codebase.
Tasks:
1) Add robust form validation (lat/lng ranges, required fields, error toasts).
2) Improve map UX: click on map to set marker location in ReportForm.
3) Add basic admin analytics cards (total/reported/dispatched/resolved).
4) Add Firebase Auth (email/password) and protect /admin route.
5) Update Firestore rules for authenticated role-based writes.
6) Add a polished loading and empty state UI across all components.
7) Keep architecture simple and maintain TypeScript types.
Return exact file changes and testing instructions.
```
