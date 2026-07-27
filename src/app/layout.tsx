import type { Metadata } from "next";
import "./globals.css";
// import localFont from "next/font/local"; // Kept for future custom font loading if design requires it

import LayoutClient from "@/components/LayoutClient";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "Lawsome",
  description:
    "Connect with verified lawyers, chartered accountants, and legal professionals tailored to your needs. Simplify your search and get expert guidance for all your legal and financial matters.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <LayoutClient>{children}</LayoutClient>
        </Providers>
      </body>
    </html>
  );
}
