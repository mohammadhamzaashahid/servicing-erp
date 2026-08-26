"use client";

import { useMemo, useState } from "react";
import { AlertCircle, Printer, RefreshCw, Search } from "lucide-react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import LoadingState from "@/components/ui/LoadingState";
import EmptyState from "@/components/ui/EmptyState";
import StatCard from "@/components/ui/StatCard";
import { useExpenseCategories } from "@/modules/expenseCategories/expenseCategory.hooks";
import { useDailyExpenseReport } from "@/modules/reports/reports.hooks";
import { formatDate, formatMoney } from "@/lib/format";

function firstDayOfMonthIso() {
  const date = new Date();
  return new Date(date.getFullYear(), date.getMonth(), 1).toLocaleDateString("en-CA");
}

function todayIso() {
  return new Date().toLocaleDateString("en-CA");
}

function formatDayHeading(dateKey) {
  return new Intl.DateTimeFormat("en-PK", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "2-digit",
  }).format(new Date(`${dateKey}T00:00:00`));
}

export default function DailyExpenseReportPage() {
  const [from, setFrom] = useState(firstDayOfMonthIso());
  const [to, setTo] = useState(todayIso());
  const [categoryId, setCategoryId] = useState("");
  const [appliedFilters, setAppliedFilters] = useState({
    from: firstDayOfMonthIso(),
    to: todayIso(),
    categoryId: "",
  });

  const categoriesQuery = useExpenseCategories({ page: 1, limit: 100 });
  const categories = categoriesQuery.data?.data || [];

  const reportParams = useMemo(() => appliedFilters, [appliedFilters]);
  const reportQuery = useDailyExpenseReport(reportParams);
  const report = reportQuery.data;

  const handleSubmit = (event) => {
    event.preventDefault();
    setAppliedFilters({ from, to, categoryId });
  };

  const handleReset = () => {
    const defaultFrom = firstDayOfMonthIso();
    const defaultTo = todayIso();
    setFrom(defaultFrom);
    setTo(defaultTo);
    setCategoryId("");
    setAppliedFilters({ from: defaultFrom, to: defaultTo, categoryId: "" });
  };

  return (
    <div className="space-y-5 print:space-y-3 print:bg-white">
      <section className="flex flex-col justify-between gap-4 border border-slate-300 bg-white p-4 print:border-0 print:border-b-2 print:border-slate-950 print:p-0 print:pb-3 md:flex-row md:items-start">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Accounting Report
          </p>
          <h1 className="mt-1 text-xl font-semibold text-slate-950">
            Date-wise Expense Report
          </h1>
          <p className="mt-1 text-sm text-slate-500 print:hidden">
            Expenses grouped by day for the selected period, with a category
            breakdown and grand total.
          </p>
        </div>

        <div className="flex flex-wrap gap-2 print:hidden">
          <Button
            variant="secondary"
            onClick={() => window.print()}
            disabled={!report}
          >
            <Printer size={16} />
            Print Report
          </Button>
        </div>
      </section>

      <section className="border border-slate-300 bg-white p-4 print:hidden">
        <form
          onSubmit={handleSubmit}
          className="grid gap-3 lg:grid-cols-[180px_180px_1fr_auto]"
        >
          <Input
            label="From date"
            type="date"
            value={from}
            max={to || undefined}
            onChange={(event) => setFrom(event.target.value)}
            required
          />

          <Input
            label="To date"
            type="date"
            value={to}
            min={from || undefined}
            onChange={(event) => setTo(event.target.value)}
            required
          />

          <Select
            label="Category"
            value={categoryId}
            onChange={(event) => setCategoryId(event.target.value)}
          >
            <option value="">All Categories</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </Select>

          <div className="flex items-end gap-2">
            <Button type="submit">
              <Search size={16} />
              Generate
            </Button>
            <Button type="button" variant="ghost" onClick={handleReset}>
              <RefreshCw size={16} />
              Reset
            </Button>
          </div>
        </form>
      </section>

      {reportQuery.isError ? (
        <section className="border border-red-300 bg-red-50 p-4 text-red-700 print:hidden">
          <div className="flex items-start gap-3">
            <AlertCircle size={20} className="mt-0.5" />
            <div>
              <h2 className="text-sm font-semibold">Unable to load report</h2>
              <p className="mt-1 text-sm">
                {reportQuery.error?.message || "Please try again."}
              </p>
            </div>
          </div>
        </section>
      ) : null}

      {reportQuery.isLoading ? <LoadingState title="Preparing expense report..." /> : null}

      {report ? (
        <>
          <section className="grid gap-4 border border-slate-300 bg-white p-4 print:grid-cols-2 print:border-x-0 print:border-t-0 print:p-0 print:pb-3 lg:grid-cols-[1.2fr_1fr]">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Report Period
              </p>
              <h2 className="mt-1 text-lg font-semibold text-slate-950">
                {formatDate(appliedFilters.from)} — {formatDate(appliedFilters.to)}
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                {report.expenseCount} expense{report.expenseCount === 1 ? "" : "s"} across{" "}
                {report.days.length} day{report.days.length === 1 ? "" : "s"}
              </p>
            </div>

            <div className="lg:text-right">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Generated
              </p>
              <p className="mt-1 text-sm font-semibold text-slate-900">
                {formatDate(new Date())}
              </p>
            </div>
          </section>

          <section className="grid gap-0 sm:grid-cols-2 xl:grid-cols-3 print:grid-cols-3">
            <StatCard title="Grand Total" value={formatMoney(report.grandTotal)} />
            <StatCard
              title="Total Entries"
              value={String(report.expenseCount)}
              description={`${report.days.length} day(s) with activity`}
            />
            <StatCard
              title="Categories Used"
              value={String(report.categoryBreakdown.length)}
            />
          </section>

          {report.categoryBreakdown.length > 0 ? (
            <section className="overflow-hidden border border-slate-400 bg-white">
              <div className="border-b border-slate-300 bg-slate-50 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-600">
                Category Breakdown
              </div>
              <div className="divide-y divide-slate-100">
                {report.categoryBreakdown.map((category) => (
                  <div
                    key={category.categoryId}
                    className="flex items-center justify-between px-4 py-2 text-sm"
                  >
                    <span className="text-slate-700">{category.categoryName}</span>
                    <span className="font-semibold text-slate-950">
                      {formatMoney(category.total)}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          {report.days.length === 0 ? (
            <EmptyState
              title="No expenses in this period"
              description="Try widening the date range or clearing the category filter."
            />
          ) : (
            <section className="overflow-hidden border border-slate-400 bg-white">
              <div className="overflow-x-auto">
                <table className="w-full min-w-200 border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-950 text-left text-xs uppercase tracking-wide text-white print:bg-slate-100 print:text-slate-950">
                      <th className="border-r border-slate-700 px-3 py-3 font-semibold">
                        Expense No
                      </th>
                      <th className="border-r border-slate-700 px-4 py-3 font-semibold">
                        Category
                      </th>
                      <th className="border-r border-slate-700 px-4 py-3 font-semibold">
                        Paid To
                      </th>
                      <th className="border-r border-slate-700 px-4 py-3 font-semibold">Mode</th>
                      <th className="px-4 py-3 text-right font-semibold">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {report.days.map((day) => (
                      <FragmentDay key={day.date} day={day} />
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-slate-300 bg-slate-50 font-semibold text-slate-950">
                      <td colSpan={4} className="border-r border-slate-200 px-4 py-3 text-right uppercase tracking-wide">
                        Grand total
                      </td>
                      <td className="px-4 py-3 text-right">{formatMoney(report.grandTotal)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </section>
          )}
        </>
      ) : null}
    </div>
  );
}

function FragmentDay({ day }) {
  return (
    <>
      <tr className="bg-slate-100">
        <td colSpan={5} className="px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-700">
          {formatDayHeading(day.date)}
        </td>
      </tr>

      {day.rows.map((row) => (
        <tr key={row.id} className="text-slate-700">
          <td className="whitespace-nowrap border-r border-slate-200 px-3 py-2.5">
            {row.expenseNo}
          </td>
          <td className="border-r border-slate-200 px-4 py-2.5">{row.categoryName}</td>
          <td className="border-r border-slate-200 px-4 py-2.5">{row.payee || "-"}</td>
          <td className="border-r border-slate-200 px-4 py-2.5">{row.mode}</td>
          <td className="px-4 py-2.5 text-right font-medium text-slate-950">
            {formatMoney(row.amount)}
          </td>
        </tr>
      ))}

      <tr className="border-b border-slate-200 bg-slate-50/70">
        <td colSpan={4} className="border-r border-slate-200 px-4 py-2 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
          Day total
        </td>
        <td className="px-4 py-2 text-right text-sm font-semibold text-slate-950">
          {formatMoney(day.total)}
        </td>
      </tr>
    </>
  );
}
