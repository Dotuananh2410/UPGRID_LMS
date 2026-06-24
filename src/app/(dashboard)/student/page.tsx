"use client";

import React, { useState } from "react";
import useSWR from "swr";
import { requestGas } from "@/utils/apiClient";
import { StudentDashboard } from "@/types/lms";
import { useAuth } from "@/context/AuthContext";
import MathRenderer from "@/components/MathRenderer";
import { 
  BookOpen, Calendar, Award, 
  TrendingUp, CheckCircle, XCircle, 
  Loader2, BellRing, ClipboardList,
  DollarSign, CreditCard, MessageSquare, Star, Check, X, Sparkles, Filter
} from "lucide-react";

export default function StudentPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"learning" | "finance" | "feedback">("learning");
  const [selectedClassId, setSelectedClassId] = useState<string>("");

  // Feedback form state
  const [feedbackClassId, setFeedbackClassId] = useState("");
  const [rating, setRating] = useState("5");
  const [teacherComment, setTeacherComment] = useState("");
  const [suggestion, setSuggestion] = useState("");
  const [submittingFeedback, setSubmittingFeedback] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // 1. Fetch Student Dashboard Data
  const { data: dashboard, error, mutate: mutateDashboard } = useSWR(
    user ? `getStudentDashboard/${user.refId}` : null,
    () => requestGas<StudentDashboard>("getStudentDashboard")
  );

  // 2. Fetch Student Debt Data
  const { data: tuitionData, mutate: mutateDebt } = useSWR(
    user && activeTab === "finance" ? `getStudentDebt/${user.refId}` : null,
    () => requestGas<any>("getStudentDebt", { body: { studentId: user?.refId } })
  );

  // 3. Fetch Class Curriculum Progress for drilled-down class
  const { data: curriculumProgress = [] } = useSWR(
    selectedClassId && activeTab === "learning" ? `getClassProgress/${selectedClassId}` : null,
    () => requestGas<any[]>("getClassProgress", { body: { classId: selectedClassId } })
  );

  const loading = !error && !dashboard;

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center py-16">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
        <p className="mt-4 text-sm font-medium text-neutral-500">Đang chuẩn bị học bạ cá nhân...</p>
      </div>
    );
  }

  if (error || !dashboard) {
    return (
      <div className="max-w-md mx-auto my-16 p-6 rounded-2xl border border-red-500/20 bg-red-500/10 text-center space-y-3">
        <XCircle className="w-12 h-12 text-red-500 mx-auto" />
        <h3 className="font-bold text-red-600 dark:text-red-400">Lỗi đồng bộ dữ liệu</h3>
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          Không thể tải dữ liệu học tập cá nhân. Vui lòng liên hệ Admin hoặc thử lại sau.
        </p>
      </div>
    );
  }

  const { classes = [], attendances = [], grades = [] } = dashboard;

  // Calculate statistics
  const totalClassesCount = classes.length;
  const totalSessionsCount = attendances.length;
  const presentSessionsCount = attendances.filter((att) => att.status === "P").length;
  const attendanceRate = totalSessionsCount > 0 
    ? Math.round((presentSessionsCount / totalSessionsCount) * 100) 
    : 100;

  // Calculate GPA
  const validGrades = grades.filter((g) => g.grade !== undefined && g.grade !== null);
  const averageGrade = validGrades.length > 0 
    ? (validGrades.reduce((sum, g) => sum + g.grade, 0) / validGrades.length).toFixed(2)
    : "—";

  // Handle feedback submission
  const handleFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackClassId) {
      setFeedbackMessage({ type: "error", text: "Vui lòng chọn lớp học" });
      return;
    }
    setSubmittingFeedback(true);
    setFeedbackMessage(null);
    try {
      await requestGas("submitStudentFeedback", {
        method: "POST",
        body: {
          classId: feedbackClassId,
          rating: parseInt(rating),
          teacherComment,
          suggestion
        }
      });
      setFeedbackMessage({ type: "success", text: "Gửi nhận xét và ý kiến đóng góp thành công!" });
      setFeedbackClassId("");
      setRating("5");
      setTeacherComment("");
      setSuggestion("");
    } catch (err: any) {
      setFeedbackMessage({ type: "error", text: err.message || "Lỗi gửi phản hồi" });
    } finally {
      setSubmittingFeedback(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 flex flex-col space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-neutral-200 dark:border-neutral-800 pb-5">
        <div>
          <h1 className="text-3xl font-extrabold text-neutral-900 dark:text-white tracking-tight">
            Dashboard Học Viên
          </h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
            Chào mừng quay lại, <span className="font-bold text-blue-600 dark:text-blue-400">{user?.fullName}</span>. Mã học sinh: <span className="font-mono font-bold">{user?.refId}</span>.
          </p>
        </div>

        {/* Dynamic Tabs */}
        <div className="mt-4 md:mt-0 flex bg-neutral-100 dark:bg-neutral-800 p-1 rounded-xl w-fit">
          <button
            onClick={() => setActiveTab("learning")}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === "learning"
                ? "bg-white dark:bg-neutral-900 text-blue-600 dark:text-blue-400 shadow-sm"
                : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
            }`}
          >
            <BookOpen className="w-4 h-4" /> Học tập
          </button>
          <button
            onClick={() => setActiveTab("finance")}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === "finance"
                ? "bg-white dark:bg-neutral-900 text-blue-600 dark:text-blue-400 shadow-sm"
                : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
            }`}
          >
            <DollarSign className="w-4 h-4" /> Tài chính
          </button>
          <button
            onClick={() => setActiveTab("feedback")}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === "feedback"
                ? "bg-white dark:bg-neutral-900 text-blue-600 dark:text-blue-400 shadow-sm"
                : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
            }`}
          >
            <MessageSquare className="w-4 h-4" /> Đánh giá & Góp ý
          </button>
        </div>
      </div>

      {/* LEARNING TAB */}
      {activeTab === "learning" && (
        <div className="space-y-8 animate-fade-in">
          {!selectedClassId ? (
            <>
              {/* KPI Statistic Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-6 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Lớp Đang Học</p>
                    <p className="text-3xl font-extrabold text-neutral-900 dark:text-white">{totalClassesCount}</p>
                    <p className="text-xs text-neutral-500">Ghi danh chính thức</p>
                  </div>
                  <div className="p-4 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
                    <BookOpen className="w-6 h-6" />
                  </div>
                </div>

                <div className="p-6 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Chuyên Cần</p>
                    <p className="text-3xl font-extrabold text-neutral-900 dark:text-white">{attendanceRate}%</p>
                    <p className="text-xs text-neutral-500">Đã đi học: {presentSessionsCount}/{totalSessionsCount} buổi</p>
                  </div>
                  <div className="p-4 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
                    <CheckCircle className="w-6 h-6" />
                  </div>
                </div>

                <div className="p-6 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Điểm Trung Bình (GPA)</p>
                    <p className="text-3xl font-extrabold text-neutral-900 dark:text-white">{averageGrade}</p>
                    <p className="text-xs text-neutral-500">Tính trên {validGrades.length} đầu điểm</p>
                  </div>
                  <div className="p-4 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
                    <TrendingUp className="w-6 h-6" />
                  </div>
                </div>
              </div>

              {/* Classes list dashboard */}
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-neutral-900 dark:text-white">Danh sách lớp đang học</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {classes.map((cls) => (
                    <div 
                      key={cls.classId}
                      onClick={() => setSelectedClassId(cls.classId)}
                      className="p-6 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 hover:border-blue-500/30 hover:shadow-md cursor-pointer transition-all hover-lift flex flex-col justify-between"
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold text-xs font-mono">
                            {cls.classId}
                          </span>
                          <span className="text-xs font-extrabold text-amber-500 flex items-center gap-1">
                            <Award className="w-3.5 h-3.5" /> Xếp hạng: #{cls.rank || "—"}/{cls.totalStudents || "—"}
                          </span>
                        </div>
                        <h4 className="font-extrabold text-lg text-neutral-900 dark:text-white">{cls.className}</h4>
                        <p className="text-xs text-neutral-500">Lịch học: {cls.schedule} | Giáo viên: {cls.teacherName}</p>
                      </div>

                      <div className="mt-4 pt-4 border-t border-neutral-100 dark:border-neutral-800/50 flex items-center justify-between">
                        <span className="text-xs text-neutral-500">Tiến độ chương trình:</span>
                        <div className="flex items-center gap-2">
                          <div className="w-24 bg-neutral-200 dark:bg-neutral-800 rounded-full h-1.5 overflow-hidden">
                            <div className="bg-green-500 h-full rounded-full" style={{ width: `${cls.progressPercent || 0}%` }} />
                          </div>
                          <span className="text-xs font-bold">{Math.round(cls.progressPercent || 0)}%</span>
                        </div>
                      </div>
                    </div>
                  ))}
                  {classes.length === 0 && (
                    <div className="col-span-2 text-center py-12 bg-white dark:bg-neutral-900 rounded-2xl border border-dashed border-neutral-200 dark:border-neutral-800">
                      <ClipboardList className="w-12 h-12 text-neutral-400 mx-auto mb-2" />
                      <p className="text-sm font-semibold text-neutral-500">Bạn chưa đăng ký lớp học nào chính thức.</p>
                    </div>
                  )}
                </div>
              </div>

              {/* General Grades & Attendance Lists */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 p-6 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-6">
                  <h3 className="text-lg font-bold text-neutral-900 dark:text-white flex items-center gap-2 border-b border-neutral-100 dark:border-neutral-800/50 pb-4">
                    <Award className="w-5 h-5 text-blue-500" /> Bảng Điểm & Nhận Xét Chi Tiết
                  </h3>
                  <div className="space-y-6">
                    {grades.map((grd) => (
                      <div 
                        key={grd.recordId}
                        className="p-5 rounded-xl border border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-950/20 space-y-3"
                      >
                        <div className="flex flex-wrap justify-between items-center gap-2 border-b border-neutral-100 dark:border-neutral-800/50 pb-2">
                          <div>
                            <span className="text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full mr-2 font-mono">
                              {grd.classId}
                            </span>
                            <span className="font-bold text-neutral-950 dark:text-white text-sm">
                              {grd.assignmentName}
                            </span>
                          </div>
                          <div className="text-lg font-extrabold text-blue-600 dark:text-blue-400 bg-white dark:bg-neutral-900 px-3.5 py-1 rounded-lg border border-neutral-200 dark:border-neutral-800 shadow-sm">
                            {grd.grade.toFixed(1)} / 10
                          </div>
                        </div>
                        <div className="space-y-1">
                          <span className="text-xs font-bold text-neutral-400 uppercase block">Nhận xét của giáo viên:</span>
                          <div className="text-sm text-neutral-700 dark:text-neutral-300 font-medium bg-white dark:bg-neutral-900/60 p-3 rounded-lg border border-neutral-200/60 dark:border-neutral-800/80 overflow-x-auto leading-relaxed">
                            {grd.feedback ? (
                              <MathRenderer text={grd.feedback} />
                            ) : (
                              <span className="text-neutral-400 italic">Chưa có nhận xét chi tiết.</span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                    {grades.length === 0 && (
                      <p className="text-center py-6 text-neutral-400 italic text-sm">Chưa có điểm kiểm tra nào được cập nhật.</p>
                    )}
                  </div>
                </div>

                <div className="lg:col-span-1 p-6 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-4">
                  <h3 className="text-lg font-bold text-neutral-900 dark:text-white flex items-center gap-2 border-b border-neutral-100 dark:border-neutral-800/50 pb-4">
                    <BellRing className="w-5 h-5 text-blue-500" /> Nhật Ký Chuyên Cần
                  </h3>
                  <div className="space-y-3 max-h-[22rem] overflow-y-auto pr-1">
                    {attendances.map((att) => (
                      <div 
                        key={att.attendanceId}
                        className="p-3 rounded-xl border border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-950/20 text-xs flex justify-between items-center"
                      >
                        <div className="space-y-0.5">
                          <p className="font-bold text-neutral-900 dark:text-white">Buổi thứ {att.sessionNumber}</p>
                          <p className="text-neutral-400 font-mono">{att.date}</p>
                          <span className="text-[10px] text-neutral-500 truncate block max-w-[8rem]">{att.className}</span>
                        </div>
                        <div>
                          {att.status === "P" ? (
                            <span className="px-2.5 py-1 rounded-full bg-green-500/15 text-green-600 dark:text-green-400 font-bold flex items-center gap-1 border border-green-500/10">
                              <CheckCircle className="w-3 h-3" /> Đi học
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 rounded-full bg-red-500/15 text-red-600 dark:text-red-400 font-bold flex items-center gap-1 border border-red-500/10">
                              <XCircle className="w-3 h-3" /> Vắng mặt
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                    {attendances.length === 0 && (
                      <p className="text-center py-6 text-neutral-400 italic text-xs">Chưa ghi nhận điểm danh.</p>
                    )}
                  </div>
                </div>
              </div>
            </>
          ) : (() => {
            const classObj = classes.find(c => c.classId === selectedClassId);
            const classGrades = grades.filter(g => g.classId === selectedClassId);
            const classAttendances = attendances.filter(a => a.classId === selectedClassId);

            return (
              /* Drilled-down Class Details view */
              <div className="p-6 rounded-3xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-lg space-y-6 animate-fade-in relative">
                <button
                  onClick={() => setSelectedClassId("")}
                  className="absolute right-6 top-6 p-2 rounded-xl text-neutral-400 hover:text-neutral-600 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-850 cursor-pointer transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>

                <div className="space-y-2 border-b border-neutral-100 dark:border-neutral-850 pb-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="px-2.5 py-0.5 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold text-xs font-mono">
                      {selectedClassId}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 font-extrabold text-[11px] uppercase tracking-wider flex items-center gap-1">
                      <Award className="w-3.5 h-3.5" /> Xếp hạng trong lớp: #{classObj?.rank || "—"}/{classObj?.totalStudents || "—"} học sinh
                    </span>
                  </div>
                  <h2 className="text-2xl font-extrabold text-neutral-900 dark:text-white">{classObj?.className}</h2>
                  <p className="text-sm text-neutral-500 font-semibold">
                    Giáo viên: {classObj?.teacherName} | Lịch học: {classObj?.schedule}
                  </p>
                  <div className="flex items-center gap-2.5 mt-2">
                    <span className="text-xs text-neutral-400 font-bold uppercase">Tiến độ chương trình học:</span>
                    <div className="w-48 bg-neutral-200 dark:bg-neutral-850 rounded-full h-2 overflow-hidden">
                      <div className="bg-green-500 h-full rounded-full" style={{ width: `${classObj?.progressPercent || 0}%` }} />
                    </div>
                    <span className="text-xs font-extrabold">{Math.round(classObj?.progressPercent || 0)}%</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                  {/* Left section: Grades history and details (2 cols) */}
                  <div className="lg:col-span-2 space-y-6">
                    {/* Curriculum progress syllabus topics log */}
                    <div className="p-6 rounded-2xl bg-neutral-50/50 dark:bg-neutral-900/30 border border-neutral-250 dark:border-neutral-800 space-y-4">
                      <h3 className="text-sm font-extrabold text-neutral-950 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                        <BookOpen className="w-4.5 h-4.5 text-blue-500" /> Tiến độ chương trình chi tiết
                      </h3>
                      {curriculumProgress.length === 0 ? (
                        <p className="text-xs text-neutral-500 italic">Không có thông tin lộ trình giảng dạy.</p>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {curriculumProgress.map((prog, idx) => (
                            <div key={idx} className="p-3 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-100 dark:border-neutral-850 flex items-center justify-between">
                              <div className="space-y-0.5">
                                <p className="text-xs font-bold text-neutral-900 dark:text-white leading-relaxed">{prog.topicName}</p>
                                <span className={`text-[9px] px-1.5 py-0.5 rounded font-extrabold uppercase ${
                                  prog.status === "Đã dạy" 
                                    ? "bg-green-500/10 text-green-600 dark:text-green-400"
                                    : "bg-neutral-500/10 text-neutral-500"
                                }`}>
                                  {prog.status || "Chưa dạy"}
                                </span>
                              </div>
                              <div className="text-right">
                                <span className="text-xs font-bold text-neutral-900 dark:text-white">{prog.progressPercent}%</span>
                                <div className="w-12 bg-neutral-200 dark:bg-neutral-800 rounded-full h-1 mt-1 overflow-hidden">
                                  <div className="bg-blue-600 h-full rounded-full" style={{ width: `${prog.progressPercent}%` }} />
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Class Grades List */}
                    <div className="space-y-4">
                      <h3 className="text-sm font-extrabold text-neutral-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                        <Award className="w-4.5 h-4.5 text-blue-500" /> Nhật ký điểm kiểm tra
                      </h3>
                      {classGrades.map((g) => (
                        <div key={g.recordId} className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 space-y-2.5">
                          <div className="flex justify-between items-center border-b border-neutral-100 dark:border-neutral-850 pb-2">
                            <span className="font-bold text-sm text-neutral-900 dark:text-white">{g.assignmentName}</span>
                            <span className="px-2.5 py-1 rounded bg-blue-600 text-white text-xs font-extrabold">
                              {g.grade.toFixed(1)} / 10
                            </span>
                          </div>
                          <div className="text-xs font-medium text-neutral-600 dark:text-neutral-400 bg-neutral-50 dark:bg-neutral-950 p-2.5 rounded-lg">
                            <p className="font-bold text-[10px] text-neutral-400 uppercase mb-1">Giáo viên nhận xét:</p>
                            <MathRenderer text={g.feedback} />
                          </div>
                        </div>
                      ))}
                      {classGrades.length === 0 && (
                        <p className="text-center py-6 text-neutral-400 text-xs italic">Lớp học này chưa ghi nhận đầu điểm nào.</p>
                      )}
                    </div>
                  </div>

                  {/* Right section: Attendance log (1 col) */}
                  <div className="lg:col-span-1 space-y-6">
                    <div className="p-6 rounded-2xl bg-neutral-50/50 dark:bg-neutral-900/30 border border-neutral-250 dark:border-neutral-800 space-y-4">
                      <h3 className="text-sm font-extrabold text-neutral-950 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                        <BellRing className="w-4.5 h-4.5 text-blue-500" /> Điểm danh lớp học
                      </h3>
                      <div className="space-y-3.5 max-h-[22rem] overflow-y-auto pr-1">
                        {classAttendances.map((att) => (
                          <div key={att.attendanceId} className="flex justify-between items-center text-xs p-2.5 bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-850 rounded-xl">
                            <div>
                              <p className="font-bold text-neutral-900 dark:text-white">Buổi thứ {att.sessionNumber}</p>
                              <p className="text-neutral-400 font-mono text-[10px]">{att.date}</p>
                            </div>
                            <div>
                              {att.status === "P" ? (
                                <span className="px-2 py-0.5 rounded-full bg-green-500/10 text-green-600 dark:text-green-400 font-bold border border-green-500/10">Đi học</span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-600 font-bold border border-rose-500/10">Vắng</span>
                              )}
                            </div>
                          </div>
                        ))}
                        {classAttendances.length === 0 && (
                          <p className="text-center text-xs text-neutral-400 py-4">Chưa có bản ghi điểm danh nào.</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* FINANCE TAB */}
      {activeTab === "finance" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start animate-fade-in">
          {/* Outstanding tuition details (2 cols) */}
          <div className="lg:col-span-2 space-y-6">
            <div className="p-6 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-4">
              <h3 className="text-lg font-bold text-neutral-900 dark:text-white flex items-center gap-2 border-b border-neutral-100 dark:border-neutral-800/50 pb-4">
                <CreditCard className="w-5 h-5 text-blue-500" /> Bảng Kê Học Phí Chưa Đóng Chi Tiết
              </h3>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm min-w-[600px]">
                  <thead>
                    <tr className="border-b border-neutral-200 dark:border-neutral-800 text-xs font-bold text-neutral-500 uppercase">
                      <th className="pb-3">Lớp học</th>
                      <th className="pb-3 text-center">Số buổi dạy</th>
                      <th className="pb-3 text-right">Tổng phát sinh</th>
                      <th className="pb-3 text-right">Đã thanh toán</th>
                      <th className="pb-3 text-right text-rose-500">Còn nợ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800 text-neutral-700 dark:text-neutral-300">
                    {tuitionData?.breakdown?.map((item: any, idx: number) => (
                      <tr key={idx} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/10">
                        <td className="py-4">
                          <p className="font-bold text-neutral-900 dark:text-white">{item.className}</p>
                          <span className="text-xs font-mono text-neutral-400">{item.classId} | {item.status}</span>
                        </td>
                        <td className="py-4 text-center font-semibold">{item.sessionsCount} buổi</td>
                        <td className="py-4 text-right font-medium">{item.totalCharged?.toLocaleString("vi-VN")} đ</td>
                        <td className="py-4 text-right font-medium text-green-600 dark:text-green-400">{item.totalPaid?.toLocaleString("vi-VN")} đ</td>
                        <td className="py-4 text-right font-bold text-rose-500">
                          {item.classDebt > 0 ? `${item.classDebt.toLocaleString("vi-VN")} đ` : "0 đ"}
                        </td>
                      </tr>
                    ))}
                    {(!tuitionData?.breakdown || tuitionData.breakdown.length === 0) && (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-neutral-400 italic">Không tìm thấy thông tin công nợ.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Payment VietQR sidebar (1 col) */}
          <div className="lg:col-span-1 space-y-6">
            <div className="p-6 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-5 text-center">
              <h3 className="text-sm font-bold text-neutral-400 uppercase tracking-wider text-left flex items-center gap-1.5">
                <Sparkles className="w-4.5 h-4.5 text-blue-500" /> Tổng công nợ hiện tại
              </h3>
              
              <div className="text-left py-2">
                <p className="text-3xl font-extrabold text-neutral-900 dark:text-white">
                  {tuitionData?.totalDebt ? `${tuitionData.totalDebt.toLocaleString("vi-VN")} đ` : "0 đ"}
                </p>
                <p className="text-xs text-neutral-500 mt-1">Quét mã VietQR dưới đây để thanh toán nhanh online.</p>
              </div>

              {tuitionData?.totalDebt > 0 ? (
                <div className="space-y-4">
                  <div className="p-3 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-850 rounded-2xl flex justify-center shadow-inner">
                    <img 
                      src={`https://img.vietqr.io/image/MB-0385717738-compact2.png?amount=${tuitionData.totalDebt}&addInfo=UPGRID%20${user?.refId}&accountName=NGUYEN%20TUAN%20ANH`} 
                      alt="VietQR MBBank payment code"
                      className="max-w-[220px] rounded-xl"
                    />
                  </div>
                  <div className="text-xs text-neutral-500 space-y-1 text-left">
                    <p>● Ngân hàng: <span className="font-bold text-neutral-800 dark:text-neutral-200">MBBank</span></p>
                    <p>● Số tài khoản: <span className="font-bold text-neutral-800 dark:text-neutral-200">0385717738</span></p>
                    <p>● Chủ tài khoản: <span className="font-bold text-neutral-800 dark:text-neutral-200">NGUYEN TUAN ANH</span></p>
                    <p>● Nội dung chuyển khoản: <span className="font-mono font-bold text-blue-600 dark:text-blue-400 uppercase">UPGRID {user?.refId}</span></p>
                  </div>
                </div>
              ) : (
                <div className="py-8 space-y-2 flex flex-col items-center">
                  <CheckCircle className="w-12 h-12 text-green-500" />
                  <p className="text-sm font-bold text-green-600 dark:text-green-400">Bạn đã hoàn thành đủ học phí!</p>
                  <p className="text-xs text-neutral-400">Xin chân thành cảm ơn sự đồng hành của bạn.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* FEEDBACK & EVALUATIONS TAB */}
      {activeTab === "feedback" && (
        <div className="max-w-2xl mx-auto p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm space-y-6 animate-fade-in">
          <div>
            <h3 className="text-lg font-bold text-neutral-900 dark:text-white flex items-center gap-2 border-b border-neutral-100 dark:border-neutral-800/50 pb-4">
              <MessageSquare className="w-5 h-5 text-blue-500" /> Ý Kiến Đóng Góp & Đánh Giá Giáo Viên
            </h3>
            <p className="text-xs text-neutral-500 mt-1.5">
              Phản hồi trực tiếp tới trung tâm về chất lượng giảng dạy hoặc các đề xuất cải thiện cơ sở vật chất, giáo trình.
            </p>
          </div>

          {feedbackMessage && (
            <div 
              className={`p-4 rounded-xl flex items-center gap-3 border text-sm font-medium ${
                feedbackMessage.type === "success" 
                  ? "bg-green-500/10 border-green-500/20 text-green-600 dark:text-green-400" 
                  : "bg-red-500/10 border-red-500/20 text-red-600 dark:text-red-400"
              }`}
            >
              {feedbackMessage.type === "success" ? <CheckCircle className="w-5 h-5 flex-shrink-0" /> : <XCircle className="w-5 h-5 flex-shrink-0" />}
              <span>{feedbackMessage.text}</span>
            </div>
          )}

          <form onSubmit={handleFeedbackSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-neutral-500 uppercase mb-1">Lớp học cần đánh giá</label>
              <select
                required
                value={feedbackClassId}
                onChange={(e) => setFeedbackClassId(e.target.value)}
                className="w-full px-3 py-2 border rounded-xl bg-neutral-50 dark:bg-neutral-950 border-neutral-300 dark:border-neutral-700 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value="">-- Chọn lớp học --</option>
                {classes.map((cls) => (
                  <option key={cls.classId} value={cls.classId}>
                    {cls.className} ({cls.teacherName})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-500 uppercase mb-1">Đánh giá mức độ hài lòng (1 - 5 sao)</label>
              <div className="flex gap-2">
                {["1", "2", "3", "4", "5"].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setRating(val)}
                    className={`p-2.5 rounded-lg border text-sm font-extrabold flex items-center gap-1.5 transition-colors cursor-pointer ${
                      rating === val 
                        ? "bg-amber-500 border-amber-600 text-white shadow-sm"
                        : "bg-neutral-50 hover:bg-neutral-100 dark:bg-neutral-850 dark:border-neutral-800 text-neutral-600"
                    }`}
                  >
                    <Star className="w-4 h-4 fill-current" /> {val}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-500 uppercase mb-1">Nhận xét về giáo viên phụ trách</label>
              <textarea
                rows={4}
                required
                value={teacherComment}
                onChange={(e) => setTeacherComment(e.target.value)}
                className="w-full px-3 py-2 border rounded-xl bg-neutral-50 dark:bg-neutral-950 border-neutral-300 dark:border-neutral-700 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                placeholder="Cô giảng bài chi tiết và rất nhiệt tình hỗ trợ giải đáp bài tập về nhà..."
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-500 uppercase mb-1">Ý kiến đóng góp chung cho trung tâm (Nếu có)</label>
              <textarea
                rows={3}
                value={suggestion}
                onChange={(e) => setSuggestion(e.target.value)}
                className="w-full px-3 py-2 border rounded-xl bg-neutral-50 dark:bg-neutral-950 border-neutral-300 dark:border-neutral-700 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                placeholder="Em đề xuất trung tâm bổ sung thêm tài liệu chuyên đề hình học nâng cao..."
              />
            </div>

            <button
              type="submit"
              disabled={submittingFeedback}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {submittingFeedback ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-4.5 h-4.5" />}
              Gửi Phản Hồi Ý Kiến
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
