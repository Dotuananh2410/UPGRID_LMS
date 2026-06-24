/**
 * UPGRID LMS - DATABASE INITIALIZATION SCRIPT
 * Run this script once in Google Apps Script editor to initialize the Spreadsheet database structure.
 */

function setupDatabase() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // Define sheets and their headers
  var schema = {
    "TAI_KHOAN": ["RefID", "Email", "PasswordHash", "Role", "FullName"],
    "LOPHOC": ["ClassID", "ClassName", "Schedule", "TeacherID", "Grade", "Level", "Subject", "Hoc_Phi_Theo_Buoi"],
    "HOC_VIEN": ["StudentID", "FullName", "ParentEmail", "ParentPhone"],
    "GHI_DANH": ["EnrollmentID", "ClassID", "StudentID", "Trang_Thai_Hoc", "Hoc_Phi_Con_No", "Han_Dong_Hoc_Phi"],
    "DIEM_DANH": ["AttendanceID", "ClassID", "StudentID", "SessionNumber", "Date", "Status", "Trang_Thai_Duyet", "Trang_Thai_Thanh_Toan"],
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
  
  // Run database upgrades automatically
  upgradeDatabaseSchema();
  
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
  
  var adminPass = hashPassword("123456789");
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

function upgradeDatabaseSchema() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // 1. Update GHI_DANH sheet (append missing columns)
  var ghiDanhSheet = ss.getSheetByName("GHI_DANH");
  if (ghiDanhSheet) {
    var lastCol = ghiDanhSheet.getLastColumn();
    var headers = ghiDanhSheet.getRange(1, 1, 1, lastCol).getValues()[0];
    
    // Missing columns to add
    var columnsToAdd = ["Trang_Thai_Hoc", "Hoc_Phi_Con_No", "Han_Dong_Hoc_Phi"];
    columnsToAdd.forEach(function(col) {
      if (headers.indexOf(col) === -1) {
        lastCol++;
        ghiDanhSheet.getRange(1, lastCol).setValue(col).setFontWeight("bold").setBackground("#f3f4f6");
        // Backfill existing rows with defaults
        var lastRow = ghiDanhSheet.getLastRow();
        if (lastRow > 1) {
          var defaultVal = "";
          if (col === "Trang_Thai_Hoc") defaultVal = "Đang học";
          else if (col === "Hoc_Phi_Con_No") defaultVal = 0;
          else if (col === "Han_Dong_Hoc_Phi") defaultVal = "2026-07-01";
          
          var fillRange = ghiDanhSheet.getRange(2, lastCol, lastRow - 1, 1);
          var fillValues = [];
          for (var r = 2; r <= lastRow; r++) {
            fillValues.push([defaultVal]);
          }
          fillRange.setValues(fillValues);
        }
      }
    });
  }
  
  // 2. Update DIEM_DANH sheet (append Trang_Thai_Duyet)
  var diemDanhSheet = ss.getSheetByName("DIEM_DANH");
  if (diemDanhSheet) {
    var lastCol = diemDanhSheet.getLastColumn();
    var headers = diemDanhSheet.getRange(1, 1, 1, lastCol).getValues()[0];
    if (headers.indexOf("Trang_Thai_Duyet") === -1) {
      lastCol++;
      diemDanhSheet.getRange(1, lastCol).setValue("Trang_Thai_Duyet").setFontWeight("bold").setBackground("#f3f4f6");
      var lastRow = diemDanhSheet.getLastRow();
      if (lastRow > 1) {
        var fillRange = diemDanhSheet.getRange(2, lastCol, lastRow - 1, 1);
        var fillValues = [];
        for (var r = 2; r <= lastRow; r++) {
          fillValues.push(["Đã duyệt"]);
        }
        fillRange.setValues(fillValues);
      }
    }
  }
  
  // 3. Create LICH_SU_GIAO_DICH sheet
  var gichDichSheet = ss.getSheetByName("LICH_SU_GIAO_DICH");
  if (!gichDichSheet) {
    gichDichSheet = ss.insertSheet("LICH_SU_GIAO_DICH");
    var headers = ["GiaoDichID", "StudentID", "ClassID", "SoTien", "Loai", "NgayGiaoDich", "NguoiThu"];
    gichDichSheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    gichDichSheet.getRange(1, 1, 1, headers.length).setFontWeight("bold").setBackground("#f3f4f6");
    gichDichSheet.setFrozenRows(1);
  }
  
  // 4. Create DANH_SACH_GIAO_VIEN sheet and seed teachers
  var teacherSheet = ss.getSheetByName("DANH_SACH_GIAO_VIEN");
  if (!teacherSheet) {
    teacherSheet = ss.insertSheet("DANH_SACH_GIAO_VIEN");
    var headers = ["TeacherID", "FullName", "Luong_Theo_Buoi"];
    teacherSheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    teacherSheet.getRange(1, 1, 1, headers.length).setFontWeight("bold").setBackground("#f3f4f6");
    teacherSheet.setFrozenRows(1);
    
    // Seed existing teachers
    var demoTeachers = [
      ["TCH_01", "Cô Nguyễn Thanh Hà", 500000],
      ["TCH_02", "Thầy Trần Hoàng Nam", 600000]
    ];
    teacherSheet.getRange(2, 1, demoTeachers.length, demoTeachers[0].length).setValues(demoTeachers);
  }
  
  // 5. Create FEEDBACK_TEMPLATE sheet and seed templates
  var templateSheet = ss.getSheetByName("FEEDBACK_TEMPLATE");
  if (!templateSheet) {
    templateSheet = ss.insertSheet("FEEDBACK_TEMPLATE");
    var headers = ["TemplateID", "Loai_Ki_Thi", "Noi_Dung_Mau"];
    templateSheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    templateSheet.getRange(1, 1, 1, headers.length).setFontWeight("bold").setBackground("#f3f4f6");
    templateSheet.setFrozenRows(1);
    
    var demoTemplates = [
      ["TPL_001", "TSA", "Bài làm tốt, tư duy logic rất nhanh. Chú ý cách lập luận bài toán đếm ở câu 3."],
      ["TPL_002", "HSA", "Nắm chắc phương pháp tọa độ Oxy. Tuy nhiên cần nhớ công thức tính nhanh khoảng cách: $d(M, \\Delta) = \\frac{|Ax_0 + By_0 + C|}{\\sqrt{A^2 + B^2}}$."],
      ["TPL_003", "THPTQG", "Kỹ năng tính đạo hàm và khảo sát hàm số rất chắc chắn. Cần lưu ý điều kiện cực trị của hàm hợp để tránh bẫy."]
    ];
    templateSheet.getRange(2, 1, demoTemplates.length, demoTemplates[0].length).setValues(demoTemplates);
  }

  // 6. Update LOPHOC sheet to add Grade, Level, Subject
  var lophocSheet = ss.getSheetByName("LOPHOC");
  if (lophocSheet) {
    var lastCol = lophocSheet.getLastColumn();
    var headers = lophocSheet.getRange(1, 1, 1, lastCol).getValues()[0];
    var columnsToAdd = ["Grade", "Level", "Subject"];
    columnsToAdd.forEach(function(col) {
      if (headers.indexOf(col) === -1) {
        lastCol++;
        lophocSheet.getRange(1, lastCol).setValue(col).setFontWeight("bold").setBackground("#f3f4f6");
        var lastRow = lophocSheet.getLastRow();
        if (lastRow > 1) {
          var defaultVal = "";
          if (col === "Grade") defaultVal = "Lớp 9";
          else if (col === "Level") defaultVal = "Cơ bản";
          else if (col === "Subject") defaultVal = "Toán";
          
          var fillRange = lophocSheet.getRange(2, lastCol, lastRow - 1, 1);
          var fillValues = [];
          for (var r = 2; r <= lastRow; r++) {
            fillValues.push([defaultVal]);
          }
          fillRange.setValues(fillValues);
        }
      }
    });
  }
  
  // 7. Create KHUNG_CHUONG_TRINH sheet and seed demo curriculum
  var programSheet = ss.getSheetByName("KHUNG_CHUONG_TRINH");
  if (!programSheet) {
    programSheet = ss.insertSheet("KHUNG_CHUONG_TRINH");
    var headers = ["ProgramID", "Grade", "Level", "Subject", "TopicName", "TopicOrder"];
    programSheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    programSheet.getRange(1, 1, 1, headers.length).setFontWeight("bold").setBackground("#f3f4f6");
    programSheet.setFrozenRows(1);
    
    var demoTopics = [
      ["PG_001", "Lớp 9", "Chuyên", "Toán", "Chủ đề 1: Biến đổi biểu thức chứa căn bậc hai, căn bậc ba nâng cao", 1],
      ["PG_002", "Lớp 9", "Chuyên", "Toán", "Chủ đề 2: Phương trình bậc hai & Định lý Vi-ét nâng cao (ứng dụng số học)", 2],
      ["PG_003", "Lớp 9", "Chuyên", "Toán", "Chủ đề 3: Hệ phương trình đối xứng loại I, II và hệ đẳng cấp", 3],
      ["PG_004", "Lớp 9", "Chuyên", "Toán", "Chủ đề 4: Phương trình vô tỷ (đặt ẩn phụ, đánh giá, liên hợp)", 4],
      ["PG_005", "Lớp 9", "Chuyên", "Toán", "Chủ đề 5: Hệ thức lượng & Tỉ số lượng giác trong tam giác nâng cao", 5],
      ["PG_006", "Lớp 9", "Chuyên", "Toán", "Chủ đề 6: Cát tuyến, tiếp tuyến & Tứ giác nội tiếp đường tròn", 6],
      ["PG_007", "Lớp 9", "Chuyên", "Toán", "Chủ đề 7: Đường thẳng Euler, đường tròn Simson & các điểm đặc biệt", 7],
      ["PG_008", "Lớp 9", "Chuyên", "Toán", "Chủ đề 8: Bất đẳng thức Cauchy (AM-GM) & kỹ thuật chọn điểm rơi", 8],
      ["PG_009", "Lớp 9", "Chuyên", "Toán", "Chủ đề 9: Bất đẳng thức Cauchy-Schwarz (Bunyakovsky) dạng phân thức", 9],
      ["PG_010", "Lớp 9", "Chuyên", "Toán", "Chủ đề 10: Tổ hợp, nguyên lý Dirichlet & phương trình nghiệm nguyên", 10],
      
      ["PG_011", "Lớp 9", "Cơ bản", "Toán", "Chủ đề 1: Căn bậc hai, căn bậc ba & biến đổi căn thức cơ bản", 1],
      ["PG_012", "Lớp 9", "Cơ bản", "Toán", "Chủ đề 2: Hàm số bậc nhất y = ax + b & đồ thị", 2],
      ["PG_013", "Lớp 9", "Cơ bản", "Toán", "Chủ đề 3: Hệ hai phương trình bậc nhất hai ẩn", 3],
      ["PG_014", "Lớp 9", "Cơ bản", "Toán", "Chủ đề 4: Phương trình bậc hai một ẩn & công thức nghiệm", 4],
      ["PG_015", "Lớp 9", "Cơ bản", "Toán", "Chủ đề 5: Hệ thức lượng trong tam giác vuông cơ bản", 5],
      ["PG_016", "Lớp 9", "Cơ bản", "Toán", "Chủ đề 6: Góc với đường tròn, góc nội tiếp, góc tạo bởi tiếp tuyến", 6]
    ];
    programSheet.getRange(2, 1, demoTopics.length, demoTopics[0].length).setValues(demoTopics);
  }
  
  // 8. Create TIEN_DO_LOP_HOC sheet and seed initial progress entries
  var progressSheet = ss.getSheetByName("TIEN_DO_LOP_HOC");
  if (!progressSheet) {
    progressSheet = ss.insertSheet("TIEN_DO_LOP_HOC");
    var headers = ["ProgressID", "ClassID", "TopicName", "ProgressPercent", "Status", "LastUpdated"];
    progressSheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    progressSheet.getRange(1, 1, 1, headers.length).setFontWeight("bold").setBackground("#f3f4f6");
    progressSheet.setFrozenRows(1);
    
    var dateStr = Utilities.formatDate(new Date(), "GMT+7", "yyyy-MM-dd");
    var demoProgress = [
      ["PRG_001", "CLS_01", "Chủ đề 1: Biến đổi biểu thức chứa căn bậc hai, căn bậc ba nâng cao", 100, "Đã xong", dateStr],
      ["PRG_002", "CLS_01", "Chủ đề 2: Phương trình bậc hai & Định lý Vi-ét nâng cao (ứng dụng số học)", 80, "Đang dạy", dateStr],
      ["PRG_003", "CLS_01", "Chủ đề 3: Hệ phương trình đối xứng loại I, II và hệ đẳng cấp", 0, "Chưa dạy", dateStr],
      ["PRG_004", "CLS_01", "Chủ đề 4: Phương trình vô tỷ (đặt ẩn phụ, đánh giá, liên hợp)", 0, "Chưa dạy", dateStr],
      ["PRG_005", "CLS_01", "Chủ đề 5: Hệ thức lượng & Tỉ số lượng giác trong tam giác nâng cao", 0, "Chưa dạy", dateStr],
      ["PRG_006", "CLS_01", "Chủ đề 6: Cát tuyến, tiếp tuyến & Tứ giác nội tiếp đường tròn", 0, "Chưa dạy", dateStr],
      ["PRG_007", "CLS_01", "Chủ đề 7: Đường thẳng Euler, đường tròn Simson & các điểm đặc biệt", 0, "Chưa dạy", dateStr],
      ["PRG_008", "CLS_01", "Chủ đề 8: Bất đẳng thức Cauchy (AM-GM) & kỹ thuật chọn điểm rơi", 0, "Chưa dạy", dateStr],
      ["PRG_009", "CLS_01", "Chủ đề 9: Bất đẳng thức Cauchy-Schwarz (Bunyakovsky) dạng phân thức", 0, "Chưa dạy", dateStr],
      ["PRG_010", "CLS_01", "Chủ đề 10: Tổ hợp, nguyên lý Dirichlet & phương trình nghiệm nguyên", 0, "Chưa dạy", dateStr]
    ];
    progressSheet.getRange(2, 1, demoProgress.length, demoProgress[0].length).setValues(demoProgress);
  }

  // 9. Create GOP_Y_HOC_VIEN sheet
  var feedbackSheet = ss.getSheetByName("GOP_Y_HOC_VIEN");
  if (!feedbackSheet) {
    feedbackSheet = ss.insertSheet("GOP_Y_HOC_VIEN");
    var headers = ["FeedbackID", "StudentID", "ClassID", "TeacherRating", "TeacherComment", "Suggestion", "Date"];
    feedbackSheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    feedbackSheet.getRange(1, 1, 1, headers.length).setFontWeight("bold").setBackground("#f3f4f6");
    feedbackSheet.setFrozenRows(1);
  }
  
  Logger.log("Database schema upgraded successfully!");
}

