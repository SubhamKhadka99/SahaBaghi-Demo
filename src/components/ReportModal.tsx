import { Camera, Loader2, MapPinned, Send } from "lucide-react";
import { useMemo, useState, type FormEvent } from "react";

type IssueType = "Pothole" | "Blocked Drain" | "Waste Dumping" | "Broken Light";

interface ReportModalProps {
  open: boolean;
  submitting: boolean;
  onClose: () => void;
  onSubmit: (input: { type: IssueType; imageFile: File | null; description: string }) => Promise<void>;
}

const ISSUE_OPTIONS: IssueType[] = [
  "Pothole",
  "Blocked Drain",
  "Waste Dumping",
  "Broken Light"
];

export default function ReportModal({ open, submitting, onClose, onSubmit }: ReportModalProps) {
  const [issueType, setIssueType] = useState<IssueType>("Pothole");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [description, setDescription] = useState("");

  const previewUrl = useMemo(() => {
    if (!imageFile) {
      return "";
    }
    return URL.createObjectURL(imageFile);
  }, [imageFile]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    await onSubmit({ type: issueType, imageFile, description });
    setIssueType("Pothole");
    setImageFile(null);
    setDescription("");
  }

  if (!open) {
    return null;
  }

  return (
    <div className="absolute inset-0 z-[1000] bg-[#0A192F]/95 p-4 text-white">
      <form
        onSubmit={handleSubmit}
        className="flex h-full flex-col rounded-2xl border border-white/10 bg-white/5 p-4 shadow-2xl backdrop-blur"
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Report an Issue</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md px-2 py-1 text-sm text-slate-300 hover:bg-white/10"
          >
            Close
          </button>
        </div>

        <div className="mb-3 rounded-xl border border-white/10 bg-black/10 p-3">
          <p className="mb-2 text-xs uppercase tracking-widest text-cyan-300">Step 1</p>
          <label className="block cursor-pointer rounded-xl border border-dashed border-[#00B4D8]/70 bg-[#00B4D8]/10 p-3 text-center transition hover:bg-[#00B4D8]/20">
            <input
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0] ?? null;
                setImageFile(file);
              }}
            />
            <div className="mx-auto mb-1 flex w-fit items-center gap-2 rounded-full bg-white px-3 py-1 text-sm font-medium text-[#0A192F] shadow">
              <Camera size={16} />
              Capture Issue Photo
            </div>
            <p className="text-xs text-slate-300">Use your phone camera for proof</p>
          </label>
        </div>

        {previewUrl ? (
          <div className="mb-4">
            <p className="mb-1 text-xs text-slate-300">Preview</p>
            <img
              src={previewUrl}
              alt="Issue preview"
              className="h-24 w-24 rounded-lg border border-white/10 object-cover"
            />
          </div>
        ) : null}

        <div className="mb-4 rounded-xl border border-white/10 bg-black/10 p-3">
          <p className="mb-2 text-xs uppercase tracking-widest text-cyan-300">Step 2</p>
          <label className="mb-3 block text-sm font-medium text-slate-100">
            Issue Type
            <select
              value={issueType}
              onChange={(event) => setIssueType(event.target.value as IssueType)}
              className="mt-1 w-full rounded-xl border border-white/20 bg-white/10 px-3 py-2 outline-none ring-[#00B4D8] focus:ring-2"
            >
              {ISSUE_OPTIONS.map((option) => (
                <option key={option} value={option} className="text-[#0A192F]">
                  {option}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm font-medium text-slate-100">
            Description (Optional) - Add landmark details
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={3}
              className="mt-1 w-full rounded-xl border border-white/20 bg-white/10 px-3 py-2 outline-none ring-[#00B4D8] placeholder:text-slate-300 focus:ring-2"
              placeholder="Near school gate, beside Ward office..."
            />
          </label>
        </div>

        <div className="mt-auto rounded-xl border border-white/10 bg-black/10 p-3">
          <p className="mb-2 text-xs uppercase tracking-widest text-cyan-300">Step 3</p>
          <p className="mb-3 text-xs text-slate-300">
            We will fetch live GPS location and submit instantly.
          </p>
          <button
            type="submit"
            disabled={submitting}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#00B4D8] px-4 py-2.5 font-semibold text-white shadow-lg hover:bg-cyan-600 disabled:opacity-70"
          >
            {submitting ? <Loader2 className="animate-spin" size={18} /> : <MapPinned size={18} />}
            {submitting ? "Submitting..." : "Locate & Submit"}
          </button>
        </div>
      </form>
    </div>
  );
}
