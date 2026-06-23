"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { LogOut, User as UserIcon, BookOpen, LayoutDashboard, Sun, Moon } from "lucide-react";
import Logo from "@/components/Logo";

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    // Initial theme check
    const savedTheme = localStorage.getItem("upgrid_theme");
    const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    const activeTheme = savedTheme === "dark" || savedTheme === "light" ? savedTheme : systemTheme;
    
    setTheme(activeTheme as "light" | "dark");
    if (activeTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === "light" ? "dark" : "light";
    setTheme(nextTheme);
    localStorage.setItem("upgrid_theme", nextTheme);
    if (nextTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  const isLinkActive = (path: string) => {
    return pathname === path;
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-neutral-200 dark:border-neutral-800 glass shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-500 flex items-center justify-center text-white p-1.5 shadow-md shadow-blue-500/30 group-hover:scale-105 transition-transform duration-200">
                <Logo className="w-full h-full text-white" />
              </div>
              <span className="font-extrabold text-xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-cyan-500 dark:from-blue-400 dark:to-cyan-300">
                UpGrid<span className="text-neutral-900 dark:text-white font-semibold text-xs ml-1 select-none px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700">Academy</span>
              </span>
            </Link>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex space-x-1">
            <Link
              href="/classes"
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                isLinkActive("/classes")
                  ? "bg-blue-500/10 text-blue-600 dark:text-blue-400"
                  : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800 dark:hover:text-white"
              }`}
            >
              <BookOpen className="w-4 h-4" />
              Lớp Học Công Khai
            </Link>

            {user && (
              <>
                {user.role === "ADMIN" && (
                  <Link
                    href="/admin"
                    className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                      isLinkActive("/admin")
                        ? "bg-blue-500/10 text-blue-600 dark:text-blue-400"
                        : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800 dark:hover:text-white"
                    }`}
                  >
                    <LayoutDashboard className="w-4 h-4" />
                    Quản Trị Admin
                  </Link>
                )}

                {user.role === "GIAO_VIEN" && (
                  <Link
                    href="/teacher"
                    className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                      isLinkActive("/teacher")
                        ? "bg-blue-500/10 text-blue-600 dark:text-blue-400"
                        : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800 dark:hover:text-white"
                    }`}
                  >
                    <LayoutDashboard className="w-4 h-4" />
                    Workspace Giáo Viên
                  </Link>
                )}

                {user.role === "HOC_VIEN" && (
                  <Link
                    href="/student"
                    className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                      isLinkActive("/student")
                        ? "bg-blue-500/10 text-blue-600 dark:text-blue-400"
                        : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800 dark:hover:text-white"
                    }`}
                  >
                    <LayoutDashboard className="w-4 h-4" />
                    Dashboard Học Viên
                  </Link>
                )}
              </>
            )}
          </nav>

          {/* User Section & Theme Controls */}
          <div className="flex items-center gap-3">
            <button
              onClick={toggleTheme}
              className="p-2 text-neutral-500 hover:text-blue-600 dark:text-neutral-400 dark:hover:text-blue-400 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
              aria-label="Toggle theme"
            >
              {theme === "light" ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
            </button>

            {user ? (
              <div className="flex items-center gap-3">
                <div className="hidden lg:flex flex-col text-right">
                  <span className="text-sm font-bold text-neutral-800 dark:text-neutral-200">
                    {user.fullName}
                  </span>
                  <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full inline-block self-end">
                    {user.role === "ADMIN" ? "Quản trị viên" : user.role === "GIAO_VIEN" ? "Giáo viên" : "Học viên"}
                  </span>
                </div>
                <div className="w-9 h-9 rounded-full bg-blue-100 dark:bg-neutral-800 border border-blue-200 dark:border-neutral-700 flex items-center justify-center text-blue-600 dark:text-blue-400">
                  <UserIcon className="w-4.5 h-4.5" />
                </div>
                <button
                  onClick={logout}
                  className="flex items-center gap-1.5 px-3 py-2 text-sm font-bold text-red-600 dark:text-red-400 hover:bg-red-500/10 dark:hover:bg-red-500/20 rounded-lg transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden sm:inline">Đăng Xuất</span>
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className="flex items-center gap-1.5 px-5 py-2.5 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-bold text-sm shadow-md hover:shadow-lg transition-all duration-200 hover-lift"
              >
                Đăng Nhập
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
