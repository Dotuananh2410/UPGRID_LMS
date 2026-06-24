"use client";

import React, { useState } from "react";
import useSWR from "swr";
import { requestGas } from "@/utils/apiClient";
import { TeacherPayroll } from "@/types/lms";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { 
  Calendar, Clock, DollarSign, Loader2, UserCheck, 
  Wallet, CheckCircle2, AlertCircle, X, ChevronRight, HelpCircle
} from "lucide-react";

export default function TeacherPayrollPage() {
  const { user } = useAuth();
  const router = useRouter();

  // Selected Month (YYYY-MM)
  const [selectedMonth, setSelectedMonth] = useState(
    new Date().toLocaleDateString("sv-SE").substring(0, 7)
  );

  // Modal States
  const [selectedTeacherId, setSelectedTeacherId] = useState<string | null>(null);
  const [isDisbursing, setIsDisbursing] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Redirect if not ADMIN or QUAN_SINH
  if (user && user.role !== "ADMIN" && user.role !== "QUAN_SINH") {
    router.push(user.role === "GIAO_VIEN" ? "/teacher" : "/student");
    return null;
  }

  // Fetch Payroll Data
  const { data: payrollList = [], error, mutate } = useSWR<TeacherPayroll[]>(
    `getPayrollDashboard/${selectedMonth}`,
    () => requestGas<TeacherPayroll[]>(`getPayrollDashboard`, {
      method: "GET",
      body: { month: selectedMonth }
    })
  );

  // Fetch Teacher Detailed Payroll for Modal
  const { data: teacherDetail, isValidating: loadingDetail } = useSWR<TeacherPayroll>(
    selectedTeacherId ? `getTeacherPayroll/${selectedTeacherId}/${selectedMonth}` : null,
    () => requestGas<TeacherPayroll>(`getTeacherPayroll`, {
      method: "GET",
      body: { teacherId: selectedTeacherId, month: selectedMonth }
    })
  );

  const showMessage = (type: "success" | "error", text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  // Disburse salary (Mark sessions as paid)
  const handleDisburse = async (teacherId: string, fullName: string) => {
    if (!window.confirm(`Xác nhận giải ngân (đánh dấu đã thanh toán) tiền lương trong tháng ${selectedMonth} cho giáo viên: ${fullName}?`)) {
      return;
    }
    setIsDisbursing(teacherId);
    try {
      await requestGas("disburseTeacherSalary", {
        method: "POST",
        body: { teacherId, month: selectedMonth }
      });
      showMessage("success", `Giải ngân thành công lương tháng ${selectedMonth} cho giáo viên: ${fullName}!`);
      mutate(); // Refresh the list
    } catch (err: any) {
      showMessage("error", err.message || "Lỗi giải ngân lương");
    } finally {
      setIsDisbursing(null);
    }
  };

  const loading = !error && !payrollList.length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 flex flex-col space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-neutral-200 dark:border-neutral-800 pb-5">
        <div>
          <h1 className="text-3xl font-extrabold text-neutral-900 dark:text-white tracking-tight">
            Bảng Lương Giáo Viên
          </h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
            Tính toán lương thực nhận của giáo viên bằng 70% tổng học phí thực thu của học viên đi học thực tế.
          </p>
        </div>

        {/* Month Picker */}
        <div className="mt-4 md:mt-0 flex items-center gap-3">
          <label className="text-sm font-bold text-neutral-600 dark:text-neutral-400 flex items-center gap-1.5">
            <Calendar className="w-4.5 h-4.5 text-blue-500" />
            Chọn tháng lương:
          </label>
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="px-3.5 py-2 border rounded-xl bg-white dark:bg-neutral-900 border-neutral-300 dark:border-neutral-700 text-sm font-bold focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
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
          <p className="mt-4 text-sm font-medium text-neutral-500">Đang tổng hợp thông tin lương giáo viên...</p>
        </div>
      ) : (
        <div className="space-y-6 animate-fade-in">
          
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Total Paid / Disbursed */}
            <div className="p-6 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Tổng Lương Đã Giải Ngân</p>
                <p className="text-3xl font-extrabold text-green-600 dark:text-green-400">
                  {payrollList.reduce((sum, p) => sum + p.paidSalary, 0).toLocaleString("vi-VN")} đ
                </p>
                <p className="text-xs text-neutral-500">Tiền đã giải ngân thực tế trong tháng</p>
              </div>
              <div className="p-4 rounded-xl bg-green-500/10 text-green-600"><Wallet className="w-6 h-6" /></div>
            </div>

            {/* Approved and Unpaid (Settlement pending) */}
            <div className="p-6 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Tổng Lương Chờ Thanh Toán</p>
                <p className="text-3xl font-extrabold text-blue-600 dark:text-blue-400">
                  {payrollList.reduce((sum, p) => sum + p.approvedSalary, 0).toLocaleString("vi-VN")} đ
                </p>
                <p className="text-xs text-neutral-500">Buổi dạy đã duyệt, chờ ấn nút giải ngân</p>
              </div>
              <div className="p-4 rounded-xl bg-blue-500/10 text-blue-600"><DollarSign className="w-6 h-6" /></div>
            </div>

            {/* Pending Approvals */}
            <div className="p-6 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Tổng Lương Chờ Duyệt</p>
                <p className="text-3xl font-extrabold text-amber-500">
                  {payrollList.reduce((sum, p) => sum + p.pendingSalary, 0).toLocaleString("vi-VN")} đ
                </p>
                <p className="text-xs text-neutral-500">Các ca điểm danh đang chờ Admin phê duyệt</p>
              </div>
              <div className="p-4 rounded-xl bg-amber-500/10 text-amber-500"><Clock className="w-6 h-6" /></div>
            </div>
          </div>

          {/* Detailed payroll table */}
          <div className="p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm overflow-x-auto">
            <h3 className="text-lg font-bold text-neutral-900 dark:text-white mb-4">
              Bảng Tổng Hợp Chi Tiết Lương Tháng {selectedMonth}
            </h3>
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="border-b border-neutral-200 dark:border-neutral-800 text-xs font-bold text-neutral-500 uppercase tracking-wider">
                  <th className="pb-3">Giáo viên</th>
                  <th className="pb-3 text-right">Cơ chế tính</th>
                  <th className="pb-3 text-center">Buổi Lên Lớp</th>
                  <th className="pb-3 text-right">Lương Chờ Duyệt</th>
                  <th className="pb-3 text-right">Lương Đã Giải Ngân</th>
                  <th className="pb-3 text-right">Lương Chờ Thanh Toán</th>
                  <th className="pb-3 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800 text-sm text-neutral-700 dark:text-neutral-300">
                {payrollList.map((p) => (
                  <tr key={p.teacherId} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/10">
                    <td className="py-4">
                      <p className="font-bold text-neutral-900 dark:text-white">{p.fullName}</p>
                      <span className="text-xs font-mono text-neutral-400">{p.teacherId}</span>
                    </td>
                    <td className="py-4 text-right font-bold text-neutral-500">
                      70% học phí
                    </td>
                    <td className="py-4 text-center">
                      <span className="inline-block px-2.5 py-1 rounded-lg bg-neutral-100 dark:bg-neutral-850 font-extrabold text-xs">
                        {p.totalSessions} buổi
                      </span>
                    </td>
                    <td className="py-4 text-right font-medium text-amber-600">
                      {p.pendingSalary.toLocaleString("vi-VN")} đ
                    </td>
                    <td className="py-4 text-right font-bold text-green-600 dark:text-green-400">
                      {p.paidSalary.toLocaleString("vi-VN")} đ
                    </td>
                    <td className="py-4 text-right font-bold text-blue-600 dark:text-blue-400 text-base">
                      {p.approvedSalary.toLocaleString("vi-VN")} đ
                    </td>
                    <td className="py-4 text-right space-x-2">
                      <button
                        onClick={() => handleDisburse(p.teacherId, p.fullName || p.teacherId)}
                        disabled={p.approvedSalary <= 0 || isDisbursing === p.teacherId}
                        className="px-3.5 py-1.5 rounded-lg bg-green-600 hover:bg-green-700 disabled:bg-green-800/20 text-white font-bold text-xs shadow-sm hover:shadow transition-all disabled:cursor-not-allowed cursor-pointer inline-flex items-center gap-1"
                      >
                        {isDisbursing === p.teacherId ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Wallet className="w-3.5 h-3.5" />}
                        Giải ngân
                      </button>
                      <button
                        onClick={() => setSelectedTeacherId(p.teacherId)}
                        className="px-3.5 py-1.5 rounded-lg bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 font-bold text-xs shadow-sm hover:shadow transition-all cursor-pointer"
                      >
                        Chi tiết
                      </button>
                    </td>
                  </tr>
                ))}
                {payrollList.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-neutral-400 font-medium">
                      Chưa có giáo viên nào trên hệ thống.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* DETAIL SESSIONS POPUP MODAL */}
      {selectedTeacherId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-4xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-6 shadow-2xl animate-scale-up space-y-6 flex flex-col max-h-[85vh]">
            <div className="flex justify-between items-center border-b border-neutral-100 dark:border-neutral-800 pb-4 flex-shrink-0">
              <div>
                <h3 className="text-xl font-bold text-neutral-900 dark:text-white">
                  Bảng Kê Chi Tiết Buổi Dạy & Lương
                </h3>
                <p className="text-sm text-neutral-400 mt-0.5">
                  Giáo viên: <strong>{payrollList.find(p => p.teacherId === selectedTeacherId)?.fullName}</strong> | Tháng: <strong>{selectedMonth}</strong>
                </p>
              </div>
              <button 
                onClick={() => setSelectedTeacherId(null)}
                className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 hover:text-neutral-600 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {loadingDetail ? (
              <div className="py-16 flex flex-col items-center justify-center flex-grow">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                <p className="mt-2 text-sm text-neutral-500 font-medium">Đang tải bảng kê chi tiết...</p>
              </div>
            ) : !teacherDetail || !teacherDetail.sessions || teacherDetail.sessions.length === 0 ? (
              <div className="py-16 text-center text-neutral-400 font-medium flex-grow">
                Không ghi nhận buổi học nào của giáo viên trong tháng này.
              </div>
            ) : (
              <div className="overflow-y-auto flex-grow pr-1">
                <table className="w-full text-left border-collapse text-xs min-w-[800px]">
                  <thead>
                    <tr className="border-b border-neutral-200 dark:border-neutral-800 font-bold text-neutral-500 uppercase tracking-wider">
                      <th className="pb-3 text-sm">Lớp học</th>
                      <th className="pb-3 text-center">Buổi thứ</th>
                      <th className="pb-3">Ngày dạy</th>
                      <th className="pb-3 text-center">Học viên có mặt</th>
                      <th className="pb-3 text-right">Đơn giá học phí</th>
                      <th className="pb-3 text-right">Tổng học phí thu</th>
                      <th className="pb-3 text-right">Lương thực nhận (70%)</th>
                      <th className="pb-3 text-center">Phê duyệt</th>
                      <th className="pb-3 text-center">Giải ngân</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800 font-medium text-neutral-700 dark:text-neutral-300">
                    {teacherDetail.sessions.map((sess: any, index: number) => {
                      const isApproved = sess.status === "Đã duyệt";
                      const isPending = sess.status === "Chờ duyệt";
                      const isPaid = sess.paymentStatus === "Đã thanh toán";
                      
                      return (
                        <tr key={index} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/10">
                          <td className="py-3">
                            <p className="font-bold text-sm text-neutral-900 dark:text-white">{sess.className}</p>
                            <span className="text-[10px] font-mono text-neutral-400">{sess.classId}</span>
                          </td>
                          <td className="py-3 text-center text-sm font-bold">
                            B.{sess.sessionNumber}
                          </td>
                          <td className="py-3 font-mono font-bold text-neutral-500">
                            {sess.date}
                          </td>
                          <td className="py-3 text-center text-sm font-extrabold text-blue-600 dark:text-blue-400">
                            {sess.presentCount} HS
                          </td>
                          <td className="py-3 text-right">
                            {sess.tuitionRate.toLocaleString("vi-VN")} đ
                          </td>
                          <td className="py-3 text-right text-neutral-500">
                            {sess.totalCollected.toLocaleString("vi-VN")} đ
                          </td>
                          <td className="py-3 text-right text-sm font-extrabold text-green-600 dark:text-green-400">
                            {sess.teacherShare.toLocaleString("vi-VN")} đ
                          </td>
                          <td className="py-3 text-center">
                            <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              isApproved 
                                ? "bg-green-500/10 text-green-600 dark:text-green-400" 
                                : isPending
                                  ? "bg-amber-500/10 text-amber-600"
                                  : "bg-rose-500/10 text-rose-600"
                            }`}>
                              {sess.status}
                            </span>
                          </td>
                          <td className="py-3 text-center">
                            <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              isPaid 
                                ? "bg-green-500/10 text-green-600 dark:text-green-400" 
                                : "bg-neutral-100 dark:bg-neutral-800 text-neutral-500"
                            }`}>
                              {sess.paymentStatus}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            <div className="border-t border-neutral-100 dark:border-neutral-800 pt-4 flex justify-between items-center flex-shrink-0 text-sm">
              <span className="text-neutral-500">
                Tổng lương tạm tính (Duyệt + Chờ): <strong className="text-neutral-850 dark:text-neutral-200">{teacherDetail ? (teacherDetail.approvedSalary + teacherDetail.pendingSalary + teacherDetail.paidSalary).toLocaleString("vi-VN") : 0} đ</strong>
              </span>
              <button
                onClick={() => setSelectedTeacherId(null)}
                className="px-4 py-2 border rounded-xl bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 font-bold transition-all cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
