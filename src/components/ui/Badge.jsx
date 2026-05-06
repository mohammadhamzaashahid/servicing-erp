import clsx from "clsx";

const variants = {
  green: "bg-emerald-50 text-emerald-700 ring-emerald-600/10",
  red: "bg-red-50 text-red-700 ring-red-600/10",
  yellow: "bg-amber-50 text-amber-700 ring-amber-600/10",
  slate: "bg-slate-100 text-slate-700 ring-slate-600/10",
  blue: "bg-blue-50 text-blue-700 ring-blue-600/10",
};

export default function Badge({ children, variant = "slate", className }) {
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset",
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  );
}