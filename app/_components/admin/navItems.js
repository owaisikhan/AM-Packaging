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
  BookOpen,
  History,
  UserCog,
  Settings,
} from "lucide-react";

// The sidebar, grouped as in the reference design. adminOnly links are hidden
// from workers, and perm links from workers without that permission
// (permissions.js); the pages themselves and the database refuse them anyway.
// A group with nothing left to show is hidden.
export const NAV_GROUPS = [
  {
    label: "Main",
    items: [
      { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
      { href: "/admin/guide", label: "Guide", icon: BookOpen },
    ],
  },
  {
    label: "Inventory",
    items: [
      { href: "/admin/stock", label: "Stock", icon: Boxes, perm: "stock_view" },
      { href: "/admin/raw-materials", label: "Raw Materials", icon: Layers, perm: "stock_view" },
      { href: "/admin/products", label: "Products", icon: Package, perm: "stock_view" },
      { href: "/admin/production", label: "Production", icon: Factory, perm: "production" },
    ],
  },
  {
    label: "Trade",
    items: [
      { href: "/admin/purchases", label: "Purchases", icon: ShoppingCart, perm: "purchases" },
      { href: "/admin/sales", label: "Sales & Invoices", icon: Receipt, perm: "sales" },
    ],
  },
  {
    label: "CRM",
    items: [
      { href: "/admin/customers", label: "Customers", icon: Users, perm: "customers" },
      { href: "/admin/suppliers", label: "Suppliers", icon: Truck, perm: "suppliers" },
    ],
  },
  { label: "Analytics", items: [{ href: "/admin/reports", label: "Reports", icon: BarChart3, perm: "reports" }] },
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
