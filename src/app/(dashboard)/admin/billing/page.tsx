"use client";

import React, { useState } from "react";
import useSWR from "swr";
import { requestGas } from "@/utils/apiClient";
import { StudentDebt, Transaction } from "@/types/lms";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { 
  DollarSign, Calendar, ArrowUpRight, ArrowDownLeft, ArrowRightLeft,
  Plus, Search, AlertCircle, CheckCircle2, CreditCard, Clock, Loader2,
  AlertTriangle, Filter
} from "lucide-react";

interface BillingData {
  billingList: {
    enrollmentId: string;
    studentId: string;
    fullName: string;
    classId: string;
    className: string;
    debt: number;
    dueDate: string;
    status: string;
  }[];
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

export default function BillingPage() {
  const { user } = useAuth();
  const router = useRouter();

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedClassFilter, setSelectedClassFilter] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Selector and Pre-fill States
  const [isFromList, setIsFromList] = useState(false);
  const [enrolledClasses, setEnrolledClasses] = useState<{ classId: string; className: string; classDebt: number }[]>([]);
  const [loadingClasses, setLoadingClasses] = useState(false);

  // Form State
  const [form, setForm] = useState({
    studentId: "",
    classId: "",
    amount: "",
    type: "Thu" as "Thu" | "Hoàn" | "Chuyển",
    date: new Date().toLocaleDateString("sv-SE") // YYYY-MM-DD
  });

  // Redirect if not ADMIN
  if (user && user.role !== "ADMIN" && user.role !== "QUAN_SINH") {
    router.push(user.role === "GIAO_VIEN" ? "/teacher" : "/student");
    return null;
  }

  // Fetch billing dashboard data
  const { data, error, mutate } = useSWR<BillingData>("getBillingDashboard", () =>
    requestGas<BillingData>("getBillingDashboard")
  );

  // Fetch students for manual transaction selector
  const { data: studentsList = [] } = useSWR<any[]>("getStudents", () =>
    requestGas<any[]>("getStudents")
  );

