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
      case "getFolders":
        var grade = e.parameter.grade;
        var level = e.parameter.level;
        var subject = e.parameter.subject;
        result = getFolders(grade, level, subject, userSession);
        break;
      case "getDriveFiles":
        result = getDriveFiles(userSession);
        break;
      case "getFolderFiles":
        var folderId = e.parameter.folderId;
        result = getFolderFiles(folderId, userSession);
        break;
      case "getClassMaterials":
        var classId = e.parameter.classId;
        result = getClassMaterials(classId, userSession);
        break;
      case "getExamTemplates":
        result = getExamTemplatesList();
        break;
      case "getExamDetail":
        var examId = e.parameter.examId;
        result = getExamDetail(examId, userSession);
        break;
      case "getExamResult":
        var attemptId = e.parameter.attemptId;
        result = getExamResult(attemptId, userSession);
        break;
      case "getStudentAttemptHistory":
        var studentId = e.parameter.studentId;
        var examId = e.parameter.examId;
        result = getStudentAttemptHistory(studentId, examId, userSession);
        break;
      case "getStudentResultDashboard":
        var studentId = e.parameter.studentId;
        result = getStudentResultDashboard(studentId, userSession);
        break;
      case "getClassResultDashboard":
        var classId = e.parameter.classId;
        result = getClassResultDashboard(classId, userSession);
        break;
      case "getAssignmentStats":
        var classId = e.parameter.classId;
        var assignmentName = e.parameter.assignmentName;
        result = getAssignmentStatsData(classId, assignmentName, userSession);
        break;
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
      case "createFolder":
        result = createFolder(postData, userSession);
        break;
      case "updateFolder":
        result = updateFolder(postData, userSession);
        break;
      case "deleteFolder":
        result = deleteFolder(postData.folderId, userSession);
        break;
      case "createFilePDF":
        result = createFilePDF(postData, userSession);
        break;
      case "deleteFile":
        result = deleteFile(postData.fileId, userSession);
        break;
      case "assignMaterialToClass":
        result = assignMaterialToClass(postData, userSession);
        break;
      case "removeMaterialFromClass":
        result = removeMaterialFromClass(postData, userSession);
        break;
      case "updateMaterialLink":
        result = updateMaterialLink(postData, userSession);
        break;
      case "createExamTemplate":
        result = createExamTemplate(postData, userSession);
        break;
      case "updateExamTemplate":
        result = updateExamTemplate(postData, userSession);
        break;
      case "createCustomExam":
        result = createCustomExam(postData, userSession);
        break;
      case "createExam":
        result = createExam(postData, userSession);
        break;
      case "parseLatexSection":
        result = parseLatexSection(postData, userSession);
        break;
      case "saveExamSection":
        result = saveExamSection(postData, userSession);
        break;
      case "publishExam":
        result = publishExam(postData, userSession);
        break;
      case "archiveExam":
        result = archiveExam(postData, userSession);
        break;
      case "startExam":
        result = startExam(postData.classId, postData.examId, userSession);
        break;
      case "saveExamProgress":
        result = saveExamProgress(postData, userSession);
        break;
      case "submitExam":
        result = submitExam(postData, userSession);
        break;
      case "gradeEssayAnswer":
        result = gradeEssayAnswer(postData, userSession);
        break;
      case "submitManualGrade":
      case "updateManualGrade":
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
  var recordId = "";
  
  for (var i = 1; i < dataRange.length; i++) {
    if (dataRange[i][idxClass] === classId && 
        dataRange[i][idxStudent] === studentId && 
        dataRange[i][idxAssignment] === assignmentName) {
      existingRowIdx = i + 1; // 1-based index
      recordId = dataRange[i][idxId];
      break;
    }
  }
  
  var action = "created";
  if (existingRowIdx !== -1) {
    // Update existing grade
    sheet.getRange(existingRowIdx, idxGrade + 1).setValue(grade);
    sheet.getRange(existingRowIdx, idxFeedback + 1).setValue(feedback);
    action = "updated";
  } else {
    // Create new grade
    recordId = "GRD_" + Utilities.formatDate(new Date(), "GMT+7", "yyyyMMdd") + "_" + Math.floor(1000 + Math.random() * 9000);
    appendRowData("DIEM_SO", {
      RecordID: recordId,
      ClassID: classId,
      StudentID: studentId,
      AssignmentName: assignmentName,
      Grade: grade,
      Feedback: feedback
    });
  }
  
  // SYNC TO KET_QUA_HOC_TAP
  var classes = [];
  try {
    classes = getSheetData("LOPHOC");
  } catch(e) {}
  var matchedClass = classes.find(function(c) { return c.ClassID === classId; });
  var teacherId = matchedClass ? matchedClass.TeacherID : "ADMIN_01";
  
  var todayStr = Utilities.formatDate(new Date(), "GMT+7", "yyyy-MM-dd");
  
  var kqSheet = ss.getSheetByName("KET_QUA_HOC_TAP");
  var kqRows = kqSheet.getRange(1, 1, kqSheet.getLastRow(), kqSheet.getLastColumn()).getValues();
  var kqHeaders = kqRows[0];
  
  var idxKqStudent = kqHeaders.indexOf("StudentID");
  var idxKqClass = kqHeaders.indexOf("ClassID");
  var idxKqAssign = kqHeaders.indexOf("AssignmentName");
  var idxKqSource = kqHeaders.indexOf("Source_Type");
  var idxKqScore = kqHeaders.indexOf("Score");
  var idxKqMaxScore = kqHeaders.indexOf("MaxScore");
  var idxKqNormScore = kqHeaders.indexOf("NormalizedScore");
  var idxKqFeedback = kqHeaders.indexOf("Feedback");
  var idxKqRecordedBy = kqHeaders.indexOf("RecordedBy");
  var idxKqDate = kqHeaders.indexOf("RecordedDate");
  
  var existingKqRowIdx = -1;
  for (var r = 1; r < kqRows.length; r++) {
    if (kqRows[r][idxKqStudent] === studentId && 
        kqRows[r][idxKqClass] === classId && 
        kqRows[r][idxKqAssign] === assignmentName && 
        kqRows[r][idxKqSource] === "MANUAL") {
      existingKqRowIdx = r + 1;
      break;
    }
  }
  
  if (existingKqRowIdx !== -1) {
    kqSheet.getRange(existingKqRowIdx, idxKqScore + 1).setValue(grade);
    kqSheet.getRange(existingKqRowIdx, idxKqNormScore + 1).setValue(grade);
    kqSheet.getRange(existingKqRowIdx, idxKqFeedback + 1).setValue(feedback);
    kqSheet.getRange(existingKqRowIdx, idxKqRecordedBy + 1).setValue(teacherId);
    kqSheet.getRange(existingKqRowIdx, idxKqDate + 1).setValue(todayStr);
  } else {
    var resultId = "RES_" + Utilities.formatDate(new Date(), "GMT+7", "yyyyMMdd") + "_" + Math.floor(1000 + Math.random() * 9000);
    appendRowData("KET_QUA_HOC_TAP", {
      ResultID: resultId,
      StudentID: studentId,
      ClassID: classId,
      AssignmentName: assignmentName,
      Source_Type: "MANUAL",
      AttemptID: "",
      Score: grade,
      MaxScore: 10,
      NormalizedScore: grade,
      Feedback: feedback,
      RecordedBy: teacherId,
      RecordedDate: todayStr,
      AttemptNumber: 1,
      IsBestAttempt: true
    });
  }
  
  recalculateBestAttempt(studentId, classId, assignmentName);
  
  return { success: true, data: { action: action, recordId: recordId } };
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
  
  var attendances = getSheetData("DIEM_DANH");
  
  var classRateMap = {};
  classes.forEach(function(c) {
    classRateMap[c.ClassID] = parseFloat(c.Hoc_Phi_Theo_Buoi) || 200000;
  });

  var attCountMap = {};
  attendances.forEach(function(att) {
    if (att.Trang_Thai_Duyet === "Da duyệt" || !att.Trang_Thai_Duyet) {
      var key = att.StudentID + "_" + att.ClassID;
      attCountMap[key] = (attCountMap[key] || 0) + 1;
    }
  });

  var txnPaidMap = {};
  transactions.forEach(function(txn) {
    var key = txn.StudentID + "_" + txn.ClassID;
    var amt = parseFloat(txn.SoTien) || 0;
    if (txn.Loai === "Thu") {
      txnPaidMap[key] = (txnPaidMap[key] || 0) + amt;
    } else if (txn.Loai === "Hoàn" || txn.Loai === "Chuyển") {
      txnPaidMap[key] = (txnPaidMap[key] || 0) - amt;
    }
  });

  var billingList = [];
  
  enrollments.forEach(function(enr) {
    var key = enr.StudentID + "_" + enr.ClassID;
    var rate = classRateMap[enr.ClassID] || 200000;
    var sessionsCount = attCountMap[key] || 0;
    var totalPaid = txnPaidMap[key] || 0;
    var debt = (sessionsCount * rate) - totalPaid;

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
        folderId: p.FolderID,
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

function getDriveFiles(session) {
  if (session.role !== "ADMIN" && session.role !== "GIAO_VIEN") {
    throw new Error("Không có quyền truy cập Google Drive!");
  }
  
  var folderId = PropertiesService.getScriptProperties().getProperty("DRIVE_FOLDER_ID") || "";
  if (!folderId) {
    return [
      { id: "mock_pdf_01", name: "Đề thi thử THPT Quốc gia môn Toán.pdf", url: "https://example.com/mock_thpt.pdf", type: "PDF" },
      { id: "mock_pdf_02", name: "Chuyên đề Hình học phẳng nâng cao.pdf", url: "https://example.com/mock_hinh.pdf", type: "PDF" }
    ];
  }
  
  try {
    var folder = DriveApp.getFolderById(folderId);
    var files = folder.getFiles();
    var result = [];
    while (files.hasNext()) {
      var file = files.next();
      var mime = file.getMimeType();
      var type = "PDF";
      if (mime === MimeType.GOOGLE_SHEETS || mime === "application/vnd.google-apps.spreadsheet") {
        type = "SHEET";
      } else if (mime === MimeType.GOOGLE_DOCS || mime === "application/vnd.google-apps.document") {
        type = "DOC";
      } else if (mime === MimeType.GOOGLE_SLIDES || mime === "application/vnd.google-apps.presentation") {
        type = "SLIDE";
      } else if (mime === "application/pdf") {
        type = "PDF";
      }
      
      result.push({
        id: file.getId(),
        name: file.getName(),
        url: file.getUrl(),
        type: type,
        mimeType: mime
      });
    }
    return result;
  } catch (err) {
    throw new Error("Lỗi truy cập thư mục Google Drive: " + err.toString());
  }
}

// --- MODULE 1: THƯ VIỆN HỌC LIỆU ---

function getFolders(grade, level, subject, session) {
  var folders = getSheetData("FOLDER_CHUYEN_DE");
  var activeFolders = folders.filter(function(f) { return f.IsActive === true || f.IsActive === "TRUE"; });
  
  if (grade) {
    activeFolders = activeFolders.filter(function(f) { return f.Grade === grade; });
  }
  if (level) {
    activeFolders = activeFolders.filter(function(f) { return f.Level === level; });
  }
  if (subject) {
    activeFolders = activeFolders.filter(function(f) { return f.Subject === subject; });
  }
  
  return activeFolders.map(function(f) {
    return {
      folderId: f.FolderID,
      folderName: f.FolderName,
      subject: f.Subject,
      grade: f.Grade,
      level: f.Level,
      sortOrder: parseFloat(f.SortOrder) || 99,
      description: f.Description,
      createdBy: f.CreatedBy,
      createdDate: parseDateToString(f.CreatedDate)
    };
  }).sort(function(a, b) { return a.sortOrder - b.sortOrder; });
}

function getFolderFiles(folderId, session) {
  var allFiles = getSheetData("FILE_HOC_LIEU");
  var folderFiles = allFiles.filter(function(f) { return f.FolderID === folderId; });
  
  if (session.role === "HOC_VIEN") {
    var enrollments = getSheetData("GHI_DANH");
    var studentClassIds = enrollments
      .filter(function(enr) { return enr.StudentID === session.refId; })
      .map(function(enr) { return enr.ClassID; });
      
    var links = getSheetData("CLASS_MATERIAL_LINK");
    var assignedFileIds = links
      .filter(function(lnk) { 
        return studentClassIds.indexOf(lnk.ClassID) !== -1 && 
               lnk.FileID && 
               lnk.IsActive !== false && 
               lnk.IsVisible !== false; 
      })
      .map(function(lnk) { return lnk.FileID; });
      
    folderFiles = folderFiles.filter(function(f) { return assignedFileIds.indexOf(f.FileID) !== -1; });
  }
  
  return folderFiles.map(function(f) {
    return {
      fileId: f.FileID,
      folderId: f.FolderID,
      fileName: f.FileName,
      fileType: f.FileType,
      fileUrl: f.FileURL,
      examId: f.ExamID,
      uploadedBy: f.UploadedBy,
      uploadedDate: parseDateToString(f.UploadedDate),
      description: f.Description,
      isGlobal: f.IsGlobal === true || f.IsGlobal === "TRUE"
    };
  });
}

function getClassMaterials(classId, session) {
  if (session.role === "HOC_VIEN") {
    var enrollments = getSheetData("GHI_DANH");
    var isEnrolled = enrollments.some(function(enr) {
      return enr.StudentID === session.refId && enr.ClassID === classId;
    });
    if (!isEnrolled) throw new Error("Học viên không ghi danh trong lớp này!");
  } else if (session.role === "GIAO_VIEN") {
    var classes = getSheetData("LOPHOC");
    var cls = classes.find(function(c) { return c.ClassID === classId; });
    if (!cls || cls.TeacherID !== session.refId) {
      throw new Error("Giáo viên không phụ trách lớp này!");
    }
  }
  
  var links = getSheetData("CLASS_MATERIAL_LINK");
  var files = getSheetData("FILE_HOC_LIEU");
  var folders = getSheetData("FOLDER_CHUYEN_DE");
  
  var classLinks = links.filter(function(lnk) {
    var isMatch = lnk.ClassID === classId && lnk.IsActive !== false;
    if (session.role === "HOC_VIEN") {
      return isMatch && lnk.IsVisible !== false;
    }
    return isMatch;
  });
  
  return classLinks.map(function(lnk) {
    var f = files.find(function(file) { return file.FileID === lnk.FileID; });
    var folder = null;
    if (f && f.FolderID) {
      folder = folders.find(function(fol) { return fol.FolderID === f.FolderID; });
    }
    return {
      linkId: lnk.LinkID,
      classId: lnk.ClassID,
      fileId: lnk.FileID,
      fileName: f ? f.FileName : "File đã bị xóa",
      fileType: f ? f.FileType : "N/A",
      fileUrl: f ? f.FileURL : "",
      folderId: f ? f.FolderID : null,
      folderName: folder ? folder.FolderName : "",
      topicName: lnk.TopicName || "",
      description: f ? f.Description : "",
      examId: f ? f.ExamID : "",
      assignedBy: lnk.AssignedBy,
      assignedDate: parseDateToString(lnk.AssignedDate),
      dueDate: parseDateToString(lnk.DueDate),
      isVisible: lnk.IsVisible === true || lnk.IsVisible === "TRUE",
      sortOrder: parseFloat(lnk.SortOrder) || 99,
      maxAttempts: lnk.MaxAttempts !== "" && lnk.MaxAttempts !== null && lnk.MaxAttempts !== undefined ? parseInt(lnk.MaxAttempts) : null
    };
  }).sort(function(a, b) { return a.sortOrder - b.sortOrder; });
}

function createFolder(data, session) {
  if (session.role !== "ADMIN") throw new Error("Chỉ ADMIN mới có quyền tạo thư mục!");
  var folderId = "FLD_" + Utilities.formatDate(new Date(), "GMT+7", "yyyyMMdd") + "_" + Math.floor(100 + Math.random() * 900);
  var todayStr = Utilities.formatDate(new Date(), "GMT+7", "yyyy-MM-dd");
  
  appendRowData("FOLDER_CHUYEN_DE", {
    FolderID: folderId,
    FolderName: data.folderName,
    Subject: data.subject,
    Grade: data.grade,
    Level: data.level,
    SortOrder: parseFloat(data.sortOrder) || 99,
    Description: data.description || "",
    CreatedBy: session.refId,
    CreatedDate: todayStr,
    IsActive: true
  });
  return { success: true, data: { folderId: folderId } };
}

function updateFolder(data, session) {
  if (session.role !== "ADMIN") throw new Error("Chỉ ADMIN mới có quyền cập nhật thư mục!");
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("FOLDER_CHUYEN_DE");
  var lastRow = sheet.getLastRow();
  if (lastRow <= 1) throw new Error("Không có thư mục nào!");
  
  var folderId = data.folderId;
  var rowData = sheet.getRange(1, 1, lastRow, sheet.getLastColumn()).getValues();
  var headers = rowData[0];
  
  var idxId = headers.indexOf("FolderID");
  var idxName = headers.indexOf("FolderName");
  var idxDesc = headers.indexOf("Description");
  var idxSort = headers.indexOf("SortOrder");
  
  var foundIdx = -1;
  for (var i = 1; i < rowData.length; i++) {
    if (rowData[i][idxId] === folderId) {
      foundIdx = i + 1;
      break;
    }
  }
  
  if (foundIdx === -1) throw new Error("Không tìm thấy thư mục: " + folderId);
  
  if (data.folderName !== undefined) sheet.getRange(foundIdx, idxName + 1).setValue(data.folderName);
  if (data.description !== undefined) sheet.getRange(foundIdx, idxDesc + 1).setValue(data.description);
  if (data.sortOrder !== undefined) sheet.getRange(foundIdx, idxSort + 1).setValue(parseFloat(data.sortOrder) || 99);
  
  return { success: true, data: { folderId: folderId } };
}

function deleteFolder(folderId, session) {
  if (session.role !== "ADMIN") throw new Error("Chỉ ADMIN mới có quyền xóa thư mục!");
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  
  var files = getSheetData("FILE_HOC_LIEU");
  var fileIdsInFolder = files
    .filter(function(f) { return f.FolderID === folderId; })
    .map(function(f) { return f.FileID; });
    
  if (fileIdsInFolder.length > 0) {
    var linksSheet = ss.getSheetByName("CLASS_MATERIAL_LINK");
    if (linksSheet && linksSheet.getLastRow() > 1) {
      var linksRows = linksSheet.getRange(1, 1, linksSheet.getLastRow(), linksSheet.getLastColumn()).getValues();
      var idxLinkFileId = linksRows[0].indexOf("FileID");
      for (var r = linksRows.length - 1; r >= 1; r--) {
        if (fileIdsInFolder.indexOf(linksRows[r][idxLinkFileId]) !== -1) {
          linksSheet.deleteRow(r + 1);
        }
      }
    }
    
    var filesSheet = ss.getSheetByName("FILE_HOC_LIEU");
    if (filesSheet && filesSheet.getLastRow() > 1) {
      var filesRows = filesSheet.getRange(1, 1, filesSheet.getLastRow(), filesSheet.getLastColumn()).getValues();
      var idxFileId = filesRows[0].indexOf("FileID");
      for (var r = filesRows.length - 1; r >= 1; r--) {
        if (fileIdsInFolder.indexOf(filesRows[r][idxFileId]) !== -1) {
          filesSheet.deleteRow(r + 1);
        }
      }
    }
  }
  
  var foldersSheet = ss.getSheetByName("FOLDER_CHUYEN_DE");
  if (foldersSheet && foldersSheet.getLastRow() > 1) {
    var foldersRows = foldersSheet.getRange(1, 1, foldersSheet.getLastRow(), foldersSheet.getLastColumn()).getValues();
    var idxFolderId = foldersRows[0].indexOf("FolderID");
    for (var r = foldersRows.length - 1; r >= 1; r--) {
      if (foldersRows[r][idxFolderId] === folderId) {
        foldersSheet.deleteRow(r + 1);
      }
    }
  }
  
  return { success: true };
}

function createFilePDF(data, session) {
  if (session.role !== "ADMIN" && session.role !== "GIAO_VIEN") {
    throw new Error("Chỉ ADMIN hoặc Giáo viên mới có quyền upload file!");
  }
  
  var fileId = "FILE_" + Utilities.formatDate(new Date(), "GMT+7", "yyyyMMdd") + "_" + Math.floor(100 + Math.random() * 900);
  var todayStr = Utilities.formatDate(new Date(), "GMT+7", "yyyy-MM-dd");
  
  appendRowData("FILE_HOC_LIEU", {
    FileID: fileId,
    FolderID: data.folderId,
    FileName: data.fileName,
    FileType: "PDF",
    FileURL: data.fileUrl,
    ExamID: "",
    UploadedBy: session.refId,
    UploadedDate: todayStr,
    Description: data.description || "",
    IsGlobal: data.isGlobal === true || data.isGlobal === "TRUE"
  });
  
  return { success: true, data: { fileId: fileId } };
}

function deleteFile(fileId, session) {
  if (session.role !== "ADMIN") throw new Error("Chỉ ADMIN mới có quyền xóa file!");
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  
  var linksSheet = ss.getSheetByName("CLASS_MATERIAL_LINK");
  if (linksSheet && linksSheet.getLastRow() > 1) {
    var linksRows = linksSheet.getRange(1, 1, linksSheet.getLastRow(), linksSheet.getLastColumn()).getValues();
    var idxLinkFileId = linksRows[0].indexOf("FileID");
    for (var r = linksRows.length - 1; r >= 1; r--) {
      if (linksRows[r][idxLinkFileId] === fileId) {
        linksSheet.deleteRow(r + 1);
      }
    }
  }
  
  var filesSheet = ss.getSheetByName("FILE_HOC_LIEU");
  if (filesSheet && filesSheet.getLastRow() > 1) {
    var filesRows = filesSheet.getRange(1, 1, filesSheet.getLastRow(), filesSheet.getLastColumn()).getValues();
    var idxFileId = filesRows[0].indexOf("FileID");
    for (var r = filesRows.length - 1; r >= 1; r--) {
      if (filesRows[r][idxFileId] === fileId) {
        filesSheet.deleteRow(r + 1);
      }
    }
  }
  
  return { success: true };
}

function assignMaterialToClass(data, session) {
  if (session.role !== "ADMIN" && session.role !== "GIAO_VIEN") {
    throw new Error("Không có quyền gán học liệu!");
  }
  
  var classId = data.classId;
  var fileId = data.fileId;
  
  var classes = getSheetData("LOPHOC");
  var cls = classes.find(function(c) { return c.ClassID === classId; });
  if (!cls) throw new Error("Lớp học không tồn tại: " + classId);
  if (session.role === "GIAO_VIEN" && cls.TeacherID !== session.refId) {
    throw new Error("Giáo viên không phụ trách lớp này!");
  }
  
  var files = getSheetData("FILE_HOC_LIEU");
  var fileObj = files.find(function(f) { return f.FileID === fileId; });
  if (!fileObj) throw new Error("File học liệu không tồn tại: " + fileId);
  
  var folders = getSheetData("FOLDER_CHUYEN_DE");
  var folderObj = folders.find(function(f) { return f.FolderID === fileObj.FolderID; });
  if (!folderObj) throw new Error("Thư mục của file học liệu không tồn tại!");
  
  var classGrade = (cls.Grade || "Lớp 9").trim().toLowerCase();
  var classLevel = (cls.Level || "Cơ bản").trim().toLowerCase();
  var classSubject = (cls.Subject || "Toán").trim().toLowerCase();
  
  var folderGrade = folderObj.Grade ? folderObj.Grade.trim().toLowerCase() : "";
  var folderLevel = folderObj.Level ? folderObj.Level.trim().toLowerCase() : "";
  var folderSubject = folderObj.Subject ? folderObj.Subject.trim().toLowerCase() : "";
  
  if (folderGrade && folderGrade !== classGrade) {
    throw new Error("Khối lớp của thư mục (" + folderObj.Grade + ") không khớp với lớp học (" + cls.Grade + ")");
  }
  if (folderLevel && folderLevel !== classLevel) {
    throw new Error("Trình độ của thư mục (" + folderObj.Level + ") không khớp với lớp học (" + cls.Level + ")");
  }
  if (folderSubject && folderSubject !== classSubject) {
    throw new Error("Môn học của thư mục (" + folderObj.Subject + ") không khớp với lớp học (" + cls.Subject + ")");
  }
  
  var links = getSheetData("CLASS_MATERIAL_LINK");
  var existingLink = links.find(function(lnk) {
    return lnk.ClassID === classId && lnk.FileID === fileId && lnk.IsActive !== false && lnk.IsActive !== "FALSE";
  });
  if (existingLink) {
    throw new Error("File học liệu này đã được gán cho lớp rồi!");
  }
  
  var linkId = "LNK_" + Utilities.formatDate(new Date(), "GMT+7", "yyyyMMdd") + "_" + Math.floor(100 + Math.random() * 900);
  var todayStr = Utilities.formatDate(new Date(), "GMT+7", "yyyy-MM-dd");
  
  appendRowData("CLASS_MATERIAL_LINK", {
    LinkID: linkId,
    ClassID: classId,
    FileID: fileId,
    AssignedBy: session.refId,
    AssignedDate: todayStr,
    DueDate: data.dueDate || "",
    IsVisible: data.isVisible !== undefined ? (data.isVisible === true || data.isVisible === "TRUE") : true,
    SortOrder: parseFloat(data.sortOrder) || 99,
    MaxAttempts: data.maxAttempts !== undefined && data.maxAttempts !== "" ? parseInt(data.maxAttempts) : "",
    TopicName: data.folderName || "",
    IsActive: true
  });
  
  return { success: true, data: { linkId: linkId } };
}

function removeMaterialFromClass(data, session) {
  if (session.role !== "ADMIN" && session.role !== "GIAO_VIEN") {
    throw new Error("Không có quyền gỡ học liệu!");
  }
  
  var classId = data.classId;
  var fileId = data.fileId;
  
  if (session.role === "GIAO_VIEN") {
    var classes = getSheetData("LOPHOC");
    var cls = classes.find(function(c) { return c.ClassID === classId; });
    if (!cls || cls.TeacherID !== session.refId) {
      throw new Error("Giáo viên không phụ trách lớp này!");
    }
  }
  
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("CLASS_MATERIAL_LINK");
  var lastRow = sheet.getLastRow();
  if (lastRow <= 1) throw new Error("Không có liên kết học liệu nào!");
  
  var rowData = sheet.getRange(1, 1, lastRow, sheet.getLastColumn()).getValues();
  var headers = rowData[0];
  
  var idxClass = headers.indexOf("ClassID");
  var idxFile = headers.indexOf("FileID");
  var idxActive = headers.indexOf("IsActive");
  
  var count = 0;
  for (var i = 1; i < rowData.length; i++) {
    if (rowData[i][idxClass] === classId && rowData[i][idxFile] === fileId) {
      sheet.getRange(i + 1, idxActive + 1).setValue(false);
      count++;
    }
  }
  
  return { success: true, data: { updatedCount: count } };
}

function updateMaterialLink(data, session) {
  if (session.role !== "ADMIN" && session.role !== "GIAO_VIEN") {
    throw new Error("Không có quyền cập nhật liên kết học liệu!");
  }
  
  var linkId = data.linkId;
  
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("CLASS_MATERIAL_LINK");
  var lastRow = sheet.getLastRow();
  if (lastRow <= 1) throw new Error("Không có liên kết học liệu nào!");
  
  var rowData = sheet.getRange(1, 1, lastRow, sheet.getLastColumn()).getValues();
  var headers = rowData[0];
  
  var idxId = headers.indexOf("LinkID");
  var idxClass = headers.indexOf("ClassID");
  var idxDue = headers.indexOf("DueDate");
  var idxVisible = headers.indexOf("IsVisible");
  var idxSort = headers.indexOf("SortOrder");
  var idxMaxAttempts = headers.indexOf("MaxAttempts");
  
  var foundIdx = -1;
  for (var i = 1; i < rowData.length; i++) {
    if (rowData[i][idxId] === linkId) {
      foundIdx = i + 1;
      break;
    }
  }
  
  if (foundIdx === -1) throw new Error("Không tìm thấy liên kết học liệu: " + linkId);
  
  if (session.role === "GIAO_VIEN") {
    var classId = rowData[foundIdx - 1][idxClass];
    var classes = getSheetData("LOPHOC");
    var cls = classes.find(function(c) { return c.ClassID === classId; });
    if (!cls || cls.TeacherID !== session.refId) {
      throw new Error("Giáo viên không phụ trách lớp này!");
    }
  }
  
  if (data.dueDate !== undefined) sheet.getRange(foundIdx, idxDue + 1).setValue(data.dueDate);
  if (data.isVisible !== undefined) sheet.getRange(foundIdx, idxVisible + 1).setValue(data.isVisible === true || data.isVisible === "TRUE");
  if (data.sortOrder !== undefined) sheet.getRange(foundIdx, idxSort + 1).setValue(parseFloat(data.sortOrder) || 99);
  if (data.maxAttempts !== undefined) sheet.getRange(foundIdx, idxMaxAttempts + 1).setValue(data.maxAttempts !== "" && data.maxAttempts !== null ? parseInt(data.maxAttempts) : "");
  
  return { success: true };
}


// --- MODULE 2: SOẠN ĐỀ THI ---

function createExamTemplate(data, session) {
  if (session.role !== "ADMIN") throw new Error("Chỉ ADMIN mới có quyền tạo template!");
  var templateId = "TPL_EX_" + Math.floor(100 + Math.random() * 900);
  
  appendRowData("EXAM_TEMPLATE", {
    TemplateID: templateId,
    TemplateName: data.templateName,
    Subject: data.subject,
    Grade: data.grade,
    TotalDuration: parseFloat(data.totalDuration) || 90,
    MaxScore: parseFloat(data.maxScore) || 10,
    Description: data.description || "",
    CreatedBy: session.refId
  });
  
  if (data.sections && data.sections.length > 0) {
    data.sections.forEach(function(s, idx) {
      var sectionTypeId = "SCT_" + Math.floor(100 + Math.random() * 900);
      appendRowData("EXAM_SECTION_TYPE", {
        SectionTypeID: sectionTypeId,
        TemplateID: templateId,
        SectionName: s.sectionName,
        QuestionType: s.questionType,
        QuestionCount: parseInt(s.questionCount) || 1,
        PointsPerQuestion: parseFloat(s.pointsPerQuestion) || 0,
        PointsPerSubQuestion: s.pointsPerSubQuestion !== undefined && s.pointsPerSubQuestion !== "" ? parseFloat(s.pointsPerSubQuestion) : "",
        SortOrder: idx + 1,
        AIParsePrompt: s.aiParsePrompt || ""
      });
    });
  }
  
  return { success: true, data: { templateId: templateId } };
}

function updateExamTemplate(data, session) {
  if (session.role !== "ADMIN") throw new Error("Chỉ ADMIN mới có quyền sửa template!");
  var templateId = data.templateId;
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("EXAM_TEMPLATE");
  var lastRow = sheet.getLastRow();
  if (lastRow <= 1) throw new Error("Không có template nào!");
  
  var rowData = sheet.getRange(1, 1, lastRow, sheet.getLastColumn()).getValues();
  var headers = rowData[0];
  
  var idxId = headers.indexOf("TemplateID");
  var idxName = headers.indexOf("TemplateName");
  var idxDuration = headers.indexOf("TotalDuration");
  var idxMax = headers.indexOf("MaxScore");
  
  var foundIdx = -1;
  for (var i = 1; i < rowData.length; i++) {
    if (rowData[i][idxId] === templateId) {
      foundIdx = i + 1;
      break;
    }
  }
  
  if (foundIdx === -1) throw new Error("Không tìm thấy template!");
  
  if (data.templateName !== undefined) sheet.getRange(foundIdx, idxName + 1).setValue(data.templateName);
  if (data.totalDuration !== undefined) sheet.getRange(foundIdx, idxDuration + 1).setValue(parseFloat(data.totalDuration));
  if (data.maxScore !== undefined) sheet.getRange(foundIdx, idxMax + 1).setValue(parseFloat(data.maxScore));
  
  if (data.sections && data.sections.length > 0) {
    var sectSheet = ss.getSheetByName("EXAM_SECTION_TYPE");
    if (sectSheet && sectSheet.getLastRow() > 1) {
      var sectRows = sectSheet.getRange(1, 1, sectSheet.getLastRow(), sectSheet.getLastColumn()).getValues();
      var idxSectTemplId = sectRows[0].indexOf("TemplateID");
      for (var r = sectRows.length - 1; r >= 1; r--) {
        if (sectRows[r][idxSectTemplId] === templateId) {
          sectSheet.deleteRow(r + 1);
        }
      }
    }
    
    data.sections.forEach(function(s, idx) {
      var sectionTypeId = "SCT_" + Math.floor(100 + Math.random() * 900);
      appendRowData("EXAM_SECTION_TYPE", {
        SectionTypeID: sectionTypeId,
        TemplateID: templateId,
        SectionName: s.sectionName,
        QuestionType: s.questionType,
        QuestionCount: parseInt(s.questionCount) || 1,
        PointsPerQuestion: parseFloat(s.pointsPerQuestion) || 0,
        PointsPerSubQuestion: s.pointsPerSubQuestion !== undefined && s.pointsPerSubQuestion !== "" ? parseFloat(s.pointsPerSubQuestion) : "",
        SortOrder: idx + 1,
        AIParsePrompt: s.aiParsePrompt || ""
      });
    });
  }
  
  return { success: true };
}

function getExamTemplatesList() {
  var templates = getSheetData("EXAM_TEMPLATE");
  var sections = getSheetData("EXAM_SECTION_TYPE");
  
  return templates.map(function(t) {
    var templateSections = sections
      .filter(function(s) { return s.TemplateID === t.TemplateID; })
      .sort(function(a, b) { return a.SortOrder - b.SortOrder; })
      .map(function(s) {
        return {
          sectionTypeId: s.SectionTypeID,
          sectionName: s.SectionName,
          questionType: s.QuestionType,
          questionCount: parseInt(s.QuestionCount) || 0,
          pointsPerQuestion: parseFloat(s.PointsPerQuestion) || 0,
          pointsPerSubQuestion: s.PointsPerSubQuestion !== "" && s.PointsPerSubQuestion !== null ? parseFloat(s.PointsPerSubQuestion) : null,
          sortOrder: s.SortOrder,
          aiParsePrompt: s.AIParsePrompt
        };
      });
      
    return {
      templateId: t.TemplateID,
      templateName: t.TemplateName,
      subject: t.Subject,
      grade: t.Grade,
      totalDuration: parseFloat(t.TotalDuration) || 90,
      maxScore: parseFloat(t.MaxScore) || 10,
      description: t.Description,
      createdBy: t.CreatedBy,
      sections: templateSections
    };
  });
}

function createExam(data, session) {
  if (session.role !== "ADMIN" && session.role !== "GIAO_VIEN") {
    throw new Error("Không có quyền tạo đề thi!");
  }
  
  var examId = "EXM_" + Utilities.formatDate(new Date(), "GMT+7", "yyyyMMdd") + "_" + Math.floor(100 + Math.random() * 900);
  var todayStr = Utilities.formatDate(new Date(), "GMT+7", "yyyy-MM-dd");
  
  var templates = getSheetData("EXAM_TEMPLATE");
  var template = templates.find(function(t) { return t.TemplateID === data.templateId; });
  if (!template) throw new Error("Template không tồn tại!");
  
  var sections = getSheetData("EXAM_SECTION_TYPE");
  var templateSections = sections.filter(function(s) { return s.TemplateID === data.templateId; });
  var totalPoints = 0;
  templateSections.forEach(function(s) {
    totalPoints += (parseInt(s.QuestionCount) || 0) * (parseFloat(s.PointsPerQuestion) || 0);
  });
  
  appendRowData("EXAM_BANK", {
    ExamID: examId,
    TemplateID: data.templateId,
    ExamName: data.examName,
    Subject: template.Subject,
    Grade: template.Grade,
    DurationMinutes: data.durationMinutes !== undefined && data.durationMinutes !== "" ? parseFloat(data.durationMinutes) : parseFloat(template.TotalDuration),
    TotalPoints: totalPoints,
    CreatedBy: session.refId,
    CreatedDate: todayStr,
    Status: "DRAFT",
    ShuffleQuestions: data.shuffleQuestions === true || data.shuffleQuestions === "TRUE",
    ShuffleOptions: data.shuffleOptions === true || data.shuffleOptions === "TRUE"
  });
  
  return { success: true, data: { examId: examId } };
}

function createCustomExam(data, session) {
  if (session.role !== "ADMIN" && session.role !== "GIAO_VIEN") {
    throw new Error("Không có quyền tạo đề thi!");
  }
  
  var todayStr = Utilities.formatDate(new Date(), "GMT+7", "yyyy-MM-dd");
  var templateId = "TPL_CSTM_" + Utilities.formatDate(new Date(), "GMT+7", "yyyyMMddHHmmss");
  var examId = "EXM_" + Utilities.formatDate(new Date(), "GMT+7", "yyyyMMdd") + "_" + Math.floor(100 + Math.random() * 900);
  
  var totalDuration = parseFloat(data.durationMinutes) || 90;
  var totalPoints = 0;
  var targetFolderId = data.targetFolderId || "";
  
  // 1. Create hidden Template
  appendRowData("EXAM_TEMPLATE", {
    TemplateID: templateId,
    TemplateName: data.examName + " (Custom)",
    Subject: data.subject || "Toán",
    Grade: data.grade || "Lớp 9",
    TotalDuration: totalDuration,
    MaxScore: 10,
    Description: "Auto-generated template for custom exam",
    CreatedBy: session.refId
  });
  
  // 2. Create Sections
  if (data.sections && data.sections.length > 0) {
    data.sections.forEach(function(s, idx) {
      var sectionTypeId = "SCT_CSTM_" + Utilities.formatDate(new Date(), "GMT+7", "yyyyMMddHHmmss") + idx;
      s.generatedSectionId = sectionTypeId; // Save it to link questions later
      
      var sPointsPerQ = parseFloat(s.pointsPerQuestion) || 0;
      var sQCount = parseInt(s.questionCount) || 1;
      totalPoints += sQCount * sPointsPerQ;
      
      appendRowData("EXAM_SECTION_TYPE", {
        SectionTypeID: sectionTypeId,
        TemplateID: templateId,
        SectionName: s.sectionName || ("Phần " + (idx + 1)),
        QuestionType: s.questionType || "MCQ",
        QuestionCount: sQCount,
        PointsPerQuestion: sPointsPerQ,
        PointsPerSubQuestion: "",
        SortOrder: idx + 1,
        AIParsePrompt: ""
      });
    });
  }
  
  // 3. Create Exam
  appendRowData("EXAM_BANK", {
    ExamID: examId,
    TemplateID: templateId,
    ExamName: data.examName,
    Subject: data.subject || "Toán",
    Grade: data.grade || "Lớp 9",
    DurationMinutes: totalDuration,
    TotalPoints: totalPoints,
    CreatedBy: session.refId,
    CreatedDate: todayStr,
    Status: "PUBLISHED", // Auto publish so it's ready to use
    ShuffleQuestions: false,
    ShuffleOptions: false
  });
  
  // 4. Create Questions
  var questionCounter = 1;
  if (data.sections && data.sections.length > 0) {
    data.sections.forEach(function(s) {
      if (s.parsedQuestions && s.parsedQuestions.length > 0) {
        s.parsedQuestions.forEach(function(q) {
          var qId = "Q_" + Utilities.formatDate(new Date(), "GMT+7", "yyyyMMddHHmmss") + "_" + Math.floor(100 + Math.random() * 900);
          appendRowData("EXAM_QUESTION", {
            QuestionID: qId,
            ExamID: examId,
            SectionTypeID: s.generatedSectionId,
            QuestionNumber: questionCounter++,
            QuestionContent: q.questionContent || "",
            OptionA: q.optionA || "",
            OptionB: q.optionB || "",
            OptionC: q.optionC || "",
            OptionD: q.optionD || "",
            SubQuestions: q.subQuestions ? JSON.stringify(q.subQuestions) : "",
            CorrectAnswer: q.correctAnswer || "",
            Solution: q.solution || "",
            Difficulty: q.difficulty || "Trung bình"
          });
        });
      }
    });
  }
  
  // 5. Automatically create FILE_HOC_LIEU
  var fileId = "FILE_" + Utilities.formatDate(new Date(), "GMT+7", "yyyyMMddHHmmss") + "_" + Math.floor(100 + Math.random() * 900);
  appendRowData("FILE_HOC_LIEU", {
    FileID: fileId,
    FolderID: targetFolderId,
    FileName: data.examName,
    FileType: "EXAM",
    FileURL: "",
    ExamID: examId,
    Description: "Đề thi tự sinh từ Exam Builder",
    UploadedBy: session.refId,
    UploadDate: todayStr
  });
  
  return { success: true, data: { examId: examId, fileId: fileId } };
}

function parseLatexSection(data, session) {
  if (session.role !== "ADMIN" && session.role !== "GIAO_VIEN") {
    throw new Error("Không có quyền biên soạn đề!");
  }
  
  var latex = data.latex || "";
  var questionType = data.questionType || "MCQ";
  var expectedCount = parseInt(data.expectedCount) || 1;
  
  var systemPrompt = "";
  if (questionType === "MCQ") {
    systemPrompt = "Bạn là một hệ thống phân tích đề thi thông minh. Trích xuất văn bản LaTeX thành MẢNG JSON hợp lệ chứa đúng " + expectedCount + " phần tử với schema: [{questionContent: string, optionA: string, optionB: string, optionC: string, optionD: string, correctAnswer: string, solution: string}]. QUAN TRỌNG: Hãy TỰ GIẢI các câu hỏi toán học này để tự động điền đáp án đúng (A, B, C, hoặc D) vào 'correctAnswer', và viết lời giải chi tiết từng bước vào 'solution'. TRẢ VỀ ĐÚNG MẢNG JSON, KHÔNG THÊM BẤT KỲ VĂN BẢN NÀO KHÁC. Giữ nguyên định dạng LaTeX.";
  } else if (questionType === "TRUE_FALSE") {
    systemPrompt = "Bạn là một hệ thống phân tích đề thi thông minh. Trích xuất văn bản LaTeX thành MẢNG JSON hợp lệ chứa đúng " + expectedCount + " phần tử với schema: [{questionContent: string, subQuestions: [{content: string, isTrue: boolean}], solution: string}]. Mỗi câu phải có chính xác 4 subQuestions tương ứng với 4 ý a,b,c,d. QUAN TRỌNG: Hãy TỰ GIẢI các ý này để điền true/false vào 'isTrue', và viết lời giải chi tiết vào 'solution'. TRẢ VỀ ĐÚNG MẢNG JSON. Giữ nguyên định dạng LaTeX.";
  } else if (questionType === "SHORT_ANSWER") {
    systemPrompt = "Bạn là một hệ thống phân tích đề thi thông minh. Trích xuất văn bản LaTeX thành MẢNG JSON hợp lệ chứa đúng " + expectedCount + " phần tử với schema: [{questionContent: string, correctAnswer: string, solution: string}]. QUAN TRỌNG: Hãy TỰ GIẢI các câu hỏi này để tự động điền kết quả cuối cùng vào 'correctAnswer', và viết lời giải chi tiết vào 'solution'. TRẢ VỀ ĐÚNG MẢNG JSON. Giữ nguyên định dạng LaTeX.";
  } else {
    systemPrompt = "Bạn là một hệ thống phân tích đề thi. Trích xuất LaTeX thành MẢNG JSON hợp lệ. TRẢ VỀ ĐÚNG MẢNG JSON.";
  }
  
  var parsedQuestions = [];
  var apiKey = "YOUR_GEMINI_API_KEY_HERE";
  
  if (apiKey) {
    try {
      var userMessage = "Phân tích đoạn LaTeX sau:\n\n" + latex;
      var aiResult = callGeminiAPI(apiKey, systemPrompt, userMessage);
      parsedQuestions = JSON.parse(aiResult);
    } catch (err) {
      Logger.log("Gemini API failed, falling back to regex: " + err.toString());
      parsedQuestions = fallbackParseLatex(latex, expectedCount);
    }
  } else {
    Logger.log("No Gemini API Key found, using fallback regex parser.");
    parsedQuestions = fallbackParseLatex(latex, expectedCount);
  }
  
  if (parsedQuestions.length !== expectedCount) {
    throw new Error("AI phân tách được " + parsedQuestions.length + " câu, nhưng Section yêu cầu đúng " + expectedCount + " câu! Vui lòng kiểm tra lại cấu trúc đề hoặc chỉnh sửa LaTeX.");
  }
  
  return { success: true, data: parsedQuestions };
}

function getAnthropicApiKey() {
  try {
    return PropertiesService.getScriptProperties().getProperty("ANTHROPIC_API_KEY") || "";
  } catch(e) {
    return "";
  }
}

function callGeminiAPI(apiKey, systemPrompt, userMessage) {
  var url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" + apiKey;
  var payload = {
    systemInstruction: {
      parts: [{ text: systemPrompt }]
    },
    contents: [{
      parts: [{ text: userMessage }]
    }],
    generationConfig: {
      temperature: 0.1,
      responseMimeType: "application/json"
    }
  };
  
  var options = {
    method: "post",
    contentType: "application/json",
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };
  
  var response = UrlFetchApp.fetch(url, options);
  var responseText = response.getContentText();
  
  if (response.getResponseCode() >= 400) {
    throw new Error("Gemini API Error: " + responseText);
  }
  
  var json = JSON.parse(responseText);
  if (json.candidates && json.candidates.length > 0) {
    return json.candidates[0].content.parts[0].text;
  } else {
    throw new Error("Invalid response format from Gemini: " + responseText);
  }
}

function callAnthropicAPI(apiKey, systemPrompt, userMessage) {
  var url = "https://api.anthropic.com/v1/messages";
  var payload = {
    model: "claude-3-5-sonnet-20241022",
    max_tokens: 4000,
    system: systemPrompt,
    messages: [{ role: "user", content: userMessage }]
  };
  var options = {
    method: "post",
    contentType: "application/json",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01"
    },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };
  
  var response = UrlFetchApp.fetch(url, options);
  var responseText = response.getContentText();
  var code = response.getResponseCode();
  
  if (code !== 200) {
    throw new Error("Anthropic API error (" + code + "): " + responseText);
  }
  
  var json = JSON.parse(responseText);
  return json.content[0].text;
}

function fallbackParseLatex(latex, expectedCount) {
  var questions = [];
  var qMatches = [];
  var qRegex = /\\begin\{question\}([\s\S]*?)\\end\{question\}/g;
  var match;
  while ((match = qRegex.exec(latex)) !== null) {
    qMatches.push(match[1].trim());
  }
  
  for (var i = 0; i < qMatches.length; i++) {
    var content = qMatches[i];
    var questionContent = content;
    var optionA = "";
    var optionB = "";
    var optionC = "";
    var optionD = "";
    var correctAnswer = "";
    var solution = "";
    
    var optMatch = /\\begin\{options\}([\s\S]*?)\\end\{options\}/.exec(content);
    if (optMatch) {
      var optBody = optMatch[1];
      var aMatch = /\\optionA\{([\s\S]*?)\}/.exec(optBody);
      var bMatch = /\\optionB\{([\s\S]*?)\}/.exec(optBody);
      var cMatch = /\\optionC\{([\s\S]*?)\}/.exec(optBody);
      var dMatch = /\\optionD\{([\s\S]*?)\}/.exec(optBody);
      
      if (aMatch) optionA = aMatch[1].trim();
      if (bMatch) optionB = bMatch[1].trim();
      if (cMatch) optionC = cMatch[1].trim();
      if (dMatch) optionD = dMatch[1].trim();
      
      questionContent = questionContent.replace(/\\begin\{options\}[\s\S]*?\\end\{options\}/, "").trim();
    }
    
    var ansMatch = /\\begin\{answer\}([\s\S]*?)\\end\{answer\}/.exec(content);
    if (ansMatch) {
      correctAnswer = ansMatch[1].trim();
      questionContent = questionContent.replace(/\\begin\{answer\}[\s\S]*?\\end\{answer\}/, "").trim();
    }
    
    var solMatch = /\\begin\{solution\}([\s\S]*?)\\end\{solution\}/.exec(content);
    if (solMatch) {
      solution = solMatch[1].trim();
      questionContent = questionContent.replace(/\\begin\{solution\}[\s\S]*?\\end\{solution\}/, "").trim();
    }
    
    questions.push({
      questionContent: questionContent,
      optionA: optionA,
      optionB: optionB,
      optionC: optionC,
      optionD: optionD,
      correctAnswer: correctAnswer,
      solution: solution
    });
  }
  
  while (questions.length < expectedCount) {
    questions.push({
      questionContent: "Câu hỏi nháp " + (questions.length + 1) + " (Vui lòng điền nội dung LaTeX)",
      optionA: "Đáp án A",
      optionB: "Đáp án B",
      optionC: "Đáp án C",
      optionD: "Đáp án D",
      correctAnswer: "A",
      solution: "Hướng dẫn giải chi tiết"
    });
  }
  
  if (questions.length > expectedCount) {
    questions = questions.slice(0, expectedCount);
  }
  
  return questions;
}

function saveExamSection(data, session) {
  if (session.role !== "ADMIN" && session.role !== "GIAO_VIEN") {
    throw new Error("Không có quyền biên soạn đề!");
  }
  
  var examId = data.examId;
  var sectionTypeId = data.sectionTypeId;
  var questions = data.questions;
  
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("EXAM_QUESTION");
  var lastRow = sheet.getLastRow();
  
  if (lastRow > 1) {
    var rowData = sheet.getRange(1, 1, lastRow, sheet.getLastColumn()).getValues();
    var idxExamId = rowData[0].indexOf("ExamID");
    var idxSecType = rowData[0].indexOf("SectionTypeID");
    for (var r = rowData.length - 1; r >= 1; r--) {
      if (rowData[r][idxExamId] === examId && rowData[r][idxSecType] === sectionTypeId) {
        sheet.deleteRow(r + 1);
      }
    }
  }
  
  questions.forEach(function(q, idx) {
    var questionId = "QST_" + Utilities.formatDate(new Date(), "GMT+7", "yyyyMMdd") + "_" + Math.floor(1000 + Math.random() * 9000);
    appendRowData("EXAM_QUESTION", {
      QuestionID: questionId,
      ExamID: examId,
      SectionTypeID: sectionTypeId,
      QuestionNumber: idx + 1,
      QuestionContent: q.questionContent,
      OptionA: q.optionA || "",
      OptionB: q.optionB || "",
      OptionC: q.optionC || "",
      OptionD: q.optionD || "",
      SubQuestions: q.subQuestions ? JSON.stringify(q.subQuestions) : "",
      CorrectAnswer: q.correctAnswer || "",
      Solution: q.solution || "",
      Difficulty: q.difficulty || "MEDIUM"
    });
  });
  
  return { success: true };
}

function publishExam(data, session) {
  if (session.role !== "ADMIN" && session.role !== "GIAO_VIEN") {
    throw new Error("Không có quyền xuất bản đề!");
  }
  
  var examId = data.examId;
  
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var bankSheet = ss.getSheetByName("EXAM_BANK");
  var lastRow = bankSheet.getLastRow();
  if (lastRow <= 1) throw new Error("Không có đề thi nào!");
  
  var rowData = bankSheet.getRange(1, 1, lastRow, bankSheet.getLastColumn()).getValues();
  var headers = rowData[0];
  
  var idxId = headers.indexOf("ExamID");
  var idxStatus = headers.indexOf("Status");
  var idxSubject = headers.indexOf("Subject");
  var idxGrade = headers.indexOf("Grade");
  var idxName = headers.indexOf("ExamName");
  
  var foundIdx = -1;
  for (var i = 1; i < rowData.length; i++) {
    if (rowData[i][idxId] === examId) {
      foundIdx = i + 1;
      break;
    }
  }
  
  if (foundIdx === -1) throw new Error("Không tìm thấy đề thi!");
  
  if (rowData[foundIdx - 1][idxStatus] === "PUBLISHED") {
    return { success: true, message: "Đề thi đã được xuất bản trước đó." };
  }
  
  bankSheet.getRange(foundIdx, idxStatus + 1).setValue("PUBLISHED");
  
  var examSubject = rowData[foundIdx - 1][idxSubject];
  var examGrade = rowData[foundIdx - 1][idxGrade];
  var examName = rowData[foundIdx - 1][idxName];
  
  var folderId = data.folderId;
  if (!folderId) {
    var folders = getSheetData("FOLDER_CHUYEN_DE");
    var matchedFolder = folders.find(function(f) {
      return (f.IsActive === true || f.IsActive === "TRUE") &&
             (f.Subject || "").trim().toLowerCase() === (examSubject || "").trim().toLowerCase() &&
             (f.Grade || "").trim().toLowerCase() === (examGrade || "").trim().toLowerCase();
    });
    
    if (matchedFolder) {
      folderId = matchedFolder.FolderID;
    } else {
      folderId = "FLD_" + Utilities.formatDate(new Date(), "GMT+7", "yyyyMMdd") + "_" + Math.floor(100 + Math.random() * 900);
      var todayStr = Utilities.formatDate(new Date(), "GMT+7", "yyyy-MM-dd");
      appendRowData("FOLDER_CHUYEN_DE", {
        FolderID: folderId,
        FolderName: "Đề thi " + examSubject + " " + examGrade,
        Subject: examSubject,
        Grade: examGrade,
        Level: "Nâng cao",
        SortOrder: 99,
        Description: "Thư mục đề thi tự động tạo khi xuất bản đề.",
        CreatedBy: session.refId,
        CreatedDate: todayStr,
        IsActive: true
      });
    }
  }
  
  var fileId = "FILE_" + Utilities.formatDate(new Date(), "GMT+7", "yyyyMMdd") + "_" + Math.floor(100 + Math.random() * 900);
  var todayStr = Utilities.formatDate(new Date(), "GMT+7", "yyyy-MM-dd");
  
  appendRowData("FILE_HOC_LIEU", {
    FileID: fileId,
    FolderID: folderId,
    FileName: examName,
    FileType: "EXAM",
    FileURL: "",
    ExamID: examId,
    UploadedBy: session.refId,
    UploadedDate: todayStr,
    Description: "Đề thi online tự sinh từ Exam Builder.",
    IsGlobal: false
  });
  
  return { success: true, data: { fileId: fileId } };
}

function archiveExam(data, session) {
  if (session.role !== "ADMIN" && session.role !== "GIAO_VIEN") {
    throw new Error("Không có quyền lưu trữ đề!");
  }
  var examId = data.examId;
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("EXAM_BANK");
  var lastRow = sheet.getLastRow();
  if (lastRow <= 1) throw new Error("Không có đề thi nào!");
  
  var rowData = sheet.getRange(1, 1, lastRow, sheet.getLastColumn()).getValues();
  var idxId = rowData[0].indexOf("ExamID");
  var idxStatus = rowData[0].indexOf("Status");
  
  for (var i = 1; i < rowData.length; i++) {
    if (rowData[i][idxId] === examId) {
      sheet.getRange(i + 1, idxStatus + 1).setValue("ARCHIVED");
      break;
    }
  }
  
  return { success: true };
}

function getExamDetail(examId, session) {
  if (session.role !== "ADMIN" && session.role !== "GIAO_VIEN") {
    throw new Error("Không có quyền xem chi tiết đề thi!");
  }
  
  var exams = getSheetData("EXAM_BANK");
  var exam = exams.find(function(e) { return e.ExamID === examId; });
  if (!exam) throw new Error("Không tìm thấy đề thi!");
  
  var questions = getSheetData("EXAM_QUESTION");
  var examQuestions = questions
    .filter(function(q) { return q.ExamID === examId; })
    .sort(function(a, b) { return a.QuestionNumber - b.QuestionNumber; })
    .map(function(q) {
      return {
        questionId: q.QuestionID,
        examId: q.ExamID,
        sectionTypeId: q.SectionTypeID,
        questionNumber: q.QuestionNumber,
        questionContent: q.QuestionContent,
        optionA: q.OptionA,
        optionB: q.OptionB,
        optionC: q.OptionC,
        optionD: q.OptionD,
        subQuestions: q.SubQuestions ? JSON.parse(q.SubQuestions) : null,
        correctAnswer: q.CorrectAnswer,
        solution: q.Solution,
        difficulty: q.Difficulty
      };
    });
    
  return {
    examId: exam.ExamID,
    templateId: exam.TemplateID,
    examName: exam.ExamName,
    subject: exam.Subject,
    grade: exam.Grade,
    durationMinutes: parseFloat(exam.DurationMinutes),
    totalPoints: parseFloat(exam.TotalPoints),
    status: exam.Status,
    shuffleQuestions: exam.ShuffleQuestions === true || exam.ShuffleQuestions === "TRUE",
    shuffleOptions: exam.ShuffleOptions === true || exam.ShuffleOptions === "TRUE",
    questions: examQuestions
  };
}


// --- MODULE 3: THI ONLINE BẤM GIỜ ---

function startExam(classId, examId, session) {
  if (session.role !== "HOC_VIEN" && session.role !== "ADMIN" && session.role !== "GIAO_VIEN") {
    throw new Error("Chỉ học viên mới được làm bài thi!");
  }
  
  var exams = getSheetData("EXAM_BANK");
  var exam = exams.find(function(e) { return e.ExamID === examId; });
  if (!exam || exam.Status !== "PUBLISHED") {
    throw new Error("Đề thi không khả dụng hoặc chưa xuất bản!");
  }
  
  var files = getSheetData("FILE_HOC_LIEU");
  var fileObj = files.find(function(f) { return f.ExamID === examId && f.FileType === "EXAM"; });
  if (!fileObj) throw new Error("Học liệu đề thi không tìm thấy trong kho!");
  
  var links = getSheetData("CLASS_MATERIAL_LINK");
  var linkObj = links.find(function(lnk) {
    return lnk.ClassID === classId && 
           lnk.FileID === fileObj.FileID && 
           lnk.IsActive !== false && 
           lnk.IsActive !== "FALSE" &&
           lnk.IsVisible !== false && 
           lnk.IsVisible !== "FALSE";
  });
  if (!linkObj) throw new Error("Bài thi này chưa được gán cho lớp của bạn!");
  
  var todayStr = Utilities.formatDate(new Date(), "GMT+7", "yyyy-MM-dd");
  
  if (linkObj.DueDate) {
    var dueDateStr = parseDateToString(linkObj.DueDate);
    if (todayStr > dueDateStr) {
      throw new Error("Đã quá hạn nộp bài thi (" + dueDateStr + ")!");
    }
  }
  
  var attempts = getSheetData("EXAM_ATTEMPT");
  var studentAttempts = attempts.filter(function(att) {
    return att.StudentID === session.refId && 
           att.ExamID === examId && 
           att.ClassID === classId;
  });
  
  var attemptCount = studentAttempts.length;
  var maxAttempts = (linkObj.MaxAttempts !== "" && linkObj.MaxAttempts !== null && linkObj.MaxAttempts !== undefined) ? parseInt(linkObj.MaxAttempts) : null;
  if (maxAttempts !== null && attemptCount >= maxAttempts) {
    throw new Error("Bạn đã hết lượt làm bài thi này (Giới hạn: " + maxAttempts + " lần)!");
  }
  
  var attemptId = "ATT_EX_" + Utilities.formatDate(new Date(), "GMT+7", "yyyyMMdd") + "_" + Math.floor(1000 + Math.random() * 9000);
  var startTime = new Date().toISOString();
  var nextAttemptNumber = attemptCount + 1;
  
  var questions = getSheetData("EXAM_QUESTION");
  var examQuestions = questions.filter(function(q) { return q.ExamID === examId; });
  
  var questionIds = examQuestions.map(function(q) { return q.QuestionID; });
  var shuffleEnabled = exam.ShuffleQuestions === true || exam.ShuffleQuestions === "TRUE";
  if (shuffleEnabled) {
    questionIds = shuffleArray(questionIds);
  }
  
  appendRowData("EXAM_ATTEMPT", {
    AttemptID: attemptId,
    StudentID: session.refId,
    ExamID: examId,
    ClassID: classId,
    LinkID: linkObj.LinkID,
    StartTime: startTime,
    SubmitTime: "",
    DurationSeconds: "",
    Status: "IN_PROGRESS",
    TotalScore: "",
    MaxScore: parseFloat(exam.TotalPoints) || 10,
    AttemptNumber: nextAttemptNumber,
    QuestionOrder: shuffleEnabled ? JSON.stringify(questionIds) : ""
  });
  
  var returnedQuestions = [];
  if (shuffleEnabled) {
    questionIds.forEach(function(qId) {
      var q = examQuestions.find(function(qe) { return qe.QuestionID === qId; });
      if (q) returnedQuestions.push(q);
    });
  } else {
    returnedQuestions = examQuestions.sort(function(a, b) { return a.QuestionNumber - b.QuestionNumber; });
  }
  
  var sanitizedQuestions = returnedQuestions.map(function(q) {
    return {
      questionId: q.QuestionID,
      examId: q.ExamID,
      sectionTypeId: q.SectionTypeID,
      questionNumber: q.QuestionNumber,
      questionContent: q.QuestionContent,
      optionA: q.OptionA,
      optionB: q.OptionB,
      optionC: q.OptionC,
      optionD: q.OptionD,
      subQuestions: q.SubQuestions ? JSON.parse(q.SubQuestions) : null,
      difficulty: q.Difficulty
    };
  });
  
  return {
    success: true,
    data: {
      attemptId: attemptId,
      examId: exam.ExamID,
      examName: exam.ExamName,
      durationMinutes: parseFloat(exam.DurationMinutes),
      startTime: startTime,
      attemptNumber: nextAttemptNumber,
      questions: sanitizedQuestions
    }
  };
}

function shuffleArray(arr) {
  var newArr = arr.slice();
  for (var i = newArr.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var temp = newArr[i];
    newArr[i] = newArr[j];
    newArr[j] = temp;
  }
  return newArr;
}

function saveExamProgress(data, session) {
  if (session.role !== "HOC_VIEN" && session.role !== "ADMIN" && session.role !== "GIAO_VIEN") {
    throw new Error("Chỉ học viên mới lưu tiến độ!");
  }
  
  var attemptId = data.attemptId;
  var answers = data.answers;
  
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("EXAM_ANSWER");
  var lastRow = sheet.getLastRow();
  
  var attempts = getSheetData("EXAM_ATTEMPT");
  var attemptObj = attempts.find(function(a) { return a.AttemptID === attemptId; });
  if (!attemptObj) throw new Error("Lần làm bài không tồn tại!");
  if (attemptObj.Status !== "IN_PROGRESS") {
    // Nếu đã nộp bài, chỉ việc trả về success để không báo lỗi bên frontend (do auto-save có thể gọi chậm)
    return { success: true };
  }
  
  var rowIndices = {};
  if (lastRow > 1) {
    var sheetValues = sheet.getRange(1, 1, lastRow, sheet.getLastColumn()).getValues();
    var headers = sheetValues[0];
    var idxAttempt = headers.indexOf("AttemptID");
    var idxQuestion = headers.indexOf("QuestionID");
    
    for (var i = 1; i < sheetValues.length; i++) {
      if (sheetValues[i][idxAttempt] === attemptId) {
        var qId = sheetValues[i][idxQuestion];
        rowIndices[qId] = i + 1;
      }
    }
  }
  
  var newRows = [];
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  
  var idxStudentAnswer = headers.indexOf("StudentAnswer");
  var idxSubAnswers = headers.indexOf("SubAnswers");
  
  answers.forEach(function(ans) {
    var qId = ans.questionId;
    var stuAns = ans.studentAnswer !== undefined && ans.studentAnswer !== null ? ans.studentAnswer.toString() : "";
    var subAnsStr = ans.subAnswers ? JSON.stringify(ans.subAnswers) : "";
    
    var existingRow = rowIndices[qId];
    if (existingRow) {
      sheet.getRange(existingRow, idxStudentAnswer + 1).setValue(stuAns);
      sheet.getRange(existingRow, idxSubAnswers + 1).setValue(subAnsStr);
    } else {
      var answerId = "ANS_" + Utilities.formatDate(new Date(), "GMT+7", "yyyyMMdd") + "_" + Math.floor(1000 + Math.random() * 9000);
      var rowObj = {
        "AnswerID": answerId,
        "AttemptID": attemptId,
        "QuestionID": qId,
        "StudentAnswer": stuAns,
        "SubAnswers": subAnsStr,
        "IsCorrect": "",
        "PointsEarned": ""
      };
      
      var newRow = headers.map(function(h) {
        return rowObj[h] !== undefined ? rowObj[h] : "";
      });
      newRows.push(newRow);
    }
  });
  
  if (newRows.length > 0) {
    sheet.getRange(lastRow + 1, 1, newRows.length, headers.length).setValues(newRows);
  }
  
  return { success: true };
}

function submitExam(data, session) {
  var attemptId = data.attemptId;
  
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(30000);
    
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var attemptSheet = ss.getSheetByName("EXAM_ATTEMPT");
    var attemptRows = attemptSheet.getRange(1, 1, attemptSheet.getLastRow(), attemptSheet.getLastColumn()).getValues();
    var attHeaders = attemptRows[0];
    
    var idxAttId = attHeaders.indexOf("AttemptID");
    var idxAttStatus = attHeaders.indexOf("Status");
    var idxAttEndTime = attHeaders.indexOf("SubmitTime");
    var idxAttDuration = attHeaders.indexOf("DurationSeconds");
    var idxAttScore = attHeaders.indexOf("TotalScore");
    var idxAttStudent = attHeaders.indexOf("StudentID");
    var idxAttExam = attHeaders.indexOf("ExamID");
    var idxAttClass = attHeaders.indexOf("ClassID");
    var idxAttStartTime = attHeaders.indexOf("StartTime");
    var idxAttMaxScore = attHeaders.indexOf("MaxScore");
    var idxAttNumber = attHeaders.indexOf("AttemptNumber");
    
    var attRowIdx = -1;
    for (var i = 1; i < attemptRows.length; i++) {
      if (attemptRows[i][idxAttId] === attemptId) {
        attRowIdx = i + 1;
        break;
      }
    }
    
    if (attRowIdx === -1) throw new Error("Không tìm thấy lần làm bài thi!");
    
    var status = attemptRows[attRowIdx - 1][idxAttStatus];
    var studentId = attemptRows[attRowIdx - 1][idxAttStudent];
    var examId = attemptRows[attRowIdx - 1][idxAttExam];
    var classId = attemptRows[attRowIdx - 1][idxAttClass];
    var startTimeStr = attemptRows[attRowIdx - 1][idxAttStartTime];
    var maxScore = parseFloat(attemptRows[attRowIdx - 1][idxAttMaxScore]) || 10;
    var attemptNumber = parseInt(attemptRows[attRowIdx - 1][idxAttNumber]) || 1;
    
    if (status !== "IN_PROGRESS") {
      return { success: true, message: "Bài thi này đã được nộp trước đó.", data: { attemptId: attemptId } };
    }
    
    var submitTimeStr = new Date().toISOString();
    var duration = Math.round((new Date(submitTimeStr).getTime() - new Date(startTimeStr).getTime()) / 1000);
    
    var questions = getSheetData("EXAM_QUESTION");
    var examQuestions = questions.filter(function(q) { return q.ExamID === examId; });
    
    var sections = getSheetData("EXAM_SECTION_TYPE");
    
    var answersSheet = ss.getSheetByName("EXAM_ANSWER");
    var answerRows = answersSheet.getRange(1, 1, answersSheet.getLastRow(), answersSheet.getLastColumn()).getValues();
    var ansHeaders = answerRows[0];
    
    var idxAnsAttempt = ansHeaders.indexOf("AttemptID");
    var idxAnsQuestion = ansHeaders.indexOf("QuestionID");
    var idxAnsStudentAnswer = ansHeaders.indexOf("StudentAnswer");
    var idxAnsSubAnswers = ansHeaders.indexOf("SubAnswers");
    var idxAnsIsCorrect = ansHeaders.indexOf("IsCorrect");
    var idxAnsPoints = ansHeaders.indexOf("PointsEarned");
    
    var studentAnswers = {};
    for (var r = 1; r < answerRows.length; r++) {
      if (answerRows[r][idxAnsAttempt] === attemptId) {
        var qId = answerRows[r][idxAnsQuestion];
        studentAnswers[qId] = {
          rowIdx: r + 1,
          studentAnswer: answerRows[r][idxAnsStudentAnswer],
          subAnswers: answerRows[r][idxAnsSubAnswers]
        };
      }
    }
    
    var totalScore = 0;
    var isPendingEssay = false;
    
    examQuestions.forEach(function(q) {
      var secType = sections.find(function(s) { return s.SectionTypeID === q.SectionTypeID; });
      var pointsPerQuestion = secType ? parseFloat(secType.PointsPerQuestion) : 0;
      var pointsPerSubQuestion = secType && secType.PointsPerSubQuestion !== "" && secType.PointsPerSubQuestion !== null ? parseFloat(secType.PointsPerSubQuestion) : null;
      
      var ansRecord = studentAnswers[q.QuestionID];
      var isCorrect = false;
      var pointsEarned = 0;
      var type = secType ? secType.QuestionType : "MCQ";
      
      if (type === "ESSAY") {
        isPendingEssay = true;
        if (ansRecord) {
          answersSheet.getRange(ansRecord.rowIdx, idxAnsIsCorrect + 1).setValue("");
          answersSheet.getRange(ansRecord.rowIdx, idxAnsPoints + 1).setValue("");
        }
        return;
      }
      
      var studentAnsStr = ansRecord ? (ansRecord.studentAnswer || "").toString().trim() : "";
      var correctAnswerStr = (q.CorrectAnswer || "").toString().trim();
      
      if (type === "MCQ") {
        isCorrect = (studentAnsStr.toLowerCase() === correctAnswerStr.toLowerCase());
        pointsEarned = isCorrect ? pointsPerQuestion : 0;
      } else if (type === "SHORT_ANSWER") {
        isCorrect = (studentAnsStr.toLowerCase() === correctAnswerStr.toLowerCase());
        pointsEarned = isCorrect ? pointsPerQuestion : 0;
      } else if (type === "TRUE_FALSE") {
        var correctSubQuestions = q.SubQuestions ? JSON.parse(q.SubQuestions) : [];
        var studentSubAnswers = ansRecord && ansRecord.subAnswers ? JSON.parse(ansRecord.subAnswers) : [];
        
        var correctCount = 0;
        correctSubQuestions.forEach(function(subQ, sIdx) {
          var stuSub = studentSubAnswers.find(function(sa) { return sa.subIndex === sIdx; });
          var stuSubAns = stuSub ? stuSub.answer : null;
          var isSubCorrect = false;
          if (stuSubAns !== null && stuSubAns !== undefined) {
            isSubCorrect = (stuSubAns.toString().trim().toLowerCase() === subQ.answer.toString().trim().toLowerCase());
          }
          if (isSubCorrect) {
            correctCount++;
          }
        });
        
        if (correctCount === 4) {
          pointsEarned = pointsPerQuestion;
          isCorrect = true;
        } else if (pointsPerSubQuestion !== null) {
          pointsEarned = correctCount * pointsPerSubQuestion;
          isCorrect = (correctCount > 0);
        } else {
          if (correctCount === 1) pointsEarned = 0.1;
          else if (correctCount === 2) pointsEarned = 0.25;
          else if (correctCount === 3) pointsEarned = 0.5;
          isCorrect = (correctCount > 0);
        }
      }
      
      totalScore += pointsEarned;
      
      if (ansRecord) {
        answersSheet.getRange(ansRecord.rowIdx, idxAnsIsCorrect + 1).setValue(isCorrect);
        answersSheet.getRange(ansRecord.rowIdx, idxAnsPoints + 1).setValue(pointsEarned);
      } else {
        var answerId = "ANS_" + Utilities.formatDate(new Date(), "GMT+7", "yyyyMMdd") + "_" + Math.floor(1000 + Math.random() * 9000);
        appendRowData("EXAM_ANSWER", {
          AnswerID: answerId,
          AttemptID: attemptId,
          QuestionID: q.QuestionID,
          StudentAnswer: "",
          SubAnswers: "",
          IsCorrect: false,
          PointsEarned: 0
        });
      }
    });
    
    attemptSheet.getRange(attRowIdx, idxAttStatus + 1).setValue("SUBMITTED");
    attemptSheet.getRange(attRowIdx, idxAttEndTime + 1).setValue(submitTimeStr);
    attemptSheet.getRange(attRowIdx, idxAttDuration + 1).setValue(duration);
    attemptSheet.getRange(attRowIdx, idxAttScore + 1).setValue(totalScore);
    
    syncAttemptToKetQua(attemptId, studentId, classId, examId, totalScore, maxScore, attemptNumber);
    
    return { 
      success: true, 
      data: { 
        attemptId: attemptId, 
        totalScore: totalScore, 
        maxScore: maxScore,
        isPendingEssay: isPendingEssay 
      } 
    };
    
  } finally {
    lock.releaseLock();
  }
}

