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
import CustomerForm from "@/modules/customers/CustomerForm";
import {
  useCreateCustomer,
  useCustomers,
  useDeleteCustomer,
  useUpdateCustomer,
} from "@/modules/customers/customer.hooks";
import { formatDate, formatMoney } from "@/lib/format";

function getStatusBadge(status) {
  if (status === "ACTIVE") {
    return <Badge variant="green">Active</Badge>;
  }

  return <Badge variant="slate">Inactive</Badge>;
}

export default function CustomersPage() {
  const [search, setSearch] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [status, setStatus] = useState("");
  const [appliedStatus, setAppliedStatus] = useState("");
  const [drawerMode, setDrawerMode] = useState(null);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [formError, setFormError] = useState("");

  const queryParams = useMemo(
    () => ({
      page: 1,
      limit: 50,
      search: appliedSearch,
      status: appliedStatus,
    }),
    [appliedSearch, appliedStatus]
  );

  const customersQuery = useCustomers(queryParams);
  const createMutation = useCreateCustomer();
  const updateMutation = useUpdateCustomer();
  const deleteMutation = useDeleteCustomer();

  const rows = customersQuery.data?.data || [];
  const pagination = customersQuery.data?.pagination;

  const openCreateDrawer = () => {
    setSelectedCustomer(null);
    setFormError("");
    setDrawerMode("create");
  };

  const openEditDrawer = (customer) => {
    setSelectedCustomer(customer);
    setFormError("");
    setDrawerMode("edit");
  };

  const closeDrawer = () => {
    if (createMutation.isPending || updateMutation.isPending) return;

    setDrawerMode(null);
    setSelectedCustomer(null);
    setFormError("");
  };

  const handleSearchSubmit = (event) => {
    event.preventDefault();

    setAppliedSearch(search.trim());
    setAppliedStatus(status);
  };

  const handleResetSearch = () => {
    setSearch("");
    setStatus("");
    setAppliedSearch("");
    setAppliedStatus("");
  };

  const handleCreate = async (payload) => {
    setFormError("");

    try {
      await createMutation.mutateAsync(payload);
      closeDrawer();
    } catch (error) {
      setFormError(error.message || "Unable to create customer");
    }
  };

  const handleUpdate = async (payload) => {
    if (!selectedCustomer?.id) return;

    setFormError("");

    try {
      await updateMutation.mutateAsync({
        id: selectedCustomer.id,
        payload,
      });

      closeDrawer();
    } catch (error) {
      setFormError(error.message || "Unable to update customer");
    }
  };

  const handleDelete = async (customer) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete customer "${customer.name}"?`
    );

    if (!confirmed) return;

    try {
      await deleteMutation.mutateAsync(customer.id);
    } catch (error) {
      window.alert(
        error.message ||
          "Unable to delete customer. If this customer has transactions, mark it inactive instead."
      );
    }
  };

  const columns = [
    {
      key: "customerCode",
      header: "Code",
      render: (row) => (
        <span className="font-semibold text-slate-950">{row.customerCode}</span>
      ),
    },
    {
      key: "name",
      header: "Customer",
      render: (row) => (
        <div>
          <p className="font-medium text-slate-900">{row.name}</p>
          <p className="text-xs text-slate-500">{row.email || "-"}</p>
        </div>
      ),
    },
    {
      key: "phone",
      header: "Phone",
      render: (row) => row.phone || "-",
    },
    {
      key: "city",
      header: "City",
      render: (row) => row.city || "-",
    },
    {
      key: "openingBalance",
      header: "Opening",
      render: (row) => (
        <span className="font-medium">{formatMoney(row.openingBalance)}</span>
      ),
    },
    {
      key: "currentBalance",
      header: "Receivable",
      render: (row) => (
        <span className="font-semibold text-slate-950">
          {formatMoney(row.currentBalance)}
        </span>
      ),
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
      ? "Create Customer"
      : `Edit ${selectedCustomer?.customerCode || ""}`;

  const drawerDescription =
    drawerMode === "create"
      ? "Register a customer who purchases finished products."
      : "Update customer contact and status details.";

  const submitting = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-5">
      <section className="flex flex-col justify-between gap-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:flex-row md:items-center">
        <div>
          <p className="text-sm font-medium text-slate-500">Master Data</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">
            Customers
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            Register customers, maintain contact information, and track
            receivable balances created from sales invoices.
          </p>
        </div>

        <Button onClick={openCreateDrawer}>
          <Plus size={17} />
          New Customer
        </Button>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
        <form
          onSubmit={handleSearchSubmit}
          className="grid gap-3 md:grid-cols-[1fr_220px_auto]"
        >
          <Input
            label="Search customers"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by code, name, phone, email, or city..."
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

      {customersQuery.isError ? (
        <section className="rounded-3xl border border-red-200 bg-red-50 p-5 text-red-700">
          <div className="flex items-start gap-3">
            <AlertCircle size={20} className="mt-0.5" />
            <div>
              <h2 className="text-sm font-semibold">Unable to load customers</h2>
              <p className="mt-1 text-sm">
                {customersQuery.error?.message || "Please try again."}
              </p>
            </div>
          </div>
        </section>
      ) : null}

      <section className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <p className="text-sm text-slate-500">
            {pagination
              ? `${pagination.total} total customer${
                  pagination.total === 1 ? "" : "s"
                }`
              : "Customers"}
          </p>

          {customersQuery.isFetching && !customersQuery.isLoading ? (
            <p className="text-xs text-slate-400">Refreshing...</p>
          ) : null}
        </div>

        <DataTable
          columns={columns}
          rows={rows}
          loading={customersQuery.isLoading}
          emptyTitle="No customers found"
          emptyDescription="Create your first customer before creating sales invoices."
        />
      </section>

      <Drawer
        open={Boolean(drawerMode)}
        title={drawerTitle}
        description={drawerDescription}
        onClose={closeDrawer}
        width="max-w-2xl"
      >
        <CustomerForm
          mode={drawerMode}
          initialValues={selectedCustomer}
          submitting={submitting}
          error={formError}
          onSubmit={drawerMode === "create" ? handleCreate : handleUpdate}
          onCancel={closeDrawer}
        />
      </Drawer>
    </div>
  );
}