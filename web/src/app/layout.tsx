import type { Metadata, Viewport } from "next";
// Self-hosted from node_modules so the UI font works offline.
import "@fontsource-variable/inter";
import "./globals.css";

export const metadata: Metadata = {
  title: "Trigger Point · Glendale FD",
  description:
    "Wildfire evacuation pre-incident planning for Glendale canyon neighborhoods. Planning projection, not a forecast.",
  appleWebApp: { capable: true, title: "Trigger Point", statusBarStyle: "black-translucent" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#0b1120",
  colorScheme: "dark",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full">
      <body className="h-full bg-surface font-sans text-slate-100 antialiased">{children}</body>
    </html>
  );
}
