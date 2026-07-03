"use client";

import { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  AlertCircle,
  Printer,
  RefreshCw,
  Search,
  WalletCards,
} from "lucide-react";
import Button from "@/components/ui/Button";
import Drawer from "@/components/ui/Drawer";
import Input from "@/components/ui/Input";
import LookupSelect from "@/components/ui/LookupSelect";
import LoadingState from "@/components/ui/LoadingState";
import EmptyState from "@/components/ui/EmptyState";
import Select from "@/components/ui/Select";
import Textarea from "@/components/ui/Textarea";
import { useCustomers } from "@/modules/customers/customer.hooks";
import { useVendors } from "@/modules/vendors/vendor.hooks";
import {
  useCustomerStatement,
  useRecordCustomerPayment,
  useVendorStatement,
  useRecordVendorPayment,
} from "@/modules/ledgers/ledger.hooks";
import { formatDate, formatMoney, formatQty } from "@/lib/format";

function formatCustomerSourceType(type) {
  const labels = {
    OPENING_BALANCE: "Opening Balance",
    SALES_INVOICE: "Sales Invoice",
    PAYMENT: "Payment Received",
    STOCK_ADJUSTMENT: "Adjustment",
  };
  return labels[type] || type || "Transaction";
}

function formatVendorSourceType(type) {
  const labels = {
    OPENING_BALANCE: "Opening Balance",
    MATERIAL_RECEIPT: "Material Receipt",
    PAYMENT: "Payment Made",
    STOCK_ADJUSTMENT: "Adjustment",
  };
  return labels[type] || type || "Transaction";
}

function formatBalance(value) {
  const amount = Math.abs(Number(value || 0));
  return formatMoney(amount);
}

function formatRunningBalance(value) {
  const balance = Number(value || 0);
  const formatted = formatMoney(Math.abs(balance));
  return balance < 0 ? `(${formatted})` : formatted;
}

function formatLedgerDate(value) {
  if (!value) return "-";
  const date = new Date(value);
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = String(date.getFullYear()).slice(-2);
  return `${day}.${month}.${year}`;
}

function SummaryCard({ label, value, helper }) {
  return (
    <div className="border border-slate-300 bg-white p-3 text-slate-950">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className="mt-1 text-lg font-semibold">{value}</p>
      {helper ? <p className="mt-1 text-xs text-slate-500">{helper}</p> : null}
    </div>
  );
}

function LedgerTabs({ activeTab, onChange }) {
  return (
    <div className="flex border-b border-slate-300 bg-white print:hidden">
      <button
        type="button"
        onClick={() => onChange("customer")}
        className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
          activeTab === "customer"
            ? "border-slate-950 text-slate-950"
            : "border-transparent text-slate-500 hover:text-slate-700"
        }`}
      >
        Customer Ledger
      </button>
      <button
        type="button"
        onClick={() => onChange("vendor")}
        className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
          activeTab === "vendor"
            ? "border-slate-950 text-slate-950"
            : "border-transparent text-slate-500 hover:text-slate-700"
        }`}
      >
        Vendor Ledger
      </button>
    </div>
  );
}

