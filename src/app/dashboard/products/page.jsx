"use client";

import { useMemo, useState } from "react";
import {
  AlertCircle,
  Edit,
  Plus,
  RefreshCw,
  Search,
  Trash2,
} from "lucide-react";
import Button from "@/components/ui/Button";
import DataTable from "@/components/ui/DataTable";
import Drawer from "@/components/ui/Drawer";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Badge from "@/components/ui/Badge";
import ProductForm from "@/modules/products/ProductForm";
import {
  useCreateProduct,
  useDeleteProduct,
  useProducts,
  useUpdateProduct,
} from "@/modules/products/product.hooks";
import { useUnits } from "@/modules/units/unit.hooks";
import { formatDate, formatMoney, formatQty } from "@/lib/format";

function getStatusBadge(status) {
  if (status === "ACTIVE") {
    return <Badge variant="green">Active</Badge>;
  }

  return <Badge variant="slate">Inactive</Badge>;
}

function getStockBadge(row) {
  const currentStock = Number(row.currentStock || 0);
  const minimumStock = Number(row.minimumStock || 0);

  if (currentStock <= minimumStock) {
    return <Badge variant="yellow">Low Stock</Badge>;
  }

  return <Badge variant="green">OK</Badge>;
}

export default function ProductsPage() {
  const [search, setSearch] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [status, setStatus] = useState("");
  const [appliedStatus, setAppliedStatus] = useState("");
  const [lowStock, setLowStock] = useState("");
  const [appliedLowStock, setAppliedLowStock] = useState("");
  const [drawerMode, setDrawerMode] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [formError, setFormError] = useState("");

  const queryParams = useMemo(
    () => ({
      page: 1,
      limit: 50,
      search: appliedSearch,
      status: appliedStatus,
      lowStock: appliedLowStock,
    }),
    [appliedSearch, appliedStatus, appliedLowStock]
  );

  const productsQuery = useProducts(queryParams);

  const unitsQuery = useUnits({
    page: 1,
    limit: 100,
  });

  const createMutation = useCreateProduct();
  const updateMutation = useUpdateProduct();
  const deleteMutation = useDeleteProduct();

  const rows = productsQuery.data?.data || [];
  const pagination = productsQuery.data?.pagination;
  const units = unitsQuery.data?.data || [];

  const openCreateDrawer = () => {
    setSelectedProduct(null);
    setFormError("");
    setDrawerMode("create");
  };

  const openEditDrawer = (product) => {
    setSelectedProduct(product);
    setFormError("");
    setDrawerMode("edit");
  };

  const closeDrawer = () => {
    if (createMutation.isPending || updateMutation.isPending) return;

    setDrawerMode(null);
    setSelectedProduct(null);
    setFormError("");
  };

  const handleSearchSubmit = (event) => {
    event.preventDefault();

    setAppliedSearch(search.trim());
    setAppliedStatus(status);
    setAppliedLowStock(lowStock);
  };

  const handleResetSearch = () => {
    setSearch("");
    setStatus("");
    setLowStock("");
    setAppliedSearch("");
    setAppliedStatus("");
    setAppliedLowStock("");
  };

  const handleCreate = async (payload) => {
    setFormError("");

    try {
      await createMutation.mutateAsync(payload);
      closeDrawer();
    } catch (error) {
      setFormError(error.message || "Unable to create product");
    }
  };

  const handleUpdate = async (payload) => {
    if (!selectedProduct?.id) return;

    setFormError("");

    try {
      await updateMutation.mutateAsync({
        id: selectedProduct.id,
        payload,
      });

      closeDrawer();
    } catch (error) {
      setFormError(error.message || "Unable to update product");
    }
  };

  const handleDelete = async (product) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete product "${product.name}"?`
    );

    if (!confirmed) return;

    try {
      await deleteMutation.mutateAsync(product.id);
    } catch (error) {
      window.alert(
        error.message ||
          "Unable to delete product. If it has stock or transactions, mark it inactive instead."
      );
    }
  };

  const columns = [
    {
      key: "productCode",
      header: "Code",
      render: (row) => (
        <span className="font-semibold text-slate-950">{row.productCode}</span>
      ),
    },
    {
      key: "name",
      header: "Product",
      render: (row) => (
        <div>
          <p className="font-medium text-slate-900">{row.name}</p>
          <p className="text-xs text-slate-500">
            Unit: {row.unit?.code || "-"}{" "}
            {row.unit?.name ? `• ${row.unit.name}` : ""}
          </p>
        </div>
      ),
    },
    {
      key: "currentStock",
      header: "Current Stock",
      render: (row) => (
        <span className="font-semibold text-slate-950">
          {formatQty(row.currentStock)} {row.unit?.code || ""}
        </span>
      ),
    },
    {
      key: "minimumStock",
      header: "Minimum",
      render: (row) => (
        <span>
          {formatQty(row.minimumStock)} {row.unit?.code || ""}
        </span>
      ),
    },
    {
      key: "standardPrice",
      header: "Std Price",
      render: (row) => (
        <span className="font-medium">{formatMoney(row.standardPrice)}</span>
      ),
    },
    {
      key: "averageCost",
      header: "Avg Cost",
      render: (row) => formatMoney(row.averageCost),
    },
    {
      key: "stockStatus",
      header: "Stock",
      render: (row) => getStockBadge(row),
    },
    {
      key: "status",
      header: "Status",
      render: (row) => getStatusBadge(row.status),
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
            onClick={() => openEditDrawer(row)}
          >
            <Edit size={14} />
            Edit
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

  const drawerTitle =
    drawerMode === "create"
      ? "Create Product"
      : `Edit ${selectedProduct?.productCode || ""}`;

  const drawerDescription =
    drawerMode === "create"
      ? "Add a finished product that production creates and sales invoices sell."
      : "Update finished product master details.";

  const submitting = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-5">
      <section className="flex flex-col justify-between gap-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:flex-row md:items-center">
        <div>
          <p className="text-sm font-medium text-slate-500">Inventory Master</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">
            Products
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            Manage finished goods that are produced from raw materials and sold
            to customers. Stock updates automatically from production and sales.
          </p>
        </div>

        <Button onClick={openCreateDrawer}>
          <Plus size={17} />
          New Product
        </Button>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
        <form
          onSubmit={handleSearchSubmit}
          className="grid gap-3 lg:grid-cols-[1fr_190px_190px_auto]"
        >
          <Input
            label="Search products"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by code or name..."
          />

          <Select
            label="Status"
            value={status}
            onChange={(event) => setStatus(event.target.value)}
          >
            <option value="">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </Select>

          <Select
            label="Stock Filter"
            value={lowStock}
            onChange={(event) => setLowStock(event.target.value)}
          >
            <option value="">All Stock</option>
            <option value="true">Low Stock Only</option>
            <option value="false">Normal Stock</option>
          </Select>

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

      {productsQuery.isError ? (
        <section className="rounded-3xl border border-red-200 bg-red-50 p-5 text-red-700">
          <div className="flex items-start gap-3">
            <AlertCircle size={20} className="mt-0.5" />
            <div>
              <h2 className="text-sm font-semibold">Unable to load products</h2>
              <p className="mt-1 text-sm">
                {productsQuery.error?.message || "Please try again."}
              </p>
            </div>
          </div>
        </section>
      ) : null}

      {unitsQuery.isError ? (
        <section className="rounded-3xl border border-amber-200 bg-amber-50 p-5 text-amber-800">
          <div className="flex items-start gap-3">
            <AlertCircle size={20} className="mt-0.5" />
            <div>
              <h2 className="text-sm font-semibold">Units lookup failed</h2>
              <p className="mt-1 text-sm">
                You can view products, but creating/editing requires units to
                load successfully.
              </p>
            </div>
          </div>
        </section>
      ) : null}

      <section className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <p className="text-sm text-slate-500">
            {pagination
              ? `${pagination.total} total product${
                  pagination.total === 1 ? "" : "s"
                }`
              : "Products"}
          </p>

          {productsQuery.isFetching && !productsQuery.isLoading ? (
            <p className="text-xs text-slate-400">Refreshing...</p>
          ) : null}
        </div>

        <DataTable
          columns={columns}
          rows={rows}
          loading={productsQuery.isLoading}
          emptyTitle="No products found"
          emptyDescription="Create finished products before posting production or sales invoices."
        />
      </section>

      <Drawer
        open={Boolean(drawerMode)}
        title={drawerTitle}
        description={drawerDescription}
        onClose={closeDrawer}
        width="max-w-2xl"
      >
        <ProductForm
          mode={drawerMode}
          initialValues={selectedProduct}
          units={units}
          unitsLoading={unitsQuery.isLoading}
          submitting={submitting}
          error={formError}
          onSubmit={drawerMode === "create" ? handleCreate : handleUpdate}
          onCancel={closeDrawer}
        />
      </Drawer>
    </div>
  );
}