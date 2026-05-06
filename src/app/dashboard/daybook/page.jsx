"use client";

import { useMemo, useState } from "react";
import { AlertCircle, BookOpen, RefreshCw, Search } from "lucide-react";
import Button from "@/components/ui/Button";
import DataTable from "@/components/ui/DataTable";
import Select from "@/components/ui/Select";
import Badge from "@/components/ui/Badge";
import { useDaybookEntries } from "@/modules/ledgers/ledger.hooks";
import { formatDate, formatMoney } from "@/lib/format";

function formatSourceType(type) {
  const labels = {
    OPENING_BALANCE: "Opening Balance",
    MATERIAL_RECEIPT: "Material Receipt",
    PRODUCTION_BATCH: "Production Batch",
    SALES_INVOICE: "Sales Invoice",
    PAYMENT: "Payment",
    STOCK_ADJUSTMENT: "Stock Adjustment",
  };

  return labels[type] || type || "-";
}

function getSourceBadge(sourceType) {
  if (sourceType === "MATERIAL_RECEIPT") {
    return <Badge variant="yellow">Material Receipt</Badge>;
  }

  if (sourceType === "SALES_INVOICE") {
    return <Badge variant="green">Sales Invoice</Badge>;
  }

  if (sourceType === "PRODUCTION_BATCH") {
    return <Badge variant="slate">Production</Badge>;
  }

  if (sourceType === "PAYMENT") {
    return <Badge variant="slate">Payment</Badge>;
  }

  if (sourceType === "OPENING_BALANCE") {
    return <Badge variant="slate">Opening Balance</Badge>;
  }

  return <Badge variant="slate">{formatSourceType(sourceType)}</Badge>;
}

export default function DaybookPage() {
  const [sourceType, setSourceType] = useState("");
  const [appliedSourceType, setAppliedSourceType] = useState("");

  const queryParams = useMemo(
    () => ({
      page: 1,
      limit: 100,
      sourceType: appliedSourceType,
    }),
    [appliedSourceType]
  );

  const daybookQuery = useDaybookEntries(queryParams);

  const rows = daybookQuery.data?.data || [];
  const pagination = daybookQuery.data?.pagination;

  const totals = useMemo(() => {
    return rows.reduce(
      (sum, row) => ({
        debit: sum.debit + Number(row.debitAmount || 0),
        credit: sum.credit + Number(row.creditAmount || 0),
      }),
      {
        debit: 0,
        credit: 0,
      }
    );
  }, [rows]);

  const difference = totals.debit - totals.credit;

  const handleSubmit = (event) => {
    event.preventDefault();
    setAppliedSourceType(sourceType);
  };

  const handleReset = () => {
    setSourceType("");
    setAppliedSourceType("");
  };

  const columns = [
    {
      key: "transactionDate",
      header: "Date",
      render: (row) => formatDate(row.transactionDate),
    },
    {
      key: "sourceType",
      header: "Source Type",
      render: (row) => getSourceBadge(row.sourceType),
    },
    {
      key: "description",
      header: "Description",
      render: (row) => (
        <span className="max-w-lg text-slate-700">
          {row.description || "-"}
        </span>
      ),
    },
    {
      key: "debitAmount",
      header: "Debit",
      render: (row) => {
        const value = Number(row.debitAmount || 0);

        return value > 0 ? (
          <span className="font-semibold text-slate-950">
            {formatMoney(value)}
          </span>
        ) : (
          <span className="text-slate-400">-</span>
        );
      },
    },
    {
      key: "creditAmount",
      header: "Credit",
      render: (row) => {
        const value = Number(row.creditAmount || 0);

        return value > 0 ? (
          <span className="font-semibold text-slate-950">
            {formatMoney(value)}
          </span>
        ) : (
          <span className="text-slate-400">-</span>
        );
      },
    },
    {
      key: "sourceId",
      header: "Source ID",
      render: (row) => (
        <span className="text-xs font-medium text-slate-500">
          {row.sourceId || "-"}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-950 text-white">
            <BookOpen size={20} />
          </div>

          <div>
            <p className="text-sm font-medium text-slate-500">Accounts</p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">
              Daybook
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
              Review debit and credit entries generated from daily business
              transactions. This screen gives a clear operational accounting
              view for owners and accountants.
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Visible Debit</p>
          <p className="mt-2 text-2xl font-semibold text-slate-950">
            {formatMoney(totals.debit)}
          </p>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Visible Credit</p>
          <p className="mt-2 text-2xl font-semibold text-slate-950">
            {formatMoney(totals.credit)}
          </p>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Difference</p>
          <p
            className={`mt-2 text-2xl font-semibold ${
              Math.abs(difference) < 0.001
                ? "text-emerald-700"
                : "text-red-700"
            }`}
          >
            {formatMoney(difference)}
          </p>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
        <form
          onSubmit={handleSubmit}
          className="grid gap-3 md:grid-cols-[280px_auto]"
        >
          <Select
            label="Source Type"
            value={sourceType}
            onChange={(event) => setSourceType(event.target.value)}
          >
            <option value="">All Sources</option>
            <option value="OPENING_BALANCE">Opening Balance</option>
            <option value="MATERIAL_RECEIPT">Material Receipt</option>
            <option value="PRODUCTION_BATCH">Production Batch</option>
            <option value="SALES_INVOICE">Sales Invoice</option>
            <option value="PAYMENT">Payment</option>
            <option value="STOCK_ADJUSTMENT">Stock Adjustment</option>
          </Select>

          <div className="flex items-end gap-2">
            <Button type="submit" variant="secondary">
              <Search size={16} />
              Apply
            </Button>

            <Button type="button" variant="ghost" onClick={handleReset}>
              <RefreshCw size={16} />
              Reset
            </Button>
          </div>
        </form>
      </section>

      {daybookQuery.isError ? (
        <section className="rounded-3xl border border-red-200 bg-red-50 p-5 text-red-700">
          <div className="flex items-start gap-3">
            <AlertCircle size={20} className="mt-0.5" />
            <div>
              <h2 className="text-sm font-semibold">
                Unable to load daybook entries
              </h2>
              <p className="mt-1 text-sm">
                {daybookQuery.error?.message || "Please try again."}
              </p>
            </div>
          </div>
        </section>
      ) : null}

      <section className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <p className="text-sm text-slate-500">
            {pagination
              ? `${pagination.total} total daybook entr${
                  pagination.total === 1 ? "y" : "ies"
                }`
              : "Daybook Entries"}
          </p>

          {daybookQuery.isFetching && !daybookQuery.isLoading ? (
            <p className="text-xs text-slate-400">Refreshing...</p>
          ) : null}
        </div>

        <DataTable
          columns={columns}
          rows={rows}
          loading={daybookQuery.isLoading}
          emptyTitle="No daybook entries found"
          emptyDescription="Daybook entries will appear after receiving, production, sales, payments, or stock adjustments."
        />
      </section>
    </div>
  );
}