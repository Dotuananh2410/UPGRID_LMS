/**
 * UPGRID LMS - Google Apps Script Backend Web App API
 * Deploy this script as a Web App (Execute as: Me, Who has access: Anyone)
 */

// --- ROUTERS ---

function doGet(e) {
  try {
    var action = e.parameter.action;
    var result;
    
    // Public routes
    if (action === "getPublicClasses") {
      result = getPublicClasses();
      return createJSONResponse({ success: true, data: result });
    }
    
    // Auth Token Check for personalized routes
    var token = e.parameter.token;
    if (!token) {
      return createJSONResponse({ success: false, error: "Unauthorized: Missing authentication token" });
    }
    
    var userSession = parseToken(token);
    if (!userSession) {
      return createJSONResponse({ success: false, error: "Unauthorized: Invalid or expired token" });
    }
    
    // Authorized routes
    switch (action) {
      case "getClasses":
        result = getClassesForUser(userSession);
        break;
      case "getStudentDebt":
        var targetStudentId = e.parameter.studentId || userSession.refId;
        result = getStudentDebt(targetStudentId);
        break;
      case "getTeacherPayroll":
        var targetTeacherId = e.parameter.teacherId || userSession.refId;
        var month = e.parameter.month; // YYYY-MM
        result = getTeacherPayroll(targetTeacherId, month);
        break;
      case "getFeedbackTemplates":
        var loaiKiThi = e.parameter.loaiKiThi;
        result = getFeedbackTemplates(loaiKiThi);
        break;
      case "getPendingApprovals":
        result = getPendingApprovalsList(userSession);
        break;
      case "getApprovalHistory":
        result = getApprovalHistoryList(userSession);
        break;
      case "getClassProgress":
        var targetClassId = e.parameter.classId;
        result = getClassProgress(targetClassId);
        break;
      case "getClassGrades":
        var targetClassId = e.parameter.classId;
        result = getClassGradesData(targetClassId, userSession);
        break;
      case "getPayrollDashboard":
        if (userSession.role !== "ADMIN" && userSession.role !== "QUAN_SINH") {
          return createJSONResponse({ success: false, error: "Forbidden: Admin or Quan sinh access required" });
        }
        var month = e.parameter.month; // YYYY-MM
        result = getPayrollDashboard(month);
        break;
      case "getBillingDashboard":
        if (userSession.role !== "ADMIN" && userSession.role !== "QUAN_SINH") {
          return createJSONResponse({ success: false, error: "Forbidden: Admin or Quan sinh access required" });
        }
        result = getBillingDashboard();
        break;
      case "getStudents":
        result = getStudentsList(userSession);
        break;
      case "getTeachers":
        result = getTeachersList(userSession);
        break;
      case "getClassDetails":
        var classId = e.parameter.classId;
        result = getClassDetails(classId, userSession);
        break;
      case "getStudentDashboard":
        var targetStudentId = e.parameter.studentId || userSession.refId;
        // Verify student or check if admin/teacher
        if (userSession.role === "HOC_VIEN" && targetStudentId !== userSession.refId) {
          return createJSONResponse({ success: false, error: "Unauthorized: Cannot access other student details" });
        }
        result = getStudentDashboardData(targetStudentId);
        break;
      case "getClassAttendance":
        var targetClassId = e.parameter.classId;
        result = getClassAttendanceData(targetClassId, userSession);
        break;
      default:
        return createJSONResponse({ success: false, error: "Invalid action: " + action });
    }
    
    return createJSONResponse({ success: true, data: result });
  } catch (err) {
    return createJSONResponse({ success: false, error: err.toString() });
  }
}

function doPost(e) {
  // Concurrency Lock
  var lock = LockService.getScriptLock();
  try {
    // Wait up to 30 seconds for lock
    lock.waitLock(30000);
    
    var postData = JSON.parse(e.postData.contents);
    var action = postData.action;
    var result;
    
    // Auth route doesn't require token
    if (action === "login") {
      result = loginUser(postData.email, postData.password);
      return createJSONResponse(result);
    }
    
    // Auth Token Check for other POST actions
    var token = postData.token;
    if (!token) {
      return createJSONResponse({ success: false, error: "Unauthorized: Missing authentication token" });
    }
    
    var userSession = parseToken(token);
    if (!userSession) {
      return createJSONResponse({ success: false, error: "Unauthorized: Invalid or expired token" });
    }
    
    switch (action) {
      case "disburseTeacherSalary":
        if (userSession.role !== "ADMIN" && userSession.role !== "QUAN_SINH") {
          return createJSONResponse({ success: false, error: "Forbidden: Admin or Quan sinh access required" });
        }
        result = disburseTeacherSalary(postData.teacherId, postData.month);
        break;

      case "recordTransaction":
        if (userSession.role !== "ADMIN" && userSession.role !== "QUAN_SINH") {
          return createJSONResponse({ success: false, error: "Forbidden: Admin or Quan sinh access required" });
        }
        result = recordTransaction(postData, userSession.refId);
        break;
        
      case "approveAttendanceBatch":
        if (userSession.role !== "ADMIN" && userSession.role !== "QUAN_SINH") {
          return createJSONResponse({ success: false, error: "Forbidden: Admin or Quan sinh access required" });
        }
        result = approveAttendanceBatch(postData.classId, postData.sessionNumber, postData.status);
        break;

      case "updateStudentStatus":
        if (userSession.role !== "ADMIN" && userSession.role !== "QUAN_SINH") {
          return createJSONResponse({ success: false, error: "Forbidden: Admin or Quan sinh access required" });
        }
        result = updateStudentStatus(postData.studentId, postData.classId, postData.status, postData.targetClassId);
        break;

      case "removeStudentFromClass":
        if (userSession.role !== "ADMIN" && userSession.role !== "QUAN_SINH") {
          return createJSONResponse({ success: false, error: "Forbidden: Admin or Quan sinh access required" });
        }
        result = removeStudentFromClass(postData.studentId, postData.classId);
        break;
        
      case "updateClassProgress":
        result = updateClassProgressBatch(postData.classId, postData.records);
        break;

      case "submitStudentFeedback":
        result = submitStudentFeedback(postData, userSession.refId);
        break;
        
      case "createStudent":
        if (userSession.role !== "ADMIN") return createJSONResponse({ success: false, error: "Forbidden: Admin access required" });
        result = createStudentAccount(postData);
        break;
        
      case "createTeacher":
        if (userSession.role !== "ADMIN") return createJSONResponse({ success: false, error: "Forbidden: Admin access required" });
        result = createTeacherAccount(postData);
        break;
        
      case "createClass":
        if (userSession.role !== "ADMIN") return createJSONResponse({ success: false, error: "Forbidden: Admin access required" });
        result = createClassroom(postData);
        break;
        
      case "enrollStudent":
        if (userSession.role !== "ADMIN") return createJSONResponse({ success: false, error: "Forbidden: Admin access required" });
        result = enrollStudentInClass(postData.classId, postData.studentId);
        break;
        
      case "markAttendance":
        if (userSession.role !== "GIAO_VIEN" && userSession.role !== "ADMIN") {
          return createJSONResponse({ success: false, error: "Forbidden: Teacher or Admin access required" });
        }
        result = markAttendanceBatch(postData);
        break;
        
      case "submitGrade":
        if (userSession.role !== "GIAO_VIEN" && userSession.role !== "ADMIN") {
          return createJSONResponse({ success: false, error: "Forbidden: Teacher or Admin access required" });
        }
        result = submitGradeRecord(postData);
        break;
        
      default:
        return createJSONResponse({ success: false, error: "Invalid action: " + action });
    }
    
    return createJSONResponse(result);
    
  } catch (err) {
    return createJSONResponse({ success: false, error: err.toString() });
  } finally {
    lock.releaseLock();
  }
}

// --- HELPER FUNCTIONS ---

