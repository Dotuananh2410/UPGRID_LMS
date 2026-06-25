/**
 * UPGRID LMS - LOCALSTORAGE MOCK DATABASE
 * Simulates the Google Apps Script backend database structure and actions locally.
 */

// Helper to hash password using simple SHA-256 equivalent or direct match
function mockHashPassword(password: string): string {
  // We can just use the plain password or a simple string hash for comparison
  return password;
}

export function getSubQuestionsArray(subQuestionsRaw: any): any[] {
  if (!subQuestionsRaw) return [];
  try {
    const parsed = typeof subQuestionsRaw === "string" ? (subQuestionsRaw.trim() ? JSON.parse(subQuestionsRaw) : []) : subQuestionsRaw;
    if (Array.isArray(parsed)) {
      return parsed;
    }
    if (parsed && typeof parsed === "object") {
      return Object.values(parsed);
    }
    return [];
  } catch (e) {
    console.error("Error parsing SubQuestions", e);
    return [];
  }
}

export function fallbackParseLatex(latexContent: string, qType: string, qCount: number): any[] {
  const questions: any[] = [];
  const parts = latexContent.split(/(Câu\s*\d+[:.]?|Question\s*\d+[:.]?)/gi);
  let currentNum = 1;

  for (let i = 1; i < parts.length; i += 2) {
    const qBody = parts[i + 1] || "";
    let qContent = qBody.split(/(A\s*\.|B\s*\.|C\s*\.|D\s*\.)/g)[0].trim();
    if (!qContent) qContent = qBody;
    qContent = qContent.replace(/[:.\s]+$/, "").trim();

    let optA = "", optB = "", optC = "", optD = "";
    let correct = "A";

    const optAMatch = qBody.match(/A\s*\.\s*([^B\n]+)/);
    const optBMatch = qBody.match(/B\s*\.\s*([^C\n]+)/);
    const optCMatch = qBody.match(/C\s*\.\s*([^D\n]+)/);
    const optDMatch = qBody.match(/D\s*\.\s*([^\n]+)/);

    if (optAMatch) optA = optAMatch[1].trim();
    if (optBMatch) optB = optBMatch[1].trim();
    if (optCMatch) optC = optCMatch[1].trim();
    if (optDMatch) optD = optDMatch[1].trim();

    const ansMatch = qBody.match(/(Đáp án|Answer|Key)[:\s]*([A-D])/i);
    if (ansMatch) {
      correct = ansMatch[2].toUpperCase();
    }

    const subQs: any[] = [];
    if (qType === "TRUE_FALSE") {
      const lines = qBody.split("\n").filter(l => l.trim().length > 0);
      lines.forEach((line) => {
        const subMatch = line.match(/^([a-d])\s*\.\s*(.+)/i);
        if (subMatch) {
          const ansText = line.includes("T") || line.includes("Đúng") ? "T" : "F";
          subQs.push({
            text: subMatch[2].trim(),
            answer: ansText
          });
        }
      });
      if (subQs.length === 0) {
        subQs.push({ text: "Phát biểu a", answer: "T" });
        subQs.push({ text: "Phát biểu b", answer: "F" });
        subQs.push({ text: "Phát biểu c", answer: "T" });
        subQs.push({ text: "Phát biểu d", answer: "F" });
      }
      correct = subQs.map(s => s.answer).join(",");
    }

    questions.push({
      QuestionNumber: currentNum++,
      QuestionContent: qContent || `Câu hỏi thứ ${currentNum - 1}`,
      OptionA: optA || "Đáp án A",
      OptionB: optB || "Đáp án B",
      OptionC: optC || "Đáp án C",
      OptionD: optD || "Đáp án D",
      CorrectAnswer: correct,
      SubQuestions: subQs.length > 0 ? subQs : undefined,
      Solution: "Lời giải chi tiết chưa được phân tích hoàn chỉnh.",
      Difficulty: "MEDIUM"
    });
  }

  if (questions.length === 0) {
    for (let k = 1; k <= qCount; k++) {
      const subQs = qType === "TRUE_FALSE" ? [
        { text: "Phát biểu a", answer: "T" },
        { text: "Phát biểu b", answer: "F" },
        { text: "Phát biểu c", answer: "T" },
        { text: "Phát biểu d", answer: "F" }
      ] : undefined;
      questions.push({
        QuestionNumber: k,
        QuestionContent: `Câu ${k}: (Nội dung câu hỏi phân tích dự phòng)`,
        OptionA: "Lựa chọn A",
        OptionB: "Lựa chọn B",
        OptionC: "Lựa chọn C",
        OptionD: "Lựa chọn D",
        CorrectAnswer: qType === "TRUE_FALSE" ? "T,F,T,F" : "A",
        SubQuestions: subQs,
        Solution: "Chương trình tự động sinh cấu trúc câu hỏi do hệ thống AI bận.",
        Difficulty: "MEDIUM"
      });
    }
  }

  return questions;
}


// Initial Seed Data
const DEFAULT_ACCOUNTS = [
  { RefID: "ADMIN_01", Email: "admin@upgrid.edu.vn", PasswordHash: "123456789", Role: "ADMIN", FullName: "Nguyễn Văn Admin" },
  { RefID: "TCH_01", Email: "teacher.ha@upgrid.edu.vn", PasswordHash: "teacher123", Role: "GIAO_VIEN", FullName: "Cô Nguyễn Thanh Hà" },
  { RefID: "TCH_02", Email: "teacher.nam@upgrid.edu.vn", PasswordHash: "teacher123", Role: "GIAO_VIEN", FullName: "Thầy Trần Hoàng Nam" },
  { RefID: "STD_01", Email: "student.an@upgrid.edu.vn", PasswordHash: "student123", Role: "HOC_VIEN", FullName: "Nguyễn Bình An" },
  { RefID: "STD_02", Email: "student.binh@upgrid.edu.vn", PasswordHash: "student123", Role: "HOC_VIEN", FullName: "Lê Gia Bình" },
  { RefID: "STD_03", Email: "student.chi@upgrid.edu.vn", PasswordHash: "student123", Role: "HOC_VIEN", FullName: "Phạm Minh Chi" }
];

const DEFAULT_CLASSES = [
  { ClassID: "CLS_01", ClassName: "Toán Nâng Cao Lớp 9 - T9.1", Schedule: "Thứ 3 (18:00 - 20:00) & Thứ 7 (08:00 - 10:00)", TeacherID: "TCH_01", Grade: "Lớp 9", Level: "Nâng cao", Subject: "Toán", Hoc_Phi_Theo_Buoi: 200000 },
  { ClassID: "CLS_02", ClassName: "Luyện Thi Đại Học Khối A - A10", Schedule: "Thứ 5 (19:30 - 21:30) & Chủ Nhật (14:00 - 16:00)", TeacherID: "TCH_02", Grade: "Lớp 12", Level: "Cơ bản", Subject: "Toán", Hoc_Phi_Theo_Buoi: 250000 }
];

const DEFAULT_ENROLLMENTS = [
  { EnrollmentID: "ENR_01", ClassID: "CLS_01", StudentID: "STD_01", Trang_Thai_Hoc: "Đang học", Hoc_Phi_Con_No: 0, Han_Dong_Hoc_Phi: "2026-07-01" },
  { EnrollmentID: "ENR_02", ClassID: "CLS_01", StudentID: "STD_02", Trang_Thai_Hoc: "Đang học", Hoc_Phi_Con_No: 0, Han_Dong_Hoc_Phi: "2026-07-01" },
  { EnrollmentID: "ENR_03", ClassID: "CLS_02", StudentID: "STD_02", Trang_Thai_Hoc: "Đang học", Hoc_Phi_Con_No: 0, Han_Dong_Hoc_Phi: "2026-07-01" },
  { EnrollmentID: "ENR_04", ClassID: "CLS_02", StudentID: "STD_03", Trang_Thai_Hoc: "Đang học", Hoc_Phi_Con_No: 0, Han_Dong_Hoc_Phi: "2026-07-01" }
];

const DEFAULT_TEMPLATES = [
  { TemplateID: "TPL_01", TemplateName: "Đề thi thử THPT QG Toán", Subject: "Toán", Grade: "Lớp 12", TotalDuration: 90, MaxScore: 10, Description: "Đề thi thử THPT Quốc Gia môn Toán", CreatedBy: "ADMIN_01" },
  { TemplateID: "TPL_02", TemplateName: "Khảo sát Năng lực Lớp 9", Subject: "Toán", Grade: "Lớp 9", TotalDuration: 45, MaxScore: 10, Description: "Template khảo sát chất lượng Lớp 9", CreatedBy: "ADMIN_01" }
];

const DEFAULT_SECTION_TYPES = [
  { SectionTypeID: "SEC_01", TemplateID: "TPL_02", SectionName: "Trắc nghiệm khách quan", QuestionType: "MCQ", QuestionCount: 2, PointsPerQuestion: 3.0, PointsPerSubQuestion: 0, SortOrder: 1, AIParsePrompt: "" },
  { SectionTypeID: "SEC_02", TemplateID: "TPL_02", SectionName: "Đúng / Sai", QuestionType: "TRUE_FALSE", QuestionCount: 1, PointsPerQuestion: 4.0, PointsPerSubQuestion: 1.0, SortOrder: 2, AIParsePrompt: "" }
];

// Initialize Storage
function getTable<T>(key: string, defaultData: T[]): T[] {
  if (typeof window === "undefined") return defaultData;
  const data = localStorage.getItem(`upgrid_db_${key}`);
  if (!data) {
    localStorage.setItem(`upgrid_db_${key}`, JSON.stringify(defaultData));
    return defaultData;
  }
  return JSON.parse(data);
}