function syncAttemptToKetQua(attemptId, studentId, classId, examId, score, maxScore, attemptNumber) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var exams = getSheetData("EXAM_BANK");
  var exam = exams.find(function(e) { return e.ExamID === examId; });
  var examName = exam ? exam.ExamName : "Đề thi online";
  
  var ketQuaSheet = ss.getSheetByName("KET_QUA_HOC_TAP");
  var kqRows = ketQuaSheet.getRange(1, 1, ketQuaSheet.getLastRow(), ketQuaSheet.getLastColumn()).getValues();
  var kqHeaders = kqRows[0];
  
  var idxKqAttemptId = kqHeaders.indexOf("AttemptID");
  var idxKqScore = kqHeaders.indexOf("Score");
  var idxKqNormScore = kqHeaders.indexOf("NormalizedScore");
  var idxKqDate = kqHeaders.indexOf("RecordedDate");
  
  var todayStr = Utilities.formatDate(new Date(), "GMT+7", "yyyy-MM-dd");
  var normalizedScore = (score / maxScore) * 10;
  
  var existingKqRowIdx = -1;
  for (var r = 1; r < kqRows.length; r++) {
    if (kqRows[r][idxKqAttemptId] === attemptId) {
      existingKqRowIdx = r + 1;
      break;
    }
  }
  
  if (existingKqRowIdx !== -1) {
    ketQuaSheet.getRange(existingKqRowIdx, idxKqScore + 1).setValue(score);
    ketQuaSheet.getRange(existingKqRowIdx, idxKqNormScore + 1).setValue(normalizedScore);
    ketQuaSheet.getRange(existingKqRowIdx, idxKqDate + 1).setValue(todayStr);
  } else {
    var resultId = "RES_" + Utilities.formatDate(new Date(), "GMT+7", "yyyyMMdd") + "_" + Math.floor(1000 + Math.random() * 9000);
    appendRowData("KET_QUA_HOC_TAP", {
      ResultID: resultId,
      StudentID: studentId,
      ClassID: classId,
      AssignmentName: examName,
      Source_Type: "EXAM_ONLINE",
      AttemptID: attemptId,
      Score: score,
      MaxScore: maxScore,
      NormalizedScore: normalizedScore,
      Feedback: "",
      RecordedBy: "SYSTEM",
      RecordedDate: todayStr,
      AttemptNumber: attemptNumber,
      IsBestAttempt: false
    });
  }
  
  recalculateBestAttempt(studentId, classId, examName);
}

