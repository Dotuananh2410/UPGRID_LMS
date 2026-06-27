# Tài liệu Bàn giao & Triển khai Hệ thống LMS UPGRID (Handover Guide)

Tài liệu này đóng vai trò như một cẩm nang toàn diện dành cho Maintainers (đội ngũ duy trì) hoặc Kỹ sư tiếp nhận dự án, nhằm hiểu rõ cấu trúc, cách triển khai từ con số không, cũng như phương pháp xử lý sự cố.

---

## 1. Tổng quan Hệ thống (System Overview)

LMS UPGRID sử dụng kiến trúc **Zero-Budget Serverless**:
- **Cơ sở dữ liệu (Database):** Google Sheets (Hoàn toàn miễn phí, lưu trữ dạng Table 2D).
- **Backend (API Server):** Google Apps Script (GAS). Nhận request HTTP GET/POST và giao tiếp với Google Sheets thông qua bộ thư viện `SpreadsheetApp`.
- **Frontend (Client):** Next.js App Router (React). Được thiết kế theo chuẩn CSR cho dashboard và ISR cho trang public nhằm tối ưu tốc độ.

Lợi ích: KHÔNG tốn chi phí thuê VPS, KHÔNG tốn tiền duy trì Database (như AWS RDS hay MongoDB Atlas), rất thích hợp cho các trung tâm quy mô vừa và nhỏ.

---

## 2. Hướng dẫn Triển khai từ đầu (Deployment Guide)

Nếu bạn cần setup một bản clone hoàn toàn mới cho môi trường Production, hãy làm theo các bước sau:

### Bước 2.1: Khởi tạo Database (Google Sheets)
1. Truy cập Google Drive bằng tài khoản Admin (Email của trung tâm).
2. Tạo một Google Sheets mới, đặt tên `LMS Database`.
3. Vào **Tiện ích mở rộng (Extensions) -> Apps Script**.
4. Dán toàn bộ nội dung của file `backend/setup.gs` vào.
5. Chọn hàm `setupDatabase` và nhấn **Run** (Chạy). Chấp nhận các quyền truy cập được yêu cầu.
6. Khi chạy xong, 22 Sheets cấu trúc sẽ được tự động tạo kèm theo một ít dữ liệu mẫu.

### Bước 2.2: Triển khai Backend API
1. Trong màn hình Apps Script, tạo thêm 1 file là `Code.gs`. Dán toàn bộ code của file `backend/Code.gs` vào.
2. Nhấn nút **Deploy (Triển khai) -> New Deployment (Triển khai mới)**.
3. Chọn loại: **Web App**.
   - Cấu hình: *Execute as: Me*, *Who has access: Anyone*.
   - **Quan trọng:** Phải chọn *Anyone* thì frontend mới gọi API được mà không bị chặn đăng nhập Google.
4. Nhấn Deploy, copy cái **Web App URL** trả về (Bắt đầu bằng `https://script.google.com/macros/s/.../exec`).

### Bước 2.3: Triển khai Frontend
1. Clone mã nguồn frontend (`src/`, `package.json`, `next.config.js`...).
2. Tạo file `.env.local` ở thư mục gốc:
   ```env
   NEXT_PUBLIC_GAS_API_URL=[DÁN_WEB_APP_URL_VÀO_ĐÂY]
   ```
3. Chạy test dưới local: `npm install` và `npm run dev`.
4. **Deploy lên Vercel/Netlify:** Đẩy code lên GitHub, kết nối với Vercel. Nhớ nạp biến môi trường `NEXT_PUBLIC_GAS_API_URL` vào phần Setting của Vercel trước khi Build.

---

## 3. Quy trình Bảo trì & Nâng cấp (Maintenance)

### Thay đổi cấu trúc Database (Schema Migration)
Vì Google Sheets không có lệnh `ALTER TABLE`, mọi thay đổi (thêm cột, thêm bảng) đều phải làm thông qua Apps Script để đảm bảo dữ liệu không bị lệch.
**Quy trình chuẩn:**
1. Mở file `setup.gs`.
2. Viết một hàm migration mới (Ví dụ: `upgradeDatabaseSchemaV3()`). Hàm này sẽ dùng code đọc mảng Header, tìm xem cột mới đã tồn tại chưa, nếu chưa thì `lastCol++` và `setValue()` tên cột mới.
3. Chạy hàm thủ công một lần. Tuyệt đối không chèn cột bằng tay trên UI Google Sheets vì rất dễ gây sai lệch logic các cột (Các hàm trong Code.gs có thể đang đọc data theo index cột).

### Reset mật khẩu Admin
Nếu quên mật khẩu, vào `setup.gs`, tìm hàm `changeAdminPassword()` và nhấn Run. Hàm này sẽ set toàn bộ tài khoản có email `admin@upgrid.edu.vn` về mật khẩu mặc định là `123456789`.

---

## 4. Xử lý sự cố thường gặp (Troubleshooting)

### 4.1. Lỗi CORS (Cross-Origin Resource Sharing)
**Triệu chứng:** Màn hình trắng, console báo lỗi "Blocked by CORS policy... Preflight request failed".
**Nguyên nhân:** Apps Script không hỗ trợ trả về Header báo CORS đúng chuẩn cho các lệnh POST có chứa `Content-Type: application/json`.
**Cách fix:** Đã được fix trong source code frontend bằng cách ép kiểu gửi POST request dưới dạng `text/plain`. Khi debug, nếu bạn gọi API qua Postman, nhớ chỉnh Body format về `text/plain` và bỏ qua header JSON.

### 4.2. Lỗi quá tải Quota Google (Google Quota Limit)
**Triệu chứng:** API trả về lỗi 500 hoặc báo "Service invoked too many times".
**Nguyên nhân:** Apps Script giới hạn số lần gọi hàm/ngày (~20,000 lượt với tài khoản thường, ~100,000 với Google Workspace).
**Cách khắc phục:** 
- Frontend phải giữ nguyên cơ chế Caching với `SWR`. Đừng tắt bộ nhớ đệm. 
- Mua gói Google Workspace (Google App for Business) để tăng Quota lên mức doanh nghiệp.

### 4.3. Dữ liệu ghi đè lên nhau (Concurrency Bug)
**Triệu chứng:** Hai giáo viên cùng lưu điểm danh cho 1 lớp, nhưng chỉ 1 dữ liệu được ghi nhận.
**Nguyên nhân:** Race condition khi đọc/ghi file trên Drive.
**Đã fix tại:** Trong `Code.gs` ở hàm `doPost`, hệ thống luôn bọc lệnh xử lý bằng `LockService.getScriptLock().waitLock(30000)`. Nếu bị lỗi này tái diễn, hãy kiểm tra xem LockService có đang hoạt động tốt trên các hàm API mới không.

---

## 5. Cấu trúc Mã nguồn Tham khảo
*   `backend/Code.gs`: Nơi tra cứu xem API này làm gì, gọi lệnh nào.
*   `backend/setup.gs`: Nơi tra cứu Cấu trúc dữ liệu (Tên cột).
*   `src/app/`: Layout và Logic các trang giao diện.
*   `src/utils/api.ts`: Helper bọc lại hàm fetch HTTP cho Frontend, cấu hình Header tự động và nhúng Token.