function parseMonthFromValue(val) {
  if (!val) return "";
  if (val instanceof Date) {
    try {
      return Utilities.formatDate(val, "GMT+7", "yyyy-MM");
    } catch(e) {
      var y = val.getFullYear();
      var m = val.getMonth() + 1;
      return y + "-" + (m < 10 ? "0" + m : m);
    }
  }
  if (typeof val === "string") {
    val = val.trim();
    if (val.indexOf("-") !== -1) {
      var parts = val.split("-");
      if (parts[0].length === 4) {
        return parts[0] + "-" + (parts[1].length === 1 ? "0" + parts[1] : parts[1]);
      } else if (parts[2] && parts[2].length === 4) {
        return parts[2] + "-" + (parts[1].length === 1 ? "0" + parts[1] : parts[1]);
      }
    } else if (val.indexOf("/") !== -1) {
      var parts = val.split("/");
      if (parts[2] && parts[2].length === 4) {
        return parts[2] + "-" + (parts[1].length === 1 ? "0" + parts[1] : parts[1]);
      } else if (parts[0].length === 4) {
        return parts[0] + "-" + (parts[1].length === 1 ? "0" + parts[1] : parts[1]);
      }
    }
    if (val.length >= 7) {
      return val.substring(0, 7);
    }
  }
  return "";
}

function parseDateToString(val) {
  if (!val) return "";
  if (val instanceof Date) {
    try {
      return Utilities.formatDate(val, "GMT+7", "yyyy-MM-dd");
    } catch(e) {
      var y = val.getFullYear();
      var m = val.getMonth() + 1;
      var d = val.getDate();
      return y + "-" + (m < 10 ? "0" + m : m) + "-" + (d < 10 ? "0" + d : d);
    }
  }
  if (typeof val === "string") {
    var cleanVal = val.trim();
    if (cleanVal.indexOf("/") !== -1) {
      var parts = cleanVal.split("/");
      if (parts[2] && parts[2].length === 4) {
        var d = parts[0];
        var m = parts[1];
        return parts[2] + "-" + (m.length === 1 ? "0" + m : m) + "-" + (d.length === 1 ? "0" + d : d);
      }
    }
    return cleanVal;
  }
  return val.toString();
}

function createJSONResponse(obj) {
  var output = ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
  return output;
}

function getSheetData(sheetName) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) throw new Error("Sheet not found: " + sheetName);
  var lastRow = sheet.getLastRow();
  if (lastRow <= 1) return [];
  var data = sheet.getRange(1, 1, lastRow, sheet.getLastColumn()).getValues();
  var headers = data[0];
  var rows = [];
  for (var i = 1; i < data.length; i++) {
    var row = {};
    for (var j = 0; j < headers.length; j++) {
      row[headers[j]] = data[i][j];
    }
    rows.push(row);
  }
  return rows;
}

function appendRowData(sheetName, rowObj) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) throw new Error("Sheet not found: " + sheetName);
  var lastCol = sheet.getLastColumn();
  var headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  var newRow = headers.map(function(h) {
    return rowObj[h] !== undefined ? rowObj[h] : "";
  });
  sheet.appendRow(newRow);
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

// Simple security token: encoded string containing details and timestamp
function generateToken(refId, email, role, fullName) {
  var sessionObj = {
    refId: refId,
    email: email,
    role: role,
    fullName: fullName,
    timestamp: new Date().getTime()
  };
  var rawString = JSON.stringify(sessionObj);
  return Utilities.base64EncodeWebSafe(rawString);
}

function parseToken(token) {
  try {
    var rawString = Utilities.newBlob(Utilities.base64DecodeWebSafe(token)).getDataAsString();
    var session = JSON.parse(rawString);
    // Optional: check expiry (e.g. 7 days = 604800000ms)
    var now = new Date().getTime();
    if (now - session.timestamp > 7 * 24 * 60 * 60 * 1000) {
      return null; // Token expired
    }
    return session;
  } catch (err) {
    return null; // Invalid token
  }
}

// --- SERVICE LOGIC ---

// 1. AuthService
function loginUser(email, password) {
  var accounts = getSheetData("TAI_KHOAN");
  var inputHash = hashPassword(password);
  
  var matchedUser = null;
  for (var i = 0; i < accounts.length; i++) {
    if (accounts[i].Email.toLowerCase() === email.toLowerCase() && accounts[i].PasswordHash === inputHash) {
      matchedUser = accounts[i];
      break;
    }
  }
  
  if (!matchedUser) {
    return { success: false, error: "Sai email hoặc mật khẩu!" };
  }
  
  var token = generateToken(matchedUser.RefID, matchedUser.Email, matchedUser.Role, matchedUser.FullName);
  
  return {
    success: true,
    data: {
      token: token,
      user: {
        refId: matchedUser.RefID,
        email: matchedUser.Email,
        role: matchedUser.Role,
        fullName: matchedUser.FullName
      }
    }
  };
}

// 2. ClassService (Public classes for ISR)
function getPublicClasses() {
  var classes = getSheetData("LOPHOC");
  var accounts = getSheetData("TAI_KHOAN");
  
  // Map teacher names
  var teacherMap = {};
  accounts.forEach(function(acc) {
    if (acc.Role === "GIAO_VIEN") {
      teacherMap[acc.RefID] = acc.FullName;
    }
  });
  
  return classes.map(function(cls) {
    return {
      classId: cls.ClassID,
      className: cls.ClassName,
      schedule: cls.Schedule,
      teacherId: cls.TeacherID,
      teacherName: teacherMap[cls.TeacherID] || "Chưa phân công",
      tuitionFee: parseFloat(cls.Hoc_Phi_Theo_Buoi) || 200000
    };
  });
}

function getClassesForUser(session) {
  var classes = getSheetData("LOPHOC");
  var enrollments = getSheetData("GHI_DANH");
  var accounts = getSheetData("TAI_KHOAN");
  
  // 1. Fetch progress data once in memory
  var progressList = [];
  try {
    progressList = getSheetData("TIEN_DO_LOP_HOC");
  } catch (e) {
    Logger.log("TIEN_DO_LOP_HOC sheet not found or empty: " + e.toString());
  }
  
  // Build a progress map: ClassID -> { sum, count }
  var progressMap = {};
  progressList.forEach(function(p) {
    if (!progressMap[p.ClassID]) {
      progressMap[p.ClassID] = { sum: 0, count: 0 };
    }
    progressMap[p.ClassID].sum += parseFloat(p.ProgressPercent) || 0;
    progressMap[p.ClassID].count++;
  });
  
  var getProgress = function(classId) {
    var data = progressMap[classId];
    if (!data || data.count === 0) return 0;
    return Math.round(data.sum / data.count);
  };
  
  var teacherMap = {};
  accounts.forEach(function(acc) {
    if (acc.Role === "GIAO_VIEN") {
      teacherMap[acc.RefID] = acc.FullName;
    }
  });
  
  var mapClass = function(cls) {
    return {
      classId: cls.ClassID,
      className: cls.ClassName,
      schedule: cls.Schedule,
      teacherId: cls.TeacherID,
      teacherName: teacherMap[cls.TeacherID] || "Chưa phân công",
      grade: cls.Grade || "Lớp 9",
      level: cls.Level || "Cơ bản",
      subject: cls.Subject || "Toán",
      tuitionFee: parseFloat(cls.Hoc_Phi_Theo_Buoi) || 200000,
      progressPercent: getProgress(cls.ClassID)
    };
  };
  
  if (session.role === "ADMIN" || session.role === "QUAN_SINH") {
    return classes.map(mapClass);
  } else if (session.role === "GIAO_VIEN") {
    return classes
      .filter(function(cls) { return cls.TeacherID === session.refId; })
      .map(mapClass);
  } else if (session.role === "HOC_VIEN") {
    var studentClassIds = enrollments
      .filter(function(enr) { return enr.StudentID === session.refId; })
      .map(function(enr) { return enr.ClassID; });
      
    return classes
      .filter(function(cls) { return studentClassIds.indexOf(cls.ClassID) !== -1; })
      .map(mapClass);
  }
  return [];
}

