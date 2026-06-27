"use client";

import React, { useState, useEffect } from "react";
import { requestGas } from "@/utils/apiClient";
import { Student, AttendanceRecord, Class } from "@/types/lms";
import { 
  Sparkles, DollarSign, BookOpen, Loader2, User, Clock, 
  Grid, ListTodo, Check, X, Save, CheckCircle2, AlertCircle, Users, Award
} from "lucide-react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";

interface TeacherAttendanceProps {
  classId: string;
  activeStudents: Student[];
  attendanceLogs: AttendanceRecord[];
  payroll: any;
  loadingPayroll: boolean;
  mutateAttendanceLogs: () => void;
  activeClass: Class | null;
  avgAttendanceRate: number;
  totalSessionsTaught: number;
  avgClassGrade: number;
  overallProgressPercent: number;
  activePanel: "attendance_overview" | "attendance_take" | "attendance_matrix";
  onEnterGrading: (studentId: string) => void;
}

export default function TeacherAttendance({
  classId,
  activeStudents,
  attendanceLogs,
  payroll,
  loadingPayroll,
  mutateAttendanceLogs,
  activeClass,
  avgAttendanceRate,
  totalSessionsTaught,
  avgClassGrade,
  overallProgressPercent,
  activePanel,
  onEnterGrading
}: TeacherAttendanceProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  // Take Attendance states
  const [sessionNumber, setSessionNumber] = useState<number>(1);
  const [attendanceDate, setAttendanceDate] = useState<string>(
    new Date().toLocaleDateString("sv-SE")
  );
  const [attendanceRecords, setAttendanceRecords] = useState<Record<string, "P" | "V">>({});
  const [submittingAttendance, setSubmittingAttendance] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const showMessage = (type: "success" | "error", text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  // Reset attendance records and session number when logs or classId changes
  useEffect(() => {
    if (attendanceLogs.length > 0) {
      const maxSess = Math.max(...attendanceLogs.map(l => l.sessionNumber), 0);
      setSessionNumber(maxSess + 1);
    } else {
      setSessionNumber(1);
    }
    setAttendanceRecords({});
  }, [classId, attendanceLogs]);

  const handleMarkAllPresent = () => {
    const records: Record<string, "P"> = {};
    activeStudents.forEach(std => {
      records[std.studentId] = "P";
    });
    setAttendanceRecords(records);
  };

  const handleSaveAttendance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (activeStudents.length === 0) return;
    setSubmittingAttendance(true);
    try {
      const recordsToSave: Record<string, string> = {};
      activeStudents.forEach(std => {
        recordsToSave[std.studentId] = attendanceRecords[std.studentId] || "P";
      });

      await requestGas("markAttendance", {
        method: "POST",
        body: {
          classId,
          sessionNumber,
          date: attendanceDate,
          records: recordsToSave
        }
      });

      showMessage("success", `Điểm danh Buổi ${sessionNumber} thành công!`);
      mutateAttendanceLogs();
    } catch (err: any) {
      showMessage("error", err.message || "Lỗi lưu điểm danh.");
    } finally {
      setSubmittingAttendance(false);
    }
  };

  const uniqueSessions = Array.from(new Set(attendanceLogs.map(log => log.sessionNumber))).sort((a, b) => a - b);

  return (
    <div className="space-y-6 animate-fade-in text-xs font-sans">
      
      {/* 1. Header and Notifications */}
      <div className="flex justify-between items-center border-b border-neutral-200 dark:border-neutral-800 pb-3">
        <div>
          <h2 className="text-base font-extrabold text-neutral-900 dark:text-white uppercase tracking-wide flex items-center gap-2">
            <ListTodo className="w-5 h-5 text-blue-600" /> Quản lý Chuyên cần & Điểm danh Lớp học
          </h2>
          <p className="text-[11px] text-neutral-500 mt-1">
            Thực hiện điểm danh và theo dõi bảng chuyên cần tổng hợp của lớp học.
          </p>
        </div>
      </div>

      {message && (
        <div className={`p-4 rounded-xl flex items-center gap-3 border text-xs font-bold ${
          message.type === "success" 
            ? "bg-green-500/10 border-green-500/20 text-green-600 dark:text-green-400" 
            : "bg-red-500/10 border-red-500/20 text-red-600 dark:text-red-400"
        }`}>
          {message.type === "success" ? <CheckCircle2 className="w-5 h-5 flex-shrink-0" /> : <AlertCircle className="w-5 h-5 flex-shrink-0" />}
          <span>{message.text}</span>
        </div>
      )}

      {/* 2. Top Row - 3 Horizontal Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Card 1: THÔNG TIN LỚP */}
        {activeClass ? (
          <div className="p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm flex flex-col justify-between min-h-[140px]">
            <h3 className="font-bold text-neutral-900 dark:text-white flex items-center gap-2 border-b border-neutral-100 dark:border-neutral-800/80 pb-2 text-[10px] uppercase tracking-wider">
              <BookOpen className="w-4 h-4 text-blue-500" /> Thông Tin Lớp
            </h3>
            <div className="grid grid-cols-2 gap-2 mt-2">
              <div>
                <span className="text-[9px] font-bold text-neutral-400 uppercase block">Tên lớp</span>
                <span className="font-bold text-neutral-800 dark:text-neutral-200">{activeClass.className}</span>
              </div>
              <div>
                <span className="text-[9px] font-bold text-neutral-400 uppercase block">Lịch học</span>
                <span className="text-neutral-700 dark:text-neutral-300 font-semibold">{activeClass.schedule}</span>
              </div>
            </div>
            <div className="mt-3">
              <div className="flex justify-between items-center text-[9px] font-bold text-neutral-400 uppercase mb-1">
                <span>Chương trình dạy học</span>
                <span className="text-neutral-700 dark:text-neutral-300">{overallProgressPercent}%</span>
              </div>
              <div className="w-full bg-neutral-100 dark:bg-neutral-800 h-1.5 rounded-full overflow-hidden">
                <div className="bg-green-500 h-full rounded-full" style={{ width: `${overallProgressPercent}%` }} />
              </div>
            </div>
          </div>
        ) : (
          <div className="p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm flex items-center justify-center min-h-[140px] text-neutral-400">
            Không tìm thấy thông tin lớp
          </div>
        )}

        {/* Card 2: THỐNG KÊ LỚP HỌC (Overview stats) */}
        <div className="p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm flex flex-col justify-between min-h-[140px]">
          <h3 className="font-bold text-neutral-900 dark:text-white flex items-center gap-2 border-b border-neutral-100 dark:border-neutral-800/80 pb-2 text-[10px] uppercase tracking-wider">
            <Sparkles className="w-4 h-4 text-blue-500" /> Thống Kê Overview
          </h3>
          <div className="grid grid-cols-2 gap-4 mt-2">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
                <Users className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[9px] font-bold text-neutral-400 uppercase block">Học sinh</span>
                <span className="text-sm font-extrabold text-neutral-800 dark:text-neutral-200">{activeStudents.length}</span>
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-lg bg-green-500/10 text-green-600 dark:text-green-400">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[9px] font-bold text-neutral-400 uppercase block">Số buổi dạy</span>
                <span className="text-sm font-extrabold text-neutral-800 dark:text-neutral-200">{totalSessionsTaught}</span>
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-600">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[9px] font-bold text-neutral-400 uppercase block">Chuyên cần</span>
                <span className="text-sm font-extrabold text-neutral-800 dark:text-neutral-200">{avgAttendanceRate}%</span>
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-450">
                <Award className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[9px] font-bold text-neutral-400 uppercase block">Điểm trung bình</span>
                <span className="text-sm font-extrabold text-neutral-800 dark:text-neutral-200">{avgClassGrade}/10</span>
              </div>
            </div>
          </div>
        </div>

        {/* Card 3: THU NHẬP TẠM TÍNH */}
        {loadingPayroll ? (
          <div className="p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm flex items-center justify-center min-h-[140px]">
            <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
          </div>
        ) : payroll ? (
          <div className="p-5 rounded-2xl bg-gradient-to-br from-blue-600/10 to-cyan-500/10 border border-blue-500/20 shadow-sm flex flex-col justify-between min-h-[140px]">
            <h3 className="font-bold text-blue-800 dark:text-blue-300 flex items-center gap-1.5 border-b border-blue-500/20 pb-1.5 text-[10px] uppercase tracking-wider">
              <DollarSign className="w-4.5 h-4.5" /> Thu Nhập Tạm Tính
            </h3>
            <div className="grid grid-cols-3 gap-2.5 mt-2.5">
              <div className="bg-white/80 dark:bg-neutral-900/80 p-2 rounded-xl border border-neutral-150/60 dark:border-neutral-800/80 text-center">
                <span className="text-[8px] font-bold text-neutral-400 uppercase tracking-wider block">Đã nhận</span>
                <span className="text-xs font-extrabold text-green-600 dark:text-green-400 block mt-0.5">{payroll.paidSalary?.toLocaleString("vi-VN")}đ</span>
                <span className="text-[8px] text-neutral-400 font-semibold">({payroll.paidCount || 0} buổi)</span>
              </div>
              <div className="bg-white/80 dark:bg-neutral-900/80 p-2 rounded-xl border border-neutral-150/60 dark:border-neutral-800/80 text-center">
                <span className="text-[8px] font-bold text-neutral-400 tracking-wider uppercase block font-sans">Đợi TT</span>
                <span className="text-xs font-extrabold text-blue-600 dark:text-blue-450 block mt-0.5">{payroll.approvedSalary?.toLocaleString("vi-VN")}đ</span>
                <span className="text-[8px] text-neutral-400 font-semibold">({payroll.approvedCount || 0} buổi)</span>
              </div>
              <div className="bg-white/80 dark:bg-neutral-900/80 p-2 rounded-xl border border-neutral-150/60 dark:border-neutral-800/80 text-center">
                <span className="text-[8px] font-bold text-neutral-400 tracking-wider uppercase block">Chờ duyệt</span>
                <span className="text-xs font-extrabold text-amber-500 block mt-0.5">{payroll.pendingSalary?.toLocaleString("vi-VN")}đ</span>
                <span className="text-[8px] text-neutral-400 font-semibold">({payroll.pendingCount || 0} buổi)</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm flex items-center justify-center min-h-[140px] text-neutral-400">
            Không có dữ liệu thu nhập
          </div>
        )}

      </div>

      {/* 3. Bottom Row - Two Columns: Take Attendance Form on Left, Matrix Table on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column (Attendance Form) - lg:col-span-5 */}
        <div className="lg:col-span-5 space-y-6">
          <div className="p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-100 dark:border-neutral-800/50 pb-4">
              <h3 className="font-bold text-neutral-900 dark:text-white flex items-center gap-2 text-[11px] uppercase tracking-wider">
                <ListTodo className="w-5 h-5 text-blue-500" /> Điểm danh buổi học mới
              </h3>
              <button
                type="button"
                onClick={handleMarkAllPresent}
                className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
              >
                Tất cả có mặt
              </button>
            </div>

            <form onSubmit={handleSaveAttendance} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-neutral-500 uppercase mb-1">Buổi thứ mấy?</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={sessionNumber}
                    onChange={(e) => setSessionNumber(parseInt(e.target.value) || 1)}
                    className="w-full px-3 py-2 border rounded-xl bg-neutral-50 dark:bg-neutral-955 border-neutral-300 dark:border-neutral-700 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutral-500 uppercase mb-1">Ngày học</label>
                  <input
                    type="date"
                    required
                    value={attendanceDate}
                    onChange={(e) => setAttendanceDate(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl bg-neutral-50 dark:bg-neutral-955 border-neutral-300 dark:border-neutral-700 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Attendance Checklist */}
              <div className="divide-y divide-neutral-100 dark:divide-neutral-800/60 max-h-[380px] overflow-y-auto pr-1">
                {activeStudents.map((std) => {
                  const status = attendanceRecords[std.studentId] || "P";
                  return (
                    <div key={std.studentId} className="py-2.5 flex items-center justify-between">
                      <div className="space-y-0.5">
                        <p className="font-bold text-xs text-neutral-900 dark:text-white">{std.fullName}</p>
                        <p className="text-[10px] font-mono text-neutral-500">{std.studentId}</p>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setAttendanceRecords(prev => ({ ...prev, [std.studentId]: "P" }))}
                          className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all flex items-center gap-1 cursor-pointer ${
                            status === "P"
                              ? "bg-green-500 text-white shadow-sm font-extrabold"
                              : "bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400 hover:bg-neutral-200"
                          }`}
                        >
                          <Check className="w-3.5 h-3.5" /> Có mặt
                        </button>
                        <button
                          type="button"
                          onClick={() => setAttendanceRecords(prev => ({ ...prev, [std.studentId]: "V" }))}
                          className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all flex items-center gap-1 cursor-pointer ${
                            status === "V"
                              ? "bg-red-500 text-white shadow-sm font-extrabold"
                              : "bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400 hover:bg-neutral-200"
                          }`}
                        >
                          <X className="w-3.5 h-3.5" /> Vắng mặt
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              <button
                type="submit"
                disabled={submittingAttendance || activeStudents.length === 0}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {submittingAttendance ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4.5 h-4.5" />}
                Lưu và Chốt Buổi Điểm Danh
              </button>
            </form>
          </div>
        </div>

        {/* Right Column (Matrix Table) - lg:col-span-7 */}
        <div className="lg:col-span-7 space-y-6">
          <div className="p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm space-y-4">
            <h3 className="font-bold text-neutral-900 dark:text-white flex items-center gap-2 text-[11px] uppercase tracking-wider border-b border-neutral-100 dark:border-neutral-800 pb-3">
              <Grid className="w-5 h-5 text-blue-500" /> Bảng chuyên cần chi tiết lớp học
            </h3>

            {attendanceLogs.length === 0 ? (
              <p className="text-neutral-400 italic text-center py-12">Chưa có dữ liệu điểm danh cho lớp này.</p>
            ) : (
              <div className="overflow-x-auto w-full">
                <table className="w-full text-left border-collapse text-xs min-w-[500px]">
                  <thead>
                    <tr className="border-b border-neutral-200 dark:border-neutral-800 font-bold text-neutral-500 uppercase tracking-wider">
                      <th className="pb-3 text-sm">Học sinh</th>
                      {uniqueSessions.map((sNum) => (
                        <th key={sNum} className="pb-3 text-center font-bold">Buổi {sNum}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800 text-neutral-700 dark:text-neutral-300 font-semibold">
                    {activeStudents.map((std) => (
                      <tr key={std.studentId} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/10">
                        <td className="py-3">
                          <p className="font-bold text-neutral-900 dark:text-white text-xs">{std.fullName}</p>
                          <span className="text-[9px] text-neutral-400 font-mono font-normal">{std.studentId}</span>
                        </td>
                        {uniqueSessions.map((sNum) => {
                          const log = attendanceLogs.find(
                            (l) => l.studentId === std.studentId && l.sessionNumber === sNum
                          );
                          return (
                            <td key={sNum} className="py-3 text-center">
                              {log ? (
                                log.status === "P" ? (
                                  <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-green-500/10 text-green-600">
                                    <Check className="w-3 h-3" />
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-rose-500/10 text-rose-600">
                                    <X className="w-3 h-3" />
                                  </span>
                                )
                              ) : (
                                <span className="text-neutral-300 dark:text-neutral-750 font-normal">—</span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
