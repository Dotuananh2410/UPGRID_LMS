"use client";

import React, { useState } from "react";
import useSWR from "swr";
import { requestGas } from "@/utils/apiClient";
import { Student, Teacher, Class } from "@/types/lms";
import { useAuth } from "@/context/AuthContext";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";
import { 
  Users, UserCheck, BookOpen, UserPlus, 
  Plus, Calendar, Mail, Phone, Lock, 
  Tag, Award, Loader2, AlertCircle, CheckCircle2, X 
} from "lucide-react";

function AdminPageContent() {
  const { user } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"overview" | "students" | "teachers" | "classes" | "materials">("overview");

  // Redirect if not ADMIN
  if (user && user.role !== "ADMIN") {
    router.push(user.role === "GIAO_VIEN" ? "/teacher" : "/student");
    return null;
  }

  // Fetch lists via SWR
  const { data: stdData, error: errStd, mutate: mutateStd } = useSWR("getStudents", () => 
    requestGas<Student[]>("getStudents")
  );
  const students = stdData || [];
  
  const { data: tchData, error: errTch, mutate: mutateTch } = useSWR("getTeachers", () => 
    requestGas<Teacher[]>("getTeachers")
  );
  const teachers = tchData || [];
  
  const { data: clsData, error: errCls, mutate: mutateCls } = useSWR("getClasses", () => 
    requestGas<Class[]>("getClasses")
  );
  const classes = clsData || [];

  const { data: folderData, mutate: mutateFolders } = useSWR(
    activeTab === "materials" ? "getFolders" : null,
    () => requestGas<any[]>("getFolders")
  );
  const allFolders = folderData || [];

  // Loading States
  const loading = (stdData === undefined && !errStd) || (tchData === undefined && !errTch) || (clsData === undefined && !errCls);

  // Form States & Loading Statuses
  const [submittingStd, setSubmittingStd] = useState(false);
  const [submittingTch, setSubmittingTch] = useState(false);
  const [submittingCls, setSubmittingCls] = useState(false);
  const [submittingEnr, setSubmittingEnr] = useState(false);

  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Forms inputs
  const [stdForm, setStdForm] = useState({ fullName: "", email: "", password: "", parentEmail: "", parentPhone: "" });
  const [tchForm, setTchForm] = useState({ fullName: "", email: "", password: "" });
  const [clsForm, setClsForm] = useState({ className: "", schedule: "", teacherId: "", grade: "", level: "", subject: "", tuitionFee: "200000" });
  const [enrForm, setEnrForm] = useState({ classId: "", studentId: "" });

  const [folderForm, setFolderForm] = useState({ folderName: "", subject: "", grade: "", level: "", sortOrder: "1", description: "" });
  const [submittingFolder, setSubmittingFolder] = useState(false);

  const handleAddFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingFolder(true);
    try {
      await requestGas("createFolder", {
        method: "POST",
        body: {
          ...folderForm,
          sortOrder: parseInt(folderForm.sortOrder) || 1
        }
      });
      showMessage("success", "Tạo chuyên đề (folder) mới thành công!");
      setFolderForm({ folderName: "", subject: "", grade: "", level: "", sortOrder: "1", description: "" });
      mutateFolders();
    } catch (err: any) {
      showMessage("error", err.message || "Lỗi tạo chuyên đề");
    } finally {
      setSubmittingFolder(false);
    }
  };

  const handleDeleteFolder = async (folderId: string) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa chuyên đề này? Tất cả file và liên kết thuộc chuyên đề cũng sẽ bị xóa.")) return;
    try {
      await requestGas("deleteFolder", {
        method: "POST",
        body: { folderId }
      });
      showMessage("success", "Xóa chuyên đề thành công!");
      mutateFolders();
    } catch (err: any) {
      showMessage("error", err.message || "Lỗi xóa chuyên đề");
    }
  };

  // Student Lifecycle States
  const [lifecycleClassId, setLifecycleClassId] = useState("");
  const [submittingStatusId, setSubmittingStatusId] = useState<string>("");
  const [transferTargetClassId, setTransferTargetClassId] = useState<Record<string, string>>({}); // studentId -> targetClassId
  const [showTransferSelect, setShowTransferSelect] = useState<Record<string, boolean>>({}); // studentId -> boolean

  // SWR fetch class details for lifecycle
  const { data: lifecycleClassDetails, mutate: mutateLifecycleDetails } = useSWR(
    lifecycleClassId ? `getClassDetails/${lifecycleClassId}` : null,
    () => requestGas<any>("getClassDetails", { method: "GET", body: { classId: lifecycleClassId } })
  );

  // Fetch class curriculum progress
  const { data: curriculumProgress = [] } = useSWR(
    lifecycleClassId ? `getClassProgress/${lifecycleClassId}` : null,
    () => requestGas<any[]>("getClassProgress", { body: { classId: lifecycleClassId } })
  );

  const searchParams = useSearchParams();
  useEffect(() => {
    const classId = searchParams.get("classId");
    if (classId) {
      setActiveTab("classes");
      setLifecycleClassId(classId);
    }
  }, [searchParams]);

  const showMessage = (type: "success" | "error", text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  const handleUpdateStatus = async (studentId: string, classId: string, status: string, targetClassId?: string) => {
    setSubmittingStatusId(`${studentId}_${status}`);
    try {
      await requestGas("updateStudentStatus", {
        method: "POST",
        body: { studentId, classId, status, targetClassId }
      });
      showMessage("success", `Cập nhật trạng thái học viên thành công!`);
      mutateLifecycleDetails();
    } catch (err: any) {
      showMessage("error", err.message || "Lỗi cập nhật trạng thái");
    } finally {
      setSubmittingStatusId("");
    }
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
      setClsForm({ className: "", schedule: "", teacherId: "", grade: "", level: "", subject: "", tuitionFee: "200000" });
      mutateCls();
    } catch (err: any) {
      showMessage("error", err.message || "Lỗi tạo lớp học");
    } finally {
      setSubmittingCls(false);
    }
  };

  const handleRemoveStudent = async (studentId: string, classId: string) => {
    try {
      await requestGas("removeStudentFromClass", {
        method: "POST",
        body: { studentId, classId }
      });
      showMessage("success", `Đã xóa học viên khỏi lớp thành công!`);
      mutateLifecycleDetails();
    } catch (err: any) {
      showMessage("error", err.message || "Lỗi xóa học viên");
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
      <div className="flex border-b border-neutral-200 dark:border-neutral-800 space-x-2 overflow-x-auto pb-1 scrollbar-none whitespace-nowrap">
        {(["overview", "students", "teachers", "classes", "materials"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2.5 text-sm font-bold border-b-2 capitalize transition-colors cursor-pointer ${
              activeTab === tab 
                ? "border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400" 
                : "border-transparent text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200"
            }`}
          >
            {tab === "overview" ? "Tổng quan" : tab === "students" ? "Học viên" : tab === "teachers" ? "Giáo viên" : tab === "classes" ? "Lớp học & Ghi danh" : "Quản lý Chuyên đề"}
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
                <table className="w-full text-left border-collapse min-w-[600px]">
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
                <table className="w-full text-left border-collapse min-w-[500px]">
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
                      <label className="block text-xs font-bold text-neutral-500 uppercase mb-1">Khối lớp (Grade)</label>
                      <select 
                        required
                        value={clsForm.grade}
                        onChange={(e) => setClsForm({ ...clsForm, grade: e.target.value })}
                        className="w-full px-3 py-2 border rounded-xl bg-neutral-50 dark:bg-neutral-950 border-neutral-300 dark:border-neutral-700 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      >
                        <option value="">-- Chọn khối lớp --</option>
                        <option value="Lớp 6">Lớp 6</option>
                        <option value="Lớp 7">Lớp 7</option>
                        <option value="Lớp 8">Lớp 8</option>
                        <option value="Lớp 9">Lớp 9</option>
                        <option value="Lớp 10">Lớp 10</option>
                        <option value="Lớp 11">Lớp 11</option>
                        <option value="Lớp 12">Lớp 12</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-neutral-500 uppercase mb-1">Mức độ (Level)</label>
                      <select 
                        required
                        value={clsForm.level}
                        onChange={(e) => setClsForm({ ...clsForm, level: e.target.value })}
                        className="w-full px-3 py-2 border rounded-xl bg-neutral-50 dark:bg-neutral-950 border-neutral-300 dark:border-neutral-700 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      >
                        <option value="">-- Chọn mức độ --</option>
                        <option value="Cơ bản">Cơ bản</option>
                        <option value="Nâng cao">Nâng cao</option>
                        <option value="Chuyên">Chuyên</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-neutral-500 uppercase mb-1">Môn học (Subject)</label>
                      <select 
                        required
                        value={clsForm.subject}
                        onChange={(e) => setClsForm({ ...clsForm, subject: e.target.value })}
                        className="w-full px-3 py-2 border rounded-xl bg-neutral-50 dark:bg-neutral-950 border-neutral-300 dark:border-neutral-700 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      >
                        <option value="">-- Chọn môn học --</option>
                        <option value="Toán">Toán</option>
                        <option value="Văn">Văn</option>
                        <option value="Anh">Anh</option>
                        <option value="Lý">Lý</option>
                        <option value="Hóa">Hóa</option>
                        <option value="Sinh">Sinh</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-neutral-500 uppercase mb-1">Học phí / học viên / buổi (VNĐ)</label>
                      <input 
                        type="number" 
                        min="0"
                        required
                        value={clsForm.tuitionFee}
                        onChange={(e) => setClsForm({ ...clsForm, tuitionFee: e.target.value })}
                        className="w-full px-3 py-2 border rounded-xl bg-neutral-50 dark:bg-neutral-950 border-neutral-300 dark:border-neutral-700 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        placeholder="200000"
                      />
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

              {/* Right Column: Classes Table List OR Student Lifecycle */}
              <div className="lg:col-span-2 space-y-6 self-start">
                {!lifecycleClassId ? (
                  /* Classes list */
                  <div className="p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm overflow-x-auto animate-fade-in">
                    <h3 className="text-lg font-bold text-neutral-900 dark:text-white mb-4">
                      Danh sách lớp học ({classes.length})
                    </h3>
                    <table className="w-full text-left border-collapse min-w-[800px]">
                      <thead>
                        <tr className="border-b border-neutral-200 dark:border-neutral-800 text-xs font-bold text-neutral-500 uppercase tracking-wider">
                          <th className="pb-3">Mã Lớp</th>
                          <th className="pb-3">Tên lớp</th>
                          <th className="pb-3">Giáo viên phụ trách</th>
                          <th className="pb-3">Lịch học</th>
                          <th className="pb-3 text-right">Học phí</th>
                          <th className="pb-3">Tiến độ</th>
                          <th className="pb-3 text-right">Hành động</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800 text-sm text-neutral-700 dark:text-neutral-300">
                        {classes.map((cls) => (
                          <tr key={cls.classId} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/10">
                            <td className="py-3.5 font-mono text-xs font-bold">{cls.classId}</td>
                            <td className="py-3.5 font-bold text-neutral-900 dark:text-white">{cls.className}</td>
                            <td className="py-3.5">{cls.teacherName}</td>
                            <td className="py-3.5">{cls.schedule}</td>
                            <td className="py-3.5 text-right font-bold text-neutral-800 dark:text-neutral-200">
                              {(cls.tuitionFee || 200000).toLocaleString("vi-VN")} đ
                            </td>
                            <td className="py-3.5">
                              <div className="flex items-center gap-2">
                                <div className="w-20 bg-neutral-200 dark:bg-neutral-800 rounded-full h-2 overflow-hidden">
                                  <div 
                                    className="bg-green-500 h-full rounded-full transition-all duration-500" 
                                    style={{ width: `${cls.progressPercent || 0}%` }}
                                  />
                                </div>
                                <span className="text-xs font-bold text-neutral-700 dark:text-neutral-300">
                                  {Math.round(cls.progressPercent || 0)}%
                                </span>
                              </div>
                            </td>
                            <td className="py-3.5 text-right">
                              <button
                                onClick={() => setLifecycleClassId(cls.classId)}
                                className="px-3 py-1 rounded-lg text-xs font-bold transition-all bg-neutral-100 hover:bg-neutral-200 text-neutral-700 dark:bg-neutral-800 dark:hover:bg-neutral-700 dark:text-neutral-300 cursor-pointer"
                              >
                                Xem chi tiết
                              </button>
                            </td>
                          </tr>
                        ))}
                        {classes.length === 0 && (
                          <tr>
                            <td colSpan={6} className="py-8 text-center text-neutral-400 font-medium">Chưa có lớp học nào</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                ) : (() => {
                  const selectedClassObj = classes.find(c => c.classId === lifecycleClassId);
                  return (
                    /* Detailed Class lifecycle management card */
                    <div className="p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm space-y-6 animate-fade-in">
                      <div className="flex justify-between items-start border-b border-neutral-100 dark:border-neutral-800/50 pb-4">
                        <div className="space-y-1">
                          <h3 className="text-lg font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                            Thông tin lớp học chi tiết: {selectedClassObj?.className} ({lifecycleClassId})
                          </h3>
                          <p className="text-xs text-neutral-500">
                            Giáo viên phụ trách: <span className="font-semibold text-neutral-700 dark:text-neutral-300">{selectedClassObj?.teacherName || "Chưa phân công"}</span> | Lịch học: <span className="font-semibold text-neutral-700 dark:text-neutral-300">{selectedClassObj?.schedule || "N/A"}</span>
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <span className="text-xs text-neutral-500">Tiến độ chương trình:</span>
                            <div className="w-32 bg-neutral-200 dark:bg-neutral-800 rounded-full h-2 overflow-hidden">
                              <div 
                                className="bg-green-500 h-full rounded-full transition-all duration-500" 
                                style={{ width: `${selectedClassObj?.progressPercent || 0}%` }}
                              />
                            </div>
                            <span className="text-xs font-bold text-neutral-700 dark:text-neutral-300">
                              {Math.round(selectedClassObj?.progressPercent || 0)}%
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={() => setLifecycleClassId("")}
                          className="p-1 rounded-lg text-neutral-400 hover:text-neutral-600 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>

                      {!lifecycleClassDetails ? (
                        <div className="py-8 flex justify-center items-center">
                          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                        </div>
                      ) : (
                        <div className="space-y-6">
                          <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse min-w-[800px]">
                              <thead>
                                <tr className="border-b border-neutral-200 dark:border-neutral-800 text-xs font-bold text-neutral-500 uppercase tracking-wider">
                                  <th className="pb-3">Học viên</th>
                                  <th className="pb-3 text-center">Trạng thái</th>
                                  <th className="pb-3 text-right">Học phí nợ</th>
                                  <th className="pb-3 text-right">Cập nhật trạng thái</th>
                                  <th className="pb-3 text-right">Chuyển lớp</th>
                                  <th className="pb-3 text-right">Xóa</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800 text-sm text-neutral-700 dark:text-neutral-300">
                                {lifecycleClassDetails.students?.map((std: any) => {
                                  const isTransferring = showTransferSelect[std.studentId];
                                  return (
                                    <tr key={std.studentId} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/10">
                                      <td className="py-3.5">
                                        <p className="font-bold text-neutral-900 dark:text-white">{std.fullName}</p>
                                        <span className="text-xs font-mono text-neutral-400">{std.studentId}</span>
                                      </td>
                                      <td className="py-3.5 text-center">
                                        <span className={`inline-block px-2.5 py-0.5 rounded-full font-extrabold text-[10px] uppercase tracking-wider ${
                                          std.status === "Đang học"
                                            ? "bg-green-500/10 text-green-600 dark:text-green-400"
                                            : std.status === "Bảo lưu"
                                              ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                                              : "bg-neutral-500/15 text-neutral-500 dark:text-neutral-400"
                                        }`}>
                                          {std.status}
                                        </span>
                                      </td>
                                      <td className="py-3.5 text-right font-semibold text-rose-500">
                                        {std.debt > 0 ? `${std.debt.toLocaleString("vi-VN")} đ` : "—"}
                                      </td>
                                      <td className="py-3.5 text-right">
                                        <div className="flex justify-end gap-1.5">
                                          {(["Đang học", "Bảo lưu", "Nghỉ học"] as const).map((st) => (
                                            <button
                                              key={st}
                                              disabled={std.status === st || submittingStatusId === `${std.studentId}_${st}`}
                                              onClick={() => handleUpdateStatus(std.studentId, lifecycleClassId, st)}
                                              className={`px-2 py-1 rounded text-[11px] font-bold cursor-pointer transition-colors ${
                                                std.status === st
                                                  ? "bg-blue-500/10 text-blue-600 cursor-default"
                                                  : "bg-neutral-50 hover:bg-neutral-100 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-600 dark:text-neutral-300"
                                              }`}
                                            >
                                              {st === "Đang học" ? "Học tiếp" : st === "Bảo lưu" ? "Bảo lưu" : "Nghỉ"}
                                            </button>
                                          ))}
                                        </div>
                                      </td>
                                      <td className="py-3.5 text-right">
                                        {!isTransferring ? (
                                          <button
                                            onClick={() => setShowTransferSelect(prev => ({ ...prev, [std.studentId]: true }))}
                                            className="px-2.5 py-1 rounded bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 font-bold text-[11px] transition-colors cursor-pointer"
                                          >
                                            Chuyển lớp
                                          </button>
                                        ) : (
                                          <div className="flex items-center justify-end gap-1">
                                            <select
                                              value={transferTargetClassId[std.studentId] || ""}
                                              onChange={(e) => setTransferTargetClassId(prev => ({ ...prev, [std.studentId]: e.target.value }))}
                                              className="px-1.5 py-1 border rounded text-[11px] bg-white dark:bg-neutral-900 border-neutral-300 dark:border-neutral-700 focus:outline-none"
                                            >
                                              <option value="">-- Lớp mới --</option>
                                              {classes
                                                .filter(c => c.classId !== lifecycleClassId)
                                                .map(c => (
                                                  <option key={c.classId} value={c.classId}>{c.className}</option>
                                                ))}
                                            </select>
                                            <button
                                              onClick={() => {
                                                const target = transferTargetClassId[std.studentId];
                                                if (target) {
                                                  handleUpdateStatus(std.studentId, lifecycleClassId, "Chuyển lớp", target);
                                                  setShowTransferSelect(prev => ({ ...prev, [std.studentId]: false }));
                                                }
                                              }}
                                              className="px-2 py-1 rounded bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px] cursor-pointer"
                                            >
                                              Đi
                                            </button>
                                            <button
                                              onClick={() => setShowTransferSelect(prev => ({ ...prev, [std.studentId]: false }))}
                                              className="px-2 py-1 rounded bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 font-bold text-[11px] cursor-pointer"
                                            >
                                              Hủy
                                            </button>
                                          </div>
                                        )}
                                      </td>
                                      <td className="py-3.5 text-right">
                                        <button
                                          onClick={() => {
                                            if (confirm(`Bạn có chắc chắn muốn xóa học viên ${std.fullName} khỏi lớp này không?`)) {
                                              handleRemoveStudent(std.studentId, lifecycleClassId);
                                            }
                                          }}
                                          className="px-2 py-1 rounded bg-rose-500/10 hover:bg-rose-500 text-rose-600 hover:text-white font-bold text-[11px] transition-colors cursor-pointer"
                                        >
                                          Xóa
                                        </button>
                                      </td>
                                    </tr>
                                  );
                                })}
                                {(!lifecycleClassDetails.students || lifecycleClassDetails.students.length === 0) && (
                                  <tr>
                                    <td colSpan={6} className="py-8 text-center text-neutral-400 font-medium">Lớp chưa có học viên nào ghi danh</td>
                                  </tr>
                                )}
                              </tbody>
                            </table>
                          </div>

                          {/* Curriculum Progress Section */}
                          <div className="border-t border-neutral-200 dark:border-neutral-800 pt-6">
                            <h4 className="text-sm font-bold text-neutral-900 dark:text-white mb-3">
                              Lộ Trình Đào Tạo ({curriculumProgress.length} chủ đề)
                            </h4>
                            {curriculumProgress.length === 0 ? (
                              <p className="text-xs text-neutral-500 italic">Không có thông tin lộ trình học.</p>
                            ) : (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {curriculumProgress.map((prog: any, idx: number) => (
                                  <div key={idx} className="p-3.5 rounded-xl border border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/30 flex items-center justify-between">
                                    <div className="space-y-1">
                                      <p className="text-xs font-bold text-neutral-950 dark:text-neutral-100">{prog.topicName}</p>
                                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-extrabold uppercase ${
                                        prog.status === "Đã dạy" 
                                          ? "bg-green-500/10 text-green-600 dark:text-green-400"
                                          : "bg-neutral-500/10 text-neutral-500"
                                      }`}>
                                        {prog.status || "Chưa dạy"}
                                      </span>
                                    </div>
                                    <div className="text-right">
                                      <span className="text-xs font-bold text-neutral-950 dark:text-white">{prog.progressPercent}%</span>
                                      <div className="w-16 bg-neutral-200 dark:bg-neutral-800 rounded-full h-1.5 mt-1 overflow-hidden">
                                        <div className="bg-blue-600 h-full rounded-full" style={{ width: `${prog.progressPercent}%` }} />
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            </div>
          )}

          {/* MATERIALS (Quản lý Chuyên đề) TAB */}
          {activeTab === "materials" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in">
              {/* Form Add Folder */}
              <div className="lg:col-span-1 p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm space-y-6 self-start">
                <h3 className="text-lg font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                  <Plus className="w-5 h-5 text-blue-500" /> Tạo Chuyên Đề Mới
                </h3>

                <form onSubmit={handleAddFolder} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-neutral-500 uppercase mb-1">Tên chuyên đề (Folder)</label>
                    <input 
                      type="text" 
                      required
                      value={folderForm.folderName}
                      onChange={(e) => setFolderForm({ ...folderForm, folderName: e.target.value })}
                      className="w-full px-3 py-2 border rounded-xl bg-neutral-50 dark:bg-neutral-950 border-neutral-300 dark:border-neutral-700 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      placeholder="Ví dụ: Số chính phương"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-neutral-500 uppercase mb-1">Môn học</label>
                    <select 
                      required
                      value={folderForm.subject}
                      onChange={(e) => setFolderForm({ ...folderForm, subject: e.target.value })}
                      className="w-full px-3 py-2 border rounded-xl bg-neutral-50 dark:bg-neutral-950 border-neutral-300 dark:border-neutral-700 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    >
                      <option value="">-- Chọn môn học --</option>
                      <option value="Toán">Toán</option>
                      <option value="Văn">Văn</option>
                      <option value="Anh">Anh</option>
                      <option value="Lý">Lý</option>
                      <option value="Hóa">Hóa</option>
                      <option value="Sinh">Sinh</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-neutral-500 uppercase mb-1">Khối lớp (Grade)</label>
                    <select 
                      required
                      value={folderForm.grade}
                      onChange={(e) => setFolderForm({ ...folderForm, grade: e.target.value })}
                      className="w-full px-3 py-2 border rounded-xl bg-neutral-50 dark:bg-neutral-950 border-neutral-300 dark:border-neutral-700 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    >
                      <option value="">-- Chọn khối lớp --</option>
                      <option value="Lớp 6">Lớp 6</option>
                      <option value="Lớp 7">Lớp 7</option>
                      <option value="Lớp 8">Lớp 8</option>
                      <option value="Lớp 9">Lớp 9</option>
                      <option value="Lớp 10">Lớp 10</option>
                      <option value="Lớp 11">Lớp 11</option>
                      <option value="Lớp 12">Lớp 12</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-neutral-500 uppercase mb-1">Mức độ (Level)</label>
                    <select 
                      required
                      value={folderForm.level}
                      onChange={(e) => setFolderForm({ ...folderForm, level: e.target.value })}
                      className="w-full px-3 py-2 border rounded-xl bg-neutral-50 dark:bg-neutral-950 border-neutral-300 dark:border-neutral-700 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    >
                      <option value="">-- Chọn mức độ --</option>
                      <option value="Cơ bản">Cơ bản</option>
                      <option value="Nâng cao">Nâng cao</option>
                      <option value="Chuyên">Chuyên</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-neutral-500 uppercase mb-1">Số thứ tự hiển thị</label>
                    <input 
                      type="number" 
                      required
                      value={folderForm.sortOrder}
                      onChange={(e) => setFolderForm({ ...folderForm, sortOrder: e.target.value })}
                      className="w-full px-3 py-2 border rounded-xl bg-neutral-50 dark:bg-neutral-950 border-neutral-300 dark:border-neutral-700 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      placeholder="1"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-neutral-500 uppercase mb-1">Mô tả chuyên đề</label>
                    <textarea 
                      rows={3}
                      value={folderForm.description}
                      onChange={(e) => setFolderForm({ ...folderForm, description: e.target.value })}
                      className="w-full px-3 py-2 border rounded-xl bg-neutral-50 dark:bg-neutral-950 border-neutral-300 dark:border-neutral-700 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      placeholder="Nhập mô tả chuyên đề..."
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submittingFolder}
                    className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md transition-colors flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {submittingFolder ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4.5 h-4.5" />}
                    Tạo Chuyên Đề
                  </button>
                </form>
              </div>

              {/* Table List of Folders */}
              <div className="lg:col-span-2 p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm overflow-x-auto">
                <h3 className="text-lg font-bold text-neutral-900 dark:text-white mb-4">
                  Danh sách chuyên đề đã có ({allFolders.length})
                </h3>
                <table className="w-full text-left border-collapse min-w-[600px]">
                  <thead>
                    <tr className="border-b border-neutral-200 dark:border-neutral-800 text-xs font-bold text-neutral-500 uppercase tracking-wider">
                      <th className="pb-3">Mã Chuyên Đề</th>
                      <th className="pb-3">Tên chuyên đề</th>
                      <th className="pb-3">Môn học</th>
                      <th className="pb-3">Phân loại</th>
                      <th className="pb-3">Mô tả</th>
                      <th className="pb-3 text-right">Hành động</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800 text-sm text-neutral-700 dark:text-neutral-300 font-medium">
                    {allFolders.map((f: any) => (
                      <tr key={f.folderId} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-855">
                        <td className="py-3.5 font-mono text-xs font-bold">{f.folderId}</td>
                        <td className="py-3.5 font-bold text-neutral-900 dark:text-white">{f.folderName}</td>
                        <td className="py-3.5">{f.subject}</td>
                        <td className="py-3.5 text-xs text-neutral-500">
                          {f.grade} - {f.level}
                        </td>
                        <td className="py-3.5 text-xs text-neutral-400 max-w-xs truncate">{f.description || "—"}</td>
                        <td className="py-3.5 text-right">
                          <button
                            onClick={() => handleDeleteFolder(f.folderId)}
                            className="px-2.5 py-1 text-[11px] font-bold rounded bg-rose-500/10 hover:bg-rose-500 text-rose-600 hover:text-white cursor-pointer transition-all"
                          >
                            Xóa
                          </button>
                        </td>
                      </tr>
                    ))}
                    {allFolders.length === 0 && (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-neutral-400 font-semibold italic">Không có chuyên đề nào được tạo.</td>
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

export default function AdminPage() {
  return (
    <Suspense fallback={
      <div className="flex-1 flex flex-col items-center justify-center py-16">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
        <p className="mt-4 text-sm font-medium text-neutral-500">Đang tải trang quản trị...</p>
      </div>
    }>
      <AdminPageContent />
    </Suspense>
  );
}
