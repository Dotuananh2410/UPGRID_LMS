"use client";

import React, { useState, useEffect } from "react";
import { requestGas } from "@/utils/apiClient";
import MathRenderer from "./MathRenderer";
import { 
  Sparkles, Save, CheckCircle2, ChevronRight, 
  HelpCircle, Eye, AlertCircle, Loader2, ArrowLeft, 
  Settings, Layers, FileCode, Check, Trash2, ShieldAlert,
  Plus
} from "lucide-react";

interface ExamBuilderProps {
  teacherId: string;
  onClose: () => void;
  initialFolderId?: string;
  inline?: boolean;
}

interface SectionData {
  id: string;
  sectionName: string;
  questionType: "MCQ" | "TRUE_FALSE" | "SHORT_ANSWER";
  questionCount: number;
  pointsPerQuestion: number;
  latex: string;
  parsedQuestions: any[];
  isRendering: boolean;
}

export default function ExamBuilder({ teacherId, onClose, initialFolderId, inline = false }: ExamBuilderProps) {
  const [examName, setExamName] = useState("");
  const [durationMinutes, setDurationMinutes] = useState(90);
  const [sections, setSections] = useState<SectionData[]>([
    {
      id: "sec_1",
      sectionName: "Phần 1",
      questionType: "MCQ",
      questionCount: 4,
      pointsPerQuestion: 0.5,
      latex: "",
      parsedQuestions: [],
      isRendering: false
    }
  ]);
  
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const showMessage = (type: "success" | "error", text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  const addSection = () => {
    setSections([...sections, {
      id: `sec_${Date.now()}`,
      sectionName: `Phần ${sections.length + 1}`,
      questionType: "MCQ",
      questionCount: 1,
      pointsPerQuestion: 1,
      latex: "",
      parsedQuestions: [],
      isRendering: false
    }]);
  };

  const removeSection = (id: string) => {
    if (sections.length === 1) {
      showMessage("error", "Đề thi phải có ít nhất 1 phần!");
      return;
    }
    setSections(sections.filter(s => s.id !== id));
  };

  const updateSection = (id: string, updates: Partial<SectionData>) => {
    setSections(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
  };

  const handleRenderSection = async (section: SectionData) => {
    if (!section.latex.trim()) {
      showMessage("error", `Vui lòng nhập LaTeX cho ${section.sectionName}`);
      return;
    }
    
    updateSection(section.id, { isRendering: true, parsedQuestions: [] });
    
    try {
      const res = await requestGas<any[]>("parseLatexSection", {
        method: "POST",
        body: {
          latex: section.latex,
          questionType: section.questionType,
          expectedCount: section.questionCount
        }
      });
      
      const mapped = res.map((q: any) => ({
        questionContent: q.questionContent || "",
        optionA: q.optionA || "",
        optionB: q.optionB || "",
        optionC: q.optionC || "",
        optionD: q.optionD || "",
        subQuestions: q.subQuestions || null,
        correctAnswer: q.correctAnswer || "",
        solution: q.solution || "",
        difficulty: q.difficulty || "Trung bình"
      }));

      updateSection(section.id, { parsedQuestions: mapped });
      showMessage("success", `AI đã dịch thành công ${mapped.length} câu hỏi cho ${section.sectionName}!`);
    } catch (err: any) {
      showMessage("error", err.message || `Lỗi biên dịch LaTeX phần ${section.sectionName}`);
    } finally {
      updateSection(section.id, { isRendering: false });
    }
  };

  const handleSaveExam = async () => {
    if (!examName.trim()) {
      showMessage("error", "Vui lòng nhập tên đề kiểm tra!");
      return;
    }
    
    // Validate all sections are rendered
    const unrendered = sections.filter(s => s.parsedQuestions.length === 0);
    if (unrendered.length > 0) {
      showMessage("error", `Vui lòng Render LaTeX cho ${unrendered[0].sectionName} trước khi lưu!`);
      return;
    }

    // Validate expected question count matches parsed
    const mismatched = sections.filter(s => s.parsedQuestions.length !== s.questionCount);
    if (mismatched.length > 0) {
      showMessage("error", `Số câu hỏi của ${mismatched[0].sectionName} không khớp với cấu hình (${mismatched[0].parsedQuestions.length}/${mismatched[0].questionCount})`);
      return;
    }

    setIsSaving(true);
    try {
      await requestGas("createCustomExam", {
        method: "POST",
        body: {
          examName,
          durationMinutes,
          subject: "Toán", 
          grade: "Lớp 9",
          targetFolderId: initialFolderId || "",
          sections: sections.map(s => ({
            sectionName: s.sectionName,
            questionType: s.questionType,
            questionCount: s.questionCount,
            pointsPerQuestion: s.pointsPerQuestion,
            parsedQuestions: s.parsedQuestions
          }))
        }
      });
      
      showMessage("success", `Đã lưu cấu hình đề thi "${examName}" vào Kho Chuyên Đề thành công!`);
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err: any) {
      showMessage("error", err.message || "Lỗi khi lưu đề kiểm tra");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className={`flex flex-col bg-neutral-50 dark:bg-neutral-950 font-sans ${inline ? 'h-full' : 'fixed inset-0 z-50'}`}>
      
      {/* HEADER CONFIG BAR */}
      <div className="bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800 p-4 shadow-sm flex items-center justify-between z-10 shrink-0">
        <div className="flex items-center gap-4 flex-1">
          {!inline && (
            <button onClick={onClose} className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg text-neutral-500">
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <div className="flex flex-col">
            <h2 className="text-sm font-bold text-neutral-800 dark:text-neutral-100">Cấu hình đề kiểm tra mới</h2>
            <div className="flex items-center gap-2 mt-1">
              <input 
                type="text" 
                value={examName}
                onChange={e => setExamName(e.target.value)}
                placeholder="Tên đề kiểm tra (VD: Đề thi thử tháng 3...)"
                className="w-64 px-3 py-1.5 text-xs border rounded bg-neutral-50 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 font-bold outline-none focus:ring-1 focus:ring-blue-500"
              />
              <span className="text-xs text-neutral-500 font-bold mx-2 tracking-widest uppercase">Thời gian:</span>
              <input 
                type="number" 
                value={durationMinutes}
                onChange={e => setDurationMinutes(parseInt(e.target.value) || 0)}
                className="w-16 px-2 py-1.5 text-xs border rounded bg-neutral-50 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 text-center font-bold outline-none"
              />
              <span className="text-xs text-neutral-500 font-bold tracking-widest uppercase">Phút</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {message && (
            <div className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 animate-fade-in ${
              message.type === 'error' ? 'bg-red-100 text-red-700 border border-red-200' : 'bg-green-100 text-green-700 border border-green-200'
            }`}>
              {message.type === 'error' ? <AlertCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
              {message.text}
            </div>
          )}
          <button 
            onClick={handleSaveExam}
            disabled={isSaving}
            className="px-6 py-2.5 bg-neutral-900 dark:bg-white text-white dark:text-black font-extrabold text-xs rounded-xl shadow-md hover:bg-neutral-800 dark:hover:bg-neutral-200 flex items-center gap-2 uppercase tracking-widest transition-all disabled:opacity-50"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            SAVE
          </button>
          {inline && (
            <button onClick={onClose} className="p-2 text-neutral-500 hover:text-neutral-800 ml-2">
              <XIcon className="w-6 h-6" />
            </button>
          )}
        </div>
      </div>

      {/* MAIN CONTENT AREA */}
      <div className="flex flex-1 overflow-hidden">
        
        {/* LEFT PANEL: SECTIONS */}
        <div className="w-1/3 min-w-[350px] border-r border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 overflow-y-auto p-4 space-y-4 shadow-inner custom-scrollbar">
          {sections.map((section, idx) => (
            <div key={section.id} className="border-2 border-neutral-200 dark:border-neutral-800 rounded-xl overflow-hidden shadow-sm">
              <div className="bg-neutral-100 dark:bg-neutral-800 px-3 py-2 border-b border-neutral-200 dark:border-neutral-700 flex justify-between items-center">
                <input 
                  type="text"
                  value={section.sectionName}
                  onChange={e => updateSection(section.id, { sectionName: e.target.value })}
                  className="bg-transparent font-bold text-xs text-neutral-800 dark:text-neutral-200 focus:outline-none w-full mr-2"
                />
                <button onClick={() => removeSection(section.id)} className="text-red-500 hover:text-red-700 p-1 rounded-md hover:bg-red-50 transition-colors">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
              
              <div className="p-3 space-y-3">
                {/* Config Row */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-extrabold text-neutral-500 uppercase tracking-wider">Style Section</label>
                    <select 
                      value={section.questionType}
                      onChange={e => updateSection(section.id, { questionType: e.target.value as any })}
                      className="w-full mt-1 px-2 py-1.5 text-xs border-2 border-neutral-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-900 font-bold text-neutral-700 dark:text-neutral-300 outline-none"
                    >
                      <option value="MCQ">ABCD</option>
                      <option value="TRUE_FALSE">TRUE/FALSE</option>
                      <option value="SHORT_ANSWER">Điền từ</option>
                    </select>
                  </div>
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <label className="text-[10px] font-extrabold text-neutral-500 uppercase tracking-wider">Số câu</label>
                      <input 
                        type="number"
                        value={section.questionCount}
                        onChange={e => updateSection(section.id, { questionCount: parseInt(e.target.value) || 1 })}
                        className="w-full mt-1 px-2 py-1.5 text-xs border-2 border-neutral-200 dark:border-neutral-700 rounded-lg text-center font-bold outline-none"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="text-[10px] font-extrabold text-neutral-500 uppercase tracking-wider">Điểm/câu</label>
                      <input 
                        type="number"
                        step="0.1"
                        value={section.pointsPerQuestion}
                        onChange={e => updateSection(section.id, { pointsPerQuestion: parseFloat(e.target.value) || 0 })}
                        className="w-full mt-1 px-2 py-1.5 text-xs border-2 border-neutral-200 dark:border-neutral-700 rounded-lg text-center font-bold outline-none"
                      />
                    </div>
                  </div>
                </div>
                
                {/* LaTeX Input */}
                <div>
                  <label className="text-[10px] font-extrabold text-neutral-500 uppercase tracking-wider flex items-center justify-between mb-1">
                    <span>INSERT LATEX</span>
                  </label>
                  <textarea 
                    rows={8}
                    value={section.latex}
                    onChange={e => updateSection(section.id, { latex: e.target.value })}
                    placeholder="% Nhập mã nguồn LaTeX vào đây..."
                    className="w-full p-2.5 text-xs font-mono border-2 border-neutral-200 dark:border-neutral-700 rounded-xl bg-neutral-50 dark:bg-neutral-950 focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 resize-y text-neutral-600 dark:text-neutral-400 custom-scrollbar"
                  />
                </div>
                
                {/* Render Button */}
                <button 
                  onClick={() => handleRenderSection(section)}
                  disabled={section.isRendering}
                  className="w-full py-2.5 bg-neutral-800 dark:bg-neutral-200 hover:bg-neutral-900 dark:hover:bg-white text-white dark:text-black font-bold text-xs uppercase tracking-widest rounded-xl shadow transition-all flex items-center justify-center gap-2"
                >
                  {section.isRendering ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  Render
                </button>
              </div>
            </div>
          ))}

          <button 
            onClick={addSection}
            className="w-full py-3.5 border-2 border-dashed border-neutral-300 dark:border-neutral-700 hover:border-neutral-400 dark:hover:border-neutral-500 rounded-xl text-neutral-500 font-extrabold text-xs flex items-center justify-center gap-2 transition-colors uppercase tracking-widest bg-neutral-50 dark:bg-neutral-900"
          >
            <Plus className="w-4 h-4" /> THÊM SECTION
          </button>
        </div>

        {/* RIGHT PANEL: PREVIEW */}
        <div className="flex-1 bg-neutral-100 dark:bg-neutral-950 p-6 overflow-y-auto custom-scrollbar">
          <div className="max-w-4xl mx-auto space-y-6">
            
            {/* Exam Header Preview */}
            <div className="text-center space-y-2 mb-8 border-b-2 border-dashed border-neutral-300 dark:border-neutral-700 pb-6">
              <h1 className="text-2xl font-black text-neutral-900 dark:text-white uppercase tracking-tight">
                {examName || "CHƯA ĐẶT TÊN ĐỀ KIỂM TRA"}
              </h1>
              <div className="flex justify-center items-center gap-6 text-xs font-bold text-neutral-500 uppercase tracking-widest">
                <span>MÔN: TOÁN</span>
                <span className="w-1.5 h-1.5 rounded-full bg-neutral-300"></span>
                <span>THỜI GIAN: {durationMinutes} PHÚT</span>
              </div>
            </div>

            {/* Sections Preview */}
            {sections.map((section) => (
              <div key={`preview-${section.id}`} className="bg-white dark:bg-neutral-900 border-2 border-neutral-800 dark:border-neutral-200 rounded-xl p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                  <h3 className="font-black text-neutral-800 dark:text-white uppercase text-base tracking-wide">
                    {section.sectionName}: {section.questionType === "MCQ" ? "Trắc nghiệm khách quan" : section.questionType === "TRUE_FALSE" ? "Câu hỏi Đúng/Sai" : "Trả lời ngắn"}
                  </h3>
                  <div className="flex-1 border-b-2 border-dotted border-neutral-300 dark:border-neutral-700 mx-2"></div>
                  <span className="text-xs font-bold text-neutral-500 uppercase tracking-widest">
                    {section.parsedQuestions.length}/{section.questionCount} câu
                  </span>
                </div>

                {section.parsedQuestions.length === 0 ? (
                  <div className="text-center py-12 text-neutral-400 italic text-sm border-2 border-dashed border-neutral-200 dark:border-neutral-800 rounded-xl">
                    {section.isRendering ? "Đang dịch LaTeX..." : "Chưa có dữ liệu preview. Vui lòng bấm Render."}
                  </div>
                ) : (
                  <div className="space-y-8">
                    {section.parsedQuestions.map((q, qIdx) => (
                      <div key={qIdx} className="space-y-4">
                        <div className="flex gap-2 text-sm">
                          <span className="font-bold text-neutral-900 dark:text-white whitespace-nowrap">Câu {qIdx + 1}:</span>
                          <div className="text-neutral-800 dark:text-neutral-200 leading-relaxed font-serif">
                            <MathRenderer text={q.questionContent} />
                          </div>
                        </div>

                        {/* MCQ Options */}
                        {section.questionType === "MCQ" && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-10 font-serif text-sm">
                            {['A', 'B', 'C', 'D'].map((opt) => {
                              const content = q[`option${opt}` as keyof typeof q];
                              if (!content) return null;
                              return (
                                <div key={opt} className="flex gap-2 items-start">
                                  <span className="font-bold text-neutral-900 dark:text-white">{opt}.</span>
                                  <span className="text-neutral-700 dark:text-neutral-300"><MathRenderer text={content} /></span>
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {/* True/False Options */}
                        {section.questionType === "TRUE_FALSE" && q.subQuestions && (
                          <div className="pl-10 space-y-4 font-serif text-sm">
                            {q.subQuestions.map((sq: any, sqIdx: number) => (
                              <div key={sqIdx} className="flex items-start gap-3">
                                <span className="font-bold text-neutral-900 dark:text-white">{String.fromCharCode(97 + sqIdx)})</span>
                                <div className="text-neutral-700 dark:text-neutral-300 flex-1"><MathRenderer text={sq.content} /></div>
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${sq.isTrue ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                  {sq.isTrue ? "ĐÚNG" : "SAI"}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                        
                        {/* Answer Key */}
                        {q.correctAnswer && section.questionType !== "TRUE_FALSE" && (
                          <div className="pl-10 text-xs font-bold text-green-600 flex items-center gap-1.5 uppercase tracking-widest">
                            <CheckCircle2 className="w-4 h-4" />
                            ĐÁP ÁN: {q.correctAnswer}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function XIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  );
}
