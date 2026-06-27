# Workflows Specification

Tài liệu này mô tả các luồng nghiệp vụ (Business Workflows) chính trong hệ thống LMS UPGRID. Bao gồm cả các phân hệ quản lý điểm danh, thu học phí, giao bài tập và thi trắc nghiệm.

---

## 1. Luồng Xác thực & Đăng nhập (Authentication)
**Actors:** Bất kỳ người dùng nào (Admin, Giáo viên, Học viên).

1. **Người dùng** nhập Email và Mật khẩu trên màn hình đăng nhập (Next.js).
2. **Frontend** gửi trực tiếp (dạng text/plain) POST request lên API `login`.
3. **Backend (GAS)** nhận request, đối chiếu Email trong sheet `TAI_KHOAN`. Băm (hash) mật khẩu và so sánh với `PasswordHash`.
4. Nếu khớp, Backend sinh ra một Token chứa thông tin `RefID` và `Role`, mã hóa Base64 và gửi về cho Frontend.
5. **Frontend** lưu Token và điều hướng người dùng đến Dashboard tương ứng.

---

## 2. Luồng Quản lý Lớp học & Ghi danh (Class & Enrollment)
**Actors:** Quản trị viên (Admin).

1. **Tạo Lớp:** Admin vào trang Quản lý lớp, điền form tạo lớp mới (Tên, Khối, Môn, Giáo viên phụ trách, Học phí buổi). Frontend gọi POST `createClass`.
2. **Thêm Học viên mới:** Admin tạo tài khoản học viên mới. Backend tự động thêm vào sheet `TAI_KHOAN` và `HOC_VIEN`.
3. **Xếp lớp (Ghi danh):** Admin chọn một lớp học, tiến hành "Ghi danh" học viên vào lớp. Backend tạo row mới trong `GHI_DANH`.

---

## 3. Luồng Điểm danh & Tiến độ bài giảng (Attendance & Progress)
**Actors:** Giáo viên, Học viên.

1. Sau mỗi buổi học, **Giáo viên** vào tab "Điểm danh" của lớp.
2. **Giáo viên** tick điểm danh cho học viên (Có mặt / Vắng phép / Vắng K.P) và nhấn lưu (`approveAttendanceBatch`).
3. Backend ghi nhận dữ liệu vào `DIEM_DANH`, cập nhật `Trang_Thai_Thanh_Toan` mặc định là "Chưa thanh toán".
4. Đồng thời, giáo viên có thể cập nhật Tiến độ dạy học so với khung chương trình (`TIEN_DO_LOP_HOC`), báo cáo đã dạy xong Chủ đề nào.

---

## 4. Luồng Chấm Điểm Thủ Công (Manual Grading)
**Actors:** Giáo viên, Học viên.

1. **Giáo viên** vào tab "Bảng Điểm", chọn "Thêm cột điểm mới".
2. Giáo viên nhập điểm (0-10) và Nhận xét (Hỗ trợ **KaTeX**). Có thể chọn nhanh nhận xét từ `FEEDBACK_TEMPLATE`.
3. Gửi POST `saveGrades`. Backend lưu vào bảng `KET_QUA_HOC_TAP` với `Source_Type = "MANUAL"`.
4. **Học viên** đăng nhập để xem bảng điểm và nhận xét với công thức Toán học được render sắc nét.

---

## 5. Luồng Quản lý Tài chính (Billing & Payroll)
**Actors:** Admin / Quản sinh.

1. Cuối tháng, Quản sinh mở Dashboard Tài chính. Backend lấy toàn bộ `DIEM_DANH` "Có mặt" hoặc "Vắng K.P" của học viên chưa thanh toán, nhân với đơn giá lớp (`Hoc_Phi_Theo_Buoi`) để tính tổng nợ.
2. Học viên nộp tiền: Quản sinh click "Thu tiền" trên UI, frontend gọi API `recordTransaction` (Loại: "THU").
3. Tương tự cho lương Giáo viên, hệ thống đếm số buổi dạy và tính lương (`Luong_Theo_Buoi`), Quản sinh duyệt chi lương và gọi API `disburseTeacherSalary`. Tất cả luồng tiền lưu vào `LICH_SU_GIAO_DICH`.

---

## 6. Luồng Giao Học Liệu / Bài Thi (Material & Exam Assignment)
**Actors:** Admin / Giáo viên.

1. Giáo viên upload file PDF hoặc tạo đề thi trắc nghiệm lưu vào kho `FILE_HOC_LIEU` hoặc `EXAM_BANK`.
2. Để học sinh trong lớp thấy được, giáo viên thực hiện lệnh "Giao tài liệu" (Assign) vào một lớp cụ thể.
3. Backend tạo một bản ghi trong `CLASS_MATERIAL_LINK` (Chứa `DueDate`, `MaxAttempts`, `IsVisible`).
4. Khi học viên mở dashboard của lớp, API `getClassMaterials` sẽ join bảng này để lấy danh sách bài tập được giao.

---

## 7. Luồng Thi Trắc Nghiệm Tự Động (Auto-grading Exam Attempts)
**Actors:** Học viên.

1. Học viên nhấn "Làm bài" trên một bài thi đã được giao (`LinkID`).
2. Frontend gọi API khởi tạo `EXAM_ATTEMPT` (Lưu `StartTime`).
3. Học viên trả lời các câu hỏi.
4. Khi học viên nhấn "Nộp bài", Frontend gọi API gửi danh sách lựa chọn lên Backend.
5. Backend ghi nhận `SubmitTime`, duyệt mảng kết quả lưu vào `EXAM_ANSWER`, chấm điểm tự động bằng cách so khớp với `EXAM_QUESTION`, và tính ra `TotalScore`.
6. Backend lưu kết quả cuối cùng sang `KET_QUA_HOC_TAP` với `Source_Type = "SYSTEM"`. Học sinh nhận điểm ngay lập tức.
