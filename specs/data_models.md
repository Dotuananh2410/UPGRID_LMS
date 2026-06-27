# Data Models Specification

Hệ thống LMS UPGRID sử dụng Google Sheets như một cơ sở dữ liệu quan hệ (RDBMS) không máy chủ (Serverless). Mỗi Sheet đại diện cho một bảng (Table) và hàng đầu tiên của mỗi Sheet là các trường (Columns).

Hệ thống bao gồm **22 Bảng (Entities)** chia làm các phân hệ chính sau.

---

## 1. Phân hệ Quản lý Cốt lõi (Core Management)

### 1.1 TAI_KHOAN (Accounts)
Quản lý thông tin đăng nhập, mật khẩu và phân quyền hệ thống.
*   **Columns:** `RefID` (PK), `Email` (Unique), `PasswordHash`, `Role` (Enum), `FullName`.

### 1.2 LOPHOC (Classes)
Thông tin các lớp học đang mở, giáo viên phụ trách, học phí và lịch học.
*   **Columns:** `ClassID` (PK), `ClassName`, `Schedule`, `TeacherID` (FK), `Grade`, `Level`, `Subject`, `Hoc_Phi_Theo_Buoi`.

### 1.3 HOC_VIEN (Students)
Hồ sơ học viên và thông tin liên hệ phụ huynh.
*   **Columns:** `StudentID` (PK), `FullName`, `ParentEmail`, `ParentPhone`.

### 1.4 GHI_DANH (Enrollments)
Bảng trung gian (N-N) nối Học viên vào Lớp học. Quản lý trạng thái học và công nợ của học viên tại lớp.
*   **Columns:** `EnrollmentID` (PK), `ClassID` (FK), `StudentID` (FK), `Trang_Thai_Hoc`, `Hoc_Phi_Con_No`, `Han_Dong_Hoc_Phi`.

### 1.5 DANH_SACH_GIAO_VIEN (Teachers)
Thông tin bổ sung của giáo viên (Mức lương, chuyên môn).
*   **Columns:** `TeacherID` (PK), `FullName`, `Luong_Theo_Buoi`.

---

## 2. Phân hệ Học tập & Chuyên cần (Learning & Attendance)

### 2.1 DIEM_DANH (Attendances)
Lưu trữ trạng thái điểm danh từng buổi của từng học viên. Dữ liệu này dùng để tính học phí và lương.
*   **Columns:** `AttendanceID` (PK), `ClassID`, `StudentID`, `SessionNumber`, `Date`, `Status` (Có mặt/Vắng), `Trang_Thai_Duyet`, `Trang_Thai_Thanh_Toan`.

### 2.2 KET_QUA_HOC_TAP (Academic Results)
*(Bản nâng cấp thay thế cho DIEM_SO cũ)*. Quản lý điểm số từ cả các bài kiểm tra thủ công (Manual) và bài thi trắc nghiệm trực tuyến (System).
*   **Columns:** `ResultID` (PK), `StudentID`, `ClassID`, `AssignmentName`, `Source_Type` (MANUAL/SYSTEM), `AttemptID`, `Score`, `MaxScore`, `NormalizedScore`, `Feedback`, `RecordedBy`, `RecordedDate`, `AttemptNumber`, `IsBestAttempt`.

### 2.3 KHUNG_CHUONG_TRINH (Curriculum)
Định nghĩa sẵn các khung chương trình giảng dạy, các chủ đề theo khối và cấp độ.
*   **Columns:** `ProgramID` (PK), `Grade`, `Level`, `Subject`, `TopicName`, `TopicOrder`.

### 2.4 TIEN_DO_LOP_HOC (Class Progress)
Theo dõi tiến độ giảng dạy thực tế của một lớp so với `KHUNG_CHUONG_TRINH`.
*   **Columns:** `ProgressID` (PK), `ClassID` (FK), `TopicName`, `ProgressPercent`, `Status`, `LastUpdated`.

---

## 3. Phân hệ Tài chính (Finance)

### 3.1 LICH_SU_GIAO_DICH (Transactions History)
Lưu lại toàn bộ luồng tiền thu/chi trong hệ thống (Học phí, Trả lương, ...).
*   **Columns:** `GiaoDichID` (PK), `StudentID`, `ClassID`, `SoTien`, `Loai` (THU/CHI), `NgayGiaoDich`, `NguoiThu`.

---

## 4. Phân hệ Học liệu (Materials Management)