function StatementTable({ rows, summary, appliedFilters, formatSourceType }) {
  return (
    <section className="overflow-hidden border border-slate-400 bg-white">
      <div className="overflow-x-auto">
        <table className="w-full min-w-262.5 border-collapse text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-950 text-left text-xs uppercase tracking-wide text-white print:bg-slate-100 print:text-slate-950">
              <th className="border-r border-slate-700 px-3 py-3 text-center font-semibold">#</th>
              <th className="border-r border-slate-700 px-3 py-3 font-semibold">Date</th>
              <th className="border-r border-slate-700 px-4 py-3 font-semibold">Particulars</th>
              <th className="border-r border-slate-700 px-3 py-3 text-right font-semibold">Qty</th>
              <th className="border-r border-slate-700 px-3 py-3 text-right font-semibold">Rate</th>
              <th className="border-r border-slate-700 px-4 py-3 text-right font-semibold">Debit</th>
              <th className="border-r border-slate-700 px-4 py-3 text-right font-semibold">Credit</th>
              <th className="px-4 py-3 text-right font-semibold">Balance</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {Number(summary.openingBalance) !== 0 ? (
              <tr className="bg-slate-50 font-medium text-slate-700">
                <td className="border-r border-slate-200 px-3 py-3 text-center">-</td>
                <td className="border-r border-slate-200 px-3 py-3">{appliedFilters.from ? formatLedgerDate(appliedFilters.from) : "-"}</td>
                <td className="border-r border-slate-200 px-4 py-3">Balance brought forward</td>
                <td className="border-r border-slate-200 px-3 py-3 text-right">-</td>
                <td className="border-r border-slate-200 px-3 py-3 text-right">-</td>
                <td className="border-r border-slate-200 px-4 py-3 text-right">-</td>
                <td className="border-r border-slate-200 px-4 py-3 text-right">-</td>
                <td className="px-4 py-3 text-right font-semibold">
                  {formatRunningBalance(summary.openingBalance)}
                </td>
              </tr>
            ) : null}

            {rows.map((row, index) => (
              <tr key={row.id} className="align-top text-slate-700">
                <td className="border-r border-slate-200 px-3 py-3 text-center text-slate-500">
                  {index + 1}
                </td>
                <td className="whitespace-nowrap border-r border-slate-200 px-3 py-3">
                  {formatLedgerDate(row.transactionDate)}
                </td>
                <td className="border-r border-slate-200 px-4 py-3">
                  <p className="font-medium text-slate-900">{row.description}</p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {row.reference || formatSourceType(row.sourceType)}
                  </p>
                </td>
                <td className="border-r border-slate-200 px-3 py-3 text-right">
                  {row.quantity ? formatQty(row.quantity) : "-"}
                </td>
                <td className="border-r border-slate-200 px-3 py-3 text-right">
                  {row.rate ? formatMoney(row.rate) : "-"}
                </td>
                <td className="border-r border-slate-200 px-4 py-3 text-right font-medium text-slate-950">
                  {Number(row.debit) > 0 ? formatMoney(row.debit) : "-"}
                </td>
                <td className="border-r border-slate-200 px-4 py-3 text-right font-medium text-slate-950">
                  {Number(row.credit) > 0 ? formatMoney(row.credit) : "-"}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-right font-semibold text-slate-950">
                  {formatRunningBalance(row.balance)}
                </td>
              </tr>
            ))}

            {rows.length === 0 && Number(summary.openingBalance) === 0 ? (
              <tr>
                <td colSpan={8} className="px-6 py-12 text-center text-slate-500">
                  No transactions found for this statement period.
                </td>
              </tr>
            ) : null}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-slate-300 bg-slate-50 font-semibold text-slate-950">
              <td colSpan={5} className="border-r border-slate-200 px-4 py-3 text-right uppercase tracking-wide">
                Period totals
              </td>
              <td className="border-r border-slate-200 px-4 py-3 text-right">{formatMoney(summary.totalDebit)}</td>
              <td className="border-r border-slate-200 px-4 py-3 text-right">{formatMoney(summary.totalCredit)}</td>
              <td className="px-4 py-3 text-right">
                {formatRunningBalance(summary.closingBalance)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </section>
  );
}

function CustomerLedgerPage() {
  const searchParams = useSearchParams();
  const linkedCustomerId = searchParams.get("customerId") || "";
  const [customerId, setCustomerId] = useState(linkedCustomerId);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [appliedFilters, setAppliedFilters] = useState({
    customerId: linkedCustomerId,
    from: "",
    to: "",
  });
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [paymentError, setPaymentError] = useState("");
  const [paymentForm, setPaymentForm] = useState({
    amount: "",
    paymentDate: new Date().toLocaleDateString("en-CA"),
    mode: "CASH",
    remarks: "",
  });

  const customersQuery = useCustomers({ page: 1, limit: 100 });
  const customers = customersQuery.data?.data || [];
  const statementParams = useMemo(
    () => ({ from: appliedFilters.from, to: appliedFilters.to }),
    [appliedFilters.from, appliedFilters.to]
  );
  const statementQuery = useCustomerStatement(
    appliedFilters.customerId,
    statementParams
  );
  const paymentMutation = useRecordCustomerPayment();
  const statement = statementQuery.data;
  const summary = statement?.summary;
  const rows = statement?.rows || [];

  const handleSubmit = (event) => {
    event.preventDefault();
    setAppliedFilters({ customerId, from, to });
  };

  const handleReset = () => {
    setCustomerId("");
    setFrom("");
    setTo("");
    setAppliedFilters({ customerId: "", from: "", to: "" });
    window.history.replaceState(null, "", "/dashboard/ledgers");
  };

  const openPaymentDrawer = () => {
    setPaymentError("");
    setPaymentForm({
      amount:
        Number(statement?.customer?.currentBalance) > 0
          ? String(statement.customer.currentBalance)
          : "",
      paymentDate: new Date().toLocaleDateString("en-CA"),
      mode: "CASH",
      remarks: "",
    });
    setPaymentOpen(true);
  };

  const handlePaymentSubmit = async (event) => {
    event.preventDefault();
    setPaymentError("");
    try {
      await paymentMutation.mutateAsync({
        customerId: statement.customer.id,
        payload: {
          amount: Number(paymentForm.amount),
          paymentDate: paymentForm.paymentDate,
          mode: paymentForm.mode,
          remarks: paymentForm.remarks.trim() || null,
        },
      });
      setPaymentOpen(false);
    } catch (error) {
      setPaymentError(error.message || "Unable to record customer payment");
    }
  };

  const closingSide = summary?.balanceSide || "";

  return (
    <div className="space-y-5 print:space-y-3 print:bg-white">
      <section className="flex flex-col justify-between gap-4 border border-slate-300 bg-white p-4 print:border-0 print:border-b-2 print:border-slate-950 print:p-0 print:pb-3 md:flex-row md:items-start">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Accounts Receivable</p>
          <h1 className="mt-1 text-xl font-semibold text-slate-950">
            Customer Ledger
          </h1>
          <p className="mt-1 text-sm text-slate-500 print:hidden">
            Customer transactions, payments, and running balance.
          </p>
        </div>

        <div className="flex flex-wrap gap-2 print:hidden">
          <Button onClick={openPaymentDrawer} disabled={!statement}>
            <WalletCards size={16} />
            Record Payment
          </Button>
          <Button
            variant="secondary"
            onClick={() => window.print()}
            disabled={!statement}
          >
            <Printer size={16} />
            Print Ledger
          </Button>
        </div>
      </section>

      <section className="border border-slate-300 bg-white p-4 print:hidden">
        <form
          onSubmit={handleSubmit}
          className="grid gap-3 lg:grid-cols-[minmax(260px,1fr)_180px_180px_auto]"
        >
          <LookupSelect
            label="Customer"
            value={customerId}
            onChange={setCustomerId}
            options={customers}
            loading={customersQuery.isLoading}
            placeholder="Select a customer"
            getOptionLabel={(customer) => customer.name}
            getOptionDescription={(customer) => customer.customerCode}
          />

          <Input
            label="From date"
            type="date"
            value={from}
            max={to || undefined}
            onChange={(event) => setFrom(event.target.value)}
          />

          <Input
            label="To date"
            type="date"
            value={to}
            min={from || undefined}
            onChange={(event) => setTo(event.target.value)}
          />

          <div className="flex items-end gap-2">
            <Button type="submit" disabled={!customerId}>
              <Search size={16} />
              View Statement
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
              <h2 className="text-sm font-semibold">Unable to load statement</h2>
              <p className="mt-1 text-sm">
                {statementQuery.error?.message || "Please try again."}
              </p>
            </div>
          </div>
        </section>
      ) : null}

      {!appliedFilters.customerId ? (
        <EmptyState
          title="Select a customer"
          description="Choose a customer and date range to prepare their ledger statement."
        />
      ) : null}

      {statementQuery.isLoading ? (
        <LoadingState title="Preparing customer ledger..." />
      ) : null}

      {statement ? (
        <>
          <section className="grid gap-4 border border-slate-300 bg-white p-4 print:grid-cols-2 print:border-x-0 print:border-t-0 print:p-0 print:pb-3 lg:grid-cols-[1.2fr_1fr]">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Statement For
              </p>
              <h2 className="mt-1 text-lg font-semibold text-slate-950">
                {statement.customer.name}
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                {statement.customer.customerCode}
                {statement.customer.phone ? ` · ${statement.customer.phone}` : ""}
              </p>
              <p className="text-sm text-slate-500">
                {[statement.customer.address, statement.customer.city]
                  .filter(Boolean)
                  .join(", ") || "No address provided"}
              </p>
            </div>

            <div className="lg:text-right">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Statement Period
              </p>
              <p className="mt-1 text-sm font-semibold text-slate-900">
                {appliedFilters.from ? formatDate(appliedFilters.from) : "Beginning"}
                {" — "}
                {appliedFilters.to ? formatDate(appliedFilters.to) : "Today"}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Generated {formatDate(new Date())}
              </p>
            </div>
          </section>

          <section className="grid gap-0 sm:grid-cols-2 xl:grid-cols-4 print:grid-cols-4">
            <SummaryCard
              label="Balance B/F"
              value={formatBalance(summary.openingBalance)}
              helper="Balance before this period"
            />
            <SummaryCard
              label="Total Debit"
              value={formatMoney(summary.totalDebit)}
              helper="Invoices and charges"
            />
            <SummaryCard
              label="Total Credit"
              value={formatMoney(summary.totalCredit)}
              helper="Payments and adjustments"
            />
            <SummaryCard
              label={closingSide === "DR" ? "Closing Receivable" : "Customer Advance"}
              value={formatBalance(summary.closingBalance)}
              helper={`${summary.outstandingInvoiceCount} outstanding invoice${
                summary.outstandingInvoiceCount === 1 ? "" : "s"
              }`}
            />
          </section>

          <StatementTable
            rows={rows}
            summary={summary}
            appliedFilters={appliedFilters}
            formatSourceType={formatCustomerSourceType}
          />

          <section className="grid gap-0 sm:grid-cols-2 print:grid-cols-2">
            <div className="border border-slate-300 bg-white p-3">
              <p className="text-xs uppercase tracking-wide text-slate-500">
                Outstanding invoice balance
              </p>
              <p className="mt-1 text-lg font-semibold text-slate-950">
                {formatMoney(summary.outstandingInvoiceBalance)}
              </p>
            </div>
            <div className="border border-slate-300 bg-white p-3 sm:text-right">
              <p className="text-xs uppercase tracking-wide text-slate-500">
                Current account receivable
              </p>
              <p className="mt-1 text-lg font-semibold text-slate-950">
                {formatMoney(summary.currentBalance)} 
              </p>
            </div>
          </section>
        </>
      ) : null}

      <Drawer
        open={paymentOpen}
        title="Record Customer Payment"
        description={
          statement
            ? `Post a credit receipt for ${statement.customer.name}. It will be allocated to the oldest outstanding invoices first.`
            : "Post a customer payment."
        }
        onClose={() => !paymentMutation.isPending && setPaymentOpen(false)}
        width="max-w-xl"
      >
        <form onSubmit={handlePaymentSubmit} className="space-y-5">
          {paymentError ? (
            <div className="border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
              {paymentError}
            </div>
          ) : null}

          <div className="border border-slate-300 bg-slate-50 p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Current receivable
            </p>
            <p className="mt-1 text-xl font-semibold text-slate-950">
              {formatMoney(statement?.customer?.currentBalance)} 
            </p>
            <p className="mt-1 text-xs text-slate-500">
              The receipt will reduce this balance and update outstanding invoices.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Amount received"
              type="number"
              min="0.01"
              max={statement?.customer?.currentBalance || undefined}
              step="0.01"
              value={paymentForm.amount}
              onChange={(event) =>
                setPaymentForm((current) => ({
                  ...current,
                  amount: event.target.value,
                }))
              }
              required
            />
            <Input
              label="Payment date"
              type="date"
              value={paymentForm.paymentDate}
              onChange={(event) =>
                setPaymentForm((current) => ({
                  ...current,
                  paymentDate: event.target.value,
                }))
              }
              required
            />
          </div>

          <Select
            label="Payment mode"
            value={paymentForm.mode}
            onChange={(event) =>
              setPaymentForm((current) => ({
                ...current,
                mode: event.target.value,
              }))
            }
          >
            <option value="CASH">Cash</option>
            <option value="BANK">Bank</option>
            <option value="OTHER">Other</option>
          </Select>

          <Textarea
            label="Remarks"
            rows={3}
            value={paymentForm.remarks}
            onChange={(event) =>
              setPaymentForm((current) => ({
                ...current,
                remarks: event.target.value,
              }))
            }
            placeholder="Receipt reference, bank details, or optional note..."
          />

          <div className="flex justify-end gap-2 border-t border-slate-200 pt-4">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setPaymentOpen(false)}
              disabled={paymentMutation.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={paymentMutation.isPending}>
              <WalletCards size={16} />
              {paymentMutation.isPending ? "Posting..." : "Post Payment"}
            </Button>
          </div>
        </form>
      </Drawer>
    </div>
  );
}

