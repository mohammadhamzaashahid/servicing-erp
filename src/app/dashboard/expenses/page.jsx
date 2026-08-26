"use client";

import { useMemo, useState } from "react";
import {
  AlertCircle,
  Edit,
  Plus,
  RefreshCw,
  Search,
  Settings,
  Trash2,
  Wallet,
} from "lucide-react";
import Button from "@/components/ui/Button";
import DataTable from "@/components/ui/DataTable";
import Drawer from "@/components/ui/Drawer";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Badge from "@/components/ui/Badge";
import StatCard from "@/components/ui/StatCard";
import ExpenseForm from "@/modules/expenses/ExpenseForm";
import {
  useCreateExpense,
  useDeleteExpense,
  useExpenses,
  useUpdateExpense,
} from "@/modules/expenses/expense.hooks";
import {
  useCreateExpenseCategory,
  useDeleteExpenseCategory,
  useExpenseCategories,
  useUpdateExpenseCategory,
} from "@/modules/expenseCategories/expenseCategory.hooks";
import ExpenseCategoryForm from "@/modules/expenseCategories/ExpenseCategoryForm";
import { formatDate, formatMoney } from "@/lib/format";

function getCategoryBadge(category) {
  if (!category) return <Badge variant="slate">-</Badge>;

  return category.type === "ADMINISTRATIVE" ? (
    <Badge variant="yellow">{category.name}</Badge>
  ) : (
    <Badge variant="blue">{category.name}</Badge>
  );
}

function getModeBadge(mode) {
  const variants = { CASH: "green", BANK: "blue", OTHER: "slate" };
  return <Badge variant={variants[mode] || "slate"}>{mode}</Badge>;
}

