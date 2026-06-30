"use client";

import { useMemo, useState } from "react";
import { Loader2, Plus, Trash2 } from "lucide-react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Textarea from "@/components/ui/Textarea";
import LookupSelect from "@/components/ui/LookupSelect";
import { formatMoney, formatQty } from "@/lib/format";

const BAG_TO_KG = 50;

const createEmptyLine = () => ({
  rowId: crypto.randomUUID(),
  rawMaterialId: "",
  inputMode: "KG",  // "KG" | "BAG"
  quantity: "1",    // always in the selected inputMode
  rate: "0",        // always per KG
});

const initialForm = {
  vendorId: "",
  receiptDate: "",
  paidAmount: "0",
  remarks: "",
  lines: [createEmptyLine()],
};

export default function MaterialReceivingForm({
  vendors = [],
  rawMaterials = [],
  vendorsLoading = false,
  rawMaterialsLoading = false,
  submitting,
  error,
  onSubmit,
  onCancel,
}) {
  const [form, setForm] = useState(initialForm);
  const [formErrors, setFormErrors] = useState({});

  const selectedVendor = useMemo(() => {
    return vendors.find((v) => v.id === form.vendorId);
  }, [vendors, form.vendorId]);

  const rawMaterialMap = useMemo(() => {
    const map = new Map();
    rawMaterials.forEach((m) => map.set(m.id, m));
    return map;
  }, [rawMaterials]);

  // Convert entered quantity to KG based on input mode
  const toKg = (quantity, inputMode) => {
    const qty = Number(quantity || 0);
    return inputMode === "BAG" ? qty * BAG_TO_KG : qty;
  };

  const totals = useMemo(() => {
    const subtotal = form.lines.reduce((sum, line) => {
      const kgQty = toKg(line.quantity, line.inputMode);
      const rate = Number(line.rate || 0);
      if (Number.isNaN(kgQty) || Number.isNaN(rate)) return sum;
      return sum + kgQty * rate;
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

  const handleMaterialChange = (rowId, rawMaterialId) => {
    const material = rawMaterialMap.get(rawMaterialId);
    setForm((prev) => ({
      ...prev,
      lines: prev.lines.map((line) =>
        line.rowId === rowId
          ? {
              ...line,
              rawMaterialId,
              // Pre-fill rate from average cost if available
              rate:
                material && Number(material.averageCost) > 0
                  ? String(Number(material.averageCost).toFixed(4))
                  : line.rate,
            }
          : line
      ),
    }));
    setFormErrors((prev) => ({ ...prev, lines: "" }));
  };

  const toggleInputMode = (rowId, mode) => {
    setForm((prev) => ({
      ...prev,
      lines: prev.lines.map((line) =>
        line.rowId === rowId
          ? { ...line, inputMode: mode, quantity: "1" }
          : line
      ),
    }));
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

    const usedMaterials = new Set();

    form.lines.forEach((line, index) => {
      const lineNo = index + 1;

      if (!line.rawMaterialId) {
        errors.lines = `Raw material is required on line ${lineNo}`;
        return;
      }

      if (usedMaterials.has(line.rawMaterialId)) {
        errors.lines = `Duplicate raw material on line ${lineNo}. Use one line per material.`;
        return;
      }

      usedMaterials.add(line.rawMaterialId);

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
    setForm({ ...initialForm, lines: [createEmptyLine()] });
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
        rawMaterialId: line.rawMaterialId,
        // Always send quantity in KG to backend
        quantity: toKg(line.quantity, line.inputMode),
        rate: Number(line.rate),
      })),
    };

    if (form.receiptDate) payload.receiptDate = form.receiptDate;

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
        <p className="text-sm font-medium text-slate-900">Post material receiving</p>
        <p className="mt-1 text-xs leading-5 text-slate-500">
          Select the vendor, add raw material lines with quantity and rate, then post the receipt.
          You can enter quantity in KG or Bags — bags are automatically converted to KG (1 bag = {BAG_TO_KG} kg).
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
          label="Receipt Date"
          type="date"
          value={form.receiptDate}
          onChange={(e) => updateField("receiptDate", e.target.value)}
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
            <h3 className="text-sm font-semibold text-slate-950">Receipt Lines</h3>
            <p className="mt-1 text-xs text-slate-500">
              Add each raw material with received quantity and rate per KG.
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
            const material = rawMaterialMap.get(line.rawMaterialId);
            const kgQty = toKg(line.quantity, line.inputMode);
            const rate = Number(line.rate || 0);
            const lineTotal = Number.isNaN(kgQty) || Number.isNaN(rate) ? 0 : kgQty * rate;
            const isBagMode = line.inputMode === "BAG";

            return (
              <div key={line.rowId} className="space-y-3 p-4">
                {/* Material selector + unit toggle */}
                <div className="grid gap-3 lg:grid-cols-[1fr_auto]">
                  <LookupSelect
                    label={index === 0 ? "Raw Material" : undefined}
                    value={line.rawMaterialId}
                    onChange={(value) => handleMaterialChange(line.rowId, value)}
                    options={rawMaterials}
                    loading={rawMaterialsLoading}
                    placeholder="Select material"
                    getOptionValue={(item) => item.id}
                    getOptionLabel={(item) => item.materialCode || item.name}
                    getOptionDescription={(item) =>
                      `${item.name} • Stock: ${formatQty(item.currentStock)} ${
                        item.unit?.code || ""
                      } • Avg cost: ${formatMoney(item.averageCost)}`
                    }
                    disabled={submitting}
                  />

                  {/* Unit mode toggle */}
                  <div>
                    {index === 0 ? (
                      <p className="mb-1.5 text-xs font-medium text-slate-600">Unit</p>
                    ) : null}
                    <div className="flex h-10 overflow-hidden rounded-xl border border-slate-200">
                      <button
                        type="button"
                        onClick={() => toggleInputMode(line.rowId, "KG")}
                        disabled={submitting}
                        className={`flex-1 px-3 text-xs font-semibold transition-colors ${
                          !isBagMode
                            ? "bg-slate-950 text-white"
                            : "bg-white text-slate-500 hover:bg-slate-50"
                        }`}
                      >
                        KG
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleInputMode(line.rowId, "BAG")}
                        disabled={submitting}
                        className={`flex-1 border-l border-slate-200 px-3 text-xs font-semibold transition-colors ${
                          isBagMode
                            ? "bg-slate-950 text-white"
                            : "bg-white text-slate-500 hover:bg-slate-50"
                        }`}
                      >
                        BAG
                      </button>
                    </div>
                  </div>
                </div>

                {/* Quantity, Rate, Total, Remove */}
                <div className="grid items-end gap-3 sm:grid-cols-[120px_130px_1fr_52px]">
                  <div>
                    <Input
                      label={isBagMode ? "Qty (Bags)" : "Qty (KG)"}
                      type="number"
                      min="0"
                      step={isBagMode ? "1" : "0.001"}
                      value={line.quantity}
                      onChange={(e) => updateLine(line.rowId, "quantity", e.target.value)}
                      disabled={submitting}
                    />
                    {isBagMode && Number(line.quantity) > 0 ? (
                      <p className="mt-1 text-xs text-slate-500">
                        = {formatQty(kgQty)} KG
                      </p>
                    ) : null}
                  </div>

                  <Input
                    label="Rate / KG"
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

                {/* Material info hint */}
                {material ? (
                  <div className="rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-500">
                    Current stock:{" "}
                    <span className="font-medium text-slate-700">
                      {formatQty(material.currentStock)} {material.unit?.code || ""}
                    </span>
                    {" "}• Average cost:{" "}
                    <span className="font-medium text-slate-700">
                      {formatMoney(material.averageCost)} / KG
                    </span>
                    {isBagMode ? (
                      <span className="ml-2 font-medium text-blue-700">
                        • 1 bag = {BAG_TO_KG} KG
                      </span>
                    ) : null}
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
          placeholder="Optional receipt remarks..."
          error={formErrors.remarks}
          disabled={submitting}
        />

        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <h3 className="text-sm font-semibold text-slate-950">Receipt Summary</h3>

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
          disabled={submitting || vendorsLoading || rawMaterialsLoading}
        >
          {submitting ? <Loader2 size={16} className="animate-spin" /> : null}
          Post Material Receipt
        </Button>
      </div>
    </form>
  );
}
