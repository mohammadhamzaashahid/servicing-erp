"use client";

import { useMemo, useState } from "react";
import { AlertCircle, RefreshCw, Search } from "lucide-react";
import Button from "@/components/ui/Button";
import DataTable from "@/components/ui/DataTable";
import Select from "@/components/ui/Select";
import Badge from "@/components/ui/Badge";
import { useLedgerEntries } from "@/modules/ledgers/ledger.hooks";
import { formatDate, formatMoney } from "@/lib/format";

function getPartyTypeBadge(type) {
  if (type === "VENDOR") {
    return <Badge variant="yellow">Vendor</Badge>;
  }

  if (type === "CUSTOMER") {
    return <Badge variant="green">Customer</Badge>;
  }

  return <Badge variant="slate">{type || "-"}</Badge>;
}

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

function getLedgerDebit(row) {
  if (row.entryType === "DEBIT") {
    return Number(row.amount || 0);
  }

  return 0;
}

function getLedgerCredit(row) {
  if (row.entryType === "CREDIT") {
    return Number(row.amount || 0);
  }

  return 0;
}

export default function LedgersPage() {
  const [partyType, setPartyType] = useState("");
  const [sourceType, setSourceType] = useState("");
  const [appliedPartyType, setAppliedPartyType] = useState("");
  const [appliedSourceType, setAppliedSourceType] = useState("");

  const queryParams = useMemo(
    () => ({
      page: 1,
      limit: 100,
      partyType: appliedPartyType,
      sourceType: appliedSourceType,
    }),
    [appliedPartyType, appliedSourceType]
  );

  const ledgerQuery = useLedgerEntries(queryParams);

  const rows = ledgerQuery.data?.data || [];
  const pagination = ledgerQuery.data?.pagination;

  const totals = useMemo(() => {
    return rows.reduce(
      (sum, row) => ({
        debit: sum.debit + getLedgerDebit(row),
        credit: sum.credit + getLedgerCredit(row),
      }),
      {
        debit: 0,
        credit: 0,
      }
    );
  }, [rows]);

  const handleSubmit = (event) => {
    event.preventDefault();

    setAppliedPartyType(partyType);
    setAppliedSourceType(sourceType);
  };

  const handleReset = () => {
    setPartyType("");
    setSourceType("");
    setAppliedPartyType("");
    setAppliedSourceType("");
  };

  const columns = [
    {
      key: "transactionDate",
      header: "Date",
      render: (row) => formatDate(row.transactionDate),
    },
    {
      key: "partyType",
      header: "Party Type",
      render: (row) => getPartyTypeBadge(row.partyType),
    },
    {
      key: "party",
      header: "Party",
      render: (row) => {
        const party = row.vendor || row.customer;

        return (
          <div>
            <p className="font-medium text-slate-900">{party?.name || "-"}</p>
            <p className="text-xs text-slate-500">
              {party?.vendorCode || party?.customerCode || ""}
            </p>
          </div>
        );
      },
    },
    {
      key: "description",
      header: "Description",
      render: (row) => (
        <span className="max-w-md text-slate-700">
          {row.description || "-"}
        </span>
      ),
    },
    {
      key: "debit",
      header: "Debit",
      render: (row) => {
        const debit = getLedgerDebit(row);

        return debit > 0 ? (
          <span className="font-semibold text-slate-950">
            {formatMoney(debit)}
          </span>
        ) : (
          <span className="text-slate-400">-</span>
        );
      },
    },
    {
      key: "credit",
      header: "Credit",
      render: (row) => {
        const credit = getLedgerCredit(row);

        return credit > 0 ? (
          <span className="font-semibold text-slate-950">
            {formatMoney(credit)}
          </span>
        ) : (
          <span className="text-slate-400">-</span>
        );
      },
    },
    {
      key: "entryType",
      header: "Entry",
      render: (row) => {
        if (row.entryType === "DEBIT") {
          return <Badge variant="green">Debit</Badge>;
        }

        if (row.entryType === "CREDIT") {
          return <Badge variant="yellow">Credit</Badge>;
        }

        return <Badge variant="slate">{row.entryType || "-"}</Badge>;
      },
    },
    {
      key: "sourceType",
      header: "Source",
      render: (row) => (
        <div>
          <p className="font-medium text-slate-900">
            {formatSourceType(row.sourceType)}
          </p>
          <p className="text-xs text-slate-500">{row.sourceId || ""}</p>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-sm font-medium text-slate-500">Accounts</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">
          Ledger Entries
        </h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
          Track vendor payable and customer receivable ledger entries generated
          from opening balances, material receiving, sales invoices, and future
          payment transactions.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Visible Debit Total</p>
          <p className="mt-2 text-2xl font-semibold text-slate-950">
            {formatMoney(totals.debit)}
          </p>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Visible Credit Total</p>
          <p className="mt-2 text-2xl font-semibold text-slate-950">
            {formatMoney(totals.credit)}
          </p>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
        <form
          onSubmit={handleSubmit}
          className="grid gap-3 md:grid-cols-[220px_260px_auto]"
        >
          <Select
            label="Party Type"
            value={partyType}
            onChange={(event) => setPartyType(event.target.value)}
          >
            <option value="">All Parties</option>
            <option value="VENDOR">Vendors</option>
            <option value="CUSTOMER">Customers</option>
          </Select>

          <Select
            label="Source Type"
            value={sourceType}
            onChange={(event) => setSourceType(event.target.value)}
          >
            <option value="">All Sources</option>
            <option value="OPENING_BALANCE">Opening Balance</option>
            <option value="MATERIAL_RECEIPT">Material Receipt</option>
            <option value="SALES_INVOICE">Sales Invoice</option>
            <option value="PAYMENT">Payment</option>
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

      {ledgerQuery.isError ? (
        <section className="rounded-3xl border border-red-200 bg-red-50 p-5 text-red-700">
          <div className="flex items-start gap-3">
            <AlertCircle size={20} className="mt-0.5" />
            <div>
              <h2 className="text-sm font-semibold">
                Unable to load ledger entries
              </h2>
              <p className="mt-1 text-sm">
                {ledgerQuery.error?.message || "Please try again."}
              </p>
            </div>
          </div>
        </section>
      ) : null}

      <section className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <p className="text-sm text-slate-500">
            {pagination
              ? `${pagination.total} total ledger entr${
                  pagination.total === 1 ? "y" : "ies"
                }`
              : "Ledger Entries"}
          </p>

          {ledgerQuery.isFetching && !ledgerQuery.isLoading ? (
            <p className="text-xs text-slate-400">Refreshing...</p>
          ) : null}
        </div>

        <DataTable
          columns={columns}
          rows={rows}
          loading={ledgerQuery.isLoading}
          emptyTitle="No ledger entries found"
          emptyDescription="Ledger entries will appear after opening balances, material receiving, sales invoices, or payments."
        />
      </section>
    </div>
  );
}