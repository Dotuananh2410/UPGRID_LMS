"use client";

import React from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { ArrowRight } from "lucide-react";

interface ClassCardActionProps {
  classId: string;
}

export default function ClassCardAction({ classId }: ClassCardActionProps) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <span className="text-sm font-semibold text-neutral-400">
        Đang tải...
      </span>
    );
  }

  if (!user) {
    return (
      <Link
        href="/login"
        className="flex items-center gap-1 text-sm font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
      >
        Đăng nhập để xem chi tiết
        <ArrowRight className="w-4 h-4" />
      </Link>
    );
  }

  if (user.role === "ADMIN" || user.role === "QUAN_SINH") {
    return (
      <Link
        href={`/admin?classId=${classId}`}
        className="flex items-center gap-1 text-sm font-bold text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 transition-colors"
      >
        Xem chi tiết lớp học
        <ArrowRight className="w-4 h-4" />
      </Link>
    );
  }

  if (user.role === "GIAO_VIEN") {
    return (
      <Link
        href="/teacher"
        className="flex items-center gap-1 text-sm font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
      >
        Đến trang giáo viên
        <ArrowRight className="w-4 h-4" />
      </Link>
    );
  }

  // Student
  return (
    <Link
      href="/student"
      className="flex items-center gap-1 text-sm font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
    >
      Xem lớp học của tôi
      <ArrowRight className="w-4 h-4" />
    </Link>
  );
}
