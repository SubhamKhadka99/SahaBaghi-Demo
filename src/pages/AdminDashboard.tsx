import {
  collection,
  doc,
  GeoPoint,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc
} from "firebase/firestore";
import { useEffect, useState } from "react";
import { Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import AdminSidebar, { type AdminSection } from "../components/AdminSidebar";
import Layout from "../components/Layout";
import MapView, { type CivicReport } from "../components/MapView";
import { db } from "../lib/firebase";

type AdminReport = CivicReport & {
  assignedCrew?: string;
  dispatchedAt?: number;
  resolvedAt?: number;
};

const CREWS = ["Crew Alpha", "Crew Bravo", "Crew Charlie", "Crew Delta"];

const DEMO_REPORTS: AdminReport[] = [
  {
    id: "demo-1",
    type: "Pothole",
    lat: 27.7165,
    lng: 85.3231,
    status: "Reported",
    description: "Large pothole near Ward office gate",
    timestamp: Date.now() - 60 * 60 * 1000
  },
  {
    id: "demo-2",
    type: "Waste Dumping",
    lat: 27.7191,
    lng: 85.3275,
    status: "Dispatched",
    assignedCrew: "Crew Alpha",
    description: "Overflowing garbage near bus stop",
    timestamp: Date.now() - 2 * 60 * 60 * 1000,
    dispatchedAt: Date.now() - 90 * 60 * 1000
  },
  {
    id: "demo-3",
    type: "Blocked Drain",
    lat: 27.7149,
    lng: 85.3209,
    status: "Resolved",
    assignedCrew: "Crew Bravo",
    description: "Drain blocked after rainfall",
    timestamp: Date.now() - 4 * 60 * 60 * 1000,
    resolvedAt: Date.now() - 30 * 60 * 1000
  }
];

function statusBadge(status: CivicReport["status"]) {
  if (status === "Resolved") return "bg-emerald-100 text-emerald-700";
  if (status === "Dispatched") return "bg-amber-100 text-amber-700";
  return "bg-red-100 text-red-700";
}

export default function AdminDashboard() {
  const [activeSection, setActiveSection] = useState<AdminSection>("overview");
  const [reports, setReports] = useState<AdminReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const isFirebaseConfigured =
    !!import.meta.env.VITE_FIREBASE_PROJECT_ID &&
    import.meta.env.VITE_FIREBASE_PROJECT_ID !== "YOUR_PROJECT_ID";

  useEffect(() => {
    if (!isFirebaseConfigured) {
      setReports(DEMO_REPORTS);
      setLoading(false);
      return;
    }

    const q = query(collection(db, "reports"), orderBy("timestamp", "desc"));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
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
            assignedCrew: data.assignedCrew ? String(data.assignedCrew) : "",
            timestamp:
              typeof data.timestamp?.toMillis === "function" ? data.timestamp.toMillis() : Date.now(),
            dispatchedAt:
              typeof data.dispatchedAt?.toMillis === "function" ? data.dispatchedAt.toMillis() : undefined,
            resolvedAt:
              typeof data.resolvedAt?.toMillis === "function" ? data.resolvedAt.toMillis() : undefined
          } satisfies AdminReport;
        });
        setReports(nextReports);
        setLoading(false);
      },
      (firestoreError) => {
        setError(firestoreError.message);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [isFirebaseConfigured]);

  const totalReports = reports.length;
  const pendingDispatches = reports.filter((report) => report.status === "Reported").length;
  const issuesResolved = reports.filter((report) => report.status === "Resolved").length;
  const inFieldCount = reports.filter((report) => report.status === "Dispatched").length;

  const pieData = [
    { name: "Reported", value: reports.filter((report) => report.status === "Reported").length, color: "#F59E0B" },
    {
      name: "Dispatched",
      value: reports.filter((report) => report.status === "Dispatched").length,
      color: "#00B4D8"
    },
    { name: "Resolved", value: issuesResolved, color: "#10B981" }
  ];

  const crewBoard = CREWS.map((crew) => {
    const activeTask = reports.find((report) => report.assignedCrew === crew && report.status === "Dispatched");
    return {
      name: crew,
      state: activeTask ? "Assigned" : "Free",
      task: activeTask
    };
  });

  function pickFreeCrew() {
    return crewBoard.find((crew) => crew.state === "Free")?.name ?? CREWS[0];
  }

  async function dispatchCrew(report: AdminReport) {
    const assignedCrew = report.assignedCrew || pickFreeCrew();

    if (!isFirebaseConfigured || report.id.startsWith("demo-")) {
      setReports((prev) =>
        prev.map((item) =>
          item.id === report.id
            ? {
                ...item,
                status: "Dispatched",
                assignedCrew,
                dispatchedAt: Date.now()
              }
            : item
        )
      );
      return;
    }

    await updateDoc(doc(db, "reports", report.id), {
      status: "Dispatched",
      assignedCrew,
      dispatchedAt: serverTimestamp()
    });
  }

  async function markResolved(report: AdminReport) {
    if (!isFirebaseConfigured || report.id.startsWith("demo-")) {
      setReports((prev) =>
        prev.map((item) =>
          item.id === report.id
            ? {
                ...item,
                status: "Resolved",
                resolvedAt: Date.now()
              }
            : item
        )
      );
      return;
    }

    await updateDoc(doc(db, "reports", report.id), {
      status: "Resolved",
      resolvedAt: serverTimestamp()
    });
  }

  return (
    <Layout mode="admin">
      <AdminSidebar activeSection={activeSection} onSectionChange={setActiveSection} />
      <main className="flex-1 overflow-y-auto p-4">
        {!isFirebaseConfigured ? (
          <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700">
            Firebase is not configured. Running in demo mode with local sample data.
          </div>
        ) : null}
        {error ? (
          <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            Firestore error: {error}
          </div>
        ) : null}

        {(activeSection === "overview" || activeSection === "analytics") && (
        <section className="mb-4 grid grid-cols-1 gap-4 lg:grid-cols-4">
          <article className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
            <p className="text-xs uppercase text-slate-500">Total Reports</p>
            <h2 className="mt-1 text-2xl font-bold text-[#0A192F]">{totalReports}</h2>
          </article>
          <article className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
            <p className="text-xs uppercase text-slate-500">Pending Dispatches</p>
            <h2 className="mt-1 text-2xl font-bold text-amber-600">{pendingDispatches}</h2>
          </article>
          <article className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
            <p className="text-xs uppercase text-slate-500">Issues Resolved</p>
            <h2 className="mt-1 text-2xl font-bold text-emerald-600">{issuesResolved}</h2>
          </article>
          <article className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
            <p className="text-xs uppercase text-slate-500">Issues by Status</p>
            <div className="mt-2 h-28">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={24}
                    outerRadius={46}
                  />
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-2 flex flex-wrap gap-2 text-[11px]">
              {pieData.map((entry) => (
                <span key={entry.name} className="rounded-full bg-slate-100 px-2 py-1">
                  <span style={{ color: entry.color }} className="font-bold">
                    ●
                  </span>{" "}
                  {entry.name}
                </span>
              ))}
            </div>
          </article>
        </section>
        )}

        {(activeSection === "overview" || activeSection === "dispatch") && (
        <section className="mb-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-[#0A192F]">Crew Availability</h3>
            <p className="text-sm text-slate-500">
              {crewBoard.filter((crew) => crew.state === "Free").length} free / {inFieldCount} in field
            </p>
          </div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
            {crewBoard.map((crew) => (
              <article key={crew.name} className="rounded-xl border border-gray-200 p-3">
                <div className="mb-2 flex items-center justify-between">
                  <p className="font-semibold text-[#0A192F]">{crew.name}</p>
                  <span
                    className={`rounded-full px-2 py-1 text-xs font-semibold ${
                      crew.state === "Free" ? "bg-emerald-100 text-emerald-700" : "bg-cyan-100 text-cyan-700"
                    }`}
                  >
                    {crew.state}
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  {crew.task ? `Assigned: ${crew.task.type}` : "No active assignment"}
                </p>
              </article>
            ))}
          </div>
        </section>
        )}

        {(activeSection === "overview" || activeSection === "analytics") && (
        <section className="mb-4 h-[360px] overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          {loading ? (
            <div className="flex h-full items-center justify-center text-slate-500">Loading heatmap...</div>
          ) : (
            <MapView
              reports={reports}
              showHeatmap
              heatRadius={52}
              heatBlur={36}
              className="h-full w-full"
            />
          )}
        </section>
        )}

        {(activeSection === "overview" || activeSection === "dispatch") && (
        <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <h3 className="mb-3 text-lg font-semibold text-[#0A192F]">Actionable Report Queue</h3>
          <div className="space-y-3">
            {loading ? (
              <>
                <div className="h-20 animate-pulse rounded-xl bg-slate-200" />
                <div className="h-20 animate-pulse rounded-xl bg-slate-200" />
              </>
            ) : reports.length === 0 ? (
              <div className="rounded-xl border border-dashed border-gray-300 p-5 text-sm text-slate-500">
                No reports found yet. Submit one from the citizen app, or configure Firebase if you are still
                using placeholder values.
              </div>
            ) : (
              reports.map((report) => (
                <article
                  key={report.id}
                  className="flex flex-wrap items-center gap-3 rounded-xl border border-gray-200 p-3"
                >
                  <div className="h-16 w-20 overflow-hidden rounded-lg bg-slate-100">
                    {report.imageUrl ? (
                      <img src={report.imageUrl} alt={report.type} className="h-full w-full object-cover" />
                    ) : null}
                  </div>
                  <div className="min-w-[220px] flex-1">
                    <p className="font-semibold text-[#0A192F]">{report.type}</p>
                    <p className="text-xs text-slate-500">
                      {report.description || "No description provided"}
                    </p>
                    <p className="text-xs text-slate-400">
                      {report.timestamp ? new Date(report.timestamp).toLocaleString() : "Just now"}
                    </p>
                  </div>
                  <span className={`rounded-full px-2 py-1 text-xs font-semibold ${statusBadge(report.status)}`}>
                    {report.status}
                  </span>
                  <span className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-600">
                    {report.assignedCrew ? report.assignedCrew : "Unassigned"}
                  </span>
                  <div className="ml-auto flex gap-2">
                    <button
                      onClick={() => void dispatchCrew(report)}
                      disabled={report.status === "Resolved"}
                      className="rounded-lg bg-[#00B4D8] px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-cyan-600 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {report.status === "Dispatched" ? "Reassign Crew" : "Dispatch Crew"}
                    </button>
                    <button
                      onClick={() => void markResolved(report)}
                      disabled={report.status === "Resolved"}
                      className="rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Mark Resolved
                    </button>
                  </div>
                </article>
              ))
            )}
          </div>
        </section>
        )}

        {activeSection === "settings" && (
          <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <h3 className="mb-3 text-lg font-semibold text-[#0A192F]">Settings</h3>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div className="rounded-xl border border-gray-200 p-3">
                <p className="text-sm font-semibold text-[#0A192F]">Ward</p>
                <p className="text-sm text-slate-600">Ward 10</p>
              </div>
              <div className="rounded-xl border border-gray-200 p-3">
                <p className="text-sm font-semibold text-[#0A192F]">Dispatch Teams</p>
                <p className="text-sm text-slate-600">{CREWS.length} active crews</p>
              </div>
              <div className="rounded-xl border border-gray-200 p-3 md:col-span-2">
                <p className="text-sm font-semibold text-[#0A192F]">Operational Notes</p>
                <p className="text-sm text-slate-600">
                  This demo is running without authentication for pitch flow. Crew assignment and status updates
                  are live in Firestore when configured.
                </p>
              </div>
            </div>
          </section>
        )}
      </main>
    </Layout>
  );
}
