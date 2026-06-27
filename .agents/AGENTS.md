# Bộ Rule Làm Việc cho AI – Repo UPGRID_LMS

## 1. Kiến trúc & Ngữ cảnh
*   **Backend:** Google Apps Script (GAS) đóng vai trò REST API Server.
*   **Frontend:** Next.js (App Router), React, Tailwind CSS, SWR.
*   **Database:** Google Sheets (Zero-Budget Architecture).
*   **Các entity chính:** `TAI_KHOAN` (User), `LOPHOC` (Class), `HOC_VIEN` (Student), `GHI_DANH` (Enrollment), `DIEM_DANH`, `KET_QUA_HOC_TAP`, `FILE_HOC_LIEU`, `EXAM_BANK`.
*   **Quan hệ:** Bảng trung gian trên Google Sheets (VD: GHI_DANH nối TAI_KHOAN và LOPHOC).

## 2. Quy tắc nhớ lâu dài
*   Luôn giữ consistency với tài liệu `specs/api_spec.md`, `specs/data_models.md` và `specs/workflows.md`.
*   Nhớ luồng nghiệp vụ cốt lõi: Login -> Token -> Các POST request mã hóa dưới dạng `text/plain` để vượt lỗi CORS.
*   Cơ chế an toàn dữ liệu: Bắt buộc dùng `LockService.getScriptLock()` trong Backend để chống ghi đè dữ liệu đồng thời.
*   Coding style: camelCase cho JS/TS, PascalCase cho React Components, UPPER_SNAKE_CASE cho tên Sheet (Table).

## 3. Quy tắc có thể quên
*   Bugfix nhỏ, test case tạm thời (`/tests/`).
*   Script build phụ.
*   Commit message chi tiết không ảnh hưởng kiến trúc.

## 4. Quy tắc sinh code
*   Khi được yêu cầu update code, luôn sinh diff hoặc patch gọn gàng nếu file quá dài.
*   Nếu thay đổi data model trên Google Sheets, phải viết hàm migration trong `setup.gs` và update `specs/data_models.md`.
*   Nếu thêm API mới, update docs trong `specs/api_spec.md`.
*   Nếu thay đổi logic nghiệp vụ, ghi chú lại trong `specs/workflows.md`.

## 5. Quy tắc vận hành
*   Đọc ngữ cảnh: trước khi sinh code, kiểm tra file liên quan (`Code.gs` cho backend, `src/utils/api.ts` cho frontend).
*   Kiểm tra consistency: Không tự ý gọi lệnh SQL hay Node.js packages ở Backend vì Backend chạy trên môi trường Google Apps Script.
*   Ghi chú kiến trúc: Nếu có thay đổi lớn, thêm note vào `README.md` hoặc `HANDOVER.md`.

## 6. Tư duy làm việc & Phân tích yêu cầu (Analytical Workflow)
*   **Tiếp nhận yêu cầu End-User:** User thường mô tả tính năng ở góc độ trải nghiệm người dùng cuối (End-User perspective). Trợ lý AI tuyệt đối không code ngay lập tức.
*   **Tự động Break-down (Deconstruct):** AI phải tự chủ động phân rã yêu cầu thành 3 lớp:
    1.  **Database (Google Sheets):** Cần thêm bảng mới không? Cần thêm cột vào bảng hiện tại không? Có phá vỡ cấu trúc quan hệ cũ không? Nếu có, phải chuẩn bị script migration trong `setup.gs`.
    2.  **Backend API (Code.gs):** Cần tạo endpoint mới hay sửa endpoint cũ? Logic xử lý có bị đụng độ (conflict) với các tính năng khác không? Dữ liệu trả về có tối ưu chưa?
    3.  **Frontend (Next.js):** Cần cập nhật component nào? Fetch data qua SWR thế nào? Trải nghiệm người dùng (UX) có mượt mà không?
*   **Trình bày kế hoạch (Planning):** Luôn tóm tắt lại bản phân rã (Break-down) này cho User duyệt trước khi thực sự đổ code, để đảm bảo không làm "bẩn" hệ thống hiện tại.

## 7. Prompt nền (System Instructions)
Bạn là trợ lý AI cao cấp cho dự án UPGRID_LMS (Kiến trúc Zero-Budget).
- Luôn tham chiếu kiến trúc Next.js Frontend + Google Apps Script Backend + Google Sheets DB.
- Tư duy chủ động: Tự break-down yêu cầu của user thành DB -> Backend -> Frontend trước khi code để tránh conflict.
- Khi sinh code, đảm bảo consistency với API spec và 22 bảng data models.
- Nếu thay đổi kiến trúc hoặc API, update tài liệu specs tương ứng.
- Tuyệt đối không sinh code Node.js/Express cho Backend.
