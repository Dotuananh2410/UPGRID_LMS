import React from "react";
import Link from "next/link";
import { BookOpen, ShieldCheck, Sparkles, UserCheck, CalendarDays, BarChart3, HelpCircle } from "lucide-react";

export default function Home() {
  return (
    <div className="flex-1 flex flex-col bg-neutral-50 dark:bg-neutral-950">
      
      {/* Hero Section */}
      <section className="relative py-20 lg:py-28 overflow-hidden bg-gradient-to-tr from-blue-500/5 via-neutral-50 to-cyan-500/5 dark:from-blue-950/10 dark:via-neutral-950 dark:to-cyan-950/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8 relative z-10">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs font-bold uppercase tracking-wider mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            Học Viện Toán Học Chất Lượng Cao
          </div>
          
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight max-w-4xl mx-auto leading-tight">
            Nâng Tầm Tư Duy Cùng{" "}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-cyan-500 dark:from-blue-400 dark:to-cyan-300">
              UpGrid Academy
            </span>
          </h1>
          
          <p className="text-xl text-neutral-600 dark:text-neutral-300 max-w-2xl mx-auto font-semibold italic">
            &ldquo;Up your skill - Build our future&rdquo;
          </p>

          <p className="text-lg text-neutral-500 dark:text-neutral-400 max-w-2xl mx-auto font-medium">
            Nền tảng hỗ trợ học tập trực tuyến dành riêng cho học sinh UPGRID. Cập nhật kết quả rèn luyện học tập tức thì, hỗ trợ đắc lực cho phụ huynh và thầy cô.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link
              href="/login"
              className="w-full sm:w-auto px-8 py-4 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-bold text-base shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 transition-all hover-lift"
            >
              Đăng Nhập Cổng Học Viên
            </Link>
            <Link
              href="/classes"
              className="w-full sm:w-auto px-8 py-4 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800/80 font-bold text-base shadow-sm hover:shadow transition-all hover-lift"
            >
              Danh Sách Lớp Học
            </Link>
          </div>
        </div>

        {/* Decorative background shapes */}
        <div className="absolute top-1/2 left-1/4 -translate-y-1/2 -translate-x-1/2 w-[350px] h-[350px] rounded-full bg-blue-400/10 blur-[80px] pointer-events-none" />
        <div className="absolute top-1/2 right-1/4 -translate-y-1/2 translate-x-1/2 w-[350px] h-[350px] rounded-full bg-cyan-400/10 blur-[80px] pointer-events-none" />
      </section>

      {/* Features Grid Section */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        <div className="text-center space-y-3">
          <h2 className="text-3xl font-extrabold text-neutral-900 dark:text-white tracking-tight">
            Nền Tảng Hỗ Trợ Học Tập Học Viên
          </h2>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 max-w-lg mx-auto font-semibold">
            Đồng hành cùng sự tiến bộ vượt bậc của học sinh qua từng buổi học.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Feature 1 */}
          <div className="p-6 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 space-y-4 shadow-sm hover:shadow-md transition-all hover-lift">
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <CalendarDays className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-neutral-900 dark:text-white">Thời Khóa Biểu & Lịch Học</h3>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed font-medium">
              Theo dõi lịch học cố định và các ca học tăng cường dễ dàng trực tiếp trên dashboard của học viên.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="p-6 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 space-y-4 shadow-sm hover:shadow-md transition-all hover-lift">
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <BarChart3 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-neutral-900 dark:text-white">Bảng Điểm & Nhận Xét Toán</h3>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed font-medium">
              Kết quả kiểm tra định kỳ được chấm và cập nhật kèm các hướng dẫn giải, nhận xét trực quan bằng công thức toán học chuyên sâu.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="p-6 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 space-y-4 shadow-sm hover:shadow-md transition-all hover-lift">
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <UserCheck className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-neutral-900 dark:text-white">Quản Lý Chuyên Cần</h3>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed font-medium">
              Báo cáo chuyên cần minh bạch của từng học sinh, ghi nhận tình hình đi học của từng ca giúp phụ huynh luôn sát cánh cùng con.
            </p>
          </div>
        </div>
      </section>

      {/* 3 Steps Section */}
      <section className="py-16 bg-neutral-100 dark:bg-neutral-900/40 border-y border-neutral-200 dark:border-neutral-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-neutral-900 dark:text-white">Lộ Trình Đồng Hành Học Tập</h2>
            <p className="text-xs text-neutral-500 mt-1 uppercase tracking-wider font-extrabold">3 bước để bắt đầu tại UpGrid Academy</p>
          </div>

          <div className="flex flex-col md:flex-row justify-center items-stretch gap-6">
            <div className="flex-1 p-6 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm flex flex-col items-center text-center space-y-3">
              <span className="w-8 h-8 rounded-full bg-blue-500 text-white font-bold flex items-center justify-center text-sm shadow-md">1</span>
              <h4 className="font-bold text-neutral-950 dark:text-white text-sm">Đăng Ký & Nhận Tài Khoản</h4>
              <p className="text-xs text-neutral-500 font-medium">Phụ huynh liên hệ bộ phận Tuyển sinh để ghi danh vào các lớp học phù hợp và nhận tài khoản định danh cá nhân.</p>
            </div>
            <div className="flex-1 p-6 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm flex flex-col items-center text-center space-y-3">
              <span className="w-8 h-8 rounded-full bg-blue-500 text-white font-bold flex items-center justify-center text-sm shadow-md">2</span>
              <h4 className="font-bold text-neutral-950 dark:text-white text-sm">Tham Gia Khóa Học</h4>
              <p className="text-xs text-neutral-500 font-medium">Học viên tham gia các buổi học tương tác cao, hoàn thành đầy đủ các bài tập rèn luyện tư duy định kỳ trên lớp.</p>
            </div>
            <div className="flex-1 p-6 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm flex flex-col items-center text-center space-y-3">
              <span className="w-8 h-8 rounded-full bg-blue-500 text-white font-bold flex items-center justify-center text-sm shadow-md">3</span>
              <h4 className="font-bold text-neutral-950 dark:text-white text-sm">Theo Dõi Sự Tiến Bộ</h4>
              <p className="text-xs text-neutral-500 font-medium">Phụ huynh và học viên đăng nhập để xem báo cáo điểm số, chuyên cần và phản hồi giải toán chi tiết từ thầy cô.</p>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
