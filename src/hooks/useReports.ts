import { useContext } from "react";
import { ReportsContext } from "../context/ReportsContext";

export function useReports() {
  const context = useContext(ReportsContext);
  if (!context) {
    throw new Error("useReports must be used within ReportsProvider");
  }
  return context;
}
