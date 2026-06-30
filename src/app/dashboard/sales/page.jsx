"use client";

import { useMemo, useState } from "react";
import {
  AlertCircle,
  Eye,
  MessageCircle,
  Pencil,
  Plus,
  Printer,
  RefreshCw,
  Search,
  Trash2,
} from "lucide-react";
import Button from "@/components/ui/Button";
import DataTable from "@/components/ui/DataTable";
import Drawer from "@/components/ui/Drawer";
import Input from "@/components/ui/Input";
import LookupSelect from "@/components/ui/LookupSelect";
import Badge from "@/components/ui/Badge";
import SalesInvoiceForm from "@/modules/sales/SalesInvoiceForm";
import {
  useCreateSalesInvoice,
  useDeleteSalesInvoice,
  useSalesInvoices,
  useUpdateSalesInvoice,
} from "@/modules/sales/sales.hooks";
import { salesApi } from "@/modules/sales/sales.api";
import { useCustomers } from "@/modules/customers/customer.hooks";
import { useProducts } from "@/modules/products/product.hooks";
import { formatDate, formatMoney, formatQty } from "@/lib/format";

const BAG_KG = 50;

function getPaymentBadge(row) {
  const balance = Number(row.balanceAmount || 0);
  const paid = Number(row.paidAmount || 0);

  if (balance <= 0) return <Badge variant="green">Paid</Badge>;
  if (paid > 0) return <Badge variant="yellow">Partial</Badge>;
  return <Badge variant="red">Unpaid</Badge>;
}

function openPrintableHtml(html) {
  const printWindow = window.open("", "_blank", "width=1000,height=800");

  if (!printWindow) {
    window.alert("Popup blocked. Please allow popups to print invoice.");
    return;
  }

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.focus();

  setTimeout(() => {
    printWindow.print();
  }, 500);
}

function buildWhatsAppText(invoice) {
  const lines = (invoice.lines || [])
    .map((line, i) => {
      const unit = line.product?.unit?.code || "";
      const qty = formatQty(line.quantity);
      return `${i + 1}. ${line.productName} (${qty} ${unit}) — ${formatMoney(line.lineTotal)}`;
    })
    .join("\n");

  const parts = [
    `*Invoice: ${invoice.invoiceNo}*`,
    `Date: ${formatDate(invoice.invoiceDate)}`,
    `Customer: ${invoice.customer?.name || ""}`,
    "",
    "*Items:*",
    lines,
    "",
    `Subtotal: ${formatMoney(invoice.subtotal)}`,
  ];

  if (Number(invoice.discountAmount) > 0) {
    parts.push(`Discount: ${formatMoney(invoice.discountAmount)}`);
  }

  parts.push(
    `*Total: ${formatMoney(invoice.totalAmount)}*`,
    `Paid: ${formatMoney(invoice.paidAmount)}`,
    `*Balance: ${formatMoney(invoice.balanceAmount)}*`
  );

  return parts.join("\n");
}

function shareOnWhatsApp(invoice) {
  const text = buildWhatsAppText(invoice);

  const rawPhone = invoice.customer?.phone || "";
  const phone = rawPhone
    .replace(/\D/g, "")
    .replace(/^0+/, "92");

  const url = phone.length >= 10
    ? `https://wa.me/${phone}?text=${encodeURIComponent(text)}`
    : `https://wa.me/?text=${encodeURIComponent(text)}`;

  window.open(url, "_blank");
}

