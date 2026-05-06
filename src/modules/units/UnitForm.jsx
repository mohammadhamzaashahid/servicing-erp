"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

const initialForm = {
  code: "",
  name: "",
};

export default function UnitForm({
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
    const newForm = initialValues
      ? {
          code: initialValues.code || "",
          name: initialValues.name || "",
        }
      : initialForm;

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setForm((prev) => {
      if (prev.code !== newForm.code || prev.name !== newForm.name) {
        return newForm;
      }
      return prev;
    });

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

    if (!form.code.trim()) {
      errors.code = "Unit code is required";
    }

    if (form.code.trim().length > 20) {
      errors.code = "Unit code cannot exceed 20 characters";
    }

    if (!form.name.trim()) {
      errors.name = "Unit name is required";
    }

    if (form.name.trim().length > 100) {
      errors.name = "Unit name cannot exceed 100 characters";
    }

    setFormErrors(errors);

    return Object.keys(errors).length === 0;
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!validate()) return;

    onSubmit({
      code: form.code.trim().toUpperCase(),
      name: form.name.trim(),
    });
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
          {mode === "create" ? "Create a new unit" : "Update unit details"}
        </p>
        <p className="mt-1 text-xs leading-5 text-slate-500">
          Units are used by raw materials and finished products. Example: KG,
          PCS, LTR, BOX.
        </p>
      </div>

      <div className="grid gap-4">
        <Input
          label="Unit Code"
          value={form.code}
          onChange={(event) => updateField("code", event.target.value)}
          placeholder="Example: KG"
          error={formErrors.code}
          disabled={submitting}
        />

        <Input
          label="Unit Name"
          value={form.name}
          onChange={(event) => updateField("name", event.target.value)}
          placeholder="Example: Kilogram"
          error={formErrors.name}
          disabled={submitting}
        />
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

        <Button type="submit" disabled={submitting}>
          {submitting ? <Loader2 size={16} className="animate-spin" /> : null}
          {mode === "create" ? "Create Unit" : "Save Changes"}
        </Button>
      </div>
    </form>
  );
}