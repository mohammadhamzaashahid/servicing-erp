"use client";

import { Menu, Search, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { clearAuth, getUser } from "@/lib/auth";
import Button from "@/components/ui/Button";

export default function Topbar({ onMenuClick }) {
  const router = useRouter();
  const user = getUser();

  const handleLogout = () => {
    clearAuth();
    router.replace("/login");
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white/90 px-4 backdrop-blur md:px-6">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          className="lg:hidden"
          onClick={onMenuClick}
        >
          <Menu size={20} />
        </Button>

        <div>
          <h2 className="text-sm font-semibold text-slate-950">
            Operations Panel
          </h2>
          <p className="hidden text-xs text-slate-500 sm:block">
            Manage inventory, manufacturing, sales, and ledgers
          </p>
        </div>
      </div>

      <div className="hidden w-full max-w-sm items-center rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 lg:flex">
        <Search size={16} className="text-slate-400" />
        <input
          placeholder="Search modules..."
          className="ml-2 w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
        />
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden text-right sm:block">
          <p className="text-sm font-medium text-slate-900">
            {user?.name || "Admin"}
          </p>
          <p className="text-xs text-slate-500">{user?.role || "ADMIN"}</p>
        </div>

        <Button variant="secondary" size="sm" onClick={handleLogout}>
          <LogOut size={16} />
          <span className="hidden sm:inline">Logout</span>
        </Button>
      </div>
    </header>
  );
}