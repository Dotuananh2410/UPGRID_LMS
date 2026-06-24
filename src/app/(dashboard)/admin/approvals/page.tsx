"use client";

import React, { useState } from "react";
import useSWR from "swr";
import { requestGas } from "@/utils/apiClient";
import { PendingApproval } from "@/types/lms";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { 
  CheckSquare, AlertCircle, CheckCircle2, UserCheck, 
  Calendar, BookOpen, User, Clock, Loader2, ThumbsUp, ThumbsDown, Filter
} from "lucide-react";

export default function ApprovalsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"pending" | "history">("pending");
  const [selectedClassId, setSelectedClassId] = useState<string>("");
  const [submittingIds, setSubmittingIds] = useState<string[]>([]);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Redirect if not ADMIN
  if (user && user.role !== "ADMIN" && user.role !== "QUAN_SINH") {
    router.push(user.role === "GIAO_VIEN" ? "/teacher" : "/student");
    return null;
  }

  // Fetch pending approvals
  const { data: pendingData, error: pendingError, mutate: mutatePending } = useSWR<PendingApproval[]>(
    "getPendingApprovals",
    () => requestGas<PendingApproval[]>("getPendingApprovals")
  );

  // Fetch approval history
  const { data: historyData, error: historyError, mutate: mutateHistory } = useSWR<any[]>(
    activeTab === "history" ? "getApprovalHistory" : null,
    () => requestGas<any[]>("getApprovalHistory")
  );

  // Fetch classes for filtering option completeness
  const { data: classesList = [] } = useSWR<any[]>("getClasses", () =>
    requestGas<any[]>("getClasses")
  );

  const showMessage = (type: "success" | "error", text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  const handleApproveBatch = async (classId: string, sessionNumber: number, status: "Đã duyệt" | "Từ chối") => {
    const actionKey = `${classId}_${sessionNumber}`;
    setSubmittingIds(prev => [...prev, actionKey]);
    try {
      await requestGas("approveAttendanceBatch", {
        method: "POST",
        body: { classId, sessionNumber, status }
      });
      showMessage("success", `${status === "Đã duyệt" ? "Phê duyệt" : "Từ chối"} thành công buổi học số ${sessionNumber} của lớp!`);
      mutatePending();
      if (activeTab === "history") {
        mutateHistory();
      }
    } catch (err: any) {
      showMessage("error", err.message || "Lỗi xử lý phê duyệt");
    } finally {
      setSubmittingIds(prev => prev.filter(id => id !== actionKey));
    }
  };

  const loading = activeTab === "pending" ? (!pendingError && !pendingData) : (!historyError && !historyData);
  const pendingList = pendingData || [];
  const historyList = historyData || [];

  // Filter lists based on selectedClassId
  const filteredPending = pendingList.filter(item => !selectedClassId || item.classId === selectedClassId);
  const filteredHistory = historyList.filter(item => !selectedClassId || item.classId === selectedClassId);

  // Extract unique class options actually present in current lists to make filtering quick
  const activeList = activeTab === "pending" ? pendingList : historyList;
  const uniqueClassIds = Array.from(new Set(activeList.map(item => item.classId)));
  const classOptions = classesList.filter(c => uniqueClassIds.includes(c.classId));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 flex flex-col space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-neutral-200 dark:border-neutral-800 pb-5">
        <div>
          <h1 className="text-3xl font-extrabold text-neutral-900 dark:text-white tracking-tight">
            Xét Duyệt Điểm Danh
          </h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
            Maker-Checker Workflow: Phê duyệt hàng loạt các buổi học vừa được giáo viên điểm danh để chốt tính lương và chuyên cần.
          </p>
        </div>
      </div>

      {/* Tabs and Filters Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        {/* Navigation Tabs */}
        <div className="flex bg-neutral-100 dark:bg-neutral-800 p-1 rounded-xl w-fit">
          <button
            onClick={() => {
              setActiveTab("pending");
              setSelectedClassId("");
            }}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              activeTab === "pending"
                ? "bg-white dark:bg-neutral-900 text-blue-600 dark:text-blue-400 shadow-sm"
                : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
            }`}
          >
            Chờ xét duyệt ({pendingList.length})
          </button>
          <button
            onClick={() => {
              setActiveTab("history");
              setSelectedClassId("");
            }}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              activeTab === "history"
                ? "bg-white dark:bg-neutral-900 text-blue-600 dark:text-blue-400 shadow-sm"
                : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
            }`}
          >
            Lịch sử xét duyệt
          </button>
        </div>

        {/* Filter Dropdown */}
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-neutral-400" />
          <select
            value={selectedClassId}
            onChange={(e) => setSelectedClassId(e.target.value)}
            className="text-sm bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none min-w-[180px] font-medium"
          >
            <option value="">Tất cả lớp học</option>
            {classOptions.map((cls) => (
              <option key={cls.classId} value={cls.classId}>
                [{cls.classId}] {cls.className}
              </option>
            ))}
          </select>
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
          <p className="mt-4 text-sm font-medium text-neutral-500">
            {activeTab === "pending" ? "Đang quét danh sách các ca dạy chờ duyệt..." : "Đang tải lịch sử xét duyệt..."}
          </p>
        </div>
      ) : activeTab === "pending" ? (
        <div className="p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm overflow-x-auto animate-fade-in">
          <h3 className="text-lg font-bold text-neutral-900 dark:text-white mb-4">
            Danh sách buổi học chờ xét duyệt ({filteredPending.length})
          </h3>
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="border-b border-neutral-200 dark:border-neutral-800 text-xs font-bold text-neutral-500 uppercase tracking-wider">
                <th className="pb-3">Lớp học</th>
                <th className="pb-3">Giáo viên dạy</th>
                <th className="pb-3 text-center">Buổi học</th>
                <th className="pb-3">Ngày lên lớp</th>
                <th className="pb-3 text-center">Sĩ số điểm danh</th>
                <th className="pb-3 text-right">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800 text-sm text-neutral-700 dark:text-neutral-300">
              {filteredPending.map((item) => {
                const actionKey = `${item.classId}_${item.sessionNumber}`;
                const isSubmitting = submittingIds.includes(actionKey);

                return (
                  <tr key={actionKey} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/10">
                    <td className="py-4">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold text-xs">
                          {item.classId}
                        </span>
                        <p className="font-bold text-neutral-900 dark:text-white truncate max-w-[15rem]">{item.className}</p>
                      </div>
                    </td>
                    <td className="py-4">
                      <div className="flex items-center gap-1.5">
                        <User className="w-4 h-4 text-neutral-400" />
                        <span className="font-medium text-neutral-800 dark:text-neutral-200">{item.teacherName}</span>
                      </div>
                    </td>
                    <td className="py-4 text-center font-bold text-neutral-900 dark:text-white">
                      Buổi {item.sessionNumber}
                    </td>
                    <td className="py-4 font-mono text-xs">
                      <div className="flex items-center gap-1 text-neutral-500">
                        <Calendar className="w-3.5 h-3.5 text-neutral-400" />
                        {item.date}
                      </div>
                    </td>
                    <td className="py-4 text-center font-bold text-blue-600 dark:text-blue-400">
                      {item.studentCount} học viên
                    </td>
                    <td className="py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleApproveBatch(item.classId, item.sessionNumber, "Từ chối")}
                          disabled={isSubmitting}
                          className="px-3.5 py-1.5 rounded-lg border border-rose-300 dark:border-rose-800/50 hover:bg-rose-500/10 text-rose-600 dark:text-rose-400 font-bold text-xs transition-all hover-lift cursor-pointer flex items-center gap-1"
                        >
                          <ThumbsDown className="w-3.5 h-3.5" />
                          Từ chối
                        </button>
                        <button
                          onClick={() => handleApproveBatch(item.classId, item.sessionNumber, "Đã duyệt")}
                          disabled={isSubmitting}
                          className="px-3.5 py-1.5 rounded-lg bg-green-600 hover:bg-green-700 text-white font-bold text-xs shadow-sm hover:shadow transition-all hover-lift cursor-pointer flex items-center gap-1"
                        >
                          <ThumbsUp className="w-3.5 h-3.5" />
                          Duyệt
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredPending.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-neutral-400 font-medium">
                    <CheckCircle2 className="w-10 h-10 text-green-500 mx-auto mb-2" />
                    Không có buổi dạy nào cần xét duyệt điểm danh!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm overflow-x-auto animate-fade-in">
          <h3 className="text-lg font-bold text-neutral-900 dark:text-white mb-4">
            Lịch sử xét duyệt ({filteredHistory.length})
          </h3>
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="border-b border-neutral-200 dark:border-neutral-800 text-xs font-bold text-neutral-500 uppercase tracking-wider">
                <th className="pb-3">Lớp học</th>
                <th className="pb-3">Giáo viên dạy</th>
                <th className="pb-3 text-center">Buổi học</th>
                <th className="pb-3">Ngày lên lớp</th>
                <th className="pb-3 text-center">Sĩ số điểm danh</th>
                <th className="pb-3 text-right">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800 text-sm text-neutral-700 dark:text-neutral-300">
              {filteredHistory.map((item) => {
                const actionKey = `${item.classId}_${item.sessionNumber}`;
                return (
                  <tr key={actionKey} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/10">
                    <td className="py-4">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold text-xs">
                          {item.classId}
                        </span>
                        <p className="font-bold text-neutral-900 dark:text-white truncate max-w-[15rem]">{item.className}</p>
                      </div>
                    </td>
                    <td className="py-4">
                      <div className="flex items-center gap-1.5">
                        <User className="w-4 h-4 text-neutral-400" />
                        <span className="font-medium text-neutral-800 dark:text-neutral-200">{item.teacherName}</span>
                      </div>
                    </td>
                    <td className="py-4 text-center font-bold text-neutral-900 dark:text-white">
                      Buổi {item.sessionNumber}
                    </td>
                    <td className="py-4 font-mono text-xs">
                      <div className="flex items-center gap-1 text-neutral-500">
                        <Calendar className="w-3.5 h-3.5 text-neutral-400" />
                        {item.date}
                      </div>
                    </td>
                    <td className="py-4 text-center font-bold text-blue-600 dark:text-blue-400">
                      {item.studentCount} học viên
                    </td>
                    <td className="py-4 text-right font-bold">
                      <span className={`px-2.5 py-1 rounded-lg text-xs ${
                        item.status === "Đã duyệt"
                          ? "bg-green-500/10 text-green-600 dark:text-green-400"
                          : "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                      }`}>
                        {item.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
              {filteredHistory.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-neutral-400 font-medium">
                    Không có lịch sử xét duyệt nào phù hợp!
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