### 4.1 FOLDER_CHUYEN_DE (Folders)
Thư mục gốc chứa tài liệu, phân loại theo môn học, khối lớp.
*   **Columns:** `FolderID` (PK), `FolderName`, `Subject`, `Grade`, `Level`, `SortOrder`, `Description`, `CreatedBy`, `CreatedDate`, `IsActive`.

### 4.2 FILE_HOC_LIEU (Files)
Tài liệu tĩnh (PDF, Word, Video) được tải lên và liên kết bằng link Google Drive, hoặc liên kết với ExamID.
*   **Columns:** `FileID` (PK), `FolderID` (FK), `FileName`, `FileType`, `FileURL`, `ExamID` (FK-Optional), `UploadedBy`, `UploadedDate`, `Description`, `IsGlobal`.

### 4.3 CLASS_MATERIAL_LINK (Material Assignments)
Bảng trung gian để giao tài liệu / bài kiểm tra từ Kho lưu trữ xuống cụ thể một lớp học (Tương đương việc "Assign Material" trên Google Classroom).
*   **Columns:** `LinkID` (PK), `ClassID` (FK), `FileID` (FK), `AssignedBy`, `AssignedDate`, `DueDate`, `IsVisible`, `SortOrder`, `MaxAttempts`, `IsActive`, `TopicName`.

---

## 5. Phân hệ Ngân hàng Câu hỏi & Thi cử (Exam Bank & Testing)

### 5.1 EXAM_TEMPLATE (Exam Templates)
Mẫu cấu trúc đề thi (Ví dụ: Đề đánh giá năng lực ĐHQG, Đề giữa kỳ môn Toán).
*   **Columns:** `TemplateID` (PK), `TemplateName`, `Subject`, `Grade`, `TotalDuration`, `MaxScore`, `Description`, `CreatedBy`.

### 5.2 EXAM_SECTION_TYPE (Exam Sections)
Các phần trong một cấu trúc đề thi (Phần 1: Trắc nghiệm, Phần 2: Điền khuyết).
*   **Columns:** `SectionTypeID` (PK), `TemplateID` (FK), `SectionName`, `QuestionType`, `QuestionCount`, `PointsPerQuestion`, `PointsPerSubQuestion`, `SortOrder`, `AIParsePrompt`.

### 5.3 EXAM_BANK (Exams)
Tập hợp một bài thi cụ thể.
*   **Columns:** `ExamID` (PK), `TemplateID` (FK), `ExamName`, `Subject`, `Grade`, `DurationMinutes`, `TotalPoints`, `CreatedBy`, `CreatedDate`, `Status`, `ShuffleQuestions`, `ShuffleOptions`.

### 5.4 EXAM_QUESTION (Questions)
Nội dung từng câu hỏi trắc nghiệm / điền khuyết thuộc đề thi. Hỗ trợ câu hỏi chùm (SubQuestions) dưới dạng JSON.
*   **Columns:** `QuestionID` (PK), `ExamID` (FK), `SectionTypeID`, `QuestionNumber`, `QuestionContent`, `OptionA`, `OptionB`, `OptionC`, `OptionD`, `SubQuestions`, `CorrectAnswer`, `Solution`, `Difficulty`.

### 5.5 EXAM_ATTEMPT (Exam Attempts)
Lượt làm bài của học viên. Theo dõi thời gian bắt đầu, nộp bài, tính điểm tự động.
*   **Columns:** `AttemptID` (PK), `StudentID` (FK), `ExamID` (FK), `ClassID`, `LinkID`, `StartTime`, `SubmitTime`, `DurationSeconds`, `Status`, `TotalScore`, `MaxScore`, `AttemptNumber`, `QuestionOrder`.

### 5.6 EXAM_ANSWER (Exam Answers)
Chi tiết từng câu trả lời của học viên trong một `Attempt`.
*   **Columns:** `AnswerID` (PK), `AttemptID` (FK), `QuestionID`, `StudentAnswer`, `SubAnswers`, `IsCorrect`, `PointsEarned`.

---

## 6. Phân hệ Tiện ích (Utilities)

### 6.1 FEEDBACK_TEMPLATE (Feedback Templates)
Các mẫu nhận xét lưu sẵn để giáo viên chấm điểm nhanh hơn.
*   **Columns:** `TemplateID` (PK), `Loai_Ki_Thi`, `Noi_Dung_Mau`.

### 6.2 GOP_Y_HOC_VIEN (Student Feedback)
Phản hồi đánh giá giáo viên / khóa học từ phía học viên.
*   **Columns:** `FeedbackID` (PK), `StudentID`, `ClassID`, `TeacherRating`, `TeacherComment`, `Suggestion`, `Date`.
