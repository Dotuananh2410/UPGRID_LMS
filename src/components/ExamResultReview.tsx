"use client";

import React, { useState } from "react";
import useSWR from "swr";
import { requestGas } from "@/utils/apiClient";
import MathRenderer from "./MathRenderer";
import { 
  ArrowLeft, CheckCircle2, XCircle, Clock, 
  Award, BookOpen, Loader2, AlertCircle, Eye
} from "lucide-react";

interface ExamResultReviewProps {
  attemptId: string;
  onClose: () => void;
}

function getSubQsArray(subQsRaw: any): any[] {
  if (!subQsRaw) return [];
  try {
    const parsed = typeof subQsRaw === "string" ? (subQsRaw.trim() ? JSON.parse(subQsRaw) : []) : subQsRaw;
    if (Array.isArray(parsed)) return parsed;
    if (parsed && typeof parsed === "object") return Object.values(parsed);
    return [];
  } catch (e) {
    console.error("Failed parsing subquestions:", e);
    return [];
  }
}

export default function ExamResultReview({ attemptId, onClose }: ExamResultReviewProps) {
  const [selectedQId, setSelectedQId] = useState<string | null>(null);

  const { data: attempt, error, isLoading } = useSWR(
    attemptId ? `getExamResult/${attemptId}` : null,
    () => requestGas<any>("getExamResult", { body: { attemptId } })
  );

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-white dark:bg-neutral-950 z-50 flex flex-col items-center justify-center font-sans">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
        <p className="mt-4 text-sm font-semibold text-neutral-500">Đang phân tích kết quả bài thi...</p>
      </div>
    );
  }

  if (error || !attempt) {
    return (
      <div className="fixed inset-0 bg-white dark:bg-neutral-950 z-50 flex flex-col items-center justify-center p-6 text-center font-sans">
        <div className="max-w-md p-6 rounded-2xl border border-red-500/20 bg-red-500/10 text-center space-y-4">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
          <h3 className="font-bold text-red-600 dark:text-red-400">Không thể tải kết quả</h3>
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            {error?.message || "Lỗi bất ngờ xảy ra khi đồng bộ bảng điểm."}
          </p>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-bold cursor-pointer"
          >
            Quay lại dashboard
          </button>
        </div>
      </div>
    );
  }

  // Calculate statistics
  const totalQuestions = attempt.questions.length;
  const correctCount = attempt.questions.filter((q: any) => q.isCorrect).length;
  const incorrectCount = totalQuestions - correctCount;
  
  const formatDuration = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    if (mins > 0) return `${mins} phút ${secs} giây`;
    return `${secs} giây`;
  };

  const scrollToQuestion = (qId: string) => {
    setSelectedQId(qId);
    const el = document.getElementById(`review-question-${qId}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  return (
    <div className="fixed inset-0 bg-neutral-50 dark:bg-neutral-950 z-50 overflow-hidden flex flex-col font-sans">
      {/* Header bar */}
      <header className="bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-850 px-6 py-4 flex items-center justify-between shadow-sm flex-shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-neutral-500 hover:text-neutral-800 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="font-extrabold text-base text-neutral-900 dark:text-white line-clamp-1">{attempt.examName}</h2>
            <p className="text-[10px] text-neutral-400 uppercase tracking-wider font-bold">Xem lại chi tiết bài làm</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-neutral-400 font-semibold hidden sm:inline">Hoàn thành lúc: {attempt.submitTime}</span>
        </div>
      </header>

      {/* Main layout split */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Side: Review Questions */}
        <main className="flex-1 overflow-y-auto p-6 md:p-10 space-y-8">
          <div className="max-w-3xl mx-auto space-y-8">
            {/* KPI statistics cards */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-850 p-6 rounded-3xl shadow-sm">
              <div className="text-center space-y-1 sm:border-r border-neutral-100 dark:border-neutral-800 pb-4 sm:pb-0">
                <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Tổng điểm</p>
                <p className="text-3xl font-extrabold text-blue-600 dark:text-blue-400">
                  {attempt.totalScore?.toFixed(1)} <span className="text-xs font-semibold text-neutral-400">/ {attempt.maxScore}đ</span>
                </p>
              </div>

              <div className="text-center space-y-1 sm:border-r border-neutral-100 dark:border-neutral-800 pb-4 sm:pb-0">
                <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Số câu đúng</p>
                <p className="text-2xl font-extrabold text-green-600 dark:text-green-400 flex items-center justify-center gap-1">
                  <CheckCircle2 className="w-5 h-5 flex-shrink-0" /> {correctCount} <span className="text-xs font-semibold text-neutral-400">/ {totalQuestions}</span>
                </p>
              </div>

              <div className="text-center space-y-1 sm:border-r border-neutral-100 dark:border-neutral-800 pb-4 sm:pb-0">
                <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Số câu sai</p>
                <p className="text-2xl font-extrabold text-rose-500 flex items-center justify-center gap-1">
                  <XCircle className="w-5 h-5 flex-shrink-0" /> {incorrectCount} <span className="text-xs font-semibold text-neutral-400">/ {totalQuestions}</span>
                </p>
              </div>

              <div className="text-center space-y-1">
                <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Thời gian làm</p>
                <p className="text-sm font-extrabold text-neutral-800 dark:text-neutral-200 mt-2 flex items-center justify-center gap-1">
                  <Clock className="w-4 h-4 text-neutral-400" /> {formatDuration(attempt.durationSeconds)}
                </p>
              </div>
            </div>

            {/* List of questions */}
            <div className="space-y-6">
              {attempt.questions.map((q: any) => {
                const subQs = getSubQsArray(q.subQuestions);
                const isTF = subQs.length > 0;
                const isMCQ = !isTF && (q.optionA || q.optionB);
                const isShort = !isTF && !isMCQ;

                return (
                  <div
                    key={q.questionId}
                    id={`review-question-${q.questionId}`}
                    className={`p-6 rounded-2xl border bg-white dark:bg-neutral-900 shadow-sm space-y-5 transition-all duration-300 ${
                      selectedQId === q.questionId
                        ? "ring-2 ring-blue-500 border-blue-500"
                        : "border-neutral-200 dark:border-neutral-850"
                    }`}
                  >
                    {/* Item header */}
                    <div className="flex justify-between items-center border-b border-neutral-100 dark:border-neutral-800 pb-3 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded font-extrabold bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300">
                          Câu {q.questionNumber}
                        </span>
                        
                        {q.isCorrect ? (
                          <span className="px-2 py-0.5 rounded-full bg-green-500/10 text-green-600 dark:text-green-400 font-extrabold flex items-center gap-0.5 border border-green-500/10">
                            <CheckCircle2 className="w-3 h-3" /> Chính xác
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-600 font-extrabold flex items-center gap-0.5 border border-rose-500/10">
                            <XCircle className="w-3 h-3" /> Sai hoặc chưa đúng hết
                          </span>
                        )}
                      </div>

                      <span className="font-extrabold text-neutral-500 dark:text-neutral-400">
                        Điểm đạt: <span className="text-blue-600 dark:text-blue-450">{q.pointsEarned?.toFixed(2)}đ</span>
                      </span>
                    </div>

                    {/* Question Content */}
                    <div className="text-neutral-850 dark:text-neutral-200 font-semibold leading-relaxed overflow-x-auto text-base">
                      <MathRenderer text={q.questionContent} />
                    </div>

                    {/* MCQ Options Display */}
                    {isMCQ && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                        {([
                          { key: "A", text: q.optionA },
                          { key: "B", text: q.optionB },
                          { key: "C", text: q.optionC },
                          { key: "D", text: q.optionD }
                        ]).filter(o => o.text).map((opt) => {
                          const isStudentSelected = q.studentAnswer === opt.key;
                          const isCorrectOpt = q.correctAnswer === opt.key;
                          
                          let cardClass = "bg-neutral-50/50 dark:bg-neutral-950/10 border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300";
                          let numClass = "bg-neutral-100 dark:bg-neutral-800 text-neutral-500";
                          
                          if (isCorrectOpt) {
                            cardClass = "bg-green-500/10 border-green-500 text-green-700 dark:text-green-400 font-bold";
                            numClass = "bg-green-500 text-white";
                          } else if (isStudentSelected && !isCorrectOpt) {
                            cardClass = "bg-rose-500/10 border-rose-500 text-rose-700 dark:text-rose-455 font-bold";
                            numClass = "bg-rose-500 text-white";
                          }

                          return (
                            <div
                              key={opt.key}
                              className={`p-3.5 rounded-xl border flex items-start gap-3 text-sm ${cardClass}`}
                            >
                              <span className={`w-5.5 h-5.5 rounded-full flex-shrink-0 flex items-center justify-center text-[10px] font-bold ${numClass}`}>
                                {opt.key}
                              </span>
                              <span className="overflow-x-auto flex-1 font-medium">
                                <MathRenderer text={opt.text!} />
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* True-False details table */}
                    {isTF && (
                      <div className="border border-neutral-200 dark:border-neutral-850 rounded-xl overflow-hidden shadow-sm">
                        <table className="w-full text-left border-collapse text-xs">
                          <thead>
                            <tr className="border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-950/20 text-neutral-400 font-bold uppercase tracking-wider">
                              <th className="p-3">Khẳng định</th>
                              <th className="p-3 text-center w-24">Bạn chọn</th>
                              <th className="p-3 text-center w-24">Đáp án</th>
                              <th className="p-3 text-center w-16">Kết quả</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-neutral-100 dark:divide-neutral-850 text-neutral-700 dark:text-neutral-300">
                            {subQs.map((sub: any, sIdx: number) => {
                              const studentSubAns = q.subAnswers?.find((sa: any) => sa.subIndex === sIdx)?.answer || "—";
                              const correctSubAns = sub.answer || "—";
                              const isSubCorrect = studentSubAns.toLowerCase() === correctSubAns.toLowerCase();

                              return (
                                <tr key={sIdx} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-805 font-medium">
                                  <td className="p-3 overflow-x-auto">
                                    <span className="inline-block mr-1 text-neutral-400 font-bold">({String.fromCharCode(97 + sIdx)})</span>
                                    <MathRenderer text={sub.text} />
                                  </td>
                                  <td className="p-3 text-center">
                                    <span className={`px-2 py-0.5 rounded font-extrabold ${
                                      studentSubAns === "T" 
                                        ? "bg-green-500/10 text-green-600" 
                                        : studentSubAns === "F" 
                                          ? "bg-rose-500/10 text-rose-600" 
                                          : "text-neutral-400"
                                    }`}>
                                      {studentSubAns === "T" ? "Đúng" : studentSubAns === "F" ? "Sai" : "—"}
                                    </span>
                                  </td>
                                  <td className="p-3 text-center font-bold text-neutral-900 dark:text-white">
                                    {correctSubAns === "T" ? "Đúng" : correctSubAns === "F" ? "Sai" : "—"}
                                  </td>
                                  <td className="p-3 text-center">
                                    {isSubCorrect ? (
                                      <CheckCircle2 className="w-4.5 h-4.5 text-green-600 mx-auto" />
                                    ) : (
                                      <XCircle className="w-4.5 h-4.5 text-rose-500 mx-auto" />
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {/* Short Answer result */}
                    {isShort && (
                      <div className="p-4 bg-neutral-50/50 dark:bg-neutral-950/20 border border-neutral-200 dark:border-neutral-800 rounded-xl space-y-2 text-sm">
                        <div className="flex items-center gap-2">
                          <span className="text-neutral-400 font-semibold">Bạn điền:</span>
                          <span className={`font-mono font-bold px-2 py-0.5 rounded ${
                            q.isCorrect 
                              ? "bg-green-500/10 text-green-600" 
                              : "bg-rose-500/10 text-rose-600"
                          }`}>
                            {q.studentAnswer || "—"}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-neutral-400 font-semibold">Đáp án đúng:</span>
                          <span className="font-mono font-bold text-neutral-900 dark:text-white">{q.correctAnswer}</span>
                        </div>
                      </div>
                    )}

                    {/* LaTeX Solution Box */}
                    {q.solution && (
                      <div className="p-4 bg-blue-500/5 border border-blue-500/15 rounded-xl space-y-2 text-sm leading-relaxed">
                        <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider flex items-center gap-1">
                          <Eye className="w-3.5 h-3.5" /> Lời giải chi tiết:
                        </span>
                        <div className="text-neutral-700 dark:text-neutral-300 font-medium overflow-x-auto">
                          <MathRenderer text={q.solution} />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </main>

        {/* Right Sidebar: Navigator grid */}
        <aside className="w-80 border-l border-neutral-200 dark:border-neutral-850 bg-white dark:bg-neutral-900 flex flex-col overflow-hidden">
          <div className="p-5 border-b border-neutral-100 dark:border-neutral-800">
            <h3 className="font-extrabold text-sm text-neutral-900 dark:text-white uppercase tracking-wider">Danh mục kết quả</h3>
            <p className="text-[10px] text-neutral-400 font-semibold mt-1">Bấm số câu để xem lại phương pháp giải chi tiết.</p>
          </div>

          <div className="flex-1 overflow-y-auto p-5">
            <div className="grid grid-cols-5 gap-2.5">
              {attempt.questions.map((q: any) => (
                <button
                  key={q.questionId}
                  onClick={() => scrollToQuestion(q.questionId)}
                  className={`w-11 h-11 rounded-xl text-xs font-bold flex items-center justify-center cursor-pointer transition-all hover:scale-105 border ${
                    selectedQId === q.questionId 
                      ? "ring-4 ring-blue-500/40 border-blue-600" 
                      : "border-transparent"
                  } ${
                    q.isCorrect
                      ? "bg-green-500/10 text-green-700 dark:text-green-400 border border-green-500/20"
                      : "bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/20"
                  }`}
                >
                  {q.questionNumber}
                </button>
              ))}
            </div>
          </div>

          {/* Quick colors definition */}
          <div className="p-5 border-t border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-950/20 text-[10px] text-neutral-400 font-bold uppercase tracking-wider space-y-2">
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 rounded bg-green-500/10 border border-green-500/25 flex-shrink-0" />
              <span>Khẳng định/Đáp án chính xác</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 rounded bg-rose-500/10 border border-rose-500/25 flex-shrink-0" />
              <span>Đáp án lựa chọn chưa chính xác</span>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
