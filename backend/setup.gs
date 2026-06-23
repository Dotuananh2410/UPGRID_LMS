/**
 * UPGRID LMS - DATABASE INITIALIZATION SCRIPT
 * Run this script once in Google Apps Script editor to initialize the Spreadsheet database structure.
 */

function setupDatabase() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // Define sheets and their headers
  var schema = {
    "TAI_KHOAN": ["RefID", "Email", "PasswordHash", "Role", "FullName"],
    "LOPHOC": ["ClassID", "ClassName", "Schedule", "TeacherID"],
    "HOC_VIEN": ["StudentID", "FullName", "ParentEmail", "ParentPhone"],
    "GHI_DANH": ["EnrollmentID", "ClassID", "StudentID"],
    "DIEM_DANH": ["AttendanceID", "ClassID", "StudentID", "SessionNumber", "Date", "Status"],
    "DIEM_SO": ["RecordID", "ClassID", "StudentID", "AssignmentName", "Grade", "Feedback"]
  };
  
  for (var sheetName in schema) {
    var sheet = ss.getSheetByName(sheetName);
    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
    }
    // Clear and set headers
    sheet.clear();
    var headers = schema[sheetName];
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight("bold").setBackground("#f3f4f6");
    sheet.setFrozenRows(1);
  }
  
  // Seed demo data
  seedDemoData(ss);
  
  Logger.log("Database initialized successfully!");
}

function seedDemoData(ss) {
  // Helper to hash password using SHA-256 (equivalent to backend code)
  function hashPassword(password) {
    var rawHash = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, password, Utilities.Charset.UTF_8);
    var hex = "";
    for (var i = 0; i < rawHash.length; i++) {
      var byteValue = rawHash[i];
      if (byteValue < 0) byteValue += 256;
      var byteString = byteValue.toString(16);
      if (byteString.length == 1) byteString = "0" + byteString;
      hex += byteString;
    }
    return hex;
  }
  
  var accountsSheet = ss.getSheetByName("TAI_KHOAN");
  // Check if we already have accounts
  if (accountsSheet.getLastRow() > 1) {
    Logger.log("Seed data already present. Skipping...");
    return;
  }
  
  var adminPass = hashPassword("admin123");
  var teacherPass = hashPassword("teacher123");
  var studentPass = hashPassword("student123");
  
  // Add accounts: RefID, Email, PasswordHash, Role, FullName
  var accounts = [
    ["ADMIN_01", "admin@upgrid.edu.vn", adminPass, "ADMIN", "Nguyễn Văn Admin"],
    ["TCH_01", "teacher.ha@upgrid.edu.vn", teacherPass, "GIAO_VIEN", "Cô Nguyễn Thanh Hà"],
    ["TCH_02", "teacher.nam@upgrid.edu.vn", teacherPass, "GIAO_VIEN", "Thầy Trần Hoàng Nam"],
    ["STD_01", "student.an@upgrid.edu.vn", studentPass, "HOC_VIEN", "Nguyễn Bình An"],
    ["STD_02", "student.binh@upgrid.edu.vn", studentPass, "HOC_VIEN", "Lê Gia Bình"],
    ["STD_03", "student.chi@upgrid.edu.vn", studentPass, "HOC_VIEN", "Phạm Minh Chi"]
  ];
  
  accountsSheet.getRange(2, 1, accounts.length, accounts[0].length).setValues(accounts);
  
  // Add classes: ClassID, ClassName, Schedule, TeacherID
  var classesSheet = ss.getSheetByName("LOPHOC");
  var classes = [
    ["CLS_01", "Toán Nâng Cao Lớp 9 - T9.1", "Thứ 3 (18:00 - 20:00) & Thứ 7 (08:00 - 10:00)", "TCH_01"],
    ["CLS_02", "Luyện Thi Đại Học Khối A - A10", "Thứ 5 (19:30 - 21:30) & Chủ Nhật (14:00 - 16:00)", "TCH_02"]
  ];
  classesSheet.getRange(2, 1, classes.length, classes[0].length).setValues(classes);
  
  // Add student profiles: StudentID, FullName, ParentEmail, ParentPhone
  var studentsSheet = ss.getSheetByName("HOC_VIEN");
  var students = [
    ["STD_01", "Nguyễn Bình An", "parent.an@gmail.com", "0901234567"],
    ["STD_02", "Lê Gia Bình", "parent.binh@gmail.com", "0907654321"],
    ["STD_03", "Phạm Minh Chi", "parent.chi@gmail.com", "0911223344"]
  ];
  studentsSheet.getRange(2, 1, students.length, students[0].length).setValues(students);
  
  // Add enrollments: EnrollmentID, ClassID, StudentID
  var enrollmentsSheet = ss.getSheetByName("GHI_DANH");
  var enrollments = [
    ["ENR_01", "CLS_01", "STD_01"],
    ["ENR_02", "CLS_01", "STD_02"],
    ["ENR_03", "CLS_02", "STD_02"],
    ["ENR_04", "CLS_02", "STD_03"]
  ];
  enrollmentsSheet.getRange(2, 1, enrollments.length, enrollments[0].length).setValues(enrollments);
  
  // Add initial attendances: AttendanceID, ClassID, StudentID, SessionNumber, Date, Status
  var attendanceSheet = ss.getSheetByName("DIEM_DANH");
  var attendance = [
    ["ATT_01", "CLS_01", "STD_01", 1, "2026-06-20", "P"],
    ["ATT_02", "CLS_01", "STD_02", 1, "2026-06-20", "P"],
    ["ATT_03", "CLS_01", "STD_01", 2, "2026-06-23", "P"],
    ["ATT_04", "CLS_01", "STD_02", 2, "2026-06-23", "V"] // V: Vắng, P: Có mặt
  ];
  attendanceSheet.getRange(2, 1, attendance.length, attendance[0].length).setValues(attendance);
  
  // Add initial grades: RecordID, ClassID, StudentID, AssignmentName, Grade, Feedback
  var gradesSheet = ss.getSheetByName("DIEM_SO");
  var grades = [
    ["GRD_01", "CLS_01", "STD_01", "Kiểm tra Đại số số 1", 9.5, "Rất tốt. Xem xét lại bài 4: $\\int_{0}^{1} x^2 dx = \\left. \\frac{x^3}{3} \\right|_{0}^{1} = \\frac{1}{3}$ trình bày sạch sẽ."],
    ["GRD_02", "CLS_01", "STD_02", "Kiểm tra Đại số số 1", 8.0, "Khá tốt. Cần chú ý rút gọn biểu thức chứa căn thức thức tế: $A = \\sqrt{2} + \\sqrt{8} = 3\\sqrt{2}$."],
    ["GRD_03", "CLS_02", "STD_02", "Khảo sát Hình học giải tích", 7.5, "Nắm chắc phương pháp tọa độ Oxy. Công thức khoảng cách cần ghi nhớ: $d(M, \\Delta) = \\frac{|Ax_0 + By_0 + C|}{\\sqrt{A^2 + B^2}}$."],
    ["GRD_04", "CLS_02", "STD_03", "Khảo sát Hình học giải tích", 9.0, "Tuyệt vời! Giải toán hình không gian bằng vector $V = \\frac{1}{6}|(\\vec{u} \\times \\vec{v}) \\cdot \\vec{w}|$ rất sáng tạo."]
  ];
  gradesSheet.getRange(2, 1, grades.length, grades[0].length).setValues(grades);
}