function upgradeDatabaseSchemaJune2026() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // 1. Add Hoc_Phi_Theo_Buoi to LOPHOC sheet
  var lophocSheet = ss.getSheetByName("LOPHOC");
  if (lophocSheet) {
    var lastCol = lophocSheet.getLastColumn();
    var headers = lophocSheet.getRange(1, 1, 1, lastCol).getValues()[0];
    if (headers.indexOf("Hoc_Phi_Theo_Buoi") === -1) {
      lastCol++;
      lophocSheet.getRange(1, lastCol).setValue("Hoc_Phi_Theo_Buoi").setFontWeight("bold").setBackground("#f3f4f6");
      var lastRow = lophocSheet.getLastRow();
      if (lastRow > 1) {
        var fillRange = lophocSheet.getRange(2, lastCol, lastRow - 1, 1);
        var classIdRange = lophocSheet.getRange(2, headers.indexOf("ClassID") + 1, lastRow - 1, 1).getValues();
        var fillValues = [];
        for (var r = 0; r < classIdRange.length; r++) {
          var cid = classIdRange[r][0];
          if (cid === "CLS_01") fillValues.push([200000]);
          else if (cid === "CLS_02") fillValues.push([250000]);
          else fillValues.push([200000]);
        }
        fillRange.setValues(fillValues);
      }
      Logger.log("Added Hoc_Phi_Theo_Buoi column to LOPHOC sheet.");
    }
  }

  // 2. Add Trang_Thai_Thanh_Toan to DIEM_DANH sheet
  var diemDanhSheet = ss.getSheetByName("DIEM_DANH");
  if (diemDanhSheet) {
    var lastCol = diemDanhSheet.getLastColumn();
    var headers = diemDanhSheet.getRange(1, 1, 1, lastCol).getValues()[0];
    if (headers.indexOf("Trang_Thai_Thanh_Toan") === -1) {
      lastCol++;
      diemDanhSheet.getRange(1, lastCol).setValue("Trang_Thai_Thanh_Toan").setFontWeight("bold").setBackground("#f3f4f6");
      var lastRow = diemDanhSheet.getLastRow();
      if (lastRow > 1) {
        var fillRange = diemDanhSheet.getRange(2, lastCol, lastRow - 1, 1);
        var fillValues = [];
        for (var r = 2; r <= lastRow; r++) {
          fillValues.push(["Chưa thanh toán"]);
        }
        fillRange.setValues(fillValues);
      }
      Logger.log("Added Trang_Thai_Thanh_Toan column to DIEM_DANH sheet.");
    }
  }
  
  Logger.log("Database June 2026 upgrade complete.");
}