export default function SalesPage() {
  const [search, setSearch] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [appliedCustomerId, setAppliedCustomerId] = useState("");

  const [createDrawerOpen, setCreateDrawerOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState(null);
  const [detailInvoice, setDetailInvoice] = useState(null);

  const [createError, setCreateError] = useState("");
  const [editError, setEditError] = useState("");
  const [printingId, setPrintingId] = useState("");

  const queryParams = useMemo(
    () => ({
      page: 1,
      limit: 50,
      search: appliedSearch,
      customerId: appliedCustomerId,
    }),
    [appliedSearch, appliedCustomerId]
  );

  const invoicesQuery = useSalesInvoices(queryParams);
  const customersQuery = useCustomers({ page: 1, limit: 100, status: "ACTIVE" });
  const productsQuery = useProducts({ page: 1, limit: 100, status: "ACTIVE" });

  const createMutation = useCreateSalesInvoice();
  const updateMutation = useUpdateSalesInvoice();
  const deleteMutation = useDeleteSalesInvoice();

  const rows = invoicesQuery.data?.data || [];
  const pagination = invoicesQuery.data?.pagination;
  const customers = customersQuery.data?.data || [];
  const products = productsQuery.data?.data || [];

  const openCreateDrawer = () => {
    setCreateError("");
    setCreateDrawerOpen(true);
  };

  const closeCreateDrawer = () => {
    if (createMutation.isPending) return;
    setCreateDrawerOpen(false);
    setCreateError("");
  };

  const openEditDrawer = (invoice) => {
    setEditError("");
    setEditingInvoice(invoice);
    setDetailInvoice(null);
  };

  const closeEditDrawer = () => {
    if (updateMutation.isPending) return;
    setEditingInvoice(null);
    setEditError("");
  };

  const openDetailDrawer = (invoice) => {
    setCreateDrawerOpen(false);
    setEditingInvoice(null);
    setDetailInvoice(invoice);
  };

  const closeDetailDrawer = () => setDetailInvoice(null);

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    setAppliedSearch(search.trim());
    setAppliedCustomerId(customerId);
  };

  const handleResetSearch = () => {
    setSearch("");
    setCustomerId("");
    setAppliedSearch("");
    setAppliedCustomerId("");
  };

  const handleCreate = async (payload, resetForm) => {
    setCreateError("");

    try {
      const created = await createMutation.mutateAsync(payload);
      resetForm?.();
      closeCreateDrawer();

      if (created?.id) {
        await handlePrintInvoice(created.id);
      }
    } catch (error) {
      setCreateError(error.message || "Unable to post sales invoice");
    }
  };

  const handleUpdate = async (payload, resetForm) => {
    setEditError("");

    try {
      const { id, ...body } = payload;
      await updateMutation.mutateAsync({ id, ...body });
      resetForm?.();
      closeEditDrawer();
    } catch (error) {
      setEditError(error.message || "Unable to update sales invoice");
    }
  };

  const handlePrintInvoice = async (invoiceId) => {
    if (!invoiceId) return;
    setPrintingId(invoiceId);

    try {
      const html = await salesApi.getPrintHtml(invoiceId);
      openPrintableHtml(html);
    } catch (error) {
      window.alert(error.message || "Unable to print invoice");
    } finally {
      setPrintingId("");
    }
  };

  const handleDeleteInvoice = async (invoice) => {
    const confirmed = window.confirm(
      `Delete invoice ${invoice.invoiceNo}? This will restore product stock and reverse the customer balance.`
    );

    if (!confirmed) return;

    try {
      await deleteMutation.mutateAsync(invoice.id);

      if (detailInvoice?.id === invoice.id) setDetailInvoice(null);
      if (editingInvoice?.id === invoice.id) setEditingInvoice(null);
    } catch (error) {
      window.alert(error.message || "Unable to delete sales invoice");
    }
  };

  const columns = [
    {
      key: "invoiceNo",
      header: "Invoice No",
      render: (row) => (
        <span className="font-semibold text-slate-950">{row.invoiceNo}</span>
      ),
    },
    {
      key: "customer",
      header: "Customer",
      render: (row) => (
        <div>
          <p className="font-medium text-slate-900">{row.customer?.name || "-"}</p>
          <p className="text-xs text-slate-500">{row.customer?.customerCode || ""}</p>
        </div>
      ),
    },
    {
      key: "invoiceDate",
      header: "Date",
      render: (row) => formatDate(row.invoiceDate),
    },
    {
      key: "lines",
      header: "Lines",
      render: (row) => row.lines?.length || 0,
    },
    {
      key: "totalAmount",
      header: "Total",
      render: (row) => (
        <span className="font-semibold text-slate-950">{formatMoney(row.totalAmount)}</span>
      ),
    },
    {
      key: "balanceAmount",
      header: "Balance",
      render: (row) => formatMoney(row.balanceAmount),
    },
    {
      key: "paymentStatus",
      header: "Payment",
      render: (row) => getPaymentBadge(row),
    },
    {
      key: "actions",
      header: "Actions",
      render: (row) => (
        <div className="flex flex-wrap items-center gap-1.5">
          <Button variant="secondary" size="sm" onClick={() => openDetailDrawer(row)}>
            <Eye size={14} />
            View
          </Button>

          <Button variant="secondary" size="sm" onClick={() => openEditDrawer(row)}>
            <Pencil size={14} />
            Edit
          </Button>

          <Button
            variant="secondary"
            size="sm"
            onClick={() => handlePrintInvoice(row.id)}
            disabled={printingId === row.id}
          >
            <Printer size={14} />
            {printingId === row.id ? "Printing..." : "Print"}
          </Button>

          <Button variant="secondary" size="sm" onClick={() => shareOnWhatsApp(row)}>
            <MessageCircle size={14} />
            Share
          </Button>

          <Button
            variant="danger"
            size="sm"
            onClick={() => handleDeleteInvoice(row)}
            disabled={deleteMutation.isPending}
          >
            <Trash2 size={14} />
            Delete
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <section className="flex flex-col justify-between gap-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:flex-row md:items-center">
        <div>
          <p className="text-sm font-medium text-slate-500">Sales Transaction</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">
            Sales Invoices
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            Create customer invoices, reduce product stock, track payments, and print professional
            receipts for business use.
          </p>
        </div>

        <Button onClick={openCreateDrawer}>
          <Plus size={17} />
          New Invoice
        </Button>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
        <form onSubmit={handleSearchSubmit} className="grid gap-3 lg:grid-cols-[1fr_320px_auto]">
          <Input
            label="Search invoices"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by invoice no or customer..."
          />

          <LookupSelect
            label="Customer"
            value={customerId}
            onChange={setCustomerId}
            options={customers}
            loading={customersQuery.isLoading}
            placeholder="All customers"
            getOptionValue={(c) => c.id}
            getOptionLabel={(c) => c.customerCode || c.name}
            getOptionDescription={(c) => c.name}
          />

          <div className="flex items-end gap-2">
            <Button type="submit" variant="secondary">
              <Search size={16} />
              Search
            </Button>
            <Button type="button" variant="ghost" onClick={handleResetSearch}>
              <RefreshCw size={16} />
              Reset
            </Button>
          </div>
        </form>
      </section>

      {invoicesQuery.isError ? (
        <section className="rounded-3xl border border-red-200 bg-red-50 p-5 text-red-700">
          <div className="flex items-start gap-3">
            <AlertCircle size={20} className="mt-0.5" />
            <div>
              <h2 className="text-sm font-semibold">Unable to load sales invoices</h2>
              <p className="mt-1 text-sm">{invoicesQuery.error?.message || "Please try again."}</p>
            </div>
          </div>
        </section>
      ) : null}

      {customersQuery.isError || productsQuery.isError ? (
        <section className="rounded-3xl border border-amber-200 bg-amber-50 p-5 text-amber-800">
          <div className="flex items-start gap-3">
            <AlertCircle size={20} className="mt-0.5" />
            <div>
              <h2 className="text-sm font-semibold">Lookup data failed</h2>
              <p className="mt-1 text-sm">
                Creating an invoice requires customers and products to load successfully.
              </p>
            </div>
          </div>
        </section>
      ) : null}

      <section className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <p className="text-sm text-slate-500">
            {pagination
              ? `${pagination.total} total invoice${pagination.total === 1 ? "" : "s"}`
              : "Sales Invoices"}
          </p>
          {invoicesQuery.isFetching && !invoicesQuery.isLoading ? (
            <p className="text-xs text-slate-400">Refreshing...</p>
          ) : null}
        </div>

        <DataTable
          columns={columns}
          rows={rows}
          loading={invoicesQuery.isLoading}
          emptyTitle="No sales invoices found"
          emptyDescription="Create your first sales invoice after producing finished products."
        />
      </section>

      {/* Create drawer */}
      <Drawer
        open={createDrawerOpen}
        title="New Sales Invoice"
        description="Sell finished products to customer and post invoice impact."
        onClose={closeCreateDrawer}
        width="max-w-6xl"
      >
        <SalesInvoiceForm
          customers={customers}
          products={products}
          customersLoading={customersQuery.isLoading}
          productsLoading={productsQuery.isLoading}
          submitting={createMutation.isPending}
          error={createError}
          onSubmit={handleCreate}
          onCancel={closeCreateDrawer}
        />
      </Drawer>

      {/* Edit drawer — key forces remount when target invoice changes */}
      <Drawer
        open={Boolean(editingInvoice)}
        title={editingInvoice ? `Edit Invoice ${editingInvoice.invoiceNo}` : "Edit Invoice"}
        description="Changes will reverse existing stock and accounting entries, then reapply."
        onClose={closeEditDrawer}
        width="max-w-6xl"
      >
        {editingInvoice ? (
          <SalesInvoiceForm
            key={editingInvoice.id}
            customers={customers}
            products={products}
            customersLoading={customersQuery.isLoading}
            productsLoading={productsQuery.isLoading}
            submitting={updateMutation.isPending}
            error={editError}
            onSubmit={handleUpdate}
            onCancel={closeEditDrawer}
            initialData={editingInvoice}
          />
        ) : null}
      </Drawer>

      {/* Detail drawer */}
      <Drawer
        open={Boolean(detailInvoice)}
        title={detailInvoice ? `Invoice ${detailInvoice.invoiceNo}` : "Invoice"}
        description="Posted sales invoice details."
        onClose={closeDetailDrawer}
        width="max-w-5xl"
      >
        {detailInvoice ? (
          <div className="space-y-5">
            <section className="grid gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 md:grid-cols-4">
              <div>
                <p className="text-xs text-slate-500">Customer</p>
                <p className="mt-1 text-sm font-semibold text-slate-950">
                  {detailInvoice.customer?.name || "-"}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Date</p>
                <p className="mt-1 text-sm font-semibold text-slate-950">
                  {formatDate(detailInvoice.invoiceDate)}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Total</p>
                <p className="mt-1 text-sm font-semibold text-slate-950">
                  {formatMoney(detailInvoice.totalAmount)}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Payment</p>
                <div className="mt-1">{getPaymentBadge(detailInvoice)}</div>
              </div>
            </section>

            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
              <div className="border-b border-slate-200 bg-slate-50 px-4 py-3">
                <h3 className="text-sm font-semibold text-slate-950">Invoice Lines</h3>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Product
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Qty
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Sale Price
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Discount
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Total
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(detailInvoice.lines || []).map((line) => (
                      <tr key={line.id}>
                        <td className="px-4 py-3 text-sm">
                          <p className="font-medium text-slate-900">
                            {line.product?.name || line.productName || "-"}
                          </p>
                          <p className="text-xs text-slate-500">
                            {line.product?.productCode || ""}
                          </p>
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-700">
                          {formatQty(line.quantity)} {line.product?.unit?.code || ""}
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-700">
                          {formatMoney(line.salePrice)}
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-700">
                          {formatMoney(line.discountAmount)}
                        </td>
                        <td className="px-4 py-3 text-sm font-semibold text-slate-950">
                          {formatMoney(line.lineTotal)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-4">
              <h3 className="text-sm font-semibold text-slate-950">Summary</h3>

              <div className="mt-4 grid gap-3 md:grid-cols-5">
                {[
                  { label: "Subtotal", value: detailInvoice.subtotal },
                  { label: "Discount", value: detailInvoice.discountAmount },
                  { label: "Total", value: detailInvoice.totalAmount },
                  { label: "Paid", value: detailInvoice.paidAmount },
                  { label: "Balance", value: detailInvoice.balanceAmount },
                ].map(({ label, value }) => (
                  <div key={label} className="rounded-xl bg-slate-50 p-3">
                    <p className="text-xs text-slate-500">{label}</p>
                    <p className="mt-1 text-sm font-semibold text-slate-950">
                      {formatMoney(value)}
                    </p>
                  </div>
                ))}
              </div>

              {detailInvoice.remarks ? (
                <div className="mt-4 rounded-xl bg-slate-50 p-3">
                  <p className="text-xs text-slate-500">Remarks</p>
                  <p className="mt-1 text-sm text-slate-700">{detailInvoice.remarks}</p>
                </div>
              ) : null}
            </section>

            <div className="flex flex-wrap justify-end gap-2">
              <Button variant="secondary" onClick={() => openEditDrawer(detailInvoice)}>
                <Pencil size={16} />
                Edit Invoice
              </Button>

              <Button
                variant="secondary"
                onClick={() => handlePrintInvoice(detailInvoice.id)}
                disabled={printingId === detailInvoice.id}
              >
                <Printer size={16} />
                {printingId === detailInvoice.id ? "Printing..." : "Print Invoice"}
              </Button>

              <Button variant="secondary" onClick={() => shareOnWhatsApp(detailInvoice)}>
                <MessageCircle size={16} />
                Share on WhatsApp
              </Button>
            </div>
          </div>
        ) : null}
      </Drawer>
    </div>
  );
}
