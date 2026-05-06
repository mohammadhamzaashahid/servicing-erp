import {
  Boxes,
  ClipboardList,
  Factory,
  Gauge,
  LayoutDashboard,
  Package,
  ReceiptText,
  Scale,
  ShoppingCart,
  Truck,
  Users,
  WalletCards,
} from "lucide-react";

export const navigationItems = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Units",
    href: "/dashboard/units",
    icon: Scale,
  },
  {
    label: "Vendors",
    href: "/dashboard/vendors",
    icon: Truck,
  },
  {
    label: "Customers",
    href: "/dashboard/customers",
    icon: Users,
  },
  {
    label: "Raw Materials",
    href: "/dashboard/raw-materials",
    icon: Boxes,
  },
  {
    label: "Products",
    href: "/dashboard/products",
    icon: Package,
  },
  {
    label: "Material Receiving",
    href: "/dashboard/material-receiving",
    icon: ClipboardList,
  },
  {
    label: "Production",
    href: "/dashboard/production",
    icon: Factory,
  },
  {
    label: "Sales Invoices",
    href: "/dashboard/sales",
    icon: ReceiptText,
  },
  {
    label: "Inventory",
    href: "/dashboard/inventory",
    icon: ShoppingCart,
  },
  {
    label: "Ledgers",
    href: "/dashboard/ledgers",
    icon: WalletCards,
  },
  {
    label: "Daybook",
    href: "/dashboard/daybook",
    icon: Gauge,
  },
];