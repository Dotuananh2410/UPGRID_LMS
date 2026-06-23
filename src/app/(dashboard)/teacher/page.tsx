"use client";

import React, { useState, useEffect } from "react";
import useSWR from "swr";
import { requestGas } from "@/utils/apiClient";
import { Class, ClassDetails, AttendanceRecord, Student } from "@/types/lms";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import MathRenderer from "@/components/MathRenderer";
import { 
  BookOpen, Calendar, CheckSquare, ListTodo, 
  Award, Loader2, AlertCircle, CheckCircle2, 
  User, Check, X, FileEdit
} from "lucide-react";

export default function TeacherPage() {
  const { user } = useAuth();
  const router = useRouter();

  // Redirect if not GIAO_VIEN
  if (user && user.role !== "GIAO_VIEN" && user.role !== "ADMIN") {
    router.push("/student");
    return null;
  }

  // State
  const [selectedClassId, setSelectedClassId] = useState<string>("");
  const [sessionNumber, setSessionNumber] = useState<number>(1);
  const [attendanceDate, setAttendanceDate] = useState<string>(
    new Date().toLocaleDateString("sv-SE") // YYYY-MM-DD in local time zone
  );
  
  // Attendance records state: studentId -> "P" (Present) or "V" (Absent)
  const [attendanceRecords, setAttendanceRecords] = useState<Record<string, "P" | "V">>({});

  // Grading form state
  const [selectedStudentId, setSelectedStudentId] = useState<string>("");
  const [assignmentName, setAssignmentName] = useState<string>("");
  const [grade, setGrade] = useState<string>("");
  const [feedback, setFeedback] = useState<string>("");

  // UI state
  const [activePanel, setActivePanel] = useState<"attendance" | "grading">("attendance");
  const [submittingAttendance, setSubmittingAttendance] = useState(false);
  const [submittingGrade, setSubmittingGrade] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const showMessage = (type: "success" | "error", text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  // 1. Fetch Teacher Classes
  const { data: classes = [], error: errCls } = useSWR(
    "getClasses",
    () => requestGas<Class[]>("getClasses")
  );

  // Set initial selected class when classes list loads
  useEffect(() => {
    if (classes.length > 0 && !selectedClassId) {
      setSelectedClassId(classes[0].classId);
    }
  }, [classes, selectedClassId]);

  // 2. Fetch Class Details (Students list)
  const { 
    data: classDetails, 
    error: errDet, 
    mutate: mutateDetails 
  } = useSWR(
    selectedClassId ? `getClassDetails/${selectedClassId}` : null,
    () => requestGas<ClassDetails>("getClassDetails", { method: "GET", body: { classId: selectedClassId } })
  );

  // 3. Fetch Class Attendance Logs (For reference / sessions check)
  const { 
    data: attendanceLogs = [], 
    error: errAtt, 
    mutate: mutateAttendanceLogs 
  } = useSWR(
    selectedClassId ? `getClassAttendance/${selectedClassId}` : null,
    () => requestGas<AttendanceRecord[]>("getClassAttendance", { method: "GET", body: { classId: selectedClassId } })
  );

  // Initialize/reset attendance grid when class details load
  useEffect(() => {
    if (classDetails && classDetails.students) {
      const records: Record<string, "P" | "V"> = {};
      classDetails.students.forEach((std) => {
        records[std.studentId] = "P"; // Default to Present
      });
      setAttendanceRecords(records);
    }
  }, [classDetails]);

  // Handle Attendance Checkbox changes
  const toggleAttendance = (studentId: string) => {
    setAttendanceRecords((prev) => ({
      ...prev,
      [studentId]: prev[studentId] === "P" ? "V" : "P"
    }));
  };

  const handleMarkAllPresent = () => {
    if (!classDetails) return;
    const records: Record<string, "P" | "V"> = {};
    classDetails.students.forEach((std) => {
      records[std.studentId] = "P";
    });
    setAttendanceRecords(records);
  };

  // Submit Attendance Handler
  const handleSaveAttendance = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingAttendance(true);
    try {
      const payload = {
        classId: selectedClassId,
        sessionNumber,
        date: attendanceDate,
        records: attendanceRecords
      };
      await requestGas("markAttendance", {
        method: "POST",
        body: payload
      });
      showMessage("success", `Điểm danh Buổi ${sessionNumber} thành công!`);
      mutateAttendanceLogs();
    } catch (err: any) {
      showMessage("error", err.message || "Lỗi ghi nhận điểm danh");
    } finally {
      setSubmittingAttendance(false);
    }
  };

  // Submit Grade Handler
  const handleSaveGrade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentId) {
      showMessage("error", "Vui lòng chọn học sinh");
      return;
    }
    const gradeVal = parseFloat(grade);
    if (isNaN(gradeVal) || gradeVal < 0 || gradeVal > 10) {
      showMessage("error", "Điểm số phải nằm trong khoảng từ 0 đến 10");
      return;
    }

    setSubmittingGrade(true);
    try {
      await requestGas("submitGrade", {
        method: "POST",
        body: {
          classId: selectedClassId,
          studentId: selectedStudentId,
          assignmentName,
          grade: gradeVal,
          feedback
        }
      });
      showMessage("success", "Ghi nhận điểm số và nhận xét thành công!");
      // Reset form fields
      setSelectedStudentId("");
      setAssignmentName("");
      setGrade("");
      setFeedback("");
    } catch (err: any) {
      showMessage("error", err.message || "Lỗi lưu điểm");
    } finally {
      setSubmittingGrade(false);
    }
  };

  const loading = !errCls && classes.length === 0;

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center py-16">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
        <p className="mt-4 text-sm font-medium text-neutral-500">Đang đồng bộ lớp học của giáo viên...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 flex flex-col space-y-8">
      {/* Header Panel */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-neutral-200 dark:border-neutral-800 pb-5">
        <div>
          <h1 className="text-3xl font-extrabold text-neutral-900 dark:text-white tracking-tight">
            Workspace Giáo Viên
          </h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
            Điểm danh học viên hàng loạt, ghi nhận điểm số và nhận xét công thức toán.
          </p>
        </div>

        {/* Classroom Selector */}
        <div className="mt-4 md:mt-0 flex items-center gap-3">
          <label className="text-sm font-bold text-neutral-600 dark:text-neutral-400">Chọn lớp học:</label>
          <select
            value={selectedClassId}
            onChange={(e) => setSelectedClassId(e.target.value)}
            className="px-3.5 py-2 border rounded-xl bg-white dark:bg-neutral-900 border-neutral-300 dark:border-neutral-700 text-sm font-bold focus:ring-2 focus:ring-blue-500 focus:outline-none"
          >
            {classes.map((cls) => (
              <option key={cls.classId} value={cls.classId}>
                {cls.className}
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

      {classDetails ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          
          {/* Main workspace (2 cols) */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Navigation Panel */}
            <div className="flex border-b border-neutral-200 dark:border-neutral-800 space-x-2">
              <button
                onClick={() => setActivePanel("attendance")}
                className={`px-4 py-2.5 text-sm font-bold border-b-2 flex items-center gap-2 transition-colors cursor-pointer ${
                  activePanel === "attendance" 
                    ? "border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400" 
                    : "border-transparent text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200"
                }`}
              >
                <CheckSquare className="w-4.5 h-4.5" />
                Điểm Danh Học Viên
              </button>
              <button
                onClick={() => setActivePanel("grading")}
                className={`px-4 py-2.5 text-sm font-bold border-b-2 flex items-center gap-2 transition-colors cursor-pointer ${
                  activePanel === "grading" 
                    ? "border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400" 
                    : "border-transparent text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200"
                }`}
              >
                <Award className="w-4.5 h-4.5" />
                Nhập Điểm & Nhận Xét
              </button>
            </div>

            {/* ATTENDANCE CONTROL */}
            {activePanel === "attendance" && (
              <div className="p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm space-y-6 animate-fade-in">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-100 dark:border-neutral-800/50 pb-4">
                  <h3 className="font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                    <ListTodo className="w-5 h-5 text-blue-500" /> Bảng điểm danh buổi học
                  </h3>
                  <button
                    type="button"
                    onClick={handleMarkAllPresent}
                    className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                  >
                    Đánh dấu tất cả có mặt
                  </button>
                </div>

                <form onSubmit={handleSaveAttendance} className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-neutral-500 uppercase mb-1">Buổi thứ mấy?</label>
                      <input
                        type="number"
                        min="1"
                        required
                        value={sessionNumber}
                        onChange={(e) => setSessionNumber(parseInt(e.target.value) || 1)}
                        className="w-full px-3 py-2 border rounded-xl bg-neutral-50 dark:bg-neutral-950 border-neutral-300 dark:border-neutral-700 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-neutral-500 uppercase mb-1">Ngày học</label>
                      <input
                        type="date"
                        required
                        value={attendanceDate}
                        onChange={(e) => setAttendanceDate(e.target.value)}
                        className="w-full px-3 py-2 border rounded-xl bg-neutral-50 dark:bg-neutral-950 border-neutral-300 dark:border-neutral-700 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Attendance Checkbox List */}
                  <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
                    {classDetails.students.map((std) => {
                      const status = attendanceRecords[std.studentId] || "P";
                      return (
                        <div key={std.studentId} className="py-3 flex items-center justify-between">
                          <div className="space-y-0.5">
                            <p className="font-bold text-sm text-neutral-900 dark:text-white">{std.fullName}</p>
                            <p className="text-xs font-mono text-neutral-500">{std.studentId}</p>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setAttendanceRecords(prev => ({ ...prev, [std.studentId]: "P" }))}
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                                status === "P"
                                  ? "bg-green-500 text-white shadow-sm"
                                  : "bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400"
                              }`}
                            >
                              <Check className="w-3.5 h-3.5" /> Có mặt
                            </button>
                            <button
                              type="button"
                              onClick={() => setAttendanceRecords(prev => ({ ...prev, [std.studentId]: "V" }))}
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                                status === "V"
                                  ? "bg-red-500 text-white shadow-sm"
                                  : "bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400"
                              }`}
                            >
                              <X className="w-3.5 h-3.5" /> Vắng mặt
                            </button>
                          </div>
                        </div>
                      );
                    })}

                    {classDetails.students.length === 0 && (
                      <p className="text-center py-6 text-sm text-neutral-400">Không tìm thấy học sinh ghi danh trong lớp học này.</p>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={submittingAttendance || classDetails.students.length === 0}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {submittingAttendance ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckSquare className="w-4.5 h-4.5" />}
                    Lưu Bảng Điểm Danh
                  </button>
                </form>
              </div>
            )}

            {/* GRADING WORKSPACE */}
            {activePanel === "grading" && (
              <div className="p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm space-y-6 animate-fade-in">
                <h3 className="font-bold text-neutral-900 dark:text-white border-b border-neutral-100 dark:border-neutral-800/50 pb-4 flex items-center gap-2">
                  <Award className="w-5 h-5 text-blue-500" /> Nhập điểm & Nhận xét kết quả
                </h3>

                <form onSubmit={handleSaveGrade} className="grid grid-cols-1 gap-6">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="sm:col-span-1">
                      <label className="block text-xs font-bold text-neutral-500 uppercase mb-1">Học sinh</label>
                      <select
                        required
                        value={selectedStudentId}
                        onChange={(e) => setSelectedStudentId(e.target.value)}
                        className="w-full px-3 py-2 border rounded-xl bg-neutral-50 dark:bg-neutral-950 border-neutral-300 dark:border-neutral-700 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      >
                        <option value="">-- Chọn học sinh --</option>
                        {classDetails.students.map((std) => (
                          <option key={std.studentId} value={std.studentId}>
                            {std.fullName}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="sm:col-span-1">
                      <label className="block text-xs font-bold text-neutral-500 uppercase mb-1">Tên bài kiểm tra</label>
                      <input
                        type="text"
                        required
                        value={assignmentName}
                        onChange={(e) => setAssignmentName(e.target.value)}
                        className="w-full px-3 py-2 border rounded-xl bg-neutral-50 dark:bg-neutral-950 border-neutral-300 dark:border-neutral-700 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        placeholder="Ví dụ: Kiểm tra Đại số lần 1"
                      />
                    </div>

                    <div className="sm:col-span-1">
                      <label className="block text-xs font-bold text-neutral-500 uppercase mb-1">Điểm số (0 - 10)</label>
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        max="10"
                        required
                        value={grade}
                        onChange={(e) => setGrade(e.target.value)}
                        className="w-full px-3 py-2 border rounded-xl bg-neutral-50 dark:bg-neutral-950 border-neutral-300 dark:border-neutral-700 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        placeholder="9.5"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-neutral-500 uppercase mb-1">Nhận xét & Hướng dẫn (Có hỗ trợ LaTeX)</label>
                    <textarea
                      value={feedback}
                      onChange={(e) => setFeedback(e.target.value)}
                      rows={4}
                      className="w-full px-3 py-2 border rounded-xl bg-neutral-50 dark:bg-neutral-950 border-neutral-300 dark:border-neutral-700 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono"
                      placeholder="Bài làm tốt. Chú ý bài 3 dùng công thức tích phân từng phần: $\int u dv = uv - \int v du$ để có kết quả tối ưu."
                    />
                    <p className="mt-1 text-xs text-neutral-500">
                      Bao quanh công thức bằng ký hiệu <code>$</code> cho inline math (VD: <code>$x^2 + y^2 = r^2$</code>) hoặc <code>$$</code> cho khối hiển thị.
                    </p>
                  </div>

                  {/* Math Live Preview Box */}
                  <div className="space-y-2">
                    <span className="block text-xs font-bold text-neutral-500 uppercase">Xem trước LaTeX nhận xét:</span>
                    <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 min-h-[4rem] text-sm overflow-x-auto">
                      {feedback ? (
                        <MathRenderer text={feedback} />
                      ) : (
                        <span className="text-neutral-400 italic">Nhập nhận xét để xem trước kết quả trực quan...</span>
                      )}
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={submittingGrade}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {submittingGrade ? <Loader2 className="w-5 h-5 animate-spin" /> : <FileEdit className="w-4.5 h-4.5" />}
                    Lưu Kết Quả Điểm Số
                  </button>
                </form>
              </div>
            )}

          </div>

          {/* Right sidebar: Class Overview & Sessions log (1 col) */}
          <div className="lg:col-span-1 space-y-6">
            
            {/* Classroom Info Card */}
            <div className="p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm space-y-4">
              <h3 className="font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-blue-500" /> Thông Tin Lớp Học
              </h3>
              
              <div className="space-y-3 text-sm">
                <div>
                  <span className="text-xs font-bold text-neutral-400 uppercase block">Tên lớp</span>
                  <span className="font-bold text-neutral-900 dark:text-white">{classDetails.className}</span>
                </div>
                <div>
                  <span className="text-xs font-bold text-neutral-400 uppercase block">Lịch học</span>
                  <span className="text-neutral-700 dark:text-neutral-300 font-medium">{classDetails.schedule}</span>
                </div>
                <div>
                  <span className="text-xs font-bold text-neutral-400 uppercase block">Sĩ số lớp</span>
                  <span className="text-neutral-700 dark:text-neutral-300 font-bold">{classDetails.students.length} học sinh</span>
                </div>
              </div>
            </div>

            {/* Attendance Logs overview */}
            <div className="p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm space-y-4">
              <h3 className="font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-500" /> Lịch Sử Điểm Danh
              </h3>

              <div className="space-y-3 max-h-[16rem] overflow-y-auto pr-1">
                {attendanceLogs.length > 0 ? (
                  // Group logs by session numbers
                  Array.from(new Set(attendanceLogs.map((log) => log.sessionNumber)))
                    .sort((a, b) => b - a) // Show latest sessions first
                    .map((sessNum) => {
                      const sessionLogs = attendanceLogs.filter((log) => log.sessionNumber === sessNum);
                      const presentCount = sessionLogs.filter((log) => log.status === "P").length;
                      const totalCount = sessionLogs.length;
                      const date = sessionLogs[0]?.date || "";
                      
                      return (
                        <div key={sessNum} className="p-3 rounded-xl border border-neutral-100 dark:border-neutral-800/80 bg-neutral-50/50 dark:bg-neutral-950/20 text-xs flex justify-between items-center">
                          <div className="space-y-0.5">
                            <p className="font-bold text-neutral-900 dark:text-white">Buổi học thứ {sessNum}</p>
                            <p className="text-neutral-500 font-mono">{date}</p>
                          </div>
                          <div className="text-right">
                            <span className="px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold">
                              {presentCount}/{totalCount} Có mặt
                            </span>
                          </div>
                        </div>
                      );
                    })
                ) : (
                  <p className="text-center text-xs text-neutral-400 py-4">Chưa ghi nhận buổi điểm danh nào.</p>
                )}
              </div>
            </div>

          </div>

        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      )}
    </div>
  );
}