function getClassDetails(classId, session) {
  var classes = getSheetData("LOPHOC");
  var classObj = classes.find(function(cls) { return cls.ClassID === classId; });
  if (!classObj) throw new Error("Lớp học không tồn tại");
  
  // Authorize: check access
  if (session.role === "GIAO_VIEN" && classObj.TeacherID !== session.refId) {
    throw new Error("Không có quyền truy cập thông tin lớp này");
  }
  
  var accounts = getSheetData("TAI_KHOAN");
  var teacherName = "Chưa phân công";
  var teacher = accounts.find(function(acc) { return acc.RefID === classObj.TeacherID; });
  if (teacher) teacherName = teacher.FullName;
  
  // Get enrolled students
  var enrollments = getSheetData("GHI_DANH");
  var studentProfiles = getSheetData("HOC_VIEN");
  
  var classEnrollments = enrollments.filter(function(enr) { return enr.ClassID === classId; });
  var enrolledStudentIds = classEnrollments.map(function(enr) { return enr.StudentID; });
    
  var students = studentProfiles
    .filter(function(std) { return enrolledStudentIds.indexOf(std.StudentID) !== -1; })
    .map(function(std) {
      var studentAccount = accounts.find(function(acc) { return acc.RefID === std.StudentID; });
      var enr = classEnrollments.find(function(e) { return e.StudentID === std.StudentID; });
      return {
        studentId: std.StudentID,
        fullName: std.FullName,
        email: studentAccount ? studentAccount.Email : "",
        parentEmail: std.ParentEmail,
        parentPhone: std.ParentPhone,
        status: enr ? (enr.Trang_Thai_Hoc || "Đang học") : "Đang học",
        debt: enr ? (parseFloat(enr.Hoc_Phi_Con_No) || 0) : 0
      };
    });
    
  return {
    classId: classObj.ClassID,
    className: classObj.ClassName,
    schedule: classObj.Schedule,
    teacherId: classObj.TeacherID,
    teacherName: teacherName,
    grade: classObj.Grade || "Lớp 9",
    level: classObj.Level || "Cơ bản",
    subject: classObj.Subject || "Toán",
    tuitionFee: parseFloat(classObj.Hoc_Phi_Theo_Buoi) || 200000,
    progressPercent: calculateClassProgressPercent(classId),
    students: students
  };
}

// 3. Student & Account Admin Services
function getStudentsList(session) {
  if (session.role !== "ADMIN" && session.role !== "GIAO_VIEN") {
    throw new Error("Không có quyền xem danh sách học viên");
  }
  var students = getSheetData("HOC_VIEN");
  var accounts = getSheetData("TAI_KHOAN");
  
  return students.map(function(std) {
    var acc = accounts.find(function(a) { return a.RefID === std.StudentID; });
    return {
      studentId: std.StudentID,
      fullName: std.FullName,
      email: acc ? acc.Email : "",
      parentEmail: std.ParentEmail,
      parentPhone: std.ParentPhone
    };
  });
}

function getTeachersList(session) {
  if (session.role !== "ADMIN") {
    throw new Error("Không có quyền xem danh sách giáo viên");
  }
  var accounts = getSheetData("TAI_KHOAN");
  return accounts
    .filter(function(acc) { return acc.Role === "GIAO_VIEN"; })
    .map(function(acc) {
      return {
        teacherId: acc.RefID,
        fullName: acc.FullName,
        email: acc.Email
      };
    });
}

function createStudentAccount(data) {
  var accounts = getSheetData("TAI_KHOAN");
  
  // Check if email already exists
  var exists = accounts.some(function(acc) { return acc.Email.toLowerCase() === data.email.toLowerCase(); });
  if (exists) {
    return { success: false, error: "Email này đã tồn tại trên hệ thống!" };
  }
  
  var studentId = "STD_" + Utilities.formatDate(new Date(), "GMT+7", "yyyyMMdd") + "_" + Math.floor(100 + Math.random() * 900);
  var hashed = hashPassword(data.password || "student123");
  
  // 1. Write TAI_KHOAN
  appendRowData("TAI_KHOAN", {
    RefID: studentId,
    Email: data.email,
    PasswordHash: hashed,
    Role: "HOC_VIEN",
    FullName: data.fullName
  });
  
  // 2. Write HOC_VIEN
  appendRowData("HOC_VIEN", {
    StudentID: studentId,
    FullName: data.fullName,
    ParentEmail: data.parentEmail || "",
    ParentPhone: data.parentPhone || ""
  });
  
  return { success: true, data: { studentId: studentId } };
}

function createTeacherAccount(data) {
  var accounts = getSheetData("TAI_KHOAN");
  var exists = accounts.some(function(acc) { return acc.Email.toLowerCase() === data.email.toLowerCase(); });
  if (exists) {
    return { success: false, error: "Email này đã tồn tại trên hệ thống!" };
  }
  
  var teacherId = "TCH_" + Utilities.formatDate(new Date(), "GMT+7", "yyyyMMdd") + "_" + Math.floor(100 + Math.random() * 900);
  var hashed = hashPassword(data.password || "teacher123");
  
  // 1. Write to TAI_KHOAN
  appendRowData("TAI_KHOAN", {
    RefID: teacherId,
    Email: data.email,
    PasswordHash: hashed,
    Role: "GIAO_VIEN",
    FullName: data.fullName
  });

  // 2. Also write to DANH_SACH_GIAO_VIEN
  appendRowData("DANH_SACH_GIAO_VIEN", {
    TeacherID: teacherId,
    FullName: data.fullName,
    Luong_Theo_Buoi: 500000 // default 500,000 VND/session
  });
  
  return { success: true, data: { teacherId: teacherId } };
}

function createClassroom(data) {
  var classId = "CLS_" + Utilities.formatDate(new Date(), "GMT+7", "yyyyMMdd") + "_" + Math.floor(100 + Math.random() * 900);
  
  var grade = data.grade || "Lớp 9";
  var level = data.level || "Cơ bản";
  var subject = data.subject || "Toán";
  var tuitionFee = parseFloat(data.tuitionFee) || 200000;
  
  // 1. Write to LOPHOC
  appendRowData("LOPHOC", {
    ClassID: classId,
    ClassName: data.className,
    Schedule: data.schedule,
    TeacherID: data.teacherId,
    Grade: grade,
    Level: level,
    Subject: subject,
    Hoc_Phi_Theo_Buoi: tuitionFee
  });
  
  // 2. Fetch KHUNG_CHUONG_TRINH and seed progress
  try {
    var programTopics = getSheetData("KHUNG_CHUONG_TRINH");
    var matched = programTopics.filter(function(pt) {
      return pt.Grade === grade && pt.Level === level && pt.Subject === subject;
    });
    
    var dateStr = Utilities.formatDate(new Date(), "GMT+7", "yyyy-MM-dd");
    matched.forEach(function(pt) {
      var progressId = "PRG_" + Utilities.formatDate(new Date(), "GMT+7", "yyyyMMdd") + "_" + Math.floor(1000 + Math.random() * 9000);
      appendRowData("TIEN_DO_LOP_HOC", {
        ProgressID: progressId,
        ClassID: classId,
        TopicName: pt.TopicName,
        ProgressPercent: 0,
        Status: "Chưa dạy",
        LastUpdated: dateStr
      });
    });
  } catch (err) {
    // If table doesn't exist yet, fail silently but log
    Logger.log("Failed to seed program progress: " + err.toString());
  }
  
  return { success: true, data: { classId: classId } };
}

function enrollStudentInClass(classId, studentId) {
  var enrollments = getSheetData("GHI_DANH");
  
  // Check duplicate enrollment
  var exists = enrollments.some(function(enr) {
    return enr.ClassID === classId && enr.StudentID === studentId;
  });
  
  if (exists) {
    return { success: false, error: "Học viên này đã được ghi danh vào lớp rồi!" };
  }
  
  var enrollmentId = "ENR_" + Utilities.formatDate(new Date(), "GMT+7", "yyyyMMdd") + "_" + Math.floor(100 + Math.random() * 900);
  
  appendRowData("GHI_DANH", {
    EnrollmentID: enrollmentId,
    ClassID: classId,
    StudentID: studentId
  });
  
  return { success: true, data: { enrollmentId: enrollmentId } };
}

// 4. Attendance Services
function getClassAttendanceData(classId, session) {
  // Verify access permissions
  if (session.role === "GIAO_VIEN") {
    var classes = getSheetData("LOPHOC");
    var classObj = classes.find(function(c) { return c.ClassID === classId; });
    if (!classObj || classObj.TeacherID !== session.refId) {
      throw new Error("Không có quyền xem điểm danh của lớp này");
    }
  }
  
  var allAttendance = getSheetData("DIEM_DANH");
  var classAttendance = allAttendance.filter(function(att) { return att.ClassID === classId; });
  
  return classAttendance.map(function(att) {
    return {
      attendanceId: att.AttendanceID,
      studentId: att.StudentID,
      sessionNumber: att.SessionNumber,
      date: parseDateToString(att.Date),
      status: att.Status
    };
  });
}

