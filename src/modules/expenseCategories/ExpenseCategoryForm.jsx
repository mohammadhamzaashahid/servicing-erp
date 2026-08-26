"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";

const initialForm = {
  code: "",
  name: "",
  type: "OPERATING",
  status: "ACTIVE",
};

export default function ExpenseCategoryForm({
  mode = "create",
  initialValues,
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
        code: initialValues.code || "",
        name: initialValues.name || "",
        type: initialValues.type || "OPERATING",
        status: initialValues.status || "ACTIVE",
      });
    } else {
      setForm(initialForm);
    }

    setFormErrors({});
  }, [initialValues]);

  const updateField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setFormErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const validate = () => {
    const errors = {};

    if (!form.code.trim()) {
      errors.code = "Category code is required";
    }

    if (form.code.trim().length > 20) {
      errors.code = "Category code cannot exceed 20 characters";
    }

    if (!form.name.trim()) {
      errors.name = "Category name is required";
    }

    if (form.name.trim().length > 100) {
      errors.name = "Category name cannot exceed 100 characters";
    }

    setFormErrors(errors);

    return Object.keys(errors).length === 0;
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!validate()) return;

    const payload = {
      code: form.code.trim().toUpperCase(),
      name: form.name.trim(),
      type: form.type,
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
          {mode === "create" ? "Create an expense category" : "Update expense category"}
        </p>
        <p className="mt-1 text-xs leading-5 text-slate-500">
          The type determines which section of the Income Statement this
          category&apos;s expenses appear under.
        </p>
      </div>

      <div className="grid gap-4">
        <Input
          label="Category Code"
          value={form.code}
          onChange={(event) => updateField("code", event.target.value)}
          placeholder="Example: RENT"
          error={formErrors.code}
          disabled={submitting}
        />

        <Input
          label="Category Name"
          value={form.name}
          onChange={(event) => updateField("name", event.target.value)}
          placeholder="Example: Rent Expense"
          error={formErrors.name}
          disabled={submitting}
        />

        <Select
          label="Income Statement Section"
          value={form.type}
          onChange={(event) => updateField("type", event.target.value)}
          disabled={submitting}
        >
          <option value="OPERATING">Selling &amp; Operating Expenses</option>
          <option value="ADMINISTRATIVE">General &amp; Administrative Expenses</option>
        </Select>

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

      <div className="flex items-center justify-end gap-3 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel} disabled={submitting}>
          Cancel
        </Button>

        <Button type="submit" disabled={submitting}>
          {submitting ? <Loader2 size={16} className="animate-spin" /> : null}
          {mode === "create" ? "Create Category" : "Save Changes"}
        </Button>
      </div>
    </form>
  );
}
