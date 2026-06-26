import type { Metadata } from "next";
import "./globals.css";
import { Suspense } from "react";
import { AuthProvider } from "@/context/AuthContext";
import Sidebar from "@/components/Sidebar";

export const metadata: Metadata = {
  title: "UpGrid Academy - Hệ thống quản lý học tập tối ưu",
  description: "Up your skill - Build our future. Cổng thông tin kết quả học tập, chuyên cần và nhận xét chi tiết dành riêng cho học viên UpGrid Academy.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" className="h-full scroll-smooth">
      <body className="min-h-screen flex flex-col md:flex-row bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-50">
        <AuthProvider>
          <Suspense fallback={<div className="w-64 h-screen flex-shrink-0 bg-white dark:bg-neutral-950 border-r border-neutral-200 dark:border-neutral-800 hidden md:block"></div>}>
            <Sidebar />
          </Suspense>
          <div className="flex-1 flex flex-col min-h-screen min-w-0">
            <main className="flex-1 w-full flex flex-col">{children}</main>
            <footer className="w-full border-t border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 py-6 text-center text-xs text-neutral-500 dark:text-neutral-400 mt-auto">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <p>© {new Date().getFullYear()} UpGrid Academy. Mọi quyền được bảo lưu. Hotline: 0385717738.</p>
              </div>
            </footer>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
