import { createContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { addReport, subscribeToReports, updateReportStatus } from "../services/reportService";
import type { CreateReportInput, Report, ReportStatus } from "../types/report";

interface ReportsContextValue {
  reports: Report[];
  loading: boolean;
  addNewReport: (input: CreateReportInput) => Promise<void>;
  changeReportStatus: (id: string, status: ReportStatus) => Promise<void>;
}

export const ReportsContext = createContext<ReportsContextValue | undefined>(undefined);

export function ReportsProvider({ children }: { children: ReactNode }) {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = subscribeToReports((incomingReports) => {
      setReports(incomingReports);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = useMemo(
    () => ({
      reports,
      loading,
      addNewReport: addReport,
      changeReportStatus: updateReportStatus
    }),
    [reports, loading]
  );

  return <ReportsContext.Provider value={value}>{children}</ReportsContext.Provider>;
}