  const showMessage = (type: "success" | "error", text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  const handleStudentSelect = async (studentId: string) => {
    setForm(prev => ({ ...prev, studentId, classId: "", amount: "" }));
    if (!studentId) {
      setEnrolledClasses([]);
      return;
    }
    setLoadingClasses(true);
    try {
      const res = await requestGas<any>("getStudentDebt", { body: { studentId } });
      if (res && res.breakdown) {
        setEnrolledClasses(res.breakdown.map((item: any) => ({
          classId: item.classId,
          className: item.className,
          classDebt: item.classDebt
        })));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingClasses(false);
    }
  };

  const handleOpenCollectModal = async (studentId: string, classId: string, debtAmount: number) => {
    setIsFromList(true);
    setForm({
      studentId,
      classId,
      amount: debtAmount.toString(),
      type: "Thu",
      date: new Date().toLocaleDateString("sv-SE")
    });
    setIsModalOpen(true);
    // Load classes list for visual completeness in modal
    setLoadingClasses(true);
    try {
      const res = await requestGas<any>("getStudentDebt", { body: { studentId } });
      if (res && res.breakdown) {
        setEnrolledClasses(res.breakdown.map((item: any) => ({
          classId: item.classId,
          className: item.className,
          classDebt: item.classDebt
        })));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingClasses(false);
    }
  };

  const handleSaveTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.studentId || !form.classId || !form.amount || parseFloat(form.amount) <= 0) {
      showMessage("error", "Vui lòng điền đầy đủ và đúng số tiền!");
      return;
    }
    setSubmitting(true);
    try {
      await requestGas("recordTransaction", {
        method: "POST",
        body: {
          studentId: form.studentId,
          classId: form.classId,
          amount: parseFloat(form.amount),
          type: form.type,
          date: form.date
        }
      });
      showMessage("success", "Ghi nhận giao dịch đóng học phí thành công!");
      setIsModalOpen(false);
      mutate(); // Refresh SWR cache
    } catch (err: any) {
      showMessage("error", err.message || "Lỗi ghi nhận giao dịch");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCashCheckout = async (studentId: string, classId: string, amount: number) => {
    if (!window.confirm(`Xác nhận học sinh ${studentId} đã đóng ${amount.toLocaleString("vi-VN")} đ tiền mặt cho lớp ${classId}?`)) {
      return;
    }
    setSubmitting(true);
    try {
      await requestGas("recordTransaction", {
        method: "POST",
        body: {
          studentId,
          classId,
          amount,
          type: "Thu",
          date: new Date().toLocaleDateString("sv-SE")
        }
      });
      showMessage("success", "Ghi nhận đóng học phí tiền mặt thành công!");
      mutate();
    } catch (err: any) {
      showMessage("error", err.message || "Lỗi ghi nhận đóng học phí");
    } finally {
      setSubmitting(false);
    }
  };

  const loading = !error && !data;
  const billingList = data?.billingList || [];
  const transactions = data?.transactions || [];

  // Extract unique classes with active debts for the quick filter bar
  const uniqueClassesWithDebts = React.useMemo(() => {
    const map: Record<string, { classId: string; className: string; debtCount: number }> = {};
    billingList.forEach(bill => {
      if (!map[bill.classId]) {
        map[bill.classId] = { classId: bill.classId, className: bill.className, debtCount: 0 };
      }
      map[bill.classId].debtCount++;
    });
    return Object.values(map);
  }, [billingList]);

  // Filter bills by search term and class filter
  const filteredBills = billingList.filter(bill => {
    const matchesSearch = bill.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bill.studentId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bill.className.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesClass = !selectedClassFilter || bill.classId === selectedClassFilter;
    return matchesSearch && matchesClass;
  });

  // Check if overdue
  const isOverdue = (dueDateStr: string) => {
    if (!dueDateStr) return false;
    const dueDate = new Date(dueDateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return dueDate < today;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 flex flex-col space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-neutral-200 dark:border-neutral-800 pb-5">
        <div>
          <h1 className="text-3xl font-extrabold text-neutral-900 dark:text-white tracking-tight">
            Quản Lý Học Phí & Công Nợ
          </h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
            Theo dõi học phí chưa nộp của học sinh, ghi nhận các giao dịch nộp phí, hoàn phí và luân chuyển.
          </p>
        </div>
        <div className="mt-4 md:mt-0 flex flex-wrap gap-3">
          <button
            onClick={() => router.push("/admin/billing/history")}
            className="px-5 py-2.5 rounded-xl bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-750 dark:text-neutral-200 font-bold text-sm shadow-sm flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Clock className="w-4.5 h-4.5 text-blue-500" />
            Xem Lịch Sử Giao Dịch
          </button>
          <button
            onClick={() => {
              setForm({ studentId: "", classId: "", amount: "", type: "Thu", date: new Date().toLocaleDateString("sv-SE") });
              setIsFromList(false);
              setEnrolledClasses([]);
              setIsModalOpen(true);
            }}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white font-bold text-sm shadow-md flex items-center gap-1.5 hover-lift transition-all cursor-pointer"
          >
            <Plus className="w-4.5 h-4.5" />
            Tạo Giao Dịch Mới
          </button>
        </div>
      </div>

      {/* Message Notifications */}
      {message && (
        <div 
          className={`p-4 rounded-xl flex items-center gap-3 border text-sm font-medium ${
            message.type === "success" 
              ? "bg-green-500/10 border-green-500/20 text-green-600 dark:text-green-400" 
              : "bg-red-500/10 border-red-500/20 text-red-600 dark:text-red-400"
          }`}
        >
          {message.type === "success" ? <CheckCircle2 className="w-5 h-5 flex-shrink-0" /> : <AlertCircle className="w-5 h-5 flex-shrink-0" />}
          <span>{message.text}</span>
        </div>
      )}

      {loading ? (
        <div className="flex-1 flex flex-col items-center justify-center py-16">
          <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
          <p className="mt-4 text-sm font-medium text-neutral-500">Đang đồng bộ thông tin học phí...</p>
        </div>
      ) : (
        <div className="w-full space-y-6">
          <div className="p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-100 dark:border-neutral-800/50 pb-4">
              <h2 className="text-lg font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-blue-500" /> Danh Sách Học Viên Nợ Phí
              </h2>
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-neutral-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Tìm tên học sinh, mã, lớp..."
                  className="w-full pl-9 pr-4 py-2 border rounded-xl bg-neutral-50 dark:bg-neutral-950 border-neutral-300 dark:border-neutral-700 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Horizontal Scrollable Class Filter Bar */}
            {uniqueClassesWithDebts.length > 0 && (
              <div className="flex gap-2 overflow-x-auto pb-3 border-b border-neutral-100 dark:border-neutral-800/60 scrollbar-thin scrollbar-thumb-neutral-200 dark:scrollbar-thumb-neutral-800">
                <button
                  onClick={() => setSelectedClassFilter("")}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                    selectedClassFilter === ""
                      ? "bg-blue-600 text-white shadow-md shadow-blue-500/10"
                      : "bg-neutral-100 hover:bg-neutral-200 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400"
                  }`}
                >
                  Tất cả lớp ({billingList.length})
                </button>
                {uniqueClassesWithDebts.map((cls) => (
                  <button
                    key={cls.classId}
                    onClick={() => setSelectedClassFilter(cls.classId)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                      selectedClassFilter === cls.classId
                        ? "bg-blue-600 text-white shadow-md shadow-blue-500/10"
                        : "bg-neutral-100 hover:bg-neutral-200 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400"
                    }`}
                  >
                    {cls.className} ({cls.debtCount})
                  </button>
                ))}
              </div>
            )}

            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[800px]">
                  <thead>
                    <tr className="border-b border-neutral-200 dark:border-neutral-800 text-xs font-bold text-neutral-500 uppercase tracking-wider">
                      <th className="pb-3">Học sinh</th>
                      <th className="pb-3">Lớp học</th>
                      <th className="pb-3 text-right">Số nợ</th>
                      <th className="pb-3">Hạn đóng</th>
                      <th className="pb-3 text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800 text-sm text-neutral-700 dark:text-neutral-300">
                    {filteredBills.map((bill) => {
                      const overdue = isOverdue(bill.dueDate);
                      return (
                        <tr key={bill.enrollmentId} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/10">
                          <td className="py-3.5">
                            <p className="font-bold text-neutral-900 dark:text-white">{bill.fullName}</p>
                            <span className="text-xs font-mono text-neutral-400">{bill.studentId}</span>
                          </td>
                          <td className="py-3.5">
                            <span className="px-2 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-xs font-medium text-neutral-600 dark:text-neutral-400">
                              {bill.classId}
                            </span>
                            <p className="text-xs text-neutral-500 font-medium mt-0.5 truncate max-w-[12rem]">{bill.className}</p>
                          </td>
                          <td className="py-3.5 text-right font-bold text-rose-600 dark:text-rose-400">
                            {bill.debt.toLocaleString("vi-VN")} đ
                          </td>
                          <td className="py-3.5">
                            {bill.dueDate ? (
                              <div className="flex items-center gap-1.5">
                                <Clock className={`w-3.5 h-3.5 ${overdue ? "text-rose-500 animate-pulse" : "text-neutral-400"}`} />
                                <span className={`font-medium ${overdue ? "text-rose-600 dark:text-rose-400 font-bold" : ""}`}>
                                  {bill.dueDate}
                                </span>
                                {overdue && (
                                  <span className="px-1.5 py-0.5 rounded-full bg-rose-500/15 text-rose-600 dark:text-rose-400 text-[10px] font-extrabold uppercase">Quá Hạn</span>
                                )}
                              </div>
                            ) : (
                              <span className="text-neutral-400 italic">Chưa set</span>
                            )}
                          </td>
                          <td className="py-3.5 text-right space-x-2">
                            <button
                              onClick={() => handleCashCheckout(bill.studentId, bill.classId, bill.debt)}
                              disabled={submitting}
                              className="px-3.5 py-1.5 rounded-lg bg-green-600 hover:bg-green-700 disabled:bg-green-600/50 text-white font-bold text-xs shadow-sm hover:shadow transition-all hover-lift cursor-pointer"
                            >
                              Check out (Tiền mặt)
                            </button>
                            <button
                              onClick={() => handleOpenCollectModal(bill.studentId, bill.classId, bill.debt)}
                              className="px-3.5 py-1.5 rounded-lg bg-blue-500 hover:bg-blue-600 text-white font-bold text-xs shadow-sm hover:shadow transition-all hover-lift cursor-pointer"
                            >
                              Thu tiền
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                    {filteredBills.length === 0 && (
                      <tr>
                        <td colSpan={5} className="py-12 text-center text-neutral-400 font-medium">
                          <CheckCircle2 className="w-10 h-10 text-green-500 mx-auto mb-2" />
                          Không có học sinh nợ học phí!
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

      {/* TRANSACTION MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-6 shadow-2xl animate-scale-up space-y-6">
            <div className="flex justify-between items-center border-b border-neutral-100 dark:border-neutral-800/50 pb-4">
              <h3 className="text-lg font-bold text-neutral-900 dark:text-white flex items-center gap-1.5">
                <CreditCard className="w-5 h-5 text-blue-500" /> Biểu Mẫu Ghi Nhận Dòng Tiền
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 hover:text-neutral-600 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveTransaction} className="space-y-4">
              {/* Student Selector */}
              <div>
                <label className="block text-xs font-bold text-neutral-500 uppercase mb-1">Học Viên</label>
                {isFromList ? (
                  <div className="px-3 py-2 border rounded-xl bg-neutral-100 dark:bg-neutral-800 border-neutral-300 dark:border-neutral-750 text-sm font-bold">
                    {form.studentId}
                  </div>
                ) : (
                  <select
                    required
                    value={form.studentId}
                    onChange={(e) => handleStudentSelect(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl bg-neutral-50 dark:bg-neutral-950 border-neutral-300 dark:border-neutral-700 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none font-bold"
                  >
                    <option value="">-- Chọn học viên --</option>
                    {studentsList.map((s: any) => (
                      <option key={s.studentId} value={s.studentId}>
                        {s.fullName} ({s.studentId})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Class Selector */}
              <div>
                <label className="block text-xs font-bold text-neutral-500 uppercase mb-1">Lớp Học</label>
                {isFromList ? (
                  <div className="px-3 py-2 border rounded-xl bg-neutral-100 dark:bg-neutral-800 border-neutral-300 dark:border-neutral-750 text-sm font-bold">
                    {form.classId}
                  </div>
                ) : loadingClasses ? (
                  <div className="flex items-center gap-2 py-2 text-xs text-neutral-500">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Đang tìm lớp học đã ghi danh...
                  </div>
                ) : (
                  <select
                    required
                    disabled={!form.studentId}
                    value={form.classId}
                    onChange={(e) => {
                      const cid = e.target.value;
                      const matched = enrolledClasses.find(c => c.classId === cid);
                      setForm(prev => ({ 
                        ...prev, 
                        classId: cid, 
                        amount: matched ? matched.classDebt.toString() : prev.amount 
                      }));
                    }}
                    className="w-full px-3 py-2 border rounded-xl bg-neutral-50 disabled:bg-neutral-100 dark:bg-neutral-950 border-neutral-300 dark:border-neutral-700 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none font-bold"
                  >
                    <option value="">-- Chọn lớp học --</option>
                    {enrolledClasses.map((c) => (
                      <option key={c.classId} value={c.classId}>
                        {c.className} ({c.classId}) - Nợ: {c.classDebt.toLocaleString("vi-VN")}đ
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-neutral-500 uppercase mb-1">Loại Giao Dịch</label>
                  <select
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value as any })}
                    className="w-full px-3 py-2 border rounded-xl bg-neutral-50 dark:bg-neutral-950 border-neutral-300 dark:border-neutral-700 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="Thu">Thu tiền</option>
                    <option value="Hoàn">Hoàn phí</option>
                    <option value="Chuyển">Chuyển phí</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutral-500 uppercase mb-1">Ngày Giao Dịch</label>
                  <input
                    type="date"
                    required
                    value={form.date}
                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl bg-neutral-50 dark:bg-neutral-950 border-neutral-300 dark:border-neutral-700 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-500 uppercase mb-1">Số Tiền (VND)</label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-neutral-400 text-sm font-bold">đ</span>
                  <input
                    type="number"
                    min="1"
                    required
                    value={form.amount}
                    onChange={(e) => setForm({ ...form, amount: e.target.value })}
                    placeholder="Ví dụ: 1000000"
                    className="w-full pl-7 pr-3 py-2 border rounded-xl bg-neutral-50 dark:bg-neutral-950 border-neutral-300 dark:border-neutral-700 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none font-bold"
                  />
                </div>
              </div>

              {/* VietQR Dynamic Payment Display */}
              {form.type === "Thu" && form.studentId && form.classId && parseFloat(form.amount) > 0 && (
                <div className="p-4 rounded-2xl border border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-950/20 flex flex-col items-center justify-center space-y-2 animate-fade-in">
                  <span className="text-[10px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider">Mã thanh toán VietQR (Quét để nộp phí)</span>
                  <div className="w-44 h-44 bg-white p-2 rounded-2xl shadow-sm border border-neutral-200 flex items-center justify-center overflow-hidden">
                    <img 
                      src={`https://img.vietqr.io/image/MB-0385717738-compact2.png?amount=${form.amount}&addInfo=UPGRID%20${form.studentId}%20${form.classId}&accountName=NGUYEN%20TUAN%20ANH`} 
                      alt="VietQR Payment Code"
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <span className="text-[10px] text-neutral-500 dark:text-neutral-400 text-center leading-relaxed">
                    Ngân hàng: <strong>MBBank</strong><br />
                    Số TK: <strong>0385717738</strong> | Tên: <strong>NGUYEN TUAN ANH</strong><br />
                    Nội dung: <strong className="font-mono text-blue-600 dark:text-blue-400">UPGRID {form.studentId} {form.classId}</strong>
                  </span>
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <DollarSign className="w-4.5 h-4.5" />}
                Lưu Giao Dịch
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
