"use client";

import { useMemo, useState } from "react";
import {
  AlertCircle,
  ArrowDownLeft,
  ArrowUpRight,
  Boxes,
  DollarSign,
  RefreshCw,
  Search,
  TriangleAlert,
} from "lucide-react";
import Button from "@/components/ui/Button";
import DataTable from "@/components/ui/DataTable";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Badge from "@/components/ui/Badge";
import StatCard from "@/components/ui/StatCard";
import {
  useInventoryMovements,
  useStockSummary,
} from "@/modules/inventory/inventory.hooks";
import { formatDate, formatMoney, formatQty } from "@/lib/format";

function getItemTypeBadge(itemType) {
  if (itemType === "RAW_MATERIAL") {
    return <Badge variant="yellow">Raw Material</Badge>;
  }

  if (itemType === "FINISHED_PRODUCT") {
    return <Badge variant="green">Finished Product</Badge>;
  }

  return <Badge variant="slate">{itemType || "-"}</Badge>;
}

function getDirection(row) {
  const quantityIn = Number(row.quantityIn || 0);
  const quantityOut = Number(row.quantityOut || 0);

  if (quantityIn > 0) {
    return {
      label: "In",
      icon: ArrowDownLeft,
      className: "text-emerald-700 bg-emerald-50 border-emerald-200",
    };
  }

  if (quantityOut > 0) {
    return {
      label: "Out",
      icon: ArrowUpRight,
      className: "text-red-700 bg-red-50 border-red-200",
    };
  }

  return {
    label: "-",
    icon: ArrowDownLeft,
    className: "text-slate-700 bg-slate-50 border-slate-200",
  };
}

function formatMovementType(type) {
  const labels = {
    RAW_MATERIAL_RECEIVE: "Raw Material Receive",
    RAW_MATERIAL_CONSUME: "Raw Material Consume",
    FINISHED_PRODUCT_PRODUCE: "Finished Product Produce",
    FINISHED_PRODUCT_PURCHASE: "Finished Product Purchase",
    FINISHED_PRODUCT_SALE: "Finished Product Sale",
  };

  return labels[type] || type || "-";
}

function formatSourceType(type) {
  const labels = {
    MATERIAL_RECEIPT: "Material Receipt",
    PRODUCTION_BATCH: "Production Batch",
    PRODUCT_PURCHASE: "Product Purchase",
    SALES_INVOICE: "Sales Invoice",
    PAYMENT: "Payment",
    STOCK_ADJUSTMENT: "Stock Adjustment",
    OPENING_BALANCE: "Opening Balance",
  };

  return labels[type] || type || "-";
}

function getProductTypeBadge(productType) {
  if (!productType) return null;

  return productType === "TRADING" ? (
    <Badge variant="blue">Trading</Badge>
  ) : (
    <Badge variant="slate">Manufactured</Badge>
  );
}

function getStatusBadge(status) {
  if (status === "ACTIVE") {
    return <Badge variant="green">Active</Badge>;
  }

  return <Badge variant="slate">Inactive</Badge>;
}

function InventoryTabs({ activeTab, onChange }) {
  return (
    <div className="flex border-b border-slate-200 bg-white">
      <button
        type="button"
        onClick={() => onChange("movements")}
        className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
          activeTab === "movements"
            ? "border-slate-950 text-slate-950"
            : "border-transparent text-slate-500 hover:text-slate-700"
        }`}
      >
        Movements
      </button>
      <button
        type="button"
        onClick={() => onChange("stock")}
        className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
          activeTab === "stock"
            ? "border-slate-950 text-slate-950"
            : "border-transparent text-slate-500 hover:text-slate-700"
        }`}
      >
        Stock On Hand
      </button>
    </div>
  );
}

