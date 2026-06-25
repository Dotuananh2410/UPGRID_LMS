"use client";

import React, { useState, useEffect, useRef } from "react";
import { requestGas } from "@/utils/apiClient";
import MathRenderer from "./MathRenderer";
import { 
  Clock, Send, ChevronLeft, ChevronRight, 
  AlertTriangle, Check, Loader2, BookOpen, AlertCircle
} from "lucide-react";

interface Question {
  questionId: string;
  examId: string;
  sectionTypeId: string;
  questionNumber: number;
  questionContent: string;
  optionA?: string;
  optionB?: string;
  optionC?: string;
  optionD?: string;
  subQuestions?: { text: string }[] | null;
  difficulty?: string;
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

interface OnlineExamProps {
  attemptId: string;
  examId: string;
  examName: string;
  durationMinutes: number;
  questions: Question[];
  onClose: () => void;
  onSubmitSuccess: (attemptId: string) => void;
}

export default function OnlineExam({
  attemptId,
  examId,
  examName,
  durationMinutes,
  questions,
  onClose,
  onSubmitSuccess
}: OnlineExamProps) {
  const [currentIdx, setCurrentIdx] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<number>(durationMinutes * 60);
  const [answers, setAnswers] = useState<Record<string, { studentAnswer?: string; subAnswers?: { subIndex: number; answer: string }[] }>>({});
  
  const [isSaving, setIsSaving] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const autoSaveRef = useRef<NodeJS.Timeout | null>(null);

  // Load questions and initialize answers state
  useEffect(() => {
    // Start countdown
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Start auto-saving state every 30 seconds
    autoSaveRef.current = setInterval(() => {
      saveProgress();
    }, 30000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (autoSaveRef.current) clearInterval(autoSaveRef.current);
    };
  }, []);

  const getAnswersList = () => {
    return Object.keys(answers).map((qId) => ({
      questionId: qId,
      studentAnswer: answers[qId].studentAnswer || "",
      subAnswers: answers[qId].subAnswers || null
    }));
  };

  const saveProgress = async () => {
    if (timeLeft <= 0) return;
    setIsSaving(true);
    try {
      const payload = {
        attemptId,
        answers: getAnswersList()
      };
      await requestGas("saveExamProgress", {
        method: "POST",
        body: payload
      });
    } catch (err) {
      console.error("Auto save progress failed:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAutoSubmit = async () => {
    setIsSubmitting(true);
    try {
      // First save current progress
      const answersList = getAnswersList();
      await requestGas("saveExamProgress", {
        method: "POST",
        body: { attemptId, answers: answersList }
      });
      // Then submit
      await requestGas("submitExam", {
        method: "POST",
        body: { attemptId }
      });
      onSubmitSuccess(attemptId);
    } catch (err: any) {
      setErrorMsg(err.message || "Lỗi tự động nộp bài khi hết giờ.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleManualSubmit = async () => {
    setShowWarningModal(false);
    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      // Save progress final time
      const answersList = getAnswersList();
      await requestGas("saveExamProgress", {
        method: "POST",
        body: { attemptId, answers: answersList }
      });
      // Submit
      await requestGas("submitExam", {
        method: "POST",
        body: { attemptId }
      });
      onSubmitSuccess(attemptId);
    } catch (err: any) {
      setErrorMsg(err.message || "Gặp lỗi trong quá trình nộp bài.");
      setIsSubmitting(false);
    }
  };

  const checkUnanswered = () => {
    let unansweredCount = 0;
    questions.forEach((q) => {
      const ans = answers[q.questionId];
      if (!ans) {
        unansweredCount++;
        return;
      }
      
      const subQs = getSubQsArray(q.subQuestions);
      const isTF = subQs.length > 0;
      if (isTF) {
        const subCount = subQs.length;
        const answeredSubCount = ans.subAnswers?.filter(sa => sa.answer === "T" || sa.answer === "F").length || 0;
        if (answeredSubCount < subCount) {
          unansweredCount++;
        }
      } else {
        if (!ans.studentAnswer || ans.studentAnswer.trim() === "") {
          unansweredCount++;
        }
      }
    });
    return unansweredCount;
  };

  const onSubmitClick = () => {
    const unansweredCount = checkUnanswered();
    if (unansweredCount > 0) {
      setShowWarningModal(true);
    } else {
      if (window.confirm("Bạn có chắc chắn muốn nộp bài thi?")) {
        handleManualSubmit();
      }
    }
  };

  // Format time (MM:SS) or (HH:MM:SS)
  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    const pad = (n: number) => n.toString().padStart(2, "0");
    
    if (hrs > 0) {
      return `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
    }
    return `${pad(mins)}:${pad(secs)}`;
  };

  const handleMCQSelect = (questionId: string, option: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: {
        ...prev[questionId],
        studentAnswer: option
      }
    }));
  };

  const handleTFSelect = (questionId: string, subIdx: number, val: "T" | "F") => {
    setAnswers((prev) => {
      const currentSubAnswers = prev[questionId]?.subAnswers || [];
      const updated = currentSubAnswers.filter((sa) => sa.subIndex !== subIdx);
      updated.push({ subIndex: subIdx, answer: val });
      
      return {
        ...prev,
        [questionId]: {
          ...prev[questionId],
          subAnswers: updated.sort((a, b) => a.subIndex - b.subIndex)
        }
      };
    });
  };

  const handleShortAnswerChange = (questionId: string, text: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: {
        ...prev[questionId],
        studentAnswer: text
      }
    }));
  };

  const activeQuestion = questions[currentIdx];
  const activeAnswer = answers[activeQuestion?.questionId] || {};
  const isLastQuestion = currentIdx === questions.length - 1;

  // Determine helper colors for navigation sidebar
  const getQuestionStatusClass = (idx: number) => {
    const q = questions[idx];
    const ans = answers[q.questionId];
    const isActive = currentIdx === idx;

    if (isActive) {
      return "ring-4 ring-blue-500 bg-blue-600 text-white font-bold";
    }

    if (!ans) return "bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 border border-neutral-300 dark:border-neutral-700";

    const subQs = getSubQsArray(q.subQuestions);
    const isTF = subQs.length > 0;
    if (isTF) {
      const subCount = subQs.length;
      const answeredSubCount = ans.subAnswers?.length || 0;
      if (answeredSubCount === subCount) {
        return "bg-green-500/20 text-green-700 dark:text-green-400 border border-green-500/30 font-bold";
      }
      return "bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20 font-bold";
    } else {
      if (ans.studentAnswer && ans.studentAnswer.trim() !== "") {
        return "bg-green-500/20 text-green-700 dark:text-green-400 border border-green-500/30 font-bold";
      }
    }

    return "bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 border border-neutral-300 dark:border-neutral-700";
  };

  return (
    <div className="fixed inset-0 bg-neutral-100 dark:bg-neutral-950 z-50 overflow-hidden flex flex-col font-sans">
      {/* Top Banner Bar */}
      <header className="bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-850 px-6 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <BookOpen className="w-6 h-6 text-blue-600" />
          <div>
            <h2 className="font-extrabold text-base text-neutral-900 dark:text-white line-clamp-1">{examName}</h2>
            <p className="text-[10px] text-neutral-400 uppercase tracking-wider font-bold">Lượt làm bài #{attemptId.substring(15)}</p>
          </div>
        </div>

        {/* Timer Box */}
        <div className="flex items-center gap-4">
          {isSaving && (
            <span className="text-xs text-neutral-400 flex items-center gap-1">
              <Loader2 className="w-3.5 h-3.5 animate-spin" /> Đang tự động lưu...
            </span>
          )}
          <div className={`px-4 py-2 rounded-xl flex items-center gap-2 font-mono text-base font-extrabold shadow-sm ${
            timeLeft < 300 
              ? "bg-red-500/10 text-red-600 border border-red-500/20 animate-pulse" 
              : "bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 text-neutral-800 dark:text-neutral-200"
          }`}>
            <Clock className="w-4 h-4" />
            <span>{formatTime(timeLeft)}</span>
          </div>

          <button
            onClick={onSubmitClick}
            disabled={isSubmitting}
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-extrabold text-sm shadow flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            Nộp bài
          </button>
        </div>
      </header>

      {/* Error notification if any */}
      {errorMsg && (
        <div className="bg-red-500/10 border-b border-red-500/25 text-red-600 px-6 py-3 text-sm font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Main Workspace split screen */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Side: Active Question displays */}
        <main className="flex-1 overflow-y-auto p-6 md:p-10 space-y-6">
          {activeQuestion ? (
            <div className="max-w-3xl mx-auto space-y-6">
              {/* Question card header details */}
              <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 pb-3">
                <span className="px-3 py-1 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 font-extrabold text-xs">
                  Câu hỏi {activeQuestion.questionNumber}
                </span>
                
                {activeQuestion.difficulty && (
                  <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded ${
                    activeQuestion.difficulty === "Khó"
                      ? "bg-rose-500/10 text-rose-600"
                      : activeQuestion.difficulty === "Trung bình"
                        ? "bg-amber-500/10 text-amber-600"
                        : "bg-green-500/10 text-green-600"
                  }`}>
                    Độ khó: {activeQuestion.difficulty}
                  </span>
                )}
              </div>

              {/* Question Text with LaTeX */}
              <div className="text-neutral-850 dark:text-neutral-250 text-base md:text-lg leading-relaxed font-semibold bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-850 p-6 rounded-2xl shadow-sm overflow-x-auto">
                <MathRenderer text={activeQuestion.questionContent} />
              </div>

              {/* Input Answers depending on question type */}
              <div className="space-y-4 pt-2">
                {/* MCQ Question Mode */}
                {getSubQsArray(activeQuestion.subQuestions).length === 0 && (activeQuestion.optionA || activeQuestion.optionB) && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {([
                      { key: "A", text: activeQuestion.optionA },
                      { key: "B", text: activeQuestion.optionB },
                      { key: "C", text: activeQuestion.optionC },
                      { key: "D", text: activeQuestion.optionD }
                    ]).filter(opt => opt.text).map((opt) => {
                      const isSelected = activeAnswer.studentAnswer === opt.key;
                      return (
                        <button
                          key={opt.key}
                          onClick={() => handleMCQSelect(activeQuestion.questionId, opt.key)}
                          className={`p-4 rounded-xl border text-left flex items-start gap-3 transition-all hover:bg-neutral-50 dark:hover:bg-neutral-905 cursor-pointer hover:scale-[1.01] ${
                            isSelected
                              ? "bg-blue-500/10 border-blue-500 text-blue-600 dark:text-blue-400 shadow-sm font-bold"
                              : "bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300"
                          }`}
                        >
                          <span className={`w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold ${
                            isSelected
                              ? "bg-blue-500 text-white"
                              : "bg-neutral-100 dark:bg-neutral-800 text-neutral-500"
                          }`}>
                            {opt.key}
                          </span>
                          <span className="text-sm font-medium pt-0.5 overflow-x-auto flex-1">
                            <MathRenderer text={opt.text!} />
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* True-False subquestions layout */}
                {(() => {
                  const subQs = getSubQsArray(activeQuestion.subQuestions);
                  if (subQs.length === 0) return null;
                  return (
                    <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-850 rounded-2xl overflow-hidden shadow-sm">
                      <table className="w-full text-left border-collapse text-sm">
                        <thead>
                          <tr className="border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-950/20 text-xs font-bold text-neutral-400 uppercase tracking-wider">
                            <th className="p-4">Nội dung khẳng định</th>
                            <th className="p-4 text-center w-28">Đúng (T)</th>
                            <th className="p-4 text-center w-28">Sai (F)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800 text-neutral-700 dark:text-neutral-300">
                          {subQs.map((sub, sIdx) => {
                            const userSubAns = activeAnswer.subAnswers?.find(sa => sa.subIndex === sIdx)?.answer;
                            
                            return (
                              <tr key={sIdx} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-805">
                                <td className="p-4 font-semibold leading-relaxed overflow-x-auto">
                                  <span className="inline-block mr-1 text-neutral-400 font-bold">({String.fromCharCode(97 + sIdx)})</span>
                                  <MathRenderer text={sub.text} />
                                </td>
                                <td className="p-4 text-center">
                                  <button
                                    type="button"
                                    onClick={() => handleTFSelect(activeQuestion.questionId, sIdx, "T")}
                                    className={`w-10 h-10 rounded-full border font-bold transition-all cursor-pointer inline-flex items-center justify-center ${
                                      userSubAns === "T"
                                        ? "bg-green-500 border-green-600 text-white shadow-sm"
                                        : "bg-neutral-50 dark:bg-neutral-950 border-neutral-250 dark:border-neutral-800 text-neutral-400 hover:text-green-500"
                                    }`}
                                  >
                                    Đ
                                  </button>
                                </td>
                                <td className="p-4 text-center">
                                  <button
                                    type="button"
                                    onClick={() => handleTFSelect(activeQuestion.questionId, sIdx, "F")}
                                    className={`w-10 h-10 rounded-full border font-bold transition-all cursor-pointer inline-flex items-center justify-center ${
                                      userSubAns === "F"
                                        ? "bg-rose-500 border-rose-600 text-white shadow-sm"
                                        : "bg-neutral-50 dark:bg-neutral-950 border-neutral-250 dark:border-neutral-800 text-neutral-400 hover:text-rose-500"
                                    }`}
                                  >
                                    S
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  );
                })()}

                {/* Short Answer text field */}
                {getSubQsArray(activeQuestion.subQuestions).length === 0 && !activeQuestion.optionA && !activeQuestion.optionB && (
                  <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-850 p-5 rounded-2xl shadow-sm space-y-2">
                    <label className="block text-xs font-bold text-neutral-400 uppercase tracking-wider">Đáp án điền số tự do:</label>
                    <input
                      type="text"
                      value={activeAnswer.studentAnswer || ""}
                      onChange={(e) => handleShortAnswerChange(activeQuestion.questionId, e.target.value)}
                      placeholder="Nhập kết quả số hoặc biểu thức ngắn..."
                      className="w-full px-4 py-3 border border-neutral-300 dark:border-neutral-700 rounded-xl bg-neutral-50 dark:bg-neutral-950 text-sm font-bold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                )}
              </div>

              {/* Prev / Next buttons */}
              <div className="flex justify-between items-center pt-8 border-t border-neutral-200 dark:border-neutral-850">
                <button
                  disabled={currentIdx === 0}
                  onClick={() => setCurrentIdx(prev => prev - 1)}
                  className="px-4 py-2.5 rounded-xl border border-neutral-250 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-xs font-bold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 disabled:opacity-40 transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" /> Câu trước
                </button>

                <div className="text-xs font-bold text-neutral-400">
                  {currentIdx + 1} / {questions.length}
                </div>

                {isLastQuestion ? (
                  <button
                    onClick={onSubmitClick}
                    className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-extrabold shadow flex items-center gap-1.5 cursor-pointer"
                  >
                    Nộp bài thi <Send className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <button
                    onClick={() => setCurrentIdx(prev => prev + 1)}
                    className="px-4 py-2.5 rounded-xl border border-neutral-250 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-xs font-bold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    Câu tiếp <ChevronRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-neutral-400 font-semibold">
              Không có dữ liệu câu hỏi trong đề thi này.
            </div>
          )}
        </main>

        {/* Right Sidebar: Navigator grid */}
        <aside className="w-80 border-l border-neutral-200 dark:border-neutral-850 bg-white dark:bg-neutral-900 flex flex-col overflow-hidden">
          <div className="p-5 border-b border-neutral-100 dark:border-neutral-800">
            <h3 className="font-extrabold text-sm text-neutral-900 dark:text-white uppercase tracking-wider">Danh mục câu hỏi</h3>
            <p className="text-[10px] text-neutral-400 font-semibold mt-1">Bấm số câu để nhảy nhanh đến câu hỏi tương ứng.</p>
          </div>

          <div className="flex-1 overflow-y-auto p-5">
            <div className="grid grid-cols-5 gap-2.5">
              {questions.map((q, idx) => (
                <button
                  key={q.questionId}
                  onClick={() => setCurrentIdx(idx)}
                  className={`w-11 h-11 rounded-xl text-xs font-bold flex items-center justify-center cursor-pointer transition-all hover:scale-105 ${getQuestionStatusClass(idx)}`}
                >
                  {q.questionNumber}
                </button>
              ))}
            </div>
          </div>

          {/* Quick Info card */}
          <div className="p-5 border-t border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-950/20 space-y-3">
            <div className="flex justify-between items-center text-xs font-semibold">
              <span className="text-neutral-400">Đã trả lời:</span>
              <span className="text-neutral-800 dark:text-white font-extrabold">
                {questions.length - checkUnanswered()} / {questions.length} câu
              </span>
            </div>
            <div className="w-full bg-neutral-200 dark:bg-neutral-800 rounded-full h-1.5 overflow-hidden">
              <div 
                className="bg-green-500 h-full rounded-full transition-all duration-350" 
                style={{ width: `${((questions.length - checkUnanswered()) / questions.length) * 100}%` }}
              />
            </div>
          </div>
        </aside>
      </div>

      {/* Warning confirmation modal */}
      {showWarningModal && (
        <div className="fixed inset-0 bg-neutral-950/50 z-[60] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-250 dark:border-neutral-800 max-w-sm w-full p-6 text-center space-y-4 shadow-2xl animate-scale-up">
            <div className="w-12 h-12 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="space-y-1.5">
              <h3 className="font-extrabold text-base text-neutral-900 dark:text-white">Chưa hoàn thành hết câu hỏi!</h3>
              <p className="text-xs text-neutral-500 leading-relaxed font-semibold">
                Bạn còn <span className="text-red-500 font-extrabold">{checkUnanswered()} câu hỏi</span> chưa được điền đáp án. Bạn có muốn nộp bài ngay bây giờ không?
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={() => setShowWarningModal(false)}
                className="py-2.5 rounded-xl border border-neutral-250 dark:border-neutral-800 text-xs font-bold text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 cursor-pointer"
              >
                Làm tiếp
              </button>
              <button
                onClick={handleManualSubmit}
                className="py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-extrabold shadow cursor-pointer"
              >
                Nộp luôn
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
