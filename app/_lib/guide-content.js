import {
  Ban,
  Banknote,
  BarChart3,
  Boxes,
  ClipboardCheck,
  Factory,
  History,
  LogIn,
  Receipt,
  Rocket,
  ShoppingCart,
  SlidersHorizontal,
  Undo2,
  UserCog,
  UserPlus,
} from "lucide-react";

// The words on the Guide page (/admin/guide). Kept apart from the layout so
// the wording can be changed without touching code. Words inside **double
// stars** are shown in bold: use them for the exact button and field names on
// screen, and update this file whenever one of those labels changes.
//
// who: "all" shows to everyone, "admin" only to admins.

export const DAY_WORKER = [
  "Raw material arrived? Record it under **Purchases** the same day.",
  "Made tape, film or strips? Record it under **Production** before you go home.",
  "Goods going out? Make the invoice under **Sales & Invoices** and print it.",
  "Something looks wrong? Do not enter it twice. Tell an admin.",
];

export const DAY_ADMIN = [
  "Look at the bell at the top: it counts items that are low or out of stock.",
  "Check the **Dashboard** for today's sales, purchases and production.",
  "Record money paid to suppliers and received from customers.",
  "Once a week, open **Reports** and look at **Receivables & Payables** and **Raw material use**.",
];

