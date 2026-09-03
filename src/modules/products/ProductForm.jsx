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
  standardPrice: "0",
  minimumStock: "0",
  productType: "MANUFACTURED",
  status: "ACTIVE",
};

export default function ProductForm({
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
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setForm({
        name: initialValues.name || "",
        unitId: initialValues.unitId || "",
        standardPrice: String(initialValues.standardPrice ?? "0"),
        minimumStock: String(initialValues.minimumStock ?? "0"),
        productType: initialValues.productType || "MANUFACTURED",
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
      errors.name = "Product name is required";
    }

    if (form.name.trim().length < 2) {
      errors.name = "Product name must be at least 2 characters";
    }

    if (form.name.trim().length > 150) {
      errors.name = "Product name cannot exceed 150 characters";
    }

    if (!form.unitId) {
      errors.unitId = "Unit is required";
    }

    const standardPrice = Number(form.standardPrice || 0);

    if (Number.isNaN(standardPrice) || standardPrice < 0) {
      errors.standardPrice = "Standard price must be zero or greater";
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
      standardPrice: Number(form.standardPrice || 0),
      minimumStock: Number(form.minimumStock || 0),
      productType: form.productType,
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
          {mode === "create" ? "Create finished product" : "Update product details"}
        </p>
        <p className="mt-1 text-xs leading-5 text-slate-500">
          Products are finished goods produced from raw materials and sold to
          customers. Product stock is updated by production and sales
          transactions.
        </p>
      </div>

      <div className="grid gap-4">
        <Input
          label="Product Name"
          value={form.name}
          onChange={(event) => updateField("name", event.target.value)}
          placeholder="Example: Plastic Bucket"
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

        <Select
          label="Product Type"
          value={form.productType}
          onChange={(event) => updateField("productType", event.target.value)}
          disabled={submitting}
        >
          <option value="MANUFACTURED">Manufactured (from Production)</option>
          <option value="TRADING">Trading (bought directly, resold as-is)</option>
        </Select>

        <div className="grid gap-4 md:grid-cols-2">
          <Input
            label="Standard Price"
            type="number"
            min="0"
            step="0.01"
            value={form.standardPrice}
            onChange={(event) =>
              updateField("standardPrice", event.target.value)
            }
            placeholder="0"
            error={formErrors.standardPrice}
            disabled={submitting}
          />

          <Input
            label="Minimum Stock"
            type="number"
            min="0"
            step="0.001"
            value={form.minimumStock}
            onChange={(event) =>
              updateField("minimumStock", event.target.value)
            }
            placeholder="0"
            error={formErrors.minimumStock}
            disabled={submitting}
          />
        </div>

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

      <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4">
        <p className="text-xs leading-5 text-blue-800">
          Standard price is only a default/reference price. During sales invoice
          creation, you can enter a different sale price for every customer and
          every invoice line.
        </p>
      </div>

      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
        <p className="text-xs leading-5 text-amber-800">
          Current stock is system-calculated and decreases from sales
          invoices. Manufactured products get stock from Production;
          trading products get stock from Product Purchasing — each product
          can only receive stock through the flow matching its type.
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
          {mode === "create" ? "Create Product" : "Save Changes"}
        </Button>
      </div>
    </form>
  );
}