function recalculateBestAttempt(studentId, classId, assignmentName) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("KET_QUA_HOC_TAP");
  var rows = sheet.getRange(1, 1, sheet.getLastRow(), sheet.getLastColumn()).getValues();
  var headers = rows[0];
  
  var idxStudent = headers.indexOf("StudentID");
  var idxClass = headers.indexOf("ClassID");
  var idxAssign = headers.indexOf("AssignmentName");
  var idxNormScore = headers.indexOf("NormalizedScore");
  var idxBest = headers.indexOf("IsBestAttempt");
  
  var matchIndices = [];
  var maxVal = -1;
  var bestRowIdx = -1;
  
  for (var r = 1; r < rows.length; r++) {
    if (rows[r][idxStudent] === studentId && 
        rows[r][idxClass] === classId && 
        rows[r][idxAssign] === assignmentName) {
      matchIndices.push(r + 1);
      var scoreVal = parseFloat(rows[r][idxNormScore]) || 0;
      if (scoreVal > maxVal) {
        maxVal = scoreVal;
        bestRowIdx = r + 1;
      }
    }
  }
  
  if (bestRowIdx === -1 && matchIndices.length > 0) {
    bestRowIdx = matchIndices[matchIndices.length - 1];
  }
  
  matchIndices.forEach(function(rowIdx) {
    sheet.getRange(rowIdx, idxBest + 1).setValue(rowIdx === bestRowIdx);
  });
}

