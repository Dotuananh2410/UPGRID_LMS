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
  User, Check, X, FileEdit, DollarSign, Clock,
  Grid, TrendingUp, Filter, Save, Sparkles
} from "lucide-react";

const EMPTY_ARRAY: any[] = [];

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
  const [activePanel, setActivePanel] = useState<"overview" | "attendance" | "matrix" | "grading" | "grades_history" | "progress">("overview");
  const [submittingAttendance, setSubmittingAttendance] = useState(false);
  const [submittingGrade, setSubmittingGrade] = useState(false);
  const [submittingProgress, setSubmittingProgress] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Grades search/filter states
  const [gradeSearchTerm, setGradeSearchTerm] = useState("");
  const [gradeFilterStudentId, setGradeFilterStudentId] = useState("");

  // Progress edits state
  const [progressEdits, setProgressEdits] = useState<Record<string, { progressPercent: number; status: string }>>({});

  // Current month for income widget
  const currentMonthStr = new Date().toLocaleDateString("sv-SE").substring(0, 7);
  const { data: payroll } = useSWR(
    user ? `getTeacherPayroll/${user.refId}/${currentMonthStr}` : null,
    () => requestGas<any>("getTeacherPayroll", {
      method: "GET",
      body: { teacherId: user?.refId, month: currentMonthStr }
    })
  );

  // Math feedback templates
  const [selectedTemplateExamType, setSelectedTemplateExamType] = useState<"TSA" | "HSA" | "THPTQG">("TSA");
  const { data: templates = EMPTY_ARRAY } = useSWR(
    `getFeedbackTemplates/${selectedTemplateExamType}`,
    () => requestGas<any[]>("getFeedbackTemplates", {
      method: "GET",
      body: { loaiKiThi: selectedTemplateExamType }
    })
  );

  const showMessage = (type: "success" | "error", text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  // 1. Fetch Teacher Classes
  const { data: classes = EMPTY_ARRAY, error: errCls } = useSWR(
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
    data: attendanceLogs = EMPTY_ARRAY, 
    error: errAtt, 
    mutate: mutateAttendanceLogs 
  } = useSWR(
    selectedClassId ? `getClassAttendance/${selectedClassId}` : null,
    () => requestGas<AttendanceRecord[]>("getClassAttendance", { method: "GET", body: { classId: selectedClassId } })
  );

  // 4. Fetch Class Grades Data
  const { 
    data: classGrades = EMPTY_ARRAY, 
    mutate: mutateGrades 
  } = useSWR(
    selectedClassId ? `getClassGrades/${selectedClassId}` : null,
    () => requestGas<any[]>("getClassGrades", { body: { classId: selectedClassId } })
  );

  // 5. Fetch Class Curriculum Progress
  const { 
    data: classProgress = EMPTY_ARRAY, 
    mutate: mutateProgress 
  } = useSWR(
    selectedClassId ? `getClassProgress/${selectedClassId}` : null,
    () => requestGas<any[]>("getClassProgress", { body: { classId: selectedClassId } })
  );

  // Filter students to active ones only (excluding leave/withdrawn)
  const activeStudents = classDetails?.students?.filter(std => std.status === "Đang học" || !std.status) || [];

  // Initialize/reset attendance grid when class details load
  useEffect(() => {
    if (classDetails && classDetails.students) {
      const records: Record<string, "P" | "V"> = {};
      activeStudents.forEach((std) => {
        records[std.studentId] = "P"; // Default to Present
      });
      setAttendanceRecords(records);
    }
  }, [classDetails]);

  // Initialize progress edits state
  useEffect(() => {
    if (classProgress) {
      const edits: Record<string, { progressPercent: number; status: string }> = {};
      classProgress.forEach((p) => {
        edits[p.progressId] = {
          progressPercent: p.progressPercent,
          status: p.status || "Chưa dạy"
        };
      });
      setProgressEdits(edits);
    }
  }, [classProgress]);

  // Handle Attendance Checkbox changes
  const toggleAttendance = (studentId: string) => {
    setAttendanceRecords((prev) => ({
      ...prev,
      [studentId]: prev[studentId] === "P" ? "V" : "P"
    }));
  };

  const handleMarkAllPresent = () => {
    const records: Record<string, "P" | "V"> = {};
    activeStudents.forEach((std) => {
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
      showMessage("success", `Điểm danh Buổi ${sessionNumber} thành công! Trạng thái đang Chờ Duyệt.`);
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
      mutateGrades();
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

  // Submit curriculum progress updates
  const handleSaveProgress = async () => {
    setSubmittingProgress(true);
    try {
      const records = Object.keys(progressEdits).map(id => ({
        progressId: id,
        progressPercent: progressEdits[id].progressPercent,
        status: progressEdits[id].status
      }));
      await requestGas("updateClassProgress", {
        method: "POST",
        body: { classId: selectedClassId, records }
      });
      showMessage("success", "Cập nhật tiến độ dạy học thành công!");
      mutateProgress();
    } catch (err: any) {
      showMessage("error", err.message || "Lỗi lưu tiến độ");
    } finally {
      setSubmittingProgress(false);
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

  // Derived statistics for Overview tab
  const totalStudents = activeStudents.length;
  const uniqueSessions = Array.from(new Set(attendanceLogs.map(log => log.sessionNumber))).sort((a, b) => a - b);
  const totalSessionsTaught = uniqueSessions.length;
  
  // Calculate average attendance rate
  let avgAttendanceRate = 100;
  if (attendanceLogs.length > 0) {
    const presentCount = attendanceLogs.filter(log => log.status === "P").length;
    avgAttendanceRate = Math.round((presentCount / attendanceLogs.length) * 100);
  }

  // Calculate average grade of the class
  let avgClassGrade = 0;
  if (classGrades.length > 0) {
    const sum = classGrades.reduce((acc, curr) => acc + curr.grade, 0);
    avgClassGrade = Math.round((sum / classGrades.length) * 10) / 10;
  }

  // Calculate overall program progress
  const selectedClassObj = classes.find(c => c.classId === selectedClassId);
  const overallProgressPercent = selectedClassObj?.progressPercent || 0;

  // Filtered grades history
  const filteredGrades = classGrades.filter(g => {
    const matchesSearch = g.studentName.toLowerCase().includes(gradeSearchTerm.toLowerCase()) || 
                          g.assignmentName.toLowerCase().includes(gradeSearchTerm.toLowerCase());
    const matchesStudent = !gradeFilterStudentId || g.studentId === gradeFilterStudentId;
    return matchesSearch && matchesStudent;
  });

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 flex flex-col space-y-8 min-w-0">
      {/* Header Panel */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-neutral-200 dark:border-neutral-800 pb-5">
        <div>
          <h1 className="text-3xl font-extrabold text-neutral-900 dark:text-white tracking-tight">
            Workspace Giáo Viên
          </h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
            Quản lý chuyên cần, tiến độ, nhập điểm số và theo dõi lương thực tế.
          </p>
        </div>

        {/* Classroom Selector */}
        <div className="mt-4 md:mt-0 flex items-center gap-3 max-w-full overflow-hidden">
          <label className="text-sm font-bold text-neutral-600 dark:text-neutral-400 flex-shrink-0">Chọn lớp học:</label>
          <select
            value={selectedClassId}
            onChange={(e) => setSelectedClassId(e.target.value)}
            className="px-3.5 py-2 border rounded-xl bg-white dark:bg-neutral-900 border-neutral-300 dark:border-neutral-700 text-sm font-bold focus:ring-2 focus:ring-blue-500 focus:outline-none max-w-full truncate"
          >
            {classes.map((cls) => (
              <option key={cls.classId} value={cls.classId}>
                {cls.className}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Top section: Payroll & Classroom Info */}
      {classDetails && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
          {/* Payroll Box (Left on desktop, bottom on mobile) */}
          <div className="lg:col-span-2 order-2 lg:order-1 flex">
            {payroll ? (
              <div className="w-full p-6 rounded-2xl bg-gradient-to-r from-blue-600/10 to-cyan-500/10 border border-blue-500/20 shadow-sm flex flex-col justify-between gap-4 animate-fade-in">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <h3 className="text-sm font-bold text-blue-800 dark:text-blue-300 uppercase tracking-wider flex items-center gap-1.5">
                    <DollarSign className="w-5 h-5 flex-shrink-0" /> Thu Nhập Tạm Tính Tháng {currentMonthStr.substring(5)}/{currentMonthStr.substring(0, 4)}
                  </h3>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">
                    Cơ chế: <span className="font-bold text-neutral-800 dark:text-neutral-200">70% học phí</span> thực tế.
                  </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-white/70 dark:bg-neutral-900/70 p-4 rounded-xl border border-neutral-200/60 dark:border-neutral-800/80 shadow-sm">
                    <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Tiền Đã Giải Ngân</p>
                    <p className="text-2xl font-extrabold text-green-600 dark:text-green-400 mt-1">
                      {payroll.paidSalary?.toLocaleString("vi-VN")} đ
                    </p>
                    <span className="text-[10px] font-semibold text-neutral-500">Đã nhận {payroll.paidCount || 0} buổi dạy</span>
                  </div>
                  <div className="bg-white/70 dark:bg-neutral-900/70 p-4 rounded-xl border border-neutral-200/60 dark:border-neutral-800/80 shadow-sm">
                    <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Tiền Chờ Thanh Toán</p>
                    <p className="text-2xl font-extrabold text-blue-600 dark:text-blue-450 mt-1">
                      {payroll.approvedSalary?.toLocaleString("vi-VN")} đ
                    </p>
                    <span className="text-[10px] font-semibold text-neutral-500">Đã chốt {payroll.approvedCount || 0} buổi dạy</span>
                  </div>
                  <div className="bg-white/70 dark:bg-neutral-900/70 p-4 rounded-xl border border-neutral-200/60 dark:border-neutral-800/80 shadow-sm">
                    <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Tiền Chờ Duyệt</p>
                    <p className="text-2xl font-extrabold text-amber-500 mt-1">
                      {payroll.pendingSalary?.toLocaleString("vi-VN")} đ
                    </p>
                    <span className="text-[10px] font-semibold text-neutral-500">Chờ duyệt {payroll.pendingCount || 0} buổi dạy</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="w-full p-6 rounded-2xl border border-neutral-250 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/30 flex items-center justify-center min-h-[160px]">
                <Loader2 className="w-6 h-6 animate-spin text-neutral-400" />
              </div>
            )}
          </div>

          {/* Classroom Info (Right on desktop, top on mobile) */}
          <div className="lg:col-span-1 order-1 lg:order-2">
            <div className="h-full p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm flex flex-col justify-between gap-4">
              <h3 className="font-bold text-neutral-900 dark:text-white flex items-center gap-2 border-b border-neutral-100 dark:border-neutral-800 pb-2">
                <BookOpen className="w-5 h-5 text-blue-500" /> Thông Tin Lớp Học
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3 text-sm">
                <div>
                  <span className="text-xs font-bold text-neutral-400 uppercase block">Tên lớp</span>
                  <span className="font-bold text-neutral-900 dark:text-white line-clamp-1">{classDetails.className}</span>
                </div>
                <div>
                  <span className="text-xs font-bold text-neutral-400 uppercase block">Lịch học</span>
                  <span className="text-neutral-700 dark:text-neutral-300 font-medium line-clamp-1">{classDetails.schedule}</span>
                </div>
                <div>
                  <span className="text-xs font-bold text-neutral-400 uppercase block">Sĩ số lớp hoạt động</span>
                  <span className="text-neutral-700 dark:text-neutral-300 font-bold">{totalStudents} học sinh</span>
                </div>
                <div>
                  <span className="text-xs font-bold text-neutral-400 uppercase block">Tiến độ chương trình</span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <div className="flex-1 bg-neutral-200 dark:bg-neutral-800 rounded-full h-2 overflow-hidden">
                      <div className="bg-green-500 h-full rounded-full" style={{ width: `${overallProgressPercent}%` }} />
                    </div>
                    <span className="font-bold text-xs">{overallProgressPercent}%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

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
        <div className="space-y-6">
            
            {/* Navigation Panel */}
            <div className="flex border-b border-neutral-200 dark:border-neutral-800 space-x-2 overflow-x-auto pb-1">
              {([
                { id: "overview", label: "Tổng Quan", icon: Sparkles },
                { id: "attendance", label: "Điểm Danh", icon: CheckSquare },
                { id: "matrix", label: "Bảng Chuyên Cần", icon: Grid },
                { id: "grading", label: "Nhập Điểm", icon: Award },
                { id: "grades_history", label: "Lịch Sử Điểm", icon: TrendingUp },
                { id: "progress", label: "Tiến Độ Dạy Học", icon: BookOpen }
              ] as const).map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActivePanel(tab.id)}
                    className={`px-4 py-2.5 text-sm font-bold border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer flex-shrink-0 ${
                      activePanel === tab.id 
                        ? "border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400" 
                        : "border-transparent text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200"
                    }`}
                  >
                    <Icon className="w-4.5 h-4.5" />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* OVERVIEW PANEL */}
            {activePanel === "overview" && (
              <div className="space-y-6 animate-fade-in">
                {/* Stats grid */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  <div className="p-4 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-center space-y-1">
                    <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Học sinh hoạt động</p>
                    <p className="text-2xl font-extrabold text-neutral-900 dark:text-white">{totalStudents}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-center space-y-1">
                    <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Số buổi đã dạy</p>
                    <p className="text-2xl font-extrabold text-neutral-900 dark:text-white">{totalSessionsTaught}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-center space-y-1">
                    <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Chuyên cần trung bình</p>
                    <p className="text-2xl font-extrabold text-green-600 dark:text-green-400">{avgAttendanceRate}%</p>
                  </div>
                  <div className="p-4 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-center space-y-1">
                    <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Điểm trung bình lớp</p>
                    <p className="text-2xl font-extrabold text-blue-600 dark:text-blue-400">{avgClassGrade}/10</p>
                  </div>
                </div>

                {/* Students and Attendance Logs side by side */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Left part: Students Table (2 cols) */}
                  <div className="lg:col-span-2 p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm min-w-0 overflow-hidden">
                    <h3 className="text-lg font-bold text-neutral-900 dark:text-white mb-4">
                      Danh sách học viên và thống kê cá nhân
                    </h3>
                    <div className="overflow-x-auto w-full">
                      <table className="w-full text-left border-collapse min-w-[600px]">
                        <thead>
                          <tr className="border-b border-neutral-200 dark:border-neutral-800 text-xs font-bold text-neutral-500 uppercase tracking-wider">
                            <th className="pb-3">Học sinh</th>
                            <th className="pb-3 text-center">Trạng thái</th>
                            <th className="pb-3 text-center">Tỷ lệ đi học</th>
                            <th className="pb-3 text-center">Điểm trung bình</th>
                            <th className="pb-3 text-right">Hành động nhanh</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800 text-sm text-neutral-700 dark:text-neutral-300">
                          {activeStudents.map((std) => {
                            const studentLogs = attendanceLogs.filter(log => log.studentId === std.studentId);
                            const presentCount = studentLogs.filter(log => log.status === "P").length;
                            const attendanceRate = studentLogs.length > 0 ? Math.round((presentCount / studentLogs.length) * 100) : 100;

                            const studentGrades = classGrades.filter(g => g.studentId === std.studentId);
                            const avgGrade = studentGrades.length > 0 ? (studentGrades.reduce((sum, g) => sum + g.grade, 0) / studentGrades.length) : null;

                            return (
                              <tr key={std.studentId} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/10">
                                <td className="py-3.5">
                                  <p className="font-bold text-neutral-900 dark:text-white">{std.fullName}</p>
                                  <span className="text-xs font-mono text-neutral-400">{std.studentId}</span>
                                </td>
                                <td className="py-3.5 text-center">
                                  <span className="px-2 py-0.5 rounded bg-green-500/10 text-green-600 dark:text-green-400 font-bold text-[10px] uppercase">
                                    Đang học
                                  </span>
                                </td>
                                <td className="py-3.5 text-center font-bold text-neutral-900 dark:text-white">
                                  {attendanceRate}%
                                  <span className="text-[10px] text-neutral-400 block font-normal">({presentCount}/{studentLogs.length} buổi)</span>
                                </td>
                                <td className="py-3.5 text-center font-bold">
                                  {avgGrade !== null ? (
                                    <span className={avgGrade >= 8 ? "text-green-600 dark:text-green-400" : avgGrade >= 5 ? "text-blue-600 dark:text-blue-400" : "text-rose-600"}>
                                      {avgGrade.toFixed(1)}
                                    </span>
                                  ) : (
                                    <span className="text-neutral-400">—</span>
                                  )}
                                </td>
                                <td className="py-3.5 text-right space-x-1">
                                  <button
                                    onClick={() => {
                                      setSelectedStudentId(std.studentId);
                                      setActivePanel("grading");
                                    }}
                                    className="px-2.5 py-1 text-[11px] font-bold rounded bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 cursor-pointer transition-all"
                                  >
                                    Vào điểm
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                          {activeStudents.length === 0 && (
                            <tr>
                              <td colSpan={5} className="py-8 text-center text-neutral-400">Không tìm thấy học sinh</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Right part: Attendance History (1 col) */}
                  <div className="lg:col-span-1 p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm space-y-4">
                    <h3 className="font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-blue-500" /> Lịch Sử Điểm Danh
                    </h3>

                    <div className="space-y-3 max-h-[22rem] overflow-y-auto pr-1">
                      {attendanceLogs.length > 0 ? (
                        uniqueSessions
                          .slice()
                          .sort((a, b) => b - a)
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

                {/* Nhật Ký Dạy Học & Thu Nhập Chi Tiết Trong Tháng */}
                <div className="p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm min-w-0 overflow-hidden">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                    <div>
                      <h3 className="text-lg font-bold text-neutral-900 dark:text-white">
                        Nhật Ký Dạy Học & Thu Nhập Chi Tiết Trong Tháng
                      </h3>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                        Bảng kê chi tiết các buổi dạy, số lượng học sinh thực tế đi học và thu nhập 70% được chia sẻ.
                      </p>
                    </div>
                  </div>

                  {!payroll || !payroll.sessions || payroll.sessions.length === 0 ? (
                    <div className="py-8 text-center text-neutral-400 font-medium">
                      Chưa ghi nhận buổi dạy học nào trong tháng này.
                    </div>
                  ) : (
                    <div className="overflow-x-auto w-full">
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
                          {payroll.sessions.map((sess: any, index: number) => {
                            const isApproved = sess.status === "Đã duyệt";
                            const isPending = sess.status === "Chờ duyệt";
                            const isPaid = sess.paymentStatus === "Đã thanh toán";
                            
                            return (
                              <tr key={index} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/10 transition-colors">
                                <td className="py-3">
                                  <p className="font-bold text-sm text-neutral-900 dark:text-white">{sess.className}</p>
                                  <span className="text-[10px] font-mono text-neutral-400">{sess.classId}</span>
                                </td>
                                <td className="py-3 text-center text-sm font-bold text-neutral-800 dark:text-neutral-200">
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
                </div>
              </div>
            )}

            {/* ATTENDANCE PANEL */}
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

                  {/* Attendance Checklist */}
                  <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
                    {activeStudents.map((std) => {
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

                    {activeStudents.length === 0 && (
                      <p className="text-center py-6 text-sm text-neutral-400">Không tìm thấy học sinh ghi danh trong lớp học này.</p>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={submittingAttendance || activeStudents.length === 0}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {submittingAttendance ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckSquare className="w-4.5 h-4.5" />}
                    Lưu Bảng Điểm Danh (Cần Phê Duyệt)
                  </button>
                </form>
              </div>
            )}

            {/* ATTENDANCE MATRIX PANEL */}
            {activePanel === "matrix" && (
              <div className="p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm min-w-0 overflow-hidden animate-fade-in">
                <h3 className="font-bold text-neutral-900 dark:text-white mb-4 flex items-center gap-2">
                  <Grid className="w-5 h-5 text-blue-500" /> Ma trận điểm danh và chuyên cần (O: Có mặt / X: Vắng)
                </h3>
                {uniqueSessions.length === 0 ? (
                  <p className="text-center py-8 text-neutral-400 font-medium">Chưa ghi nhận dữ liệu điểm danh.</p>
                ) : (
                  <div className="overflow-x-auto w-full">
                    <table className="w-full text-left border-collapse text-xs min-w-[600px]">
                      <thead>
                        <tr className="border-b border-neutral-200 dark:border-neutral-800 font-bold text-neutral-500 uppercase">
                          <th className="pb-3 text-sm">Học viên</th>
                          {uniqueSessions.map(num => (
                            <th key={num} className="pb-3 text-center min-w-[50px]">B.{num}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800 font-medium text-neutral-700 dark:text-neutral-300">
                        {activeStudents.map(std => (
                          <tr key={std.studentId} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/10">
                            <td className="py-3 pr-2 text-sm font-bold text-neutral-900 dark:text-white">
                              {std.fullName}
                            </td>
                            {uniqueSessions.map(num => {
                              const match = attendanceLogs.find(l => l.studentId === std.studentId && l.sessionNumber === num);
                              const val = match ? match.status : "—";
                              return (
                                <td key={num} className="py-3 text-center font-bold">
                                  {val === "P" ? (
                                    <span className="text-green-600 dark:text-green-400 font-mono text-sm bg-green-500/10 px-2 py-0.5 rounded">O</span>
                                  ) : val === "V" ? (
                                    <span className="text-rose-600 font-mono text-sm bg-rose-500/10 px-2 py-0.5 rounded">X</span>
                                  ) : (
                                    <span className="text-neutral-400 font-mono">—</span>
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
            )}

            {/* GRADING WORKSPACE PANEL */}
            {activePanel === "grading" && (
              <div className="p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm space-y-6 min-w-0 overflow-hidden animate-fade-in">
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
                        {activeStudents.map((std) => (
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

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-xs font-bold text-neutral-500 uppercase mb-1">Nhận xét & Hướng dẫn (Có hỗ trợ LaTeX)</label>
                      <textarea
                        value={feedback}
                        onChange={(e) => setFeedback(e.target.value)}
                        rows={5}
                        className="w-full px-3 py-2 border rounded-xl bg-neutral-50 dark:bg-neutral-950 border-neutral-300 dark:border-neutral-700 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono"
                        placeholder="Bài làm tốt. Chú ý bài 3 dùng công thức tích phân từng phần: $\int u dv = uv - \int v du$ để có kết quả tối ưu."
                      />
                      <p className="mt-1 text-xs text-neutral-500">
                        Bao quanh công thức bằng ký hiệu <code>$</code> cho inline math (VD: <code>$x^2 + y^2 = r^2$</code>) hoặc <code>$$</code> cho khối hiển thị.
                      </p>
                    </div>

                    <div className="md:col-span-1 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-4 bg-neutral-50/50 dark:bg-neutral-950/20 space-y-3">
                      <div className="flex justify-between items-center border-b border-neutral-100 dark:border-neutral-800/50 pb-2">
                        <span className="text-xs font-bold text-neutral-500 uppercase flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> Nhận xét mẫu</span>
                        <div className="flex gap-1">
                          {(["TSA", "HSA", "THPTQG"] as const).map((type) => (
                            <button
                              key={type}
                              type="button"
                              onClick={() => setSelectedTemplateExamType(type)}
                              className={`px-1.5 py-0.5 rounded text-[9px] font-extrabold transition-colors cursor-pointer ${
                                selectedTemplateExamType === type
                                  ? "bg-blue-600 text-white"
                                  : "bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 text-neutral-500"
                              }`}
                            >
                              {type}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-2 max-h-[9rem] overflow-y-auto pr-1">
                        {templates.map((tpl: any) => (
                          <button
                            key={tpl.templateId}
                            type="button"
                            onClick={() => {
                              setFeedback(prev => prev ? `${prev} ${tpl.noiDungMau}` : tpl.noiDungMau);
                            }}
                            className="w-full text-left p-2 rounded-lg bg-white dark:bg-neutral-900 border border-neutral-250/60 dark:border-neutral-800 hover:border-blue-500/30 text-[11px] font-medium transition-all hover:scale-[1.01] cursor-pointer line-clamp-3 leading-relaxed"
                            title={tpl.noiDungMau}
                          >
                            {tpl.noiDungMau}
                          </button>
                        ))}
                        {templates.length === 0 && (
                          <p className="text-center text-[10px] text-neutral-400 italic py-4">Chưa có mẫu nào cho {selectedTemplateExamType}</p>
                        )}
                      </div>
                    </div>
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

            {/* GRADES HISTORY PANEL */}
            {activePanel === "grades_history" && (
              <div className="p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm space-y-6 min-w-0 overflow-hidden animate-fade-in">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-neutral-100 dark:border-neutral-800/50 pb-4">
                  <h3 className="font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-blue-500" /> Nhật ký điểm kiểm tra lớp học
                  </h3>
                  
                  {/* Search and Filters */}
                  <div className="flex flex-col sm:flex-row gap-2">
                    <div className="flex items-center gap-2">
                      <Filter className="w-3.5 h-3.5 text-neutral-400" />
                      <select
                        value={gradeFilterStudentId}
                        onChange={(e) => setGradeFilterStudentId(e.target.value)}
                        className="text-xs bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg px-2.5 py-1.5 focus:outline-none"
                      >
                        <option value="">Lọc học viên</option>
                        {activeStudents.map(std => (
                          <option key={std.studentId} value={std.studentId}>{std.fullName}</option>
                        ))}
                      </select>
                    </div>
                    <input
                      type="text"
                      placeholder="Tìm bài kiểm tra..."
                      value={gradeSearchTerm}
                      onChange={(e) => setGradeSearchTerm(e.target.value)}
                      className="text-xs px-3 py-1.5 border rounded-lg bg-white dark:bg-neutral-900 border-neutral-300 dark:border-neutral-700 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[600px]">
                    <thead>
                      <tr className="border-b border-neutral-200 dark:border-neutral-800 text-xs font-bold text-neutral-500 uppercase tracking-wider">
                        <th className="pb-3">Học sinh</th>
                        <th className="pb-3">Bài kiểm tra</th>
                        <th className="pb-3 text-center">Điểm số</th>
                        <th className="pb-3">Nhận xét chi tiết</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800 text-sm text-neutral-700 dark:text-neutral-300">
                      {filteredGrades.map((g: any) => (
                        <tr key={g.recordId} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/10">
                          <td className="py-3.5">
                            <p className="font-bold text-neutral-900 dark:text-white">{g.studentName}</p>
                            <span className="text-xs font-mono text-neutral-400">{g.studentId}</span>
                          </td>
                          <td className="py-3.5 font-semibold text-neutral-800 dark:text-neutral-200">
                            {g.assignmentName}
                          </td>
                          <td className="py-3.5 text-center font-bold">
                            <span className={`px-2 py-1 rounded text-xs ${
                              g.grade >= 8 
                                ? "bg-green-500/10 text-green-600 dark:text-green-400" 
                                : g.grade >= 5 
                                  ? "bg-blue-500/10 text-blue-600 dark:text-blue-400" 
                                  : "bg-rose-500/10 text-rose-600"
                            }`}>
                              {g.grade.toFixed(1)} / 10
                            </span>
                          </td>
                          <td className="py-3.5 max-w-sm">
                            <div className="text-xs text-neutral-600 dark:text-neutral-400 max-h-16 overflow-y-auto leading-relaxed">
                              <MathRenderer text={g.feedback} />
                            </div>
                          </td>
                        </tr>
                      ))}
                      {filteredGrades.length === 0 && (
                        <tr>
                          <td colSpan={4} className="py-12 text-center text-neutral-400 font-medium">Không tìm thấy bản ghi điểm nào</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* CURRICULUM PROGRESS PANEL */}
            {activePanel === "progress" && (
              <div className="p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm space-y-6 min-w-0 overflow-hidden animate-fade-in">
                <div className="flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800/50 pb-4">
                  <div>
                    <h3 className="font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                      <BookOpen className="w-5 h-5 text-blue-500" /> Tiến độ giảng dạy theo lộ trình chương trình
                    </h3>
                    <p className="text-xs text-neutral-500 mt-1">
                      Kéo các thanh trượt và đổi trạng thái chủ đề, sau đó bấm Lưu để đồng bộ tiến độ lớp học.
                    </p>
                  </div>
                  <button
                    onClick={handleSaveProgress}
                    disabled={submittingProgress || classProgress.length === 0}
                    className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow flex items-center gap-1.5 cursor-pointer transition-all hover-lift"
                  >
                    {submittingProgress ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Lưu tiến độ
                  </button>
                </div>

                {classProgress.length === 0 ? (
                  <p className="text-center py-12 text-neutral-400 italic">Lớp học này chưa khởi tạo lộ trình đào tạo template.</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {classProgress.map((p: any) => {
                      const edit = progressEdits[p.progressId] || { progressPercent: p.progressPercent, status: p.status || "Chưa dạy" };
                      return (
                        <div key={p.progressId} className="p-4 rounded-xl border border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/30 flex flex-col justify-between space-y-4">
                          <div>
                            <p className="font-bold text-sm text-neutral-900 dark:text-white">{p.topicName}</p>
                            <span className="text-[10px] text-neutral-400 font-mono">Cập nhật lần cuối: {p.lastUpdated || "—"}</span>
                          </div>

                          <div className="space-y-3">
                            {/* Status Selector */}
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-semibold text-neutral-500">Trạng thái:</span>
                              <select
                                value={edit.status}
                                onChange={(e) => {
                                  const status = e.target.value;
                                  const progressPercent = status === "Đã dạy" ? 100 : status === "Chưa dạy" ? 0 : edit.progressPercent;
                                  setProgressEdits(prev => ({
                                    ...prev,
                                    [p.progressId]: { progressPercent, status }
                                  }));
                                }}
                                className="px-2 py-1 border rounded bg-white dark:bg-neutral-900 border-neutral-250 font-bold"
                              >
                                <option value="Chưa dạy">Chưa dạy</option>
                                <option value="Đang dạy">Đang dạy</option>
                                <option value="Đã dạy">Đã dạy</option>
                              </select>
                            </div>

                            {/* Range slider for percent */}
                            <div className="space-y-1">
                              <div className="flex justify-between items-center text-xs font-bold">
                                <span className="text-neutral-500 font-semibold">Tỷ lệ hoàn thành:</span>
                                <span className="text-blue-600 dark:text-blue-400">{edit.progressPercent}%</span>
                              </div>
                              <input
                                type="range"
                                min="0"
                                max="100"
                                step="10"
                                value={edit.progressPercent}
                                disabled={edit.status === "Đã dạy" || edit.status === "Chưa dạy"}
                                onChange={(e) => {
                                  const progressPercent = parseInt(e.target.value) || 0;
                                  setProgressEdits(prev => ({
                                    ...prev,
                                    [p.progressId]: { ...prev[p.progressId], progressPercent }
                                  }));
                                }}
                                className="w-full accent-blue-600 h-1.5 rounded-lg bg-neutral-200 dark:bg-neutral-800 appearance-none cursor-pointer"
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      )}
    </div>
  );
}
