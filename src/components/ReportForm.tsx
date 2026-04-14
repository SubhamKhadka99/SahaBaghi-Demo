import { useState, type FormEvent } from "react";
import { useReports } from "../hooks/useReports";
import type { ReportType } from "../types/report";

const issueTypes: ReportType[] = ["pothole", "waste", "drain", "streetlight", "other"];

export default function ReportForm() {
  const { addNewReport } = useReports();
  const [type, setType] = useState<ReportType>("pothole");
  const [description, setDescription] = useState("");
  const [lat, setLat] = useState("23.8103");
  const [lng, setLng] = useState("90.4125");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);

    try {
      await addNewReport({
        type,
        description,
        location: {
          lat: Number(lat),
          lng: Number(lng)
        }
      });
      setDescription("");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-xl bg-white p-4 shadow">
      <h2 className="text-lg font-semibold">Report an issue</h2>
      <p className="mt-1 text-sm text-slate-500">Help your ward by submitting quick updates.</p>

      <div className="mt-4 grid gap-3">
        <label className="text-sm">
          Issue type
          <select
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
            value={type}
            onChange={(event) => setType(event.target.value as ReportType)}
          >
            {issueTypes.map((issue) => (
              <option key={issue} value={issue}>
                {issue}
              </option>
            ))}
          </select>
        </label>

        <label className="text-sm">
          Description
          <textarea
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
            rows={3}
            placeholder="Short details..."
            value={description}
            onChange={(event) => setDescription(event.target.value)}
          />
        </label>

        <div className="grid grid-cols-2 gap-3">
          <label className="text-sm">
            Latitude
            <input
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
              value={lat}
              onChange={(event) => setLat(event.target.value)}
            />
          </label>
          <label className="text-sm">
            Longitude
            <input
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
              value={lng}
              onChange={(event) => setLng(event.target.value)}
            />
          </label>
        </div>
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="mt-4 w-full rounded-lg bg-brand-500 px-4 py-2 font-medium text-white hover:bg-brand-700 disabled:opacity-70"
      >
        {submitting ? "Submitting..." : "Submit report"}
      </button>
    </form>
  );
}