function getExamResult(attemptId, session) {
  var attempts = getSheetData("EXAM_ATTEMPT");
  var attempt = attempts.find(function(a) { return a.AttemptID === attemptId; });
  if (!attempt) throw new Error("Không tìm thấy lần làm bài!");
  
  if (session.role === "HOC_VIEN" && attempt.StudentID !== session.refId) {
    throw new Error("Bạn không có quyền xem kết quả làm bài của học viên khác!");
  }
  
  var exams = getSheetData("EXAM_BANK");
  var exam = exams.find(function(e) { return e.ExamID === attempt.ExamID; });
  
  var questions = getSheetData("EXAM_QUESTION");
  var examQuestions = questions.filter(function(q) { return q.ExamID === attempt.ExamID; });
  
  var answers = getSheetData("EXAM_ANSWER");
  var attemptAnswers = answers.filter(function(ans) { return ans.AttemptID === attemptId; });
  
  var questionOrder = attempt.QuestionOrder ? JSON.parse(attempt.QuestionOrder) : [];
  if (questionOrder.length > 0) {
    examQuestions.sort(function(a, b) {
      return questionOrder.indexOf(a.QuestionID) - questionOrder.indexOf(b.QuestionID);
    });
  } else {
    examQuestions.sort(function(a, b) { return a.QuestionNumber - b.QuestionNumber; });
  }
  
  var detailedQuestions = examQuestions.map(function(q) {
    var ans = attemptAnswers.find(function(a) { return a.QuestionID === q.QuestionID; });
    return {
      questionId: q.QuestionID,
      questionNumber: q.QuestionNumber,
      questionContent: q.QuestionContent,
      optionA: q.OptionA,
      optionB: q.OptionB,
      optionC: q.OptionC,
      optionD: q.OptionD,
      subQuestions: q.SubQuestions ? JSON.parse(q.SubQuestions) : null,
      correctAnswer: q.CorrectAnswer,
      solution: q.Solution,
      difficulty: q.Difficulty,
      studentAnswer: ans ? ans.StudentAnswer : "",
      subAnswers: ans && ans.SubAnswers ? JSON.parse(ans.SubAnswers) : null,
      isCorrect: ans ? (ans.IsCorrect === true || ans.IsCorrect === "TRUE") : false,
      pointsEarned: ans ? parseFloat(ans.PointsEarned) || 0 : 0
    };
  });
  
  return {
    attemptId: attempt.AttemptID,
    studentId: attempt.StudentID,
    examId: attempt.ExamID,
    examName: exam ? exam.ExamName : "N/A",
    startTime: parseDateToString(attempt.StartTime),
    submitTime: parseDateToString(attempt.SubmitTime),
    durationSeconds: parseInt(attempt.DurationSeconds) || 0,
    status: attempt.Status,
    totalScore: parseFloat(attempt.TotalScore) || 0,
    maxScore: parseFloat(attempt.MaxScore) || 10,
    attemptNumber: parseInt(attempt.AttemptNumber),
    questions: detailedQuestions
  };
}

