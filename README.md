# UPGRID LMS - Zero-Budget Learning Management System

Hệ thống quản lý học tập (LMS) hiệu năng cao, tối ưu hóa chi phí với **Zero-Budget Architecture** sử dụng Google Sheets làm CSDL, Google Apps Script (GAS) làm RESTful API, và Next.js App Router (Tailwind CSS, SWR, KaTeX) cho giao diện người dùng.

---

## 🛠️ Hướng dẫn cài đặt hệ thống

### Bước 1: Thiết lập Google Sheets (Database)
1. Truy cập [Google Sheets](https://sheets.google.com) và tạo một bảng tính (Spreadsheet) mới. đặt tên là `LMS UPGRID Database`.
2. Trên thanh menu, chọn **Tiện ích mở rộng** (Extensions) > **Apps Script**.
3. Xóa toàn bộ mã mặc định trong tệp `Mã.gs` (hoặc `Code.gs`) và dán toàn bộ nội dung của tệp [backend/setup.gs](file:///c:/Users/ADMN/.gemini/antigravity-ide/scratch/lms-upgrid/backend/setup.gs) vào.
4. Chọn hàm `setupDatabase` trong danh sách dropdown và nhấn **Chạy** (Run). Bạn sẽ cần cấp quyền truy cập bảng tính cho script ở lần chạy đầu tiên.
5. Sau khi script chạy xong, quay lại bảng tính để kiểm tra: 6 sheet dữ liệu (`TAI_KHOAN`, `LOPHOC`, `HOC_VIEN`, `GHI_DANH`, `DIEM_DANH`, `DIEM_SO`) đã được tạo tự động kèm dữ liệu mẫu.

### Bước 2: Deploy Backend API (Google Apps Script)
1. Vẫn tại giao diện biên dịch Google Apps Script ở Bước 1, nhấn biểu tượng dấu **+** ở mục Tệp và tạo một tệp Script mới đặt tên là `Code` (nó sẽ có tên đầy đủ là `Code.gs`).
2. Copy toàn bộ mã nguồn của tệp [backend/Code.gs](file:///c:/Users/ADMN/.gemini/antigravity-ide/scratch/lms-upgrid/backend/Code.gs) dán vào thay thế nội dung tệp vừa tạo.
3. Nhấp vào nút **Triển khai** (Deploy) ở góc trên bên phải > chọn **Triển khai mới** (New deployment).
4. Ở phần chọn loại triển khai (bánh răng cấu hình), chọn **Ứng dụng web** (Web App):
   - **Mô tả:** `UPGRID LMS API v1`
   - **Thực thi dưới dạng:** **Tôi** (Me - email của bạn)
   - **Ai có quyền truy cập:** **Mọi người** (Anyone - Điều này cực kỳ quan trọng để API có thể gọi từ bên ngoài).
5. Nhấn **Triển khai** (Deploy). Copy chuỗi **URL ứng dụng web** (Web app URL) được cấp ở cuối quá trình triển khai (dạng `https://script.google.com/macros/s/.../exec`).

### Bước 3: Cấu hình Next.js Frontend
1. Mở thư mục dự án `lms-upgrid`.
2. Tạo tệp `.env.local` ở thư mục gốc của dự án.
3. Dán URL Web App bạn vừa copy ở Bước 2 vào tệp cấu hình:
   ```env
   NEXT_PUBLIC_GAS_API_URL=https://script.google.com/macros/s/DÁN_URL_WEB_APP_CỦA_BẠN_VÀO_ĐÂY/exec
   ```
4. Cài đặt các gói phụ thuộc và khởi chạy máy chủ thử nghiệm:
   ```bash
   npm install
   npm run dev
   ```
5. Truy cập [http://localhost:3000](http://localhost:3000) để trải nghiệm hệ thống.

---

## 🔑 Tài khoản kiểm thử hệ thống

Sử dụng các tài khoản mẫu sau để đăng nhập trải nghiệm các phân quyền khác nhau:

| Vai trò | Email | Mật khẩu mẫu | Các tính năng chính |
| :--- | :--- | :--- | :--- |
| **Quản trị viên (ADMIN)** | `admin@upgrid.edu.vn` | `123456789` | Thêm học viên/giáo viên mới, tạo lớp học, xếp lớp học viên |
| **Giáo viên (GIAO_VIEN)** | `teacher.ha@upgrid.edu.vn` | `teacher123` | Quản lý điểm danh hàng loạt, nhập điểm và phản hồi (có live LaTeX) |
| **Học viên (HOC_VIEN)** | `student.an@upgrid.edu.vn` | `student123` | Xem lịch học, chuyên cần cá nhân, xem điểm & nhận xét công thức toán |

---

## 📐 Cách viết công thức Toán học (LaTeX)

Khi giáo viên chấm điểm hoặc gửi nhận xét, hệ thống hỗ trợ trình bày công thức toán học chuyên nghiệp bằng **KaTeX**:
- **Inline Math (Công thức cùng hàng):** Bao quanh công thức bằng 1 ký hiệu đô-la `$`. 
  - *Ví dụ:* `Giải phương trình $x^2 - 4 = 0$` sẽ hiển thị phương trình toán học gọn gàng.
- **Block Math (Công thức dạng khối độc lập):** Bao quanh bằng 2 ký hiệu đô-la `$$`.
  - *Ví dụ:* `Ta có biểu thức tích phân: $$\int_{0}^{\pi} \sin(x) dx = 2$$` sẽ căn giữa công thức và phóng to.

---

## ⚡ Chiến lược tối ưu tốc độ và Caching

1. **Trang công khai (`/classes`):** Áp dụng **ISR (Incremental Static Regeneration)** của Next.js với `revalidate = 60`. Next.js sẽ dựng sẵn trang tĩnh ở phía máy chủ. Khi có lượt truy cập, phản hồi tức thì dưới `<50ms` mà không cần chờ gọi API từ Google Sheets. Bảng danh sách lớp học tự động revalidate lại ngầm mỗi 60 giây.
2. **Trang nghiệp vụ (`/admin`, `/teacher`, `/student`):** Sử dụng **CSR (Client-side Rendering)** kết hợp với thư viện `SWR` để quản lý state và bộ nhớ đệm (cache cache). Trang hiển thị **Skeleton Loading** lập tức, sau đó SWR gửi request và tự động ghi đè dữ liệu mới, đem lại trải nghiệm mượt mà không bị giật lag.
3. **CORS Safe requests:** Các POST request gửi đến Google Apps Script được client mã hóa dưới dạng `text/plain` để bỏ qua bước kiểm tra pre-flight CORS OPTIONS phức tạp của trình duyệt, giải quyết dứt điểm lỗi CORS thường gặp với Apps Script Web App.
