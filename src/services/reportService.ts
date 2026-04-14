import {
  addDoc,
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  updateDoc
} from "firebase/firestore";
import { db } from "../firebase/config";
import type { CreateReportInput, Report, ReportStatus } from "../types/report";

const reportsCollection = collection(db, "reports");

export async function addReport(input: CreateReportInput) {
  await addDoc(reportsCollection, {
    type: input.type,
    location: input.location,
    status: "Reported",
    timestamp: Date.now(),
    description: input.description ?? ""
  });
}

export function subscribeToReports(onData: (reports: Report[]) => void) {
  const q = query(reportsCollection, orderBy("timestamp", "desc"));

  return onSnapshot(q, (snapshot) => {
    const reports = snapshot.docs.map((item) => ({
      id: item.id,
      ...(item.data() as Omit<Report, "id">)
    }));
    onData(reports);
  });
}

export async function updateReportStatus(id: string, status: ReportStatus) {
  await updateDoc(doc(db, "reports", id), { status });
}
