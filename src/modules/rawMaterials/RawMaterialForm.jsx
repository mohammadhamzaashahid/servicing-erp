"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import LookupSelect from "@/components/ui/LookupSelect";

const initialForm = {
  name: "",
  unitId: "",
  minimumStock: "0",
  status: "ACTIVE",
};

export default function RawMaterialForm({
  mode = "create",
  initialValues,
  units = [],
  unitsLoading = false,
  submitting,
  error,
  onSubmit,
  onCancel,
}) {
  const [form, setForm] = useState(initialForm);
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    if (initialValues) {
      setForm({
        name: initialValues.name || "",
        unitId: initialValues.unitId || "",
        minimumStock: String(initialValues.minimumStock ?? "0"),
        status: initialValues.status || "ACTIVE",
      });
    } else {
      setForm(initialForm);
    }

    setFormErrors({});
  }, [initialValues]);

  const updateField = (field, value) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));

    setFormErrors((prev) => ({
      ...prev,
      [field]: "",
    }));
  };

  const validate = () => {
    const errors = {};

    if (!form.name.trim()) {
      errors.name = "Raw material name is required";
    }

    if (form.name.trim().length < 2) {
      errors.name = "Raw material name must be at least 2 characters";
    }

    if (form.name.trim().length > 150) {
      errors.name = "Raw material name cannot exceed 150 characters";
    }

    if (!form.unitId) {
      errors.unitId = "Unit is required";
    }

    const minimumStock = Number(form.minimumStock || 0);

    if (Number.isNaN(minimumStock) || minimumStock < 0) {
      errors.minimumStock = "Minimum stock must be zero or greater";
    }

    setFormErrors(errors);

    return Object.keys(errors).length === 0;
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!validate()) return;

    const payload = {
      name: form.name.trim(),
      unitId: form.unitId,
      minimumStock: Number(form.minimumStock || 0),
    };

    if (mode === "edit") {
      payload.status = form.status;
    }

    onSubmit(payload);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <p className="text-sm font-medium text-slate-900">
          {mode === "create"
            ? "Create raw material"
            : "Update raw material details"}
        </p>
        <p className="mt-1 text-xs leading-5 text-slate-500">
          Raw materials are purchased from vendors and consumed during
          production. Stock is updated through receiving and production, not
          from this master form.
        </p>
      </div>

      <div className="grid gap-4">
        <Input
          label="Raw Material Name"
          value={form.name}
          onChange={(event) => updateField("name", event.target.value)}
          placeholder="Example: Plastic Granules"
          error={formErrors.name}
          disabled={submitting}
        />

        <LookupSelect
          label="Unit"
          value={form.unitId}
          onChange={(value) => updateField("unitId", value)}
          options={units}
          loading={unitsLoading}
          placeholder="Select unit"
          getOptionValue={(unit) => unit.id}
          getOptionLabel={(unit) => unit.code}
          getOptionDescription={(unit) => unit.name}
          error={formErrors.unitId}
          disabled={submitting}
        />

        <Input
          label="Minimum Stock"
          type="number"
          min="0"
          step="0.001"
          value={form.minimumStock}
          onChange={(event) => updateField("minimumStock", event.target.value)}
          placeholder="0"
          error={formErrors.minimumStock}
          disabled={submitting}
        />

        {mode === "edit" ? (
          <Select
            label="Status"
            value={form.status}
            onChange={(event) => updateField("status", event.target.value)}
            disabled={submitting}
          >
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </Select>
        ) : null}
      </div>

      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
        <p className="text-xs leading-5 text-amber-800">
          Current stock and average cost are system-calculated fields. They will
          update automatically after material receiving and production posting.
        </p>
      </div>

      <div className="flex items-center justify-end gap-3 pt-2">
        <Button
          type="button"
          variant="secondary"
          onClick={onCancel}
          disabled={submitting}
        >
          Cancel
        </Button>

        <Button type="submit" disabled={submitting || unitsLoading}>
          {submitting ? <Loader2 size={16} className="animate-spin" /> : null}
          {mode === "create" ? "Create Raw Material" : "Save Changes"}
        </Button>
      </div>
    </form>
  );
}