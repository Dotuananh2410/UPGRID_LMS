# Backend Module (Google Apps Script)

Thư mục `backend/` chứa mã nguồn Google Apps Script (GAS). File này sẽ được copy và triển khai dưới dạng Web App trên môi trường của Google.

## Cấu trúc file
Dự án có 2 file script chính:

### 1. `Code.gs`
Đây là "trái tim" của API server. Chứa toàn bộ logic xử lý request HTTP từ client.
- `doGet(e)`: Hàm router chính để bắt các GET request. Điều hướng logic dựa vào tham số `action`.
- `doPost(e)`: Hàm router để bắt các POST request. Vì giới hạn CORS, client gửi data dạng chuỗi JSON thô (text/plain).
- Các hàm nghiệp vụ: `loginUser`, `getClasses`, `approveAttendanceBatch`, `recordTransaction`, v.v. Tất cả đều giao tiếp với API của Google Spreadsheet (`SpreadsheetApp`).

### 2. `setup.gs`
Script dùng một lần (hoặc khi nâng cấp version) để khởi tạo cấu trúc CSDL.
- Tạo các Sheets cần thiết.
- Sinh dữ liệu mẫu (Seed Data) để test.
- Chạy các hàm Migration để thêm cột/bảng mới mà không làm mất dữ liệu hiện tại (VD: `patchClassMaterialLinkSchema`).

## Xử lý Concurrency (Đồng thời)
Vì Google Sheets có thể gặp lỗi ghi đè dữ liệu khi có nhiều người thao tác cùng lúc (ví dụ nhiều giáo viên cùng điểm danh 1 lúc).
Backend UPGRID sử dụng `LockService.getScriptLock()` bên trong `doPost` để đưa các lệnh ghi vào hàng đợi (queue), đảm bảo tính toàn vẹn dữ liệu.

## Bảo mật (Security)
- Token-based: Mọi request vào dữ liệu nhạy cảm đều phải mang theo chuỗi `token`.
- Token chứa thông tin đã mã hóa, server sẽ parse (giải mã) token này để biết `Role` và `RefID` của người gửi request, từ đó xác định quyền truy cập (Authorization).
