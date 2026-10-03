import { CirclePlus, Pencil, Trash2, Ban, SlidersHorizontal, Banknote, LogIn, LogOut } from "lucide-react";
import Badge from "@/app/_components/ui/Badge";

export const ACTIONS = {
  created: { label: "Created", tone: "success", Icon: CirclePlus },
  updated: { label: "Updated", tone: "info", Icon: Pencil },
  deleted: { label: "Deleted", tone: "danger", Icon: Trash2 },
  voided: { label: "Voided", tone: "danger", Icon: Ban },
  adjusted: { label: "Stock entry", tone: "warning", Icon: SlidersHorizontal },
  payment: { label: "Payment", tone: "success", Icon: Banknote },
  login: { label: "Signed in", tone: "gray", Icon: LogIn },
  logout: { label: "Signed out", tone: "gray", Icon: LogOut },
};

export const MODULES = {
  sale: "Sales",
  purchase: "Purchases",
  production: "Production",
  stock: "Stock",
  item: "Items",
  recipe: "Recipes",
  customer: "Customers",
  supplier: "Suppliers",
  payment: "Payments",
  settings: "Settings",
  user: "Users",
  session: "Sign in / out",
};

export function ActionPill({ action }) {
  const a = ACTIONS[action] ?? { label: action, tone: "gray", Icon: Pencil };
  return (
    <Badge tone={a.tone}>
      <a.Icon size={13} strokeWidth={2.2} aria-hidden />
      {a.label}
    </Badge>
  );
}

/** Where a log entry's record can be opened, if anywhere. */
export function recordHref(entry) {
  const id = entry.record_id;
  if (!id) return null;
  switch (entry.module) {
    case "item":
      return `/admin/stock/${id}`;
    case "purchase":
      return `/admin/purchases/${id}`;
    case "supplier":
      return `/admin/suppliers/${id}`;
    case "sale":
      return `/admin/sales/${id}`;
    case "customer":
      return `/admin/customers/${id}`;
    case "production":
      return `/admin/production/${id}`;
    case "user":
      return "/admin/users";
    case "settings":
      return "/admin/settings";
    default:
      return null;
  }
}