function markAttendanceBatch(data) {
  // data: { classId: "...", sessionNumber: 1, date: "2026-06-23", records: { "STD_01": "P", "STD_02": "V" } }
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("DIEM_DANH");
  
  var classId = data.classId;
  var sessionNumber = parseInt(data.sessionNumber);
  var dateStr = data.date;
  var records = data.records; // Key: StudentID, Value: Status ('P' or 'V')
  
  // Load existing records to prevent duplicates and support edits
  var lastRow = sheet.getLastRow();
  var dataRange = lastRow > 1 ? sheet.getRange(1, 1, lastRow, sheet.getLastColumn()).getValues() : [["AttendanceID", "ClassID", "StudentID", "SessionNumber", "Date", "Status", "Trang_Thai_Duyet"]];
  var headers = dataRange[0];
  
  // Indices
  var idxId = headers.indexOf("AttendanceID");
  var idxClass = headers.indexOf("ClassID");
  var idxStudent = headers.indexOf("StudentID");
  var idxSession = headers.indexOf("SessionNumber");
  var idxDate = headers.indexOf("Date");
  var idxStatus = headers.indexOf("Status");
  var idxApproval = headers.indexOf("Trang_Thai_Duyet");
  
  // Track updates vs appends
  var studentIdsToMark = Object.keys(records);
  var updatedCount = 0;
  var addedCount = 0;
  
  // Check existing rows in sheet to modify status
  for (var i = 1; i < dataRange.length; i++) {
    var rowClass = dataRange[i][idxClass];
    var rowStudent = dataRange[i][idxStudent];
    var rowSession = parseInt(dataRange[i][idxSession]);
    
    if (rowClass === classId && rowSession === sessionNumber) {
      if (studentIdsToMark.indexOf(rowStudent) !== -1) {
        // Edit status in sheet (Row index is i + 1 because 1-based and 0th header row)
        sheet.getRange(i + 1, idxStatus + 1).setValue(records[rowStudent]);
        sheet.getRange(i + 1, idxDate + 1).setValue(dateStr);
        if (idxApproval !== -1) {
          sheet.getRange(i + 1, idxApproval + 1).setValue("Chờ duyệt");
        }
        // Remove from pending list
        studentIdsToMark = studentIdsToMark.filter(function(id) { return id !== rowStudent; });
        updatedCount++;
      }
    }
  }
  
  // Append new records
  studentIdsToMark.forEach(function(studentId) {
    var attendanceId = "ATT_" + Utilities.formatDate(new Date(), "GMT+7", "yyyyMMdd") + "_" + Math.floor(1000 + Math.random() * 9000);
    appendRowData("DIEM_DANH", {
      AttendanceID: attendanceId,
      ClassID: classId,
      StudentID: studentId,
      SessionNumber: sessionNumber,
      Date: dateStr,
      Status: records[studentId],
      Trang_Thai_Duyet: "Chờ duyệt",
      Trang_Thai_Thanh_Toan: "Chưa thanh toán"
    });
    addedCount++;
  });
  
  return { success: true, data: { updated: updatedCount, added: addedCount } };
}

// 5. Grade Services
function submitGradeRecord(data) {
  // data: { classId: "...", studentId: "...", assignmentName: "...", grade: 9.5, feedback: "..." }
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("DIEM_SO");
  
  var classId = data.classId;
  var studentId = data.studentId;
  var assignmentName = data.assignmentName;
  var grade = parseFloat(data.grade);
  var feedback = data.feedback || "";
  
  var lastRow = sheet.getLastRow();
  var dataRange = lastRow > 1 ? sheet.getRange(1, 1, lastRow, 6).getValues() : [["RecordID", "ClassID", "StudentID", "AssignmentName", "Grade", "Feedback"]];
  var headers = dataRange[0];
  
  var idxId = headers.indexOf("RecordID");
  var idxClass = headers.indexOf("ClassID");
  var idxStudent = headers.indexOf("StudentID");
  var idxAssignment = headers.indexOf("AssignmentName");
  var idxGrade = headers.indexOf("Grade");
  var idxFeedback = headers.indexOf("Feedback");
  
  var existingRowIdx = -1;
  
  for (var i = 1; i < dataRange.length; i++) {
    if (dataRange[i][idxClass] === classId && 
        dataRange[i][idxStudent] === studentId && 
        dataRange[i][idxAssignment] === assignmentName) {
      existingRowIdx = i + 1; // 1-based index
      break;
    }
  }
  
  if (existingRowIdx !== -1) {
    // Update existing grade
    sheet.getRange(existingRowIdx, idxGrade + 1).setValue(grade);
    sheet.getRange(existingRowIdx, idxFeedback + 1).setValue(feedback);
    return { success: true, data: { action: "updated", recordId: dataRange[existingRowIdx - 1][idxId] } };
  } else {
    // Create new grade
    var recordId = "GRD_" + Utilities.formatDate(new Date(), "GMT+7", "yyyyMMdd") + "_" + Math.floor(1000 + Math.random() * 9000);
    appendRowData("DIEM_SO", {
      RecordID: recordId,
      ClassID: classId,
      StudentID: studentId,
      AssignmentName: assignmentName,
      Grade: grade,
      Feedback: feedback
    });
    return { success: true, data: { action: "created", recordId: recordId } };
  }
}

// 6. Student Dashboard Service (Fetch all related info in one optimized API read)
function getStudentDashboardData(studentId) {
  var enrollments = getSheetData("GHI_DANH");
  var classes = getSheetData("LOPHOC");
  var attendances = getSheetData("DIEM_DANH");
  var grades = getSheetData("DIEM_SO");
  var accounts = getSheetData("TAI_KHOAN");
  
  // 1. Get class details
  var studentClassIds = enrollments
    .filter(function(enr) { return enr.StudentID === studentId; })
    .map(function(enr) { return enr.ClassID; });
  
  var teacherMap = {};
  accounts.forEach(function(acc) {
    if (acc.Role === "GIAO_VIEN") {
      teacherMap[acc.RefID] = acc.FullName;
    }
  });
  
  var studentClasses = classes
    .filter(function(cls) { return studentClassIds.indexOf(cls.ClassID) !== -1; })
    .map(function(cls) {
      var rankInfo = getStudentRankInClass(studentId, cls.ClassID);
      return {
        classId: cls.ClassID,
        className: cls.ClassName,
        schedule: cls.Schedule,
        teacherName: teacherMap[cls.TeacherID] || "Chưa phân công",
        rank: rankInfo.rank,
        totalStudents: rankInfo.total,
        progressPercent: calculateClassProgressPercent(cls.ClassID)
      };
    });
    
  // 2. Filter attendances
  var studentAttendances = attendances
    .filter(function(att) { return att.StudentID === studentId; })
    .map(function(att) {
      var cls = classes.find(function(c) { return c.ClassID === att.ClassID; });
      return {
        attendanceId: att.AttendanceID,
        classId: att.ClassID,
        className: cls ? cls.ClassName : "Lớp đã xóa",
        sessionNumber: att.SessionNumber,
        date: parseDateToString(att.Date),
        status: att.Status
      };
    });
    
  // 3. Filter grades
  var studentGrades = grades
    .filter(function(grd) { return grd.StudentID === studentId; })
    .map(function(grd) {
      var cls = classes.find(function(c) { return c.ClassID === grd.ClassID; });
      return {
        recordId: grd.RecordID,
        classId: grd.ClassID,
        className: cls ? cls.ClassName : "Lớp đã xóa",
        assignmentName: grd.AssignmentName,
        grade: grd.Grade,
        feedback: grd.Feedback
      };
    });
    
  return {
    classes: studentClasses,
    attendances: studentAttendances,
    grades: studentGrades
  };
}

// ==============================================================
// === PHẦN CODE BỔ SUNG: LOGIC BILLING, PAYROLL, WORKFLOW MỚI ===
// ==============================================================

