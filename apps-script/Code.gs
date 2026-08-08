/**
 * Coding Club Event Attendance — Google Apps Script backend.
 *
 * SETUP
 * 1. Open the Google Form response spreadsheet → Extensions → Apps Script.
 * 2. Paste this file, adjust REGISTRATIONS_SHEET and the column names below.
 * 3. Deploy → New deployment → Web app
 *      Execute as: Me
 *      Who has access: Anyone
 * 4. Copy the /exec URL and paste it into the website's settings dialog.
 *
 * The registration sheet is only ever READ. Attendance is written to a
 * separate "Attendance" sheet, keyed by Registration ID (no duplicates).
 */

var REGISTRATIONS_SHEET = 'Form Responses 1';
var ATTENDANCE_SHEET = 'Attendance';

// Header names in the Form response sheet.
var COL = {
  teamName: 'Team Name',
  studentName: 'Student Name',
  rollNumber: 'Roll Number',
  email: 'Email',
  registrationId: 'Registration ID',
};

var ATTENDANCE_HEADERS = [
  'Registration ID',
  'Team Name',
  'Student Name',
  'Roll Number',
  'Status',
  'Attendance Time',
];

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(
    ContentService.MimeType.JSON
  );
}

function ss_() {
  return SpreadsheetApp.getActiveSpreadsheet();
}

function getAttendanceSheet_() {
  var sheet = ss_().getSheetByName(ATTENDANCE_SHEET);
  if (!sheet) {
    sheet = ss_().insertSheet(ATTENDANCE_SHEET);
    sheet.appendRow(ATTENDANCE_HEADERS);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function readRegistrations_() {
  var sheet = ss_().getSheetByName(REGISTRATIONS_SHEET);
  if (!sheet) throw new Error('Registration sheet "' + REGISTRATIONS_SHEET + '" not found');
  var values = sheet.getDataRange().getValues();
  if (values.length < 2) return [];
  var headers = values[0].map(function (h) {
    return String(h).trim();
  });
  var idx = function (name) {
    return headers.indexOf(name);
  };
  var rows = [];
  for (var i = 1; i < values.length; i++) {
    var row = values[i];
    var get = function (name) {
      var j = idx(name);
      return j === -1 ? '' : String(row[j]).trim();
    };
    var regId = get(COL.registrationId) || 'ROW-' + (i + 1);
    if (!get(COL.studentName) && !get(COL.rollNumber)) continue;
    rows.push({
      registrationId: regId,
      teamName: get(COL.teamName) || 'UNASSIGNED',
      studentName: get(COL.studentName),
      rollNumber: get(COL.rollNumber),
      email: get(COL.email),
    });
  }
  return rows;
}

function readAttendanceMap_() {
  var sheet = getAttendanceSheet_();
  var values = sheet.getDataRange().getValues();
  var map = {};
  for (var i = 1; i < values.length; i++) {
    var id = String(values[i][0]).trim();
    if (!id) continue;
    map[id] = { row: i + 1, status: String(values[i][4]).trim(), time: values[i][5] };
  }
  return map;
}

function doGet() {
  try {
    var attendance = readAttendanceMap_();
    var students = readRegistrations_().map(function (s) {
      var a = attendance[s.registrationId];
      var present = !!a && a.status.toLowerCase() === 'present';
      return {
        registrationId: s.registrationId,
        teamName: s.teamName,
        studentName: s.studentName,
        rollNumber: s.rollNumber,
        email: s.email,
        status: present ? 'Present' : 'Not Present',
        attendanceTime: present && a.time ? new Date(a.time).toISOString() : '',
      };
    });
    return json_({ students: students });
  } catch (err) {
    return json_({ error: String(err.message || err) });
  }
}

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    var body = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    if (body.action !== 'mark') throw new Error('Unknown action');

    var ids = body.registrationIds || [];
    var present = body.present !== false;

    // Only registered students may be marked.
    var registered = {};
    readRegistrations_().forEach(function (s) {
      registered[s.registrationId] = s;
    });

    var sheet = getAttendanceSheet_();
    var attendance = readAttendanceMap_();
    var now = new Date();
    var updated = [];

    ids.forEach(function (id) {
      var student = registered[id];
      if (!student) return; // ignore anything not in the Form response sheet
      var status = present ? 'Present' : 'Not Present';
      var time = present ? now : '';
      var existing = attendance[id];
      if (existing) {
        // Duplicate-safe: update the single existing row for this Registration ID.
        sheet.getRange(existing.row, 1, 1, ATTENDANCE_HEADERS.length).setValues([
          [id, student.teamName, student.studentName, student.rollNumber, status, time],
        ]);
      } else {
        sheet.appendRow([
          id,
          student.teamName,
          student.studentName,
          student.rollNumber,
          status,
          time,
        ]);
      }
      updated.push(id);
    });

    return json_({ ok: true, updated: updated, time: now.toISOString() });
  } catch (err) {
    return json_({ error: String(err.message || err) });
  } finally {
    lock.releaseLock();
  }
}
