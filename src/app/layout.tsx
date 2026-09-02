import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "X AI Reply Generator",
  description: "Generate sharper, more engaging X replies in seconds.",
  icons: {
    icon: "/favicon.svg",
  },
  verification: {
    google: "MZSsr_zS9a1yAryHkG9TaStz-65k0oGvUvrOpssRXsA",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#0b0d12] text-white">{children}</body>
    </html>
  );
}
