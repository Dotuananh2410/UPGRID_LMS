# API Specifications

Hệ thống cung cấp một REST-like API thông qua Google Apps Script Web App. 
Tất cả các requests đều gọi đến duy nhất một endpoint URL (Web App URL) với các tham số khác nhau.

## Base URL
`https://script.google.com/macros/s/{DEPLOYMENT_ID}/exec`

## Authentication
Hệ thống sử dụng cơ chế Token-based authentication tự xây dựng (Simple Bearer-like Token).
Token được tạo ra sau khi đăng nhập thành công và chứa thông tin user được mã hóa base64.
Trong các request yêu cầu xác thực, gửi `token` trong query parameter (GET) hoặc body (POST).

---

## 1. GET Requests (Đọc dữ liệu)
Được sử dụng để truy xuất thông tin từ hệ thống. Các tham số được truyền qua URL query string.

### 1.1 Lấy danh sách lớp học công khai
*   **Action:** `getPublicClasses`
*   **Auth:** Không yêu cầu
*   **Query Params:** `?action=getPublicClasses`
*   **Response:**
    ```json
    {
      "success": true,
      "data": [
        {
          "ClassID": "CLS_01",
          "ClassName": "Toán Nâng Cao",
          "TeacherName": "Cô Hà",
          "Schedule": "Thứ 3 & 7",
          "Grade": "Lớp 9"
        }
      ]
    }
    ```

### 1.2 Lấy chi tiết lớp học (Yêu cầu xác thực)
*   **Action:** `getClassDetails`
*   **Auth:** Có (Cần `token`)
*   **Query Params:** `?action=getClassDetails&classId=CLS_01&token=USER_TOKEN`
*   **Response:**
    ```json
    {
      "success": true,
      "data": {
        "classInfo": { "ClassID": "CLS_01", "ClassName": "..." },
        "students": [...],
        "attendance": [...]
      }
    }
    ```

---

## 2. POST Requests (Ghi/Sửa/Xóa dữ liệu)
Do giới hạn CORS của trình duyệt với GAS, tất cả POST requests được gửi dưới dạng chuỗi JSON `text/plain`.

### 2.1 Đăng nhập
*   **Action:** `login`
*   **Auth:** Không yêu cầu
*   **Request Body (JSON stringified):**
    ```json
    {
      "action": "login",
      "email": "student@upgrid.edu.vn",
      "password": "password123"
    }
    ```
*   **Response:**
    ```json
    {
      "success": true,
      "token": "base64_encoded_token_string",
      "user": {
        "refId": "STD_01",
        "email": "student@upgrid.edu.vn",
        "role": "HOC_VIEN",
        "fullName": "Nguyễn Bình An"
      }
    }
    ```

### 2.2 Điểm danh hàng loạt (Admin/Teacher)
*   **Action:** `approveAttendanceBatch`
*   **Auth:** Có (Yêu cầu Token Admin hoặc Teacher)
*   **Request Body:**
    ```json
    {
      "action": "approveAttendanceBatch",
      "token": "ADMIN_TOKEN",
      "classId": "CLS_01",
      "sessionNumber": 5,
      "status": "Có mặt"
    }
    ```
*   **Response:**
    ```json
    {
      "success": true,
      "message": "Đã duyệt điểm danh cho buổi 5 thành công."
    }
    ```

### 2.3 Ghi nhận giao dịch đóng học phí
*   **Action:** `recordTransaction`
*   **Auth:** Có (Chỉ Admin/Quản sinh)
*   **Request Body:**
    ```json
    {
      "action": "recordTransaction",
      "token": "ADMIN_TOKEN",
      "type": "THU",
      "amount": 1000000,
      "studentId": "STD_01",
      "classId": "CLS_01",
      "note": "Đóng học phí tháng 6"
    }
    ```
*   **Response:**
    ```json
    {
      "success": true,
      "transactionId": "TXN_123456"
    }
    ```

## Xử lý lỗi (Error Handling)
Tất cả các API đều trả về HTTP Status 200, nhưng trạng thái thực sự nằm trong field `success` của JSON.
Ví dụ một response lỗi:
```json
{
  "success": false,
  "error": "Unauthorized: Invalid or expired token"
}
```
