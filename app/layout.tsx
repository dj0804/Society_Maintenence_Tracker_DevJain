import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Society Maintenance Tracker",
  description:
    "Raise, track and resolve apartment society maintenance complaints, with a shared notice board and email updates.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen font-sans antialiased">{children}</body>
    </html>
  );
}
