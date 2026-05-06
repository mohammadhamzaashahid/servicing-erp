"use client";

import { X } from "lucide-react";
import clsx from "clsx";
import Button from "./Button";

export default function Drawer({
  open,
  title,
  description,
  children,
  footer,
  onClose,
  width = "max-w-xl",
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <button
        type="button"
        aria-label="Close drawer overlay"
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/30 backdrop-blur-[1px]"
      />

      <aside
        className={clsx(
          "absolute right-0 top-0 flex h-full w-full flex-col bg-white shadow-2xl",
          width
        )}
      >
        <div className="flex items-start justify-between border-b border-slate-200 px-5 py-4">
          <div>
            <h2 className="text-base font-semibold text-slate-950">{title}</h2>
            {description ? (
              <p className="mt-1 text-sm text-slate-500">{description}</p>
            ) : null}
          </div>

          <Button variant="ghost" size="sm" onClick={onClose}>
            <X size={18} />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-5">{children}</div>

        {footer ? (
          <div className="border-t border-slate-200 bg-slate-50 px-5 py-4">
            {footer}
          </div>
        ) : null}
      </aside>
    </div>
  );
}