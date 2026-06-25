"use client";

import React, { useState, useEffect, Suspense } from "react";
import useSWR from "swr";
import { requestGas } from "@/utils/apiClient";
import { Class, ClassDetails, AttendanceRecord, Student } from "@/types/lms";
import { useAuth } from "@/context/AuthContext";
import { useRouter, useSearchParams } from "next/navigation";
import { 
  Loader2, FileText, Code, FileSpreadsheet, Terminal, Database
} from "lucide-react";

import TeacherAttendance from "@/components/TeacherAttendance";
import TeacherGrades from "@/components/TeacherGrades";
import TeacherTraining from "@/components/TeacherTraining";

const EMPTY_ARRAY: any[] = [];

type PanelState = 
  | "attendance_overview" 
  | "attendance_take" 
  | "attendance_matrix"
  | "progress"
  | "grades_entry"
  | "grades_matrix"
  | "grades_history";

function TeacherPageContent() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Redirect if not GIAO_VIEN or ADMIN
  useEffect(() => {
    if (user && user.role !== "GIAO_VIEN" && user.role !== "ADMIN") {
      router.push("/student");
    }
  }, [user, router]);

  // States
  const [initialStudentId, setInitialStudentId] = useState<string>("");

  // 1. Fetch Teacher Classes
  const { data: classes = EMPTY_ARRAY, error: errCls } = useSWR(
    "getClasses",
    () => requestGas<Class[]>("getClasses")
  );

  // Sync parameters with URL search query
  const selectedClassId = searchParams.get("classId") || classes[0]?.classId || "";
  const activePanel = (searchParams.get("panel") as PanelState) || "attendance_overview";

  // Current month for income SWR
  const currentMonthStr = new Date().toLocaleDateString("sv-SE").substring(0, 7);
  const { data: payroll, isLoading: loadingPayroll } = useSWR(
    user ? `getTeacherPayroll/${user.refId}/${currentMonthStr}` : null,
    () => requestGas<any>("getTeacherPayroll", {
      method: "GET",
      body: { teacherId: user?.refId, month: currentMonthStr }
    })
  );

  // 2. Fetch Class Details (Students list)
  const { 
    data: classDetails, 
    mutate: mutateDetails 
  } = useSWR(
    selectedClassId ? `getClassDetails/${selectedClassId}` : null,
    () => requestGas<ClassDetails>("getClassDetails", { method: "GET", body: { classId: selectedClassId } })
  );

  // 3. Fetch Class Attendance Logs (For reference / sessions check)
  const { 
    data: attendanceLogs = EMPTY_ARRAY, 
    mutate: mutateAttendanceLogs 
  } = useSWR(
    selectedClassId ? `getClassAttendance/${selectedClassId}` : null,
    () => requestGas<AttendanceRecord[]>("getClassAttendance", { method: "GET", body: { classId: selectedClassId } })
  );

  // 4. Fetch Class Grades Data
  const { 
    data: classGrades = EMPTY_ARRAY, 
    mutate: mutateGrades 
  } = useSWR(
    selectedClassId ? `getClassGrades/${selectedClassId}` : null,
    () => requestGas<any[]>("getClassGrades", { body: { classId: selectedClassId } })
  );

  // 5. Fetch Class Grades Dashboard Metrics
  const { data: classDashboard } = useSWR(
    selectedClassId ? `getClassResultDashboard/${selectedClassId}` : null,
    () => requestGas<any>("getClassResultDashboard", { body: { classId: selectedClassId } })
  );

  // Filter students to active ones only (excluding leave/withdrawn)
  const activeStudents = classDetails?.students?.filter(std => std.status === "Đang học" || !std.status) || [];

  if (user && user.role !== "GIAO_VIEN" && user.role !== "ADMIN") {
    return null;
  }

  const loading = !errCls && classes.length === 0;

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center py-20 bg-neutral-50 dark:bg-neutral-950">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
        <p className="mt-4 text-sm font-bold text-neutral-500 font-sans">Đang đồng bộ dữ liệu lớp học giáo viên...</p>
      </div>
    );
  }

  // Active Class reference object
  const activeClassObj = classes.find(c => c.classId === selectedClassId) || null;

  // Stats calculation
  const totalSessionsTaught = Array.from(new Set(attendanceLogs.map(log => log.sessionNumber))).length;
  
  let avgAttendanceRate = 100;
  if (attendanceLogs.length > 0) {
    const presentCount = attendanceLogs.filter(log => log.status === "P").length;
    avgAttendanceRate = Math.round((presentCount / attendanceLogs.length) * 100);
  }

  let avgClassGrade = 0;
  if (classGrades.length > 0) {
    const sum = classGrades.reduce((acc, curr) => acc + curr.grade, 0);
    avgClassGrade = Math.round((sum / classGrades.length) * 10) / 10;
  }

  const overallProgressPercent = activeClassObj?.progress || 0;

  // Cross-panel link from attendance table student "Vào điểm" action
  const handleEnterGrading = (studentId: string) => {
    setInitialStudentId(studentId);
    router.push(`/teacher?classId=${selectedClassId}&panel=grades_entry`);
  };

  return (
    <div className="flex-1 flex flex-col justify-between min-w-0 bg-white dark:bg-neutral-950">

      {/* ACTIVE PANEL ELEMENT */}
      <div className="flex-1 p-6 overflow-y-auto">
        {classDetails ? (
          <div className="animate-fade-in">
            
            {/* 1. ATTENDANCE SUB-PANELS */}
            {(activePanel === "attendance_overview" || 
              activePanel === "attendance_take" || 
              activePanel === "attendance_matrix") && (
              <TeacherAttendance
                classId={selectedClassId}
                activeStudents={activeStudents}
                attendanceLogs={attendanceLogs}
                payroll={payroll}
                loadingPayroll={loadingPayroll}
                mutateAttendanceLogs={mutateAttendanceLogs}
                activeClass={activeClassObj}
                avgAttendanceRate={avgAttendanceRate}
                totalSessionsTaught={totalSessionsTaught}
                avgClassGrade={avgClassGrade}
                overallProgressPercent={overallProgressPercent}
                activePanel={activePanel}
                onEnterGrading={handleEnterGrading}
              />
            )}

            {/* 2. CURRICULUM TRAINING PANEL */}
            {activePanel === "progress" && (
              <TeacherTraining
                classId={selectedClassId}
                teacherId={user?.refId || ""}
                activeClass={activeClassObj}
              />
            )}

            {/* 3. GRADES SUB-PANELS */}
            {(activePanel === "grades_entry" || 
              activePanel === "grades_matrix" || 
              activePanel === "grades_history") && (
              <TeacherGrades
                classId={selectedClassId}
                activeStudents={activeStudents}
                classGrades={classGrades}
                classDashboard={classDashboard}
                mutateGrades={mutateGrades}
                activePanel={activePanel}
                initialStudentId={initialStudentId}
                onClearInitialStudentId={() => setInitialStudentId("")}
              />
            )}

          </div>
        ) : (
          <div className="py-20 text-center flex flex-col items-center justify-center space-y-3">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            <p className="text-xs font-bold text-neutral-450 font-sans">Đang đồng bộ cấu hình danh sách học viên...</p>
          </div>
        )}
      </div>

    </div>
  );
}

export default function TeacherPage() {
  return (
    <Suspense fallback={
      <div className="flex-1 flex flex-col items-center justify-center py-20 bg-neutral-50 dark:bg-neutral-950">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
        <p className="mt-4 text-sm font-bold text-neutral-500 font-sans">Đang tải workspace...</p>
      </div>
    }>
      <TeacherPageContent />
    </Suspense>
  );
}
