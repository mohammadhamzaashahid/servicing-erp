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
import Badge from "@/components/ui/Badge";
import {
  useCreateUnit,
  useDeleteUnit,
  useUnits,
  useUpdateUnit,
} from "@/modules/units/unit.hooks";
import UnitForm from "@/modules/units/UnitForm";
import { formatDate } from "@/lib/format";

export default function UnitsPage() {
  const [search, setSearch] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [drawerMode, setDrawerMode] = useState(null);
  const [selectedUnit, setSelectedUnit] = useState(null);
  const [formError, setFormError] = useState("");

  const queryParams = useMemo(
    () => ({
      page: 1,
      limit: 50,
      search: appliedSearch,
    }),
    [appliedSearch]
  );

  const unitsQuery = useUnits(queryParams);
  const createMutation = useCreateUnit();
  const updateMutation = useUpdateUnit();
  const deleteMutation = useDeleteUnit();

  const rows = unitsQuery.data?.data || [];
  const pagination = unitsQuery.data?.pagination;

  const openCreateDrawer = () => {
    setSelectedUnit(null);
    setFormError("");
    setDrawerMode("create");
  };

  const openEditDrawer = (unit) => {
    setSelectedUnit(unit);
    setFormError("");
    setDrawerMode("edit");
  };

  const closeDrawer = () => {
    if (createMutation.isPending || updateMutation.isPending) return;

    setDrawerMode(null);
    setSelectedUnit(null);
    setFormError("");
  };

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    setAppliedSearch(search.trim());
  };

  const handleResetSearch = () => {
    setSearch("");
    setAppliedSearch("");
  };

  const handleCreate = async (payload) => {
    setFormError("");

    try {
      await createMutation.mutateAsync(payload);
      closeDrawer();
    } catch (error) {
      setFormError(error.message || "Unable to create unit");
    }
  };

  const handleUpdate = async (payload) => {
    if (!selectedUnit?.id) return;

    setFormError("");

    try {
      await updateMutation.mutateAsync({
        id: selectedUnit.id,
        payload,
      });

      closeDrawer();
    } catch (error) {
      setFormError(error.message || "Unable to update unit");
    }
  };

  const handleDelete = async (unit) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete unit "${unit.code}"?`
    );

    if (!confirmed) return;

    try {
      await deleteMutation.mutateAsync(unit.id);
    } catch (error) {
      window.alert(error.message || "Unable to delete unit");
    }
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
      header: "Name",
    },
    {
      key: "status",
      header: "Status",
      render: () => <Badge variant="green">Active</Badge>,
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
    drawerMode === "create" ? "Create Unit" : `Edit ${selectedUnit?.code || ""}`;

  const drawerDescription =
    drawerMode === "create"
      ? "Add a new measurement unit for inventory items."
      : "Update the selected measurement unit.";

  const submitting = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-5">
      <section className="flex flex-col justify-between gap-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:flex-row md:items-center">
        <div>
          <p className="text-sm font-medium text-slate-500">Master Data</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">
            Units
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            Manage measurement units used for raw materials and finished
            products, such as KG, PCS, LTR, BAG, and BOX.
          </p>
        </div>

        <Button onClick={openCreateDrawer}>
          <Plus size={17} />
          New Unit
        </Button>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
        <form
          onSubmit={handleSearchSubmit}
          className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between"
        >
          <div className="w-full md:max-w-md">
            <Input
              label="Search units"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by code or name..."
            />
          </div>

          <div className="flex items-center gap-2">
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

      {unitsQuery.isError ? (
        <section className="rounded-3xl border border-red-200 bg-red-50 p-5 text-red-700">
          <div className="flex items-start gap-3">
            <AlertCircle size={20} className="mt-0.5" />
            <div>
              <h2 className="text-sm font-semibold">Unable to load units</h2>
              <p className="mt-1 text-sm">
                {unitsQuery.error?.message || "Please try again."}
              </p>
            </div>
          </div>
        </section>
      ) : null}

      <section className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <p className="text-sm text-slate-500">
            {pagination
              ? `${pagination.total} total unit${
                  pagination.total === 1 ? "" : "s"
                }`
              : "Units"}
          </p>

          {unitsQuery.isFetching && !unitsQuery.isLoading ? (
            <p className="text-xs text-slate-400">Refreshing...</p>
          ) : null}
        </div>

        <DataTable
          columns={columns}
          rows={rows}
          loading={unitsQuery.isLoading}
          emptyTitle="No units found"
          emptyDescription="Create your first unit to start defining inventory items."
        />
      </section>

      <Drawer
        open={Boolean(drawerMode)}
        title={drawerTitle}
        description={drawerDescription}
        onClose={closeDrawer}
      >
        <UnitForm
          mode={drawerMode}
          initialValues={selectedUnit}
          submitting={submitting}
          error={formError}
          onSubmit={drawerMode === "create" ? handleCreate : handleUpdate}
          onCancel={closeDrawer}
        />
      </Drawer>
    </div>
  );
}