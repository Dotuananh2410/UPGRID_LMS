"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { Mail, Lock, Loader2, ArrowRight } from "lucide-react";
import Logo from "@/components/Logo";

export default function LoginPage() {
  const { login, user, isLoading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // If already logged in, redirect to respective dashboard
    if (user && !isLoading) {
      if (user.role === "ADMIN") router.push("/admin");
      else if (user.role === "GIAO_VIEN") router.push("/teacher");
      else router.push("/student");
    }
  }, [user, isLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    if (!email || !password) {
      setError("Vui lòng nhập đầy đủ email và mật khẩu.");
      setSubmitting(false);
      return;
    }

    const res = await login(email, password);
    if (!res.success) {
      setError(res.error || "Đăng nhập thất bại.");
      setSubmitting(false);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8 bg-gradient-to-tr from-blue-500/5 via-neutral-50 to-cyan-500/5 dark:from-blue-950/20 dark:via-neutral-950 dark:to-cyan-950/20">
      <div className="max-w-md w-full space-y-8 p-8 rounded-3xl border border-neutral-200 dark:border-neutral-800 bg-white/70 dark:bg-neutral-900/70 backdrop-blur-xl shadow-xl">
        <div className="text-center">
          <div className="mx-auto w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-cyan-500 flex items-center justify-center text-white p-2 shadow-lg shadow-blue-500/20 mb-4">
            <Logo className="w-full h-full text-white" />
          </div>
          <h2 className="text-3xl font-extrabold text-neutral-900 dark:text-white tracking-tight">
            Chào mừng quay lại
          </h2>
          <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
            Đăng nhập vào cổng học viên UpGrid Academy
          </p>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-600 dark:text-red-400 font-medium">
            {error}
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4 rounded-md shadow-sm">
            <div>
              <label htmlFor="email-address" className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">
                Địa chỉ Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-400">
                  <Mail className="w-5 h-5" />
                </div>
                <input
                  id="email-address"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 pr-4 py-3 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent text-sm transition-all"
                  placeholder="admin@upgrid.edu.vn"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">
                Mật khẩu
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-400">
                  <Lock className="w-5 h-5" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-4 py-3 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent text-sm transition-all"
                  placeholder="••••••••"
                />
              </div>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={submitting}
              className="group relative w-full flex justify-center py-3.5 px-4 border border-transparent rounded-xl text-sm font-bold text-white bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 shadow-md shadow-blue-500/20 disabled:opacity-50 transition-all hover-lift cursor-pointer"
            >
              {submitting ? (
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
              ) : (
                <>
                  Đăng Nhập
                  <ArrowRight className="w-4 h-4 ml-1.5 group-hover:translate-x-0.5 transition-transform" />
                </>
              )}
            </button>
          </div>
        </form>

        <div className="mt-6 border-t border-neutral-200 dark:border-neutral-800 pt-6 text-center text-xs text-neutral-500 dark:text-neutral-400 space-y-1">
          <p>Tài khoản dùng thử:</p>
          <p>Admin: <span className="font-mono text-neutral-700 dark:text-neutral-300 select-all">admin@upgrid.edu.vn</span> / <span className="font-mono text-neutral-700 dark:text-neutral-300">admin123</span></p>
          <p>Giáo viên: <span className="font-mono text-neutral-700 dark:text-neutral-300 select-all">teacher.ha@upgrid.edu.vn</span> / <span className="font-mono text-neutral-700 dark:text-neutral-300">teacher123</span></p>
          <p>Học viên: <span className="font-mono text-neutral-700 dark:text-neutral-300 select-all">student.an@upgrid.edu.vn</span> / <span className="font-mono text-neutral-700 dark:text-neutral-300">student123</span></p>
        </div>
      </div>
    </div>
  );
}
