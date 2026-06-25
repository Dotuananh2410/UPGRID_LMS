"use client";

import React, { useState, useEffect } from "react";
import useSWR from "swr";
import { requestGas } from "@/utils/apiClient";
import { Student } from "@/types/lms";
import MathRenderer from "./MathRenderer";
import { 
  FileEdit, Loader2, Clock, Sparkles, Filter, 
  TrendingUp, Grid, AlertCircle, CheckCircle2 
} from "lucide-react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";

interface TeacherGradesProps {
  classId: string;
  activeStudents: Student[];
  classGrades: any[];
  classDashboard: any;
  mutateGrades: () => void;
  activePanel: "grades_entry" | "grades_matrix" | "grades_history";
  initialStudentId?: string;
  onClearInitialStudentId?: () => void;
}

const EMPTY_ARRAY: any[] = [];

export default function TeacherGrades({
  classId,
  activeStudents,
  classGrades,
  classDashboard,
  mutateGrades,
  activePanel,
  initialStudentId = "",
  onClearInitialStudentId
}: TeacherGradesProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  // Sub-tabs on the right panel
  const [rightPanel, setRightPanel] = useState<"logs" | "matrix" | "stats">("logs");

  // Grading form states
  const [selectedStudentId, setSelectedStudentId] = useState<string>(initialStudentId);
  const [assignmentName, setAssignmentName] = useState<string>("");
  const [grade, setGrade] = useState<string>("");
  const [feedback, setFeedback] = useState<string>("");
  const [submittingGrade, setSubmittingGrade] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Grades search/filter states
  const [gradeSearchTerm, setGradeSearchTerm] = useState("");
  const [gradeFilterStudentId, setGradeFilterStudentId] = useState("");

  // Feedback templates SWR
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

  useEffect(() => {
    if (initialStudentId) {
      setSelectedStudentId(initialStudentId);
    }
  }, [initialStudentId]);

  const handleSubmitGrade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentId || !assignmentName || !grade) {
      showMessage("error", "Vui lòng điền đầy đủ các trường thông tin bắt buộc!");
      return;
    }

    const numGrade = parseFloat(grade);
    if (isNaN(numGrade) || numGrade < 0 || numGrade > 10) {
      showMessage("error", "Điểm số phải nằm trong khoảng từ 0 đến 10!");
      return;
    }

    setSubmittingGrade(true);
    try {
      await requestGas("submitGrade", {
        method: "POST",
        body: {
          classId,
          studentId: selectedStudentId,
          assignmentName,
          grade: numGrade,
          feedback
        }
      });

      showMessage("success", "Đã lưu kết quả điểm số học viên thành công!");
      setAssignmentName("");
      setGrade("");
      setFeedback("");
      mutateGrades();
      
      if (onClearInitialStudentId) {
        onClearInitialStudentId();
      }
    } catch (err: any) {
      showMessage("error", err.message || "Lỗi khi lưu điểm số.");
    } finally {
      setSubmittingGrade(false);
    }
  };

  // Filtered grades list
  const filteredGrades = classGrades.filter(g => {
    const matchesSearch = g.studentName.toLowerCase().includes(gradeSearchTerm.toLowerCase()) || 
                          g.assignmentName.toLowerCase().includes(gradeSearchTerm.toLowerCase());
    const matchesStudent = !gradeFilterStudentId || g.studentId === gradeFilterStudentId;
    return matchesSearch && matchesStudent;
  });

  return (
    <div className="space-y-6 animate-fade-in text-xs font-sans">
      
      {/* 1. Header Title & Intro */}
      <div className="flex justify-between items-center border-b border-neutral-200 dark:border-neutral-800 pb-3">
        <div>
          <h2 className="text-base font-extrabold text-neutral-900 dark:text-white uppercase tracking-wide flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-600" /> Quản lý Điểm số & Đánh giá Học tập Lớp học
          </h2>
          <p className="text-[11px] text-neutral-500 mt-1">
            Theo dõi phổ điểm bài kiểm tra, nhập kết quả học viên, và xem cảnh báo học tập.
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

      {/* 2. Top Row - Stats Cards (TÓM TẮT NHANH) */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-center space-y-1 shadow-sm">
          <p className="text-[10px] font-bold text-neutral-450 uppercase tracking-wider">Điểm trung bình lớp</p>
          <p className="text-2xl font-extrabold text-blue-600 dark:text-blue-455">
            {classDashboard?.avgClassGrade ? `${classDashboard.avgClassGrade}/10` : "—"}
          </p>
        </div>
        <div className="p-4 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-center space-y-1 shadow-sm">
          <p className="text-[10px] font-bold text-neutral-455 dark:text-neutral-400 uppercase tracking-wider">Số đầu điểm kiểm tra</p>
          <p className="text-2xl font-extrabold text-neutral-900 dark:text-white">
            {classDashboard?.assignments?.length || 0}
          </p>
        </div>
        <div className="p-4 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-center space-y-1 shadow-sm">
          <p className="text-[10px] font-bold text-neutral-455 dark:text-neutral-400 uppercase tracking-wider">Học sinh chưa hoàn thành</p>
          <p className="text-2xl font-extrabold text-amber-500">
            {classDashboard?.pendingStudentsList?.length || 0}
          </p>
        </div>
        <div className="p-4 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-center space-y-1 shadow-sm">
          <p className="text-[10px] font-bold text-neutral-455 dark:text-neutral-400 uppercase tracking-wider">Cảnh báo học sinh giảm sút</p>
          <p className={`text-2xl font-extrabold ${classDashboard?.decliningTrendWarnings?.length > 0 ? "text-rose-600" : "text-neutral-400"}`}>
            {classDashboard?.decliningTrendWarnings?.length || 0}
          </p>
        </div>
      </div>

      {/* 3. Declining Warnings Alert Block (Spans full width, placed below stats) */}
      {classDashboard?.decliningTrendWarnings && classDashboard.decliningTrendWarnings.length > 0 && (
        <div className="p-5 rounded-2xl bg-rose-500/10 border border-rose-500/25 space-y-3">
          <h4 className="text-sm font-extrabold text-rose-750 dark:text-rose-450 flex items-center gap-1.5 uppercase">
            <AlertCircle className="w-5 h-5 flex-shrink-0" /> Cảnh báo học sinh giảm sút kết quả học tập
          </h4>
          <p className="text-xs text-neutral-500 font-semibold leading-relaxed">
            Phát hiện các học sinh có điểm kiểm tra liên tục đi xuống trong 3 lần làm bài gần nhất. Giáo viên nên lưu ý kèm cặp thêm.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 pt-1">
            {classDashboard.decliningTrendWarnings.map((warn: any) => (
              <div key={warn.studentId} className="p-4 rounded-xl bg-white dark:bg-neutral-900 border border-rose-500/20 shadow-sm space-y-1.5">
                <p className="text-sm font-bold text-neutral-850 dark:text-neutral-200">{warn.fullName}</p>
                <p className="text-xs text-neutral-450">Mã HV: <span className="font-mono font-bold">{warn.studentId}</span></p>
                <div className="flex items-center gap-2 text-xs font-semibold text-rose-500">
                  <span>Điểm gần nhất:</span>
                  <span className="font-bold">{warn.recentScores?.map((s: number) => typeof s === "number" ? s.toFixed(1) : "N/A").join(" ➔ ")}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. Bottom Main Content Area - 2 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column (lg:col-span-5) - Pending & Manual Grading */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Block 1: Học viên chưa hoàn thành đề */}
          <div className="p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm space-y-4">
            <h3 className="font-bold text-neutral-900 dark:text-white flex items-center gap-2 text-[11px] uppercase tracking-wider border-b border-neutral-100 dark:border-neutral-800 pb-3">
              <Clock className="w-4.5 h-4.5 text-blue-500" /> Học viên chưa hoàn thành đề
            </h3>
            
            <div className="space-y-2.5 max-h-[160px] overflow-y-auto pr-1">
              {classDashboard?.pendingStudentsList && classDashboard.pendingStudentsList.length > 0 ? (
                classDashboard.pendingStudentsList.map((pend: any, idx: number) => (
                  <div 
                    key={idx} 
                    className="p-3 bg-neutral-50/50 dark:bg-neutral-950/20 border border-neutral-100 dark:border-neutral-805 rounded-xl space-y-1 hover:shadow-xs hover:border-neutral-200 dark:hover:border-neutral-750 transition-all cursor-pointer" 
                    onClick={() => setSelectedStudentId(pend.studentId)}
                  >
                    <div className="flex justify-between items-center font-bold">
                      <span className="text-neutral-850 dark:text-neutral-200">{pend.fullName}</span>
                      <span className="text-[9px] text-neutral-400 font-mono">{pend.studentId}</span>
                    </div>
                    <p className="text-[10px] font-semibold text-neutral-500 line-clamp-1">{pend.examName}</p>
                    <p className="text-[9px] font-bold text-rose-500">Hạn chót: {pend.dueDate || "Không có hạn"}</p>
                  </div>
                ))
              ) : (
                <p className="text-center text-xs text-neutral-405 py-6 italic font-semibold">Tất cả học viên đã hoàn thành đầy đủ!</p>
              )}
            </div>
          </div>

          {/* Block 2: Nhập điểm số học viên thủ công */}
          <div className="p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm space-y-4">
            <h3 className="font-bold text-neutral-900 dark:text-white flex items-center gap-2 text-[11px] uppercase tracking-wider border-b border-neutral-100 dark:border-neutral-805 pb-3">
              <FileEdit className="w-5 h-5 text-blue-500" /> Nhập điểm số học viên thủ công
            </h3>

            <form onSubmit={handleSubmitGrade} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-neutral-500 uppercase mb-1">Học sinh</label>
                <select
                  required
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl bg-neutral-50 dark:bg-neutral-950 border-neutral-300 dark:border-neutral-700 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none text-neutral-750 dark:text-neutral-350 cursor-pointer font-bold"
                >
                  <option value="">-- Chọn học sinh từ danh sách lớp --</option>
                  {activeStudents.map((std) => (
                    <option key={std.studentId} value={std.studentId}>
                      {std.fullName} ({std.studentId})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-neutral-500 uppercase mb-1">Bài kiểm tra</label>
                  <input
                    type="text"
                    required
                    placeholder="Ví dụ: Đề số 1..."
                    value={assignmentName}
                    onChange={(e) => setAssignmentName(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl bg-neutral-50 dark:bg-neutral-955 border-neutral-300 dark:border-neutral-700 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-neutral-500 uppercase mb-1">Điểm số (Thang 10)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="10"
                    required
                    placeholder="Từ 0 đến 10"
                    value={grade}
                    onChange={(e) => setGrade(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl bg-neutral-50 dark:bg-neutral-955 border-neutral-300 dark:border-neutral-700 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none font-bold"
                  />
                </div>
              </div>

              {/* Detailed feedback text */}
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-neutral-500 uppercase">Nhận xét chi tiết (Hỗ trợ Toán LaTeX)</label>
                <textarea
                  rows={4}
                  placeholder="Ví dụ: Em làm tốt các câu MCQ. Tuy nhiên câu True/False số 3 còn chưa chính xác công thức $x^2 + y^2 = r^2$..."
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  className="w-full p-3 border rounded-xl bg-neutral-50 dark:bg-neutral-950 border-neutral-300 dark:border-neutral-700 focus:outline-none leading-relaxed text-xs"
                />
                <p className="text-[9px] text-neutral-450">
                  Bao quanh công thức bằng ký hiệu <code>$</code> cho inline math (VD: <code>$x^2 + y^2 = r^2$</code>) hoặc <code>$$</code> cho khối hiển thị.
                </p>
              </div>

              {/* Nhận xét mẫu */}
              <div className="border border-neutral-200 dark:border-neutral-800 rounded-xl p-3 bg-neutral-50/50 dark:bg-neutral-950/20 space-y-2">
                <div className="flex justify-between items-center border-b border-neutral-100 dark:border-neutral-800 pb-1.5">
                  <span className="text-[9px] font-bold text-neutral-450 uppercase flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> Nhận xét mẫu</span>
                  <div className="flex gap-1">
                    {(["TSA", "HSA", "THPTQG"] as const).map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setSelectedTemplateExamType(type)}
                        className={`px-1.5 py-0.5 rounded text-[8px] font-extrabold transition-colors cursor-pointer ${
                          selectedTemplateExamType === type
                            ? "bg-blue-600 text-white"
                            : "bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-805 text-neutral-500"
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5 max-h-[80px] overflow-y-auto pr-1">
                  {templates.map((tpl: any) => (
                    <button
                      key={tpl.templateId}
                      type="button"
                      onClick={() => {
                        setFeedback(prev => prev ? `${prev} ${tpl.noiDungMau}` : tpl.noiDungMau);
                      }}
                      className="w-full text-left p-2 rounded bg-white dark:bg-neutral-900 border border-neutral-250/60 dark:border-neutral-805 hover:border-blue-500/30 text-[10px] font-semibold transition-all hover:scale-[1.01] cursor-pointer line-clamp-1 leading-relaxed"
                      title={tpl.noiDungMau}
                    >
                      {tpl.noiDungMau}
                    </button>
                  ))}
                  {templates.length === 0 && (
                    <p className="text-center text-[9px] text-neutral-450 italic py-2">Chưa có mẫu nào cho {selectedTemplateExamType}</p>
                  )}
                </div>
              </div>

              {/* Math Live Preview Box */}
              <div className="space-y-1">
                <span className="block text-[9px] font-bold text-neutral-500 uppercase">Xem trước LaTeX nhận xét:</span>
                <div className="p-3 rounded-xl border border-neutral-205 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-955 min-h-[3rem] text-xs overflow-x-auto leading-relaxed">
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
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {submittingGrade ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileEdit className="w-4 h-4" />}
                Lưu Kết Quả Điểm Số
              </button>
            </form>
          </div>

        </div>

        {/* Right Column (lg:col-span-7) - Viewer dashboards with Tab Group in Header */}
        <div className="lg:col-span-7 space-y-6">
          <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm overflow-hidden min-h-[600px] flex flex-col">
            
            {/* Header containing Sub-tabs */}
            <div className="flex flex-wrap items-center justify-between border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-955/30 p-4 gap-4 flex-shrink-0">
              <h3 className="font-bold text-neutral-900 dark:text-white text-[11px] uppercase tracking-wider flex items-center gap-2">
                <Grid className="w-4.5 h-4.5 text-blue-500" /> Báo Cáo Kết Quả Lớp Học
              </h3>
              
              <div className="flex items-center bg-neutral-100 dark:bg-neutral-850 p-1 rounded-xl border border-neutral-200/50 dark:border-neutral-800">
                <button
                  type="button"
                  onClick={() => setRightPanel("logs")}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                    rightPanel === "logs"
                      ? "bg-white dark:bg-neutral-900 text-blue-600 dark:text-blue-400 shadow-xs border border-neutral-200/40 dark:border-neutral-800"
                      : "text-neutral-500 hover:text-neutral-850 dark:hover:text-white"
                  }`}
                >
                  Nhật ký điểm
                </button>
                <button
                  type="button"
                  onClick={() => setRightPanel("matrix")}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                    rightPanel === "matrix"
                      ? "bg-white dark:bg-neutral-900 text-blue-600 dark:text-blue-400 shadow-xs border border-neutral-200/40 dark:border-neutral-800"
                      : "text-neutral-500 hover:text-neutral-850 dark:hover:text-white"
                  }`}
                >
                  Ma trận điểm số
                </button>
                <button
                  type="button"
                  onClick={() => setRightPanel("stats")}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                    rightPanel === "stats"
                      ? "bg-white dark:bg-neutral-900 text-blue-600 dark:text-blue-400 shadow-xs border border-neutral-200/40 dark:border-neutral-800"
                      : "text-neutral-500 hover:text-neutral-850 dark:hover:text-white"
                  }`}
                >
                  Thống kê & Phổ điểm
                </button>
              </div>
            </div>

            {/* Panel Content body */}
            <div className="p-6 flex-1 overflow-y-auto">
              
              {/* PANEL 1: NHẬT KÝ ĐIỂM */}
              {rightPanel === "logs" && (
                <div className="space-y-4 animate-fade-in">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-neutral-100 dark:border-neutral-800/80">
                    <p className="text-[10px] font-bold text-neutral-450 uppercase tracking-wider">Danh sách bài kiểm tra đã chấm</p>
                    
                    {/* Search and Filters */}
                    <div className="flex flex-wrap gap-2">
                      <div className="flex items-center gap-1.5">
                        <Filter className="w-3 h-3 text-neutral-450" />
                        <select
                          value={gradeFilterStudentId}
                          onChange={(e) => setGradeFilterStudentId(e.target.value)}
                          className="text-[10px] bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg px-2 py-1 focus:outline-none text-neutral-750 dark:text-neutral-350 cursor-pointer"
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
                        className="text-[10px] px-2.5 py-1 border rounded-lg bg-white dark:bg-neutral-900 border-neutral-300 dark:border-neutral-700 focus:outline-none text-neutral-750 dark:text-neutral-350"
                      />
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[450px]">
                      <thead>
                        <tr className="border-b border-neutral-200 dark:border-neutral-800 text-[10px] font-bold text-neutral-450 uppercase tracking-wider">
                          <th className="pb-2">Học sinh</th>
                          <th className="pb-2">Bài kiểm tra</th>
                          <th className="pb-2 text-center">Điểm</th>
                          <th className="pb-2">Nhận xét</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800 text-neutral-700 dark:text-neutral-300 font-semibold">
                        {filteredGrades.map((g: any) => (
                          <tr key={g.recordId} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/10">
                            <td className="py-2.5">
                              <p className="font-bold text-neutral-900 dark:text-white text-xs">{g.studentName}</p>
                              <span className="text-[9px] font-mono text-neutral-400">{g.studentId}</span>
                            </td>
                            <td className="py-2.5 text-neutral-800 dark:text-neutral-200 text-xs">
                              {g.assignmentName}
                            </td>
                            <td className="py-2.5 text-center font-bold text-xs">
                              <span className={`px-1.5 py-0.5 rounded ${
                                g.grade >= 8 
                                  ? "bg-green-500/10 text-green-600" 
                                  : g.grade >= 5 
                                    ? "bg-blue-500/10 text-blue-600 dark:text-blue-400" 
                                    : "bg-rose-500/10 text-rose-600"
                              }`}>
                                {g.grade.toFixed(1)}
                              </span>
                            </td>
                            <td className="py-2.5 max-w-xs">
                              <div className="text-[10px] text-neutral-500 dark:text-neutral-450 max-h-12 overflow-y-auto leading-relaxed">
                                <MathRenderer text={g.feedback} />
                              </div>
                            </td>
                          </tr>
                        ))}
                        {filteredGrades.length === 0 && (
                          <tr>
                            <td colSpan={4} className="py-8 text-center text-neutral-400">Không tìm thấy bản ghi điểm nào.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* PANEL 2: MA TRẬN ĐIỂM SỐ */}
              {rightPanel === "matrix" && (
                <div className="space-y-4 animate-fade-in">
                  <p className="text-[10px] font-bold text-neutral-450 uppercase tracking-wider border-b border-neutral-100 dark:border-neutral-805 pb-2">Ma trận điểm số (Student x Assignment)</p>
                  
                  {!classDashboard ? (
                    <div className="py-12 text-center text-neutral-400 flex flex-col items-center justify-center gap-2">
                      <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                      <span>Đang lập bảng điểm tổng hợp...</span>
                    </div>
                  ) : classDashboard.studentsMatrix?.length === 0 ? (
                    <p className="text-center py-8 text-neutral-400 italic">Lớp chưa có học viên hoặc chưa có đầu điểm.</p>
                  ) : (
                    <div className="overflow-x-auto w-full">
                      <table className="w-full text-left border-collapse min-w-[550px]">
                        <thead>
                          <tr className="border-b border-neutral-200 dark:border-neutral-805 font-bold text-neutral-500 uppercase tracking-wider">
                            <th className="pb-2 text-xs">Học viên</th>
                            {classDashboard.assignments?.map((asName: string) => (
                              <th key={asName} className="pb-2 text-center text-[10px] min-w-[100px]">{asName}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800 text-neutral-700 dark:text-neutral-300 font-semibold">
                          {classDashboard.studentsMatrix.map((row: any) => (
                            <tr key={row.studentId} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-850">
                              <td className="py-2.5 pr-2">
                                <p className="font-bold text-neutral-900 dark:text-white text-xs">{row.fullName}</p>
                                <span className="block text-[9px] text-neutral-400 font-mono font-normal">{row.studentId}</span>
                              </td>
                              
                              {classDashboard.assignments.map((asName: string) => {
                                const score = row.grades[asName];
                                return (
                                  <td key={asName} className="py-2.5 text-center font-bold text-xs">
                                    {score !== null && score !== undefined ? (
                                      <span className={`px-2 py-0.5 rounded ${
                                        score >= 8.0 
                                          ? "bg-green-500/10 text-green-600" 
                                          : score >= 5.0 
                                            ? "bg-blue-500/10 text-blue-600 dark:text-blue-400" 
                                            : "bg-rose-500/10 text-rose-600"
                                      }`}>
                                        {typeof score === "number" ? score.toFixed(1) : "N/A"}
                                      </span>
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
              )}

              {/* PANEL 3: THỐNG KÊ & PHỔ ĐIỂM */}
              {rightPanel === "stats" && (
                <div className="space-y-4 animate-fade-in">
                  <p className="text-[10px] font-bold text-neutral-450 uppercase tracking-wider border-b border-neutral-100 dark:border-neutral-805 pb-2">Phổ điểm & Thống kê theo bài kiểm tra</p>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {!classDashboard ? (
                      <div className="col-span-2 py-12 text-center text-neutral-400 flex flex-col items-center justify-center gap-2">
                        <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                        <span>Đang đồng bộ thống kê...</span>
                      </div>
                    ) : classDashboard.assignments?.length === 0 ? (
                      <p className="col-span-2 text-xs text-neutral-400 italic py-4">Chưa có thống kê bài thi.</p>
                    ) : (
                      classDashboard.assignments.map((asName: string) => {
                        const stat = classDashboard.assignmentStats[asName];
                        if (!stat || stat.totalCount === 0) return null;
                        const passRate = Math.round((stat.passCount / stat.totalCount) * 100);

                        return (
                          <div key={asName} className="p-3.5 rounded-xl border border-neutral-100 dark:border-neutral-805 bg-neutral-50/50 dark:bg-neutral-950/20 text-xs space-y-2 shadow-xs">
                            <p className="font-bold text-neutral-900 dark:text-white text-xs line-clamp-1">{asName}</p>
                            
                            <div className="grid grid-cols-3 gap-1 border-b border-neutral-200/50 dark:border-neutral-800 pb-1.5 text-center text-[9px] font-bold text-neutral-450 uppercase tracking-wider">
                              <div>
                                <p>Trung bình</p>
                                <p className="text-xs text-blue-600 mt-0.5">{typeof stat.avg === "number" ? stat.avg.toFixed(1) : "N/A"}</p>
                              </div>
                              <div>
                                <p>Cao nhất</p>
                                <p className="text-xs text-green-600 mt-0.5">{typeof stat.max === "number" ? stat.max.toFixed(1) : "N/A"}</p>
                              </div>
                              <div>
                                <p>Thấp nhất</p>
                                <p className="text-xs text-rose-500 mt-0.5">{typeof stat.min === "number" ? stat.min.toFixed(1) : "N/A"}</p>
                              </div>
                            </div>

                            <div className="space-y-1 pt-0.5 font-semibold text-neutral-500">
                              <div className="flex justify-between items-center text-[9px]">
                                <span>Tỷ lệ Đạt (≥ 5.0đ):</span>
                                <span className="text-green-600 font-bold">{passRate}% ({stat.passCount}/{stat.totalCount} HS)</span>
                              </div>
                              <div className="w-full bg-neutral-200 dark:bg-neutral-800 rounded-full h-1.5 overflow-hidden">
                                <div className="bg-green-500 h-full rounded-full" style={{ width: `${passRate}%` }} />
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
