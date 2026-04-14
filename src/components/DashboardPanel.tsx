import { useReports } from "../hooks/useReports";
import type { ReportStatus } from "../types/report";

const statuses: ReportStatus[] = ["Reported", "Dispatched", "Resolved"];

export default function DashboardPanel() {
  const { reports, loading, changeReportStatus } = useReports();

  if (loading) {
    return <div className="rounded-xl bg-white p-4 shadow">Loading reports...</div>;
  }

  return (
    <section className="rounded-xl bg-white p-4 shadow">
      <h2 className="text-lg font-semibold">Ward report queue</h2>
      <p className="mt-1 text-sm text-slate-500">
        Status updates sync instantly with the citizen app.
      </p>
      <div className="mt-4 space-y-3">
        {reports.map((report) => (
          <article key={report.id} className="rounded-lg border border-slate-200 p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="font-medium capitalize">{report.type}</h3>
                <p className="text-xs text-slate-500">
                  {report.location.lat}, {report.location.lng}
                </p>
              </div>
              <select
                className="rounded-lg border border-slate-300 px-2 py-1 text-sm"
                value={report.status}
                onChange={(event) =>
                  void changeReportStatus(report.id, event.target.value as ReportStatus)
                }
              >
                {statuses.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
