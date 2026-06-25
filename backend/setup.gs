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
  upgradeDatabaseSchemaJune2026();
  upgradeDatabaseV2();
  migrateDiemSoToKetQua();
  
  // Seed V2 data if missing
  seedV2Data(ss);
  
  // Patch schema dynamically if columns are missing
  patchClassMaterialLinkSchema(ss);
  
  Logger.log("Database initialized successfully!");
}

function patchClassMaterialLinkSchema(ss) {
  var sheet = ss.getSheetByName("CLASS_MATERIAL_LINK");
  if (!sheet) return;
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  if (headers.indexOf("TopicName") === -1) {
    sheet.getRange(1, headers.length + 1).setValue("TopicName").setFontWeight("bold").setBackground("#f3f4f6");
    Logger.log("Added TopicName column to CLASS_MATERIAL_LINK");
  }
}

function seedV2Data(ss) {
  var folderSheet = ss.getSheetByName("FOLDER_CHUYEN_DE");
  if (folderSheet && folderSheet.getLastRow() <= 1) {
    var folders = [
      ["FLD_01", "Chuyên đề Hàm Số & Đồ Thị", "Toán", "Lớp 10", "Nâng cao", 1, "Các bài toán nâng cao khảo sát hàm số bậc hai, bậc ba và phân thức.", "ADMIN_01", "2026-06-25", "TRUE"],
      ["FLD_02", "Chuyên đề Tổ Hợp & Xác Suất", "Toán", "Lớp 10", "Chuyên", 2, "Tổ hợp, chỉnh hợp, xác suất cổ điển và nhị thức Newton.", "ADMIN_01", "2026-06-25", "TRUE"],
      ["FLD_03", "Chuyên đề Hình Học Không Gian", "Toán", "Lớp 11", "Cơ bản", 3, "Đường thẳng và mặt phẳng song song, vuông góc.", "ADMIN_01", "2026-06-25", "TRUE"]
    ];
    folderSheet.getRange(2, 1, folders.length, folders[0].length).setValues(folders);
    Logger.log("Seeded default folders in FOLDER_CHUYEN_DE.");
  }
  
  var fileSheet = ss.getSheetByName("FILE_HOC_LIEU");
  if (fileSheet && fileSheet.getLastRow() <= 1) {
    var files = [
      ["FIL_01", "FLD_01", "Bài tập Khảo sát biến thiên hàm số bậc hai.pdf", "PDF", "https://drive.google.com/file/d/1_dummy_id_1/preview", "", "TCH_01", "2026-06-25", "Tài liệu lý thuyết và bài tập tự luyện.", "TRUE"],
      ["FIL_02", "FLD_02", "Chuyên đề tổ hợp xác suất cơ bản đến nâng cao.pdf", "PDF", "https://drive.google.com/file/d/1_dummy_id_2/preview", "", "TCH_01", "2026-06-25", "Các dạng bài toán đếm và tính xác suất.", "TRUE"]
    ];
    fileSheet.getRange(2, 1, files.length, files[0].length).setValues(files);
    Logger.log("Seeded default files in FILE_HOC_LIEU.");
  }
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

  // Add initial central folders: FolderID, FolderName, Subject, Grade, Level, SortOrder, Description, CreatedBy, CreatedDate, IsActive
  var folderSheet = ss.getSheetByName("FOLDER_CHUYEN_DE");
  if (folderSheet && folderSheet.getLastRow() <= 1) {
    var folders = [
      ["FLD_01", "Chuyên đề Hàm Số & Đồ Thị", "Toán", "Lớp 10", "Nâng cao", 1, "Các bài toán nâng cao khảo sát hàm số bậc hai, bậc ba và phân thức.", "ADMIN_01", "2026-06-25", "TRUE"],
      ["FLD_02", "Chuyên đề Tổ Hợp & Xác Suất", "Toán", "Lớp 10", "Chuyên", 2, "Tổ hợp, chỉnh hợp, xác suất cổ điển và nhị thức Newton.", "ADMIN_01", "2026-06-25", "TRUE"],
      ["FLD_03", "Chuyên đề Hình Học Không Gian", "Toán", "Lớp 11", "Cơ bản", 3, "Đường thẳng và mặt phẳng song song, vuông góc.", "ADMIN_01", "2026-06-25", "TRUE"]
    ];
    folderSheet.getRange(2, 1, folders.length, folders[0].length).setValues(folders);
    Logger.log("Seeded default folders in FOLDER_CHUYEN_DE.");
  }
  
  // Add initial central files: FileID, FolderID, FileName, FileType, FileURL, ExamID, UploadedBy, UploadedDate, Description, IsGlobal
  var fileSheet = ss.getSheetByName("FILE_HOC_LIEU");
  if (fileSheet && fileSheet.getLastRow() <= 1) {
    var files = [
      ["FIL_01", "FLD_01", "Bài tập Khảo sát biến thiên hàm số bậc hai.pdf", "PDF", "https://drive.google.com/file/d/1_dummy_id_1/preview", "", "TCH_01", "2026-06-25", "Tài liệu lý thuyết và bài tập tự luyện.", "TRUE"],
      ["FIL_02", "FLD_02", "Chuyên đề tổ hợp xác suất cơ bản đến nâng cao.pdf", "PDF", "https://drive.google.com/file/d/1_dummy_id_2/preview", "", "TCH_01", "2026-06-25", "Các dạng bài toán đếm và tính xác suất.", "TRUE"]
    ];
    fileSheet.getRange(2, 1, files.length, files[0].length).setValues(files);
    Logger.log("Seeded default files in FILE_HOC_LIEU.");
  }
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

function upgradeDatabaseV2() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var schema = {
    "FOLDER_CHUYEN_DE": ["FolderID", "FolderName", "Subject", "Grade", "Level", "SortOrder", "Description", "CreatedBy", "CreatedDate", "IsActive"],
    "FILE_HOC_LIEU": ["FileID", "FolderID", "FileName", "FileType", "FileURL", "ExamID", "UploadedBy", "UploadedDate", "Description", "IsGlobal"],
    "CLASS_MATERIAL_LINK": ["LinkID", "ClassID", "FileID", "AssignedBy", "AssignedDate", "DueDate", "IsVisible", "SortOrder", "MaxAttempts", "IsActive"],
    "EXAM_TEMPLATE": ["TemplateID", "TemplateName", "Subject", "Grade", "TotalDuration", "MaxScore", "Description", "CreatedBy"],
    "EXAM_SECTION_TYPE": ["SectionTypeID", "TemplateID", "SectionName", "QuestionType", "QuestionCount", "PointsPerQuestion", "PointsPerSubQuestion", "SortOrder", "AIParsePrompt"],
    "EXAM_BANK": ["ExamID", "TemplateID", "ExamName", "Subject", "Grade", "DurationMinutes", "TotalPoints", "CreatedBy", "CreatedDate", "Status", "ShuffleQuestions", "ShuffleOptions"],
    "EXAM_QUESTION": ["QuestionID", "ExamID", "SectionTypeID", "QuestionNumber", "QuestionContent", "OptionA", "OptionB", "OptionC", "OptionD", "SubQuestions", "CorrectAnswer", "Solution", "Difficulty"],
    "EXAM_ATTEMPT": ["AttemptID", "StudentID", "ExamID", "ClassID", "LinkID", "StartTime", "SubmitTime", "DurationSeconds", "Status", "TotalScore", "MaxScore", "AttemptNumber", "QuestionOrder"],
    "EXAM_ANSWER": ["AnswerID", "AttemptID", "QuestionID", "StudentAnswer", "SubAnswers", "IsCorrect", "PointsEarned"],
    "KET_QUA_HOC_TAP": ["ResultID", "StudentID", "ClassID", "AssignmentName", "Source_Type", "AttemptID", "Score", "MaxScore", "NormalizedScore", "Feedback", "RecordedBy", "RecordedDate", "AttemptNumber", "IsBestAttempt"]
  };
  
  for (var sheetName in schema) {
    var sheet = ss.getSheetByName(sheetName);
    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
      var headers = schema[sheetName];
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      sheet.getRange(1, 1, 1, headers.length).setFontWeight("bold").setBackground("#f3f4f6");
      sheet.setFrozenRows(1);
      Logger.log("Created sheet " + sheetName);
    } else {
      var lastCol = sheet.getLastColumn();
      var headers = lastCol > 0 ? sheet.getRange(1, 1, 1, lastCol).getValues()[0] : [];
      var expectedHeaders = schema[sheetName];
      expectedHeaders.forEach(function(h) {
        if (headers.indexOf(h) === -1) {
          lastCol++;
          sheet.getRange(1, lastCol).setValue(h).setFontWeight("bold").setBackground("#f3f4f6");
          Logger.log("Added column " + h + " to sheet " + sheetName);
        }
      });
    }
  }
  
  migrateDiemSoToKetQua();
}

