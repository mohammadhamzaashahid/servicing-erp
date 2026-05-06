import clsx from "clsx";

export default function Input({
  label,
  error,
  className,
  inputClassName,
  ...props
}) {
  return (
    <label className={clsx("block", className)}>
      {label ? (
        <span className="mb-1.5 block text-xs font-medium text-slate-600">
          {label}
        </span>
      ) : null}

      <input
        className={clsx(
          "h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition",
          "placeholder:text-slate-400 focus:border-slate-400 focus:ring-4 focus:ring-slate-100",
          error && "border-red-300 focus:border-red-400 focus:ring-red-100",
          inputClassName
        )}
        {...props}
      />

      {error ? (
        <span className="mt-1 block text-xs text-red-600">{error}</span>
      ) : null}
    </label>
  );
}