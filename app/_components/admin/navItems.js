import {
  LayoutDashboard,
  Boxes,
  Layers,
  Package,
  Factory,
  ShoppingCart,
  Receipt,
  Users,
  Truck,
  BarChart3,
  History,
  UserCog,
  Settings,
} from "lucide-react";

// The sidebar, grouped as in the reference design. adminOnly links are hidden
// from workers; the pages themselves and the database refuse them anyway.
export const NAV_GROUPS = [
  { label: "Main", items: [{ href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true }] },
  {
    label: "Inventory",
    items: [
      { href: "/admin/stock", label: "Stock", icon: Boxes },
      { href: "/admin/raw-materials", label: "Raw Materials", icon: Layers },
      { href: "/admin/products", label: "Products", icon: Package },
      { href: "/admin/production", label: "Production", icon: Factory },
    ],
  },
  {
    label: "Trade",
    items: [
      { href: "/admin/purchases", label: "Purchases", icon: ShoppingCart },
      { href: "/admin/sales", label: "Sales & Invoices", icon: Receipt },
    ],
  },
  {
    label: "CRM",
    items: [
      { href: "/admin/customers", label: "Customers", icon: Users },
      { href: "/admin/suppliers", label: "Suppliers", icon: Truck },
    ],
  },
  { label: "Analytics", adminOnly: true, items: [{ href: "/admin/reports", label: "Reports", icon: BarChart3, adminOnly: true }] },
  {
    label: "Admin",
    adminOnly: true,
    items: [
      { href: "/admin/activity", label: "Activity", icon: History, adminOnly: true },
      { href: "/admin/users", label: "Users", icon: UserCog, adminOnly: true },
      { href: "/admin/settings", label: "Settings", icon: Settings, adminOnly: true },
    ],
  },
];
