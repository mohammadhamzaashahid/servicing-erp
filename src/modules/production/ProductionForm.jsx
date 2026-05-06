"use client";

import { useMemo, useState } from "react";
import { Loader2, Plus, Trash2 } from "lucide-react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Textarea from "@/components/ui/Textarea";
import LookupSelect from "@/components/ui/LookupSelect";
import { formatMoney, formatQty } from "@/lib/format";

const createEmptyConsumptionLine = () => ({
  rowId: crypto.randomUUID(),
  rawMaterialId: "",
  quantity: "1",
});

const createEmptyOutputLine = () => ({
  rowId: crypto.randomUUID(),
  productId: "",
  quantity: "1",
});

const initialForm = {
  productionDate: "",
  remarks: "",
  consumptions: [createEmptyConsumptionLine()],
  outputs: [createEmptyOutputLine()],
};

export default function ProductionForm({
  rawMaterials = [],
  products = [],
  rawMaterialsLoading = false,
  productsLoading = false,
  submitting,
  error,
  onSubmit,
  onCancel,
}) {
  const [form, setForm] = useState(initialForm);
  const [formErrors, setFormErrors] = useState({});

  const rawMaterialMap = useMemo(() => {
    const map = new Map();

    rawMaterials.forEach((material) => {
      map.set(material.id, material);
    });

    return map;
  }, [rawMaterials]);

  const productMap = useMemo(() => {
    const map = new Map();

    products.forEach((product) => {
      map.set(product.id, product);
    });

    return map;
  }, [products]);

  const totals = useMemo(() => {
    const totalConsumptionCost = form.consumptions.reduce((sum, line) => {
      const material = rawMaterialMap.get(line.rawMaterialId);
      const quantity = Number(line.quantity || 0);
      const averageCost = Number(material?.averageCost || 0);

      if (Number.isNaN(quantity) || Number.isNaN(averageCost)) return sum;

      return sum + quantity * averageCost;
    }, 0);

    const totalOutputQty = form.outputs.reduce((sum, line) => {
      const quantity = Number(line.quantity || 0);

      if (Number.isNaN(quantity)) return sum;

      return sum + quantity;
    }, 0);

    return {
      totalConsumptionCost,
      totalOutputQty,
      estimatedCostPerOutputUnit:
        totalOutputQty > 0 ? totalConsumptionCost / totalOutputQty : 0,
    };
  }, [form.consumptions, form.outputs, rawMaterialMap]);

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

  const updateConsumptionLine = (rowId, field, value) => {
    setForm((prev) => ({
      ...prev,
      consumptions: prev.consumptions.map((line) =>
        line.rowId === rowId
          ? {
              ...line,
              [field]: value,
            }
          : line
      ),
    }));

    setFormErrors((prev) => ({
      ...prev,
      consumptions: "",
    }));
  };

  const updateOutputLine = (rowId, field, value) => {
    setForm((prev) => ({
      ...prev,
      outputs: prev.outputs.map((line) =>
        line.rowId === rowId
          ? {
              ...line,
              [field]: value,
            }
          : line
      ),
    }));

    setFormErrors((prev) => ({
      ...prev,
      outputs: "",
    }));
  };

  const addConsumptionLine = () => {
    setForm((prev) => ({
      ...prev,
      consumptions: [...prev.consumptions, createEmptyConsumptionLine()],
    }));

    setFormErrors((prev) => ({
      ...prev,
      consumptions: "",
    }));
  };

  const addOutputLine = () => {
    setForm((prev) => ({
      ...prev,
      outputs: [...prev.outputs, createEmptyOutputLine()],
    }));

    setFormErrors((prev) => ({
      ...prev,
      outputs: "",
    }));
  };

  const removeConsumptionLine = (rowId) => {
    setForm((prev) => {
      if (prev.consumptions.length === 1) return prev;

      return {
        ...prev,
        consumptions: prev.consumptions.filter((line) => line.rowId !== rowId),
      };
    });
  };

  const removeOutputLine = (rowId) => {
    setForm((prev) => {
      if (prev.outputs.length === 1) return prev;

      return {
        ...prev,
        outputs: prev.outputs.filter((line) => line.rowId !== rowId),
      };
    });
  };

  const validate = () => {
    const errors = {};

    if (!form.consumptions.length) {
      errors.consumptions = "At least one raw material consumption line is required";
    }

    if (!form.outputs.length) {
      errors.outputs = "At least one finished product output line is required";
    }

    const usedRawMaterials = new Set();

    form.consumptions.forEach((line, index) => {
      const lineNo = index + 1;

      if (!line.rawMaterialId) {
        errors.consumptions = `Raw material is required on consumption line ${lineNo}`;
        return;
      }

      if (usedRawMaterials.has(line.rawMaterialId)) {
        errors.consumptions = `Duplicate raw material found on consumption line ${lineNo}`;
        return;
      }

      usedRawMaterials.add(line.rawMaterialId);

      const quantity = Number(line.quantity || 0);
      const material = rawMaterialMap.get(line.rawMaterialId);
      const availableStock = Number(material?.currentStock || 0);

      if (Number.isNaN(quantity) || quantity <= 0) {
        errors.consumptions = `Quantity must be greater than 0 on consumption line ${lineNo}`;
        return;
      }

      if (quantity > availableStock) {
        errors.consumptions = `Consumption quantity on line ${lineNo} cannot exceed available stock`;
      }
    });

    const usedProducts = new Set();

    form.outputs.forEach((line, index) => {
      const lineNo = index + 1;

      if (!line.productId) {
        errors.outputs = `Product is required on output line ${lineNo}`;
        return;
      }

      if (usedProducts.has(line.productId)) {
        errors.outputs = `Duplicate product found on output line ${lineNo}`;
        return;
      }

      usedProducts.add(line.productId);

      const quantity = Number(line.quantity || 0);

      if (Number.isNaN(quantity) || quantity <= 0) {
        errors.outputs = `Quantity must be greater than 0 on output line ${lineNo}`;
      }
    });

    if (form.remarks.trim().length > 500) {
      errors.remarks = "Remarks cannot exceed 500 characters";
    }

    setFormErrors(errors);

    return Object.keys(errors).length === 0;
  };

  const resetForm = () => {
    setForm({
      ...initialForm,
      consumptions: [createEmptyConsumptionLine()],
      outputs: [createEmptyOutputLine()],
    });

    setFormErrors({});
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!validate()) return;

    const payload = {
      remarks: form.remarks.trim() || null,
      consumptions: form.consumptions.map((line) => ({
        rawMaterialId: line.rawMaterialId,
        quantity: Number(line.quantity),
      })),
      outputs: form.outputs.map((line) => ({
        productId: line.productId,
        quantity: Number(line.quantity),
      })),
    };

    if (form.productionDate) {
      payload.productionDate = form.productionDate;
    }

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
        <p className="text-sm font-medium text-slate-900">
          Post production batch
        </p>
        <p className="mt-1 text-xs leading-5 text-slate-500">
          Select raw materials to consume and finished products to produce. The
          backend will validate stock, decrease raw materials, increase finished
          products, and create inventory/daybook records in one transaction.
        </p>
      </div>

      <Input
        label="Production Date"
        type="date"
        value={form.productionDate}
        onChange={(event) => updateField("productionDate", event.target.value)}
        disabled={submitting}
      />

      <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
        <h3 className="text-sm font-semibold text-red-900">
          Raw Material Consumption
        </h3>
        <p className="mt-1 text-xs leading-5 text-red-700">
          These quantities will be deducted from raw material stock after
          posting.
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white">
        <div className="flex flex-col gap-3 border-b border-slate-200 p-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-950">
              Consumption Lines
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              Add each raw material once with the quantity consumed.
            </p>
          </div>

          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={addConsumptionLine}
          >
            <Plus size={15} />
            Add Raw Material
          </Button>
        </div>

        {formErrors.consumptions ? (
          <div className="border-b border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {formErrors.consumptions}
          </div>
        ) : null}

        <div className="hidden grid-cols-[1.5fr_140px_160px_52px] gap-3 border-b border-slate-200 bg-slate-50 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500 lg:grid">
          <div>Raw Material</div>
          <div>Quantity</div>
          <div>Estimated Cost</div>
          <div />
        </div>

        <div className="divide-y divide-slate-100">
          {form.consumptions.map((line, index) => {
            const material = rawMaterialMap.get(line.rawMaterialId);
            const quantity = Number(line.quantity || 0);
            const averageCost = Number(material?.averageCost || 0);
            const estimatedCost =
              Number.isNaN(quantity) || Number.isNaN(averageCost)
                ? 0
                : quantity * averageCost;

            const availableStock = Number(material?.currentStock || 0);
            const overStock =
              material && !Number.isNaN(quantity) && quantity > availableStock;

            return (
              <div
                key={line.rowId}
                className="grid gap-3 p-4 lg:grid-cols-[1.5fr_140px_160px_52px] lg:items-end"
              >
                <LookupSelect
                  label={index === 0 ? "Raw Material" : undefined}
                  value={line.rawMaterialId}
                  onChange={(value) =>
                    updateConsumptionLine(line.rowId, "rawMaterialId", value)
                  }
                  options={rawMaterials}
                  loading={rawMaterialsLoading}
                  placeholder="Select raw material"
                  getOptionValue={(item) => item.id}
                  getOptionLabel={(item) => item.materialCode || item.name}
                  getOptionDescription={(item) =>
                    `${item.name} • Stock: ${formatQty(item.currentStock)} ${
                      item.unit?.code || ""
                    }`
                  }
                  disabled={submitting}
                />

                <Input
                  label={index === 0 ? "Qty" : undefined}
                  type="number"
                  min="0"
                  step="0.001"
                  value={line.quantity}
                  onChange={(event) =>
                    updateConsumptionLine(
                      line.rowId,
                      "quantity",
                      event.target.value
                    )
                  }
                  inputClassName={overStock ? "border-red-300" : undefined}
                  disabled={submitting}
                />

                <div>
                  {index === 0 ? (
                    <p className="mb-1.5 text-xs font-medium text-slate-600">
                      Est. Cost
                    </p>
                  ) : null}

                  <div className="flex h-10 items-center rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-semibold text-slate-950">
                    {formatMoney(estimatedCost)}
                  </div>
                </div>

                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-red-600 hover:bg-red-50 hover:text-red-700"
                  onClick={() => removeConsumptionLine(line.rowId)}
                  disabled={submitting || form.consumptions.length === 1}
                >
                  <Trash2 size={16} />
                </Button>

                {material ? (
                  <div
                    className={`rounded-xl px-3 py-2 text-xs lg:col-span-4 ${
                      overStock
                        ? "bg-red-50 text-red-700"
                        : "bg-slate-50 text-slate-500"
                    }`}
                  >
                    Available stock:{" "}
                    <span className="font-medium">
                      {formatQty(material.currentStock)} {material.unit?.code || ""}
                    </span>{" "}
                    • Average cost:{" "}
                    <span className="font-medium">
                      {formatMoney(material.averageCost)}
                    </span>
                    {overStock ? (
                      <span className="ml-1 font-semibold">
                        • Quantity exceeds available stock
                      </span>
                    ) : null}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>

      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
        <h3 className="text-sm font-semibold text-emerald-900">
          Finished Product Output
        </h3>
        <p className="mt-1 text-xs leading-5 text-emerald-700">
          These quantities will be added to finished product stock after posting.
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white">
        <div className="flex flex-col gap-3 border-b border-slate-200 p-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-950">
              Output Lines
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              Add each finished product once with produced quantity.
            </p>
          </div>

          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={addOutputLine}
          >
            <Plus size={15} />
            Add Product
          </Button>
        </div>

        {formErrors.outputs ? (
          <div className="border-b border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {formErrors.outputs}
          </div>
        ) : null}

        <div className="hidden grid-cols-[1.5fr_140px_160px_52px] gap-3 border-b border-slate-200 bg-slate-50 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500 lg:grid">
          <div>Product</div>
          <div>Quantity</div>
          <div>Current Stock</div>
          <div />
        </div>

        <div className="divide-y divide-slate-100">
          {form.outputs.map((line, index) => {
            const product = productMap.get(line.productId);

            return (
              <div
                key={line.rowId}
                className="grid gap-3 p-4 lg:grid-cols-[1.5fr_140px_160px_52px] lg:items-end"
              >
                <LookupSelect
                  label={index === 0 ? "Product" : undefined}
                  value={line.productId}
                  onChange={(value) =>
                    updateOutputLine(line.rowId, "productId", value)
                  }
                  options={products}
                  loading={productsLoading}
                  placeholder="Select product"
                  getOptionValue={(item) => item.id}
                  getOptionLabel={(item) => item.productCode || item.name}
                  getOptionDescription={(item) =>
                    `${item.name} • Stock: ${formatQty(item.currentStock)} ${
                      item.unit?.code || ""
                    }`
                  }
                  disabled={submitting}
                />

                <Input
                  label={index === 0 ? "Qty" : undefined}
                  type="number"
                  min="0"
                  step="0.001"
                  value={line.quantity}
                  onChange={(event) =>
                    updateOutputLine(line.rowId, "quantity", event.target.value)
                  }
                  disabled={submitting}
                />

                <div>
                  {index === 0 ? (
                    <p className="mb-1.5 text-xs font-medium text-slate-600">
                      Current Stock
                    </p>
                  ) : null}

                  <div className="flex h-10 items-center rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-semibold text-slate-950">
                    {product
                      ? `${formatQty(product.currentStock)} ${
                          product.unit?.code || ""
                        }`
                      : "-"}
                  </div>
                </div>

                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-red-600 hover:bg-red-50 hover:text-red-700"
                  onClick={() => removeOutputLine(line.rowId)}
                  disabled={submitting || form.outputs.length === 1}
                >
                  <Trash2 size={16} />
                </Button>

                {product ? (
                  <div className="rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-500 lg:col-span-4">
                    Standard price:{" "}
                    <span className="font-medium text-slate-700">
                      {formatMoney(product.standardPrice)}
                    </span>{" "}
                    • Minimum stock:{" "}
                    <span className="font-medium text-slate-700">
                      {formatQty(product.minimumStock)} {product.unit?.code || ""}
                    </span>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-[1fr_320px]">
        <Textarea
          label="Remarks"
          value={form.remarks}
          onChange={(event) => updateField("remarks", event.target.value)}
          placeholder="Optional production remarks..."
          error={formErrors.remarks}
          disabled={submitting}
        />

        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <h3 className="text-sm font-semibold text-slate-950">
            Production Summary
          </h3>

          <div className="mt-4 space-y-3">
            <div className="flex items-center justify-between rounded-xl bg-white px-3 py-3 text-sm">
              <span className="text-slate-500">Consumption Cost</span>
              <span className="font-semibold text-slate-950">
                {formatMoney(totals.totalConsumptionCost)}
              </span>
            </div>

            <div className="flex items-center justify-between rounded-xl bg-white px-3 py-3 text-sm">
              <span className="text-slate-500">Total Output Qty</span>
              <span className="font-semibold text-slate-950">
                {formatQty(totals.totalOutputQty)}
              </span>
            </div>

            <div className="flex items-center justify-between rounded-xl bg-white px-3 py-3 text-sm">
              <span className="text-slate-500">Est. Unit Cost</span>
              <span className="font-semibold text-slate-950">
                {formatMoney(totals.estimatedCostPerOutputUnit)}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4">
        <p className="text-xs leading-5 text-blue-800">
          Production is a stock-impact transaction. After posting, corrections
          should be handled by adjustment or reversal logic instead of directly
          editing the batch.
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

        <Button
          type="submit"
          disabled={submitting || rawMaterialsLoading || productsLoading}
        >
          {submitting ? <Loader2 size={16} className="animate-spin" /> : null}
          Post Production Batch
        </Button>
      </div>
    </form>
  );
}