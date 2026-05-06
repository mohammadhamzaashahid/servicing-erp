"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Textarea from "@/components/ui/Textarea";

const initialForm = {
  name: "",
  phone: "",
  email: "",
  city: "",
  address: "",
  openingBalance: "0",
  status: "ACTIVE",
};

export default function VendorForm({
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
        name: initialValues.name || "",
        phone: initialValues.phone || "",
        email: initialValues.email || "",
        city: initialValues.city || "",
        address: initialValues.address || "",
        openingBalance: String(initialValues.openingBalance ?? "0"),
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
      errors.name = "Vendor name is required";
    }

    if (form.name.trim().length < 2) {
      errors.name = "Vendor name must be at least 2 characters";
    }

    if (form.name.trim().length > 150) {
      errors.name = "Vendor name cannot exceed 150 characters";
    }

    if (form.email.trim() && !/^\S+@\S+\.\S+$/.test(form.email.trim())) {
      errors.email = "Enter a valid email address";
    }

    if (form.phone.trim().length > 50) {
      errors.phone = "Phone cannot exceed 50 characters";
    }

    if (form.city.trim().length > 100) {
      errors.city = "City cannot exceed 100 characters";
    }

    if (form.address.trim().length > 500) {
      errors.address = "Address cannot exceed 500 characters";
    }

    if (mode === "create") {
      const openingBalance = Number(form.openingBalance || 0);

      if (Number.isNaN(openingBalance) || openingBalance < 0) {
        errors.openingBalance = "Opening balance must be zero or greater";
      }
    }

    setFormErrors(errors);

    return Object.keys(errors).length === 0;
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!validate()) return;

    const payload = {
      name: form.name.trim(),
      phone: form.phone.trim() || null,
      email: form.email.trim() || null,
      city: form.city.trim() || null,
      address: form.address.trim() || null,
    };

    if (mode === "create") {
      payload.openingBalance = Number(form.openingBalance || 0);
    }

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
          {mode === "create" ? "Register a new vendor" : "Update vendor details"}
        </p>
        <p className="mt-1 text-xs leading-5 text-slate-500">
          Vendors supply raw material. Their payable balance is updated
          automatically from material receiving and payment transactions.
        </p>
      </div>

      <div className="grid gap-4">
        <Input
          label="Vendor Name"
          value={form.name}
          onChange={(event) => updateField("name", event.target.value)}
          placeholder="Example: ABC Raw Material Supplier"
          error={formErrors.name}
          disabled={submitting}
        />

        <div className="grid gap-4 md:grid-cols-2">
          <Input
            label="Phone"
            value={form.phone}
            onChange={(event) => updateField("phone", event.target.value)}
            placeholder="03001234567"
            error={formErrors.phone}
            disabled={submitting}
          />

          <Input
            label="Email"
            type="email"
            value={form.email}
            onChange={(event) => updateField("email", event.target.value)}
            placeholder="vendor@example.com"
            error={formErrors.email}
            disabled={submitting}
          />
        </div>

        <Input
          label="City"
          value={form.city}
          onChange={(event) => updateField("city", event.target.value)}
          placeholder="Lahore"
          error={formErrors.city}
          disabled={submitting}
        />

        <Textarea
          label="Address"
          value={form.address}
          onChange={(event) => updateField("address", event.target.value)}
          placeholder="Vendor address..."
          error={formErrors.address}
          disabled={submitting}
        />

        {mode === "create" ? (
          <Input
            label="Opening Balance"
            type="number"
            min="0"
            step="0.01"
            value={form.openingBalance}
            onChange={(event) =>
              updateField("openingBalance", event.target.value)
            }
            placeholder="0"
            error={formErrors.openingBalance}
            disabled={submitting}
          />
        ) : (
          <Select
            label="Status"
            value={form.status}
            onChange={(event) => updateField("status", event.target.value)}
            disabled={submitting}
          >
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </Select>
        )}
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
          {mode === "create" ? "Create Vendor" : "Save Changes"}
        </Button>
      </div>
    </form>
  );
}