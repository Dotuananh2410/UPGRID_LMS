"use client";

import React, { useState } from "react";
import useSWR from "swr";
import { requestGas } from "@/utils/apiClient";
import { Student, Teacher, Class } from "@/types/lms";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { 
  Users, UserCheck, BookOpen, UserPlus, 
  Plus, Calendar, Mail, Phone, Lock, 
  Tag, Award, Loader2, AlertCircle, CheckCircle2 
} from "lucide-react";

export default function AdminPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"overview" | "students" | "teachers" | "classes">("overview");

  // Redirect if not ADMIN
  if (user && user.role !== "ADMIN") {
    router.push(user.role === "GIAO_VIEN" ? "/teacher" : "/student");
    return null;
  }

  // Fetch lists via SWR
  const { data: students = [], error: errStd, mutate: mutateStd } = useSWR("getStudents", () => 
    requestGas<Student[]>("getStudents")
  );
  
  const { data: teachers = [], error: errTch, mutate: mutateTch } = useSWR("getTeachers", () => 
    requestGas<Teacher[]>("getTeachers")
  );
  
  const { data: classes = [], error: errCls, mutate: mutateCls } = useSWR("getClasses", () => 
    requestGas<Class[]>("getClasses")
  );

  // Loading States
  const loading = !errStd && !students.length && !errTch && !teachers.length && !errCls && !classes.length;

  // Form States & Loading Statuses
  const [submittingStd, setSubmittingStd] = useState(false);
  const [submittingTch, setSubmittingTch] = useState(false);
  const [submittingCls, setSubmittingCls] = useState(false);
  const [submittingEnr, setSubmittingEnr] = useState(false);

  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Forms inputs
  const [stdForm, setStdForm] = useState({ fullName: "", email: "", password: "", parentEmail: "", parentPhone: "" });
  const [tchForm, setTchForm] = useState({ fullName: "", email: "", password: "" });
  const [clsForm, setClsForm] = useState({ className: "", schedule: "", teacherId: "" });
  const [enrForm, setEnrForm] = useState({ classId: "", studentId: "" });

  const showMessage = (type: "success" | "error", text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  // Add Student Handler
  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingStd(true);
    try {
      const res = await requestGas<{ studentId: string }>("createStudent", {
        method: "POST",
        body: stdForm
      });
      showMessage("success", `Tạo học viên thành công! ID: ${res.studentId}`);
      setStdForm({ fullName: "", email: "", password: "", parentEmail: "", parentPhone: "" });
      mutateStd();
    } catch (err: any) {
      showMessage("error", err.message || "Lỗi tạo học viên");
    } finally {
      setSubmittingStd(false);
    }
  };

  // Add Teacher Handler
  const handleAddTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingTch(true);
    try {
      const res = await requestGas<{ teacherId: string }>("createTeacher", {
        method: "POST",
        body: tchForm
      });
      showMessage("success", `Tạo giáo viên thành công! ID: ${res.teacherId}`);
      setTchForm({ fullName: "", email: "", password: "" });
      mutateTch();
    } catch (err: any) {
      showMessage("error", err.message || "Lỗi tạo giáo viên");
    } finally {
      setSubmittingTch(false);
    }
  };

  // Add Class Handler
  const handleAddClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clsForm.teacherId) {
      showMessage("error", "Vui lòng chọn giáo viên");
      setSubmittingCls(false);
      return;
    }
    setSubmittingCls(true);
    try {
      const res = await requestGas<{ classId: string }>("createClass", {
        method: "POST",
        body: clsForm
      });
      showMessage("success", `Tạo lớp học thành công! ID: ${res.classId}`);
      setClsForm({ className: "", schedule: "", teacherId: "" });
      mutateCls();
    } catch (err: any) {
      showMessage("error", err.message || "Lỗi tạo lớp học");
    } finally {
      setSubmittingCls(false);
    }
  };

  // Enroll Student Handler
  const handleEnrollStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!enrForm.classId || !enrForm.studentId) {
      showMessage("error", "Vui lòng chọn đầy đủ lớp và học viên");
      return;
    }
    setSubmittingEnr(true);
    try {
      await requestGas("enrollStudent", {
        method: "POST",
        body: enrForm
      });
      showMessage("success", "Ghi danh học viên vào lớp thành công!");
      setEnrForm({ classId: "", studentId: "" });
    } catch (err: any) {
      showMessage("error", err.message || "Lỗi ghi danh");
    } finally {
      setSubmittingEnr(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 flex flex-col space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-neutral-200 dark:border-neutral-800 pb-5">
        <div>
          <h1 className="text-3xl font-extrabold text-neutral-900 dark:text-white tracking-tight">
            Trang Quản Trị Hệ Thống
          </h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
            Quản lý tài khoản học viên, giáo viên, tạo lớp học và ghi danh học sinh.
          </p>
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

      {/* Tabs */}
      <div className="flex border-b border-neutral-200 dark:border-neutral-800 space-x-2">
        {(["overview", "students", "teachers", "classes"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2.5 text-sm font-bold border-b-2 capitalize transition-colors cursor-pointer ${
              activeTab === tab 
                ? "border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400" 
                : "border-transparent text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200"
            }`}
          >
            {tab === "overview" ? "Tổng quan" : tab === "students" ? "Học viên" : tab === "teachers" ? "Giáo viên" : "Lớp học & Ghi danh"}
          </button>
        ))}
      </div>

      {/* Loader */}
      {loading ? (
        <div className="flex-1 flex flex-col items-center justify-center py-16">
          <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
          <p className="mt-4 text-sm font-medium text-neutral-500">Đang đồng bộ dữ liệu từ Google Sheets...</p>
        </div>
      ) : (
        <div className="flex-1">
          {/* OVERVIEW TAB */}
          {activeTab === "overview" && (
            <div className="space-y-8 animate-fade-in">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-6 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-neutral-500 uppercase tracking-wider">Học Viên</p>
                    <p className="text-3xl font-extrabold text-neutral-900 dark:text-white">{students.length}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-blue-500/10 text-blue-600"><Users className="w-6 h-6" /></div>
                </div>

                <div className="p-6 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-neutral-500 uppercase tracking-wider">Giáo Viên</p>
                    <p className="text-3xl font-extrabold text-neutral-900 dark:text-white">{teachers.length}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-blue-500/10 text-blue-600"><UserCheck className="w-6 h-6" /></div>
                </div>

                <div className="p-6 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-neutral-500 uppercase tracking-wider">Lớp Học</p>
                    <p className="text-3xl font-extrabold text-neutral-900 dark:text-white">{classes.length}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-blue-500/10 text-blue-600"><BookOpen className="w-6 h-6" /></div>
                </div>
              </div>

              {/* General guide */}
              <div className="p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm space-y-4">
                <h3 className="text-lg font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                  <Tag className="w-5 h-5 text-blue-500" /> Hướng dẫn nhanh quản trị
                </h3>
                <ul className="list-disc pl-5 space-y-2 text-sm text-neutral-600 dark:text-neutral-400">
                  <li><strong>Tạo học viên / giáo viên:</strong> Chuyển sang tab Học Viên hoặc Giáo Viên, sử dụng biểu mẫu thêm mới. Mật khẩu mặc định sẽ được băm SHA-256 an toàn và đồng bộ vào Sheet.</li>
                  <li><strong>Tạo lớp học mới:</strong> Thêm thông tin phòng học, giờ học và phân công một giáo viên đứng lớp.</li>
                  <li><strong>Ghi danh:</strong> Để học sinh có quyền truy cập thông tin bài học và bảng điểm, hãy ghi danh học sinh đó vào lớp học tương ứng ở Tab Lớp Học.</li>
                </ul>
              </div>
            </div>
          )}

          {/* STUDENTS TAB */}
          {activeTab === "students" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in">
              {/* Form Add */}
              <div className="lg:col-span-1 p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm space-y-6 self-start">
                <h3 className="text-lg font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-blue-500" /> Thêm Học Viên Mới
                </h3>

                <form onSubmit={handleAddStudent} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-neutral-500 uppercase mb-1">Họ và tên</label>
                    <input 
                      type="text" 
                      required
                      value={stdForm.fullName}
                      onChange={(e) => setStdForm({ ...stdForm, fullName: e.target.value })}
                      className="w-full px-3 py-2 border rounded-xl bg-neutral-50 dark:bg-neutral-950 border-neutral-300 dark:border-neutral-700 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      placeholder="Nguyễn Văn A"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-neutral-500 uppercase mb-1">Email</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-2.5 w-4.5 h-4.5 text-neutral-400" />
                      <input 
                        type="email" 
                        required
                        value={stdForm.email}
                        onChange={(e) => setStdForm({ ...stdForm, email: e.target.value })}
                        className="w-full pl-10 pr-3 py-2 border rounded-xl bg-neutral-50 dark:bg-neutral-950 border-neutral-300 dark:border-neutral-700 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        placeholder="hocvien@upgrid.edu.vn"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-neutral-500 uppercase mb-1">Mật khẩu ban đầu</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-2.5 w-4.5 h-4.5 text-neutral-400" />
                      <input 
                        type="text"
                        required
                        value={stdForm.password}
                        onChange={(e) => setStdForm({ ...stdForm, password: e.target.value })}
                        className="w-full pl-10 pr-3 py-2 border rounded-xl bg-neutral-50 dark:bg-neutral-950 border-neutral-300 dark:border-neutral-700 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        placeholder="Mật khẩu mặc định"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-neutral-500 uppercase mb-1">Email Phụ huynh</label>
                    <input 
                      type="email" 
                      value={stdForm.parentEmail}
                      onChange={(e) => setStdForm({ ...stdForm, parentEmail: e.target.value })}
                      className="w-full px-3 py-2 border rounded-xl bg-neutral-50 dark:bg-neutral-950 border-neutral-300 dark:border-neutral-700 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      placeholder="phuhuynh@gmail.com"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-neutral-500 uppercase mb-1">Số điện thoại Phụ huynh</label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-2.5 w-4.5 h-4.5 text-neutral-400" />
                      <input 
                        type="text" 
                        value={stdForm.parentPhone}
                        onChange={(e) => setStdForm({ ...stdForm, parentPhone: e.target.value })}
                        className="w-full pl-10 pr-3 py-2 border rounded-xl bg-neutral-50 dark:bg-neutral-950 border-neutral-300 dark:border-neutral-700 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        placeholder="09XXXXXXXX"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={submittingStd}
                    className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md transition-colors flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {submittingStd ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4.5 h-4.5" />}
                    Tạo Tài Khoản Học Viên
                  </button>
                </form>
              </div>

              {/* Table List */}
              <div className="lg:col-span-2 p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm overflow-x-auto">
                <h3 className="text-lg font-bold text-neutral-900 dark:text-white mb-4">
                  Danh sách học sinh ({students.length})
                </h3>
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-neutral-200 dark:border-neutral-800 text-xs font-bold text-neutral-500 uppercase tracking-wider">
                      <th className="pb-3">Mã HV</th>
                      <th className="pb-3">Họ và tên</th>
                      <th className="pb-3">Email</th>
                      <th className="pb-3">Email PH</th>
                      <th className="pb-3">SĐT PH</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800 text-sm text-neutral-700 dark:text-neutral-300">
                    {students.map((std) => (
                      <tr key={std.studentId} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/10">
                        <td className="py-3.5 font-mono text-xs font-bold">{std.studentId}</td>
                        <td className="py-3.5 font-bold text-neutral-900 dark:text-white">{std.fullName}</td>
                        <td className="py-3.5 select-all">{std.email}</td>
                        <td className="py-3.5">{std.parentEmail || "—"}</td>
                        <td className="py-3.5 font-mono">{std.parentPhone || "—"}</td>
                      </tr>
                    ))}
                    {students.length === 0 && (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-neutral-400 font-medium">Chưa có học viên nào</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TEACHERS TAB */}
          {activeTab === "teachers" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in">
              {/* Form Add */}
              <div className="lg:col-span-1 p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm space-y-6 self-start">
                <h3 className="text-lg font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-blue-500" /> Thêm Giáo Viên Mới
                </h3>

                <form onSubmit={handleAddTeacher} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-neutral-500 uppercase mb-1">Họ và tên</label>
                    <input 
                      type="text" 
                      required
                      value={tchForm.fullName}
                      onChange={(e) => setTchForm({ ...tchForm, fullName: e.target.value })}
                      className="w-full px-3 py-2 border rounded-xl bg-neutral-50 dark:bg-neutral-950 border-neutral-300 dark:border-neutral-700 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      placeholder="Cô Nguyễn Thanh Hà"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-neutral-500 uppercase mb-1">Email</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-2.5 w-4.5 h-4.5 text-neutral-400" />
                      <input 
                        type="email" 
                        required
                        value={tchForm.email}
                        onChange={(e) => setTchForm({ ...tchForm, email: e.target.value })}
                        className="w-full pl-10 pr-3 py-2 border rounded-xl bg-neutral-50 dark:bg-neutral-950 border-neutral-300 dark:border-neutral-700 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        placeholder="teacher@upgrid.edu.vn"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-neutral-500 uppercase mb-1">Mật khẩu ban đầu</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-2.5 w-4.5 h-4.5 text-neutral-400" />
                      <input 
                        type="text"
                        required
                        value={tchForm.password}
                        onChange={(e) => setTchForm({ ...tchForm, password: e.target.value })}
                        className="w-full pl-10 pr-3 py-2 border rounded-xl bg-neutral-50 dark:bg-neutral-950 border-neutral-300 dark:border-neutral-700 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        placeholder="Mật khẩu mặc định"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={submittingTch}
                    className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md transition-colors flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {submittingTch ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4.5 h-4.5" />}
                    Tạo Tài Khoản Giáo Viên
                  </button>
                </form>
              </div>

              {/* Table List */}
              <div className="lg:col-span-2 p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm overflow-x-auto">
                <h3 className="text-lg font-bold text-neutral-900 dark:text-white mb-4">
                  Danh sách giáo viên ({teachers.length})
                </h3>
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-neutral-200 dark:border-neutral-800 text-xs font-bold text-neutral-500 uppercase tracking-wider">
                      <th className="pb-3">Mã GV</th>
                      <th className="pb-3">Họ và tên</th>
                      <th className="pb-3">Email</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800 text-sm text-neutral-700 dark:text-neutral-300">
                    {teachers.map((tch) => (
                      <tr key={tch.teacherId} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/10">
                        <td className="py-3.5 font-mono text-xs font-bold">{tch.teacherId}</td>
                        <td className="py-3.5 font-bold text-neutral-900 dark:text-white">{tch.fullName}</td>
                        <td className="py-3.5 select-all">{tch.email}</td>
                      </tr>
                    ))}
                    {teachers.length === 0 && (
                      <tr>
                        <td colSpan={3} className="py-8 text-center text-neutral-400 font-medium">Chưa có giáo viên nào</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* CLASSES & ENROLLMENT TAB */}
          {activeTab === "classes" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in">
              {/* Left Column: Form Add Class & Enrollment Form */}
              <div className="lg:col-span-1 space-y-6">
                
                {/* Form Create Class */}
                <div className="p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm space-y-6">
                  <h3 className="text-lg font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-blue-500" /> Tạo Lớp Học Mới
                  </h3>

                  <form onSubmit={handleAddClass} className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-neutral-500 uppercase mb-1">Tên lớp học</label>
                      <input 
                        type="text" 
                        required
                        value={clsForm.className}
                        onChange={(e) => setClsForm({ ...clsForm, className: e.target.value })}
                        className="w-full px-3 py-2 border rounded-xl bg-neutral-50 dark:bg-neutral-950 border-neutral-300 dark:border-neutral-700 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        placeholder="Toán Nâng Cao Lớp 9"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-neutral-500 uppercase mb-1">Lịch học</label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-2.5 w-4.5 h-4.5 text-neutral-400" />
                        <input 
                          type="text" 
                          required
                          value={clsForm.schedule}
                          onChange={(e) => setClsForm({ ...clsForm, schedule: e.target.value })}
                          className="w-full pl-10 pr-3 py-2 border rounded-xl bg-neutral-50 dark:bg-neutral-950 border-neutral-300 dark:border-neutral-700 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                          placeholder="Thứ 3 (18:00 - 20:00) & Thứ 7"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-neutral-500 uppercase mb-1">Giáo viên phụ trách</label>
                      <select 
                        required
                        value={clsForm.teacherId}
                        onChange={(e) => setClsForm({ ...clsForm, teacherId: e.target.value })}
                        className="w-full px-3 py-2 border rounded-xl bg-neutral-50 dark:bg-neutral-950 border-neutral-300 dark:border-neutral-700 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      >
                        <option value="">-- Chọn giáo viên --</option>
                        {teachers.map((t) => (
                          <option key={t.teacherId} value={t.teacherId}>{t.fullName}</option>
                        ))}
                      </select>
                    </div>

                    <button
                      type="submit"
                      disabled={submittingCls}
                      className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md transition-colors flex items-center justify-center gap-2 cursor-pointer"
                    >
                      {submittingCls ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4.5 h-4.5" />}
                      Tạo Lớp Học
                    </button>
                  </form>
                </div>

                {/* Form Enroll Student */}
                <div className="p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm space-y-6">
                  <h3 className="text-lg font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                    <Award className="w-5 h-5 text-blue-500" /> Ghi Danh Học Viên
                  </h3>

                  <form onSubmit={handleEnrollStudent} className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-neutral-500 uppercase mb-1">Lớp học</label>
                      <select 
                        required
                        value={enrForm.classId}
                        onChange={(e) => setEnrForm({ ...enrForm, classId: e.target.value })}
                        className="w-full px-3 py-2 border rounded-xl bg-neutral-50 dark:bg-neutral-950 border-neutral-300 dark:border-neutral-700 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      >
                        <option value="">-- Chọn lớp học --</option>
                        {classes.map((c) => (
                          <option key={c.classId} value={c.classId}>{c.className}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-neutral-500 uppercase mb-1">Học sinh</label>
                      <select 
                        required
                        value={enrForm.studentId}
                        onChange={(e) => setEnrForm({ ...enrForm, studentId: e.target.value })}
                        className="w-full px-3 py-2 border rounded-xl bg-neutral-50 dark:bg-neutral-950 border-neutral-300 dark:border-neutral-700 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      >
                        <option value="">-- Chọn học sinh --</option>
                        {students.map((s) => (
                          <option key={s.studentId} value={s.studentId}>{s.fullName} ({s.studentId})</option>
                        ))}
                      </select>
                    </div>

                    <button
                      type="submit"
                      disabled={submittingEnr}
                      className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md transition-colors flex items-center justify-center gap-2 cursor-pointer"
                    >
                      {submittingEnr ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4.5 h-4.5" />}
                      Ghi Danh Vào Lớp
                    </button>
                  </form>
                </div>

              </div>

              {/* Right Column: Classes Table List */}
              <div className="lg:col-span-2 p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm overflow-x-auto self-start">
                <h3 className="text-lg font-bold text-neutral-900 dark:text-white mb-4">
                  Danh sách lớp học ({classes.length})
                </h3>
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-neutral-200 dark:border-neutral-800 text-xs font-bold text-neutral-500 uppercase tracking-wider">
                      <th className="pb-3">Mã Lớp</th>
                      <th className="pb-3">Tên lớp</th>
                      <th className="pb-3">Giáo viên phụ trách</th>
                      <th className="pb-3">Lịch học</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800 text-sm text-neutral-700 dark:text-neutral-300">
                    {classes.map((cls) => (
                      <tr key={cls.classId} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/10">
                        <td className="py-3.5 font-mono text-xs font-bold">{cls.classId}</td>
                        <td className="py-3.5 font-bold text-neutral-900 dark:text-white">{cls.className}</td>
                        <td className="py-3.5">{cls.teacherName}</td>
                        <td className="py-3.5">{cls.schedule}</td>
                      </tr>
                    ))}
                    {classes.length === 0 && (
                      <tr>
                        <td colSpan={4} className="py-8 text-center text-neutral-400 font-medium">Chưa có lớp học nào</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
