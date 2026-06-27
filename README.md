# UPGRID LMS - Zero-Budget Learning Management System

Hệ thống quản lý học tập (LMS) hiệu năng cao, tối ưu hóa chi phí với **Zero-Budget Architecture**. Dự án được thiết kế để cung cấp một nền tảng quản lý trung tâm giảng dạy, lớp học thêm, hoặc trường học nhỏ mà không cần tốn chi phí duy trì server hay database.

## 🎯 Mục tiêu dự án
- Cung cấp giải pháp LMS miễn phí vận hành (Zero-budget).
- Giao diện hiện đại, dễ sử dụng, tốc độ phản hồi nhanh.
- Hỗ trợ đầy đủ các nghiệp vụ cốt lõi: Quản lý lớp học, học viên, điểm danh, điểm số, học liệu và học phí/lương.

## 🏗️ Kiến trúc tổng thể

Hệ thống hoạt động theo mô hình Client-Server, sử dụng các dịch vụ miễn phí của Google:

*   **Frontend (Client):** Xây dựng bằng **Next.js (App Router)**, React, Tailwind CSS, SWR. Chịu trách nhiệm hiển thị giao diện, quản lý state (CSR), và tối ưu SEO/Tốc độ (ISR).
*   **Backend (API Server):** Sử dụng **Google Apps Script (GAS)** đóng vai trò như một RESTful API Server. Nhận các request HTTP (GET/POST) từ Frontend.
*   **Database:** Sử dụng **Google Sheets**. Mỗi Sheet đóng vai trò như một bảng (Table) trong cơ sở dữ liệu quan hệ.

**Luồng giao tiếp (Service to Service):**
`Next.js Frontend` --(HTTP GET/POST)--> `Google Apps Script API` --(Apps Script Services)--> `Google Sheets (Database)`

## 📐 Quy tắc Coding Style & Naming Convention

*   **Frontend (Next.js/React):**
    *   Sử dụng TypeScript cho toàn bộ project.
    *   Tên component: `PascalCase` (VD: `ClassCard.tsx`).
    *   Tên biến/hàm: `camelCase` (VD: `fetchData`, `studentList`).
    *   Tên file route/page: `kebab-case` hoặc theo chuẩn Next.js (VD: `page.tsx`, `layout.tsx`).
    *   Styling: Tailwind CSS utility classes.
*   **Backend (Google Apps Script):**
    *   Sử dụng JavaScript (ES5/ES6 tùy mức độ hỗ trợ của GAS).
    *   Tên hàm API handler: `camelCase` (VD: `getClasses`, `doPost`).
    *   Tên biến: `camelCase`.
*   **Database (Google Sheets):**
    *   Tên Sheet (Table): `UPPER_SNAKE_CASE` (VD: `TAI_KHOAN`, `LOP_HOC`).
    *   Tên Cột (Column): `PascalCase` (VD: `ClassID`, `FullName`).

## 💡 Các quyết định kiến trúc quan trọng (ADRs)

1.  **Zero-Budget Architecture:** Quyết định sử dụng Google Sheets + Apps Script thay vì RDBMS truyền thống (PostgreSQL/MySQL) và Node.js/Python backend để giảm hoàn toàn chi phí hosting, lý tưởng cho quy mô nhỏ đến vừa.
2.  **Next.js ISR & SWR:** Sử dụng ISR (Incremental Static Regeneration) cho các trang công khai để đạt tốc độ tải `<50ms` và giảm tải cho Apps Script quota. Sử dụng SWR cho các trang nội bộ để có trải nghiệm real-time, caching thông minh.
3.  **CORS Safe POST Requests:** Gửi POST request dưới dạng `text/plain` từ client để "lách" pre-flight OPTIONS request, giải quyết triệt để vấn đề CORS khét tiếng của Google Apps Script Web Apps.

---

## 📚 Tài liệu chi tiết

Vui lòng tham khảo các thư mục `specs/` và `modules/` để biết thêm chi tiết:

*   [API Specifications](./specs/api_spec.md)
*   [Data Models](./specs/data_models.md)
*   [Workflows](./specs/workflows.md)
*   [Frontend Module](./modules/frontend/README.md)
*   [Backend Module](./modules/backend/README.md)
