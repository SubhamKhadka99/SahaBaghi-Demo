import { addDoc, collection, GeoPoint, onSnapshot, orderBy, query, serverTimestamp } from "firebase/firestore";
import {
  Bell,
  CircleUserRound,
  ClipboardList,
  Home,
  Info,
  Loader2,
  MapPinned,
  Plus,
  Siren,
  Trophy
} from "lucide-react";
import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import MapView, { type CivicReport } from "../components/MapView";
import ReportModal from "../components/ReportModal";
import { db } from "../lib/firebase";

type CitizenTab = "home" | "map" | "leaderboard" | "profile";
type CitizenLeaderboardEntry = { name: string; reports: number };

const DEMO_CITIZEN_LEADERBOARD: CitizenLeaderboardEntry[] = [
  { name: "Asha Tamang", reports: 23 },
  { name: "Subham Khadka", reports: 19 },
  { name: "Nabin Shrestha", reports: 17 },
  { name: "Sita Karki", reports: 14 },
  { name: "Ramesh Gurung", reports: 11 }
];

function formatTime(timestamp?: number) {
  if (!timestamp) return "Just now";
  return new Date(timestamp).toLocaleString();
}

function statusBadge(status: CivicReport["status"]) {
  if (status === "Resolved") return "bg-emerald-100 text-emerald-700";
  if (status === "Dispatched") return "bg-amber-100 text-amber-700";
  return "bg-red-100 text-red-700";
}