function ManageCategoriesDrawer({ open, onClose }) {
  const [formMode, setFormMode] = useState("create");
  const [selected, setSelected] = useState(null);
  const [formError, setFormError] = useState("");

  const categoriesQuery = useExpenseCategories({ page: 1, limit: 100 });
  const createMutation = useCreateExpenseCategory();
  const updateMutation = useUpdateExpenseCategory();
  const deleteMutation = useDeleteExpenseCategory();

  const categories = categoriesQuery.data?.data || [];
  const submitting = createMutation.isPending || updateMutation.isPending;

  const startCreate = () => {
    setSelected(null);
    setFormMode("create");
    setFormError("");
  };

  const startEdit = (category) => {
    setSelected(category);
    setFormMode("edit");
    setFormError("");
  };

  const handleSubmit = async (payload) => {
    setFormError("");

    try {
      if (formMode === "create") {
        await createMutation.mutateAsync(payload);
      } else {
        await updateMutation.mutateAsync({ id: selected.id, payload });
      }
      startCreate();
    } catch (error) {
      setFormError(error.message || "Unable to save expense category");
    }
  };

  const handleDelete = async (category) => {
    const confirmed = window.confirm(
      `Delete expense category "${category.name}"?`
    );
    if (!confirmed) return;

    try {
      await deleteMutation.mutateAsync(category.id);
    } catch (error) {
      window.alert(error.message || "Unable to delete this category");
    }
  };

  return (
    <Drawer
      open={open}
      title="Manage Expense Categories"
      description="Categories determine which section of the Income Statement an expense appears under."
      onClose={onClose}
      width="max-w-2xl"
    >
      <div className="space-y-6">
        <ExpenseCategoryForm
          mode={formMode}
          initialValues={selected}
          submitting={submitting}
          error={formError}
          onSubmit={handleSubmit}
          onCancel={startCreate}
        />

        <div className="border-t border-slate-200 pt-4">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Existing categories
          </p>

          <div className="space-y-2">
            {categoriesQuery.isLoading ? (
              <p className="text-sm text-slate-500">Loading categories...</p>
            ) : null}

            {!categoriesQuery.isLoading && categories.length === 0 ? (
              <p className="text-sm text-slate-500">No expense categories yet.</p>
            ) : null}

            {categories.map((category) => (
              <div
                key={category.id}
                className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-3"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-slate-950">
                      {category.name}
                    </span>
                    {getCategoryBadge(category)}
                    {category.status === "INACTIVE" ? (
                      <Badge variant="slate">Inactive</Badge>
                    ) : null}
                  </div>
                  <p className="mt-0.5 text-xs text-slate-500">{category.code}</p>
                </div>

                <div className="flex items-center gap-2">
                  <Button variant="secondary" size="sm" onClick={() => startEdit(category)}>
                    <Edit size={13} />
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => handleDelete(category)}
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 size={13} />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Drawer>
  );
}

export default function ExpensesPage() {
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [mode, setMode] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [appliedFilters, setAppliedFilters] = useState({
    search: "",
    categoryId: "",
    mode: "",
    from: "",
    to: "",
  });

  const [drawerMode, setDrawerMode] = useState(null);
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [formError, setFormError] = useState("");
  const [categoriesDrawerOpen, setCategoriesDrawerOpen] = useState(false);

  const categoriesQuery = useExpenseCategories({
    page: 1,
    limit: 100,
    status: "ACTIVE",
  });
  const categories = categoriesQuery.data?.data || [];

  const queryParams = useMemo(
    () => ({
      page: 1,
      limit: 100,
      ...appliedFilters,
    }),
    [appliedFilters]
  );

  const expensesQuery = useExpenses(queryParams);
  const createMutation = useCreateExpense();
  const updateMutation = useUpdateExpense();
  const deleteMutation = useDeleteExpense();

  const rows = expensesQuery.data?.data || [];
  const pagination = expensesQuery.data?.pagination;
  const totalAmount = expensesQuery.data?.totalAmount;

  const openCreateDrawer = () => {
    setSelectedExpense(null);
    setFormError("");
    setDrawerMode("create");
  };

  const openEditDrawer = (expense) => {
    setSelectedExpense(expense);
    setFormError("");
    setDrawerMode("edit");
  };

  const closeDrawer = () => {
    if (createMutation.isPending || updateMutation.isPending) return;
    setDrawerMode(null);
    setSelectedExpense(null);
    setFormError("");
  };

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    setAppliedFilters({ search: search.trim(), categoryId, mode, from, to });
  };

  const handleResetSearch = () => {
    setSearch("");
    setCategoryId("");
    setMode("");
    setFrom("");
    setTo("");
    setAppliedFilters({ search: "", categoryId: "", mode: "", from: "", to: "" });
  };

  const handleCreate = async (payload) => {
    setFormError("");
    try {
      await createMutation.mutateAsync(payload);
      closeDrawer();
    } catch (error) {
      setFormError(error.message || "Unable to record expense");
    }
  };

  const handleUpdate = async (payload) => {
    if (!selectedExpense?.id) return;
    setFormError("");
    try {
      await updateMutation.mutateAsync({ id: selectedExpense.id, payload });
      closeDrawer();
    } catch (error) {
      setFormError(error.message || "Unable to update expense");
    }
  };

  const handleDelete = async (expense) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete expense "${expense.expenseNo}"?`
    );
    if (!confirmed) return;

    try {
      await deleteMutation.mutateAsync(expense.id);
    } catch (error) {
      window.alert(error.message || "Unable to delete expense");
    }
  };

  const columns = [
    {
      key: "expenseNo",
      header: "Expense No",
      render: (row) => (
        <span className="font-semibold text-slate-950">{row.expenseNo}</span>
      ),
    },
    {
      key: "expenseDate",
      header: "Date",
      render: (row) => formatDate(row.expenseDate),
    },
    {
      key: "category",
      header: "Category",
      render: (row) => getCategoryBadge(row.category),
    },
    {
      key: "amount",
      header: "Amount",
      render: (row) => (
        <span className="font-semibold text-slate-950">
          {formatMoney(row.amount)}
        </span>
      ),
    },
    {
      key: "mode",
      header: "Mode",
      render: (row) => getModeBadge(row.mode),
    },
    {
      key: "payee",
      header: "Paid To",
      render: (row) => row.payee || "-",
    },
    {
      key: "remarks",
      header: "Remarks",
      render: (row) => (
        <span className="max-w-xs truncate text-slate-600">{row.remarks || "-"}</span>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      render: (row) => (
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={() => openEditDrawer(row)}>
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
    drawerMode === "create" ? "Record Expense" : `Edit ${selectedExpense?.expenseNo || ""}`;

  const drawerDescription =
    drawerMode === "create"
      ? "Record a daily business expense."
      : "Update this expense entry.";

  const submitting = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-5">
      <section className="flex flex-col justify-between gap-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:flex-row md:items-center">
        <div>
          <p className="text-sm font-medium text-slate-500">Accounting</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">
            Expenses
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            Record and track daily business expenses. Every expense posts to
            the daybook and feeds the Income Statement under its category.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={() => setCategoriesDrawerOpen(true)}>
            <Settings size={17} />
            Manage Categories
          </Button>
          <Button onClick={openCreateDrawer}>
            <Plus size={17} />
            New Expense
          </Button>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard
          title="Total Expenses (filtered)"
          value={formatMoney(totalAmount || 0)}
          description={`${pagination?.total ?? 0} expense${pagination?.total === 1 ? "" : "s"}`}
          icon={Wallet}
        />
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
        <form
          onSubmit={handleSearchSubmit}
          className="grid gap-3 xl:grid-cols-[1fr_200px_160px_160px_160px_auto]"
        >
          <Input
            label="Search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by expense no, payee, remarks..."
          />

          <Select
            label="Category"
            value={categoryId}
            onChange={(event) => setCategoryId(event.target.value)}
          >
            <option value="">All Categories</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </Select>

          <Select label="Mode" value={mode} onChange={(event) => setMode(event.target.value)}>
            <option value="">All Modes</option>
            <option value="CASH">Cash</option>
            <option value="BANK">Bank</option>
            <option value="OTHER">Other</option>
          </Select>

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
            <Button type="submit" variant="secondary">
              <Search size={16} />
              Apply
            </Button>
            <Button type="button" variant="ghost" onClick={handleResetSearch}>
              <RefreshCw size={16} />
              Reset
            </Button>
          </div>
        </form>
      </section>

      {expensesQuery.isError ? (
        <section className="rounded-3xl border border-red-200 bg-red-50 p-5 text-red-700">
          <div className="flex items-start gap-3">
            <AlertCircle size={20} className="mt-0.5" />
            <div>
              <h2 className="text-sm font-semibold">Unable to load expenses</h2>
              <p className="mt-1 text-sm">
                {expensesQuery.error?.message || "Please try again."}
              </p>
            </div>
          </div>
        </section>
      ) : null}

      <section className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <p className="text-sm text-slate-500">
            {pagination
              ? `${pagination.total} total expense${pagination.total === 1 ? "" : "s"}`
              : "Expenses"}
          </p>

          {expensesQuery.isFetching && !expensesQuery.isLoading ? (
            <p className="text-xs text-slate-400">Refreshing...</p>
          ) : null}
        </div>

        <DataTable
          columns={columns}
          rows={rows}
          loading={expensesQuery.isLoading}
          emptyTitle="No expenses found"
          emptyDescription="Record your first expense to start tracking daily spending."
        />
      </section>

      <Drawer
        open={Boolean(drawerMode)}
        title={drawerTitle}
        description={drawerDescription}
        onClose={closeDrawer}
        width="max-w-2xl"
      >
        <ExpenseForm
          mode={drawerMode}
          initialValues={selectedExpense}
          submitting={submitting}
          error={formError}
          onSubmit={drawerMode === "create" ? handleCreate : handleUpdate}
          onCancel={closeDrawer}
        />
      </Drawer>

      <ManageCategoriesDrawer
        open={categoriesDrawerOpen}
        onClose={() => setCategoriesDrawerOpen(false)}
      />
    </div>
  );
}
