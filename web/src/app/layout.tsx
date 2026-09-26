import type { Metadata, Viewport } from "next";
// Self-hosted from node_modules so the UI font works offline.
import "@fontsource-variable/inter";
import "./globals.css";

export const metadata: Metadata = {
  title: "Trigger Point",
  description:
    "Report a wildfire you can see, watch the projected spread once neighbours confirm it, and see where to go. Projection, not a forecast. Call 911 for emergencies.",
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
