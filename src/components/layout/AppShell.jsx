"use client";

import { useState } from "react";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

export default function AppShell({ children }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="hidden print:hidden lg:fixed lg:inset-y-0 lg:left-0 lg:block">
        <Sidebar />
      </div>

      {mobileOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-slate-950/30"
            onClick={() => setMobileOpen(false)}
            aria-label="Close sidebar"
          />
          <div className="absolute inset-y-0 left-0 w-80 max-w-[85vw] bg-white shadow-2xl">
            <Sidebar mobile onNavigate={() => setMobileOpen(false)} />
          </div>
        </div>
      ) : null}

      <div className="print:pl-0 lg:pl-72">
        <div className="print:hidden">
          <Topbar onMenuClick={() => setMobileOpen(true)} />
        </div>

        <main className="mx-auto w-full max-w-[1600px] px-4 py-5 print:max-w-none print:p-0 md:px-6 lg:px-8">
          {children}
        </main>
      </div>
    </div>
  );
}
