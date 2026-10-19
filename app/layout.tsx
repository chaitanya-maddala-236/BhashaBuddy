import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "BhashaBuddy — Everyday language, one conversation at a time",
  description: "A practical 30-day path to more confidence in everyday conversations in an Indian language.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
