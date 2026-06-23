import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ToastProvider } from "@/lib/toast";
import { ToastStack } from "@/components/atoms/ToastStack";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Product Studio",
  description: "AI-powered product creation pipeline — brief to launch-ready landing page.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body>
        <ToastProvider>
          {children}
          <ToastStack />
        </ToastProvider>
      </body>
    </html>
  );
}
