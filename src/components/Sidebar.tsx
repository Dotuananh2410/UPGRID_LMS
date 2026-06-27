"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import useSWR from "swr";
import { requestGas } from "@/utils/apiClient";
import { useAuth } from "@/context/AuthContext";
import { 
  LogOut, User as UserIcon, BookOpen, LayoutDashboard, 
  Sun, Moon, CheckSquare, CreditCard, Coins, Menu, X,
  FolderOpen, Folder, File, ChevronDown, ChevronRight,
  Database, FileText, Code, FileSpreadsheet, Terminal
} from "lucide-react";
import Logo from "@/components/Logo";

export const Sidebar: React.FC = () => {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Folder toggle states for GIAO_VIEN role IDE file explorer
  const [foldersOpen, setFoldersOpen] = useState({
    attendance: true,
    training: true,
    grades: true
  });

  // Fetch teacher classes for GIAO_VIEN role
  const { data: classes = [] } = useSWR(
    user?.role === "GIAO_VIEN" ? "getClasses" : null,
    () => requestGas<any[]>("getClasses")
  );

  // Get active query parameters for teacher workspace
  const activeClassId = searchParams.get("classId") || classes[0]?.classId || "";
  const activePanel = searchParams.get("panel") || "attendance_overview";

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

  // Close drawer on path change
  useEffect(() => {
    setIsMobileOpen(false);
  }, [pathname]);

  const toggleFolder = (folder: "attendance" | "training" | "grades") => {
    setFoldersOpen(prev => ({ ...prev, [folder]: !prev[folder] }));
  };

  const handleSelectPanel = (panelName: string) => {
    const cid = activeClassId || (classes[0]?.classId || "");
    router.push(`/teacher?classId=${cid}&panel=${panelName}`);
  };

  const handleSelectClass = (cid: string) => {
    router.push(`/teacher?classId=${cid}&panel=${activePanel}`);
  };

  const navLinks = [
    {
      href: "/classes",
      label: "Lớp Học Công Khai",
      icon: <BookOpen className="w-5 h-5" />,
      show: user?.role !== "GIAO_VIEN"
    },
    {
      href: "/admin",
      label: "Hồ sơ",
      icon: <LayoutDashboard className="w-5 h-5" />,
      show: user?.role === "ADMIN" || user?.role === "QUAN_SINH"
    },
    {
      href: "/admin/approvals",
      label: "Duyệt Điểm Danh",
      icon: <CheckSquare className="w-5 h-5" />,
      show: user?.role === "ADMIN" || user?.role === "QUAN_SINH"
    },
    {
      href: "/admin/billing",
      label: "Học Phí & Công Nợ",
      icon: <CreditCard className="w-5 h-5" />,
      show: user?.role === "ADMIN" || user?.role === "QUAN_SINH"
    },
    {
      href: "/admin/payroll",
      label: "Lương GV",
      icon: <Coins className="w-5 h-5" />,
      show: user?.role === "ADMIN" || user?.role === "QUAN_SINH"
    },
    {
      href: "/teacher",
      label: "Workspace Giáo Viên",
      icon: <LayoutDashboard className="w-5 h-5" />,
      show: user?.role === "GIAO_VIEN"
    },
    {
      href: "/student",
      label: "Dashboard Học Viên",
      icon: <LayoutDashboard className="w-5 h-5" />,
      show: user?.role === "HOC_VIEN"
    }
  ];

  const sidebarContent = (
    <div className="flex flex-col h-full bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-50 p-5 space-y-6 select-none text-xs">
      {/* Brand logo */}
      <div className="flex items-center pb-4 border-b border-neutral-200 dark:border-neutral-800">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-500 flex items-center justify-center text-white p-1.5 shadow-md shadow-blue-500/30 group-hover:scale-105 transition-transform duration-200">
            <Logo className="w-full h-full text-white" />
          </div>
          <span className="font-extrabold text-lg tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-cyan-500 dark:from-blue-400 dark:to-cyan-300">
            UpGrid<span className="text-neutral-950 dark:text-white font-semibold text-xs ml-1 select-none px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700">Academy</span>
          </span>
        </Link>
      </div>

      {/* Navigation list */}
      <div className="flex-1 flex flex-col min-h-0 overflow-y-auto pr-1">
        {!mounted ? (
          <nav className="flex flex-col space-y-1.5 p-2 animate-pulse">
            <div className="h-11 bg-neutral-100 dark:bg-neutral-800 rounded-xl w-full"></div>
            <div className="h-11 bg-neutral-100 dark:bg-neutral-800 rounded-xl w-full"></div>
            <div className="h-11 bg-neutral-100 dark:bg-neutral-800 rounded-xl w-full"></div>
          </nav>
        ) : user?.role === "GIAO_VIEN" ? (
          // TEACHER REPOSITORY LINKS STYLE
          <div className="space-y-4 font-semibold text-xs">
            {/* Class Repo Selector */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-extrabold text-neutral-400 uppercase tracking-wider block">Repository / Lớp dạy</span>
              <div className="relative">
                <select
                  value={activeClassId}
                  onChange={(e) => handleSelectClass(e.target.value)}
                  className="w-full pl-3 pr-8 py-2 border rounded-xl bg-neutral-50 dark:bg-neutral-950 border-neutral-200 dark:border-neutral-805 font-bold text-neutral-855 dark:text-neutral-250 focus:outline-none focus:ring-1 focus:ring-blue-500 appearance-none text-xs truncate cursor-pointer"
                >
                  {classes.map((cls: any) => (
                    <option key={cls.classId} value={cls.classId}>
                      📁 {cls.className}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-neutral-500">
                  <ChevronDown className="w-3.5 h-3.5" />
                </div>
              </div>
            </div>

            {/* Navigation links inside the teacher view */}
            <nav className="flex flex-col space-y-1.5 pt-2">
              <button
                onClick={() => handleSelectPanel("attendance_overview")}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all duration-205 cursor-pointer text-left ${
                  activePanel === "attendance_overview" || activePanel === "attendance_take" || activePanel === "attendance_matrix"
                    ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-l-4 border-blue-600 dark:border-blue-400 pl-3 shadow-xs"
                    : "text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-850 hover:text-neutral-900 dark:hover:text-white"
                }`}
              >
                <CheckSquare className="w-5 h-5 shrink-0" />
                Điểm danh
              </button>

              <button
                onClick={() => handleSelectPanel("progress")}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all duration-205 cursor-pointer text-left ${
                  activePanel === "progress"
                    ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-l-4 border-blue-600 dark:border-blue-400 pl-3 shadow-xs"
                    : "text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-850 hover:text-neutral-900 dark:hover:text-white"
                }`}
              >
                <BookOpen className="w-5 h-5 shrink-0" />
                Quản lý đào tạo
              </button>

              <button
                onClick={() => handleSelectPanel("grades_entry")}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all duration-205 cursor-pointer text-left ${
                  activePanel === "grades_entry" || activePanel === "grades_matrix" || activePanel === "grades_history"
                    ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-l-4 border-blue-600 dark:border-blue-400 pl-3 shadow-xs"
                    : "text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-850 hover:text-neutral-900 dark:hover:text-white"
                }`}
              >
                <FileSpreadsheet className="w-5 h-5 shrink-0" />
                Quản lý điểm số
              </button>
            </nav>
          </div>
        ) : (
          // STANDARD LINKS
          <nav className="flex flex-col space-y-1.5">
            {navLinks.filter(link => link.show).map((link) => {
              const active = isLinkActive(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all duration-205 ${
                    active
                      ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-l-4 border-blue-600 dark:border-blue-400 pl-3 shadow-xs"
                      : "text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-850 hover:text-neutral-900 dark:hover:text-white"
                  }`}
                >
                  {link.icon}
                  {link.label}
                </Link>
              );
            })}
          </nav>
        )}
      </div>

      {/* Footer controls & profile */}
      <div className="border-t border-neutral-200 dark:border-neutral-800 pt-4 space-y-4 font-sans">
        <div className="flex items-center justify-between px-2">
          <span className="text-[10px] font-extrabold text-neutral-450 dark:text-neutral-500 uppercase tracking-wider">Giao diện</span>
          <button
            onClick={toggleTheme}
            className="p-2 text-neutral-500 hover:text-blue-600 dark:text-neutral-400 dark:hover:text-blue-400 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-850 transition-colors cursor-pointer"
            aria-label="Toggle theme"
          >
            {theme === "light" ? <Moon className="w-4.5 h-4.5" /> : <Sun className="w-4.5 h-4.5" />}
          </button>
        </div>

        {user && (
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-2.5 rounded-2xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-150/60 dark:border-neutral-850">
              <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-neutral-800 border border-blue-200 dark:border-neutral-700 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-sm">
                <UserIcon className="w-4.5 h-4.5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-neutral-850 dark:text-neutral-200 truncate">
                  {user.fullName}
                </p>
                <span className="text-[9px] font-extrabold text-blue-600 dark:text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full inline-block mt-0.5 uppercase tracking-wider">
                  {user.role === "ADMIN" ? "Quản trị" : user.role === "QUAN_SINH" ? "Quản sinh" : user.role === "GIAO_VIEN" ? "Giáo viên" : "Học viên"}
                </span>
              </div>
            </div>
            
            <button
              onClick={logout}
              className="w-full flex items-center justify-center gap-2 py-2.5 text-sm font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 dark:hover:bg-rose-500/20 rounded-xl transition-all cursor-pointer border border-rose-500/10 font-sans"
            >
              <LogOut className="w-4 h-4" />
              Đăng Xuất
            </button>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar Layout */}
      <aside className="hidden md:flex flex-col w-64 h-screen sticky top-0 border-r border-neutral-200 dark:border-neutral-805 z-40 flex-shrink-0">
        {sidebarContent}
      </aside>

      {/* Mobile Top Header Layout */}
      <header className="md:hidden flex items-center justify-between h-16 px-4 bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800 z-50 sticky top-0 w-full font-sans">
        <button
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-400"
          aria-label="Toggle Navigation"
        >
          {isMobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>

        <Link href="/" className="flex items-center gap-2 font-extrabold text-md">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-cyan-500 flex items-center justify-center text-white p-1">
            <Logo className="w-full h-full text-white" />
          </div>
          <span className="text-sm tracking-tight text-neutral-900 dark:text-white">UpGrid Academy</span>
        </Link>

        <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-neutral-800 flex items-center justify-center text-blue-600 dark:text-blue-400 text-xs font-bold">
          {user ? user.fullName.substring(0, 1) : "?"}
        </div>
      </header>

      {/* Mobile Drawer Drawer */}
      {isMobileOpen && (
        <div className="md:hidden fixed inset-0 z-40 flex">
          <div 
            className="fixed inset-0 bg-neutral-900/60 backdrop-blur-sm transition-opacity" 
            onClick={() => setIsMobileOpen(false)}
          />
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white dark:bg-neutral-900 shadow-2xl animate-slide-in h-full">
            <div className="absolute top-0 right-0 -mr-12 pt-2">
              <button
                type="button"
                onClick={() => setIsMobileOpen(false)}
                className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white bg-neutral-900/40 text-white"
              >
                <X className="h-6 w-6" aria-hidden="true" />
              </button>
            </div>
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;