// Helper tính giá học phí mỗi buổi của lớp học
function getClassTuitionRate(classId) {
  try {
    var classes = getSheetData("LOPHOC");
    var cls = classes.find(function(c) { return c.ClassID === classId; });
    if (cls && cls.Hoc_Phi_Theo_Buoi !== undefined && cls.Hoc_Phi_Theo_Buoi !== "") {
      var rate = parseFloat(cls.Hoc_Phi_Theo_Buoi);
      if (!isNaN(rate)) return rate;
    }
  } catch (err) {
    Logger.log("Error in getClassTuitionRate: " + err.toString());
  }
  var customRates = {
    "CLS_01": 200000,
    "CLS_02": 250000
  };
  return customRates[classId] || 200000; // Mặc định 200.000đ/buổi nếu lớp chưa có cấu hình riêng
}

// 1. Quản lý công nợ học sinh
function getStudentDebt(studentId) {
  var enrollments = getSheetData("GHI_DANH");
  var attendances = getSheetData("DIEM_DANH");
  var transactions = getSheetData("LICH_SU_GIAO_DICH");
  var classes = getSheetData("LOPHOC");
  
  var studentEnrollments = enrollments.filter(function(enr) {
    return enr.StudentID === studentId;
  });
  
  var breakdown = [];
  var totalDebt = 0;
  
  studentEnrollments.forEach(function(enr) {
    var classId = enr.ClassID;
    var cls = classes.find(function(c) { return c.ClassID === classId; });
    var className = cls ? cls.ClassName : "Lớp đã xóa";
    
    // Đếm số buổi đã học có trạng thái duyệt là "Đã duyệt" hoặc trống (data cũ)
    var studentAtt = attendances.filter(function(att) {
      return att.StudentID === studentId && 
             att.ClassID === classId && 
             (att.Trang_Thai_Duyet === "Đã duyệt" || !att.Trang_Thai_Duyet);
    });
    var sessionsCount = studentAtt.length;
    var rate = getClassTuitionRate(classId);
    var totalCharged = sessionsCount * rate;
    
    // Tính tổng số tiền đã nộp
    var classTxns = transactions.filter(function(txn) {
      return txn.StudentID === studentId && txn.ClassID === classId;
    });
    
    var totalPaid = 0;
    classTxns.forEach(function(txn) {
      var amt = parseFloat(txn.SoTien) || 0;
      if (txn.Loai === "Thu") {
        totalPaid += amt;
      } else if (txn.Loai === "Hoàn" || txn.Loai === "Chuyển") {
        totalPaid -= amt;
      }
    });
    
    var classDebt = totalCharged - totalPaid;
    totalDebt += classDebt;
    
    breakdown.push({
      classId: classId,
      className: className,
      sessionsCount: sessionsCount,
      rate: rate,
      totalCharged: totalCharged,
      totalPaid: totalPaid,
      classDebt: classDebt,
      status: enr.Trang_Thai_Hoc || "Đang học",
      dueDate: parseDateToString(enr.Han_Dong_Hoc_Phi)
    });
    
    // Đồng bộ lại công nợ vào bảng GHI_DANH
    updateEnrollmentDebtInSheet(studentId, classId, classDebt);
  });
  
  return {
    studentId: studentId,
    totalDebt: totalDebt,
    breakdown: breakdown
  };
}

// Cập nhật công nợ thực tế vào cột Hoc_Phi_Con_No trong sheet GHI_DANH
function updateEnrollmentDebtInSheet(studentId, classId, debt) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("GHI_DANH");
  var lastRow = sheet.getLastRow();
  if (lastRow <= 1) return;
  
  var data = sheet.getRange(1, 1, lastRow, sheet.getLastColumn()).getValues();
  var headers = data[0];
  var idxStudent = headers.indexOf("StudentID");
  var idxClass = headers.indexOf("ClassID");
  var idxDebt = headers.indexOf("Hoc_Phi_Con_No");
  
  if (idxStudent === -1 || idxClass === -1 || idxDebt === -1) return;
  
  for (var i = 1; i < data.length; i++) {
    if (data[i][idxStudent] === studentId && data[i][idxClass] === classId) {
      sheet.getRange(i + 1, idxDebt + 1).setValue(debt);
      break;
    }
  }
}

// 2. Ghi nhận giao dịch đóng học phí
function recordTransaction(data, cashierId) {
  var studentId = data.studentId;
  var classId = data.classId;
  var amount = parseFloat(data.amount) || 0;
  var type = data.type || "Thu";
  var dateStr = data.date || Utilities.formatDate(new Date(), "GMT+7", "yyyy-MM-dd");
  
  if (!studentId || !classId || amount <= 0) {
    return { success: false, error: "Dữ liệu giao dịch không hợp lệ!" };
  }
  
  var txnId = "TXN_" + Utilities.formatDate(new Date(), "GMT+7", "yyyyMMdd") + "_" + Math.floor(1000 + Math.random() * 9000);
  
  appendRowData("LICH_SU_GIAO_DICH", {
    GiaoDichID: txnId,
    StudentID: studentId,
    ClassID: classId,
    SoTien: amount,
    Loai: type,
    NgayGiaoDich: dateStr,
    NguoiThu: cashierId
  });
  
  // Tính toán lại toàn bộ nợ của học sinh sau khi nộp tiền
  var updatedDebt = getStudentDebt(studentId);
  
  return { 
    success: true, 
    data: { 
      transactionId: txnId,
      updatedDebt: updatedDebt.totalDebt,
      breakdown: updatedDebt.breakdown
    } 
  };
}

// 3. Tính lương Giáo viên
function getTeacherPayroll(teacherId, month) {
  var teachers = getSheetData("DANH_SACH_GIAO_VIEN");
  var classes = getSheetData("LOPHOC");
  var attendances = getSheetData("DIEM_DANH");
  
  var teacherInfo = teachers.find(function(t) { return t.TeacherID === teacherId; });
  
  var teacherClasses = classes.filter(function(c) {
    return c.TeacherID === teacherId;
  });
  var classIds = teacherClasses.map(function(c) { return c.ClassID; });
  
  var classRateMap = {};
  classes.forEach(function(c) {
    classRateMap[c.ClassID] = parseFloat(c.Hoc_Phi_Theo_Buoi) || 200000;
  });
  
  var teacherAtts = attendances.filter(function(att) {
    if (classIds.indexOf(att.ClassID) === -1) return false;
    
    var attMonthStr = parseMonthFromValue(att.Date);
    return attMonthStr === month;
  });
  
  var sessions = {};
  teacherAtts.forEach(function(att) {
    var key = att.ClassID + "_" + att.SessionNumber;
    if (!sessions[key]) {
      sessions[key] = {
        classId: att.ClassID,
        sessionNumber: att.SessionNumber,
        date: parseDateToString(att.Date),
        status: att.Trang_Thai_Duyet || "Đã duyệt",
        paymentStatus: att.Trang_Thai_Thanh_Toan || "Chưa thanh toán",
        presentCount: 0
      };
    } else {
      if (att.Trang_Thai_Duyet === "Chờ duyệt" && sessions[key].status !== "Từ chối") {
        sessions[key].status = "Chờ duyệt";
      } else if (att.Trang_Thai_Duyet === "Từ chối") {
        sessions[key].status = "Từ chối";
      }
      if (att.Trang_Thai_Thanh_Toan === "Chưa thanh toán" && sessions[key].paymentStatus === "Đã thanh toán") {
        sessions[key].paymentStatus = "Chưa thanh toán";
      }
    }
    
    if (att.Status === "P") {
      sessions[key].presentCount++;
    }
  });
  
  var approvedCount = 0;
  var pendingCount = 0;
  var rejectedCount = 0;
  var paidCount = 0;
  
  var approvedSalary = 0; // Chờ thanh toán
  var pendingSalary = 0;  // Chờ duyệt
  var paidSalary = 0;     // Đã giải ngân
  
  Object.keys(sessions).forEach(function(key) {
    var sess = sessions[key];
    var status = sess.status;
    var payStatus = sess.paymentStatus;
    var rate = classRateMap[sess.classId] || 200000;
    var sessionSalary = sess.presentCount * rate * 0.70;
    
    if (status === "Đã duyệt") {
      if (payStatus === "Đã thanh toán") {
        paidCount++;
        paidSalary += sessionSalary;
      } else {
        approvedCount++;
        approvedSalary += sessionSalary;
      }
    } else if (status === "Chờ duyệt") {
      pendingCount++;
      pendingSalary += sessionSalary;
    } else if (status === "Từ chối") {
      rejectedCount++;
    }
  });
  
  var sessionList = Object.keys(sessions).map(function(key) {
    var sess = sessions[key];
    var cls = classes.find(function(c) { return c.ClassID === sess.classId; });
    var rate = classRateMap[sess.classId] || 200000;
    var totalCollected = sess.presentCount * rate;
    var teacherShare = totalCollected * 0.70;
    return {
      classId: sess.classId,
      className: cls ? cls.ClassName : "Lớp đã xóa",
      sessionNumber: sess.sessionNumber,
      date: sess.date,
      status: sess.status,
      paymentStatus: sess.paymentStatus,
      presentCount: sess.presentCount,
      tuitionRate: rate,
      totalCollected: totalCollected,
      teacherShare: teacherShare
    };
  });
  
  sessionList.sort(function(a, b) {
    return b.date.localeCompare(a.date);
  });
  
  return {
    teacherId: teacherId,
    fullName: teacherInfo ? teacherInfo.FullName : "N/A",
    month: month,
    approvedCount: approvedCount,
    pendingCount: pendingCount,
    rejectedCount: rejectedCount,
    paidCount: paidCount,
    approvedSalary: approvedSalary,
    pendingSalary: pendingSalary,
    paidSalary: paidSalary,
    totalSessions: approvedCount + pendingCount + rejectedCount + paidCount,
    sessions: sessionList
  };
}