function fixExistingEmptyStatuses() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("DIEM_DANH");
  if (!sheet) {
    Logger.log("Sheet DIEM_DANH not found.");
    return;
  }
  var lastRow = sheet.getLastRow();
  if (lastRow <= 1) {
    Logger.log("No data in DIEM_DANH.");
    return;
  }
  
  var dataRange = sheet.getRange(1, 1, lastRow, sheet.getLastColumn());
  var data = dataRange.getValues();
  var headers = data[0];
  
  var idxApproval = headers.indexOf("Trang_Thai_Duyet");
  var idxPayment = headers.indexOf("Trang_Thai_Thanh_Toan");
  
  if (idxApproval === -1 || idxPayment === -1) {
    Logger.log("Columns Trang_Thai_Duyet or Trang_Thai_Thanh_Toan are missing!");
    return;
  }
  
  var updatedApproval = 0;
  var updatedPayment = 0;
  
  for (var i = 1; i < data.length; i++) {
    var rowApproval = data[i][idxApproval];
    var rowPayment = data[i][idxPayment];
    
    if (!rowApproval || rowApproval === "") {
      sheet.getRange(i + 1, idxApproval + 1).setValue("Đã duyệt");
      updatedApproval++;
    }
    
    if (!rowPayment || rowPayment === "") {
      sheet.getRange(i + 1, idxPayment + 1).setValue("Chưa thanh toán");
      updatedPayment++;
    }
  }
  
  Logger.log("Fixed " + updatedApproval + " empty approval statuses and " + updatedPayment + " empty payment statuses in DIEM_DANH sheet.");
}

function changeAdminPassword() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("TAI_KHOAN");
  if (!sheet) {
    Logger.log("Sheet TAI_KHOAN not found.");
    return;
  }
  var lastRow = sheet.getLastRow();
  if (lastRow <= 1) return;
  
  var data = sheet.getRange(1, 1, lastRow, sheet.getLastColumn()).getValues();
  var headers = data[0];
  var idxEmail = headers.indexOf("Email");
  var idxPass = headers.indexOf("PasswordHash");
  
  if (idxEmail === -1 || idxPass === -1) {
    Logger.log("Email or PasswordHash column missing.");
    return;
  }
  
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
  
  var count = 0;
  var newHash = hashPassword("123456789");
  for (var i = 1; i < data.length; i++) {
    if (data[i][idxEmail] === "admin@upgrid.edu.vn") {
      sheet.getRange(i + 1, idxPass + 1).setValue(newHash);
      count++;
    }
  }
  
  Logger.log("Updated admin password to '123456789' for " + count + " accounts.");
}
