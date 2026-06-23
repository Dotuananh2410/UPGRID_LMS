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
      teacherName: teacherMap[cls.TeacherID] || "Chưa phân công"
    };
  });
}

function getClassesForUser(session) {
  var classes = getSheetData("LOPHOC");
  var enrollments = getSheetData("GHI_DANH");
  var accounts = getSheetData("TAI_KHOAN");
  
  var teacherMap = {};
  accounts.forEach(function(acc) {
    if (acc.Role === "GIAO_VIEN") {
      teacherMap[acc.RefID] = acc.FullName;
    }
  });
  
  if (session.role === "ADMIN") {
    return classes.map(function(cls) {
      return {
        classId: cls.ClassID,
        className: cls.ClassName,
        schedule: cls.Schedule,
        teacherId: cls.TeacherID,
        teacherName: teacherMap[cls.TeacherID] || "Chưa phân công"
      };
    });
  } else if (session.role === "GIAO_VIEN") {
    return classes
      .filter(function(cls) { return cls.TeacherID === session.refId; })
      .map(function(cls) {
        return {
          classId: cls.ClassID,
          className: cls.ClassName,
          schedule: cls.Schedule,
          teacherId: cls.TeacherID,
          teacherName: session.fullName
        };
      });
  } else if (session.role === "HOC_VIEN") {
    // Filter by student enrollment
    var studentClassIds = enrollments
      .filter(function(enr) { return enr.StudentID === session.refId; })
      .map(function(enr) { return enr.ClassID; });
      
    return classes
      .filter(function(cls) { return studentClassIds.indexOf(cls.ClassID) !== -1; })
      .map(function(cls) {
        return {
          classId: cls.ClassID,
          className: cls.ClassName,
          schedule: cls.Schedule,
          teacherId: cls.TeacherID,
          teacherName: teacherMap[cls.TeacherID] || "Chưa phân công"
        };
      });
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
  
  var enrolledStudentIds = enrollments
    .filter(function(enr) { return enr.ClassID === classId; })
    .map(function(enr) { return enr.StudentID; });
    
  var students = studentProfiles
    .filter(function(std) { return enrolledStudentIds.indexOf(std.StudentID) !== -1; })
    .map(function(std) {
      var studentAccount = accounts.find(function(acc) { return acc.RefID === std.StudentID; });
      return {
        studentId: std.StudentID,
        fullName: std.FullName,
        email: studentAccount ? studentAccount.Email : "",
        parentEmail: std.ParentEmail,
        parentPhone: std.ParentPhone
      };
    });
    
  return {
    classId: classObj.ClassID,
    className: classObj.ClassName,
    schedule: classObj.Schedule,
    teacherId: classObj.TeacherID,
    teacherName: teacherName,
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
  
  appendRowData("TAI_KHOAN", {
    RefID: teacherId,
    Email: data.email,
    PasswordHash: hashed,
    Role: "GIAO_VIEN",
    FullName: data.fullName
  });
  
  return { success: true, data: { teacherId: teacherId } };
}

function createClassroom(data) {
  var classId = "CLS_" + Utilities.formatDate(new Date(), "GMT+7", "yyyyMMdd") + "_" + Math.floor(100 + Math.random() * 900);
  
  appendRowData("LOPHOC", {
    ClassID: classId,
    ClassName: data.className,
    Schedule: data.schedule,
    TeacherID: data.teacherId
  });
  
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
      date: typeof att.Date === "object" ? Utilities.formatDate(att.Date, "GMT+7", "yyyy-MM-dd") : att.Date,
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
  var dataRange = lastRow > 1 ? sheet.getRange(1, 1, lastRow, 6).getValues() : [["AttendanceID", "ClassID", "StudentID", "SessionNumber", "Date", "Status"]];
  var headers = dataRange[0];
  
  // Indices
  var idxId = headers.indexOf("AttendanceID");
  var idxClass = headers.indexOf("ClassID");
  var idxStudent = headers.indexOf("StudentID");
  var idxSession = headers.indexOf("SessionNumber");
  var idxDate = headers.indexOf("Date");
  var idxStatus = headers.indexOf("Status");
  
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
      Status: records[studentId]
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
      return {
        classId: cls.ClassID,
        className: cls.ClassName,
        schedule: cls.Schedule,
        teacherName: teacherMap[cls.TeacherID] || "Chưa phân công"
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
        date: typeof att.Date === "object" ? Utilities.formatDate(att.Date, "GMT+7", "yyyy-MM-dd") : att.Date,
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
