export type ReportType = "pothole" | "waste" | "drain" | "streetlight" | "other";
export type ReportStatus = "Reported" | "Dispatched" | "Resolved";

export interface ReportLocation {
  lat: number;
  lng: number;
}

export interface Report {
  id: string;
  type: ReportType;
  location: ReportLocation;
  status: ReportStatus;
  timestamp: number;
  description?: string;
}

export interface CreateReportInput {
  type: ReportType;
  location: ReportLocation;
  description?: string;
}
