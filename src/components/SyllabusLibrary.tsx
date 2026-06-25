"use client";

import React, { useState } from "react";
import useSWR from "swr";
import { requestGas } from "@/utils/apiClient";
import { 
  Folder, FileText, Calendar, CheckCircle2, 
  ChevronRight, Download, Play, 
  Eye, RefreshCw, AlertTriangle
} from "lucide-react";

interface SyllabusLibraryProps {
  classes: any[];
  studentId: string;
  onStartExam: (classId: string, examId: string) => void;
  onViewResult: (attemptId: string) => void;
  attendances?: any[];
  grades?: any[];
}

export default function SyllabusLibrary({ classes, studentId, onStartExam, onViewResult, attendances = [], grades = [] }: SyllabusLibraryProps) {
  const [selectedFolderId, setSelectedFolderId] = useState<string>("");
  const [activeClassId, setActiveClassId] = useState<string>(classes[0]?.classId || "");

  // Find folders (representing progress items in the student's class)
  const { data: progressItems = [], error: errFolders, isLoading: loadingFolders } = useSWR(
    activeClassId ? `getClassProgress/${activeClassId}` : null,
    () => requestGas<any[]>("getClassProgress", { method: "GET", body: { classId: activeClassId } })
  );

  const folders = progressItems.map((p) => ({
    folderId: p.folderId || p.topicName,
    folderName: p.topicName,
    progressPercent: p.progressPercent,
    status: p.status
  }));

  // Find files inside selected folder (only assigned ones)
  const { data: assignedMaterials = [], error: errFiles, isLoading: loadingFiles } = useSWR(
    activeClassId ? `getClassMaterials/${activeClassId}` : null,
    () => requestGas<any[]>("getClassMaterials", { method: "GET", body: { classId: activeClassId } })
  );

  const files = assignedMaterials.filter(
    (file) => file.topicName === folders.find(f => f.folderId === selectedFolderId)?.folderName || file.folderName === folders.find(f => f.folderId === selectedFolderId)?.folderName
  );

  // Find attempt histories of student in this class
  const { data: attempts = [] } = useSWR(
    studentId ? `getStudentAttemptHistory/${studentId}` : null,
    () => requestGas<any[]>("getStudentAttemptHistory", { method: "GET", body: { studentId } })
  );

  const getExamAttemptsCount = (examId: string) => {
    return attempts.filter(att => att.examId === examId && att.status === "SUBMITTED").length;
  };

  const getExamBestScore = (examId: string) => {
    var examAtts = attempts.filter(att => att.examId === examId && att.status === "SUBMITTED");
    if (examAtts.length === 0) return null;
    var max = Math.max(...examAtts.map(a => a.totalScore || 0));
    return max;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
      {/* Left panel: Class Selector & Folders List */}
      <div className="lg:col-span-1 space-y-6">
        <div className="p-6 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-4">
          <label className="block text-xs font-bold text-neutral-400 uppercase tracking-wider font-sans">Lớp học hiện tại</label>
          <select
            value={activeClassId}
            onChange={(e) => {
              setActiveClassId(e.target.value);
              setSelectedFolderId("");
            }}
            className="w-full px-3 py-2.5 border rounded-xl bg-neutral-50 dark:bg-neutral-950 border-neutral-300 dark:border-neutral-700 text-sm font-bold focus:ring-2 focus:ring-blue-500 focus:outline-none"
          >
            {classes.map((cls) => (
              <option key={cls.classId} value={cls.classId}>
                {cls.className} ({cls.grade} - {cls.level})
              </option>
            ))}
          </select>
        </div>

        <div className="p-6 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-neutral-400 uppercase tracking-wider font-sans">Chuyên đề học tập</h3>
          {loadingFolders ? (
            <div className="py-6 text-center text-neutral-400">Đang tải chuyên đề...</div>
          ) : folders.length === 0 ? (
            <p className="text-sm text-neutral-500 italic py-4 text-center">Không có chuyên đề học tập nào cho lớp học này.</p>
          ) : (
            <div className="space-y-2">
              {folders.map((folder: any) => (
                <button
                  key={folder.folderId}
                  onClick={() => setSelectedFolderId(selectedFolderId === folder.folderId ? null : folder.folderId)}
                  className={`w-full p-3 rounded-xl border text-left flex items-center justify-between text-sm transition-all hover:bg-neutral-50 dark:hover:bg-neutral-800 cursor-pointer ${
                    selectedFolderId === folder.folderId
                      ? "bg-blue-500/10 border-blue-500/30 text-blue-600 dark:text-blue-400 font-bold"
                      : "border-neutral-100 dark:border-neutral-800/60 text-neutral-700 dark:text-neutral-300"
                  }`}
                >
                  <span className="truncate pr-2">{folder.folderName}</span>
                  <ChevronRight className="w-4 h-4 flex-shrink-0" />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right panel: Files inside selected folder */}
      <div className="lg:col-span-2">
        {!selectedFolderId ? (
          <div className="p-8 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl flex flex-col space-y-6">
            <div className="flex flex-col gap-2 border-b border-neutral-100 dark:border-neutral-800/60 pb-4">
              <h3 className="text-xl font-bold text-neutral-900 dark:text-white">Tóm tắt kết quả học tập</h3>
              <p className="text-sm text-neutral-500">
                Thống kê kết quả học tập và chuyên cần của bạn tại lớp học hiện tại.
              </p>
            </div>
            
            {(() => {
              const classGrades = grades.filter(g => g.classId === activeClassId);
              const classAttendances = attendances.filter(a => a.classId === activeClassId);
              const activeClass = classes.find(c => c.classId === activeClassId);
              
              const validGrades = classGrades.map(g => parseFloat(g.grade)).filter(g => !isNaN(g));
              const avgScore = validGrades.length > 0 ? (validGrades.reduce((a, b) => a + b, 0) / validGrades.length).toFixed(1) : "Chưa có";
              
              const totalSessions = classAttendances.length;
              const presentSessions = classAttendances.filter(a => a.status === "P" || a.status === "M").length;
              const attendanceRate = totalSessions > 0 ? Math.round((presentSessions / totalSessions) * 100) + "%" : "Chưa có";
              
              return (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-5 rounded-2xl bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 flex flex-col justify-center items-center">
                    <div className="text-sm font-bold text-blue-600 dark:text-blue-400 mb-1">Điểm Trung Bình</div>
                    <div className="text-3xl font-black text-blue-700 dark:text-blue-300">{avgScore}</div>
                    <div className="text-xs text-blue-500 mt-1">{validGrades.length} bài kiểm tra</div>
                  </div>
                  
                  <div className="p-5 rounded-2xl bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-900/30 flex flex-col justify-center items-center">
                    <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400 mb-1">Tỉ Lệ Đi Học</div>
                    <div className="text-3xl font-black text-emerald-700 dark:text-emerald-300">{attendanceRate}</div>
                    <div className="text-xs text-emerald-500 mt-1">{presentSessions}/{totalSessions} buổi có mặt</div>
                  </div>
                  
                  <div className="p-5 rounded-2xl bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30 flex flex-col justify-center items-center">
                    <div className="text-sm font-bold text-amber-600 dark:text-amber-400 mb-1">Tiến Độ Lớp</div>
                    <div className="text-3xl font-black text-amber-700 dark:text-amber-300">{activeClass?.progressPercent || 0}%</div>
                    <div className="text-xs text-amber-500 mt-1">Hoàn thành khóa học</div>
                  </div>
                </div>
              );
            })()}

            <div className="bg-neutral-50 dark:bg-neutral-800/30 rounded-2xl p-6 border border-neutral-100 dark:border-neutral-800 mt-4 flex items-center justify-center gap-3">
              <Folder className="w-5 h-5 text-neutral-400" />
              <p className="text-sm text-neutral-500 font-medium">Chọn một chuyên đề ở cột bên trái để tải tài liệu và làm bài tập</p>
            </div>
          </div>
        ) : (
          <div className="p-6 rounded-3xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm space-y-6">
            <div className="border-b border-neutral-100 dark:border-neutral-800/60 pb-4">
              <h3 className="text-lg font-bold text-neutral-900 dark:text-white font-sans">Danh sách học liệu & Đề thi</h3>
              <p className="text-xs text-neutral-400 mt-1">Danh mục tài liệu PDF và bài tập đề thi tự luyện thuộc chuyên đề đã chọn.</p>
            </div>

            {loadingFiles ? (
              <div className="py-12 text-center text-neutral-400">Đang đồng bộ danh mục học liệu...</div>
            ) : files.length === 0 ? (
              <p className="text-center py-12 text-neutral-400 italic text-sm">Chưa có tài liệu hoặc đề thi nào được chia sẻ trong chuyên đề này.</p>
            ) : (
              <div className="space-y-4">
                {files.map((file: any) => {
                  const isPDF = file.fileType === "PDF";
                  const attemptsCount = getExamAttemptsCount(file.examId);
                  const bestScore = getExamBestScore(file.examId);
                  
                  return (
                    <div 
                      key={file.fileId} 
                      className="p-5 rounded-2xl border border-neutral-100 dark:border-neutral-855 bg-neutral-50/50 dark:bg-neutral-950/20 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all hover:bg-neutral-50 dark:hover:bg-neutral-900/40"
                    >
                      <div className="space-y-1.5 flex-1">
                        <div className="flex items-center gap-2">
                          {isPDF ? (
                            <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold text-[10px] uppercase tracking-wider flex items-center gap-1 font-sans">
                              <FileText className="w-3 h-3" /> Tài liệu PDF
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold text-[10px] uppercase tracking-wider flex items-center gap-1 font-sans">
                              <Play className="w-3 h-3" /> Đề kiểm tra online
                            </span>
                          )}
                          
                          {file.isGlobal && (
                            <span className="px-2 py-0.5 rounded bg-green-500/10 text-green-600 dark:text-green-400 font-bold text-[10px] uppercase tracking-wider font-sans">
                              Toàn trung tâm
                            </span>
                          )}
                        </div>
                        
                        <h4 className="font-bold text-neutral-900 dark:text-white text-base font-sans">{file.fileName}</h4>
                        {file.description && (
                          <p className="text-xs text-neutral-500 leading-relaxed font-semibold">{file.description}</p>
                        )}

                        {!isPDF && (
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-neutral-400 pt-1 font-semibold">
                            {bestScore !== null && (
                              <span className="text-green-600 dark:text-green-400 font-bold flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5" /> Điểm cao nhất: {bestScore.toFixed(1)}/10
                              </span>
                            )}
                            <span>Lượt làm bài: {attemptsCount} lần</span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2.5 flex-shrink-0 md:justify-end">
                        {isPDF ? (
                          <a
                            href={file.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-4 py-2.5 rounded-xl bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 hover:text-blue-600 dark:hover:text-blue-400 font-bold text-xs shadow-sm hover:shadow transition-all flex items-center gap-1.5 cursor-pointer"
                          >
                            <Download className="w-4 h-4" /> Xem & Tải PDF
                          </a>
                        ) : (
                          <div className="flex flex-col gap-2 w-full md:w-auto md:items-end">
                            <button
                              onClick={() => onStartExam(activeClassId, file.examId)}
                              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-bold text-xs shadow-sm hover:shadow transition-all flex items-center justify-center gap-1.5 cursor-pointer font-sans"
                            >
                              <Play className="w-4 h-4 fill-current" /> Bắt đầu thi thử
                            </button>
                            
                            {attempts.filter(att => att.examId === file.examId && att.status === "SUBMITTED").length > 0 && (
                              <div className="relative group">
                                <button className="text-[10px] text-neutral-400 font-bold hover:text-blue-500 underline flex items-center gap-0.5 cursor-pointer font-sans">
                                  Xem lịch sử làm bài ({attempts.filter(att => att.examId === file.examId && att.status === "SUBMITTED").length})
                                </button>
                                <div className="absolute right-0 top-full mt-1.5 hidden group-hover:block bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-850 rounded-xl shadow-xl p-2.5 w-60 z-30 animate-fade-in text-neutral-800 dark:text-neutral-200">
                                  <p className="text-[10px] font-bold text-neutral-400 uppercase border-b border-neutral-100 dark:border-neutral-800 pb-1.5 mb-1.5">Lịch sử các lần thi</p>
                                  <div className="space-y-1 max-h-36 overflow-y-auto pr-1">
                                    {attempts
                                      .filter(att => att.examId === file.examId && att.status === "SUBMITTED")
                                      .map((att: any) => (
                                        <button
                                          key={att.attemptId}
                                          onClick={() => onViewResult(att.attemptId)}
                                          className="w-full text-left p-1.5 rounded hover:bg-neutral-50 dark:hover:bg-neutral-800 text-xs flex justify-between items-center transition-colors cursor-pointer"
                                        >
                                          <span className="font-semibold text-neutral-600 dark:text-neutral-400">Lần {att.attemptNumber}</span>
                                          <span className="font-extrabold text-blue-600 dark:text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded text-[10px]">
                                            {att.totalScore?.toFixed(1)}đ
                                          </span>
                                        </button>
                                      ))}
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
