"use client";

import React from "react";
import useSWR from "swr";
import { requestGas } from "@/utils/apiClient";
import { StudentDashboard } from "@/types/lms";
import { useAuth } from "@/context/AuthContext";
import MathRenderer from "@/components/MathRenderer";
import { 
  BookOpen, Calendar, Award, 
  TrendingUp, CheckCircle, XCircle, 
  Loader2, BellRing, ClipboardList
} from "lucide-react";

export default function StudentPage() {
  const { user } = useAuth();

  // 1. Fetch Student Dashboard Data
  // Automatically attaches user's token and reads their dashboard
  const { data: dashboard, error, mutate } = useSWR(
    user ? `getStudentDashboard/${user.refId}` : null,
    () => requestGas<StudentDashboard>("getStudentDashboard")
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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 flex flex-col space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-neutral-200 dark:border-neutral-800 pb-5">
        <div>
          <h1 className="text-3xl font-extrabold text-neutral-900 dark:text-white tracking-tight">
            Dashboard Học Viên
          </h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
            Chào mừng quay lại, <span className="font-bold text-blue-600 dark:text-blue-400">{user?.fullName}</span>. Theo dõi lịch học, chuyên cần và bảng điểm chi tiết.
          </p>
        </div>
      </div>

      {/* KPI Statistic Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Classes Card */}
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

        {/* Chuyên Cần Card */}
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

        {/* Điểm GPA Card */}
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

      {/* Main Grid Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* Left Side: Grades (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Grades Card */}
          <div className="p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm space-y-6">
            <h2 className="text-lg font-bold text-neutral-900 dark:text-white flex items-center gap-2 border-b border-neutral-100 dark:border-neutral-800/50 pb-4">
              <Award className="w-5 h-5 text-blue-500" /> Bảng Điểm & Nhận Xét Chi Tiết
            </h2>

            <div className="space-y-6">
              {grades.map((grd) => (
                <div 
                  key={grd.recordId}
                  className="p-5 rounded-xl border border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-950/20 space-y-3"
                >
                  <div className="flex flex-wrap justify-between items-center gap-2 border-b border-neutral-100 dark:border-neutral-800/50 pb-2">
                    <div>
                      <span className="text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full mr-2">
                        {grd.className}
                      </span>
                      <span className="font-bold text-neutral-950 dark:text-white text-sm">
                        {grd.assignmentName}
                      </span>
                    </div>
                    <div className="text-lg font-extrabold text-blue-600 dark:text-blue-400 bg-white dark:bg-neutral-900 px-3.5 py-1 rounded-lg border border-neutral-200 dark:border-neutral-800 shadow-sm">
                      {grd.grade.toFixed(1)} / 10
                    </div>
                  </div>
                  
                  {/* Grade Feedback with KaTeX rendering */}
                  <div className="space-y-1">
                    <span className="text-xs font-bold text-neutral-400 uppercase block">Giáo viên nhận xét:</span>
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
                <div className="text-center py-12 rounded-xl border border-dashed border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-950/20">
                  <ClipboardList className="w-10 h-10 text-neutral-400 mx-auto mb-2" />
                  <p className="text-sm font-medium text-neutral-500">Chưa ghi nhận đầu điểm nào.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Side: Schedules & Attendances (1 col) */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* Schedules list */}
          <div className="p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm space-y-4">
            <h2 className="text-lg font-bold text-neutral-900 dark:text-white flex items-center gap-2 border-b border-neutral-100 dark:border-neutral-800/50 pb-4">
              <Calendar className="w-5 h-5 text-blue-500" /> Lịch Học Lớp Enrolled
            </h2>
            
            <div className="space-y-3.5">
              {classes.map((cls) => (
                <div key={cls.classId} className="space-y-1">
                  <h4 className="font-bold text-sm text-neutral-900 dark:text-white">{cls.className}</h4>
                  <p className="text-xs text-neutral-500 font-medium">Giáo viên: {cls.teacherName}</p>
                  <p className="text-xs text-blue-600 dark:text-blue-400 font-bold bg-blue-500/5 dark:bg-blue-500/10 px-2.5 py-1.5 rounded-lg border border-blue-500/10">
                    {cls.schedule}
                  </p>
                </div>
              ))}
              
              {classes.length === 0 && (
                <p className="text-sm text-neutral-400 italic">Chưa được ghi danh lớp nào.</p>
              )}
            </div>
          </div>

          {/* Attendances history list */}
          <div className="p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm space-y-4">
            <h2 className="text-lg font-bold text-neutral-900 dark:text-white flex items-center gap-2 border-b border-neutral-100 dark:border-neutral-800/50 pb-4">
              <BellRing className="w-5 h-5 text-blue-500" /> Nhật Ký Chuyên Cần
            </h2>

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
                <p className="text-center text-xs text-neutral-400 py-6">Chưa có nhật ký điểm danh.</p>
              )}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