function migrateDiemSoToKetQua() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var ketQuaSheet = ss.getSheetByName("KET_QUA_HOC_TAP");
  if (!ketQuaSheet) {
    Logger.log("KET_QUA_HOC_TAP sheet not initialized yet.");
    return;
  }
  
  var existingRecords = [];
  try {
    existingRecords = getSheetData("KET_QUA_HOC_TAP");
  } catch(e) {}
  
  var hasManual = existingRecords.some(function(r) { return r.Source_Type === "MANUAL"; });
  if (hasManual) {
    Logger.log("DIEM_SO migration already done previously. Skipping to prevent duplicate records.");
    return;
  }
  
  var diemSoRecords = [];
  try {
    diemSoRecords = getSheetData("DIEM_SO");
  } catch (e) {
    Logger.log("DIEM_SO sheet not found or empty: " + e.toString());
    return;
  }
  
  if (diemSoRecords.length === 0) {
    Logger.log("No records in DIEM_SO to migrate.");
    return;
  }
  
  var classes = [];
  try {
    classes = getSheetData("LOPHOC");
  } catch(e) {}
  
  var classTeacherMap = {};
  classes.forEach(function(c) {
    classTeacherMap[c.ClassID] = c.TeacherID;
  });
  
  var migratedCount = 0;
  var todayStr = Utilities.formatDate(new Date(), "GMT+7", "yyyy-MM-dd");
  
  diemSoRecords.forEach(function(ds) {
    var teacherId = classTeacherMap[ds.ClassID] || "ADMIN_01";
    var score = parseFloat(ds.Grade) || 0;
    var resultId = "RES_" + Utilities.formatDate(new Date(), "GMT+7", "yyyyMMdd") + "_" + Math.floor(1000 + Math.random() * 9000);
    
    appendRowData("KET_QUA_HOC_TAP", {
      ResultID: resultId,
      StudentID: ds.StudentID,
      ClassID: ds.ClassID,
      AssignmentName: ds.AssignmentName,
      Source_Type: "MANUAL",
      AttemptID: "",
      Score: score,
      MaxScore: 10,
      NormalizedScore: score,
      Feedback: ds.Feedback || "",
      RecordedBy: teacherId,
      RecordedDate: todayStr,
      AttemptNumber: 1,
      IsBestAttempt: true
    });
    migratedCount++;
  });
  
  Logger.log("Successfully migrated " + migratedCount + " records from DIEM_SO to KET_QUA_HOC_TAP.");
}