function getStudentAttemptHistory(studentId, examId, session) {
  var targetStudentId = studentId || session.refId;
  if (session.role === "HOC_VIEN" && targetStudentId !== session.refId) {
    throw new Error("Không có quyền xem lịch sử của học viên khác!");
  }
  
  var attempts = getSheetData("EXAM_ATTEMPT");
  var exams = getSheetData("EXAM_BANK");
  
  var studentAttempts = attempts.filter(function(a) {
    var matches = a.StudentID === targetStudentId;
    if (examId) {
      matches = matches && a.ExamID === examId;
    }
    return matches;
  });
  
  return studentAttempts.map(function(a) {
    var exam = exams.find(function(e) { return e.ExamID === a.ExamID; });
    return {
      attemptId: a.AttemptID,
      examId: a.ExamID,
      examName: exam ? exam.ExamName : "N/A",
      startTime: parseDateToString(a.StartTime),
      submitTime: parseDateToString(a.SubmitTime),
      durationSeconds: parseInt(a.DurationSeconds) || 0,
      status: a.Status,
      totalScore: a.TotalScore !== "" && a.TotalScore !== null ? parseFloat(a.TotalScore) : null,
      maxScore: parseFloat(a.MaxScore) || 10,
      attemptNumber: parseInt(a.AttemptNumber)
    };
  }).sort(function(a, b) {
    return b.startTime.localeCompare(a.startTime);
  });
}

