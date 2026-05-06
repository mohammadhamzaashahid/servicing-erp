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
  salePrice: "0",
  discountAmount: "0",
});

const initialForm = {
  customerId: "",
  invoiceDate: "",
  discountAmount: "0",
  paidAmount: "0",
  remarks: "",
  lines: [createEmptyLine()],
};

export default function SalesInvoiceForm({
  customers = [],
  products = [],
  customersLoading = false,
  productsLoading = false,
  submitting,
  error,
  onSubmit,
  onCancel,
}) {
  const [form, setForm] = useState(initialForm);
  const [formErrors, setFormErrors] = useState({});

  const selectedCustomer = useMemo(() => {
    return customers.find((customer) => customer.id === form.customerId);
  }, [customers, form.customerId]);

  const productMap = useMemo(() => {
    const map = new Map();

    products.forEach((product) => {
      map.set(product.id, product);
    });

    return map;
  }, [products]);

  const totals = useMemo(() => {
    const subtotal = form.lines.reduce((sum, line) => {
      const quantity = Number(line.quantity || 0);
      const salePrice = Number(line.salePrice || 0);
      const lineDiscount = Number(line.discountAmount || 0);

      if (
        Number.isNaN(quantity) ||
        Number.isNaN(salePrice) ||
        Number.isNaN(lineDiscount)
      ) {
        return sum;
      }

      return sum + Math.max(quantity * salePrice - lineDiscount, 0);
    }, 0);

    const invoiceDiscount = Number(form.discountAmount || 0);
    const paidAmount = Number(form.paidAmount || 0);

    const safeInvoiceDiscount = Number.isNaN(invoiceDiscount)
      ? 0
      : invoiceDiscount;

    const safePaidAmount = Number.isNaN(paidAmount) ? 0 : paidAmount;

    const totalAmount = Math.max(subtotal - safeInvoiceDiscount, 0);

    return {
      subtotal,
      discountAmount: safeInvoiceDiscount,
      totalAmount,
      paidAmount: safePaidAmount,
      balanceAmount: Math.max(totalAmount - safePaidAmount, 0),
    };
  }, [form.lines, form.discountAmount, form.paidAmount]);

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

  const updateLine = (rowId, field, value) => {
    setForm((prev) => ({
      ...prev,
      lines: prev.lines.map((line) =>
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
      lines: "",
    }));
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
              salePrice: product
                ? String(product.standardPrice ?? 0)
                : line.salePrice,
            }
          : line
      ),
    }));

    setFormErrors((prev) => ({
      ...prev,
      lines: "",
    }));
  };

  const addLine = () => {
    setForm((prev) => ({
      ...prev,
      lines: [...prev.lines, createEmptyLine()],
    }));

    setFormErrors((prev) => ({
      ...prev,
      lines: "",
    }));
  };

  const removeLine = (rowId) => {
    setForm((prev) => {
      if (prev.lines.length === 1) return prev;

      return {
        ...prev,
        lines: prev.lines.filter((line) => line.rowId !== rowId),
      };
    });
  };

  const validate = () => {
    const errors = {};

    if (!form.customerId) {
      errors.customerId = "Customer is required";
    }

    if (!form.lines.length) {
      errors.lines = "At least one invoice line is required";
    }

    const usedProducts = new Set();

    form.lines.forEach((line, index) => {
      const lineNo = index + 1;

      if (!line.productId) {
        errors.lines = `Product is required on line ${lineNo}`;
        return;
      }

      if (usedProducts.has(line.productId)) {
        errors.lines = `Duplicate product found on line ${lineNo}. Use one line per product.`;
        return;
      }

      usedProducts.add(line.productId);

      const product = productMap.get(line.productId);
      const availableStock = Number(product?.currentStock || 0);
      const quantity = Number(line.quantity || 0);
      const salePrice = Number(line.salePrice || 0);
      const lineDiscount = Number(line.discountAmount || 0);

      if (Number.isNaN(quantity) || quantity <= 0) {
        errors.lines = `Quantity must be greater than 0 on line ${lineNo}`;
        return;
      }

      if (quantity > availableStock) {
        errors.lines = `Quantity on line ${lineNo} cannot exceed available stock`;
        return;
      }

      if (Number.isNaN(salePrice) || salePrice < 0) {
        errors.lines = `Sale price cannot be negative on line ${lineNo}`;
        return;
      }

      if (Number.isNaN(lineDiscount) || lineDiscount < 0) {
        errors.lines = `Line discount cannot be negative on line ${lineNo}`;
        return;
      }

      if (lineDiscount > quantity * salePrice) {
        errors.lines = `Line discount cannot exceed line amount on line ${lineNo}`;
      }
    });

    const invoiceDiscount = Number(form.discountAmount || 0);

    if (Number.isNaN(invoiceDiscount) || invoiceDiscount < 0) {
      errors.discountAmount = "Invoice discount must be zero or greater";
    }

    if (invoiceDiscount > totals.subtotal) {
      errors.discountAmount = "Invoice discount cannot exceed subtotal";
    }

    const paidAmount = Number(form.paidAmount || 0);

    if (Number.isNaN(paidAmount) || paidAmount < 0) {
      errors.paidAmount = "Paid amount must be zero or greater";
    }

    if (paidAmount > totals.totalAmount) {
      errors.paidAmount = "Paid amount cannot be greater than total amount";
    }

    if (form.remarks.trim().length > 500) {
      errors.remarks = "Remarks cannot exceed 500 characters";
    }

    setFormErrors(errors);

    return Object.keys(errors).length === 0;
  };

  const resetForm = () => {
    setForm({
      ...initialForm,
      lines: [createEmptyLine()],
    });

    setFormErrors({});
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!validate()) return;

    const payload = {
      customerId: form.customerId,
      discountAmount: Number(form.discountAmount || 0),
      paidAmount: Number(form.paidAmount || 0),
      remarks: form.remarks.trim() || null,
      lines: form.lines.map((line) => ({
        productId: line.productId,
        quantity: Number(line.quantity),
        salePrice: Number(line.salePrice),
        discountAmount: Number(line.discountAmount || 0),
      })),
    };

    if (form.invoiceDate) {
      payload.invoiceDate = form.invoiceDate;
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
          Create sales invoice
        </p>
        <p className="mt-1 text-xs leading-5 text-slate-500">
          Select customer, add finished product lines, set sale prices, enter
          payment, and post the invoice. The backend will decrease product stock,
          update customer balance, and create accounting entries.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <LookupSelect
          label="Customer"
          value={form.customerId}
          onChange={(value) => updateField("customerId", value)}
          options={customers}
          loading={customersLoading}
          placeholder="Select customer"
          getOptionValue={(customer) => customer.id}
          getOptionLabel={(customer) => customer.customerCode || customer.name}
          getOptionDescription={(customer) => customer.name}
          error={formErrors.customerId}
          disabled={submitting}
        />

        <Input
          label="Invoice Date"
          type="date"
          value={form.invoiceDate}
          onChange={(event) => updateField("invoiceDate", event.target.value)}
          disabled={submitting}
        />
      </div>

      {selectedCustomer ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Selected Customer
          </p>

          <div className="mt-2 grid gap-3 md:grid-cols-3">
            <div>
              <p className="text-xs text-slate-500">Name</p>
              <p className="text-sm font-medium text-slate-950">
                {selectedCustomer.name}
              </p>
            </div>

            <div>
              <p className="text-xs text-slate-500">Phone</p>
              <p className="text-sm font-medium text-slate-950">
                {selectedCustomer.phone || "-"}
              </p>
            </div>

            <div>
              <p className="text-xs text-slate-500">Current Receivable</p>
              <p className="text-sm font-semibold text-slate-950">
                {formatMoney(selectedCustomer.currentBalance)}
              </p>
            </div>
          </div>
        </div>
      ) : null}

      <div className="rounded-2xl border border-slate-200 bg-white">
        <div className="flex flex-col gap-3 border-b border-slate-200 p-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-950">
              Invoice Lines
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              Add each finished product once with quantity, sale price, and
              optional line discount.
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

        <div className="hidden grid-cols-[1.4fr_110px_130px_130px_130px_52px] gap-3 border-b border-slate-200 bg-slate-50 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500 xl:grid">
          <div>Product</div>
          <div>Qty</div>
          <div>Sale Price</div>
          <div>Discount</div>
          <div>Line Total</div>
          <div />
        </div>

        <div className="divide-y divide-slate-100">
          {form.lines.map((line, index) => {
            const product = productMap.get(line.productId);
            const quantity = Number(line.quantity || 0);
            const salePrice = Number(line.salePrice || 0);
            const discountAmount = Number(line.discountAmount || 0);
            const grossAmount =
              Number.isNaN(quantity) || Number.isNaN(salePrice)
                ? 0
                : quantity * salePrice;
            const lineTotal = Math.max(grossAmount - discountAmount, 0);
            const availableStock = Number(product?.currentStock || 0);
            const overStock =
              product && !Number.isNaN(quantity) && quantity > availableStock;

            return (
              <div
                key={line.rowId}
                className="grid gap-3 p-4 xl:grid-cols-[1.4fr_110px_130px_130px_130px_52px] xl:items-end"
              >
                <LookupSelect
                  label={index === 0 ? "Product" : undefined}
                  value={line.productId}
                  onChange={(value) => handleProductChange(line.rowId, value)}
                  options={products}
                  loading={productsLoading}
                  placeholder="Select product"
                  getOptionValue={(item) => item.id}
                  getOptionLabel={(item) => item.productCode || item.name}
                  getOptionDescription={(item) =>
                    `${item.name} • Stock: ${formatQty(item.currentStock)} ${
                      item.unit?.code || ""
                    } • Std: ${formatMoney(item.standardPrice)}`
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
                    updateLine(line.rowId, "quantity", event.target.value)
                  }
                  inputClassName={overStock ? "border-red-300" : undefined}
                  disabled={submitting}
                />

                <Input
                  label={index === 0 ? "Price" : undefined}
                  type="number"
                  min="0"
                  step="0.01"
                  value={line.salePrice}
                  onChange={(event) =>
                    updateLine(line.rowId, "salePrice", event.target.value)
                  }
                  disabled={submitting}
                />

                <Input
                  label={index === 0 ? "Discount" : undefined}
                  type="number"
                  min="0"
                  step="0.01"
                  value={line.discountAmount}
                  onChange={(event) =>
                    updateLine(
                      line.rowId,
                      "discountAmount",
                      event.target.value
                    )
                  }
                  disabled={submitting}
                />

                <div>
                  {index === 0 ? (
                    <p className="mb-1.5 text-xs font-medium text-slate-600">
                      Total
                    </p>
                  ) : null}

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

                {product ? (
                  <div
                    className={`rounded-xl px-3 py-2 text-xs xl:col-span-6 ${
                      overStock
                        ? "bg-red-50 text-red-700"
                        : "bg-slate-50 text-slate-500"
                    }`}
                  >
                    Available stock:{" "}
                    <span className="font-medium">
                      {formatQty(product.currentStock)} {product.unit?.code || ""}
                    </span>{" "}
                    • Standard price:{" "}
                    <span className="font-medium">
                      {formatMoney(product.standardPrice)}
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

      <div className="grid gap-4 md:grid-cols-[1fr_340px]">
        <Textarea
          label="Remarks"
          value={form.remarks}
          onChange={(event) => updateField("remarks", event.target.value)}
          placeholder="Optional invoice remarks..."
          error={formErrors.remarks}
          disabled={submitting}
        />

        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <h3 className="text-sm font-semibold text-slate-950">
            Invoice Summary
          </h3>

          <div className="mt-4 space-y-3">
            <div className="flex items-center justify-between rounded-xl bg-white px-3 py-3 text-sm">
              <span className="text-slate-500">Subtotal</span>
              <span className="font-semibold text-slate-950">
                {formatMoney(totals.subtotal)}
              </span>
            </div>

            <Input
              label="Invoice Discount"
              type="number"
              min="0"
              step="0.01"
              value={form.discountAmount}
              onChange={(event) =>
                updateField("discountAmount", event.target.value)
              }
              error={formErrors.discountAmount}
              disabled={submitting}
            />

            <div className="flex items-center justify-between rounded-xl bg-white px-3 py-3 text-sm">
              <span className="text-slate-500">Total Amount</span>
              <span className="font-semibold text-slate-950">
                {formatMoney(totals.totalAmount)}
              </span>
            </div>

            <Input
              label="Paid Amount"
              type="number"
              min="0"
              step="0.01"
              value={form.paidAmount}
              onChange={(event) => updateField("paidAmount", event.target.value)}
              error={formErrors.paidAmount}
              disabled={submitting}
            />

            <div className="flex items-center justify-between rounded-xl bg-white px-3 py-3 text-sm">
              <span className="text-slate-500">Balance Receivable</span>
              <span className="font-semibold text-slate-950">
                {formatMoney(totals.balanceAmount)}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4">
        <p className="text-xs leading-5 text-blue-800">
          After posting, the invoice becomes a business transaction. Corrections
          should be handled later through return, credit note, or reversal flows
          instead of directly editing posted invoice data.
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
          disabled={submitting || customersLoading || productsLoading}
        >
          {submitting ? <Loader2 size={16} className="animate-spin" /> : null}
          Post Sales Invoice
        </Button>
      </div>
    </form>
  );
}