import type { ReactNode } from "react";

interface LayoutProps {
  mode: "citizen" | "admin";
  children: ReactNode;
}

export default function Layout({ mode, children }: LayoutProps) {
  if (mode === "citizen") {
    return (
      <div className="min-h-screen w-full bg-slate-200 p-3 md:p-6">
        <div className="relative mx-auto flex h-[100dvh] max-w-md flex-col overflow-hidden rounded-2xl bg-gray-50 shadow-2xl">
          {children}
        </div>
      </div>
    );
  }

  return <div className="flex h-screen w-full overflow-hidden bg-gray-100">{children}</div>;
}