function gradeEssayAnswer(data, session) {
  if (session.role !== "ADMIN" && session.role !== "GIAO_VIEN") {
    throw new Error("Không có quyền chấm tự luận!");
  }
  
  var answerId = data.answerId;
  var points = parseFloat(data.points);
  var feedback = data.feedback || "";
  
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var ansSheet = ss.getSheetByName("EXAM_ANSWER");
  var ansRows = ansSheet.getRange(1, 1, ansSheet.getLastRow(), ansSheet.getLastColumn()).getValues();
  var ansHeaders = ansRows[0];
  
  var idxAnsId = ansHeaders.indexOf("AnswerID");
  var idxAnsIsCorrect = ansHeaders.indexOf("IsCorrect");
  var idxAnsPoints = ansHeaders.indexOf("PointsEarned");
  var idxAnsAttempt = ansHeaders.indexOf("AttemptID");
  
  var ansRowIdx = -1;
  for (var i = 1; i < ansRows.length; i++) {
    if (ansRows[i][idxAnsId] === answerId) {
      ansRowIdx = i + 1;
      break;
    }
  }
  
  if (ansRowIdx === -1) throw new Error("Không tìm thấy bài làm câu hỏi!");
  
  var attemptId = ansRows[ansRowIdx - 1][idxAnsAttempt];
  
  ansSheet.getRange(ansRowIdx, idxAnsIsCorrect + 1).setValue(points > 0);
  ansSheet.getRange(ansRowIdx, idxAnsPoints + 1).setValue(points);
  
  var answers = getSheetData("EXAM_ANSWER");
  var attemptAnswers = answers.filter(function(ans) { return ans.AttemptID === attemptId; });
  var totalScore = 0;
  attemptAnswers.forEach(function(ans) {
    if (ans.AnswerID === answerId) {
      totalScore += points;
    } else {
      totalScore += parseFloat(ans.PointsEarned) || 0;
    }
  });
  
  var attemptSheet = ss.getSheetByName("EXAM_ATTEMPT");
  var attRows = attemptSheet.getRange(1, 1, attemptSheet.getLastRow(), attemptSheet.getLastColumn()).getValues();
  var attHeaders = attRows[0];
  
  var idxAttId = attHeaders.indexOf("AttemptID");
  var idxAttScore = attHeaders.indexOf("TotalScore");
  var idxAttStudent = attHeaders.indexOf("StudentID");
  var idxAttClass = attHeaders.indexOf("ClassID");
  var idxAttExam = attHeaders.indexOf("ExamID");
  var idxAttMaxScore = attHeaders.indexOf("MaxScore");
  var idxAttNumber = attHeaders.indexOf("AttemptNumber");
  
  var attRowIdx = -1;
  for (var i = 1; i < attRows.length; i++) {
    if (attRows[i][idxAttId] === attemptId) {
      attRowIdx = i + 1;
      break;
    }
  }
  
  if (attRowIdx !== -1) {
    attemptSheet.getRange(attRowIdx, idxAttScore + 1).setValue(totalScore);
    
    var studentId = attRows[attRowIdx - 1][idxAttStudent];
    var classId = attRows[attRowIdx - 1][idxAttClass];
    var examId = attRows[attRowIdx - 1][idxAttExam];
    var maxScore = parseFloat(attRows[attRowIdx - 1][idxAttMaxScore]) || 10;
    var attemptNumber = parseInt(attRows[attRowIdx - 1][idxAttNumber]) || 1;
    
    syncAttemptToKetQua(attemptId, studentId, classId, examId, totalScore, maxScore, attemptNumber);
    
    if (feedback) {
      var kqSheet = ss.getSheetByName("KET_QUA_HOC_TAP");
      var kqRows = kqSheet.getRange(1, 1, kqSheet.getLastRow(), kqSheet.getLastColumn()).getValues();
      var idxKqAttemptId = kqRows[0].indexOf("AttemptID");
      var idxKqFeedback = kqRows[0].indexOf("Feedback");
      
      for (var r = 1; r < kqRows.length; r++) {
        if (kqRows[r][idxKqAttemptId] === attemptId) {
          kqSheet.getRange(r + 1, idxKqFeedback + 1).setValue(feedback);
          break;
        }
      }
    }
  }
  
  return { success: true };
}


