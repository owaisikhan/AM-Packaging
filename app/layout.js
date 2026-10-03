import { Inter } from "next/font/google";
import "@/app/_styles/globals.css";
import { siteConfig } from "@/app/_lib/siteConfig";
import { PREPAINT_SCRIPT } from "@/app/_components/layout/themeState";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });

export const metadata = {
  title: { default: siteConfig.appName, template: `%s | ${siteConfig.appName}` },
  description: `${siteConfig.fullName}: stock, production, purchases and sales.`,
  robots: { index: false, follow: false },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#22b573",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: PREPAINT_SCRIPT }} />
      </head>
      <body className="font-sans">{children}</body>
    </html>
  );
}
