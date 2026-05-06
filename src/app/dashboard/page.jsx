import {
  Boxes,
  Factory,
  Package,
  ReceiptText,
  Truck,
  Users,
} from "lucide-react";
import StatCard from "@/components/ui/StatCard";

const cards = [
  {
    title: "Vendors",
    value: "Master",
    description: "register suppliers and keep track of balances",
    icon: Truck,
  },
  {
    title: "Raw Materials",
    value: "Stock",
    description: "receive and use warehouse materials",
    icon: Boxes,
  },
  {
    title: "Production",
    value: "batches",
    description: "Convert raw materials into products",
    icon: Factory,
  },
  {
    title: "Products",
    value: "Finished",
    description: "Track finished goods inventory",
    icon: Package,
  },
  {
    title: "Customers",
    value: "Sales",
    description: "Manage customers and receivables",
    icon: Users,
  },
  {
    title: "Invoices",
    value: "Print",
    description: "Create and print sales invoices",
    icon: ReceiptText,
  },
];

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="max-w-3xl">
          <p className="text-sm font-medium text-slate-500">ERP Flow</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950 md:text-3xl">
            Vendor → Raw Material → Production → Finished Product → Customer Invoice
          </h1>
          <p className="mt-3 text-sm leading-6 text-slate-500 md:text-base">
            This portal is structured around your real business process. Start
            with master records, then post receiving, production, and sales
            transactions.
          </p>
        </div>
      </section> */}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {cards.map((card) => (
          <StatCard key={card.title} {...card} />
        ))}
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-base font-semibold text-slate-950">
          Actiosn
        </h2>

        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {[
            "Create Units",
            "Create Vendor",
            "Create Customer",
            "Create Raw Material",
            "Create Product",
            "Post Material Receiving",
            "Post Production Batch",
            "Create Sales Invoice",
            "Print Invoice",
          ].map((step, index) => (
            <div
              key={step}
              className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-950 text-xs font-semibold text-white">
                {index + 1}
              </div>
              <p className="text-sm font-medium text-slate-700">{step}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}