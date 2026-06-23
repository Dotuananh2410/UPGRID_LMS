import React from "react";
import { BookOpen, Calendar, User, Info, ArrowRight } from "lucide-react";
import Link from "next/link";

export const revalidate = 60; // ISR revalidate every 60s

interface PublicClass {
  classId: string;
  className: string;
  schedule: string;
  teacherId: string;
  teacherName: string;
}

// Fallback mock data if server build runs without API configured
const MOCK_CLASSES: PublicClass[] = [
  {
    classId: "CLS_01",
    className: "Toán Nâng Cao Lớp 9 - T9.1 (Demo)",
    schedule: "Thứ 3 (18:00 - 20:00) & Thứ 7 (08:00 - 10:00)",
    teacherId: "TCH_01",
    teacherName: "Cô Nguyễn Thanh Hà"
  },
  {
    classId: "CLS_02",
    className: "Luyện Thi Đại Học Khối A - A10 (Demo)",
    schedule: "Thứ 5 (19:30 - 21:30) & Chủ Nhật (14:00 - 16:00)",
    teacherId: "TCH_02",
    teacherName: "Thầy Trần Hoàng Nam"
  }
];

async function fetchPublicClasses(): Promise<PublicClass[]> {
  const apiUrl = process.env.NEXT_PUBLIC_GAS_API_URL;
  if (!apiUrl) {
    console.warn("NEXT_PUBLIC_GAS_API_URL not found during build. Using mock classes.");
    return MOCK_CLASSES;
  }

  try {
    const res = await fetch(`${apiUrl}?action=getPublicClasses`, {
      next: { revalidate: 60 },
      method: "GET"
    });
    
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    
    const json = await res.json();
    return json.success ? json.data : MOCK_CLASSES;
  } catch (err) {
    console.error("Failed to load public classes from GAS API, using fallback:", err);
    return MOCK_CLASSES;
  }
}

export default async function PublicClassesPage() {
  const classes = await fetchPublicClasses();

  return (
    <div className="flex-1 py-12 bg-neutral-50 dark:bg-neutral-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Banner Section */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-600 to-cyan-600 text-white p-8 md:p-12 shadow-xl shadow-blue-500/10 mb-12">
          <div className="relative z-10 max-w-2xl space-y-4">
            <span className="px-3 py-1 rounded-full bg-white/20 text-white text-xs font-bold tracking-wider uppercase">
              Chương trình đào tạo
            </span>
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">
              Hệ Thống Lớp Học UpGrid Academy
            </h1>
            <p className="text-lg text-blue-100 font-medium">
              Chuyên đào tạo Toán học chất lượng cao, bám sát đề thi tuyển sinh lớp 10 và luyện thi Đại học với lộ trình cá nhân hóa.
            </p>
          </div>
          <div className="absolute right-0 bottom-0 top-0 w-1/3 bg-radial-gradient opacity-15 pointer-events-none" />
        </div>

        {/* Info Box */}
        <div className="flex items-start gap-3 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-300 text-sm mb-8 font-medium">
          <Info className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">Học viên muốn đăng ký học?</p>
            <p className="mt-0.5 text-neutral-600 dark:text-neutral-400">
              Vui lòng liên hệ trực tiếp với bộ phận Tuyển sinh qua hotline **0385717738** hoặc email **tuananh24102004@gmail.com** để được xếp lớp phù hợp và cấp tài khoản học tập cá nhân.
            </p>
          </div>
        </div>

        {/* Classes Grid */}
        <div className="space-y-6">
          <div className="flex justify-between items-end border-b border-neutral-200 dark:border-neutral-800 pb-4">
            <div>
              <h2 className="text-2xl font-bold text-neutral-900 dark:text-white">
                Lớp học đang tuyển sinh
              </h2>
              <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
                (Dữ liệu được cập nhật tự động mỗi 60 giây)
              </p>
            </div>
            <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
              Tổng số: {classes.length} lớp
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {classes.map((cls) => (
              <div 
                key={cls.classId}
                className="p-6 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 hover:border-blue-500/30 dark:hover:border-blue-500/30 shadow-sm hover:shadow-md hover-lift transition-all flex flex-col justify-between"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-1 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs font-bold uppercase tracking-wider">
                      {cls.classId}
                    </span>
                  </div>

                  <h3 className="text-xl font-bold text-neutral-900 dark:text-white group-hover:text-blue-600 transition-colors">
                    {cls.className}
                  </h3>

                  <div className="space-y-2 pt-2 border-t border-neutral-100 dark:border-neutral-800/50">
                    <div className="flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400">
                      <Calendar className="w-4 h-4 text-blue-500" />
                      <span className="font-medium">Lịch học:</span> {cls.schedule}
                    </div>

                    <div className="flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400">
                      <User className="w-4 h-4 text-blue-500" />
                      <span className="font-medium">Giáo viên:</span> {cls.teacherName}
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-neutral-100 dark:border-neutral-800/50 flex justify-end">
                  <Link
                    href="/login"
                    className="flex items-center gap-1 text-sm font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                  >
                    Đăng nhập để xem chi tiết
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            ))}
          </div>

          {classes.length === 0 && (
            <div className="text-center py-16 rounded-3xl border-2 border-dashed border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
              <BookOpen className="w-12 h-12 text-neutral-400 mx-auto mb-3" />
              <p className="text-lg font-semibold text-neutral-600 dark:text-neutral-400">
                Chưa có lớp học nào khả dụng.
              </p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
