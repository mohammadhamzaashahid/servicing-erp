"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Textarea from "@/components/ui/Textarea";
import LookupSelect from "@/components/ui/LookupSelect";
import { useExpenseCategories } from "@/modules/expenseCategories/expenseCategory.hooks";

const todayIso = () => new Date().toLocaleDateString("en-CA");

const initialForm = {
  categoryId: "",
  expenseDate: todayIso(),
  amount: "",
  mode: "CASH",
  payee: "",
  remarks: "",
};

export default function ExpenseForm({
  mode = "create",
  initialValues,
  submitting,
  error,
  onSubmit,
  onCancel,
}) {
  const [form, setForm] = useState(initialForm);
  const [formErrors, setFormErrors] = useState({});

  const categoriesQuery = useExpenseCategories({
    page: 1,
    limit: 100,
    status: "ACTIVE",
  });
  const categories = categoriesQuery.data?.data || [];

  useEffect(() => {
    if (initialValues) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setForm({
        categoryId: initialValues.categoryId || "",
        expenseDate: initialValues.expenseDate
          ? new Date(initialValues.expenseDate).toLocaleDateString("en-CA")
          : todayIso(),
        amount: String(initialValues.amount ?? ""),
        mode: initialValues.mode || "CASH",
        payee: initialValues.payee || "",
        remarks: initialValues.remarks || "",
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

    if (!form.categoryId) {
      errors.categoryId = "Select an expense category";
    }

    if (!form.expenseDate) {
      errors.expenseDate = "Expense date is required";
    }

    const amount = Number(form.amount);
    if (!form.amount || Number.isNaN(amount) || amount <= 0) {
      errors.amount = "Amount must be greater than zero";
    }

    if (form.payee.trim().length > 150) {
      errors.payee = "Payee cannot exceed 150 characters";
    }

    if (form.remarks.trim().length > 500) {
      errors.remarks = "Remarks cannot exceed 500 characters";
    }

    setFormErrors(errors);

    return Object.keys(errors).length === 0;
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!validate()) return;

    onSubmit({
      categoryId: form.categoryId,
      expenseDate: form.expenseDate,
      amount: Number(form.amount),
      mode: form.mode,
      payee: form.payee.trim() || null,
      remarks: form.remarks.trim() || null,
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
          {mode === "create" ? "Record a new expense" : "Update expense"}
        </p>
        <p className="mt-1 text-xs leading-5 text-slate-500">
          Expenses are posted to the daybook as cash/bank going out and roll
          up into the Income Statement under their category&apos;s section.
        </p>
      </div>

      <div className="grid gap-4">
        <LookupSelect
          label="Category"
          value={form.categoryId}
          onChange={(value) => updateField("categoryId", value)}
          options={categories}
          loading={categoriesQuery.isLoading}
          placeholder="Select an expense category"
          getOptionLabel={(category) => category.name}
          getOptionDescription={(category) =>
            category.type === "ADMINISTRATIVE" ? "General & Admin" : "Selling & Operating"
          }
          error={formErrors.categoryId}
          disabled={submitting}
        />

        <div className="grid gap-4 md:grid-cols-2">
          <Input
            label="Expense Date"
            type="date"
            value={form.expenseDate}
            onChange={(event) => updateField("expenseDate", event.target.value)}
            error={formErrors.expenseDate}
            disabled={submitting}
          />

          <Input
            label="Amount"
            type="number"
            min="0.01"
            step="0.01"
            value={form.amount}
            onChange={(event) => updateField("amount", event.target.value)}
            placeholder="0.00"
            error={formErrors.amount}
            disabled={submitting}
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Select
            label="Payment Mode"
            value={form.mode}
            onChange={(event) => updateField("mode", event.target.value)}
            disabled={submitting}
          >
            <option value="CASH">Cash</option>
            <option value="BANK">Bank</option>
            <option value="OTHER">Other</option>
          </Select>

          <Input
            label="Paid To (optional)"
            value={form.payee}
            onChange={(event) => updateField("payee", event.target.value)}
            placeholder="Vendor, staff, or service provider"
            error={formErrors.payee}
            disabled={submitting}
          />
        </div>

        <Textarea
          label="Remarks"
          rows={3}
          value={form.remarks}
          onChange={(event) => updateField("remarks", event.target.value)}
          placeholder="Optional note about this expense..."
          error={formErrors.remarks}
          disabled={submitting}
        />
      </div>

      <div className="flex items-center justify-end gap-3 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel} disabled={submitting}>
          Cancel
        </Button>

        <Button type="submit" disabled={submitting}>
          {submitting ? <Loader2 size={16} className="animate-spin" /> : null}
          {mode === "create" ? "Record Expense" : "Save Changes"}
        </Button>
      </div>
    </form>
  );
}
