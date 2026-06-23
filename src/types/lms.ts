export type Role = "ADMIN" | "GIAO_VIEN" | "HOC_VIEN";

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
}

export interface Student {
  studentId: string;
  fullName: string;
  email: string;
  parentEmail?: string;
  parentPhone?: string;
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
