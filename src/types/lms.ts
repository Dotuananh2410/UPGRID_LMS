export type Role = "ADMIN" | "GIAO_VIEN" | "HOC_VIEN" | "QUAN_SINH";

export interface User {
  refId: string;
  email: string;
  role: Role;
  fullName: string;
}

export interface UserSession {
  token: string;
  user: User;
}

export interface Class {
  classId: string;
  className: string;
  schedule: string;
  teacherId: string;
  teacherName: string;
  grade?: string;
  level?: string;
  subject?: string;
  progressPercent?: number;
  tuitionFee?: number;
}

export interface Student {
  studentId: string;
  fullName: string;
  email: string;
  parentEmail?: string;
  parentPhone?: string;
  status?: string;
  debt?: number;
}

export interface Teacher {
  teacherId: string;
  fullName: string;
  email: string;
}

export interface ClassDetails extends Class {
  students: Student[];
}

export interface AttendanceRecord {
  attendanceId?: string;
  classId: string;
  studentId: string;
  sessionNumber: number;
  date: string;
  status: "P" | "V"; // P: Present (Có mặt), V: Absent (Vắng)
}

export interface GradeRecord {
  recordId?: string;
  classId: string;
  className?: string;
  studentId: string;
  assignmentName: string;
  grade: number;
  feedback: string;
}

export interface StudentDashboard {
  classes: {
    classId: string;
    className: string;
    schedule: string;
    teacherName: string;
    rank?: number;
    totalStudents?: number;
    progressPercent?: number;
  }[];
  attendances: {
    attendanceId: string;
    classId: string;
    className: string;
    sessionNumber: number;
    date: string;
    status: "P" | "V";
  }[];
  grades: {
    recordId: string;
    classId: string;
    className: string;
    assignmentName: string;
    grade: number;
    feedback: string;
  }[];
}

export interface Transaction {
  transactionId: string;
  studentId: string;
  classId: string;
  amount: number;
  type: "Thu" | "Hoàn" | "Chuyển";
  date: string;
  cashierId: string;
}

export interface StudentDebtBreakdown {
  classId: string;
  className: string;
  sessionsCount: number;
  rate: number;
  totalCharged: number;
  totalPaid: number;
  classDebt: number;
  status: string;
  dueDate: string;
}

export interface StudentDebt {
  studentId: string;
  fullName: string; // Add helper field for rendering
  totalDebt: number;
  breakdown: StudentDebtBreakdown[];
}

export interface TeacherPayroll {
  teacherId: string;
  fullName?: string;
  month: string;
  approvedCount: number;
  pendingCount: number;
  rejectedCount: number;
  paidCount: number;
  approvedSalary: number;
  pendingSalary: number;
  paidSalary: number;
  totalSessions: number;
  sessions?: any[];
}

export interface PendingApproval {
  classId: string;
  className: string;
  sessionNumber: number;
  date: string;
  teacherName: string;
  studentCount: number;
}

export interface FeedbackTemplate {
  templateId: string;
  loaiKiThi: string;
  noiDungMau: string;
}
