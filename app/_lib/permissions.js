// What each worker may do, ticked by an admin under Users. Admins can always
// do everything. The database checks the same keys (has_perm in
// 0008_permissions.sql); these checks in the app only decide what to show.
// Settings, items and recipes, stock adjustments, users and the activity log
// stay admin-only and are not in this list.

export const PERMISSIONS = [
  { key: "stock_view", label: "See stock", hint: "Stock, Raw Materials and Products pages", group: "work", byDefault: true },
  { key: "purchases", label: "Record purchases", hint: "Enter the bill when raw material arrives", group: "work", byDefault: true },
  { key: "production", label: "Record production", hint: "Enter what was made and the materials used", group: "work", byDefault: true },
  { key: "sales", label: "Make invoices", hint: "New invoice and printing it", group: "work", byDefault: true },
  { key: "sales_cash", label: "Take cash on invoices", hint: "Enter the amount received when making an invoice", group: "work", byDefault: true },
  { key: "customers", label: "Add customers", hint: "Customers list and Add Customer", group: "work", byDefault: true },
  { key: "suppliers", label: "Add suppliers", hint: "Suppliers list and Add Supplier", group: "work", byDefault: true },
  { key: "balances", label: "See balances and payments", hint: "Who owes what, ledgers, and what each bill or invoice has had paid", group: "money", byDefault: false },
  { key: "payments", label: "Record payments", hint: "Money paid to suppliers and received from customers", group: "money", byDefault: false },
  { key: "reports", label: "See reports", hint: "Reports page and the money figures on the Dashboard", group: "money", byDefault: false },
  { key: "void", label: "Cancel entries (void)", hint: "Cancel a purchase, invoice, production run or payment, with a reason", group: "money", byDefault: false },
];

export const PERMISSION_KEYS = PERMISSIONS.map((p) => p.key);
export const DEFAULT_PERMISSIONS = PERMISSIONS.filter((p) => p.byDefault).map((p) => p.key);

/** True for an admin, or a worker who has been given this permission. */
export function can(user, key) {
  if (!user) return false;
  if (user.role === "admin") return true;
  return (user.permissions ?? DEFAULT_PERMISSIONS).includes(key);
}
