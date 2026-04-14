import type { Report } from "../types/report";

interface ReportListProps {
  reports: Report[];
  emptyMessage?: string;
}

export default function ReportList({ reports, emptyMessage = "No reports yet." }: ReportListProps) {
  if (reports.length === 0) {
    return <p className="rounded-xl bg-white p-4 text-sm text-slate-500 shadow">{emptyMessage}</p>;
  }

  return (
    <div className="space-y-3">
      {reports.map((report) => (
        <article key={report.id} className="rounded-xl bg-white p-4 shadow">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold capitalize">{report.type}</h3>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium">
              {report.status}
            </span>
          </div>
          {report.description ? (
            <p className="mt-2 text-sm text-slate-600">{report.description}</p>
          ) : null}
          <p className="mt-2 text-xs text-slate-500">
            {report.location.lat}, {report.location.lng}
          </p>
        </article>
      ))}
    </div>
  );
}