// 4. Phê duyệt điểm danh hàng loạt (Duyệt theo Buổi học của lớp)
function approveAttendanceBatch(classId, sessionNumber, status) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("DIEM_DANH");
  var lastRow = sheet.getLastRow();
  if (lastRow <= 1) return { success: false, error: "Không có dữ liệu điểm danh!" };
  
  var dataRange = sheet.getRange(1, 1, lastRow, sheet.getLastColumn());
  var data = dataRange.getValues();
  var headers = data[0];
  
  var idxClass = headers.indexOf("ClassID");
  var idxSession = headers.indexOf("SessionNumber");
  var idxStatus = headers.indexOf("Trang_Thai_Duyet");
  
  if (idxClass === -1 || idxSession === -1 || idxStatus === -1) {
    return { success: false, error: "Lỗi cấu trúc cột sheet DIEM_DANH!" };
  }
  
  var count = 0;
  var targetSession = parseInt(sessionNumber);
  
  for (var i = 1; i < data.length; i++) {
    var rowClass = data[i][idxClass];
    var rowSession = parseInt(data[i][idxSession]);
    
    if (rowClass === classId && rowSession === targetSession) {
      sheet.getRange(i + 1, idxStatus + 1).setValue(status);
      count++;
    }
  }
  
  return { success: true, data: { updatedCount: count, classId: classId, sessionNumber: sessionNumber, status: status } };
}

// 5. Lấy danh sách điểm danh đang chờ duyệt cho Admin
function getPendingApprovalsList(session) {
  if (session.role !== "ADMIN" && session.role !== "QUAN_SINH") {
    throw new Error("Không có quyền truy cập danh sách duyệt!");
  }
  
  var attendances = getSheetData("DIEM_DANH");
  var classes = getSheetData("LOPHOC");
  var accounts = getSheetData("TAI_KHOAN");
  
  var teacherMap = {};
  accounts.forEach(function(acc) {
    if (acc.Role === "GIAO_VIEN") {
      teacherMap[acc.RefID] = acc.FullName;
    }
  });
  
  var pendingAtts = attendances.filter(function(att) {
    return att.Trang_Thai_Duyet === "Chờ duyệt";
  });
  
  var groups = {};
  pendingAtts.forEach(function(att) {
    var key = att.ClassID + "_" + att.SessionNumber;
    if (!groups[key]) {
      var cls = classes.find(function(c) { return c.ClassID === att.ClassID; });
      groups[key] = {
        classId: att.ClassID,
        className: cls ? cls.ClassName : "Lớp đã xóa",
        sessionNumber: att.SessionNumber,
        date: parseDateToString(att.Date),
        teacherName: cls ? (teacherMap[cls.TeacherID] || "Chưa phân công") : "N/A",
        studentCount: 0
      };
    }
    groups[key].studentCount++;
  });
  
  var result = [];
  Object.keys(groups).forEach(function(key) {
    result.push(groups[key]);
  });
  
  result.sort(function(a, b) {
    return b.date.localeCompare(a.date);
  });
  
  return result;
}

// 6. Xử lý trạng thái học viên (Bảo lưu/Nghỉ học/Chuyển lớp)
function updateStudentStatus(studentId, classId, status, targetClassId) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("GHI_DANH");
  var lastRow = sheet.getLastRow();
  if (lastRow <= 1) return { success: false, error: "Không tìm thấy dữ liệu ghi danh!" };
  
  var data = sheet.getRange(1, 1, lastRow, sheet.getLastColumn()).getValues();
  var headers = data[0];
  
  var idxStudent = headers.indexOf("StudentID");
  var idxClass = headers.indexOf("ClassID");
  var idxStatus = headers.indexOf("Trang_Thai_Hoc");
  
  if (idxStudent === -1 || idxClass === -1 || idxStatus === -1) {
    return { success: false, error: "Lỗi cấu trúc cột sheet GHI_DANH!" };
  }
  
  var updated = false;
  
  for (var i = 1; i < data.length; i++) {
    if (data[i][idxStudent] === studentId && data[i][idxClass] === classId) {
      if (status === "Chuyển lớp" && targetClassId) {
        // Đổi trạng thái lớp cũ thành "Nghỉ học"
        sheet.getRange(i + 1, idxStatus + 1).setValue("Nghỉ học");
        // Ghi danh vào lớp mới
        var enrollResult = enrollStudentInClass(targetClassId, studentId);
        if (!enrollResult.success) {
          return enrollResult;
        }
        updated = true;
      } else {
        sheet.getRange(i + 1, idxStatus + 1).setValue(status);
        updated = true;
      }
      break;
    }
  }
  
  if (!updated) {
    return { success: false, error: "Không tìm thấy thông tin ghi danh!" };
  }
  
  return { success: true, data: { studentId: studentId, classId: classId, status: status, targetClassId: targetClassId } };
}

// 7. Lấy danh sách nhận xét mẫu môn Toán
function getFeedbackTemplates(loaiKiThi) {
  var templates = getSheetData("FEEDBACK_TEMPLATE");
  
  if (!loaiKiThi) {
    return templates.map(function(t) {
      return {
        templateId: t.TemplateID,
        loaiKiThi: t.Loai_Ki_Thi,
        noiDungMau: t.Noi_Dung_Mau
      };
    });
  }
  
  return templates
    .filter(function(t) {
      return t.Loai_Ki_Thi.toLowerCase() === loaiKiThi.toLowerCase();
    })
    .map(function(t) {
      return {
        templateId: t.TemplateID,
        loaiKiThi: t.Loai_Ki_Thi,
        noiDungMau: t.Noi_Dung_Mau
      };
    });
}

// 8. Báo cáo tài chính Billing & Lịch sử dòng tiền
function getBillingDashboard() {
  var enrollments = getSheetData("GHI_DANH");
  var classes = getSheetData("LOPHOC");
  var students = getSheetData("HOC_VIEN");
  var transactions = getSheetData("LICH_SU_GIAO_DICH");
  
  var billingList = [];
  
  enrollments.forEach(function(enr) {
    var debt = parseFloat(enr.Hoc_Phi_Con_No) || 0;
    if (debt > 0) {
      var student = students.find(function(s) { return s.StudentID === enr.StudentID; });
      var cls = classes.find(function(c) { return c.ClassID === enr.ClassID; });
      
      var dueDate = parseDateToString(enr.Han_Dong_Hoc_Phi);
      
      billingList.push({
        enrollmentId: enr.EnrollmentID,
        studentId: enr.StudentID,
        fullName: student ? student.FullName : "Học sinh đã xóa",
        classId: enr.ClassID,
        className: cls ? cls.ClassName : "Lớp đã xóa",
        debt: debt,
        dueDate: dueDate,
        status: enr.Trang_Thai_Hoc || "Đang học"
      });
    }
  });
  
  var txns = transactions.map(function(t) {
    var student = students.find(function(s) { return s.StudentID === t.StudentID; });
    var cls = classes.find(function(c) { return c.ClassID === t.ClassID; });
    return {
      transactionId: t.GiaoDichID,
      studentId: t.StudentID,
      fullName: student ? student.FullName : "N/A",
      classId: t.ClassID,
      className: cls ? cls.ClassName : "N/A",
      amount: parseFloat(t.SoTien) || 0,
      type: t.Loai,
      date: parseDateToString(t.NgayGiaoDich),
      cashierId: t.NguoiThu
    };
  });
  
  txns.sort(function(a, b) {
    return b.date.localeCompare(a.date);
  });
  
  return {
    billingList: billingList,
    transactions: txns
  };
}

