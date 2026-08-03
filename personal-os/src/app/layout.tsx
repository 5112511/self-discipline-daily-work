import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { AppProvider } from "@/context/AppContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "玥莹的 Personal OS",
  description: "把散落的生活，收进今天。",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Personal OS",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="zh-CN"
      className={`${geistSans.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-white text-black">
        <AppProvider>
          <div className="mx-auto max-w-md min-h-screen bg-white relative shadow-2xl">
            {children}
          </div>
        </AppProvider>
      </body>
    </html>
  );
}