function VendorLedgerPage() {
  const [vendorId, setVendorId] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [appliedFilters, setAppliedFilters] = useState({
    vendorId: "",
    from: "",
    to: "",
  });
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [paymentError, setPaymentError] = useState("");
  const [paymentForm, setPaymentForm] = useState({
    amount: "",
    paymentDate: new Date().toLocaleDateString("en-CA"),
    mode: "CASH",
    remarks: "",
  });

  const vendorsQuery = useVendors({ page: 1, limit: 100 });
  const vendors = vendorsQuery.data?.data || [];
  const statementParams = useMemo(
    () => ({ from: appliedFilters.from, to: appliedFilters.to }),
    [appliedFilters.from, appliedFilters.to]
  );
  const statementQuery = useVendorStatement(
    appliedFilters.vendorId,
    statementParams
  );
  const paymentMutation = useRecordVendorPayment();
  const statement = statementQuery.data;
  const summary = statement?.summary;
  const rows = statement?.rows || [];

  const handleSubmit = (event) => {
    event.preventDefault();
    setAppliedFilters({ vendorId, from, to });
  };

  const handleReset = () => {
    setVendorId("");
    setFrom("");
    setTo("");
    setAppliedFilters({ vendorId: "", from: "", to: "" });
  };

  const openPaymentDrawer = () => {
    setPaymentError("");
    setPaymentForm({
      amount:
        Number(statement?.vendor?.currentBalance) > 0
          ? String(statement.vendor.currentBalance)
          : "",
      paymentDate: new Date().toLocaleDateString("en-CA"),
      mode: "CASH",
      remarks: "",
    });
    setPaymentOpen(true);
  };

  const handlePaymentSubmit = async (event) => {
    event.preventDefault();
    setPaymentError("");
    try {
      await paymentMutation.mutateAsync({
        vendorId: statement.vendor.id,
        payload: {
          amount: Number(paymentForm.amount),
          paymentDate: paymentForm.paymentDate,
          mode: paymentForm.mode,
          remarks: paymentForm.remarks.trim() || null,
        },
      });
      setPaymentOpen(false);
    } catch (error) {
      setPaymentError(error.message || "Unable to record vendor payment");
    }
  };

  const closingSide = summary?.balanceSide || "CR";

  return (
    <div className="space-y-5 print:space-y-3 print:bg-white">
      <section className="flex flex-col justify-between gap-4 border border-slate-300 bg-white p-4 print:border-0 print:border-b-2 print:border-slate-950 print:p-0 print:pb-3 md:flex-row md:items-start">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Accounts Payable</p>
          <h1 className="mt-1 text-xl font-semibold text-slate-950">
            Vendor Ledger
          </h1>
          <p className="mt-1 text-sm text-slate-500 print:hidden">
            Vendor transactions, payments, and running balance.
          </p>
        </div>

        <div className="flex flex-wrap gap-2 print:hidden">
          <Button onClick={openPaymentDrawer} disabled={!statement}>
            <WalletCards size={16} />
            Record Payment
          </Button>
          <Button
            variant="secondary"
            onClick={() => window.print()}
            disabled={!statement}
          >
            <Printer size={16} />
            Print Ledger
          </Button>
        </div>
      </section>

      <section className="border border-slate-300 bg-white p-4 print:hidden">
        <form
          onSubmit={handleSubmit}
          className="grid gap-3 lg:grid-cols-[minmax(260px,1fr)_180px_180px_auto]"
        >
          <LookupSelect
            label="Vendor"
            value={vendorId}
            onChange={setVendorId}
            options={vendors}
            loading={vendorsQuery.isLoading}
            placeholder="Select a vendor"
            getOptionLabel={(vendor) => vendor.name}
            getOptionDescription={(vendor) => vendor.vendorCode}
          />

          <Input
            label="From date"
            type="date"
            value={from}
            max={to || undefined}
            onChange={(event) => setFrom(event.target.value)}
          />

          <Input
            label="To date"
            type="date"
            value={to}
            min={from || undefined}
            onChange={(event) => setTo(event.target.value)}
          />

          <div className="flex items-end gap-2">
            <Button type="submit" disabled={!vendorId}>
              <Search size={16} />
              View Statement
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
              <h2 className="text-sm font-semibold">Unable to load statement</h2>
              <p className="mt-1 text-sm">
                {statementQuery.error?.message || "Please try again."}
              </p>
            </div>
          </div>
        </section>
      ) : null}

      {!appliedFilters.vendorId ? (
        <EmptyState
          title="Select a vendor"
          description="Choose a vendor and date range to prepare their ledger statement."
        />
      ) : null}

      {statementQuery.isLoading ? (
        <LoadingState title="Preparing vendor ledger..." />
      ) : null}

      {statement ? (
        <>
          <section className="grid gap-4 border border-slate-300 bg-white p-4 print:grid-cols-2 print:border-x-0 print:border-t-0 print:p-0 print:pb-3 lg:grid-cols-[1.2fr_1fr]">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Statement For
              </p>
              <h2 className="mt-1 text-lg font-semibold text-slate-950">
                {statement.vendor.name}
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                {statement.vendor.vendorCode}
                {statement.vendor.phone ? ` · ${statement.vendor.phone}` : ""}
              </p>
              <p className="text-sm text-slate-500">
                {[statement.vendor.address, statement.vendor.city]
                  .filter(Boolean)
                  .join(", ") || "No address provided"}
              </p>
            </div>

            <div className="lg:text-right">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Statement Period
              </p>
              <p className="mt-1 text-sm font-semibold text-slate-900">
                {appliedFilters.from ? formatDate(appliedFilters.from) : "Beginning"}
                {" — "}
                {appliedFilters.to ? formatDate(appliedFilters.to) : "Today"}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Generated {formatDate(new Date())}
              </p>
            </div>
          </section>

          <section className="grid gap-0 sm:grid-cols-2 xl:grid-cols-4 print:grid-cols-4">
            <SummaryCard
              label="Balance B/F"
              value={formatBalance(summary.openingBalance)}
              helper="Balance before this period"
            />
            <SummaryCard
              label="Total Purchases"
              value={formatMoney(summary.totalDebit)}
              helper="Material receipts and charges"
            />
            <SummaryCard
              label="Total Payments"
              value={formatMoney(summary.totalCredit)}
              helper="Payments made to vendor"
            />
            <SummaryCard
              label={closingSide === "CR" ? "Closing Payable" : "Vendor Advance"}
              value={formatBalance(summary.closingBalance)}
              helper={`${summary.outstandingReceiptCount} outstanding receipt${
                summary.outstandingReceiptCount === 1 ? "" : "s"
              }`}
            />
          </section>

          <StatementTable
            rows={rows}
            summary={summary}
            appliedFilters={appliedFilters}
            formatSourceType={formatVendorSourceType}
          />

          <section className="grid gap-0 sm:grid-cols-2 print:grid-cols-2">
            <div className="border border-slate-300 bg-white p-3">
              <p className="text-xs uppercase tracking-wide text-slate-500">
                Outstanding receipt balance
              </p>
              <p className="mt-1 text-lg font-semibold text-slate-950">
                {formatMoney(summary.outstandingReceiptBalance)}
              </p>
            </div>
            <div className="border border-slate-300 bg-white p-3 sm:text-right">
              <p className="text-xs uppercase tracking-wide text-slate-500">
                Current account payable
              </p>
              <p className="mt-1 text-lg font-semibold text-slate-950">
                {formatMoney(summary.currentBalance)}
              </p>
            </div>
          </section>
        </>
      ) : null}

      <Drawer
        open={paymentOpen}
        title="Record Vendor Payment"
        description={
          statement
            ? `Post a payment to ${statement.vendor.name}. It will be allocated to the oldest outstanding receipts first.`
            : "Post a vendor payment."
        }
        onClose={() => !paymentMutation.isPending && setPaymentOpen(false)}
        width="max-w-xl"
      >
        <form onSubmit={handlePaymentSubmit} className="space-y-5">
          {paymentError ? (
            <div className="border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
              {paymentError}
            </div>
          ) : null}

          <div className="border border-slate-300 bg-slate-50 p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Current payable
            </p>
            <p className="mt-1 text-xl font-semibold text-slate-950">
              {formatMoney(statement?.vendor?.currentBalance)}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              The payment will reduce this balance and update outstanding receipts.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Amount paid"
              type="number"
              min="0.01"
              max={statement?.vendor?.currentBalance || undefined}
              step="0.01"
              value={paymentForm.amount}
              onChange={(event) =>
                setPaymentForm((current) => ({
                  ...current,
                  amount: event.target.value,
                }))
              }
              required
            />
            <Input
              label="Payment date"
              type="date"
              value={paymentForm.paymentDate}
              onChange={(event) =>
                setPaymentForm((current) => ({
                  ...current,
                  paymentDate: event.target.value,
                }))
              }
              required
            />
          </div>

          <Select
            label="Payment mode"
            value={paymentForm.mode}
            onChange={(event) =>
              setPaymentForm((current) => ({
                ...current,
                mode: event.target.value,
              }))
            }
          >
            <option value="CASH">Cash</option>
            <option value="BANK">Bank</option>
            <option value="OTHER">Other</option>
          </Select>

          <Textarea
            label="Remarks"
            rows={3}
            value={paymentForm.remarks}
            onChange={(event) =>
              setPaymentForm((current) => ({
                ...current,
                remarks: event.target.value,
              }))
            }
            placeholder="Payment reference, bank details, or optional note..."
          />

          <div className="flex justify-end gap-2 border-t border-slate-200 pt-4">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setPaymentOpen(false)}
              disabled={paymentMutation.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={paymentMutation.isPending}>
              <WalletCards size={16} />
              {paymentMutation.isPending ? "Posting..." : "Post Payment"}
            </Button>
          </div>
        </form>
      </Drawer>
    </div>
  );
}

function LedgersPageInner() {
  const [activeTab, setActiveTab] = useState("customer");

  return (
    <div className="space-y-0">
      <LedgerTabs activeTab={activeTab} onChange={setActiveTab} />
      <div className="mt-5">
        {activeTab === "customer" ? <CustomerLedgerPage /> : <VendorLedgerPage />}
      </div>
    </div>
  );
}

export default function LedgersPage() {
  return (
    <Suspense fallback={<LoadingState title="Opening ledger..." />}>
      <LedgersPageInner />
    </Suspense>
  );
}