// --- MODULE 4: TRACKING KẾT QUẢ HỌC TẬP ---

function getStudentResultDashboard(studentId, session) {
  var targetStudentId = studentId || session.refId;
  if (session.role === "HOC_VIEN" && targetStudentId !== session.refId) {
    throw new Error("Không có quyền truy cập kết quả của học viên khác!");
  }
  
  var enrollments = getSheetData("GHI_DANH");
  var classes = getSheetData("LOPHOC");
  var results = getSheetData("KET_QUA_HOC_TAP");
  var links = getSheetData("CLASS_MATERIAL_LINK");
  var files = getSheetData("FILE_HOC_LIEU");
  
  var studentEnrollments = enrollments.filter(function(enr) { return enr.StudentID === targetStudentId; });
  var studentClassIds = studentEnrollments.map(function(enr) { return enr.ClassID; });
  
  var classGPAs = [];
  studentClassIds.forEach(function(cId) {
    var cls = classes.find(function(c) { return c.ClassID === cId; });
    if (!cls) return;
    
    var studentResults = results.filter(function(r) {
      return r.StudentID === targetStudentId && 
             r.ClassID === cId && 
             (r.IsBestAttempt === true || r.IsBestAttempt === "TRUE");
    });
    
    var sum = 0;
    studentResults.forEach(function(r) { sum += parseFloat(r.NormalizedScore) || 0; });
    var gpa = studentResults.length > 0 ? (sum / studentResults.length) : 0;
    
    var rankInfo = getStudentRankInClassV2(targetStudentId, cId);
    
    classGPAs.push({
      classId: cId,
      className: cls.ClassName,
      schedule: cls.Schedule,
      gpa: Math.round(gpa * 100) / 100,
      rank: rankInfo.rank,
      totalStudents: rankInfo.total,
      progressPercent: calculateClassProgressPercent(cId)
    });
  });
  
  var attempts = getSheetData("EXAM_ATTEMPT");
  var exams = getSheetData("EXAM_BANK");
  var studentAttempts = attempts
    .filter(function(a) { return a.StudentID === targetStudentId; })
    .map(function(a) {
      var exam = exams.find(function(e) { return e.ExamID === a.ExamID; });
      return {
        attemptId: a.AttemptID,
        classId: a.ClassID,
        examId: a.ExamID,
        examName: exam ? exam.ExamName : "N/A",
        startTime: parseDateToString(a.StartTime),
        submitTime: parseDateToString(a.SubmitTime),
        status: a.Status,
        score: a.TotalScore !== "" && a.TotalScore !== null ? parseFloat(a.TotalScore) : null,
        maxScore: parseFloat(a.MaxScore) || 10,
        attemptNumber: parseInt(a.AttemptNumber)
      };
    })
    .sort(function(a, b) { return b.startTime.localeCompare(a.startTime); });
    
  var uncompletedExams = [];
  studentClassIds.forEach(function(cId) {
    var classLinks = links.filter(function(lnk) {
      return lnk.ClassID === cId && lnk.IsActive !== false && lnk.IsActive !== "FALSE" && lnk.IsVisible !== false && lnk.IsVisible !== "FALSE";
    });
    
    classLinks.forEach(function(lnk) {
      var fileObj = files.find(function(f) { return f.FileID === lnk.FileID; });
      if (fileObj && fileObj.FileType === "EXAM") {
        var examId = fileObj.ExamID;
        var hasAttempt = studentAttempts.some(function(a) {
          return a.examId === examId && a.classId === cId && a.status === "SUBMITTED";
        });
        
        if (!hasAttempt) {
          var exam = exams.find(function(e) { return e.ExamID === examId; });
          var cls = classes.find(function(c) { return c.ClassID === cId; });
          uncompletedExams.push({
            classId: cId,
            className: cls ? cls.ClassName : "N/A",
            examId: examId,
            examName: exam ? exam.ExamName : "Đề thi",
            dueDate: parseDateToString(lnk.DueDate),
            maxAttempts: lnk.MaxAttempts !== "" && lnk.MaxAttempts !== null && lnk.MaxAttempts !== undefined ? parseInt(lnk.MaxAttempts) : null
          });
        }
      }
    });
  });
  
  return {
    classes: classGPAs,
    attempts: studentAttempts,
    uncompletedExams: uncompletedExams
  };
}

