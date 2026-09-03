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
import Badge from "@/components/ui/Badge";
import ProductionForm from "@/modules/production/ProductionForm";
import {
  useCreateProductionBatch,
  useDeleteProductionBatch,
  useProductionBatches,
} from "@/modules/production/production.hooks";
import { useRawMaterials } from "@/modules/rawMaterials/rawMaterial.hooks";
import { useProducts } from "@/modules/products/product.hooks";
import { formatDate, formatMoney, formatQty } from "@/lib/format";

export default function ProductionPage() {
  const [search, setSearch] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [detailBatch, setDetailBatch] = useState(null);
  const [formError, setFormError] = useState("");

  const queryParams = useMemo(
    () => ({
      page: 1,
      limit: 50,
      search: appliedSearch,
    }),
    [appliedSearch]
  );

  const batchesQuery = useProductionBatches(queryParams);

  const rawMaterialsQuery = useRawMaterials({
    page: 1,
    limit: 100,
    status: "ACTIVE",
  });

  const productsQuery = useProducts({
    page: 1,
    limit: 100,
    status: "ACTIVE",
    productType: "MANUFACTURED",
  });

  const createMutation = useCreateProductionBatch();
  const deleteMutation = useDeleteProductionBatch();

  const rows = batchesQuery.data?.data || [];
  const pagination = batchesQuery.data?.pagination;
  const rawMaterials = rawMaterialsQuery.data?.data || [];
  const products = productsQuery.data?.data || [];

  const openCreateDrawer = () => {
    setFormError("");
    setDetailBatch(null);
    setDrawerOpen(true);
  };

  const closeCreateDrawer = () => {
    if (createMutation.isPending) return;

    setDrawerOpen(false);
    setFormError("");
  };

  const openDetailDrawer = (batch) => {
    setDrawerOpen(false);
    setDetailBatch(batch);
  };

  const closeDetailDrawer = () => {
    setDetailBatch(null);
  };

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    setAppliedSearch(search.trim());
  };

  const handleResetSearch = () => {
    setSearch("");
    setAppliedSearch("");
  };

  const handleDelete = async (batch) => {
    const confirmed = window.confirm(
      `Delete production batch "${batch.batchNo}"? This will reverse all stock changes from this batch.`
    );
    if (!confirmed) return;

    try {
      await deleteMutation.mutateAsync(batch.id);
    } catch (error) {
      window.alert(error.message || "Unable to delete production batch");
    }
  };

  const handleCreate = async (payload, resetForm) => {
    setFormError("");

    try {
      await createMutation.mutateAsync(payload);
      resetForm?.();
      closeCreateDrawer();
    } catch (error) {
      setFormError(error.message || "Unable to post production batch");
    }
  };

  const columns = [
    {
      key: "batchNo",
      header: "Batch No",
      render: (row) => (
        <span className="font-semibold text-slate-950">{row.batchNo}</span>
      ),
    },
    {
      key: "productionDate",
      header: "Date",
      render: (row) => formatDate(row.productionDate),
    },
    {
      key: "consumptions",
      header: "Consumed Lines",
      render: (row) => row.consumptions?.length || 0,
    },
    {
      key: "outputs",
      header: "Output Lines",
      render: (row) => row.outputs?.length || 0,
    },
    {
      key: "totalCost",
      header: "Total Cost",
      render: (row) => (
        <span className="font-semibold text-slate-950">
          {formatMoney(row.totalCost || row.totalConsumptionCost || 0)}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: () => <Badge variant="green">Posted</Badge>,
    },
    {
      key: "createdAt",
      header: "Created",
      render: (row) => formatDate(row.createdAt),
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
            Manufacturing Transaction
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">
            Production
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            Convert raw materials into finished products. Posting production
            decreases raw material stock and increases finished product stock.
          </p>
        </div>

        <Button onClick={openCreateDrawer}>
          <Plus size={17} />
          New Production
        </Button>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
        <form
          onSubmit={handleSearchSubmit}
          className="grid gap-3 md:grid-cols-[1fr_auto]"
        >
          <Input
            label="Search production batches"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by batch no..."
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

      {batchesQuery.isError ? (
        <section className="rounded-3xl border border-red-200 bg-red-50 p-5 text-red-700">
          <div className="flex items-start gap-3">
            <AlertCircle size={20} className="mt-0.5" />
            <div>
              <h2 className="text-sm font-semibold">
                Unable to load production batches
              </h2>
              <p className="mt-1 text-sm">
                {batchesQuery.error?.message || "Please try again."}
              </p>
            </div>
          </div>
        </section>
      ) : null}

      {rawMaterialsQuery.isError || productsQuery.isError ? (
        <section className="rounded-3xl border border-amber-200 bg-amber-50 p-5 text-amber-800">
          <div className="flex items-start gap-3">
            <AlertCircle size={20} className="mt-0.5" />
            <div>
              <h2 className="text-sm font-semibold">Lookup data failed</h2>
              <p className="mt-1 text-sm">
                Creating production requires raw materials and products to load
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
              ? `${pagination.total} total production batch${
                  pagination.total === 1 ? "" : "es"
                }`
              : "Production Batches"}
          </p>

          {batchesQuery.isFetching && !batchesQuery.isLoading ? (
            <p className="text-xs text-slate-400">Refreshing...</p>
          ) : null}
        </div>

        <DataTable
          columns={columns}
          rows={rows}
          loading={batchesQuery.isLoading}
          emptyTitle="No production batches found"
          emptyDescription="Post production after receiving raw material and creating finished products."
        />
      </section>

      <Drawer
        open={drawerOpen}
        title="New Production Batch"
        description="Consume raw materials and produce finished goods."
        onClose={closeCreateDrawer}
        width="max-w-6xl"
      >
        <ProductionForm
          rawMaterials={rawMaterials}
          products={products}
          rawMaterialsLoading={rawMaterialsQuery.isLoading}
          productsLoading={productsQuery.isLoading}
          submitting={createMutation.isPending}
          error={formError}
          onSubmit={handleCreate}
          onCancel={closeCreateDrawer}
        />
      </Drawer>

      <Drawer
        open={Boolean(detailBatch)}
        title={detailBatch ? `Production ${detailBatch.batchNo}` : "Production"}
        description="Posted production batch details."
        onClose={closeDetailDrawer}
        width="max-w-5xl"
      >
        {detailBatch ? (
          <div className="space-y-5">
            <section className="grid gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 md:grid-cols-4">
              <div>
                <p className="text-xs text-slate-500">Batch No</p>
                <p className="mt-1 text-sm font-semibold text-slate-950">
                  {detailBatch.batchNo}
                </p>
              </div>

              <div>
                <p className="text-xs text-slate-500">Date</p>
                <p className="mt-1 text-sm font-semibold text-slate-950">
                  {formatDate(detailBatch.productionDate)}
                </p>
              </div>

              <div>
                <p className="text-xs text-slate-500">Total Cost</p>
                <p className="mt-1 text-sm font-semibold text-slate-950">
                  {formatMoney(
                    detailBatch.totalCost || detailBatch.totalConsumptionCost || 0
                  )}
                </p>
              </div>

              <div>
                <p className="text-xs text-slate-500">Status</p>
                <div className="mt-1">
                  <Badge variant="green">Posted</Badge>
                </div>
              </div>
            </section>

            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
              <div className="border-b border-slate-200 bg-red-50 px-4 py-3">
                <h3 className="text-sm font-semibold text-red-900">
                  Raw Materials Consumed
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
                        Unit Cost
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Total Cost
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {(detailBatch.consumptions || []).map((line) => (
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
                          {formatMoney(line.unitCost)}
                        </td>

                        <td className="px-4 py-3 text-sm font-semibold text-slate-950">
                          {formatMoney(line.totalCost)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
              <div className="border-b border-slate-200 bg-emerald-50 px-4 py-3">
                <h3 className="text-sm font-semibold text-emerald-900">
                  Finished Products Produced
                </h3>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Product
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Quantity
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Unit Cost
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Total Cost
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {(detailBatch.outputs || []).map((line) => (
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
                          {formatMoney(line.unitCost)}
                        </td>

                        <td className="px-4 py-3 text-sm font-semibold text-slate-950">
                          {formatMoney(line.totalCost)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {detailBatch.remarks ? (
              <section className="rounded-2xl border border-slate-200 bg-white p-4">
                <p className="text-xs text-slate-500">Remarks</p>
                <p className="mt-1 text-sm text-slate-700">
                  {detailBatch.remarks}
                </p>
              </section>
            ) : null}

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