export const GUIDE_SECTIONS = [
  {
    id: "start",
    who: "all",
    icon: LogIn,
    title: "Getting started",
    steps: [
      "Sign in with the email and password an admin gave you.",
      "On a phone, tap the **menu button** (three lines, top left) to see all the pages. Tap it again to close.",
      "A thin green line at the very top means a page is loading. Wait for it to finish.",
      "The moon and sun button at the top switches between dark and light colours.",
      "To sign out, tap your name or initials at the top right, then **Sign out**.",
    ],
    tips: ["If you forget your password, ask an admin to set a new one for you."],
  },
  {
    id: "stock",
    who: "all",
    icon: Boxes,
    title: "Check stock",
    steps: [
      "Open **Stock** to see everything, or **Raw Materials** or **Products** for just one kind.",
      "Type in the search box. The list updates as you type.",
      "Each item shows **In Stock**, **Low Stock** or **Out of Stock**, in words and colour.",
      "Tap an item to see every time it came in or went out.",
    ],
    tips: ["You never change stock numbers by hand. Purchases, production and invoices change them for you."],
    link: { href: "/admin/stock", label: "Open Stock" },
  },
  {
    id: "purchase",
    who: "all",
    icon: ShoppingCart,
    title: "Record a purchase (raw material arrived)",
    steps: [
      "Open **Purchases** and tap **New Purchase**.",
      "Pick the **Supplier**. Not in the list? Tap **New supplier**, save, and you come back to the purchase.",
      "Type **Their bill no.** from the supplier's bill and check the **Purchase date**.",
      "Under **Items bought**, pick the **Raw material**, then the **Quantity** and **Rate (Rs)**. Add a row for each item on the bill.",
      "Check the **Grand total** matches the paper bill, then tap **Save purchase**.",
    ],
    tips: ["Saving adds these quantities to stock straight away.", "Workers do not enter payments to suppliers. An admin does that."],
    link: { href: "/admin/purchases/new", label: "Open New Purchase" },
  },
  {
    id: "production",
    who: "all",
    icon: Factory,
    title: "Record production",
    steps: [
      "Open **Production** and tap **Record Production**.",
      "Pick the **Product** you made, type **How many made**, and check the **Date**.",
      "The raw materials fill in by themselves from the recipe. Change any amount to what was really used.",
      "Look at the **When you save** box: it shows what goes into stock and what comes out.",
      "Tap **Save production run**.",
    ],
    tips: ["If a product has no recipe yet, the materials stay empty. Ask an admin to set one up."],
    link: { href: "/admin/production/new", label: "Open Record Production" },
  },
  {
    id: "invoice",
    who: "all",
    icon: Receipt,
    title: "Make an invoice (goods going out)",
    steps: [
      "Open **Sales & Invoices** and tap **New Invoice**.",
      "Pick the **Customer**. Not in the list? Tap **New customer**, save, and you come back to the invoice.",
      "Under **Items sold**, pick the **Product**, then the **Quantity** and **Rate (Rs)**.",
      "If the customer paid cash now, type it in **Amount received now (Rs)**. If it is on credit, leave it at 0.",
      "Tap **Save invoice**, then **Print / Save as PDF** to print it or keep a copy.",
    ],
    tips: [
      "Saving takes these products out of stock.",
      "**Another for this customer** on the invoice page starts the next invoice for the same customer.",
    ],
    link: { href: "/admin/sales/new", label: "Open New Invoice" },
  },
  {
    id: "people",
    who: "all",
    icon: UserPlus,
    title: "Add a customer or supplier",
    steps: [
      "Open **Customers** and tap **Add Customer**, or **Suppliers** and tap **Add Supplier**.",
      "Type the name and phone number. The rest can be filled in later.",
      "Tap **Save customer** or **Save supplier**.",
    ],
    tips: ["Check the list first so the same customer is not added twice."],
    link: { href: "/admin/customers/new", label: "Open Add Customer" },
  },
  {
    id: "mistake",
    who: "all",
    icon: Undo2,
    title: "Made a mistake?",
    steps: [
      "Saved entries cannot be changed or deleted by workers. This keeps the stock and money correct.",
      "Do not enter the same thing again to fix it. Tell an admin which entry is wrong.",
      "The admin cancels it with a reason (this is called **void**), and then you enter it again correctly.",
    ],
  },

  // ---- Admins only ----
  {
    id: "setup",
    who: "admin",
    icon: Rocket,
    title: "First-time setup, in this order",
    steps: [
      "**Settings > Company & Invoice**: company name, address, NTN and STRN, GST rate, number prefixes and payment terms. These print on every invoice.",
      "**Settings** lists: check **Categories**, **Units**, **Sizes**, **Microns**, **Colors / Types** and **Brands**. Add what is missing.",
      "**Raw Materials > Add Raw Material** and **Products > Add Product** for everything you buy and make. Set a **Low-stock level** for each.",
      "**Settings > Recipes**: for each product, how much of each raw material one unit uses.",
      "**Stock > Opening stock / Adjust**: enter today's count of every item as **Opening stock**.",
      "**Customers** and **Suppliers**: add them with their **Opening balance (Rs)**, what they owed or were owed on the day you start.",
      "**Users**: add the workers and the other admin.",
    ],
    link: { href: "/admin/settings", label: "Open Settings" },
  },
  {
    id: "payments",
    who: "admin",
    icon: Banknote,
    title: "Record payments",
    steps: [
      "Money received: open the customer under **Customers**, then **Record a payment received**.",
      "Money paid: open the supplier under **Suppliers**, then **Record a payment**.",
      "Pick the bill or invoice it is for, or choose the general payment option if it is not for one bill.",
      "Type the amount, date and method. For a cheque or bank transfer, add the cheque or transaction number.",
      "Tap **Save payment**. The balance and ledger update straight away.",
    ],
    tips: ["You can also enter a payment on a new purchase or invoice, in its payment box."],
    link: { href: "/admin/customers", label: "Open Customers" },
  },
  {
    id: "void",
    who: "admin",
    icon: Ban,
    title: "Cancel a wrong entry (void)",
    steps: [
      "Open the purchase, invoice or production run that is wrong.",
      "Tap **Void purchase**, **Void invoice** or **Void run**.",
      "Type the reason, for example \"Entered twice by mistake\", and confirm.",
      "Enter the correct one again as new.",
    ],
    tips: [
      "Voiding puts the stock back and cancels payments on it. Nothing is deleted: it stays in the list marked Void, with your reason.",
      "A void cannot be undone, so check before you confirm.",
    ],
  },
  {
    id: "adjust",
    who: "admin",
    icon: SlidersHorizontal,
    title: "Correct a stock count",
    steps: [
      "Count the item. If the app shows a different number, open **Stock > Opening stock / Adjust**, or **Adjust stock** on the item's page.",
      "Choose **Adjustment**, then **Add to stock** (found more) or **Remove from stock** (damaged, lost, counted short).",
      "Type the quantity and check **After saving** shows the right number.",
      "Tap **Save stock entry**.",
    ],
    tips: ["Stock can never go below zero. The app stops you and says how much is really there."],
    link: { href: "/admin/stock/adjust", label: "Open Opening stock / Adjust" },
  },
  {
    id: "users",
    who: "admin",
    icon: UserCog,
    title: "Manage users",
    steps: [
      "Open **Users**. Under **Add a user**, type the name, email and a password (at least 8 characters).",
      "Choose **Worker** or **Admin**, then tap **Add user**. Give them the email and password.",
      "Forgot password: tap **Edit** on that user and type a new password.",
      "Someone leaves: tap **Edit** and set them to **Switched off**. Their past entries stay.",
    ],
    tips: ["Workers can record purchases, production and invoices. Only admins see money, reports, settings and can void."],
    link: { href: "/admin/users", label: "Open Users" },
  },
  {
    id: "reports",
    who: "admin",
    icon: BarChart3,
    title: "Reports",
    steps: [
      "Open **Reports** and pick a tab: **Sales**, **Purchases**, **Production**, **Raw material use**, **Stock**, **Receivables & Payables** or **Profit**.",
      "Pick the dates, for example **This month** or **Last 3 months**, or **Pick dates**.",
      "Each chart has a **Chart** and **Table** button. The table shows the exact numbers.",
      "**Download CSV** saves the open tab as a file you can open in Excel.",
    ],
    link: { href: "/admin/reports", label: "Open Reports" },
  },
  {
    id: "activity",
    who: "admin",
    icon: History,
    title: "See who did what",
    steps: [
      "Open **Activity** to see every entry, change and sign in, with who did it and when.",
      "Use the filters to look at one person or one page, and **Export CSV** to keep a copy.",
    ],
    link: { href: "/admin/activity", label: "Open Activity" },
  },
];

export const TROUBLE = [
  {
    q: "It says \"Not enough stock\".",
    a: "The quantity is more than the app has in stock. Check the number you typed. If the goods really are there, record the purchase or production first, or ask an admin to correct the count.",
  },
  {
    q: "It says \"This account has been switched off\".",
    a: "Your sign in is not active. Ask an admin to turn it on in Users.",
  },
  {
    q: "I forgot my password.",
    a: "Ask an admin. They can set a new one for you in Users.",
  },
  {
    q: "I saved something wrong.",
    a: "Do not enter it again. Tell an admin which entry it is, so they can void it. Then enter it correctly.",
  },
  {
    q: "A page is not loading.",
    a: "Check the internet connection, then pull down or press refresh. If it still does not open, tell an admin.",
  },
];

export const ROUTINE_ICON = ClipboardCheck;