function getPayrollDashboard(month) {
  var teachers = getSheetData("DANH_SACH_GIAO_VIEN");
  var classes = getSheetData("LOPHOC");
  var attendances = getSheetData("DIEM_DANH");
  
  var classRateMap = {};
  classes.forEach(function(c) {
    classRateMap[c.ClassID] = parseFloat(c.Hoc_Phi_Theo_Buoi) || 200000;
  });
  
  var payrollList = [];
  
  teachers.forEach(function(teacherInfo) {
    var teacherId = teacherInfo.TeacherID;
    
    var teacherClasses = classes.filter(function(c) {
      return c.TeacherID === teacherId;
    });
    var classIds = teacherClasses.map(function(c) { return c.ClassID; });
    
    var teacherAtts = attendances.filter(function(att) {
      if (classIds.indexOf(att.ClassID) === -1) return false;
      
      var attMonthStr = parseMonthFromValue(att.Date);
      return attMonthStr === month;
    });
    
    var sessions = {};
    teacherAtts.forEach(function(att) {
      var key = att.ClassID + "_" + att.SessionNumber;
      if (!sessions[key]) {
        sessions[key] = {
          classId: att.ClassID,
          sessionNumber: att.SessionNumber,
          status: att.Trang_Thai_Duyet || "Đã duyệt",
          paymentStatus: att.Trang_Thai_Thanh_Toan || "Chưa thanh toán",
          presentCount: 0
        };
      } else {
        if (att.Trang_Thai_Duyet === "Chờ duyệt" && sessions[key].status !== "Từ chối") {
          sessions[key].status = "Chờ duyệt";
        } else if (att.Trang_Thai_Duyet === "Từ chối") {
          sessions[key].status = "Từ chối";
        }
        if (att.Trang_Thai_Thanh_Toan === "Chưa thanh toán" && sessions[key].paymentStatus === "Đã thanh toán") {
          sessions[key].paymentStatus = "Chưa thanh toán";
        }
      }
      
      if (att.Status === "P") {
        sessions[key].presentCount++;
      }
    });
    
    var approvedCount = 0;
    var pendingCount = 0;
    var rejectedCount = 0;
    var paidCount = 0;
    
    var approvedSalary = 0; // Chờ thanh toán
    var pendingSalary = 0;  // Chờ duyệt
    var paidSalary = 0;     // Đã giải ngân
    
    Object.keys(sessions).forEach(function(key) {
      var sess = sessions[key];
      var status = sess.status;
      var payStatus = sess.paymentStatus;
      var rate = classRateMap[sess.classId] || 200000;
      var sessionSalary = sess.presentCount * rate * 0.70;
      
      if (status === "Đã duyệt") {
        if (payStatus === "Đã thanh toán") {
          paidCount++;
          paidSalary += sessionSalary;
        } else {
          approvedCount++;
          approvedSalary += sessionSalary;
        }
      } else if (status === "Chờ duyệt") {
        pendingCount++;
        pendingSalary += sessionSalary;
      } else if (status === "Từ chối") {
        rejectedCount++;
      }
    });
    
    payrollList.push({
      teacherId: teacherId,
      fullName: teacherInfo.FullName,
      approvedCount: approvedCount,
      pendingCount: pendingCount,
      rejectedCount: rejectedCount,
      paidCount: paidCount,
      approvedSalary: approvedSalary,
      pendingSalary: pendingSalary,
      paidSalary: paidSalary,
      totalSessions: approvedCount + pendingCount + rejectedCount + paidCount
    });
  });
  
  return payrollList;
}

// 9. Xóa học viên khỏi lớp
function removeStudentFromClass(studentId, classId) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("GHI_DANH");
  var lastRow = sheet.getLastRow();
  if (lastRow <= 1) return { success: false, error: "Không tìm thấy dữ liệu ghi danh!" };
  
  var dataRange = sheet.getRange(1, 1, lastRow, sheet.getLastColumn());
  var data = dataRange.getValues();
  var headers = data[0];
  
  var idxStudent = headers.indexOf("StudentID");
  var idxClass = headers.indexOf("ClassID");
  
  if (idxStudent === -1 || idxClass === -1) {
    return { success: false, error: "Lỗi cấu trúc cột sheet GHI_DANH!" };
  }
  
  var rowToDelete = -1;
  for (var i = 1; i < data.length; i++) {
    if (data[i][idxStudent] === studentId && data[i][idxClass] === classId) {
      rowToDelete = i + 1; // 1-based index
      break;
    }
  }
  
  if (rowToDelete === -1) {
    return { success: false, error: "Không tìm thấy dòng ghi danh tương ứng!" };
  }
  
  sheet.deleteRow(rowToDelete);
  return { success: true, data: { studentId: studentId, classId: classId } };
}

// 10. Quản lý tiến độ giảng dạy lớp học
function getClassProgress(classId) {
  try {
    var progressList = getSheetData("TIEN_DO_LOP_HOC");
    var classProgress = progressList.filter(function(p) {
      return p.ClassID === classId;
    });
    
    return classProgress.map(function(p) {
      return {
        progressId: p.ProgressID,
        topicName: p.TopicName,
        progressPercent: parseFloat(p.ProgressPercent) || 0,
        status: p.Status || "Chưa dạy",
        lastUpdated: parseDateToString(p.LastUpdated)
      };
    });
  } catch (err) {
    return [];
  }
}

function updateClassProgressBatch(classId, records) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("TIEN_DO_LOP_HOC");
  var lastRow = sheet.getLastRow();
  if (lastRow <= 1) return { success: false, error: "Không tìm thấy dữ liệu tiến độ!" };
  
  var dataRange = sheet.getRange(1, 1, lastRow, sheet.getLastColumn());
  var data = dataRange.getValues();
  var headers = data[0];
  
  var idxId = headers.indexOf("ProgressID");
  var idxPercent = headers.indexOf("ProgressPercent");
  var idxStatus = headers.indexOf("Status");
  var idxUpdated = headers.indexOf("LastUpdated");
  
  if (idxId === -1 || idxPercent === -1 || idxStatus === -1 || idxUpdated === -1) {
    return { success: false, error: "Lỗi cấu trúc cột sheet TIEN_DO_LOP_HOC!" };
  }
  
  var dateStr = Utilities.formatDate(new Date(), "GMT+7", "yyyy-MM-dd");
  var count = 0;
  
  var recordMap = {};
  records.forEach(function(r) {
    recordMap[r.progressId] = r;
  });
  
  for (var i = 1; i < data.length; i++) {
    var rowId = data[i][idxId];
    if (recordMap[rowId]) {
      var percent = parseFloat(recordMap[rowId].progressPercent) || 0;
      var status = recordMap[rowId].status;
      
      sheet.getRange(i + 1, idxPercent + 1).setValue(percent);
      sheet.getRange(i + 1, idxStatus + 1).setValue(status);
      sheet.getRange(i + 1, idxUpdated + 1).setValue(dateStr);
      count++;
    }
  }
  
  return { success: true, data: { updatedCount: count } };
}

function calculateClassProgressPercent(classId) {
  try {
    var progressList = getSheetData("TIEN_DO_LOP_HOC");
    var classProgress = progressList.filter(function(p) {
      return p.ClassID === classId;
    });
    if (classProgress.length === 0) return 0;
    
    var sum = 0;
    classProgress.forEach(function(p) {
      sum += parseFloat(p.ProgressPercent) || 0;
    });
    return Math.round(sum / classProgress.length);
  } catch (err) {
    return 0;
  }
}

