"use client";

import React, { useState, useEffect } from "react";
import useSWR from "swr";
import { requestGas } from "@/utils/apiClient";
import ExamBuilder from "./ExamBuilder";
import { 
  Folder, FileText, ChevronRight, Play, Download, 
  Plus, FileCode, CheckCircle2, X, AlertCircle, 
  Settings, Edit, Save, Trash2, Calendar, Lock, 
  Globe, Loader2, Sparkles, BookOpen, ChevronDown, Check,
  ExternalLink, PlusCircle, ArrowRight, Eye
} from "lucide-react";

interface TeacherTrainingProps {
  classId: string;
  teacherId: string;
  activeClass: any | null;
}

const EMPTY_ARRAY: any[] = [];

export default function TeacherTraining({ classId, teacherId, activeClass }: TeacherTrainingProps) {
  // SWR for central library directories
  const { data: centralFolders = EMPTY_ARRAY, error: errFolders, isLoading: loadingFolders, mutate: mutateFolders } = useSWR(
    "getFolders",
    () => requestGas<any[]>("getFolders")
  );

  // SWR for active class curriculum progress folders
  const { data: classProgress = EMPTY_ARRAY, error: errProgress, isLoading: loadingProgress, mutate: mutateProgress } = useSWR(
    classId ? `getClassProgress/${classId}` : null,
    () => requestGas<any[]>("getClassProgress", { body: { classId } })
  );

  // SWR for active class assigned files
  const { data: classMaterials = EMPTY_ARRAY, error: errMaterials, isLoading: loadingMaterials, mutate: mutateMaterials } = useSWR(
    classId ? `getClassMaterials/${classId}` : null,
    () => requestGas<any[]>("getClassMaterials", { body: { classId } })
  );

  // Workspace View: "none" (shows syllabus progress editor), "pdf" (PDF form), "exam" (inline LaTeX builder)
  const [workspaceView, setWorkspaceView] = useState<"none" | "pdf" | "exam">("none");
  const [selectedFolderId, setSelectedFolderId] = useState<string>("");

  // Right sidebar expanded folders
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({});

  // Plus (+) action dropdown state for library folder ID
  const [activeFolderDropdown, setActiveFolderDropdown] = useState<string | null>(null);

  // Search filter for central library
  const [searchLibraryQuery, setSearchLibraryQuery] = useState("");

  // PDF Form states
  const [pdfName, setPdfName] = useState("");
  const [pdfUrl, setPdfUrl] = useState("");
  const [pdfDescription, setPdfDescription] = useState("");
  const [isSavingPDF, setIsSavingPDF] = useState(false);

  // Quick Folder Form states
  const [showCreateFolderInline, setShowCreateFolderInline] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [newFolderSubject, setNewFolderSubject] = useState("Toán");
  const [newFolderGrade, setNewFolderGrade] = useState("Lớp 10");
  const [newFolderLevel, setNewFolderLevel] = useState("Nâng cao");
  const [newFolderDescription, setNewFolderDescription] = useState("");
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);

  // Custom Topic Form states
  const [showAddCustomTopicInline, setShowAddCustomTopicInline] = useState(false);
  const [newCustomTopicName, setNewCustomTopicName] = useState("");
  const [isAddingCustomTopic, setIsAddingCustomTopic] = useState(false);
  const [editingTopicId, setEditingTopicId] = useState<string | null>(null);
  const [editingTopicName, setEditingTopicName] = useState("");

  // PDF Sub-tab state
  const [activePdfSubTab, setActivePdfSubTab] = useState<"drive" | "manual">("drive");

  // SWR for Google Drive files
  const { data: driveFiles = EMPTY_ARRAY, isLoading: loadingDrive, mutate: mutateDrive } = useSWR(
    "getDriveFiles",
    () => requestGas<any[]>("getDriveFiles")
  );

  // Assign popover states (assign file to folder)
  const [assigningFile, setAssigningFile] = useState<any | null>(null);
  const [assignTargetFolderId, setAssignTargetFolderId] = useState("");
  const [assignDueDate, setAssignDueDate] = useState("");
  const [assignMaxAttempts, setAssignMaxAttempts] = useState("3");
  const [isAssigning, setIsAssigning] = useState(false);

  // Edit Assigned File Config states
  const [editingLink, setEditingLink] = useState<any | null>(null);
  const [editDueDate, setEditDueDate] = useState("");
  const [editMaxAttempts, setEditMaxAttempts] = useState("3");
  const [editIsVisible, setEditIsVisible] = useState(true);
  const [isUpdatingLink, setIsUpdatingLink] = useState(false);

  // Class folder progress edit states
  const [progressEdits, setProgressEdits] = useState<Record<string, { progressPercent: number; status: string }>>({});
  const [isSavingProgress, setIsSavingProgress] = useState(false);

  // Popover for assigning file directly under a class folder card
  const [showAddFromFileListFolderId, setShowAddFromFileListFolderId] = useState<string | null>(null);

  // Message notifications banner
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const showMessage = (type: "success" | "error", text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  // Sync classProgress edits state
  useEffect(() => {
    if (classProgress) {
      const edits: Record<string, { progressPercent: number; status: string }> = {};
      classProgress.forEach((p) => {
        edits[p.progressId] = {
          progressPercent: p.progressPercent || 0,
          status: p.status || "Chưa dạy"
        };
      });
      setProgressEdits(edits);
    }
  }, [classProgress]);

  // Transform standard Google Drive file URL to preview embeddable URL
  const getEmbeddableUrl = (url: string) => {
    if (!url) return "";
    const driveMatch = url.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
    if (driveMatch && driveMatch[1]) {
      return `https://drive.google.com/file/d/${driveMatch[1]}/preview`;
    }
    const openMatch = url.match(/drive\.google\.com\/open\?id=([a-zA-Z0-9_-]+)/);
    if (openMatch && openMatch[1]) {
      return `https://drive.google.com/file/d/${openMatch[1]}/preview`;
    }
    return url;
  };

  // Toggle folder open state in Kho Chuyên Đề
  const toggleFolderExpanded = (folderId: string) => {
    setExpandedFolders(prev => ({
      ...prev,
      [folderId]: !prev[folderId]
    }));
  };

  // Save PDF Material action
  const handleSavePDF = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pdfName || !pdfUrl || !selectedFolderId) {
      showMessage("error", "Vui lòng nhập tên tài liệu, đường liên kết và chọn thư mục!");
      return;
    }

    setIsSavingPDF(true);
    try {
      await requestGas("createFilePDF", {
        method: "POST",
        body: {
          folderId: selectedFolderId,
          fileName: pdfName,
          fileUrl: pdfUrl,
          description: pdfDescription,
          isGlobal: true
        }
      });
      showMessage("success", `Tạo tài liệu "${pdfName}" thành công trong Kho chuyên đề!`);
      
      // Reset form
      setPdfName("");
      setPdfUrl("");
      setPdfDescription("");
      setWorkspaceView("none");
      
      // Refresh folders cache
      mutateFolders();
      // Re-trigger expansion so they see it
      setExpandedFolders(prev => ({ ...prev, [selectedFolderId]: true }));
    } catch (err: any) {
      showMessage("error", err.message || "Không thể tạo tài liệu PDF.");
    } finally {
      setIsSavingPDF(false);
    }
  };

  // Quick Folder Creation action
  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) {
      showMessage("error", "Vui lòng nhập tên chuyên đề!");
      return;
    }
    setIsCreatingFolder(true);
    try {
      await requestGas("createFolder", {
        method: "POST",
        body: {
          folderName: newFolderName.trim(),
          subject: newFolderSubject,
          grade: newFolderGrade,
          level: newFolderLevel,
          sortOrder: 1,
          description: newFolderDescription
        }
      });
      showMessage("success", `Tạo chuyên đề "${newFolderName}" thành công!`);
      setNewFolderName("");
      setNewFolderDescription("");
      setShowCreateFolderInline(false);
      mutateFolders();
    } catch (err: any) {
      showMessage("error", err.message || "Không thể tạo chuyên đề.");
    } finally {
      setIsCreatingFolder(false);
    }
  };

  // Quick Import File PDF from Google Drive
  const handleQuickImport = async (name: string, url: string) => {
    if (!selectedFolderId) {
      showMessage("error", "Vui lòng chọn thư mục chuyên đề đích trước!");
      return;
    }
    setIsSavingPDF(true);
    try {
      await requestGas("createFilePDF", {
        method: "POST",
        body: {
          folderId: selectedFolderId,
          fileName: name,
          fileUrl: url,
          description: "Nhập nhanh từ Google Drive",
          isGlobal: true
        }
      });
      showMessage("success", `Đã nhập nhanh tài liệu "${name}" thành công!`);
      mutateFolders();
      setExpandedFolders(prev => ({ ...prev, [selectedFolderId]: true }));
    } catch (err: any) {
      showMessage("error", err.message || "Lỗi nhập nhanh học liệu.");
    } finally {
      setIsSavingPDF(false);
    }
  };

  // Add custom topic box manually
  const handleAddCustomTopic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomTopicName.trim()) {
      showMessage("error", "Vui lòng nhập tên chủ đề!");
      return;
    }
    setIsAddingCustomTopic(true);
    try {
      await requestGas("addClassCustomTopic", {
        method: "POST",
        body: {
          classId: classId,
          topicName: newCustomTopicName.trim()
        }
      });
      showMessage("success", `Thêm chủ đề "${newCustomTopicName}" thành công!`);
      setNewCustomTopicName("");
      setShowAddCustomTopicInline(false);
      mutateProgress();
    } catch (err: any) {
      showMessage("error", err.message || "Không thể thêm chủ đề.");
    } finally {
      setIsAddingCustomTopic(false);
    }
  };

  const handleDeleteCustomTopic = async (progressId: string, topicName: string) => {
    if (!confirm(`Bạn có chắc muốn xoá chủ đề "${topicName}" và TẤT CẢ học liệu bên trong không?`)) return;
    try {
      await requestGas("deleteClassCustomTopic", { method: "POST", body: { classId, progressId, topicName } });
      mutateProgress();
      mutateMaterials();
      showMessage("success", `Đã xóa chủ đề "${topicName}"`);
    } catch(err: any) {
      showMessage("error", err.message || "Không thể xóa chủ đề.");
    }
  };

  const handleRenameCustomTopic = async (progressId: string, oldName: string) => {
    if (!editingTopicName.trim() || editingTopicName === oldName) { setEditingTopicId(null); return; }
    try {
      await requestGas("renameClassCustomTopic", { method: "POST", body: { classId, progressId, oldTopicName: oldName, newTopicName: editingTopicName } });
      mutateProgress();
      mutateMaterials();
      showMessage("success", `Đã đổi tên chủ đề thành "${editingTopicName}"`);
    } catch(err: any) {
      showMessage("error", err.message || "Không thể đổi tên chủ đề.");
    } finally { 
      setEditingTopicId(null); 
    }
  };

  // Assign Material to active class under target folder
  const handleAssignMaterial = async () => {
    if (!assigningFile || !classId) return;

    const targetFolder = classProgress.find(f => f.folderId === assignTargetFolderId || f.progressId === assignTargetFolderId);
    if (!targetFolder) {
      showMessage("error", "Vui lòng chọn chuyên đề của lớp để gán học liệu!");
      return;
    }

    setIsAssigning(true);
    try {
      await requestGas("assignMaterialToClass", {
        method: "POST",
        body: {
          classId,
          fileId: assigningFile.fileId,
          dueDate: assignDueDate,
          maxAttempts: parseInt(assignMaxAttempts) || 3,
          isVisible: true,
          // Sync custom folder mapping if supported by GAS/mock
          folderId: targetFolder.folderId,
          folderName: targetFolder.topicName
        }
      });
      showMessage("success", `Đã gán học liệu "${assigningFile.fileName}" vào chuyên đề "${targetFolder.topicName}" thành công!`);
      setAssigningFile(null);
      setAssignTargetFolderId("");
      setAssignDueDate("");
      setAssignMaxAttempts("3");
      mutateMaterials();
    } catch (err: any) {
      showMessage("error", err.message || "Gán học liệu thất bại.");
    } finally {
      setIsAssigning(false);
    }
  };

  // Assign a central library file directly to a target class progress folder (shortcut with defaults)
  const handleDirectAssign = async (file: any, classFolder: any) => {
    setIsAssigning(true);
    try {
      await requestGas("assignMaterialToClass", {
        method: "POST",
        body: {
          classId,
          fileId: file.fileId,
          dueDate: "",
          maxAttempts: 3,
          isVisible: true,
          folderId: classFolder.folderId,
          folderName: classFolder.topicName
        }
      });
      showMessage("success", `Đã gán "${file.fileName}" vào chuyên đề "${classFolder.topicName}"!`);
      mutateMaterials();
    } catch (err: any) {
      showMessage("error", err.message || "Lỗi khi gán học liệu.");
    } finally {
      setIsAssigning(false);
      setShowAddFromFileListFolderId(null);
    }
  };

  // Unassign file from class
  const handleUnassignMaterial = async (fileId: string, fileName: string) => {
    if (!confirm(`Bạn có chắc chắn muốn gỡ học liệu "${fileName}" ra khỏi lớp học này không?`)) return;

    try {
      await requestGas("unassignMaterialFromClass", {
        method: "POST",
        body: { classId, fileId }
      });
      showMessage("success", `Đã gỡ học liệu "${fileName}" khỏi lớp học.`);
      mutateMaterials();
    } catch (err: any) {
      showMessage("error", err.message || "Lỗi khi gỡ học liệu.");
    }
  };

  // Save changes to material config (DueDate, MaxAttempts, Visibility)
  const handleUpdateMaterialLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLink) return;

    setIsUpdatingLink(true);
    try {
      await requestGas("updateMaterialLink", {
        method: "POST",
        body: {
          linkId: editingLink.linkId,
          dueDate: editDueDate,
          maxAttempts: parseInt(editMaxAttempts) || 3,
          isVisible: editIsVisible
        }
      });
      showMessage("success", `Cập nhật cấu hình học liệu "${editingLink.fileName}" thành công!`);
      setEditingLink(null);
      mutateMaterials();
    } catch (err: any) {
      showMessage("error", err.message || "Lỗi cập nhật cấu hình.");
    } finally {
      setIsUpdatingLink(false);
    }
  };

  // Save classProgress edits
  const handleSaveProgress = async () => {
    setIsSavingProgress(true);
    try {
      const records = Object.keys(progressEdits).map(id => ({
        progressId: id,
        progressPercent: progressEdits[id].progressPercent,
        status: progressEdits[id].status
      }));

      await requestGas("updateClassProgress", {
        method: "POST",
        body: { classId, records }
      });
      showMessage("success", "Cập nhật tiến độ dạy học chuyên đề thành công!");
      mutateProgress();
    } catch (err: any) {
      showMessage("error", err.message || "Lỗi lưu tiến độ.");
    } finally {
      setIsSavingProgress(false);
    }
  };

  // Central library folder files sub-component for explorer lazy loading
  const LibraryFilesList = ({ folderId }: { folderId: string }) => {
    const { data: files = [], isLoading } = useSWR(
      `getFolderFiles/${folderId}`,
      () => requestGas<any[]>("getFolderFiles", { body: { folderId } })
    );

    if (isLoading) {
      return (
        <div className="pl-9 py-2 text-[11px] text-neutral-400 flex items-center gap-1.5 font-sans font-semibold">
          <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-500" />
          Đang tải học liệu...
        </div>
      );
    }

    if (files.length === 0) {
      return <div className="pl-9 py-2 text-[11px] text-neutral-450 italic font-medium font-sans">Thư mục trống</div>;
    }

    return (
      <div className="pl-9 space-y-1 py-1 pr-2">
        {files.map((file: any) => {
          // Check if this material is already assigned to this class
          const isAssigned = classMaterials.some((m: any) => m.fileId === file.fileId);

          return (
            <div 
              key={file.fileId} 
              className="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800/80 text-xs shadow-xs hover:border-blue-500/20 transition-all font-sans"
            >
              <div className="flex items-center gap-2 min-w-0 flex-1">
                {file.fileType === "PDF" ? (
                  <FileText className="w-4 h-4 text-blue-500 flex-shrink-0" />
                ) : (
                  <FileCode className="w-4 h-4 text-amber-500 flex-shrink-0" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate font-bold text-neutral-800 dark:text-neutral-200" title={file.fileName}>{file.fileName}</p>
                  {file.description && <p className="text-[10px] text-neutral-400 truncate font-semibold">{file.description}</p>}
                </div>
              </div>

              {isAssigned ? (
                <span className="px-2 py-0.5 rounded bg-green-500/10 text-green-600 dark:text-green-400 font-bold text-[10px] uppercase flex items-center gap-0.5 shrink-0">
                  <Check className="w-3 h-3" /> Đã gán
                </span>
              ) : (
                <button
                  onClick={() => {
                    setAssigningFile(file);
                    setAssignTargetFolderId(classProgress[0]?.folderId || classProgress[0]?.progressId || "");
                    setAssignDueDate("");
                    setAssignMaxAttempts("3");
                  }}
                  className="ml-2 px-2.5 py-1 text-[10px] font-bold text-blue-600 dark:text-blue-400 hover:text-white dark:hover:text-white hover:bg-blue-600 dark:hover:bg-blue-500 border border-blue-500/20 rounded-md transition-all cursor-pointer shrink-0"
                >
                  Gán lớp
                </button>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  // Flattened resource file selector popover for a target class progress folder
  const DirectAddFileSelector = ({ classFolder, onClose }: { classFolder: any; onClose: () => void }) => {
    // We aggregate files from all central folders
    const [selectedFolderFilter, setSelectedFolderFilter] = useState("");
    const { data: centralFoldersList = [] } = useSWR("getFolders", () => requestGas<any[]>("getFolders"));
    
    const activeFolderForFiles = selectedFolderFilter || centralFoldersList[0]?.folderId || "";
    
    const { data: files = [], isLoading } = useSWR(
      activeFolderForFiles ? `getFolderFiles/${activeFolderForFiles}` : null,
      () => requestGas<any[]>("getFolderFiles", { body: { folderId: activeFolderForFiles } })
    );

    return (
      <div className="absolute left-0 right-0 mt-2 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-xl z-20 p-4 font-sans animate-fade-in">
        <div className="flex justify-between items-center border-b border-neutral-100 dark:border-neutral-800 pb-2 mb-3">
          <span className="font-extrabold text-[11px] uppercase tracking-wider text-blue-600 flex items-center gap-1">
            <PlusCircle className="w-4 h-4" /> Chọn tài nguyên từ Kho trung tâm để gán
          </span>
          <button onClick={onClose} className="text-neutral-400 hover:text-neutral-600">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-3">
          {/* Select Category Folder */}
          <div>
            <label className="block text-[10px] font-bold text-neutral-450 uppercase mb-1">Bộ lọc chuyên đề gốc</label>
            <select
              value={activeFolderForFiles}
              onChange={(e) => setSelectedFolderFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 border rounded-lg bg-neutral-50 dark:bg-neutral-950 border-neutral-250 dark:border-neutral-750 text-xs font-semibold"
            >
              {centralFoldersList.map((f: any) => (
                <option key={f.folderId} value={f.folderId}>{f.folderName}</option>
              ))}
            </select>
          </div>

          {/* List Files */}
          <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
            {isLoading ? (
              <div className="py-6 text-center text-neutral-400 text-xs flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                Đang tải danh sách học liệu...
              </div>
            ) : files.length === 0 ? (
              <p className="text-center py-6 text-xs text-neutral-400 italic">Thư mục gốc này chưa có học liệu.</p>
            ) : (
              files.map((file: any) => {
                const isAssigned = classMaterials.some((m: any) => m.fileId === file.fileId);
                return (
                  <div key={file.fileId} className="flex justify-between items-center p-2 rounded-lg bg-neutral-50 dark:bg-neutral-950 border border-neutral-200/60 dark:border-neutral-800 text-xs">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      {file.fileType === "PDF" ? (
                        <FileText className="w-4 h-4 text-blue-500 flex-shrink-0" />
                      ) : (
                        <Play className="w-4 h-4 text-amber-500 flex-shrink-0" />
                      )}
                      <span className="truncate font-bold text-neutral-800 dark:text-neutral-200">{file.fileName}</span>
                    </div>
                    {isAssigned ? (
                      <span className="px-2 py-0.5 rounded bg-green-500/10 text-green-600 font-bold text-[10px] shrink-0">
                        Đã gán
                      </span>
                    ) : (
                      <button
                        onClick={() => handleDirectAssign(file, classFolder)}
                        className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-[10px] font-bold shrink-0 flex items-center gap-0.5 cursor-pointer shadow-xs"
                      >
                        Gán ngay <ArrowRight className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col lg:flex-row items-stretch border border-neutral-250 dark:border-neutral-850 rounded-2xl overflow-hidden bg-neutral-50/20 dark:bg-neutral-950/10 min-h-[700px] text-xs">
      
      {/* LEFT / CENTRAL WORKSPACE (Middle Area - Class progress & materials) */}
      <div className="flex-1 p-6 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-neutral-250 dark:border-neutral-850 bg-white dark:bg-neutral-900/60 min-w-0">
        
        {message && (
          <div className={`mb-4 p-4 rounded-xl flex items-center gap-3 border text-xs font-bold ${
            message.type === "success" 
              ? "bg-green-500/10 border-green-500/20 text-green-600 dark:text-green-400" 
              : "bg-red-500/10 border-red-500/20 text-red-600 dark:text-red-400"
          }`}>
            {message.type === "success" ? <CheckCircle2 className="w-5 h-5 flex-shrink-0" /> : <AlertCircle className="w-5 h-5 flex-shrink-0" />}
            <span>{message.text}</span>
          </div>
        )}

        <div className="flex-1 flex flex-col justify-start">
          
          {/* WELCOME / MAIN CLASS SYLLABUS DISPLAYER */}
          {workspaceView === "none" && (
            <div className="space-y-6">
              
              {/* Header inside middle workspace */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-neutral-200 dark:border-neutral-800 pb-4">
                <div>
                  <h3 className="font-extrabold text-neutral-900 dark:text-white flex items-center gap-2 text-sm uppercase tracking-wide">
                    <BookOpen className="w-5 h-5 text-blue-500 animate-pulse" /> Tiến độ giảng dạy & Học liệu lớp dạy
                  </h3>
                  <p className="text-[11px] text-neutral-450 mt-1 font-sans">
                    Cập nhật trạng thái chuyên đề, điều chỉnh phần trăm hoàn thành, và gán tài liệu/đề thi trực tiếp từ kho trung tâm.
                  </p>
                </div>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowAddCustomTopicInline(!showAddCustomTopicInline)}
                    className="px-3.5 py-2 text-[11px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 font-sans"
                  >
                    <PlusCircle className="w-4 h-4" />
                    Thêm chủ đề mới
                  </button>
                  <button
                    onClick={handleSaveProgress}
                    disabled={isSavingProgress || classProgress.length === 0}
                    className="px-3.5 py-2 text-[11px] font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-1.5 font-sans"
                  >
                    {isSavingProgress ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-4 h-4" />}
                    Lưu tiến độ lớp
                  </button>
                </div>
              </div>

              {showAddCustomTopicInline && (
                <div className="bg-white dark:bg-neutral-900 border border-blue-200 dark:border-blue-900 p-4 rounded-xl shadow-sm mb-4 animate-fade-in">
                  <form onSubmit={handleAddCustomTopic} className="flex items-end gap-3">
                    <div className="flex-1">
                      <label className="block text-[10px] font-bold text-neutral-500 uppercase mb-1.5">Tên chủ đề mới</label>
                      <input
                        type="text"
                        value={newCustomTopicName}
                        onChange={(e) => setNewCustomTopicName(e.target.value)}
                        placeholder="Nhập tên chủ đề/chuyên đề..."
                        className="w-full text-xs p-2.5 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-semibold text-neutral-900 dark:text-white"
                        autoFocus
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={isAddingCustomTopic || !newCustomTopicName.trim()}
                      className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-colors disabled:opacity-50 flex items-center gap-2 h-[42px]"
                    >
                      {isAddingCustomTopic ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                      Thêm
                    </button>
                  </form>
                </div>
              )}

              {loadingProgress ? (
                <div className="py-20 text-center text-neutral-400 font-sans font-bold flex flex-col items-center justify-center gap-2">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                  Đang đồng bộ lộ trình chuyên đề lớp học...
                </div>
              ) : classProgress.length === 0 ? (
                <div className="py-16 text-center border border-dashed border-neutral-300 dark:border-neutral-800 rounded-2xl max-w-md mx-auto p-6 space-y-3">
                  <BookOpen className="w-10 h-10 mx-auto text-neutral-300" />
                  <p className="font-bold text-neutral-500">Chưa thiết lập chương trình học</p>
                  <p className="text-[10px] text-neutral-400 font-semibold">Chương trình học của lớp này chưa được khởi tạo. Vui lòng thiết lập folder chuyên đề tương ứng ở Kho trung tâm.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {classProgress.map((prog: any) => {
                    const edit = progressEdits[prog.progressId] || { progressPercent: prog.progressPercent, status: prog.status };
                    const folderMats = classMaterials.filter((m: any) => m.topicName === prog.topicName || m.folderName === prog.topicName);

                    return (
                      <div 
                        key={prog.progressId} 
                        className="p-4 rounded-xl border border-neutral-250 dark:border-neutral-800 bg-white dark:bg-neutral-900/40 shadow-xs hover:shadow-xs transition-shadow relative space-y-4"
                      >
                        {/* Folder Header details */}
                        <div className="flex justify-between items-start gap-2.5">
                          <div className="min-w-0 flex-1">
                            {editingTopicId === prog.progressId ? (
                              <input 
                                type="text"
                                autoFocus
                                value={editingTopicName}
                                onChange={(e) => setEditingTopicName(e.target.value)}
                                onBlur={() => handleRenameCustomTopic(prog.progressId, prog.topicName)}
                                onKeyDown={(e) => e.key === 'Enter' && handleRenameCustomTopic(prog.progressId, prog.topicName)}
                                className="w-full font-bold text-sm bg-white dark:bg-neutral-800 border border-blue-400 rounded px-1.5 py-0.5 outline-none focus:ring-2 focus:ring-blue-500/50"
                              />
                            ) : (
                              <p 
                                className="font-bold text-neutral-850 dark:text-neutral-100 text-sm truncate cursor-text" 
                                title="Double click để sửa tên"
                                onDoubleClick={() => { setEditingTopicId(prog.progressId); setEditingTopicName(prog.topicName); }}
                              >
                                {prog.topicName}
                              </p>
                            )}
                            <span className="text-[10px] text-neutral-400 font-mono font-semibold">Cập nhật: {prog.lastUpdated || "—"}</span>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <select
                              value={edit.status}
                              onChange={(e) => {
                                const newStatus = e.target.value;
                                const newPercent = newStatus === "Đã dạy" ? 100 : newStatus === "Chưa dạy" ? 0 : edit.progressPercent;
                                setProgressEdits(prev => ({
                                  ...prev,
                                  [prog.progressId]: { progressPercent: newPercent, status: newStatus }
                                }));
                              }}
                              className="px-2 py-1 border rounded-lg bg-neutral-50 dark:bg-neutral-950 border-neutral-250 dark:border-neutral-750 font-bold scale-90"
                            >
                              <option value="Chưa dạy">Chưa dạy</option>
                              <option value="Đang dạy">Đang dạy</option>
                              <option value="Đã dạy">Đã dạy</option>
                            </select>
                            <button 
                              onClick={() => handleDeleteCustomTopic(prog.progressId, prog.topicName)} 
                              className="p-1.5 text-neutral-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                              title="Xóa chủ đề"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {/* Slider percent */}
                        <div className="space-y-1">
                          <div className="flex justify-between items-center text-[10px] font-bold text-neutral-500">
                            <span>Tỷ lệ hoàn thành:</span>
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
                              const percent = parseInt(e.target.value) || 0;
                              setProgressEdits(prev => ({
                                ...prev,
                                [prog.progressId]: { ...prev[prog.progressId], progressPercent: percent }
                              }));
                            }}
                            className="w-full accent-blue-600 h-1.5 rounded-lg bg-neutral-200 dark:bg-neutral-850 appearance-none cursor-pointer"
                          />
                        </div>

                        {/* Materials list inside class progress card */}
                        <div className="border-t border-neutral-100 dark:border-neutral-800/80 pt-3 space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-[10px] font-extrabold text-neutral-400 uppercase tracking-wider">Học liệu đã gán</span>
                            <button
                              onClick={() => {
                                setShowAddFromFileListFolderId(showAddFromFileListFolderId === prog.progressId ? null : prog.progressId);
                              }}
                              className="text-[10px] text-blue-600 hover:text-blue-700 font-extrabold flex items-center gap-0.5 cursor-pointer font-sans"
                            >
                              <Plus className="w-3.5 h-3.5" /> Gán từ kho
                            </button>
                          </div>

                          {/* Direct file list popover inside card */}
                          {showAddFromFileListFolderId === prog.progressId && (
                            <DirectAddFileSelector 
                              classFolder={prog} 
                              onClose={() => setShowAddFromFileListFolderId(null)} 
                            />
                          )}

                          {folderMats.length === 0 ? (
                            <p className="text-[10px] text-neutral-400 italic pl-1 font-semibold">Chưa có học liệu/đề thi nào được gán cho chuyên đề này.</p>
                          ) : (
                            <div className="space-y-1.5">
                              {folderMats.map((mat: any) => (
                                <div 
                                  key={mat.linkId} 
                                  className="flex items-center justify-between p-2 rounded-lg bg-neutral-50 dark:bg-neutral-950 border border-neutral-200/50 dark:border-neutral-800"
                                >
                                  <div className="flex items-center gap-2 min-w-0 flex-1">
                                    {mat.fileType === "PDF" ? (
                                      <FileText className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                                    ) : (
                                      <Play className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                                    )}
                                    <div className="min-w-0 flex-1">
                                      <p className="truncate font-bold text-neutral-800 dark:text-neutral-200" title={mat.fileName}>{mat.fileName}</p>
                                      {/* details */}
                                      <div className="flex gap-1.5 text-[9px] font-bold text-neutral-400 font-sans mt-0.5">
                                        {mat.dueDate && <span>Hạn: {mat.dueDate}</span>}
                                        {mat.fileType === "EXAM" && <span>Lượt: {mat.maxAttempts || 3} lần</span>}
                                        <span className={mat.isVisible ? "text-green-600" : "text-rose-500"}>
                                          {mat.isVisible ? "Hiển thị" : "Ẩn"}
                                        </span>
                                      </div>
                                    </div>
                                  </div>

                                    <div className="flex items-center gap-1 shrink-0 ml-2">
                                      {mat.fileType === "EXAM" && (
                                        <button
                                          onClick={() => {
                                            window.open(`/student`, '_blank');
                                          }}
                                          className="p-1 rounded text-neutral-400 hover:text-amber-600 hover:bg-neutral-100 dark:hover:bg-neutral-850 cursor-pointer"
                                          title="Thi thử với góc nhìn Học sinh"
                                        >
                                          <Eye className="w-3.5 h-3.5" />
                                        </button>
                                      )}
                                      <button
                                        onClick={() => {
                                          setEditingLink(mat);
                                          setEditDueDate(mat.dueDate || "");
                                          setEditMaxAttempts(mat.maxAttempts ? mat.maxAttempts.toString() : "3");
                                          setEditIsVisible(mat.isVisible !== false);
                                        }}
                                        className="p-1 rounded text-neutral-400 hover:text-blue-600 hover:bg-neutral-100 dark:hover:bg-neutral-850 cursor-pointer"
                                        title="Cấu hình hạn / lượt"
                                      >
                                        <Settings className="w-3.5 h-3.5" />
                                      </button>
                                    <button
                                      onClick={() => handleUnassignMaterial(mat.fileId, mat.fileName)}
                                      className="p-1 rounded text-neutral-400 hover:text-red-500 hover:bg-neutral-100 dark:hover:bg-neutral-850 cursor-pointer"
                                      title="Gỡ khỏi chuyên đề"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </div>
                              ))}
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

          {/* PDF UPLOAD WORKSPACE VIEW */}
          {workspaceView === "pdf" && (
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 h-full items-stretch animate-fade-in">
              
              {/* Left Column (Forms and Drive List): spans 7 columns */}
              <div className="xl:col-span-7 space-y-4 flex flex-col justify-between">
                <div className="space-y-4">
                  {/* Header */}
                  <div className="border-b border-neutral-100 dark:border-neutral-800 pb-3 flex justify-between items-center">
                    <div>
                      <h4 className="font-extrabold text-neutral-900 dark:text-white font-sans text-sm uppercase flex items-center gap-1.5">
                        <FileText className="w-5 h-5 text-blue-500" /> Thêm tài liệu PDF mới
                      </h4>
                      <p className="text-[11px] text-neutral-450 mt-0.5">Thư mục nhận: <span className="font-bold text-neutral-700 dark:text-neutral-350">{centralFolders.find((f: any) => f.folderId === selectedFolderId)?.folderName || "Không xác định"}</span></p>
                    </div>
                    <button
                      onClick={() => setWorkspaceView("none")}
                      className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 hover:text-neutral-600 transition-all cursor-pointer font-bold"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* PDF Source Sub-Tabs Selector */}
                  <div className="flex gap-2 p-1 bg-neutral-100 dark:bg-neutral-900 rounded-xl max-w-xs border border-neutral-200/50 dark:border-neutral-800">
                    <button
                      type="button"
                      onClick={() => setActivePdfSubTab("drive")}
                      className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        activePdfSubTab === "drive"
                          ? "bg-white dark:bg-neutral-805 text-blue-600 dark:text-blue-400 shadow-sm"
                          : "text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200"
                      }`}
                    >
                      Google Drive
                    </button>
                    <button
                      type="button"
                      onClick={() => setActivePdfSubTab("manual")}
                      className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        activePdfSubTab === "manual"
                          ? "bg-white dark:bg-neutral-805 text-blue-600 dark:text-blue-400 shadow-sm"
                          : "text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200"
                      }`}
                    >
                      Nhập thủ công
                    </button>
                  </div>

                  {activePdfSubTab === "drive" ? (
                    /* GOOGLE DRIVE SELECTOR PANELS */
                    <div className="space-y-4 font-sans text-xs">
                      <div className="flex justify-between items-center">
                        <label className="block text-[10px] font-extrabold text-neutral-450 uppercase tracking-wider">Tệp tài liệu trên Google Drive liên kết</label>
                        <button
                          type="button"
                          onClick={() => mutateDrive()}
                          disabled={loadingDrive}
                          className="text-[10px] font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-0.5 cursor-pointer"
                        >
                          Làm mới danh sách
                        </button>
                      </div>

                      {loadingDrive ? (
                        <div className="py-12 border border-dashed rounded-2xl border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-955 flex flex-col items-center justify-center gap-2 text-neutral-400 font-semibold">
                          <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                          <span>Đang kết nối và quét tệp từ Google Drive...</span>
                        </div>
                      ) : driveFiles.length === 0 ? (
                        <div className="py-12 border border-dashed rounded-2xl border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-955 text-center p-6 text-neutral-450 font-semibold space-y-1">
                          <AlertCircle className="w-7 h-7 mx-auto text-neutral-355 dark:text-neutral-755" />
                          <p>Thư mục Google Drive trống</p>
                          <p className="text-[10px] max-w-xs mx-auto font-medium text-neutral-400 leading-normal">
                            Đảm bảo đã cấu hình đúng thuộc tính <code className="px-1 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800">DRIVE_FOLDER_ID</code> và thư mục của bạn có chứa các tệp PDF học liệu.
                          </p>
                        </div>
                      ) : (
                        <div className="border border-neutral-200 dark:border-neutral-800 rounded-2xl bg-neutral-50/30 dark:bg-neutral-955 max-h-60 overflow-y-auto divide-y divide-neutral-150/60 dark:divide-neutral-850">
                          {driveFiles.map((file: any) => (
                            <div 
                              key={file.id} 
                              className="flex items-center justify-between p-3 hover:bg-neutral-100/40 dark:hover:bg-neutral-900/40 transition-colors"
                            >
                              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                <FileText className="w-4.5 h-4.5 text-red-500 shrink-0" />
                                <div className="min-w-0 flex-1">
                                  <p className="font-bold text-neutral-800 dark:text-neutral-200 truncate" title={file.name}>{file.name}</p>
                                  <p className="text-[9px] text-neutral-400 font-mono">ID: {file.id.substring(0, 10)}...</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 shrink-0 ml-3">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setPdfName(file.name.replace(/\.pdf$/i, ""));
                                    setPdfUrl(file.url);
                                  }}
                                  className="px-2.5 py-1 rounded-lg bg-white dark:bg-neutral-855 hover:bg-neutral-100 dark:hover:bg-neutral-800 border border-neutral-200 dark:border-neutral-750 text-blue-600 dark:text-blue-400 font-bold transition-all cursor-pointer"
                                >
                                  Chọn
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleQuickImport(file.name, file.url)}
                                  disabled={isSavingPDF}
                                  className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold transition-all cursor-pointer flex items-center gap-0.5"
                                >
                                  Nhập nhanh
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Import Form under Picker */}
                      {pdfUrl && (
                        <form onSubmit={handleSavePDF} className="space-y-4 p-4 border border-blue-500/10 dark:border-blue-400/10 rounded-2xl bg-blue-500/[0.01] dark:bg-blue-500/[0.02] animate-fade-in">
                          <h5 className="font-extrabold text-[10px] uppercase text-blue-600 dark:text-blue-400">Học liệu đã chọn từ Drive</h5>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div>
                              <label className="block text-[10px] font-bold text-neutral-500 uppercase mb-1">Tên tài liệu hiển thị</label>
                              <input
                                type="text"
                                required
                                value={pdfName}
                                onChange={(e) => setPdfName(e.target.value)}
                                className="w-full px-3 py-1.5 border rounded-xl bg-white dark:bg-neutral-900 border-neutral-255 dark:border-neutral-755 font-semibold focus:outline-none text-neutral-800 dark:text-neutral-100"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-neutral-500 uppercase mb-1">Đường dẫn tệp tin</label>
                              <input
                                type="url"
                                required
                                value={pdfUrl}
                                disabled
                                className="w-full px-3 py-1.5 border rounded-xl bg-neutral-100 dark:bg-neutral-800 border-neutral-250 dark:border-neutral-750 font-mono text-neutral-450 focus:outline-none"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-neutral-500 uppercase mb-1">Mô tả ngắn</label>
                            <textarea
                              rows={2}
                              placeholder="Nhập mô tả học liệu (tùy chọn)..."
                              value={pdfDescription}
                              onChange={(e) => setPdfDescription(e.target.value)}
                              className="w-full p-2.5 border rounded-xl bg-white dark:bg-neutral-900 border-neutral-250 dark:border-neutral-750 focus:outline-none leading-relaxed text-neutral-800 dark:text-neutral-200"
                            />
                          </div>
                          <button
                            type="submit"
                            disabled={isSavingPDF}
                            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-bold shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer text-xs"
                          >
                            {isSavingPDF ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            Xác nhận nhập học liệu vào kho
                          </button>
                        </form>
                      )}
                    </div>
                  ) : (
                    /* MANUAL LINK IMPORT FORM */
                    <form onSubmit={handleSavePDF} className="space-y-4 text-xs font-sans">
                      <div>
                        <label className="block text-xs font-bold text-neutral-500 uppercase mb-1">Tên tài liệu PDF</label>
                        <input
                          type="text"
                          required
                          placeholder="Ví dụ: Chuyên đề khảo sát hàm số, File bài tập về nhà..."
                          value={pdfName}
                          onChange={(e) => setPdfName(e.target.value)}
                          className="w-full px-3 py-2 border rounded-xl bg-neutral-50 dark:bg-neutral-950 border-neutral-300 dark:border-neutral-700 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none text-neutral-800 dark:text-neutral-100 font-medium"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-neutral-500 uppercase mb-1">Đường dẫn tệp tin PDF (Drive / Dropbox)</label>
                        <input
                          type="url"
                          required
                          placeholder="Ví dụ: https://drive.google.com/file/d/..."
                          value={pdfUrl}
                          onChange={(e) => setPdfUrl(e.target.value)}
                          className="w-full px-3 py-2 border rounded-xl bg-neutral-50 dark:bg-neutral-955 border-neutral-300 dark:border-neutral-700 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-neutral-500 uppercase mb-1">Mô tả ngắn</label>
                        <textarea
                          rows={3}
                          placeholder="Mô tả nội dung bài tập, dạng đề, hoặc hướng dẫn học tập..."
                          value={pdfDescription}
                          onChange={(e) => setPdfDescription(e.target.value)}
                          className="w-full p-3 border rounded-xl bg-neutral-50 dark:bg-neutral-955 border-neutral-300 dark:border-neutral-700 focus:outline-none leading-relaxed text-neutral-800 dark:text-neutral-200"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={isSavingPDF}
                        className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-bold shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                      >
                        {isSavingPDF ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        Lưu tài liệu vào Kho trung tâm
                      </button>
                    </form>
                  )}
                </div>
              </div>

              {/* Right Column (PDF Preview Frame): spans 5 columns */}
              <div className="xl:col-span-5 border border-neutral-200 dark:border-neutral-800 rounded-2xl overflow-hidden bg-neutral-100 dark:bg-neutral-955 flex flex-col items-stretch justify-between shadow-inner min-h-[300px]">
                <div className="px-4 py-2 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 flex justify-between items-center text-xs">
                  <span className="font-bold text-neutral-500 flex items-center gap-1.5"><Globe className="w-4 h-4 text-blue-500" /> Trình hiển thị nhúng Live Preview</span>
                  {pdfUrl && (
                    <a
                      href={pdfUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-500 hover:underline flex items-center gap-1 font-bold font-sans"
                    >
                      Mở tab mới <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
                <div className="flex-1 bg-neutral-100 dark:bg-neutral-955 flex items-center justify-center">
                  {pdfUrl ? (
                    <iframe
                      src={getEmbeddableUrl(pdfUrl)}
                      className="w-full h-full min-h-[480px] border-none"
                      title="PDF Preview"
                      allow="autoplay"
                    />
                  ) : (
                    <div className="text-center p-6 space-y-2 text-neutral-400 font-sans">
                      <FileText className="w-10 h-10 mx-auto text-neutral-300 dark:text-neutral-800" />
                      <p className="text-xs font-bold">Chưa có liên kết tệp tin PDF</p>
                      <p className="text-[10px] max-w-xs font-semibold">Cung cấp đường dẫn liên kết phía trái để hiển thị xem trước tại đây.</p>
                    </div>
                  )}
                </div>
              </div>

            </div>
          )}

          {/* LATEX EXAM BUILDER VIEW */}
          {workspaceView === "exam" && (
            <div className="h-full flex flex-col justify-start">
              <div className="border-b border-neutral-100 dark:border-neutral-850 pb-2 mb-4 flex justify-between items-center">
                <div>
                  <h4 className="font-extrabold text-neutral-900 dark:text-white font-sans text-sm uppercase flex items-center gap-1.5">
                    <FileCode className="w-5 h-5 text-amber-500" /> Thiết kế đề thi LaTeX
                  </h4>
                  <p className="text-[11px] text-neutral-450 mt-0.5">Soạn đề thi mới và gắn trực tiếp vào chuyên đề </p>
                </div>
                <button
                  onClick={() => setWorkspaceView("none")}
                  className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 hover:text-neutral-600 transition-all cursor-pointer font-bold flex items-center gap-1 font-sans text-xs"
                >
                  <X className="w-4 h-4" /> Đóng
                </button>
              </div>

              <div className="border border-neutral-200 dark:border-neutral-800 rounded-xl overflow-hidden bg-white dark:bg-neutral-900 shadow-sm">
                <ExamBuilder
                  teacherId={teacherId}
                  initialFolderId={selectedFolderId}
                  inline={true}
                  onClose={() => {
                    setWorkspaceView("none");
                    mutateFolders();
                    showMessage("success", "Đã chốt thiết kế đề thi LaTeX!");
                  }}
                />
              </div>
            </div>
          )}

        </div>

      </div>

      {/* RIGHT SIDEBAR (Central resources directory list - always list resources) */}
      <div className="w-full lg:w-[350px] flex flex-col justify-between bg-neutral-50/50 dark:bg-neutral-900/20 text-xs min-h-[400px] shrink-0">
        
        <div>
          {/* Header title */}
          <div className="border-b border-neutral-200 dark:border-neutral-800 bg-neutral-100/50 dark:bg-neutral-900/60 p-4 flex flex-col gap-2">
            <span className="font-extrabold text-neutral-500 uppercase tracking-wider text-[10px] flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-blue-500" /> Kho chuyên đề trung tâm
            </span>
            <input
              type="text"
              placeholder="Tìm chuyên đề, bài thi..."
              value={searchLibraryQuery}
              onChange={(e) => setSearchLibraryQuery(e.target.value)}
              className="w-full px-3 py-1.5 border rounded-lg bg-white dark:bg-neutral-900 border-neutral-300 dark:border-neutral-700 text-[11px] focus:outline-none"
            />
          </div>

          {/* Folders and files scroll viewport */}
          <div className="p-4 space-y-3 max-h-[580px] overflow-y-auto pr-2">
            {loadingFolders ? (
              <div className="py-8 text-center text-neutral-450 font-semibold flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                Đang tải kho chuyên đề...
              </div>
            ) : centralFolders.length === 0 ? (
              <p className="text-center py-8 italic text-neutral-450">Kho chuyên đề trống.</p>
            ) : (
              centralFolders
                .filter((f: any) => f.folderName.toLowerCase().includes(searchLibraryQuery.toLowerCase()))
                .map((folder: any) => {
                  const isExpanded = !!expandedFolders[folder.folderId];

                  return (
                    <div 
                      key={folder.folderId} 
                      className="border border-neutral-200 dark:border-neutral-800 rounded-xl overflow-hidden bg-white dark:bg-neutral-900/40 shadow-xs"
                    >
                      {/* Folder card header */}
                      <div className="p-2.5 bg-neutral-100/40 dark:bg-neutral-900/80 flex items-center justify-between gap-2 relative">
                        <button
                          onClick={() => toggleFolderExpanded(folder.folderId)}
                          className="flex-1 flex items-center gap-2 text-left font-bold text-neutral-800 dark:text-neutral-200 hover:text-blue-500 font-sans cursor-pointer truncate"
                        >
                          <Folder className={`w-4 h-4 text-blue-500 transition-transform duration-200 shrink-0 ${isExpanded ? "rotate-90" : ""}`} />
                          <span className="truncate">{folder.folderName}</span>
                        </button>

                        {/* Action menu dropdown */}
                        <div className="relative">
                          <button
                            onClick={() => {
                              setActiveFolderDropdown(activeFolderDropdown === folder.folderId ? null : folder.folderId);
                            }}
                            className="p-1 rounded-md hover:bg-neutral-250 dark:hover:bg-neutral-800 text-neutral-500 hover:text-neutral-800 cursor-pointer transition-colors"
                            title="Thêm học liệu vào thư mục này"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                          
                          {activeFolderDropdown === folder.folderId && (
                            <div className="absolute right-0 top-full mt-1.5 w-40 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-xl z-30 py-1 font-semibold animate-fade-in text-neutral-700 dark:text-neutral-300 text-[11px]">
                              <button
                                onClick={() => {
                                  setSelectedFolderId(folder.folderId);
                                  setWorkspaceView("pdf");
                                  setActiveFolderDropdown(null);
                                }}
                                className="w-full text-left px-3 py-2 hover:bg-neutral-50 dark:hover:bg-neutral-800 flex items-center gap-1.5 cursor-pointer"
                              >
                                <FileText className="w-3.5 h-3.5 text-blue-500" />
                                Tải tệp tin PDF
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedFolderId(folder.folderId);
                                  setWorkspaceView("exam");
                                  setActiveFolderDropdown(null);
                                }}
                                className="w-full text-left px-3 py-2 hover:bg-neutral-50 dark:hover:bg-neutral-800 flex items-center gap-1.5 cursor-pointer"
                              >
                                <FileCode className="w-3.5 h-3.5 text-amber-500" />
                                Soạn đề thi LaTeX
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Folder files lists */}
                      {isExpanded && <LibraryFilesList folderId={folder.folderId} />}

                    </div>
                  );
                })
            )}
          </div>
        </div>

        {/* POPOVER FORM: ASSIGN MATERIAL CONFIG */}
        {assigningFile && (
          <div className="p-4 border-t border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 space-y-3 font-sans animate-fade-in">
            <div className="flex justify-between items-center border-b border-neutral-100 dark:border-neutral-800 pb-1">
              <span className="font-extrabold text-[10px] text-blue-600 dark:text-blue-400 uppercase tracking-wider flex items-center gap-1">
                <PlusCircle className="w-4 h-4" /> Gán học liệu vào chuyên đề lớp
              </span>
              <button onClick={() => setAssigningFile(null)} className="text-neutral-400 hover:text-neutral-600 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-[11px] font-bold text-neutral-800 dark:text-neutral-250 truncate">{assigningFile.fileName}</p>

            <div className="space-y-2 text-[11px]">
              <div>
                <label className="block text-[10px] font-bold text-neutral-500 uppercase mb-1">Chọn chuyên đề lớp nhận</label>
                <select
                  value={assignTargetFolderId}
                  onChange={(e) => setAssignTargetFolderId(e.target.value)}
                  className="w-full px-2 py-1.5 border rounded-lg bg-neutral-50 dark:bg-neutral-900 border-neutral-250 dark:border-neutral-750 text-[11px] font-semibold"
                >
                  {classProgress.map((p: any) => (
                    <option key={p.progressId} value={p.progressId}>{p.topicName}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-neutral-500 uppercase mb-1">Hạn nộp bài</label>
                  <input
                    type="date"
                    value={assignDueDate}
                    onChange={(e) => setAssignDueDate(e.target.value)}
                    className="w-full px-2 py-1.5 border rounded-lg bg-neutral-50 dark:bg-neutral-900 border-neutral-250 dark:border-neutral-750 font-mono text-[10px]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-neutral-500 uppercase mb-1">Số lượt làm</label>
                  <select
                    value={assignMaxAttempts}
                    onChange={(e) => setAssignMaxAttempts(e.target.value)}
                    className="w-full px-2 py-1.5 border rounded-lg bg-neutral-50 dark:bg-neutral-900 border-neutral-250 dark:border-neutral-750 font-bold text-[10px]"
                  >
                    <option value="1">1 lần</option>
                    <option value="2">2 lần</option>
                    <option value="3">3 lần</option>
                    <option value="5">5 lần</option>
                    <option value="10">10 lần</option>
                    <option value="999">Không giới hạn</option>
                  </select>
                </div>
              </div>
            </div>

            <button
              onClick={handleAssignMaterial}
              disabled={isAssigning}
              className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-xs shadow transition-all cursor-pointer flex items-center justify-center gap-1.5"
            >
              {isAssigning ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
              Xác nhận gán vào lớp
            </button>
          </div>
        )}

        {/* POPOVER FORM: EDIT ASSIGNED CONFIG */}
        {editingLink && (
          <div className="p-4 border-t border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-955 space-y-3 font-sans animate-fade-in">
            <div className="flex justify-between items-center border-b border-neutral-100 dark:border-neutral-800 pb-1">
              <span className="font-extrabold text-[10px] text-amber-600 dark:text-amber-400 uppercase tracking-wider flex items-center gap-1">
                <Settings className="w-4 h-4" /> Cấu hình học liệu đã gán
              </span>
              <button onClick={() => setEditingLink(null)} className="text-neutral-400 hover:text-neutral-600 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-[11px] font-bold text-neutral-800 dark:text-neutral-250 truncate">{editingLink.fileName}</p>

            <form onSubmit={handleUpdateMaterialLink} className="space-y-3">
              <div className="grid grid-cols-2 gap-3 text-[11px]">
                <div>
                  <label className="block text-[10px] font-bold text-neutral-500 uppercase mb-1">Hạn nộp bài</label>
                  <input
                    type="date"
                    value={editDueDate}
                    onChange={(e) => setEditDueDate(e.target.value)}
                    className="w-full px-2 py-1.5 border rounded-lg bg-neutral-50 dark:bg-neutral-900 border-neutral-250 dark:border-neutral-750 font-mono text-[10px]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-neutral-500 uppercase mb-1">Số lượt làm</label>
                  <select
                    value={editMaxAttempts}
                    onChange={(e) => setEditMaxAttempts(e.target.value)}
                    className="w-full px-2 py-1.5 border rounded-lg bg-neutral-50 dark:bg-neutral-900 border-neutral-250 dark:border-neutral-750 font-bold text-[10px]"
                  >
                    <option value="1">1 lần</option>
                    <option value="2">2 lần</option>
                    <option value="3">3 lần</option>
                    <option value="5">5 lần</option>
                    <option value="10">10 lần</option>
                    <option value="999">Không giới hạn</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] font-bold text-neutral-600 dark:text-neutral-400">
                <span>Chế độ hiển thị học viên:</span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setEditIsVisible(true)}
                    className={`px-2.5 py-1 rounded-md text-[10px] transition-all cursor-pointer font-bold ${
                      editIsVisible 
                        ? "bg-green-500 text-white shadow-xs" 
                        : "bg-neutral-100 dark:bg-neutral-800 text-neutral-500"
                    }`}
                  >
                    Hiển thị
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditIsVisible(false)}
                    className={`px-2.5 py-1 rounded-md text-[10px] transition-all cursor-pointer font-bold ${
                      !editIsVisible 
                        ? "bg-red-500 text-white shadow-xs" 
                        : "bg-neutral-100 dark:bg-neutral-800 text-neutral-500"
                    }`}
                  >
                    Ẩn
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isUpdatingLink}
                className="w-full py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-lg text-xs shadow transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                {isUpdatingLink ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                Lưu cấu hình học liệu
              </button>
            </form>
          </div>
        )}

      </div>

    </div>
  );
}