export default function CitizenApp() {
  const [reports, setReports] = useState<CivicReport[]>([]);
  const [tab, setTab] = useState<CitizenTab>("home");
  const [isModalOpen, setModalOpen] = useState(false);
  const [loadingReports, setLoadingReports] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState("");
  const [uploadNotice, setUploadNotice] = useState("");

  const cloudinaryCloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME ?? "";
  const cloudinaryUploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET ?? "";
  const isCloudinaryConfigured = !!cloudinaryCloudName && !!cloudinaryUploadPreset;

  useEffect(() => {
    const q = query(collection(db, "reports"), orderBy("timestamp", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const nextReports = snapshot.docs.map((docSnap) => {
        const data = docSnap.data();
        const geo = data.location as GeoPoint | undefined;
        return {
          id: docSnap.id,
          type: String(data.type ?? "Unknown"),
          lat: geo?.latitude ?? 27.7172,
          lng: geo?.longitude ?? 85.324,
          imageUrl: data.imageUrl ? String(data.imageUrl) : "",
          description: data.description ? String(data.description) : "",
          status: (data.status ?? "Reported") as CivicReport["status"],
          timestamp: typeof data.timestamp?.toMillis === "function" ? data.timestamp.toMillis() : Date.now()
        } satisfies CivicReport;
      });
      setReports(nextReports);
      setLoadingReports(false);
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(""), 2200);
    return () => clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    if (!uploadNotice) return;
    const timer = setTimeout(() => setUploadNotice(""), 3000);
    return () => clearTimeout(timer);
  }, [uploadNotice]);

  async function getCurrentLocation() {
    if (!navigator.geolocation) {
      throw new Error("Geolocation is not supported on this browser.");
    }

    return new Promise<{ lat: number; lng: number }>((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        () => {
          reject(new Error("Location permission needed to report an issue."));
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    });
  }

  async function submitReport(input: { type: string; imageFile: File | null; description: string }) {
    setSubmitting(true);
    try {
      const coords = await getCurrentLocation();
      let imageUrl = "";
      if (input.imageFile && isCloudinaryConfigured) {
        try {
          const formData = new FormData();
          formData.append("file", input.imageFile);
          formData.append("upload_preset", cloudinaryUploadPreset);

          const response = await fetch(
            `https://api.cloudinary.com/v1_1/${cloudinaryCloudName}/image/upload`,
            {
              method: "POST",
              body: formData
            }
          );

          if (!response.ok) {
            throw new Error("Cloudinary upload failed");
          }

          const result = (await response.json()) as { secure_url?: string };
          imageUrl = result.secure_url ?? "";
        } catch {
          setUploadNotice("Image upload failed. Report submitted without image.");
        }
      } else if (input.imageFile && !isCloudinaryConfigured) {
        setUploadNotice("Cloudinary not configured. Report submitted without image.");
      }

      await addDoc(collection(db, "reports"), {
        type: input.type,
        location: new GeoPoint(coords.lat, coords.lng),
        imageUrl,
        description: input.description,
        timestamp: serverTimestamp(),
        status: "Reported"
      });

      setModalOpen(false);
      setToast("Issue Reported!");
      setTab("map");
    } catch (error) {
      setToast(error instanceof Error ? error.message : "Could not submit report");
    } finally {
      setSubmitting(false);
    }
  }

  const topReports = reports.slice(0, 20);

  return (
    <Layout mode="citizen">
      <div className="relative flex h-full flex-col">
        <header className="border-b border-gray-200 bg-white/95 p-4 backdrop-blur">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-[#00B4D8]">Saha-Bhagi</p>
              <h1 className="text-xl font-semibold text-[#0A192F]">
                {tab === "map"
                  ? "Live Ward Map"
                  : tab === "profile"
                    ? "Subham's Profile"
                    : tab === "leaderboard"
                      ? "Ward 10 Leaderboard"
                      : "Community Feed"}
              </h1>
            </div>
            <button className="rounded-full border border-gray-200 p-2 text-[#0A192F]">
              <Bell size={18} />
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-hidden">
          {tab === "home" ? (
            <section className="h-full overflow-y-auto px-3 py-3">
              {loadingReports ? (
                <div className="space-y-3">
                  <div className="h-28 animate-pulse rounded-2xl bg-slate-200" />
                  <div className="h-28 animate-pulse rounded-2xl bg-slate-200" />
                  <div className="h-28 animate-pulse rounded-2xl bg-slate-200" />
                </div>
              ) : (
                <div className="space-y-3 pb-28">
                  <article className="rounded-2xl border border-[#00B4D8]/30 bg-gradient-to-br from-[#0A192F] to-[#12315d] p-4 text-white shadow-sm">
                    <p className="text-xs uppercase tracking-[0.2em] text-cyan-200">Quick Action</p>
                    <h2 className="mt-1 text-lg font-semibold">Report an Issue in under 10 seconds</h2>
                    <p className="mt-1 text-xs text-slate-200">
                      Tap the center button below, capture a photo, and we will route it to the ward team.
                    </p>
                    <button
                      onClick={() => setModalOpen(true)}
                      className="mt-3 rounded-xl bg-[#00B4D8] px-3 py-2 text-xs font-semibold text-white shadow-lg hover:bg-cyan-600"
                    >
                      Open Report Form
                    </button>
                  </article>

                  <div className="grid grid-cols-2 gap-3">
                    <article className="rounded-2xl border border-gray-200 bg-white p-3 shadow-sm">
                      <div className="mb-2 flex items-center gap-2 text-[#0A192F]">
                        <ClipboardList size={16} className="text-[#00B4D8]" />
                        <p className="text-xs font-semibold uppercase tracking-wide">Today</p>
                      </div>
                      <p className="text-xl font-bold text-[#0A192F]">{reports.length}</p>
                      <p className="text-xs text-slate-500">Reports in live system</p>
                    </article>
                    <article className="rounded-2xl border border-gray-200 bg-white p-3 shadow-sm">
                      <div className="mb-2 flex items-center gap-2 text-[#0A192F]">
                        <Siren size={16} className="text-amber-500" />
                        <p className="text-xs font-semibold uppercase tracking-wide">Urgent</p>
                      </div>
                      <p className="text-xl font-bold text-amber-600">
                        {reports.filter((item) => item.status === "Reported").length}
                      </p>
                      <p className="text-xs text-slate-500">Awaiting dispatch</p>
                    </article>
                  </div>

                  <article className="rounded-2xl border border-gray-200 bg-white p-3 shadow-sm">
                    <div className="mb-1 flex items-center gap-2">
                      <Info size={16} className="text-[#00B4D8]" />
                      <h3 className="text-sm font-semibold text-[#0A192F]">Ward Info</h3>
                    </div>
                    <p className="text-xs text-slate-600">
                      Ward 10 field team is active from 6:00 AM to 8:00 PM. Include nearby landmarks for faster
                      dispatch.
                    </p>
                  </article>

                  <p className="px-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Latest Community Reports
                  </p>
                  {topReports.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-4 text-sm text-slate-500">
                      No reports yet. Be the first citizen to report an issue in your area.
                    </div>
                  ) : null}
                  {topReports.map((report) => (
                    <article
                      key={report.id}
                      className="rounded-2xl border border-gray-200 bg-white p-3 shadow-sm"
                    >
                      <div className="flex gap-3">
                        <div className="h-20 w-24 overflow-hidden rounded-xl bg-slate-100">
                          {report.imageUrl ? (
                            <img
                              src={report.imageUrl}
                              alt={report.type}
                              className="h-full w-full object-cover"
                            />
                          ) : null}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="mb-1 flex items-center justify-between gap-2">
                            <h2 className="truncate text-sm font-semibold text-[#0A192F]">{report.type}</h2>
                            <span
                              className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${statusBadge(report.status)}`}
                            >
                              {report.status}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500">
                            {report.lat.toFixed(4)}, {report.lng.toFixed(4)}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">{formatTime(report.timestamp)}</p>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>
          ) : null}

          {tab === "map" ? (
            <section className="h-full">
              <MapView reports={reports} showHeatmap className="h-full w-full" />
            </section>
          ) : null}

          {tab === "profile" ? (
            <section className="h-full overflow-y-auto px-4 py-4 pb-28">
              <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                <div className="mb-3 flex items-center gap-3">
                  <div className="rounded-full bg-[#0A192F] p-3 text-white">
                    <CircleUserRound size={24} />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-[#0A192F]">Subham Khadka</h2>
                    <p className="text-xs font-medium text-[#00B4D8]">Level 4 Civic Leader</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl bg-slate-50 p-3 text-center">
                    <p className="text-xl font-bold text-[#0A192F]">12</p>
                    <p className="text-xs text-slate-500">Total Reports</p>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-3 text-center">
                    <p className="text-xl font-bold text-emerald-600">8</p>
                    <p className="text-xs text-slate-500">Issues Resolved</p>
                  </div>
                </div>
              </div>

              <div className="mt-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                <h3 className="mb-3 text-sm font-semibold text-[#0A192F]">Personal Information</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2">
                    <span className="text-slate-500">Phone</span>
                    <span className="font-medium text-[#0A192F]">+977 9812345678</span>
                  </div>
                  <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2">
                    <span className="text-slate-500">Email</span>
                    <span className="font-medium text-[#0A192F]">subham.demo@sahabhagi.app</span>
                  </div>
                  <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2">
                    <span className="text-slate-500">Address</span>
                    <span className="font-medium text-[#0A192F]">New Baneshwor, Kathmandu</span>
                  </div>
                  <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2">
                    <span className="text-slate-500">Member Since</span>
                    <span className="font-medium text-[#0A192F]">Jan 2025</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                <div className="mb-3 flex items-center gap-2">
                  <Trophy className="text-[#00B4D8]" size={18} />
                  <h3 className="font-semibold text-[#0A192F]">Next Level Progress</h3>
                </div>
                <p className="mb-2 text-xs font-medium text-slate-600">2 more reports to reach Level 5 Civic Leader.</p>
                <div className="h-2 rounded-full bg-slate-200">
                  <div className="h-2 w-4/5 rounded-full bg-[#00B4D8]" />
                </div>
              </div>
            </section>
          ) : null}

          {tab === "leaderboard" ? (
            <section className="h-full overflow-y-auto px-4 py-4 pb-28">
              <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                <div className="mb-3 flex items-center gap-2">
                  <Trophy className="text-amber-500" size={18} />
                  <h3 className="font-semibold text-[#0A192F]">Top Citizen Reporters</h3>
                </div>
                <p className="mb-3 text-xs text-slate-500">Dummy leaderboard based on number of reports submitted.</p>
                <div className="space-y-2 text-sm">
                  {DEMO_CITIZEN_LEADERBOARD.map((citizen, index) => (
                    <div
                      key={citizen.name}
                      className={`flex items-center justify-between rounded-xl px-3 py-2 ${
                        index === 1
                          ? "border border-[#00B4D8]/30 bg-[#00B4D8]/10"
                          : "bg-slate-50"
                      }`}
                    >
                      <span className={index === 1 ? "font-semibold text-[#0A192F]" : ""}>
                        {index + 1}. {citizen.name}
                      </span>
                      <span className="font-semibold">{citizen.reports} reports</span>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          ) : null}
        </div>

        <nav className="absolute bottom-0 left-0 right-0 z-[500] border-t border-gray-200 bg-white px-4 pb-4 pt-3">
          <div className="relative flex items-end justify-between">
            <button
              onClick={() => setTab("home")}
              className={`flex flex-col items-center gap-1 text-xs ${tab === "home" ? "text-[#00B4D8]" : "text-slate-500"}`}
            >
              <Home size={18} />
              Home
            </button>
            <button
              onClick={() => setTab("map")}
              className={`flex flex-col items-center gap-1 text-xs ${tab === "map" ? "text-[#00B4D8]" : "text-slate-500"}`}
            >
              <MapPinned size={18} />
              Map
            </button>
            <button
              onClick={() => setModalOpen(true)}
              className="-mt-8 flex h-14 w-14 items-center justify-center rounded-full bg-[#00B4D8] text-white shadow-lg transition hover:scale-105"
              aria-label="Report"
            >
              <Plus size={24} strokeWidth={2.5} />
            </button>
            <button
              onClick={() => setTab("profile")}
              className={`flex flex-col items-center gap-1 text-xs ${tab === "profile" ? "text-[#00B4D8]" : "text-slate-500"}`}
            >
              <CircleUserRound size={18} />
              Profile
            </button>
            <button
              onClick={() => setTab("leaderboard")}
              className={`flex flex-col items-center gap-1 text-xs ${tab === "leaderboard" ? "text-[#00B4D8]" : "text-slate-500"}`}
            >
              <Trophy size={18} />
              Leaderboard
            </button>
          </div>
        </nav>
      </div>

      <ReportModal
        open={isModalOpen}
        submitting={submitting}
        onClose={() => setModalOpen(false)}
        onSubmit={submitReport}
      />

      {toast ? (
        <div className="absolute left-1/2 top-20 z-[999] -translate-x-1/2 rounded-full bg-[#0A192F] px-4 py-2 text-sm text-white shadow-xl">
          <span className="flex items-center gap-2">
            {submitting ? <Loader2 className="animate-spin" size={14} /> : null}
            {toast}
          </span>
        </div>
      ) : null}
      {uploadNotice ? (
        <div className="absolute left-1/2 top-32 z-[999] -translate-x-1/2 rounded-full bg-amber-100 px-4 py-2 text-xs font-medium text-amber-800 shadow-lg">
          {uploadNotice}
        </div>
      ) : null}
    </Layout>
  );
}