function MovementsView() {
  const [itemType, setItemType] = useState("");
  const [movementType, setMovementType] = useState("");
  const [sourceType, setSourceType] = useState("");
  const [appliedItemType, setAppliedItemType] = useState("");
  const [appliedMovementType, setAppliedMovementType] = useState("");
  const [appliedSourceType, setAppliedSourceType] = useState("");

  const queryParams = useMemo(
    () => ({
      page: 1,
      limit: 100,
      itemType: appliedItemType,
      movementType: appliedMovementType,
      sourceType: appliedSourceType,
    }),
    [appliedItemType, appliedMovementType, appliedSourceType]
  );

  const movementsQuery = useInventoryMovements(queryParams);

  const rows = movementsQuery.data?.data || [];
  const pagination = movementsQuery.data?.pagination;

  const handleSearchSubmit = (event) => {
    event.preventDefault();

    setAppliedItemType(itemType);
    setAppliedMovementType(movementType);
    setAppliedSourceType(sourceType);
  };

  const handleReset = () => {
    setItemType("");
    setMovementType("");
    setSourceType("");
    setAppliedItemType("");
    setAppliedMovementType("");
    setAppliedSourceType("");
  };

  const columns = [
    {
      key: "createdAt",
      header: "Date",
      render: (row) => formatDate(row.createdAt),
    },
    {
      key: "itemType",
      header: "Item Type",
      render: (row) => getItemTypeBadge(row.itemType),
    },
    {
      key: "movementType",
      header: "Movement",
      render: (row) => (
        <span className="font-medium text-slate-900">
          {formatMovementType(row.movementType)}
        </span>
      ),
    },
    {
      key: "direction",
      header: "Direction",
      render: (row) => {
        const direction = getDirection(row);
        const Icon = direction.icon;

        return (
          <span
            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${direction.className}`}
          >
            <Icon size={13} />
            {direction.label}
          </span>
        );
      },
    },
    {
      key: "quantityIn",
      header: "Qty In",
      render: (row) => (
        <span className="font-medium text-emerald-700">
          {formatQty(row.quantityIn)}
        </span>
      ),
    },
    {
      key: "quantityOut",
      header: "Qty Out",
      render: (row) => (
        <span className="font-medium text-red-700">
          {formatQty(row.quantityOut)}
        </span>
      ),
    },
    {
      key: "unitCost",
      header: "Unit Cost",
      render: (row) => formatMoney(row.unitCost),
    },
    {
      key: "totalCost",
      header: "Total Cost",
      render: (row) => (
        <span className="font-semibold text-slate-950">
          {formatMoney(row.totalCost)}
        </span>
      ),
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
    {
      key: "remarks",
      header: "Remarks",
      render: (row) => (
        <span className="max-w-xs truncate text-slate-600">
          {row.remarks || "-"}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
        <form
          onSubmit={handleSearchSubmit}
          className="grid gap-3 xl:grid-cols-[220px_280px_240px_auto]"
        >
          <Select
            label="Item Type"
            value={itemType}
            onChange={(event) => setItemType(event.target.value)}
          >
            <option value="">All Item Types</option>
            <option value="RAW_MATERIAL">Raw Material</option>
            <option value="FINISHED_PRODUCT">Finished Product</option>
          </Select>

          <Select
            label="Movement Type"
            value={movementType}
            onChange={(event) => setMovementType(event.target.value)}
          >
            <option value="">All Movements</option>
            <option value="RAW_MATERIAL_RECEIVE">Raw Material Receive</option>
            <option value="RAW_MATERIAL_CONSUME">Raw Material Consume</option>
            <option value="FINISHED_PRODUCT_PRODUCE">
              Finished Product Produce
            </option>
            <option value="FINISHED_PRODUCT_PURCHASE">
              Finished Product Purchase
            </option>
            <option value="FINISHED_PRODUCT_SALE">Finished Product Sale</option>
          </Select>

          <Select
            label="Source Type"
            value={sourceType}
            onChange={(event) => setSourceType(event.target.value)}
          >
            <option value="">All Sources</option>
            <option value="MATERIAL_RECEIPT">Material Receipt</option>
            <option value="PRODUCTION_BATCH">Production Batch</option>
            <option value="PRODUCT_PURCHASE">Product Purchase</option>
            <option value="SALES_INVOICE">Sales Invoice</option>
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

      {movementsQuery.isError ? (
        <section className="rounded-3xl border border-red-200 bg-red-50 p-5 text-red-700">
          <div className="flex items-start gap-3">
            <AlertCircle size={20} className="mt-0.5" />
            <div>
              <h2 className="text-sm font-semibold">
                Unable to load inventory movements
              </h2>
              <p className="mt-1 text-sm">
                {movementsQuery.error?.message || "Please try again."}
              </p>
            </div>
          </div>
        </section>
      ) : null}

      <section className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <p className="text-sm text-slate-500">
            {pagination
              ? `${pagination.total} total movement${
                  pagination.total === 1 ? "" : "s"
                }`
              : "Inventory Movements"}
          </p>

          {movementsQuery.isFetching && !movementsQuery.isLoading ? (
            <p className="text-xs text-slate-400">Refreshing...</p>
          ) : null}
        </div>

        <DataTable
          columns={columns}
          rows={rows}
          loading={movementsQuery.isLoading}
          emptyTitle="No inventory movements found"
          emptyDescription="Movements will appear after material receiving, production, purchasing, or sales transactions."
        />
      </section>
    </div>
  );
}

function StockSummaryView() {
  const [search, setSearch] = useState("");
  const [itemType, setItemType] = useState("");
  const [status, setStatus] = useState("ACTIVE");
  const [lowStockOnly, setLowStockOnly] = useState("");
  const [appliedFilters, setAppliedFilters] = useState({
    search: "",
    itemType: "",
    status: "ACTIVE",
    lowStockOnly: "",
  });

  const queryParams = useMemo(() => appliedFilters, [appliedFilters]);
  const summaryQuery = useStockSummary(queryParams);
  const summary = summaryQuery.data?.summary;
  const rows = summaryQuery.data?.rows || [];

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    setAppliedFilters({ search: search.trim(), itemType, status, lowStockOnly });
  };

  const handleReset = () => {
    setSearch("");
    setItemType("");
    setStatus("ACTIVE");
    setLowStockOnly("");
    setAppliedFilters({ search: "", itemType: "", status: "ACTIVE", lowStockOnly: "" });
  };

  const columns = [
    {
      key: "code",
      header: "Code",
      render: (row) => (
        <span className="font-semibold text-slate-950">{row.code}</span>
      ),
    },
    {
      key: "name",
      header: "Item",
      render: (row) => (
        <div>
          <p className="font-medium text-slate-900">{row.name}</p>
          <p className="text-xs text-slate-500">
            Unit: {row.unit?.code || "-"}
          </p>
        </div>
      ),
    },
    {
      key: "itemType",
      header: "Item Type",
      render: (row) => (
        <div className="flex flex-wrap items-center gap-1.5">
          {getItemTypeBadge(row.itemType)}
          {getProductTypeBadge(row.productType)}
        </div>
      ),
    },
    {
      key: "currentStock",
      header: "Current Stock",
      render: (row) => (
        <span
          className={`font-semibold ${
            row.lowStock ? "text-amber-700" : "text-slate-950"
          }`}
        >
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
      key: "averageCost",
      header: "Avg Cost",
      render: (row) => formatMoney(row.averageCost),
    },
    {
      key: "stockValue",
      header: "Stock Value",
      render: (row) => (
        <span className="font-semibold text-slate-950">
          {formatMoney(row.stockValue)}
        </span>
      ),
    },
    {
      key: "stockStatus",
      header: "Stock",
      render: (row) =>
        row.lowStock ? (
          <Badge variant="yellow">Low Stock</Badge>
        ) : (
          <Badge variant="green">OK</Badge>
        ),
    },
    {
      key: "status",
      header: "Status",
      render: (row) => getStatusBadge(row.status),
    },
  ];

  return (
    <div className="space-y-5">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Items In Stock"
          value={summary ? String(summary.totalItems) : "-"}
          description={
            summary
              ? `${summary.rawMaterialCount} raw material · ${summary.productCount} product`
              : undefined
          }
          icon={Boxes}
        />
        <StatCard
          title="Total Stock Value"
          value={summary ? formatMoney(summary.totalStockValue) : "-"}
          description="Quantity × average cost"
          icon={DollarSign}
        />
        <StatCard
          title="Low Stock Items"
          value={summary ? String(summary.lowStockCount) : "-"}
          description="At or below minimum stock"
          icon={TriangleAlert}
        />
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
        <form
          onSubmit={handleSearchSubmit}
          className="grid gap-3 xl:grid-cols-[1fr_190px_170px_170px_auto]"
        >
          <Input
            label="Search items"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by code or name..."
          />

          <Select
            label="Item Type"
            value={itemType}
            onChange={(event) => setItemType(event.target.value)}
          >
            <option value="">All Item Types</option>
            <option value="RAW_MATERIAL">Raw Material</option>
            <option value="FINISHED_PRODUCT">Finished Product</option>
          </Select>

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
            value={lowStockOnly}
            onChange={(event) => setLowStockOnly(event.target.value)}
          >
            <option value="">All Stock</option>
            <option value="true">Low Stock Only</option>
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

      {summaryQuery.isError ? (
        <section className="rounded-3xl border border-red-200 bg-red-50 p-5 text-red-700">
          <div className="flex items-start gap-3">
            <AlertCircle size={20} className="mt-0.5" />
            <div>
              <h2 className="text-sm font-semibold">
                Unable to load stock summary
              </h2>
              <p className="mt-1 text-sm">
                {summaryQuery.error?.message || "Please try again."}
              </p>
            </div>
          </div>
        </section>
      ) : null}

      <section className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <p className="text-sm text-slate-500">
            {rows.length} item{rows.length === 1 ? "" : "s"}
          </p>

          {summaryQuery.isFetching && !summaryQuery.isLoading ? (
            <p className="text-xs text-slate-400">Refreshing...</p>
          ) : null}
        </div>

        <DataTable
          columns={columns}
          rows={rows}
          loading={summaryQuery.isLoading}
          emptyTitle="No stock items found"
          emptyDescription="Raw materials and products will appear here once created."
        />
      </section>
    </div>
  );
}

export default function InventoryPage() {
  const [activeTab, setActiveTab] = useState("movements");

  return (
    <div className="space-y-5">
      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-sm font-medium text-slate-500">Inventory Control</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">
          Inventory
        </h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
          Track every stock movement created by receiving, production,
          purchasing, and sales, or switch to Stock On Hand to see exactly
          how much of each raw material and product is currently available.
        </p>
      </section>

      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <InventoryTabs activeTab={activeTab} onChange={setActiveTab} />
      </div>

      {activeTab === "movements" ? <MovementsView /> : <StockSummaryView />}
    </div>
  );
}