function saveTable<T>(key: string, data: T[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(`upgrid_db_${key}`, JSON.stringify(data));
}

// Database Getters/Setters
const DEFAULT_FOLDERS = [
  // Lớp 9 Nâng cao
  { FolderID: "FLD_901", FolderName: "Chủ đề 1: Biến đổi biểu thức chứa căn bậc hai, căn bậc ba nâng cao", Subject: "Toán", Grade: "Lớp 9", Level: "Nâng cao", SortOrder: 1, Description: "Các phương pháp biến đổi căn thức chuyên sâu", CreatedBy: "ADMIN_01", CreatedDate: "2026-06-24", IsActive: true },
  { FolderID: "FLD_902", FolderName: "Chủ đề 2: Phương trình bậc hai & Định lý Vi-ét nâng cao (ứng dụng số học)", Subject: "Toán", Grade: "Lớp 9", Level: "Nâng cao", SortOrder: 2, Description: "Ứng dụng Vi-ét giải quyết các bài toán số học, nghiệm nguyên", CreatedBy: "ADMIN_01", CreatedDate: "2026-06-24", IsActive: true },
  { FolderID: "FLD_903", FolderName: "Chủ đề 3: Hệ phương trình đối xứng loại I, II và hệ đẳng cấp", Subject: "Toán", Grade: "Lớp 9", Level: "Nâng cao", SortOrder: 3, Description: "Phương pháp thế, cộng đại số và đặt ẩn phụ hệ phương trình", CreatedBy: "ADMIN_01", CreatedDate: "2026-06-24", IsActive: true },
  { FolderID: "FLD_904", FolderName: "Chủ đề 4: Phương trình vô tỷ (đặt ẩn phụ, đánh giá, liên hợp)", Subject: "Toán", Grade: "Lớp 9", Level: "Nâng cao", SortOrder: 4, Description: "Giải phương trình chứa căn dùng lượng liên hợp và đánh giá", CreatedBy: "ADMIN_01", CreatedDate: "2026-06-24", IsActive: true },
  { FolderID: "FLD_905", FolderName: "Chủ đề 5: Hệ thức lượng & Tỉ số lượng giác trong tam giác nâng cao", Subject: "Toán", Grade: "Lớp 9", Level: "Nâng cao", SortOrder: 5, Description: "Chứng minh hệ thức hình học và cực trị hình học", CreatedBy: "ADMIN_01", CreatedDate: "2026-06-24", IsActive: true },
  { FolderID: "FLD_906", FolderName: "Chủ đề 6: Cát tuyến, tiếp tuyến & Tứ giác nội tiếp đường tròn", Subject: "Toán", Grade: "Lớp 9", Level: "Nâng cao", SortOrder: 6, Description: "Các bài toán chứng minh điểm đồng quy, đường thẳng song song", CreatedBy: "ADMIN_01", CreatedDate: "2026-06-24", IsActive: true },

  // Lớp 12 Cơ bản
  { FolderID: "FLD_1201", FolderName: "Chủ đề 1: Khảo sát sự biến thiên và vẽ đồ thị hàm số", Subject: "Toán", Grade: "Lớp 12", Level: "Cơ bản", SortOrder: 1, Description: "Đạo hàm, cực trị, tiệm cận và khảo sát đồ thị", CreatedBy: "ADMIN_01", CreatedDate: "2026-06-24", IsActive: true },
  { FolderID: "FLD_1202", FolderName: "Chủ đề 2: Hàm số lũy thừa, hàm số mũ và hàm số logarit", Subject: "Toán", Grade: "Lớp 12", Level: "Cơ bản", SortOrder: 2, Description: "Lũy thừa, logarit, phương trình mũ & logarit", CreatedBy: "ADMIN_01", CreatedDate: "2026-06-24", IsActive: true },
  { FolderID: "FLD_1203", FolderName: "Chủ đề 3: Nguyên hàm, tích phân và ứng dụng", Subject: "Toán", Grade: "Lớp 12", Level: "Cơ bản", SortOrder: 3, Description: "Tìm nguyên hàm, tính tích phân và diện tích hình phẳng", CreatedBy: "ADMIN_01", CreatedDate: "2026-06-24", IsActive: true }
];

const DEFAULT_EXAMS = [
  {
    ExamID: "EXAM_901",
    ExamName: "Đề kiểm tra 15 phút - Biến đổi căn thức",
    Subject: "Toán",
    Grade: "Lớp 9",
    DurationMinutes: 15,
    TotalPoints: 10,
    TemplateID: "TPL_02",
    Status: "PUBLISHED"
  }
];

const DEFAULT_QUESTIONS = [
  {
    QuestionID: "Q_901_1",
    ExamID: "EXAM_901",
    SectionTypeID: "SEC_01",
    QuestionNumber: "1",
    QuestionContent: "Giá trị của biểu thức $\\sqrt{(\\sqrt{3}-2)^2}$ là:",
    OptionA: "$\\sqrt{3}-2$",
    OptionB: "$2-\\sqrt{3}$",
    OptionC: "$\\sqrt{3}+2$",
    OptionD: "$-\\sqrt{3}-2$",
    CorrectAnswer: "B",
    Difficulty: "DỄ",
    Solution: "Ta có $\\sqrt{(\\sqrt{3}-2)^2} = |\\sqrt{3}-2|$. Vì $\\sqrt{3} < 2$ nên $|\\sqrt{3}-2| = 2-\\sqrt{3}$."
  },
  {
    QuestionID: "Q_901_2",
    ExamID: "EXAM_901",
    SectionTypeID: "SEC_01",
    QuestionNumber: "2",
    QuestionContent: "Trục căn thức ở mẫu của biểu thức $\\frac{1}{\\sqrt{5}-\\sqrt{3}}$ ta được:",
    OptionA: "$\\frac{\\sqrt{5}+\\sqrt{3}}{2}$",
    OptionB: "$\\frac{\\sqrt{5}-\\sqrt{3}}{2}$",
    OptionC: "$\\sqrt{5}+\\sqrt{3}$",
    OptionD: "$\\frac{\\sqrt{5}+\\sqrt{3}}{8}$",
    CorrectAnswer: "A",
    Difficulty: "TRUNG BÌNH",
    Solution: "Nhân cả tử và mẫu với lượng liên hợp: $\\frac{\\sqrt{5}+\\sqrt{3}}{(\\sqrt{5}-\\sqrt{3})(\\sqrt{5}+\\sqrt{3})} = \\frac{\\sqrt{5}+\\sqrt{3}}{5-3} = \\frac{\\sqrt{5}+\\sqrt{3}}{2}$."
  },
  {
    QuestionID: "Q_901_3",
    ExamID: "EXAM_901",
    SectionTypeID: "SEC_02",
    QuestionNumber: "3",
    QuestionContent: "Cho biểu thức $A = \\sqrt{x-2}$. Xét tính Đúng / Sai của các phát biểu sau:",
    OptionA: "", OptionB: "", OptionC: "", OptionD: "",
    SubQuestions: JSON.stringify([
      { text: "Biểu thức A xác định khi $x \\ge 2$", answer: "T" },
      { text: "Khi $x = 1$, giá trị của A là $-1$", answer: "F" },
      { text: "Khi $x = 6$, giá trị của A là $2$", answer: "T" },
      { text: "A luôn nhận giá trị dương với mọi $x \\ge 2$", answer: "F" }
    ]),
    CorrectAnswer: "T,F,T,F",
    Difficulty: "KHÓ",
    Solution: "a) Đúng vì căn thức xác định khi biểu thức trong căn không âm: $x-2 \\ge 0 \\Leftrightarrow x \\ge 2$.\nb) Sai vì khi $x=1$ căn thức không xác định.\nc) Đúng vì khi $x=6$, $A = \\sqrt{6-2} = \\sqrt{4} = 2$.\nd) Sai vì khi $x=2$ thì $A = 0$ không phải số dương."
  }
];

const DEFAULT_FILES = [
  { FileID: "FILE_901_1", FolderID: "FLD_901", FileName: "Tài liệu lý thuyết & bài tập mẫu Căn thức nâng cao.pdf", FileType: "PDF", FileURL: "https://example.com/materials/can_thuc_nang_cao.pdf", ExamID: "", UploadedBy: "ADMIN_01", UploadedDate: "2026-06-24", Description: "Tài liệu ôn tập lý thuyết phần căn thức bậc 2, bậc 3", IsGlobal: true },
  { FileID: "FILE_901_2", FolderID: "FLD_901", FileName: "Đề kiểm tra 15 phút - Biến đổi căn thức.exam", FileType: "EXAM", FileURL: "", ExamID: "EXAM_901", UploadedBy: "ADMIN_01", UploadedDate: "2026-06-24", Description: "Đề thi tự luyện trắc nghiệm 15 phút", IsGlobal: true },
  { FileID: "FILE_902_1", FolderID: "FLD_902", FileName: "Chuyên đề Định lý Viet và ứng dụng số học.pdf", FileType: "PDF", FileURL: "https://example.com/materials/dinh_ly_viet.pdf", ExamID: "", UploadedBy: "ADMIN_01", UploadedDate: "2026-06-24", Description: "Phương pháp dùng định lý Viet giải toán số học lớp 9", IsGlobal: true }
];

const DEFAULT_LINKS = [
  {
    LinkID: "LNK_901_2",
    ClassID: "CLS_01",
    FileID: "FILE_901_2",
    AssignedBy: "ADMIN_01",
    AssignedDate: "2026-06-24",
    DueDate: "2026-07-15",
    IsVisible: true,
    SortOrder: 1,
    MaxAttempts: 3,
    IsActive: true
  },
  {
    LinkID: "LNK_901_1",
    ClassID: "CLS_01",
    FileID: "FILE_901_1",
    AssignedBy: "ADMIN_01",
    AssignedDate: "2026-06-24",
    DueDate: "",
    IsVisible: true,
    SortOrder: 2,
    MaxAttempts: 3,
    IsActive: true
  }
];

const DEFAULT_PROGRESS = [
  { ProgressID: "PRG_901", ClassID: "CLS_01", FolderID: "FLD_901", TopicName: "Chủ đề 1: Biến đổi biểu thức chứa căn bậc hai, căn bậc ba nâng cao", ProgressPercent: 100, Status: "Đã dạy", LastUpdated: "2026-06-24" },
  { ProgressID: "PRG_902", ClassID: "CLS_01", FolderID: "FLD_902", TopicName: "Chủ đề 2: Phương trình bậc hai & Định lý Vi-ét nâng cao (ứng dụng số học)", ProgressPercent: 80, Status: "Đang dạy", LastUpdated: "2026-06-24" },
  { ProgressID: "PRG_903", ClassID: "CLS_01", FolderID: "FLD_903", TopicName: "Chủ đề 3: Hệ phương trình đối xứng loại I, II và hệ đẳng cấp", ProgressPercent: 90, Status: "Đang dạy", LastUpdated: "2026-06-24" },
  { ProgressID: "PRG_904", ClassID: "CLS_01", FolderID: "FLD_904", TopicName: "Chủ đề 4: Phương trình vô tỷ (đặt ẩn phụ, đánh giá, liên hợp)", ProgressPercent: 60, Status: "Đang dạy", LastUpdated: "2026-06-24" },
  { ProgressID: "PRG_905", ClassID: "CLS_01", FolderID: "FLD_905", TopicName: "Chủ đề 5: Hệ thức lượng & Tỉ số lượng giác trong tam giác nâng cao", ProgressPercent: 0, Status: "Chưa dạy", LastUpdated: "2026-06-24" },
  { ProgressID: "PRG_906", ClassID: "CLS_01", FolderID: "FLD_906", TopicName: "Chủ đề 6: Cát tuyến, tiếp tuyến & Tứ giác nội tiếp đường tròn", ProgressPercent: 0, Status: "Chưa dạy", LastUpdated: "2026-06-24" },

  // For Class 2
  { ProgressID: "PRG_1201", ClassID: "CLS_02", FolderID: "FLD_1201", TopicName: "Chủ đề 1: Khảo sát sự biến thiên và vẽ đồ thị hàm số", ProgressPercent: 100, Status: "Đã dạy", LastUpdated: "2026-06-24" },
  { ProgressID: "PRG_1202", ClassID: "CLS_02", FolderID: "FLD_1202", TopicName: "Chủ đề 2: Hàm số lũy thừa, hàm số mũ và hàm số logarit", ProgressPercent: 0, Status: "Chưa dạy", LastUpdated: "2026-06-24" },
  { ProgressID: "PRG_1203", ClassID: "CLS_02", FolderID: "FLD_1203", TopicName: "Chủ đề 3: Nguyên hàm, tích phân và ứng dụng", ProgressPercent: 0, Status: "Chưa dạy", LastUpdated: "2026-06-24" }
];

// Database Getters/Setters
const getAccounts = () => getTable("TAI_KHOAN", DEFAULT_ACCOUNTS);
const getClasses = () => getTable("LOPHOC", DEFAULT_CLASSES);
const getEnrollments = () => getTable("GHI_DANH", DEFAULT_ENROLLMENTS);
const getFolders = () => getTable<any>("FOLDER_CHUYEN_DE", DEFAULT_FOLDERS);
const saveFolders = (data: any[]) => saveTable("FOLDER_CHUYEN_DE", data);
const getFiles = () => getTable<any>("FILE_HOC_LIEU", DEFAULT_FILES);
const saveFiles = (data: any[]) => saveTable("FILE_HOC_LIEU", data);
const getLinks = () => getTable<any>("CLASS_MATERIAL_LINK", DEFAULT_LINKS);
const saveLinks = (data: any[]) => saveTable("CLASS_MATERIAL_LINK", data);
const getTemplates = () => getTable("EXAM_TEMPLATE", DEFAULT_TEMPLATES);
const saveTemplates = (data: any[]) => saveTable("EXAM_TEMPLATE", data);
const getSectionTypes = () => getTable("EXAM_SECTION_TYPE", DEFAULT_SECTION_TYPES);
const saveSectionTypes = (data: any[]) => saveTable("EXAM_SECTION_TYPE", data);
const getExams = () => getTable<any>("EXAM_BANK", DEFAULT_EXAMS);
const saveExams = (data: any[]) => saveTable("EXAM_BANK", data);
const getQuestions = () => getTable<any>("EXAM_QUESTION", DEFAULT_QUESTIONS);
const saveQuestions = (data: any[]) => saveTable("EXAM_QUESTION", data);
const getAttempts = () => getTable<any>("EXAM_ATTEMPT", []);
const saveAttempts = (data: any[]) => saveTable("EXAM_ATTEMPT", data);
const getAnswers = () => getTable<any>("EXAM_ANSWER", []);
const saveAnswers = (data: any[]) => saveTable("EXAM_ANSWER", data);
const getResults = () => getTable<any>("KET_QUA_HOC_TAP", []);
const saveResults = (data: any[]) => saveTable("KET_QUA_HOC_TAP", data);
const getProgressTable = () => getTable<any>("TIEN_DO_LOP_HOC", DEFAULT_PROGRESS);
const saveProgressTable = (data: any[]) => saveTable("TIEN_DO_LOP_HOC", data);

// Mock token helper
function parseMockToken(token: string) {
  if (!token) return null;
  try {
    const raw = atob(token);
    return JSON.parse(raw);
  } catch (e) {
    // If it's a real GAS token or corrupted, return a mock session to prevent crashes
    return { refId: "ADMIN_01", role: "ADMIN", fullName: "Giáo viên (GAS Fallback)" };
  }
}

function generateMockToken(user: any) {
  const session = {
    refId: user.RefID,
    email: user.Email,
    role: user.Role,
    fullName: user.FullName,
    exp: Date.now() + 24 * 60 * 60 * 1000
  };
  return btoa(JSON.stringify(session));
}

// Router Mock Execution
export async function executeMockAction(action: string, params: any): Promise<any> {
  console.log("[MockDB] Executing action:", action, "with params:", params);

  // Authenticate token unless action is login or public read-only actions
  let userSession: any = null;
  // These actions don't need mock token validation (GAS token format != mock token format)
  const noAuthActions = [
    "login",
    "getDriveFiles",
    "getFolders",
    "getFolderFiles",
    "getClassMaterials",
    "getClassProgress",
    "getPublicClasses",
    "getExamDetail",
    "parseLatexSection",
  ];
  if (!noAuthActions.includes(action)) {
    const token = params.token || "";
    userSession = parseMockToken(token);
    if (!userSession) {
      throw new Error("Unauthorized: Invalid or expired token");
    }
  } else if (action !== "login") {
    // For public/read-only actions, create a guest session for role-checking downstream
    userSession = { refId: params.token ? "GAS_USER" : "GUEST", role: "GIAO_VIEN", fullName: "Guest" };
  }

  switch (action) {
    case "login": {
      const { email, password } = params;
      const accounts = getAccounts();
      const matched = accounts.find(
        (a) => a.Email.toLowerCase() === email.toLowerCase() && a.PasswordHash === password
      );
      if (!matched) {
        return { success: false, error: "Sai email hoặc mật khẩu!" };
      }
      const token = generateMockToken(matched);
      return {
        success: true,
        data: {
          token,
          user: {
            refId: matched.RefID,
            email: matched.Email,
            role: matched.Role,
            fullName: matched.FullName
          }
        }
      };
    }

    case "getClasses": {
      const classes = getClasses();
      const enrollments = getEnrollments();
      const accounts = getAccounts();
      const results = getResults();

      const teacherMap: Record<string, string> = {};
      accounts.forEach((acc) => {
        if (acc.Role === "GIAO_VIEN") {
          teacherMap[acc.RefID] = acc.FullName;
        }
      });

      // Filter based on role
      let filtered = classes;
      if (userSession.role === "GIAO_VIEN") {
        filtered = classes.filter((c) => c.TeacherID === userSession.refId);
      } else if (userSession.role === "HOC_VIEN") {
        const myClassIds = enrollments
          .filter((e) => e.StudentID === userSession.refId)
          .map((e) => e.ClassID);
        filtered = classes.filter((c) => myClassIds.includes(c.ClassID));
      }

      return filtered.map((cls) => {
        // Simple progress calculation
        return {
          classId: cls.ClassID,
          className: cls.ClassName,
          schedule: cls.Schedule,
          teacherId: cls.TeacherID,
          teacherName: teacherMap[cls.TeacherID] || "Chưa phân công",
          tuitionFee: cls.Hoc_Phi_Theo_Buoi || 200000,
          grade: cls.Grade || "Lớp 9",
          level: cls.Level || "Cơ bản",
          subject: cls.Subject || "Toán",
          progress: 50 // Default progress percent
        };
      });
    }

    case "getFolders": {
      const { grade, level, subject } = params;
      const folders = getFolders();
      
      // Filter folders matching filters
      let result = folders.filter((f) => f.IsActive !== false);
      if (grade) result = result.filter((f) => f.Grade === grade);
      if (level) result = result.filter((f) => f.Level === level);
      if (subject) result = result.filter((f) => f.Subject === subject);

      return result.map((f) => ({
        folderId: f.FolderID,
        folderName: f.FolderName,
        subject: f.Subject,
        grade: f.Grade,
        level: f.Level,
        sortOrder: parseInt(f.SortOrder) || 1,
        description: f.Description || ""
      }));
    }

    case "createFolder": {
      const { folderName, subject, grade, level, sortOrder, description } = params;
      const folders = getFolders();
      const newFolder = {
        FolderID: "FLD_" + Date.now(),
        FolderName: folderName,
        Subject: subject,
        Grade: grade,
        Level: level,
        SortOrder: sortOrder || 1,
        Description: description || "",
        CreatedBy: userSession.refId,
        CreatedDate: new Date().toISOString().split("T")[0],
        IsActive: true
      };
      folders.push(newFolder);
      saveFolders(folders);
      return { folderId: newFolder.FolderID };
    }

    case "deleteFolder": {
      const { folderId } = params;
      const folders = getFolders();
      const updated = folders.map((f) => {
        if (f.FolderID === folderId) {
          return { ...f, IsActive: false };
        }
        return f;
      });
      saveFolders(updated);
      return { success: true };
    }

    case "getFolderFiles": {
      const { folderId } = params;
      const files = getFiles();
      const exams = getExams();
      
      const folderFiles = files.filter((f) => f.FolderID === folderId);
      return folderFiles.map((file) => {
        let durationMinutes = 0;
        if (file.FileType === "EXAM" && file.ExamID) {
          const matchedExam = exams.find((e) => e.ExamID === file.ExamID);
          if (matchedExam) {
            durationMinutes = parseInt(matchedExam.DurationMinutes) || 0;
          }
        }

        return {
          fileId: file.FileID,
          folderId: file.FolderID,
          fileName: file.FileName,
          fileType: file.FileType,
          fileUrl: file.FileURL || "",
          examId: file.ExamID || "",
          durationMinutes,
          description: file.Description || ""
        };
      });
    }

    case "createFilePDF": {
      const { folderId, fileName, fileUrl, description, isGlobal } = params;
      const files = getFiles();
      const newFile = {
        FileID: "FILE_" + Date.now(),
        FolderID: folderId,
        FileName: fileName,
        FileType: "PDF",
        FileURL: fileUrl,
        ExamID: "",
        UploadedBy: userSession.refId,
        UploadedDate: new Date().toISOString().split("T")[0],
        Description: description || "",
        IsGlobal: isGlobal === undefined ? true : isGlobal
      };
      files.push(newFile);
      saveFiles(files);
      return { fileId: newFile.FileID };
    }

    case "deleteFile": {
      const { fileId } = params;
      const files = getFiles();
      const updated = files.filter((f) => f.FileID !== fileId);
      saveFiles(updated);
      return { success: true };
    }

    case "getExamTemplates": {
      const templates = getTemplates();
      const sectionTypes = getSectionTypes();
      
      return templates.map((t) => {
        const sections = sectionTypes
          .filter((s) => s.TemplateID === t.TemplateID)
          .map((s) => ({
            sectionTypeId: s.SectionTypeID,
            sectionName: s.SectionName,
            questionType: s.QuestionType,
            questionCount: parseInt(s.QuestionCount.toString()) || 0,
            pointsPerQuestion: parseFloat(s.PointsPerQuestion.toString()) || 0,
            pointsPerSubQuestion: parseFloat(s.PointsPerSubQuestion.toString()) || 0,
            sortOrder: parseInt(s.SortOrder.toString()) || 1,
            aiParsePrompt: s.AIParsePrompt || ""
          }));

        return {
          templateId: t.TemplateID,
          templateName: t.TemplateName,
          subject: t.Subject,
          grade: t.Grade,
          totalDuration: parseInt(t.TotalDuration.toString()) || 45,
          maxScore: parseFloat(t.MaxScore.toString()) || 10.0,
          description: t.Description || "",
          sections
        };
      });
    }

    case "createExamTemplate": {
      const { templateName, subject, grade, totalDuration, maxScore, description, sections } = params;
      const templates = getTemplates();
      const sectionTypes = getSectionTypes();

      const newTemplate = {
        TemplateID: "TPL_" + Date.now(),
        TemplateName: templateName,
        Subject: subject,
        Grade: grade,
        TotalDuration: totalDuration || 45,
        MaxScore: maxScore || 10,
        Description: description || "",
        CreatedBy: userSession.refId
      };

      templates.push(newTemplate);
      saveTemplates(templates);

      if (sections && Array.isArray(sections)) {
        sections.forEach((sec, idx) => {
          const newSec = {
            SectionTypeID: `SEC_${Date.now()}_${idx}`,
            TemplateID: newTemplate.TemplateID,
            SectionName: sec.sectionName,
            QuestionType: sec.questionType,
            QuestionCount: sec.questionCount,
            PointsPerQuestion: sec.pointsPerQuestion,
            PointsPerSubQuestion: sec.pointsPerSubQuestion || 0,
            SortOrder: idx + 1,
            AIParsePrompt: sec.aiParsePrompt || ""
          };
          sectionTypes.push(newSec);
        });
        saveSectionTypes(sectionTypes);
      }

      return { templateId: newTemplate.TemplateID };
    }

    case "createCustomExam": {
      const { examName, subject, grade, durationMinutes, sections, targetFolderId } = params;
      const examId = "EXM_" + Math.floor(100 + Math.random() * 900);
      const templateId = "TPL_CSTM_" + Math.floor(100 + Math.random() * 900);
      
      let totalPoints = 0;
      const dbTemplates = getTemplates();
      dbTemplates.push({
        TemplateID: templateId,
        TemplateName: examName + " (Custom)",
        Subject: subject || "Toán",
        Grade: grade || "Lớp 9",
        TotalDuration: durationMinutes || 90,
        MaxScore: 10,
        Description: "Auto-generated template",
        CreatedBy: userSession.refId
      });
      saveTemplates(dbTemplates);
      
      const dbSections = getSectionTypes();
      const dbQuestions = getQuestions();
      
      if (sections && sections.length > 0) {
        sections.forEach((s: any, idx: number) => {
          const sectionTypeId = "SCT_CSTM_" + Math.floor(1000 + Math.random() * 9000);
          const sPoints = parseFloat(s.pointsPerQuestion) || 0;
          const sCount = parseInt(s.questionCount) || 1;
          totalPoints += sCount * sPoints;
          
          dbSections.push({
            SectionTypeID: sectionTypeId,
            TemplateID: templateId,
            SectionName: s.sectionName || `Phần ${idx + 1}`,
            QuestionType: s.questionType || "MCQ",
            QuestionCount: sCount,
            PointsPerQuestion: sPoints,
            PointsPerSubQuestion: "",
            SortOrder: idx + 1,
            AIParsePrompt: ""
          });
          
          if (s.parsedQuestions && s.parsedQuestions.length > 0) {
            s.parsedQuestions.forEach((q: any, qIdx: number) => {
              dbQuestions.push({
                QuestionID: "Q_" + Math.floor(10000 + Math.random() * 90000),
                ExamID: examId,
                SectionTypeID: sectionTypeId,
                QuestionNumber: qIdx + 1,
                QuestionContent: q.questionContent || "",
                OptionA: q.optionA || "",
                OptionB: q.optionB || "",
                OptionC: q.optionC || "",
                OptionD: q.optionD || "",
                SubQuestions: q.subQuestions ? JSON.stringify(q.subQuestions) : "",
                CorrectAnswer: q.correctAnswer || "",
                Solution: q.solution || "",
                Difficulty: q.difficulty || "Trung bình"
              });
            });
          }
        });
      }
      
      saveSectionTypes(dbSections);
      saveQuestions(dbQuestions);
      
      const dbExams = getExams();
      dbExams.push({
        ExamID: examId,
        TemplateID: templateId,
        ExamName: examName,
        Subject: subject || "Toán",
        Grade: grade || "Lớp 9",
        DurationMinutes: durationMinutes || 90,
        TotalPoints: totalPoints,
        CreatedBy: userSession.refId,
        CreatedDate: new Date().toISOString().split("T")[0],
        Status: "PUBLISHED",
        ShuffleQuestions: false,
        ShuffleOptions: false
      });
      saveExams(dbExams);
      
      const fileId = "FILE_" + Math.floor(100 + Math.random() * 900);
      const dbFiles = getFiles();
      dbFiles.push({
        FileID: fileId,
        FolderID: targetFolderId || "",
        FileName: examName,
        FileType: "EXAM",
        FileURL: "",
        ExamID: examId,
        Description: "Đề thi tự sinh",
        UploadedBy: userSession.refId,
        UploadDate: new Date().toISOString().split("T")[0]
      });
      saveFiles(dbFiles);
      
      return { examId, fileId };
    }

    case "createExam": {
      const { templateId, examName, durationMinutes, shuffleQuestions, shuffleOptions } = params;
      const templates = getTemplates();
      const exams = getExams();

      const matchedTemplate = templates.find((t) => t.TemplateID === templateId);
      if (!matchedTemplate) throw new Error("Template not found");

      const newExam = {
        ExamID: "EXAM_" + Date.now(),
        TemplateID: templateId,
        ExamName: examName,
        Subject: matchedTemplate.Subject,
        Grade: matchedTemplate.Grade,
        DurationMinutes: durationMinutes || matchedTemplate.TotalDuration,
        TotalPoints: matchedTemplate.MaxScore,
        CreatedBy: userSession.refId,
        CreatedDate: new Date().toISOString().split("T")[0],
        Status: "DRAFT",
        ShuffleQuestions: shuffleQuestions || false,
        ShuffleOptions: shuffleOptions || false
      };

      exams.push(newExam);
      saveExams(exams);
      return { examId: newExam.ExamID };
    }

    case "getExamDetail": {
      const { examId } = params;
      const exams = getExams();
      const questions = getQuestions();
      const sectionTypes = getSectionTypes();

      const exam = exams.find((e) => e.ExamID === examId);
      if (!exam) throw new Error("Exam not found");

      const examSections = sectionTypes.filter((s) => s.TemplateID === exam.TemplateID);
      const examQuestions = questions.filter((q) => q.ExamID === examId);

      const mappedSections = examSections.map((sec) => {
        const secQuestions = examQuestions
          .filter((q) => q.SectionTypeID === sec.SectionTypeID)
          .map((q) => ({
            questionId: q.QuestionID,
            questionNumber: parseInt(q.QuestionNumber),
            questionContent: q.QuestionContent,
            optionA: q.OptionA,
            optionB: q.OptionB,
            optionC: q.OptionC,
            optionD: q.OptionD,
            subQuestions: getSubQuestionsArray(q.SubQuestions),
            correctAnswer: q.CorrectAnswer || "",
            solution: q.Solution || "",
            difficulty: q.Difficulty || "Trung bình"
          }));

        return {
          sectionTypeId: sec.SectionTypeID,
          sectionName: sec.SectionName,
          questionType: sec.QuestionType,
          questionCount: parseInt(sec.QuestionCount.toString()) || 0,
          pointsPerQuestion: parseFloat(sec.PointsPerQuestion.toString()) || 0,
          pointsPerSubQuestion: parseFloat(sec.PointsPerSubQuestion.toString()) || 0,
          questions: secQuestions
        };
      });

      return {
        examId: exam.ExamID,
        examName: exam.ExamName,
        subject: exam.Subject,
        grade: exam.Grade,
        durationMinutes: parseInt(exam.DurationMinutes.toString()),
        totalPoints: parseFloat(exam.TotalPoints.toString()),
        status: exam.Status,
        sections: mappedSections
      };
    }

    case "parseLatexSection": {
      const { latex, questionType, expectedCount } = params;
      const qType = questionType || "MCQ";
      const qCount = parseInt(expectedCount) || 1;

      let systemPrompt = "";
      if (qType === "MCQ") {
        systemPrompt = `Bạn là một hệ thống phân tích đề thi thông minh. Trích xuất văn bản LaTeX thành MẢNG JSON hợp lệ chứa đúng ${qCount} phần tử với schema: [{questionContent: string, optionA: string, optionB: string, optionC: string, optionD: string, correctAnswer: string, solution: string}]. 
QUAN TRỌNG: Hãy TỰ GIẢI các câu hỏi toán học này để tự động điền đáp án đúng (A, B, C, hoặc D) vào 'correctAnswer', và viết lời giải chi tiết từng bước vào 'solution'. TRẢ VỀ ĐÚNG MẢNG JSON, KHÔNG THÊM BẤT KỲ VĂN BẢN NÀO KHÁC. Giữ nguyên định dạng LaTeX.`;
      } else if (qType === "TRUE_FALSE") {
        systemPrompt = `Bạn là một hệ thống phân tích đề thi thông minh. Trích xuất văn bản LaTeX thành MẢNG JSON hợp lệ chứa đúng ${qCount} phần tử với schema: [{questionContent: string, subQuestions: [{content: string, isTrue: boolean}], solution: string}]. 
Mỗi câu phải có chính xác 4 subQuestions tương ứng với 4 ý a,b,c,d. QUAN TRỌNG: Hãy TỰ GIẢI các ý này để điền true/false vào 'isTrue', và viết lời giải chi tiết vào 'solution'. TRẢ VỀ ĐÚNG MẢNG JSON. Giữ nguyên định dạng LaTeX.`;
      } else if (qType === "SHORT_ANSWER") {
        systemPrompt = `Bạn là một hệ thống phân tích đề thi thông minh. Trích xuất văn bản LaTeX thành MẢNG JSON hợp lệ chứa đúng ${qCount} phần tử với schema: [{questionContent: string, correctAnswer: string, solution: string}]. 
QUAN TRỌNG: Hãy TỰ GIẢI các câu hỏi này để tự động điền kết quả cuối cùng vào 'correctAnswer', và viết lời giải chi tiết vào 'solution'. TRẢ VỀ ĐÚNG MẢNG JSON. Giữ nguyên định dạng LaTeX.`;
      } else {
        systemPrompt = "Bạn là một hệ thống phân tích đề thi. Trích xuất LaTeX thành MẢNG JSON hợp lệ. TRẢ VỀ ĐÚNG MẢNG JSON.";
      }

      const apiKey = "YOUR_GEMINI_API_KEY_HERE";
      const url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" + apiKey;

      try {
        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: systemPrompt }] },
            contents: [{ parts: [{ text: "Phân tích đoạn LaTeX sau:\n\n" + latex }] }],
            generationConfig: { temperature: 0.1, responseMimeType: "application/json" }
          })
        });
        
        if (!res.ok) {
          throw new Error("Gemini API error: " + res.statusText);
        }
        
        const data = await res.json();
        if (data.candidates && data.candidates.length > 0) {
          let aiText = data.candidates[0].content.parts[0].text;
          
          // Sanitize markdown if Gemini accidentally included it
          aiText = aiText.replace(/```json/gi, "").replace(/```/g, "").trim();
          
          let parsed = JSON.parse(aiText);
          
          // Sometimes AI wraps it in { "questions": [...] }
          if (!Array.isArray(parsed) && parsed.questions && Array.isArray(parsed.questions)) {
            parsed = parsed.questions;
          } else if (!Array.isArray(parsed) && typeof parsed === 'object') {
            parsed = [parsed]; // fallback to single object array
          }

          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed.map((q: any) => ({
              questionContent: q.questionContent || q.content || "",
              optionA: q.optionA || q.a || "",
              optionB: q.optionB || q.b || "",
              optionC: q.optionC || q.c || "",
              optionD: q.optionD || q.d || "",
              subQuestions: q.subQuestions || null,
              correctAnswer: q.correctAnswer || q.answer || "",
              solution: q.solution || q.explanation || "",
              difficulty: q.difficulty || "Trung bình"
            }));
          } else {
             throw new Error("AI returned empty or invalid array format");
          }
        }
      } catch (err: any) {
        console.error("Gemini Parse Error, using fallback:", err);
      }

      // Fallback
      const parsedQuestions = fallbackParseLatex(latex, qType, qCount);
      
      return parsedQuestions.map((q: any) => ({
        questionContent: q.QuestionContent,
        optionA: q.OptionA,
        optionB: q.OptionB,
        optionC: q.OptionC,
        optionD: q.OptionD,
        subQuestions: q.SubQuestions,
        correctAnswer: q.CorrectAnswer,
        solution: q.Solution,
        difficulty: q.Difficulty === "HARD" ? "Khó" : q.Difficulty === "EASY" ? "Dễ" : "Trung bình"
      }));
    }

    case "saveExamSection": {
      const { examId, sectionTypeId, questions } = params;
      const allQuestions = getQuestions();
      
      // Delete existing questions for this section
      const filtered = allQuestions.filter(
        (q) => !(q.ExamID === examId && q.SectionTypeID === sectionTypeId)
      );

      questions.forEach((q: any, idx: number) => {
        filtered.push({
          QuestionID: `QS_${Date.now()}_${idx}`,
          ExamID: examId,
          SectionTypeID: sectionTypeId,
          QuestionNumber: idx + 1,
          QuestionContent: q.questionContent,
          OptionA: q.optionA || "",
          OptionB: q.optionB || "",
          OptionC: q.optionC || "",
          OptionD: q.optionD || "",
          SubQuestions: typeof q.subQuestions === "object" ? JSON.stringify(q.subQuestions) : q.subQuestions || "",
          CorrectAnswer: q.correctAnswer || "",
          Solution: q.solution || "",
          Difficulty: q.difficulty || "Trung bình"
        });
      });

      saveQuestions(filtered);
      return { success: true };
    }

    case "publishExam": {
      const { examId, folderId } = params;
      const exams = getExams();
      const folders = getFolders();
      const files = getFiles();

      const exam = exams.find((e) => e.ExamID === examId);
      if (!exam) throw new Error("Exam not found");

      exam.Status = "PUBLISHED";
      saveExams(exams);

      // Find target folder or create matching folder
      let folder = null;
      if (folderId) {
        folder = folders.find((f) => f.FolderID === folderId && f.IsActive !== false);
      }
      if (!folder) {
        folder = folders.find(
          (f) => f.Subject === exam.Subject && f.Grade === exam.Grade && f.IsActive !== false
        );
      }
      
      if (!folder) {
        folder = {
          FolderID: "FLD_" + Date.now(),
          FolderName: `Chuyên đề ${exam.Subject} ${exam.Grade}`,
          Subject: exam.Subject,
          Grade: exam.Grade,
          Level: "Cơ bản",
          SortOrder: 1,
          Description: "Thư mục tự động tạo khi xuất bản đề thi",
          CreatedBy: userSession.refId,
          CreatedDate: new Date().toISOString().split("T")[0],
          IsActive: true
        };
        folders.push(folder);
        saveFolders(folders);
      }

      // Add to FILE_HOC_LIEU
      const fileId = "FILE_" + Date.now();
      files.push({
        FileID: fileId,
        FolderID: folder.FolderID,
        FileName: exam.ExamName,
        FileType: "EXAM",
        FileURL: "",
        ExamID: exam.ExamID,
        UploadedBy: userSession.refId,
        UploadedDate: new Date().toISOString().split("T")[0],
        Description: `Đề thi xuất bản từ ${exam.ExamName}`,
        IsGlobal: true
      });
      saveFiles(files);

      return { fileId, folderId: folder.FolderID };
    }

    case "assignMaterialToClass": {
      const { classId, fileId, dueDate, maxAttempts, isVisible } = params;
      const links = getLinks();

      const newLink = {
        LinkID: "LNK_" + Date.now(),
        ClassID: classId,
        FileID: fileId,
        AssignedBy: userSession.refId,
        AssignedDate: new Date().toISOString().split("T")[0],
        DueDate: dueDate || "",
        IsVisible: isVisible !== false,
        SortOrder: 99,
        MaxAttempts: maxAttempts || "",
        IsActive: true,
        TopicName: params.folderName || ""
      };

      links.push(newLink);
      saveLinks(links);
      return { linkId: newLink.LinkID };
    }

    case "unassignMaterialFromClass": {
      const { classId, fileId } = params;
      const links = getLinks();
      const updated = links.map((l) => {
        if (l.ClassID === classId && l.FileID === fileId) {
          return { ...l, IsActive: false };
        }
        return l;
      });
      saveLinks(updated);
      return { success: true };
    }

    case "updateMaterialLink": {
      const { linkId, dueDate, maxAttempts, isVisible } = params;
      const links = getLinks();
      const updated = links.map((l) => {
        if (l.LinkID === linkId) {
          return {
            ...l,
            DueDate: dueDate !== undefined ? dueDate : l.DueDate,
            MaxAttempts: maxAttempts !== undefined ? parseInt(maxAttempts.toString()) : l.MaxAttempts,
            IsVisible: isVisible !== undefined ? isVisible : l.IsVisible
          };
        }
        return l;
      });
      saveLinks(updated);
      return { success: true };
    }

    case "getClassMaterials": {
      const { classId } = params;
      const links = getLinks();
      const files = getFiles();
      const folders = getFolders();
      const exams = getExams();
      const attempts = getAttempts();

      const classLinks = links.filter((l) => l.ClassID === classId && l.IsActive !== false);
      
      return classLinks.map((link) => {
        const file = files.find((f) => f.FileID === link.FileID);
        if (!file) return null;

        const folder = folders.find((f) => f.FolderID === file.FolderID);
        const exam = file.ExamID ? exams.find((e) => e.ExamID === file.ExamID) : null;

        // Calculate student completed attempts
        let attemptCount = 0;
        let highestScore = null;
        if (userSession.role === "HOC_VIEN") {
          const studentAttempts = attempts.filter(
            (a) => a.StudentID === userSession.refId && a.LinkID === link.LinkID && a.Status === "COMPLETED"
          );
          attemptCount = studentAttempts.length;
          if (attemptCount > 0) {
            highestScore = Math.max(...studentAttempts.map((a) => parseFloat(a.TotalScore) || 0));
          }
        }

        return {
          linkId: link.LinkID,
          classId: link.ClassID,
          fileId: link.FileID,
          fileName: file.FileName,
          fileType: file.FileType,
          fileUrl: file.FileURL || "",
          examId: file.ExamID || "",
          folderId: file.FolderID,
          folderName: folder ? folder.FolderName : "Thư mục chung",
          dueDate: link.DueDate || "",
          isVisible: link.IsVisible,
          maxAttempts: parseInt(link.MaxAttempts) || 3,
          durationMinutes: exam ? parseInt(exam.DurationMinutes) : 0,
          attemptCount,
          highestScore
        };
      }).filter(Boolean);
    }

    case "startExam": {
      const { classId, examId } = params;
      const exams = getExams();
      const questions = getQuestions();
      const attempts = getAttempts();
      const links = getLinks();

      const exam = exams.find((e) => e.ExamID === examId);
      if (!exam) throw new Error("Exam not found");

      // Find file matching this exam
      const files = getFiles();
      const file = files.find((f) => f.ExamID === examId);
      const link = file ? links.find((l) => l.ClassID === classId && l.FileID === file.FileID) : null;

      const examQuestions = questions.filter((q) => q.ExamID === examId);

      // Create new attempt
      const attemptId = "ATT_" + Date.now();
      const newAttempt = {
        AttemptID: attemptId,
        StudentID: userSession.refId,
        ExamID: examId,
        ClassID: classId,
        LinkID: link ? link.LinkID : "",
        StartTime: new Date().toISOString(),
        SubmitTime: "",
        DurationSeconds: 0,
        Status: "STARTED",
        TotalScore: 0,
        MaxScore: exam.TotalPoints || 10.0,
        AttemptNumber: attempts.filter((a) => a.StudentID === userSession.refId && a.ExamID === examId).length + 1,
        QuestionOrder: JSON.stringify(examQuestions.map((q) => q.QuestionID))
      };

      attempts.push(newAttempt);
      saveAttempts(attempts);

      // Return questions without correct answers
      const sanitizedQuestions = examQuestions.map((q) => ({
        questionId: q.QuestionID,
        sectionTypeId: q.SectionTypeID,
        questionNumber: parseInt(q.QuestionNumber),
        questionContent: q.QuestionContent,
        optionA: q.OptionA,
        optionB: q.OptionB,
        optionC: q.OptionC,
        optionD: q.OptionD,
        subQuestions: getSubQuestionsArray(q.SubQuestions),
        difficulty: q.Difficulty || "Trung bình"
      }));

      return {
        attemptId,
        examName: exam.ExamName,
        durationMinutes: parseInt(exam.DurationMinutes),
        questions: sanitizedQuestions
      };
    }

    case "saveExamProgress": {
      const { attemptId, answers } = params;
      const attemptList = getAttempts();
      const attempt = attemptList.find((a) => a.AttemptID === attemptId);
      if (!attempt) throw new Error("Attempt not found");

      const savedAnswers = getAnswers();
      // Remove existing saved answers for this attempt
      const filtered = savedAnswers.filter((ans) => ans.AttemptID !== attemptId);

      answers.forEach((ans: any, idx: number) => {
        filtered.push({
          AnswerID: `ANS_${Date.now()}_${idx}`,
          AttemptID: attemptId,
          QuestionID: ans.questionId,
          StudentAnswer: ans.studentAnswer || "",
          SubAnswers: typeof ans.subAnswers === "object" ? JSON.stringify(ans.subAnswers) : ans.subAnswers || "",
          IsCorrect: false, // will be evaluated on submit
          PointsEarned: 0
        });
      });

      saveAnswers(filtered);
      return { success: true };
    }

    case "submitExam": {
      const { attemptId } = params;
      const attemptList = getAttempts();
      const attempt = attemptList.find((a) => a.AttemptID === attemptId);
      if (!attempt) throw new Error("Attempt not found");

      attempt.SubmitTime = new Date().toISOString();
      attempt.Status = "COMPLETED";

      const start = new Date(attempt.StartTime).getTime();
      const end = new Date(attempt.SubmitTime).getTime();
      attempt.DurationSeconds = Math.floor((end - start) / 1000);

      // Evaluate answers
      const answers = getAnswers().filter((ans) => ans.AttemptID === attemptId);
      const questions = getQuestions();
      const sectionTypes = getSectionTypes();

      let totalScore = 0;

      answers.forEach((ans) => {
        const q = questions.find((qi) => qi.QuestionID === ans.QuestionID);
        if (!q) return;

        const sec = sectionTypes.find((s) => s.SectionTypeID === q.SectionTypeID);
        if (!sec) return;

        if (sec.QuestionType === "MCQ") {
          const isCorrect = q.CorrectAnswer.trim().toUpperCase() === ans.StudentAnswer.trim().toUpperCase();
          ans.IsCorrect = isCorrect;
          ans.PointsEarned = isCorrect ? parseFloat(sec.PointsPerQuestion.toString()) : 0;
          totalScore += ans.PointsEarned;
        } else if (sec.QuestionType === "TRUE_FALSE") {
          // Compare sub-questions
          const subQuestions = getSubQuestionsArray(q.SubQuestions);
          const studentSubAnswers = typeof ans.SubAnswers === "string" ? (ans.SubAnswers.trim() ? JSON.parse(ans.SubAnswers) : []) : ans.SubAnswers || [];
          
          let correctCount = 0;
          subQuestions.forEach((sub: any, sIdx: number) => {
            const stuAns = studentSubAnswers.find((sa: any) => sa.subIndex === sIdx);
            if (stuAns && stuAns.answer && sub.answer && stuAns.answer.trim().toUpperCase() === sub.answer.trim().toUpperCase()) {
              correctCount++;
            }
          });

          ans.IsCorrect = correctCount === subQuestions.length;
          ans.PointsEarned = correctCount * (parseFloat(sec.PointsPerSubQuestion.toString()) || 1.0);
          totalScore += ans.PointsEarned;
        }
      });

      attempt.TotalScore = parseFloat(totalScore.toFixed(2));
      saveAttempts(attemptList);

      // Save to KET_QUA_HOC_TAP
      const results = getResults();
      const exams = getExams();
      const exam = exams.find((e) => e.ExamID === attempt.ExamID);

      const resultId = "RES_" + Date.now();
      results.push({
        ResultID: resultId,
        StudentID: attempt.StudentID,
        ClassID: attempt.ClassID,
        AssignmentName: exam ? exam.ExamName : "Bài tập",
        Source_Type: "ONLINE_EXAM",
        AttemptID: attemptId,
        Score: attempt.TotalScore,
        MaxScore: attempt.MaxScore,
        NormalizedScore: parseFloat(((attempt.TotalScore / attempt.MaxScore) * 10).toFixed(2)),
        Feedback: "Nộp bài tự động",
        RecordedBy: "SYSTEM",
        RecordedDate: new Date().toISOString().split("T")[0],
        AttemptNumber: attempt.AttemptNumber,
        IsBestAttempt: true
      });
      saveResults(results);

      return {
        totalScore: attempt.TotalScore,
        maxScore: attempt.MaxScore
      };
    }

    case "getExamResult": {
      const { attemptId } = params;
      const attempts = getAttempts();
      const exams = getExams();
      const questions = getQuestions();
      const answers = getAnswers();
      const sectionTypes = getSectionTypes();

      const attempt = attempts.find((a) => a.AttemptID === attemptId);
      if (!attempt) throw new Error("Attempt not found");

      const exam = exams.find((e) => e.ExamID === attempt.ExamID);
      if (!exam) throw new Error("Exam not found");

      const examQuestions = questions.filter((q) => q.ExamID === attempt.ExamID);
      const attemptAnswers = answers.filter((ans) => ans.AttemptID === attemptId);
      const examSections = sectionTypes.filter((s) => s.TemplateID === exam.TemplateID);

      const mappedSections = examSections.map((sec) => {
        const secQuestions = examQuestions
          .filter((q) => q.SectionTypeID === sec.SectionTypeID)
          .map((q) => {
            const ans = attemptAnswers.find((a) => a.QuestionID === q.QuestionID);
            
            return {
              questionId: q.QuestionID,
              questionNumber: parseInt(q.QuestionNumber),
              questionContent: q.QuestionContent,
              optionA: q.OptionA,
              optionB: q.OptionB,
              optionC: q.OptionC,
              optionD: q.OptionD,
              subQuestions: getSubQuestionsArray(q.SubQuestions),
              correctAnswer: q.CorrectAnswer || "",
              solution: q.Solution || "",
              difficulty: q.Difficulty || "Trung bình",
              studentAnswer: ans ? ans.StudentAnswer : "",
              studentSubAnswers: ans ? (typeof ans.SubAnswers === "string" ? JSON.parse(ans.SubAnswers) : ans.SubAnswers) : [],
              isCorrect: ans ? ans.IsCorrect : false,
              pointsEarned: ans ? parseFloat(ans.PointsEarned) : 0
            };
          });

        return {
          sectionTypeId: sec.SectionTypeID,
          sectionName: sec.SectionName,
          questionType: sec.QuestionType,
          questions: secQuestions
        };
      });

      return {
        examName: exam.ExamName,
        totalScore: parseFloat(attempt.TotalScore),
        maxScore: parseFloat(attempt.MaxScore),
        durationSeconds: parseInt(attempt.DurationSeconds),
        submitTime: attempt.SubmitTime,
        sections: mappedSections
      };
    }

    case "getStudentResultDashboard": {
      const targetStudentId = params.studentId || userSession.refId;
      const results = getResults();
      const links = getLinks();
      const files = getFiles();

      const myResults = results.filter((r) => r.StudentID === targetStudentId);
      const activeLinks = links.filter((l) => l.IsActive !== false);

      const completed = myResults.map((r) => ({
        resultId: r.ResultID,
        classId: r.ClassID,
        assignmentName: r.AssignmentName,
        sourceType: r.Source_Type,
        attemptId: r.AttemptID,
        score: parseFloat(r.Score),
        maxScore: parseFloat(r.MaxScore),
        normalizedScore: parseFloat(r.NormalizedScore),
        feedback: r.Feedback,
        recordedDate: r.RecordedDate
      }));

      // Find uncompleted assigned exams
      const completedNames = completed.map((c) => c.assignmentName);
      const uncompleted: any[] = [];

      // Find files assigned to student's classes
      const enrollments = getEnrollments();
      const studentClasses = enrollments
        .filter((e) => e.StudentID === targetStudentId)
        .map((e) => e.ClassID);

      studentClasses.forEach((cId) => {
        const classLinks = activeLinks.filter((l) => l.ClassID === cId);
        classLinks.forEach((link) => {
          const file = files.find((f) => f.FileID === link.FileID);
          if (file && file.FileType === "EXAM" && !completedNames.includes(file.FileName)) {
            uncompleted.push({
              linkId: link.LinkID,
              classId: cId,
              fileId: file.FileID,
              examId: file.ExamID,
              examName: file.FileName,
              dueDate: link.DueDate,
              maxAttempts: parseInt(link.MaxAttempts) || 3
            });
          }
        });
      });

      return {
        completedExams: completed,
        uncompletedExams: uncompleted
      };
    }

    case "getClassResultDashboard": {
      const { classId } = params;
      const enrollments = getEnrollments();
      const results = getResults();

      const classStudents = enrollments.filter((e) => e.ClassID === classId);
      const classResults = results.filter((r) => r.ClassID === classId && r.IsBestAttempt);

      // Find unique assignment names
      const assignments = Array.from(new Set(classResults.map((r) => r.AssignmentName)));

      const decliningTrendWarnings: any[] = [];
      
      classStudents.forEach((enr) => {
        const accounts = getAccounts();
        const acc = accounts.find((a) => a.RefID === enr.StudentID);
        const studentName = acc ? acc.FullName : "Học sinh " + enr.StudentID;

        const studentChronologicalResults = results
          .filter((r) => r.StudentID === enr.StudentID && r.ClassID === classId && r.IsBestAttempt)
          .sort((a, b) => a.RecordedDate.localeCompare(b.RecordedDate));

        const scores = studentChronologicalResults.map((r) => parseFloat(r.NormalizedScore) || 0);
        if (scores.length >= 3) {
          const len = scores.length;
          if (scores[len - 1] < scores[len - 2] && scores[len - 2] < scores[len - 3]) {
            decliningTrendWarnings.push({
              studentId: enr.StudentID,
              fullName: studentName,
              recentScores: [scores[len - 3], scores[len - 2], scores[len - 1]]
            });
          }
        }
      });

      const assignmentStats: Record<string, any> = {};
      assignments.forEach((asName) => {
        const asGrades = classResults
          .filter((r) => r.AssignmentName === asName && r.NormalizedScore !== null && r.NormalizedScore !== undefined && r.NormalizedScore !== "")
          .map((r) => parseFloat(r.NormalizedScore));

        if (asGrades.length > 0) {
          const min = Math.min(...asGrades);
          const max = Math.max(...asGrades);
          const sum = asGrades.reduce((a, b) => a + b, 0);
          const avg = sum / asGrades.length;

          const passCount = asGrades.filter((g) => g >= 5.0).length;
          const failCount = asGrades.length - passCount;

          assignmentStats[asName] = {
            min: Math.round(min * 10) / 10,
            max: Math.round(max * 10) / 10,
            avg: Math.round(avg * 100) / 100,
            passCount,
            failCount,
            totalCount: asGrades.length
          };
        } else {
          assignmentStats[asName] = { min: null, max: null, avg: null, passCount: 0, failCount: 0, totalCount: 0 };
        }
      });

      const pendingStudentsList: any[] = [];
      const links = getLinks();
      const files = getFiles();
      const exams = getExams();
      const attempts = getAttempts();

      const classLinks = links.filter(
        (lnk) => lnk.ClassID === classId && lnk.IsActive !== false && lnk.IsVisible !== false
      );

      classLinks.forEach((lnk) => {
        const fileObj = files.find((f) => f.FileID === lnk.FileID);
        if (fileObj && fileObj.FileType === "EXAM") {
          const exam = exams.find((e) => e.ExamID === fileObj.ExamID);
          if (!exam) return;

          classStudents.forEach((enr) => {
            const hasAttempt = attempts.some(
              (a) => a.StudentID === enr.StudentID &&
                     a.ClassID === classId &&
                     a.ExamID === exam.ExamID &&
                     a.Status === "COMPLETED"
            );

            if (!hasAttempt) {
              const accounts = getAccounts();
              const acc = accounts.find((a) => a.RefID === enr.StudentID);
              pendingStudentsList.push({
                studentId: enr.StudentID,
                fullName: acc ? acc.FullName : "Học sinh " + enr.StudentID,
                examName: exam.ExamName,
                dueDate: lnk.DueDate || ""
              });
            }
          });
        }
      });

      const studentsMatrix = classStudents.map((std) => {
        const studentGrades: Record<string, number | null> = {};
        assignments.forEach((asm) => {
          const matched = classResults.find(
            (r) => r.StudentID === std.StudentID && r.AssignmentName === asm
          );
          studentGrades[asm] = matched ? parseFloat(matched.NormalizedScore) : null;
        });

        const accounts = getAccounts();
        const acc = accounts.find((a) => a.RefID === std.StudentID);

        const studentChronologicalResults = results
          .filter((r) => r.StudentID === std.StudentID && r.ClassID === classId && r.IsBestAttempt)
          .sort((a, b) => a.RecordedDate.localeCompare(b.RecordedDate));
        const scores = studentChronologicalResults.map((r) => parseFloat(r.NormalizedScore) || 0);
        let hasDecliningTrend = false;
        if (scores.length >= 3) {
          const len = scores.length;
          if (scores[len - 1] < scores[len - 2] && scores[len - 2] < scores[len - 3]) {
            hasDecliningTrend = true;
          }
        }

        return {
          studentId: std.StudentID,
          fullName: acc ? acc.FullName : "Học sinh ẩn danh",
          grades: studentGrades,
          hasDecliningTrend
        };
      });

      return {
        assignments,
        studentsMatrix,
        decliningTrendWarnings,
        assignmentStats,
        pendingStudentsList
      };
    }

    case "getAssignmentStats": {
      const { classId, assignmentName } = params;
      const grades = getResults().filter(
        (r) => r.ClassID === classId && r.AssignmentName === assignmentName && r.IsBestAttempt
      );

      const scores = grades.map(g => parseFloat(g.NormalizedScore) || 0);
      const avgScore = scores.length > 0 ? parseFloat((scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(2)) : null;
      const maxScore = scores.length > 0 ? Math.max(...scores) : null;
      const minScore = scores.length > 0 ? Math.min(...scores) : null;
      
      const passingCount = grades.filter(g => (parseFloat(g.NormalizedScore) || 0) >= 5).length;
      const passRate = grades.length > 0 ? (passingCount / grades.length) * 100 : null;

      const distribution = [
        { ScoreGroup: "Yếu (< 5)", Count: grades.filter(g => (parseFloat(g.NormalizedScore) || 0) < 5).length },
        { ScoreGroup: "Trung Bình (5 - 6.5)", Count: grades.filter(g => (parseFloat(g.NormalizedScore) || 0) >= 5 && (parseFloat(g.NormalizedScore) || 0) < 6.5).length },
        { ScoreGroup: "Khá (6.5 - 8)", Count: grades.filter(g => (parseFloat(g.NormalizedScore) || 0) >= 6.5 && (parseFloat(g.NormalizedScore) || 0) < 8).length },
        { ScoreGroup: "Giỏi (8 - 10)", Count: grades.filter(g => (parseFloat(g.NormalizedScore) || 0) >= 8).length },
      ];

      return {
        assignmentName,
        avgScore,
        maxScore,
        minScore,
        passRate,
        distribution,
      };
    }

    case "getClassProgress": {
      const { classId } = params;
      const progress = getProgressTable();
      const classProgress = progress.filter((p) => p.ClassID === classId);
      
      // If empty, auto-seed from folders matching class grade/level/subject
      if (classProgress.length === 0) {
        const classes = getClasses();
        const clsObj = classes.find((c) => c.ClassID === classId);
        if (clsObj) {
          const folders = getFolders().filter(
            (f) => f.Grade === clsObj.Grade && f.Level === clsObj.Level && f.Subject === clsObj.Subject && f.IsActive !== false
          );
          const seeded: any[] = [];
          folders.forEach((f) => {
            const newProg = {
              ProgressID: "PRG_" + Date.now() + "_" + Math.floor(Math.random() * 1000),
              ClassID: classId,
              FolderID: f.FolderID,
              TopicName: f.FolderName,
              ProgressPercent: 0,
              Status: "Chưa dạy",
              LastUpdated: new Date().toISOString().split("T")[0]
            };
            progress.push(newProg);
            seeded.push(newProg);
          });
          if (seeded.length > 0) {
            saveProgressTable(progress);
            return seeded.map((p) => ({
              progressId: p.ProgressID,
              classId: p.ClassID,
              folderId: p.FolderID,
              topicName: p.TopicName,
              progressPercent: p.ProgressPercent,
              status: p.Status,
              lastUpdated: p.LastUpdated
            }));
          }
        }
      }

      return classProgress.map((p) => ({
        progressId: p.ProgressID,
        classId: p.ClassID,
        folderId: p.FolderID || getFolders().find(f => f.FolderName === p.TopicName)?.FolderID || "",
        topicName: p.TopicName,
        progressPercent: p.ProgressPercent,
        status: p.Status,
        lastUpdated: p.LastUpdated
      }));
    }

    case "updateClassProgress": {
      const { classId, records } = params;
      const progressList = getProgressTable();
      
      const recordMap: Record<string, any> = {};
      records.forEach((r: any) => {
        recordMap[r.progressId] = r;
      });

      const updated = progressList.map((p) => {
        if (p.ClassID === classId && recordMap[p.ProgressID]) {
          const r = recordMap[p.ProgressID];
          return {
            ...p,
            ProgressPercent: parseFloat(r.progressPercent) || 0,
            Status: r.status || "Chưa dạy",
            LastUpdated: new Date().toISOString().split("T")[0]
          };
        }
        return p;
      });

      saveProgressTable(updated);
      return { success: true };
    }

    case "addFolderToClassProgress": {
      const { classId, folderId } = params;
      const progress = getProgressTable();
      const folders = getFolders();
      
      const folder = folders.find((f) => f.FolderID === folderId);
      if (!folder) throw new Error("Folder not found");

      // Check if already in progress
      const exists = progress.some((p) => p.ClassID === classId && (p.FolderID === folderId || p.TopicName === folder.FolderName));
      if (exists) throw new Error("Chuyên đề này đã có trong lộ trình lớp học!");

      const newProg = {
        ProgressID: "PRG_" + Date.now(),
        ClassID: classId,
        FolderID: folderId,
        TopicName: folder.FolderName,
        ProgressPercent: 0,
        Status: "Chưa dạy",
        LastUpdated: new Date().toISOString().split("T")[0]
      };
      progress.push(newProg);
      saveProgressTable(progress);
      return { success: true, data: newProg };
    }

    case "removeFolderFromClassProgress": {
      const { classId, progressId } = params;
      const progress = getProgressTable();
      const updated = progress.filter((p) => !(p.ClassID === classId && p.ProgressID === progressId));
      saveProgressTable(updated);
      return { success: true };
    }

    case "submitGrade": {
      const { classId, studentId, assignmentName, grade, feedback } = params;
      const results = getResults();
      
      const teacherId = userSession.refId; // The teacher submitting the grade
      const dateStr = new Date().toISOString().split("T")[0];

      const existingIdx = results.findIndex(
        (r) => r.StudentID === studentId && r.ClassID === classId && r.AssignmentName === assignmentName && r.Source_Type === "MANUAL"
      );

      if (existingIdx !== -1) {
        results[existingIdx] = {
          ...results[existingIdx],
          Score: parseFloat(grade),
          NormalizedScore: parseFloat(grade),
          Feedback: feedback || "",
          RecordedBy: teacherId,
          RecordedDate: dateStr
        };
      } else {
        const resultId = "RES_" + Date.now();
        results.push({
          ResultID: resultId,
          StudentID: studentId,
          ClassID: classId,
          AssignmentName: assignmentName,
          Source_Type: "MANUAL",
          AttemptID: "",
          Score: parseFloat(grade),
          MaxScore: 10,
          NormalizedScore: parseFloat(grade),
          Feedback: feedback || "",
          RecordedBy: teacherId,
          RecordedDate: dateStr,
          AttemptNumber: 1,
          IsBestAttempt: true
        });
      }
      saveResults(results);
      return { success: true };
    }

    case "getStudentDashboard": {
      const studentId = userSession.refId;
      const enrollments = getEnrollments();
      const classes = getClasses();
      const results = getResults();

      // Find my class IDs
      const myClassIds = enrollments
        .filter((e) => e.StudentID === studentId)
        .map((e) => e.ClassID);

      const accounts = getAccounts();
      const teacherMap: Record<string, string> = {};
      accounts.forEach((acc) => {
        if (acc.Role === "GIAO_VIEN") {
          teacherMap[acc.RefID] = acc.FullName;
        }
      });

      const studentClasses = classes
        .filter((c) => myClassIds.includes(c.ClassID))
        .map((cls) => {
          // Calculate rank
          const classEnrollments = enrollments.filter((e) => e.ClassID === cls.ClassID);
          const studentIds = classEnrollments.map((e) => e.StudentID);
          
          const studentAverages = studentIds.map((sId) => {
            const studentGrades = results.filter((r) => r.StudentID === sId && r.ClassID === cls.ClassID);
            const sum = studentGrades.reduce((acc, curr) => acc + (parseFloat(curr.NormalizedScore) || 0), 0);
            const avg = studentGrades.length > 0 ? sum / studentGrades.length : 0;
            return { studentId: sId, avg };
          }).sort((a, b) => b.avg - a.avg);

          const myRankIndex = studentAverages.findIndex((x) => x.studentId === studentId);
          const rank = myRankIndex !== -1 ? myRankIndex + 1 : 1;

          // Progress percent
          const progressList = getProgressTable().filter((p) => p.ClassID === cls.ClassID);
          const sumProgress = progressList.reduce((acc, curr) => acc + (parseFloat(curr.ProgressPercent) || 0), 0);
          const progressPercent = progressList.length > 0 ? Math.round(sumProgress / progressList.length) : 0;

          return {
            classId: cls.ClassID,
            className: cls.ClassName,
            schedule: cls.Schedule,
            teacherName: teacherMap[cls.TeacherID] || "Chưa phân công",
            rank: rank,
            totalStudents: studentIds.length,
            progressPercent: progressPercent
          };
        });

      // Filter attendances
      const attendances = getTable<any>("DIEM_DANH", []).filter((a) => a.StudentID === studentId);
      const studentAttendances = attendances.map((att) => {
        const cls = classes.find((c) => c.ClassID === att.ClassID);
        return {
          attendanceId: att.AttendanceID,
          classId: att.ClassID,
          className: cls ? cls.ClassName : "Lớp học",
          sessionNumber: att.SessionNumber,
          date: att.Date,
          status: att.Status
        };
      });

      // Filter grades from results
      const studentGrades = results
        .filter((r) => r.StudentID === studentId)
        .map((grd) => {
          const cls = classes.find((c) => c.ClassID === grd.ClassID);
          return {
            recordId: grd.ResultID,
            classId: grd.ClassID,
            className: cls ? cls.ClassName : "Lớp học",
            assignmentName: grd.AssignmentName,
            grade: parseFloat(grd.NormalizedScore) || 0,
            feedback: grd.Feedback || ""
          };
        });

      return {
        classes: studentClasses,
        attendances: studentAttendances,
        grades: studentGrades
      };
    }

    case "getFeedbackTemplates": {
      return [
        { TemplateID: "TPL_001", Loai_Ki_Thi: "TSA", Noi_Dung_Mau: "Bài làm tốt, tư duy logic rất nhanh." },
        { TemplateID: "TPL_002", Loai_Ki_Thi: "HSA", Noi_Dung_Mau: "Nắm chắc kiến thức. Cần cẩn thận hơn." }
      ];
    }

    case "getFolders": {
      const allFolders = getFolders();
      const activeFolders = allFolders.filter((f: any) => f.IsActive === true || f.IsActive === "TRUE");
      return activeFolders.map((f: any) => ({
        folderId: f.FolderID,
        folderName: f.FolderName,
        subject: f.Subject,
        grade: f.Grade,
        level: f.Level,
        sortOrder: parseFloat(f.SortOrder) || 99,
        description: f.Description,
        createdBy: f.CreatedBy,
        createdDate: f.CreatedDate
      })).sort((a: any, b: any) => a.sortOrder - b.sortOrder);
    }

    case "getFolderFiles": {
      const { folderId } = params;
      const allFiles = getFiles();
      const folderFiles = folderId
        ? allFiles.filter((f: any) => f.FolderID === folderId)
        : allFiles;
      return folderFiles.map((f: any) => ({
        fileId: f.FileID,
        folderId: f.FolderID,
        fileName: f.FileName,
        fileType: f.FileType,
        fileUrl: f.FileURL,
        examId: f.ExamID || null,
        uploadedBy: f.UploadedBy,
        uploadedDate: f.UploadedDate,
        description: f.Description || ""
      }));
    }

    case "getClassMaterials": {
      const { classId } = params;
      const allLinks = getLinks();
      const allFiles = getFiles();
      const classLinks = classId
        ? allLinks.filter((l: any) => l.ClassID === classId)
        : allLinks;
      return classLinks.map((link: any) => {
        const file = allFiles.find((f: any) => f.FileID === link.FileID);
        const folder = file ? getFolders().find((f: any) => f.FolderID === file.FolderID) : null;
        return {
          linkId: link.LinkID,
          classId: link.ClassID,
          folderId: file ? file.FolderID : null,
          folderName: folder ? folder.FolderName : "",
          fileId: link.FileID,
          fileName: file ? file.FileName : "(File không tồn tại)",
          fileType: file ? file.FileType : "PDF",
          fileUrl: file ? file.FileURL : "",
          examId: file ? file.ExamID : null,
          dueDate: link.DueDate || "",
          maxAttempts: parseInt(link.MaxAttempts) || 3,
          isVisible: link.IsVisible !== false && link.IsVisible !== "FALSE",
          isActive: link.IsActive !== false && link.IsActive !== "FALSE",
          assignedDate: link.AssignedDate || "",
          description: file ? (file.Description || "") : ""
        };
      }).filter((m: any) => m.isActive);
    }

    case "getClassProgress": {
      const { classId } = params;
      const progressTable = getProgressTable();
      const classRecords = classId
        ? progressTable.filter((p: any) => p.ClassID === classId)
        : progressTable;
      return classRecords.map((p: any) => ({
        progressId: p.ProgressID,
        classId: p.ClassID,
        folderId: p.FolderID,
        topicName: p.TopicName,
        progressPercent: parseFloat(p.ProgressPercent) || 0,
        status: p.Status || "Chưa dạy",
        lastUpdated: p.LastUpdated || ""
      }));
    }

    case "getDriveFiles": {
      return [
        { id: "drive_pdf_01", name: "Chuyên đề khảo sát hàm số nâng cao 12.pdf", url: "https://drive.google.com/file/d/1_dummy_id_1/preview", type: "PDF" },
        { id: "drive_pdf_02", name: "Đề ôn tập giữa học kỳ 1 Toán 9.pdf", url: "https://drive.google.com/file/d/1_dummy_id_2/preview", type: "PDF" },
        { id: "drive_pdf_03", name: "Tài liệu phương trình vô tỷ luyện thi HSG.pdf", url: "https://drive.google.com/file/d/1_dummy_id_3/preview", type: "PDF" },
        { id: "drive_pdf_04", name: "Ma trận đề thi tuyển sinh lớp 10.pdf", url: "https://drive.google.com/file/d/1_dummy_id_4/preview", type: "PDF" }
      ];
    }

    default:
      throw new Error("Action not supported in local mock: " + action);
  }
}
