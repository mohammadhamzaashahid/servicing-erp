"use client";

import { useMemo, useState } from "react";
import {
  AlertCircle,
  Eye,
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
import MaterialReceivingForm from "@/modules/materialReceiving/MaterialReceivingForm";
import {
  useCreateMaterialReceipt,
  useDeleteMaterialReceipt,
  useMaterialReceipts,
} from "@/modules/materialReceiving/materialReceiving.hooks";
import { useVendors } from "@/modules/vendors/vendor.hooks";
import { useRawMaterials } from "@/modules/rawMaterials/rawMaterial.hooks";
import { formatDate, formatMoney, formatQty } from "@/lib/format";

function getPaymentBadge(row) {
  const balance = Number(row.balanceAmount || 0);
  const paid = Number(row.paidAmount || 0);

  if (balance <= 0) {
    return <Badge variant="green">Paid</Badge>;
  }

  if (paid > 0) {
    return <Badge variant="yellow">Partial</Badge>;
  }

  return <Badge variant="red">Unpaid</Badge>;
}

export default function MaterialReceivingPage() {
  const [search, setSearch] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [vendorId, setVendorId] = useState("");
  const [appliedVendorId, setAppliedVendorId] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [detailReceipt, setDetailReceipt] = useState(null);
  const [formError, setFormError] = useState("");

  const queryParams = useMemo(
    () => ({
      page: 1,
      limit: 50,
      search: appliedSearch,
      vendorId: appliedVendorId,
    }),
    [appliedSearch, appliedVendorId]
  );

  const receiptsQuery = useMaterialReceipts(queryParams);

  const vendorsQuery = useVendors({
    page: 1,
    limit: 100,
    status: "ACTIVE",
  });

  const rawMaterialsQuery = useRawMaterials({
    page: 1,
    limit: 100,
    status: "ACTIVE",
  });

  const createMutation = useCreateMaterialReceipt();
  const deleteMutation = useDeleteMaterialReceipt();

  const rows = receiptsQuery.data?.data || [];
  const pagination = receiptsQuery.data?.pagination;
  const vendors = vendorsQuery.data?.data || [];
  const rawMaterials = rawMaterialsQuery.data?.data || [];

  const openCreateDrawer = () => {
    setFormError("");
    setDetailReceipt(null);
    setDrawerOpen(true);
  };

  const closeCreateDrawer = () => {
    if (createMutation.isPending) return;

    setDrawerOpen(false);
    setFormError("");
  };

  const openDetailDrawer = (receipt) => {
    setDrawerOpen(false);
    setDetailReceipt(receipt);
  };

  const closeDetailDrawer = () => {
    setDetailReceipt(null);
  };

  const handleSearchSubmit = (event) => {
    event.preventDefault();

    setAppliedSearch(search.trim());
    setAppliedVendorId(vendorId);
  };

  const handleResetSearch = () => {
    setSearch("");
    setVendorId("");
    setAppliedSearch("");
    setAppliedVendorId("");
  };

  const handleDelete = async (receipt) => {
    const confirmed = window.confirm(
      `Delete receipt "${receipt.receiptNo}"? This will reverse all stock and accounting entries for this receipt.`
    );
    if (!confirmed) return;

    try {
      await deleteMutation.mutateAsync(receipt.id);
      if (detailReceipt?.id === receipt.id) setDetailReceipt(null);
    } catch (error) {
      window.alert(error.message || "Unable to delete material receipt");
    }
  };

  const handleCreate = async (payload, resetForm) => {
    setFormError("");

    try {
      await createMutation.mutateAsync(payload);
      resetForm?.();
      closeCreateDrawer();
    } catch (error) {
      setFormError(error.message || "Unable to post material receipt");
    }
  };

  const columns = [
    {
      key: "receiptNo",
      header: "Receipt No",
      render: (row) => (
        <span className="font-semibold text-slate-950">{row.receiptNo}</span>
      ),
    },
    {
      key: "vendor",
      header: "Vendor",
      render: (row) => (
        <div>
          <p className="font-medium text-slate-900">
            {row.vendor?.name || "-"}
          </p>
          <p className="text-xs text-slate-500">
            {row.vendor?.vendorCode || ""}
          </p>
        </div>
      ),
    },
    {
      key: "receiptDate",
      header: "Date",
      render: (row) => formatDate(row.receiptDate),
    },
    {
      key: "lines",
      header: "Lines",
      render: (row) => row.lines?.length || 0,
    },
    {
      key: "subtotal",
      header: "Subtotal",
      render: (row) => (
        <span className="font-medium">{formatMoney(row.subtotal)}</span>
      ),
    },
    {
      key: "paidAmount",
      header: "Paid",
      render: (row) => formatMoney(row.paidAmount),
    },
    {
      key: "balanceAmount",
      header: "Balance",
      render: (row) => (
        <span className="font-semibold text-slate-950">
          {formatMoney(row.balanceAmount)}
        </span>
      ),
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
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => openDetailDrawer(row)}
          >
            <Eye size={14} />
            View
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={() => handleDelete(row)}
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
          <p className="text-sm font-medium text-slate-500">
            Inventory Transaction
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">
            Material Receiving
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            Record raw materials received from vendors. Posting a receipt
            increases raw material stock and updates vendor payable balance.
          </p>
        </div>

        <Button onClick={openCreateDrawer}>
          <Plus size={17} />
          New Receipt
        </Button>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
        <form
          onSubmit={handleSearchSubmit}
          className="grid gap-3 lg:grid-cols-[1fr_320px_auto]"
        >
          <Input
            label="Search receipts"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by receipt no or vendor..."
          />

          <LookupSelect
            label="Vendor"
            value={vendorId}
            onChange={setVendorId}
            options={vendors}
            loading={vendorsQuery.isLoading}
            placeholder="All vendors"
            getOptionValue={(vendor) => vendor.id}
            getOptionLabel={(vendor) => vendor.vendorCode || vendor.name}
            getOptionDescription={(vendor) => vendor.name}
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

      {receiptsQuery.isError ? (
        <section className="rounded-3xl border border-red-200 bg-red-50 p-5 text-red-700">
          <div className="flex items-start gap-3">
            <AlertCircle size={20} className="mt-0.5" />
            <div>
              <h2 className="text-sm font-semibold">
                Unable to load material receipts
              </h2>
              <p className="mt-1 text-sm">
                {receiptsQuery.error?.message || "Please try again."}
              </p>
            </div>
          </div>
        </section>
      ) : null}

      {vendorsQuery.isError || rawMaterialsQuery.isError ? (
        <section className="rounded-3xl border border-amber-200 bg-amber-50 p-5 text-amber-800">
          <div className="flex items-start gap-3">
            <AlertCircle size={20} className="mt-0.5" />
            <div>
              <h2 className="text-sm font-semibold">Lookup data failed</h2>
              <p className="mt-1 text-sm">
                Creating a receipt requires vendors and raw materials to load
                successfully.
              </p>
            </div>
          </div>
        </section>
      ) : null}

      <section className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <p className="text-sm text-slate-500">
            {pagination
              ? `${pagination.total} total receipt${
                  pagination.total === 1 ? "" : "s"
                }`
              : "Material Receipts"}
          </p>

          {receiptsQuery.isFetching && !receiptsQuery.isLoading ? (
            <p className="text-xs text-slate-400">Refreshing...</p>
          ) : null}
        </div>

        <DataTable
          columns={columns}
          rows={rows}
          loading={receiptsQuery.isLoading}
          emptyTitle="No material receipts found"
          emptyDescription="Post your first receipt when a vendor supplies raw material."
        />
      </section>

      <Drawer
        open={drawerOpen}
        title="New Material Receipt"
        description="Receive raw materials from vendor and post inventory/accounting impact."
        onClose={closeCreateDrawer}
        width="max-w-5xl"
      >
        <MaterialReceivingForm
          vendors={vendors}
          rawMaterials={rawMaterials}
          vendorsLoading={vendorsQuery.isLoading}
          rawMaterialsLoading={rawMaterialsQuery.isLoading}
          submitting={createMutation.isPending}
          error={formError}
          onSubmit={handleCreate}
          onCancel={closeCreateDrawer}
        />
      </Drawer>

      <Drawer
        open={Boolean(detailReceipt)}
        title={detailReceipt ? `Receipt ${detailReceipt.receiptNo}` : "Receipt"}
        description="Posted material receiving details."
        onClose={closeDetailDrawer}
        width="max-w-4xl"
      >
        {detailReceipt ? (
          <div className="space-y-5">
            <section className="grid gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 md:grid-cols-4">
              <div>
                <p className="text-xs text-slate-500">Vendor</p>
                <p className="mt-1 text-sm font-semibold text-slate-950">
                  {detailReceipt.vendor?.name || "-"}
                </p>
              </div>

              <div>
                <p className="text-xs text-slate-500">Date</p>
                <p className="mt-1 text-sm font-semibold text-slate-950">
                  {formatDate(detailReceipt.receiptDate)}
                </p>
              </div>

              <div>
                <p className="text-xs text-slate-500">Subtotal</p>
                <p className="mt-1 text-sm font-semibold text-slate-950">
                  {formatMoney(detailReceipt.subtotal)}
                </p>
              </div>

              <div>
                <p className="text-xs text-slate-500">Balance</p>
                <p className="mt-1 text-sm font-semibold text-slate-950">
                  {formatMoney(detailReceipt.balanceAmount)}
                </p>
              </div>
            </section>

            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
              <div className="border-b border-slate-200 bg-slate-50 px-4 py-3">
                <h3 className="text-sm font-semibold text-slate-950">
                  Receipt Lines
                </h3>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Raw Material
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Quantity
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Rate
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Total
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {(detailReceipt.lines || []).map((line) => (
                      <tr key={line.id}>
                        <td className="px-4 py-3 text-sm">
                          <p className="font-medium text-slate-900">
                            {line.rawMaterial?.name || line.rawMaterialName || "-"}
                          </p>
                          <p className="text-xs text-slate-500">
                            {line.rawMaterial?.materialCode || ""}
                          </p>
                        </td>

                        <td className="px-4 py-3 text-sm text-slate-700">
                          {formatQty(line.quantity)}{" "}
                          {line.rawMaterial?.unit?.code || ""}
                        </td>

                        <td className="px-4 py-3 text-sm text-slate-700">
                          {formatMoney(line.rate)}
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

              <div className="mt-4 grid gap-3 md:grid-cols-3">
                <div className="rounded-xl bg-slate-50 p-3">
                  <p className="text-xs text-slate-500">Subtotal</p>
                  <p className="mt-1 text-sm font-semibold text-slate-950">
                    {formatMoney(detailReceipt.subtotal)}
                  </p>
                </div>

                <div className="rounded-xl bg-slate-50 p-3">
                  <p className="text-xs text-slate-500">Paid</p>
                  <p className="mt-1 text-sm font-semibold text-slate-950">
                    {formatMoney(detailReceipt.paidAmount)}
                  </p>
                </div>

                <div className="rounded-xl bg-slate-50 p-3">
                  <p className="text-xs text-slate-500">Balance</p>
                  <p className="mt-1 text-sm font-semibold text-slate-950">
                    {formatMoney(detailReceipt.balanceAmount)}
                  </p>
                </div>
              </div>

              {detailReceipt.remarks ? (
                <div className="mt-4 rounded-xl bg-slate-50 p-3">
                  <p className="text-xs text-slate-500">Remarks</p>
                  <p className="mt-1 text-sm text-slate-700">
                    {detailReceipt.remarks}
                  </p>
                </div>
              ) : null}
            </section>

            <div className="flex justify-end">
              <Button variant="secondary" onClick={() => window.print()}>
                <Printer size={16} />
                Print
              </Button>
            </div>
          </div>
        ) : null}
      </Drawer>
    </div>
  );
}