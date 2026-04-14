import { BarChart3, Layers3, Settings, Trophy, Truck } from "lucide-react";

export type AdminSection = "overview" | "dispatch" | "analytics" | "leaderboard" | "settings";

interface AdminSidebarProps {
  activeSection: AdminSection;
  onSectionChange: (section: AdminSection) => void;
}

function getButtonClass(isActive: boolean) {
  return isActive
    ? "flex w-full items-center gap-2 rounded-xl bg-white/15 px-3 py-2 text-sm font-medium"
    : "flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-slate-200 hover:bg-white/10";
}

export default function AdminSidebar({ activeSection, onSectionChange }: AdminSidebarProps) {
  return (
    <aside className="flex h-full w-[250px] flex-col bg-[#0A192F] p-4 text-white">
      <div className="mb-6 border-b border-white/15 pb-4">
        <p className="text-xs uppercase tracking-[0.2em] text-cyan-300">SAHA-BHAGI</p>
        <h1 className="text-lg font-semibold">Ward 10 Dashboard</h1>
      </div>

      <div className="space-y-2">
        <button onClick={() => onSectionChange("overview")} className={getButtonClass(activeSection === "overview")}>
          <Layers3 size={16} />
          Overview
        </button>
        <button onClick={() => onSectionChange("dispatch")} className={getButtonClass(activeSection === "dispatch")}>
          <Truck size={16} />
          Dispatch
        </button>
        <button onClick={() => onSectionChange("analytics")} className={getButtonClass(activeSection === "analytics")}>
          <BarChart3 size={16} />
          Analytics
        </button>
        <button
          onClick={() => onSectionChange("leaderboard")}
          className={getButtonClass(activeSection === "leaderboard")}
        >
          <Trophy size={16} />
          Leaderboard
        </button>
        <button onClick={() => onSectionChange("settings")} className={getButtonClass(activeSection === "settings")}>
          <Settings size={16} />
          Settings
        </button>
      </div>
    </aside>
  );
}
