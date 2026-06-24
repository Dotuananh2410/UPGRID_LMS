"use client";

import React, { useState } from "react";
import useSWR from "swr";
import { requestGas } from "@/utils/apiClient";
import { Class } from "@/types/lms";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { 
  DollarSign, Calendar, ArrowUpRight, ArrowDownLeft, ArrowRightLeft,
  Search, Filter, Loader2, ArrowLeft, RefreshCw, AlertCircle
} from "lucide-react";

interface BillingData {
  billingList: any[];
  transactions: {
    transactionId: string;
    studentId: string;
    fullName: string;
    classId: string;
    className: string;
    amount: number;
    type: "Thu" | "Hoàn" | "Chuyển";
    date: string;
    cashierId: string;
  }[];
}

export default function BillingHistoryPage() {
  const { user } = useAuth();
  const router = useRouter();

  // Search & Filter States
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedType, setSelectedType] = useState("");
  const [selectedMonth, setSelectedMonth] = useState(""); // YYYY-MM

  // Redirect if not ADMIN or QUAN_SINH
  if (user && user.role !== "ADMIN" && user.role !== "QUAN_SINH") {
    router.push(user.role === "GIAO_VIEN" ? "/teacher" : "/student");
    return null;
  }

  // Fetch billing dashboard data (which includes all transactions)
  const { data, error, mutate, isValidating } = useSWR<BillingData>("getBillingDashboard", () =>
    requestGas<BillingData>("getBillingDashboard")
  );

  // Fetch all classes for filter dropdown
  const { data: classes = [] } = useSWR<Class[]>("getClasses", () =>
    requestGas<Class[]>("getClasses")
  );

  const loading = !error && !data;
  const transactions = data?.transactions || [];

  // Filter transactions based on states
  const filteredTransactions = transactions.filter((txn) => {
    // 1. Text Search (name, student id, transaction id)
    const matchesSearch = 
      txn.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      txn.studentId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      txn.transactionId.toLowerCase().includes(searchTerm.toLowerCase());

    // 2. Class Filter
    const matchesClass = !selectedClass || txn.classId === selectedClass;

    // 3. Type Filter
    const matchesType = !selectedType || txn.type === selectedType;

    // 4. Month Filter
    let matchesMonth = true;
    if (selectedMonth) {
      // txn.date is usually YYYY-MM-DD
      const txnMonth = txn.date.substring(0, 7);
      matchesMonth = txnMonth === selectedMonth;
    }

    return matchesSearch && matchesClass && matchesType && matchesMonth;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 flex flex-col space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-neutral-200 dark:border-neutral-800 pb-5 gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/admin/billing")}
            className="p-2 rounded-xl border border-neutral-200 dark:border-neutral-850 bg-white dark:bg-neutral-900 hover:bg-neutral-50 dark:hover:bg-neutral-800 text-neutral-500 hover:text-neutral-700 dark:hover:text-white transition-all cursor-pointer"
            title="Quay lại"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-3xl font-extrabold text-neutral-900 dark:text-white tracking-tight">
              Lịch Sử Giao Dịch & Thanh Toán
            </h1>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
              Tra cứu và đối soát toàn bộ lịch sử đóng học phí, hoàn phí và luân chuyển tài chính.
            </p>
          </div>
        </div>

        <button
          onClick={() => mutate()}
          disabled={isValidating}
          className="self-start sm:self-center px-4 py-2 border rounded-xl bg-white dark:bg-neutral-900 border-neutral-350 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800 text-sm font-bold flex items-center gap-1.5 transition-all cursor-pointer"
        >
          <RefreshCw className={`w-4 h-4 text-blue-500 ${isValidating ? "animate-spin" : ""}`} />
          {isValidating ? "Đang đồng bộ..." : "Đồng bộ lại"}
        </button>
      </div>

      {/* Filter Card */}
      <div className="p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm space-y-4">
        <div className="flex items-center gap-2 border-b border-neutral-100 dark:border-neutral-800/40 pb-2 text-neutral-850 dark:text-neutral-250">
          <Filter className="w-4 h-4 text-blue-500" />
          <span className="text-xs font-extrabold uppercase tracking-wider">Bộ lọc giao dịch</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Keyword Search */}
          <div>
            <label className="block text-xs font-bold text-neutral-400 uppercase tracking-wider mb-1.5">Từ khóa tìm kiếm</label>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-neutral-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Tên, mã học sinh, mã GD..."
                className="w-full pl-9 pr-4 py-2 border rounded-xl bg-neutral-50 dark:bg-neutral-950 border-neutral-350 dark:border-neutral-800 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Class Filter */}
          <div>
            <label className="block text-xs font-bold text-neutral-400 uppercase tracking-wider mb-1.5">Lớp học</label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full px-3 py-2 border rounded-xl bg-neutral-50 dark:bg-neutral-950 border-neutral-350 dark:border-neutral-800 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              <option value="">-- Tất cả lớp --</option>
              {classes.map((cls) => (
                <option key={cls.classId} value={cls.classId}>
                  {cls.className} ({cls.classId})
                </option>
              ))}
            </select>
          </div>

          {/* Type Filter */}
          <div>
            <label className="block text-xs font-bold text-neutral-400 uppercase tracking-wider mb-1.5">Loại giao dịch</label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full px-3 py-2 border rounded-xl bg-neutral-50 dark:bg-neutral-950 border-neutral-350 dark:border-neutral-800 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              <option value="">-- Tất cả loại --</option>
              <option value="Thu">Thu tiền học phí</option>
              <option value="Hoàn">Hoàn học phí</option>
              <option value="Chuyển">Luân chuyển phí</option>
            </select>
          </div>

          {/* Month Filter */}
          <div>
            <label className="block text-xs font-bold text-neutral-400 uppercase tracking-wider mb-1.5">Tháng giao dịch</label>
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-full px-3 py-2 border rounded-xl bg-neutral-50 dark:bg-neutral-950 border-neutral-350 dark:border-neutral-800 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex-1 flex flex-col items-center justify-center py-16">
          <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
          <p className="mt-4 text-sm font-medium text-neutral-500">Đang quét nhật ký giao dịch...</p>
        </div>
      ) : (
        <div className="p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm overflow-x-auto animate-fade-in">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-neutral-900 dark:text-white">
              Nhật ký dòng tiền ({filteredTransactions.length} kết quả)
            </h3>
            <span className="text-xs text-neutral-400">
              Tổng dòng tiền thu: <strong className="text-green-600 dark:text-green-400">{filteredTransactions.filter(t => t.type === "Thu").reduce((acc, t) => acc + t.amount, 0).toLocaleString("vi-VN")} đ</strong>
            </span>
          </div>

          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="border-b border-neutral-200 dark:border-neutral-800 text-xs font-bold text-neutral-500 uppercase tracking-wider">
                <th className="pb-3">Mã GD</th>
                <th className="pb-3">Học viên</th>
                <th className="pb-3">Lớp học</th>
                <th className="pb-3 text-right">Số tiền</th>
                <th className="pb-3 text-center">Phân loại</th>
                <th className="pb-3">Ngày giao dịch</th>
                <th className="pb-3">Người thu</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800 text-sm text-neutral-700 dark:text-neutral-300">
              {filteredTransactions.map((txn) => {
                const isIncoming = txn.type === "Thu";
                const isOutgoing = txn.type === "Hoàn";
                
                return (
                  <tr key={txn.transactionId} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/10">
                    <td className="py-3.5 font-mono text-xs font-bold text-neutral-550 dark:text-neutral-400 select-all">
                      {txn.transactionId}
                    </td>
                    <td className="py-3.5">
                      <p className="font-bold text-neutral-900 dark:text-white">{txn.fullName}</p>
                      <span className="text-xs font-mono text-neutral-400">{txn.studentId}</span>
                    </td>
                    <td className="py-3.5">
                      <span className="px-2 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-xs font-medium text-neutral-600 dark:text-neutral-400">
                        {txn.classId}
                      </span>
                      <p className="text-xs text-neutral-500 font-medium mt-0.5 truncate max-w-[12rem]">{txn.className}</p>
                    </td>
                    <td className="py-3.5 text-right">
                      <div className={`font-bold flex items-center justify-end gap-0.5 text-base ${
                        isIncoming 
                          ? "text-green-600 dark:text-green-400" 
                          : isOutgoing 
                            ? "text-rose-600 dark:text-rose-400" 
                            : "text-amber-600 dark:text-amber-400"
                      }`}>
                        {isIncoming ? <ArrowDownLeft className="w-4 h-4" /> : isOutgoing ? <ArrowUpRight className="w-4 h-4" /> : <ArrowRightLeft className="w-4 h-4" />}
                        {txn.amount.toLocaleString("vi-VN")} đ
                      </div>
                    </td>
                    <td className="py-3.5 text-center">
                      <span className={`inline-block px-2.5 py-1 rounded-lg font-extrabold text-xs uppercase tracking-wider ${
                        isIncoming 
                          ? "bg-green-500/10 text-green-600 dark:text-green-400" 
                          : isOutgoing 
                            ? "bg-rose-500/10 text-rose-600 dark:text-rose-400" 
                            : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                      }`}>
                        {txn.type}
                      </span>
                    </td>
                    <td className="py-3.5 font-medium">
                      {txn.date}
                    </td>
                    <td className="py-3.5 font-mono text-xs font-bold text-neutral-500">
                      {txn.cashierId || "Hệ thống"}
                    </td>
                  </tr>
                );
              })}

              {filteredTransactions.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-neutral-400 font-medium">
                    <AlertCircle className="w-8 h-8 mx-auto mb-2 text-neutral-400" />
                    Không tìm thấy giao dịch nào khớp với bộ lọc!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
