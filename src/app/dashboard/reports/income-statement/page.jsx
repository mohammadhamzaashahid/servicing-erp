"use client";

import { useMemo, useState } from "react";
import { AlertCircle, Printer, RefreshCw, Search } from "lucide-react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import LoadingState from "@/components/ui/LoadingState";
import EmptyState from "@/components/ui/EmptyState";
import { useIncomeStatement } from "@/modules/reports/reports.hooks";
import { formatDate, formatMoney } from "@/lib/format";

function firstDayOfMonthIso() {
  const date = new Date();
  return new Date(date.getFullYear(), date.getMonth(), 1).toLocaleDateString("en-CA");
}

function todayIso() {
  return new Date().toLocaleDateString("en-CA");
}

function StatementRow({ label, value, bold, indent, borderTop, borderBottom, helper }) {
  return (
    <div
      className={`flex items-baseline justify-between px-1 py-2 ${
        borderTop ? "border-t border-slate-950" : ""
      } ${borderBottom ? "border-b border-slate-300" : ""}`}
    >
      <span
        className={`${indent ? "pl-6 text-sm text-slate-600" : "text-sm"} ${
          bold ? "font-bold uppercase tracking-wide text-slate-950" : "text-slate-800"
        }`}
      >
        {label}
      </span>
      <span className="flex items-baseline gap-2">
        {helper ? <span className="text-xs text-slate-400">{helper}</span> : null}
        <span
          className={`tabular-nums ${
            bold ? "text-base font-bold text-slate-950" : "text-sm text-slate-800"
          }`}
        >
          {value}
        </span>
      </span>
    </div>
  );
}

export default function IncomeStatementPage() {
  const [from, setFrom] = useState(firstDayOfMonthIso());
  const [to, setTo] = useState(todayIso());
  const [appliedFilters, setAppliedFilters] = useState({
    from: firstDayOfMonthIso(),
    to: todayIso(),
  });

  const params = useMemo(() => appliedFilters, [appliedFilters]);
  const statementQuery = useIncomeStatement(params);
  const statement = statementQuery.data;

  const handleSubmit = (event) => {
    event.preventDefault();
    setAppliedFilters({ from, to });
  };

  const handleReset = () => {
    const defaultFrom = firstDayOfMonthIso();
    const defaultTo = todayIso();
    setFrom(defaultFrom);
    setTo(defaultTo);
    setAppliedFilters({ from: defaultFrom, to: defaultTo });
  };

  return (
    <div className="space-y-5 print:space-y-3 print:bg-white">
      <section className="flex flex-col justify-between gap-4 border border-slate-300 bg-white p-4 print:hidden md:flex-row md:items-start">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Financial Report
          </p>
          <h1 className="mt-1 text-xl font-semibold text-slate-950">Income Statement</h1>
          <p className="mt-1 text-sm text-slate-500">
            Net Sales, Cost of Sales, Gross Profit, and Operating Expenses for
            the selected period.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={() => window.print()} disabled={!statement}>
            <Printer size={16} />
            Print Statement
          </Button>
        </div>
      </section>

      <section className="border border-slate-300 bg-white p-4 print:hidden">
        <form onSubmit={handleSubmit} className="grid gap-3 sm:grid-cols-[180px_180px_auto]">
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

      {statementQuery.isError ? (
        <section className="border border-red-300 bg-red-50 p-4 text-red-700 print:hidden">
          <div className="flex items-start gap-3">
            <AlertCircle size={20} className="mt-0.5" />
            <div>
              <h2 className="text-sm font-semibold">Unable to load income statement</h2>
              <p className="mt-1 text-sm">
                {statementQuery.error?.message || "Please try again."}
              </p>
            </div>
          </div>
        </section>
      ) : null}

      {statementQuery.isLoading ? <LoadingState title="Preparing income statement..." /> : null}

      {statement ? (
        <section className="mx-auto max-w-3xl border-2 border-slate-950 bg-white p-8 print:border-0 print:p-0">
          <div className="border-b-4 border-double border-slate-950 pb-4 text-center">
            <h2 className="text-2xl font-bold uppercase tracking-wide text-slate-950">
              Saroya Chemicals
            </h2>
            <p className="mt-1 text-lg font-semibold uppercase tracking-widest text-slate-700">
              Income Statement
            </p>
            <p className="mt-2 text-sm text-slate-500">
              For the period {formatDate(appliedFilters.from)} to {formatDate(appliedFilters.to)}
            </p>
          </div>

          <div className="mt-6 space-y-1">
            <StatementRow label="Net Sales" value={formatMoney(statement.revenue.netSales)} />
            <StatementRow
              label="Cost of Sales"
              value={formatMoney(statement.costOfSales.total)}
              borderBottom
            />
            <StatementRow
              label="Gross Profit"
              value={formatMoney(statement.grossProfit.amount)}
              bold
              helper={`${statement.grossProfit.marginPercent}% margin`}
            />

            <div className="pt-6" />

            <p className="px-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Selling and Operating Expenses
            </p>
            {statement.operatingExpenses.selling.lines.length === 0 ? (
              <StatementRow label="No operating expenses recorded" value="-" indent />
            ) : (
              statement.operatingExpenses.selling.lines.map((line) => (
                <StatementRow
                  key={line.categoryId}
                  label={line.categoryName}
                  value={formatMoney(line.amount)}
                  indent
                />
              ))
            )}
            <StatementRow
              label="Total Selling and Operating Expenses"
              value={formatMoney(statement.operatingExpenses.selling.total)}
              borderBottom
            />

            <div className="pt-4" />

            <p className="px-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
              General and Administrative Expenses
            </p>
            {statement.operatingExpenses.admin.lines.length === 0 ? (
              <StatementRow label="No administrative expenses recorded" value="-" indent />
            ) : (
              statement.operatingExpenses.admin.lines.map((line) => (
                <StatementRow
                  key={line.categoryId}
                  label={line.categoryName}
                  value={formatMoney(line.amount)}
                  indent
                />
              ))
            )}
            <StatementRow
              label="Total General and Administrative Expenses"
              value={formatMoney(statement.operatingExpenses.admin.total)}
              borderBottom
            />

            <StatementRow
              label="Total Operating Expenses"
              value={formatMoney(statement.operatingExpenses.total)}
              bold
              borderTop
            />

            <StatementRow
              label="Operating Income"
              value={formatMoney(statement.operatingIncome.amount)}
              bold
              borderTop
              helper={`${statement.operatingIncome.marginPercent}% margin`}
            />
          </div>

          <p className="mt-8 text-center text-xs text-slate-400">
            Generated {formatDate(new Date())} · {statement.revenue.invoiceCount} sales invoice
            {statement.revenue.invoiceCount === 1 ? "" : "s"} in period
          </p>
        </section>
      ) : null}

      {!statementQuery.isLoading && !statement && !statementQuery.isError ? (
        <EmptyState
          title="Select a period"
          description="Choose a from/to date range and generate the income statement."
        />
      ) : null}
    </div>
  );
}
