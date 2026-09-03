"use client";

import { useMemo, useState } from "react";
import { Loader2, Plus, Trash2 } from "lucide-react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Textarea from "@/components/ui/Textarea";
import LookupSelect from "@/components/ui/LookupSelect";
import { formatMoney, formatQty } from "@/lib/format";

const createEmptyLine = () => ({
  rowId: crypto.randomUUID(),
  productId: "",
  quantity: "1",
  rate: "0",
});

const buildInitialForm = () => ({
  vendorId: "",
  purchaseDate: new Date().toLocaleDateString("en-CA"),
  paidAmount: "0",
  remarks: "",
  lines: [createEmptyLine()],
});

export default function ProductPurchaseForm({
  vendors = [],
  products = [],
  vendorsLoading = false,
  productsLoading = false,
  submitting,
  error,
  onSubmit,
  onCancel,
}) {
  const [form, setForm] = useState(buildInitialForm);
  const [formErrors, setFormErrors] = useState({});

  const selectedVendor = useMemo(() => {
    return vendors.find((v) => v.id === form.vendorId);
  }, [vendors, form.vendorId]);

  const productMap = useMemo(() => {
    const map = new Map();
    products.forEach((p) => map.set(p.id, p));
    return map;
  }, [products]);

  const totals = useMemo(() => {
    const subtotal = form.lines.reduce((sum, line) => {
      const quantity = Number(line.quantity || 0);
      const rate = Number(line.rate || 0);
      if (Number.isNaN(quantity) || Number.isNaN(rate)) return sum;
      return sum + quantity * rate;
    }, 0);

    const paidAmount = Number(form.paidAmount || 0);
    const safePaid = Number.isNaN(paidAmount) ? 0 : paidAmount;

    return {
      subtotal,
      paidAmount: safePaid,
      balanceAmount: Math.max(subtotal - safePaid, 0),
    };
  }, [form.lines, form.paidAmount]);

  const updateField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setFormErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const updateLine = (rowId, field, value) => {
    setForm((prev) => ({
      ...prev,
      lines: prev.lines.map((line) =>
        line.rowId === rowId ? { ...line, [field]: value } : line
      ),
    }));
    setFormErrors((prev) => ({ ...prev, lines: "" }));
  };

  const handleProductChange = (rowId, productId) => {
    const product = productMap.get(productId);
    setForm((prev) => ({
      ...prev,
      lines: prev.lines.map((line) =>
        line.rowId === rowId
          ? {
              ...line,
              productId,
              // Pre-fill rate from average cost if available
              rate:
                product && Number(product.averageCost) > 0
                  ? String(Number(product.averageCost).toFixed(4))
                  : line.rate,
            }
          : line
      ),
    }));
    setFormErrors((prev) => ({ ...prev, lines: "" }));
  };

  const addLine = () => {
    setForm((prev) => ({ ...prev, lines: [...prev.lines, createEmptyLine()] }));
    setFormErrors((prev) => ({ ...prev, lines: "" }));
  };

  const removeLine = (rowId) => {
    setForm((prev) => {
      if (prev.lines.length === 1) return prev;
      return { ...prev, lines: prev.lines.filter((l) => l.rowId !== rowId) };
    });
  };

  const validate = () => {
    const errors = {};

    if (!form.vendorId) errors.vendorId = "Vendor is required";

    if (!form.lines.length) errors.lines = "At least one line is required";

    const usedProducts = new Set();

    form.lines.forEach((line, index) => {
      const lineNo = index + 1;

      if (!line.productId) {
        errors.lines = `Product is required on line ${lineNo}`;
        return;
      }

      if (usedProducts.has(line.productId)) {
        errors.lines = `Duplicate product on line ${lineNo}. Use one line per product.`;
        return;
      }

      usedProducts.add(line.productId);

      const qty = Number(line.quantity || 0);
      const rate = Number(line.rate || 0);

      if (Number.isNaN(qty) || qty <= 0) {
        errors.lines = `Quantity must be greater than 0 on line ${lineNo}`;
        return;
      }

      if (Number.isNaN(rate) || rate < 0) {
        errors.lines = `Rate cannot be negative on line ${lineNo}`;
      }
    });

    const paidAmount = Number(form.paidAmount || 0);

    if (Number.isNaN(paidAmount) || paidAmount < 0) {
      errors.paidAmount = "Paid amount must be zero or greater";
    }

    if (paidAmount > totals.subtotal) {
      errors.paidAmount = "Paid amount cannot be greater than subtotal";
    }

    if (form.remarks.trim().length > 500) {
      errors.remarks = "Remarks cannot exceed 500 characters";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const resetForm = () => {
    setForm(buildInitialForm());
    setFormErrors({});
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validate()) return;

    const payload = {
      vendorId: form.vendorId,
      paidAmount: Number(form.paidAmount || 0),
      remarks: form.remarks.trim() || null,
      lines: form.lines.map((line) => ({
        productId: line.productId,
        quantity: Number(line.quantity),
        rate: Number(line.rate),
      })),
    };

    if (form.purchaseDate) payload.purchaseDate = form.purchaseDate;

    await onSubmit(payload, resetForm);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <p className="text-sm font-medium text-slate-900">Post a direct product purchase</p>
        <p className="mt-1 text-xs leading-5 text-slate-500">
          Only products marked as &quot;Trading&quot; can be purchased here.
          Select the vendor, add product lines with quantity and rate, then
          post the purchase.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <LookupSelect
          label="Vendor"
          value={form.vendorId}
          onChange={(value) => updateField("vendorId", value)}
          options={vendors}
          loading={vendorsLoading}
          placeholder="Select vendor"
          getOptionValue={(v) => v.id}
          getOptionLabel={(v) => v.vendorCode || v.name}
          getOptionDescription={(v) => v.name}
          error={formErrors.vendorId}
          disabled={submitting}
        />

        <Input
          label="Purchase Date"
          type="date"
          value={form.purchaseDate}
          onChange={(e) => updateField("purchaseDate", e.target.value)}
          disabled={submitting}
        />
      </div>

      {selectedVendor ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Selected Vendor
          </p>
          <div className="mt-2 grid gap-3 md:grid-cols-3">
            <div>
              <p className="text-xs text-slate-500">Name</p>
              <p className="text-sm font-medium text-slate-950">{selectedVendor.name}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Phone</p>
              <p className="text-sm font-medium text-slate-950">{selectedVendor.phone || "-"}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Current Payable</p>
              <p className="text-sm font-semibold text-slate-950">
                {formatMoney(selectedVendor.currentBalance)}
              </p>
            </div>
          </div>
        </div>
      ) : null}

      <div className="rounded-2xl border border-slate-200 bg-white">
        <div className="flex flex-col gap-3 border-b border-slate-200 p-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-950">Purchase Lines</h3>
            <p className="mt-1 text-xs text-slate-500">
              Add each trading product with purchased quantity and rate.
            </p>
          </div>
          <Button type="button" variant="secondary" size="sm" onClick={addLine}>
            <Plus size={15} />
            Add Line
          </Button>
        </div>

        {formErrors.lines ? (
          <div className="border-b border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {formErrors.lines}
          </div>
        ) : null}

        <div className="divide-y divide-slate-100">
          {form.lines.map((line, index) => {
            const product = productMap.get(line.productId);
            const quantity = Number(line.quantity || 0);
            const rate = Number(line.rate || 0);
            const lineTotal =
              Number.isNaN(quantity) || Number.isNaN(rate) ? 0 : quantity * rate;

            return (
              <div key={line.rowId} className="space-y-3 p-4">
                <LookupSelect
                  label={index === 0 ? "Product" : undefined}
                  value={line.productId}
                  onChange={(value) => handleProductChange(line.rowId, value)}
                  options={products}
                  loading={productsLoading}
                  placeholder="Select trading product"
                  getOptionValue={(item) => item.id}
                  getOptionLabel={(item) => item.productCode || item.name}
                  getOptionDescription={(item) =>
                    `${item.name} • Stock: ${formatQty(item.currentStock)} ${
                      item.unit?.code || ""
                    } • Avg cost: ${formatMoney(item.averageCost)}`
                  }
                  disabled={submitting}
                />

                <div className="grid items-end gap-3 sm:grid-cols-[140px_140px_1fr_52px]">
                  <Input
                    label={`Qty${product?.unit?.code ? ` (${product.unit.code})` : ""}`}
                    type="number"
                    min="0"
                    step="0.001"
                    value={line.quantity}
                    onChange={(e) => updateLine(line.rowId, "quantity", e.target.value)}
                    disabled={submitting}
                  />

                  <Input
                    label="Rate / Unit"
                    type="number"
                    min="0"
                    step="0.01"
                    value={line.rate}
                    onChange={(e) => updateLine(line.rowId, "rate", e.target.value)}
                    disabled={submitting}
                  />

                  <div>
                    <p className="mb-1.5 text-xs font-medium text-slate-600">Line Total</p>
                    <div className="flex h-10 items-center rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-semibold text-slate-950">
                      {formatMoney(lineTotal)}
                    </div>
                  </div>

                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-red-600 hover:bg-red-50 hover:text-red-700"
                    onClick={() => removeLine(line.rowId)}
                    disabled={submitting || form.lines.length === 1}
                  >
                    <Trash2 size={16} />
                  </Button>
                </div>

                {product ? (
                  <div className="rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-500">
                    Current stock:{" "}
                    <span className="font-medium text-slate-700">
                      {formatQty(product.currentStock)} {product.unit?.code || ""}
                    </span>
                    {" "}• Average cost:{" "}
                    <span className="font-medium text-slate-700">
                      {formatMoney(product.averageCost)} / {product.unit?.code || "unit"}
                    </span>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-[1fr_280px]">
        <Textarea
          label="Remarks"
          value={form.remarks}
          onChange={(e) => updateField("remarks", e.target.value)}
          placeholder="Optional purchase remarks..."
          error={formErrors.remarks}
          disabled={submitting}
        />

        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <h3 className="text-sm font-semibold text-slate-950">Purchase Summary</h3>

          <div className="mt-4 space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500">Subtotal</span>
              <span className="font-semibold text-slate-950">{formatMoney(totals.subtotal)}</span>
            </div>

            <Input
              label="Paid Amount"
              type="number"
              min="0"
              step="0.01"
              value={form.paidAmount}
              onChange={(e) => updateField("paidAmount", e.target.value)}
              error={formErrors.paidAmount}
              disabled={submitting}
            />

            <div className="flex items-center justify-between rounded-xl bg-white px-3 py-3 text-sm">
              <span className="text-slate-500">Balance Payable</span>
              <span className="font-semibold text-slate-950">
                {formatMoney(totals.balanceAmount)}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel} disabled={submitting}>
          Cancel
        </Button>

        <Button
          type="submit"
          disabled={submitting || vendorsLoading || productsLoading}
        >
          {submitting ? <Loader2 size={16} className="animate-spin" /> : null}
          Post Product Purchase
        </Button>
      </div>
    </form>
  );
}