function getStudentRankInClassV2(studentId, classId) {
  var enrollments = getSheetData("GHI_DANH");
  var results = getSheetData("KET_QUA_HOC_TAP");
  
  var classStudents = enrollments
    .filter(function(enr) { return enr.ClassID === classId; })
    .map(function(enr) { return enr.StudentID; });
  
  if (classStudents.length === 0) return { rank: 1, total: 1 };
  
  var studentGPAs = [];
  classStudents.forEach(function(sId) {
    var sResults = results.filter(function(r) {
      return r.StudentID === sId && 
             r.ClassID === classId && 
             (r.IsBestAttempt === true || r.IsBestAttempt === "TRUE");
    });
    var sum = 0;
    sResults.forEach(function(r) { sum += parseFloat(r.NormalizedScore) || 0; });
    var gpa = sResults.length > 0 ? (sum / sResults.length) : 0;
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

function getClassResultDashboard(classId, session) {
  if (session.role !== "ADMIN" && session.role !== "GIAO_VIEN") {
    throw new Error("Không có quyền xem dashboard kết quả lớp!");
  }
  
  var classes = getSheetData("LOPHOC");
  var cls = classes.find(function(c) { return c.ClassID === classId; });
  if (!cls) throw new Error("Lớp học không tồn tại!");
  if (session.role === "GIAO_VIEN" && cls.TeacherID !== session.refId) {
    throw new Error("Giáo viên không phụ trách lớp này!");
  }
  
  var enrollments = getSheetData("GHI_DANH");
  var classStudents = enrollments.filter(function(enr) { return enr.ClassID === classId; });
  
  var studentProfiles = getSheetData("HOC_VIEN");
  var results = getSheetData("KET_QUA_HOC_TAP");
  
  var classResults = results.filter(function(r) {
    return r.ClassID === classId && (r.IsBestAttempt === true || r.IsBestAttempt === "TRUE");
  });
  
  var assignments = [];
  classResults.forEach(function(r) {
    if (assignments.indexOf(r.AssignmentName) === -1) {
      assignments.push(r.AssignmentName);
    }
  });
  
  var studentsMatrix = [];
  var decliningTrendWarnings = [];
  
  classStudents.forEach(function(enr) {
    var stdProfile = studentProfiles.find(function(s) { return s.StudentID === enr.StudentID; });
    var studentName = stdProfile ? stdProfile.FullName : "Học viên " + enr.StudentID;
    
    var studentGrades = {};
    assignments.forEach(function(asName) {
      var r = classResults.find(function(res) {
        return res.StudentID === enr.StudentID && res.AssignmentName === asName;
      });
      studentGrades[asName] = r ? parseFloat(r.NormalizedScore) : null;
    });
    
    var studentChronologicalResults = results
      .filter(function(r) {
        return r.StudentID === enr.StudentID && 
               r.ClassID === classId && 
               (r.IsBestAttempt === true || r.IsBestAttempt === "TRUE");
      })
      .sort(function(a, b) {
        return a.RecordedDate.localeCompare(b.RecordedDate);
      });
      
    var scores = studentChronologicalResults.map(function(r) { return parseFloat(r.NormalizedScore) || 0; });
    var hasDecliningTrend = false;
    if (scores.length >= 3) {
      var len = scores.length;
      if (scores[len - 1] < scores[len - 2] && scores[len - 2] < scores[len - 3]) {
        hasDecliningTrend = true;
        decliningTrendWarnings.push({
          studentId: enr.StudentID,
          fullName: studentName,
          recentScores: [scores[len - 3], scores[len - 2], scores[len - 1]]
        });
      }
    }
    
    studentsMatrix.push({
      studentId: enr.StudentID,
      fullName: studentName,
      grades: studentGrades,
      hasDecliningTrend: hasDecliningTrend
    });
  });
  
  var assignmentStats = {};
  assignments.forEach(function(asName) {
    var asGrades = classResults
      .filter(function(r) { return r.AssignmentName === asName && r.NormalizedScore !== null && r.NormalizedScore !== ""; })
      .map(function(r) { return parseFloat(r.NormalizedScore); });
      
    if (asGrades.length > 0) {
      var min = Math.min.apply(null, asGrades);
      var max = Math.max.apply(null, asGrades);
      var sum = asGrades.reduce(function(a, b) { return a + b; }, 0);
      var avg = sum / asGrades.length;
      
      var passCount = asGrades.filter(function(g) { return g >= 5.0; }).length;
      var failCount = asGrades.length - passCount;
      
      assignmentStats[asName] = {
        min: Math.round(min * 10) / 10,
        max: Math.round(max * 10) / 10,
        avg: Math.round(avg * 100) / 100,
        passCount: passCount,
        failCount: failCount,
        totalCount: asGrades.length
      };
    } else {
      assignmentStats[asName] = { min: null, max: null, avg: null, passCount: 0, failCount: 0, totalCount: 0 };
    }
  });
  
  var links = getSheetData("CLASS_MATERIAL_LINK");
  var files = getSheetData("FILE_HOC_LIEU");
  var exams = getSheetData("EXAM_BANK");
  var attempts = getSheetData("EXAM_ATTEMPT");
  
  var pendingStudentsList = [];
  var classLinks = links.filter(function(lnk) {
    return lnk.ClassID === classId && lnk.IsActive !== false && lnk.IsActive !== "FALSE" && lnk.IsVisible !== false && lnk.IsVisible !== "FALSE";
  });
  
  classLinks.forEach(function(lnk) {
    var fileObj = files.find(function(f) { return f.FileID === lnk.FileID; });
    if (fileObj && fileObj.FileType === "EXAM") {
      var exam = exams.find(function(e) { return e.ExamID === fileObj.ExamID; });
      if (!exam) return;
      
      classStudents.forEach(function(enr) {
        var hasAttempt = attempts.some(function(a) {
          return a.StudentID === enr.StudentID && 
                 a.ClassID === classId && 
                 a.ExamID === exam.ExamID && 
                 a.Status === "SUBMITTED";
        });
        
        if (!hasAttempt) {
          var stdProfile = studentProfiles.find(function(s) { return s.StudentID === enr.StudentID; });
          pendingStudentsList.push({
            studentId: enr.StudentID,
            fullName: stdProfile ? stdProfile.FullName : "Học viên " + enr.StudentID,
            examId: exam.ExamID,
            examName: exam.ExamName,
            dueDate: parseDateToString(lnk.DueDate)
          });
        }
      });
    }
  });
  
  return {
    classId: classId,
    className: cls.ClassName,
    assignments: assignments,
    studentsMatrix: studentsMatrix,
    assignmentStats: assignmentStats,
    pendingStudentsList: pendingStudentsList,
    decliningTrendWarnings: decliningTrendWarnings
  };
}

function getAssignmentStatsData(classId, assignmentName, session) {
  if (session.role !== "ADMIN" && session.role !== "GIAO_VIEN") {
    throw new Error("Không có quyền xem thống kê đề kiểm tra!");
  }
  
  var results = getSheetData("KET_QUA_HOC_TAP");
  var classResults = results.filter(function(r) {
    return r.ClassID === classId && 
           r.AssignmentName === assignmentName && 
           (r.IsBestAttempt === true || r.IsBestAttempt === "TRUE");
  });
  
  var scores = classResults.map(function(r) { return parseFloat(r.NormalizedScore) || 0; });
  
  if (scores.length === 0) {
    return { min: 0, max: 0, average: 0, total: 0, ranges: {} };
  }
  
  var min = Math.min.apply(null, scores);
  var max = Math.max.apply(null, scores);
  var sum = scores.reduce(function(a, b) { return a + b; }, 0);
  var average = sum / scores.length;
  
  var ranges = {
    "F_0_3.5": 0,
    "D_3.5_5.0": 0,
    "C_5.0_6.5": 0,
    "B_6.5_8.0": 0,
    "A_8.0_9.0": 0,
    "S_9.0_10": 0
  };
  
  scores.forEach(function(s) {
    if (s < 3.5) ranges["F_0_3.5"]++;
    else if (s < 5.0) ranges["D_3.5_5.0"]++;
    else if (s < 6.5) ranges["C_5.0_6.5"]++;
    else if (s < 8.0) ranges["B_6.5_8.0"]++;
    else if (s < 9.0) ranges["A_8.0_9.0"]++;
    else ranges["S_9.0_10"]++;
  });
  
  return {
    min: Math.round(min * 10) / 10,
    max: Math.round(max * 10) / 10,
    average: Math.round(average * 100) / 100,
    total: scores.length,
    ranges: ranges
  };
}

