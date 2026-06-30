"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { Boxes } from "lucide-react";
import { navigationItems } from "@/constants/navigation";

export default function Sidebar({ mobile = false, onNavigate }) {
  const pathname = usePathname();

  return (
    <aside
      className={clsx(
        "flex h-full flex-col border-r border-slate-200 bg-white",
        mobile ? "w-full" : "w-72"
      )}
    >
      <div className="flex h-16 items-center gap-3 border-b border-slate-200 px-5">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-950 text-white">
          <Boxes size={20} />
        </div>

        <div>
          <h1 className="text-sm font-semibold leading-5 text-slate-950">
         Saroya Chemicals
          </h1>
          <p className="text-xs text-slate-500">Admin Operations Portal</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {navigationItems.map((item) => {
          const active =
            pathname === item.href || pathname.startsWith(`${item.href}/`);

          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={clsx(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition",
                active
                  ? "bg-slate-950 text-white shadow-sm"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"
              )}
            >
              <Icon size={18} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* <div className="border-t border-slate-200 p-4">
        <div className="rounded-2xl bg-slate-50 p-3">
          <p className="text-xs font-medium text-slate-900">Current Flow</p>
          <p className="mt-1 text-xs leading-5 text-slate-500">
            Vendor → Raw Material → Production → Product → Customer Invoice
          </p>
        </div>
      </div> */}
    </aside>
  );
}