// 11. Lấy toàn bộ điểm số của lớp học
function getClassGradesData(classId, session) {
  if (session.role === "GIAO_VIEN") {
    var classes = getSheetData("LOPHOC");
    var classObj = classes.find(function(c) { return c.ClassID === classId; });
    if (!classObj || classObj.TeacherID !== session.refId) {
      throw new Error("Không có quyền xem điểm số của lớp này");
    }
  }
  
  var allGrades = getSheetData("DIEM_SO");
  var classGrades = allGrades.filter(function(g) { return g.ClassID === classId; });
  var students = getSheetData("HOC_VIEN");
  
  return classGrades.map(function(g) {
    var student = students.find(function(s) { return s.StudentID === g.StudentID; });
    return {
      recordId: g.RecordID,
      studentId: g.StudentID,
      studentName: student ? student.FullName : "N/A",
      assignmentName: g.AssignmentName,
      grade: parseFloat(g.Grade) || 0,
      feedback: g.Feedback || ""
    };
  });
}

// 12. Tính thứ hạng GPA của học viên trong lớp
function getStudentRankInClass(studentId, classId) {
  var enrollments = getSheetData("GHI_DANH");
  var grades = getSheetData("DIEM_SO");
  
  var classStudents = enrollments
    .filter(function(enr) { return enr.ClassID === classId; })
    .map(function(enr) { return enr.StudentID; });
  
  if (classStudents.length === 0) return { rank: 1, total: 1 };
  
  var studentGPAs = [];
  classStudents.forEach(function(sId) {
    var sGrades = grades.filter(function(g) {
      return g.StudentID === sId && g.ClassID === classId;
    });
    var sum = 0;
    sGrades.forEach(function(g) { sum += parseFloat(g.Grade) || 0; });
    var gpa = sGrades.length > 0 ? (sum / sGrades.length) : 0;
    studentGPAs.push({ studentId: sId, gpa: gpa });
  });
  
  studentGPAs.sort(function(a, b) { return b.gpa - a.gpa; });
  
  var rank = 1;
  for (var i = 0; i < studentGPAs.length; i++) {
    if (studentGPAs[i].studentId === studentId) {
      rank = i + 1;
      break;
    }
  }
  
  return { rank: rank, total: studentGPAs.length };
}

// 13. Gửi đánh giá và góp ý của học viên
function submitStudentFeedback(data, studentId) {
  var feedbackId = "FB_" + Utilities.formatDate(new Date(), "GMT+7", "yyyyMMdd") + "_" + Math.floor(1000 + Math.random() * 9000);
  var dateStr = Utilities.formatDate(new Date(), "GMT+7", "yyyy-MM-dd");
  
  appendRowData("GOP_Y_HOC_VIEN", {
    FeedbackID: feedbackId,
    StudentID: studentId,
    ClassID: data.classId,
    TeacherRating: parseInt(data.rating) || 5,
    TeacherComment: data.teacherComment || "",
    Suggestion: data.suggestion || "",
    Date: dateStr
  });
  
  return { success: true, data: { feedbackId: feedbackId } };
}

// 14. Lịch sử xét duyệt điểm danh
function getApprovalHistoryList(session) {
  if (session.role !== "ADMIN" && session.role !== "QUAN_SINH") {
    throw new Error("Không có quyền truy cập lịch sử duyệt!");
  }
  
  var attendances = getSheetData("DIEM_DANH");
  var classes = getSheetData("LOPHOC");
  var accounts = getSheetData("TAI_KHOAN");
  
  var teacherMap = {};
  accounts.forEach(function(acc) {
    if (acc.Role === "GIAO_VIEN") {
      teacherMap[acc.RefID] = acc.FullName;
    }
  });
  
  var historyAtts = attendances.filter(function(att) {
    return att.Trang_Thai_Duyet === "Đã duyệt" || att.Trang_Thai_Duyet === "Từ chối";
  });
  
  var groups = {};
  historyAtts.forEach(function(att) {
    var key = att.ClassID + "_" + att.SessionNumber;
    if (!groups[key]) {
      var cls = classes.find(function(c) { return c.ClassID === att.ClassID; });
      groups[key] = {
        classId: att.ClassID,
        className: cls ? cls.ClassName : "Lớp đã xóa",
        sessionNumber: att.SessionNumber,
        date: parseDateToString(att.Date),
        teacherName: cls ? (teacherMap[cls.TeacherID] || "Chưa phân công") : "N/A",
        status: att.Trang_Thai_Duyet,
        studentCount: 0
      };
    }
    groups[key].studentCount++;
  });
  
  var result = [];
  Object.keys(groups).forEach(function(key) {
    result.push(groups[key]);
  });
  
  result.sort(function(a, b) {
    return b.date.localeCompare(a.date);
  });
  
  return result;
}

function disburseTeacherSalary(teacherId, month) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("DIEM_DANH");
  var lastRow = sheet.getLastRow();
  if (lastRow <= 1) return { success: false, error: "Không tìm thấy dữ liệu điểm danh!" };
  
  var classes = getSheetData("LOPHOC");
  var teacherClasses = classes.filter(function(c) {
    return c.TeacherID === teacherId;
  });
  var classIds = teacherClasses.map(function(c) { return c.ClassID; });
  
  if (classIds.length === 0) {
    return { success: true, data: { count: 0, message: "Giáo viên không phụ trách lớp nào" } };
  }
  
  var dataRange = sheet.getRange(1, 1, lastRow, sheet.getLastColumn());
  var data = dataRange.getValues();
  var headers = data[0];
  
  var idxClass = headers.indexOf("ClassID");
  var idxDate = headers.indexOf("Date");
  var idxApproval = headers.indexOf("Trang_Thai_Duyet");
  var idxPayment = headers.indexOf("Trang_Thai_Thanh_Toan");
  
  if (idxClass === -1 || idxDate === -1) {
    return { success: false, error: "Lỗi cấu trúc cột sheet DIEM_DANH (Thiếu ClassID hoặc Date)!" };
  }
  
  // Tự động bổ sung cột Trang_Thai_Duyet nếu thiếu
  if (idxApproval === -1) {
    var lastCol = sheet.getLastColumn();
    var newColIdx = lastCol + 1;
    sheet.getRange(1, newColIdx).setValue("Trang_Thai_Duyet").setFontWeight("bold").setBackground("#f3f4f6");
    if (lastRow > 1) {
      var fillRange = sheet.getRange(2, newColIdx, lastRow - 1, 1);
      var fillValues = [];
      for (var r = 2; r <= lastRow; r++) {
        fillValues.push(["Đã duyệt"]);
      }
      fillRange.setValues(fillValues);
    }
    // Reload headers
    dataRange = sheet.getRange(1, 1, lastRow, sheet.getLastColumn());
    data = dataRange.getValues();
    headers = data[0];
    idxApproval = headers.indexOf("Trang_Thai_Duyet");
    idxPayment = headers.indexOf("Trang_Thai_Thanh_Toan");
  }
  
  // Tự động bổ sung cột Trang_Thai_Thanh_Toan nếu thiếu
  if (idxPayment === -1) {
    var lastCol = sheet.getLastColumn();
    var newColIdx = lastCol + 1;
    sheet.getRange(1, newColIdx).setValue("Trang_Thai_Thanh_Toan").setFontWeight("bold").setBackground("#f3f4f6");
    if (lastRow > 1) {
      var fillRange = sheet.getRange(2, newColIdx, lastRow - 1, 1);
      var fillValues = [];
      for (var r = 2; r <= lastRow; r++) {
        fillValues.push(["Chưa thanh toán"]);
      }
      fillRange.setValues(fillValues);
    }
    // Reload headers
    dataRange = sheet.getRange(1, 1, lastRow, sheet.getLastColumn());
    data = dataRange.getValues();
    headers = data[0];
    idxPayment = headers.indexOf("Trang_Thai_Thanh_Toan");
  }
  
  var count = 0;
  
  for (var i = 1; i < data.length; i++) {
    var rowClass = data[i][idxClass];
    var rowDate = data[i][idxDate];
    var rowApproval = data[i][idxApproval];
    var rowPayment = data[i][idxPayment];
    
    var approvedStatus = rowApproval || "Đã duyệt";
    var paymentStatus = rowPayment || "Chưa thanh toán";
    
    if (classIds.indexOf(rowClass) !== -1 && approvedStatus === "Đã duyệt" && paymentStatus !== "Đã thanh toán") {
      var dateStr = parseMonthFromValue(rowDate);
      
      if (dateStr === month) {
        sheet.getRange(i + 1, idxPayment + 1).setValue("Đã thanh toán");
        count++;
      }
    }
  }
  
  return { success: true, data: { count: count, teacherId: teacherId, month: month } };
}