function testBackendPatch() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  Logger.log("--- STARTING BACKEND PATCH INTEGRATION TEST ---");
  
  var adminSession = { refId: "ADMIN_01", role: "ADMIN", fullName: "Admin Nguyễn" };
  var teacherSession = { refId: "TCH_01", role: "GIAO_VIEN", fullName: "Cô Hà" };
  var studentSession = { refId: "STD_01", role: "HOC_VIEN", fullName: "Nguyễn Bình An" };
  
  // 1. Create a folder
  Logger.log("Testing createFolder...");
  var folderRes = createFolder({
    folderName: "Chuyên đề Toán học kiểm thử",
    subject: "Toán",
    grade: "Lớp 9",
    level: "Chuyên",
    sortOrder: 1,
    description: "Thư mục dùng để chạy integration test."
  }, adminSession);
  var testFolderId = folderRes.data.folderId;
  Logger.log("Created folder: " + testFolderId);
  
  // 2. Upload file PDF
  Logger.log("Testing createFilePDF...");
  var fileRes = createFilePDF({
    folderId: testFolderId,
    fileName: "Tài liệu Hình học Giải tích kiểm thử.pdf",
    fileUrl: "https://drive.google.com/mock-file",
    description: "Tài liệu học tập.",
    isGlobal: false
  }, teacherSession);
  var testFileId = fileRes.data.fileId;
  Logger.log("Uploaded file: " + testFileId);
  
  // 3. Create exam template
  Logger.log("Testing createExamTemplate...");
  var tempRes = createExamTemplate({
    templateName: "Đề thi thử THPT QG Toán - TEST",
    subject: "Toán",
    grade: "Lớp 9",
    totalDuration: 45,
    maxScore: 10,
    description: "Template dùng để test.",
    sections: [
      {
        sectionName: "Trắc nghiệm",
        questionType: "MCQ",
        questionCount: 2,
        pointsPerQuestion: 2.5
      },
      {
        sectionName: "Đúng Sai",
        questionType: "TRUE_FALSE",
        questionCount: 1,
        pointsPerQuestion: 5.0,
        pointsPerSubQuestion: 1.25
      }
    ]
  }, adminSession);
  var testTemplateId = tempRes.data.templateId;
  Logger.log("Created template: " + testTemplateId);
  
  // 4. Create Exam
  Logger.log("Testing createExam...");
  var examRes = createExam({
    templateId: testTemplateId,
    examName: "Đề khảo sát năng lực Toán 9 - TEST",
    durationMinutes: 45,
    shuffleQuestions: false,
    shuffleOptions: false
  }, teacherSession);
  var testExamId = examRes.data.examId;
  Logger.log("Created exam: " + testExamId);
  
  // 5. Parse LaTeX & Save questions
  Logger.log("Testing parseLatexSection and saveExamSection...");
  var templates = getExamTemplatesList();
  var testTemplate = templates.find(function(t) { return t.templateId === testTemplateId; });
  var mcqSection = testTemplate.sections.find(function(s) { return s.questionType === "MCQ"; });
  var tfSection = testTemplate.sections.find(function(s) { return s.questionType === "TRUE_FALSE"; });
  
  var mcqQuestions = [
    { questionContent: "Giải phương trình $x-3=0$", optionA: "1", optionB: "2", optionC: "3", optionD: "4", correctAnswer: "C", solution: "$x=3$" },
    { questionContent: "Tính $2+3$", optionA: "4", optionB: "5", optionC: "6", optionD: "7", correctAnswer: "B", solution: "$2+3=5$" }
  ];
  saveExamSection({
    examId: testExamId,
    sectionTypeId: mcqSection.sectionTypeId,
    questions: mcqQuestions
  }, teacherSession);
  
  var tfQuestions = [
    {
      questionContent: "Cho tam giác ABC vuông tại A.",
      subQuestions: [
        { text: "AB vuông góc với AC", answer: "T" },
        { text: "BC là cạnh huyền", answer: "T" },
        { text: "Góc B luôn bằng 45 độ", answer: "F" },
        { text: "Góc A là góc nhọn", answer: "F" }
      ],
      correctAnswer: "",
      solution: "Định nghĩa tam giác vuông."
    }
  ];
  saveExamSection({
    examId: testExamId,
    sectionTypeId: tfSection.sectionTypeId,
    questions: tfQuestions
  }, teacherSession);
  
  // 6. Publish Exam
  Logger.log("Testing publishExam...");
  var pubRes = publishExam({ examId: testExamId }, teacherSession);
  var testExamFileId = pubRes.data.fileId;
  Logger.log("Published exam, file ID in storage: " + testExamFileId);
  
  // 7. Assign Exam to Class
  Logger.log("Testing assignMaterialToClass...");
  var assignRes = assignMaterialToClass({
    classId: "CLS_01",
    fileId: testExamFileId,
    dueDate: "2026-07-15",
    isVisible: true,
    sortOrder: 1,
    maxAttempts: 2
  }, teacherSession);
  var testLinkId = assignRes.data.linkId;
  Logger.log("Assigned exam link: " + testLinkId);
  
  // 8. Start exam attempt
  Logger.log("Testing startExam...");
  var startRes = startExam("CLS_01", testExamId, studentSession);
  var testAttemptId = startRes.attemptId;
  Logger.log("Started attempt: " + testAttemptId);
  
  // 9. Save progress
  Logger.log("Testing saveExamProgress...");
  var questionsInAttempt = startRes.questions;
  var mcq1 = questionsInAttempt.find(function(q) { return q.questionContent.indexOf("x-3") !== -1; });
  var mcq2 = questionsInAttempt.find(function(q) { return q.questionContent.indexOf("2+3") !== -1; });
  var tf1 = questionsInAttempt.find(function(q) { return q.questionContent.indexOf("tam giác ABC") !== -1; });
  
  saveExamProgress({
    attemptId: testAttemptId,
    answers: [
      { questionId: mcq1.questionId, studentAnswer: "C" },
      { questionId: mcq2.questionId, studentAnswer: "A" },
      {
        questionId: tf1.questionId,
        subAnswers: [
          { subIndex: 0, answer: "T" },
          { subIndex: 1, answer: "T" },
          { subIndex: 2, answer: "T" },
          { subIndex: 3, answer: "T" }
        ]
      }
    ]
  }, studentSession);
  
  // 10. Submit exam and grade
  Logger.log("Testing submitExam...");
  var submitRes = submitExam({ attemptId: testAttemptId }, studentSession);
  Logger.log("Submitted score: " + submitRes.data.totalScore + " / " + submitRes.data.maxScore);
  if (submitRes.data.totalScore !== 5.0) {
    Logger.log("WARNING: Score did not match expected 5.0! Got: " + submitRes.data.totalScore);
  } else {
    Logger.log("SUCCESS: Grading is correct (5.0 points)!");
  }
  
  // 11. Dashboards and stats
  Logger.log("Testing dashboards...");
  var studentDash = getStudentResultDashboard("", studentSession);
  Logger.log("Student uncompleted exams count: " + studentDash.uncompletedExams.length);
  
  var classDash = getClassResultDashboard("CLS_01", teacherSession);
  Logger.log("Class students matrix row count: " + classDash.studentsMatrix.length);
  
  var stats = getAssignmentStatsData("CLS_01", "Đề khảo sát năng lực Toán 9 - TEST", teacherSession);
  Logger.log("Assignment average score: " + stats.average);
  
  // 12. Cleanup test data
  Logger.log("Cleaning up test data...");
  deleteFolder(testFolderId, adminSession);
  
  var sSheet = ss.getSheetByName("EXAM_SECTION_TYPE");
  if (sSheet && sSheet.getLastRow() > 1) {
    var sRows = sSheet.getRange(1, 1, sSheet.getLastRow(), sSheet.getLastColumn()).getValues();
    for (var r = sRows.length - 1; r >= 1; r--) {
      if (sRows[r][sRows[0].indexOf("TemplateID")] === testTemplateId) sSheet.deleteRow(r + 1);
    }
  }
  var tSheet = ss.getSheetByName("EXAM_TEMPLATE");
  if (tSheet && tSheet.getLastRow() > 1) {
    var tRows = tSheet.getRange(1, 1, tSheet.getLastRow(), tSheet.getLastColumn()).getValues();
    for (var r = tRows.length - 1; r >= 1; r--) {
      if (tRows[r][tRows[0].indexOf("TemplateID")] === testTemplateId) tSheet.deleteRow(r + 1);
    }
  }
  
  var qSheet = ss.getSheetByName("EXAM_QUESTION");
  if (qSheet && qSheet.getLastRow() > 1) {
    var qRows = qSheet.getRange(1, 1, qSheet.getLastRow(), qSheet.getLastColumn()).getValues();
    for (var r = qRows.length - 1; r >= 1; r--) {
      if (qRows[r][qRows[0].indexOf("ExamID")] === testExamId) qSheet.deleteRow(r + 1);
    }
  }
  
  var bSheet = ss.getSheetByName("EXAM_BANK");
  if (bSheet && bSheet.getLastRow() > 1) {
    var bRows = bSheet.getRange(1, 1, bSheet.getLastRow(), bSheet.getLastColumn()).getValues();
    for (var r = bRows.length - 1; r >= 1; r--) {
      if (bRows[r][bRows[0].indexOf("ExamID")] === testExamId) bSheet.deleteRow(r + 1);
    }
  }
  
  var fileSheet = ss.getSheetByName("FILE_HOC_LIEU");
  if (fileSheet && fileSheet.getLastRow() > 1) {
    var fRows = fileSheet.getRange(1, 1, fileSheet.getLastRow(), fileSheet.getLastColumn()).getValues();
    for (var r = fRows.length - 1; r >= 1; r--) {
      if (fRows[r][fRows[0].indexOf("ExamID")] === testExamId) fileSheet.deleteRow(r + 1);
    }
  }
  var linkSheet = ss.getSheetByName("CLASS_MATERIAL_LINK");
  if (linkSheet && linkSheet.getLastRow() > 1) {
    var lRows = linkSheet.getRange(1, 1, linkSheet.getLastRow(), linkSheet.getLastColumn()).getValues();
    for (var r = lRows.length - 1; r >= 1; r--) {
      if (lRows[r][lRows[0].indexOf("LinkID")] === testLinkId) linkSheet.deleteRow(r + 1);
    }
  }
  
  var attSheet = ss.getSheetByName("EXAM_ATTEMPT");
  if (attSheet && attSheet.getLastRow() > 1) {
    var attRows = attSheet.getRange(1, 1, attSheet.getLastRow(), attSheet.getLastColumn()).getValues();
    for (var r = attRows.length - 1; r >= 1; r--) {
      if (attRows[r][attRows[0].indexOf("AttemptID")] === testAttemptId) attSheet.deleteRow(r + 1);
    }
  }
  
  var ansSheet = ss.getSheetByName("EXAM_ANSWER");
  if (ansSheet && ansSheet.getLastRow() > 1) {
    var ansRows = ansSheet.getRange(1, 1, ansSheet.getLastRow(), ansSheet.getLastColumn()).getValues();
    for (var r = ansRows.length - 1; r >= 1; r--) {
      if (ansRows[r][ansRows[0].indexOf("AttemptID")] === testAttemptId) ansSheet.deleteRow(r + 1);
    }
  }
  
  var kqSheet = ss.getSheetByName("KET_QUA_HOC_TAP");
  if (kqSheet && kqSheet.getLastRow() > 1) {
    var kqRows = kqSheet.getRange(1, 1, kqSheet.getLastRow(), kqSheet.getLastColumn()).getValues();
    for (var r = kqRows.length - 1; r >= 1; r--) {
      if (kqRows[r][kqRows[0].indexOf("AttemptID")] === testAttemptId) kqSheet.deleteRow(r + 1);
    }
  }
  
  Logger.log("--- INTEGRATION TEST FINISHED SUCCESSFULLY ---");
}

function setDriveFolderId() {
  PropertiesService.getScriptProperties().setProperty("DRIVE_FOLDER_ID", "1XuteNkmavnx8WS5MHJwaXaD5KGjj1SiJ");
  Logger.log("Đã cấu hình DRIVE_FOLDER_ID thành công: 1XuteNkmavnx8WS5MHJwaXaD5KGjj1SiJ");
}
