function doGet(e) {
  const action = e && e.parameter && e.parameter.action;

  if (action === "list") {
    return getStudents();
  }

  return getStudents();
}

function getStudents() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const values = sheet.getDataRange().getValues();

  if (values.length < 2) {
    return jsonResponse({ students: [] });
  }

  const headers = values[0].map(h => String(h).trim());

  // Find important columns
  const teamCol = findColumn(headers, [
    "TEAM NAME",
    "Team Name",
    "teamName"
  ]);

  // Attendance columns are created automatically if they don't exist
  let statusCol = findColumn(headers, [
    "ATTENDANCE STATUS",
    "Status"
  ]);

  let timeCol = findColumn(headers, [
    "ATTENDANCE TIME",
    "Attendance Time"
  ]);

  if (statusCol === -1) {
    statusCol = headers.length;
    sheet.getRange(1, statusCol + 1).setValue("ATTENDANCE STATUS");
    headers.push("ATTENDANCE STATUS");
  }

  if (timeCol === -1) {
    timeCol = headers.length;
    sheet.getRange(1, timeCol + 1).setValue("ATTENDANCE TIME");
    headers.push("ATTENDANCE TIME");
  }

  const students = [];

  for (let r = 1; r < values.length; r++) {
    const row = values[r];

    const teamName =
      teamCol >= 0 ? String(row[teamCol] || "").trim() : "UNASSIGNED";

    // Find all MEMBER X NAME columns
    for (let c = 0; c < headers.length; c++) {
      const header = String(headers[c]).trim();

      const match = header.match(/MEMBER\s*(\d+)\s*NAME/i);

      if (!match) continue;

      const memberNumber = match[1];
      const studentName = String(row[c] || "").trim();

      if (!studentName) continue;

      const emailCol = findColumn(headers, [
        `MEMBER ${memberNumber} EMAIL ID`,
        `MEMBER ${memberNumber} EMAIL`,
        `EMAIL ID ${memberNumber}`,
        `MEMBER ${memberNumber} EMAIL ID`
      ]);

      const rollCol = findColumn(headers, [
        `MEMBER ${memberNumber} ROLL NO`,
        `ROLL NO MEMBER ${memberNumber}`,
        `MEMBER ${memberNumber} ROLL NUMBER`,
        `ROLL NUMBER MEMBER ${memberNumber}`
      ]);

      const email =
        emailCol >= 0 ? String(row[emailCol] || "").trim() : "";

      const rollNumber =
        rollCol >= 0 ? String(row[rollCol] || "").trim() : "";

      const registrationId = `row-${r + 1}-member-${memberNumber}`;

      const status =
        statusCol >= 0 ? String(row[statusCol] || "").trim().toLowerCase() : "";

      const attendanceTime =
        timeCol >= 0 ? String(row[timeCol] || "").trim() : "";

      students.push({
        registrationId: registrationId,
        teamName: teamName,
        studentName: studentName,
        rollNumber: rollNumber,
        email: email,
        present: status === "present",
        attendanceTime: attendanceTime || null
      });
    }
  }

  return jsonResponse({ students: students });
}


function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);

    if (data.action === "mark") {
      return markAttendance(
        data.registrationIds || [],
        data.present === true
      );
    }

    return jsonResponse({ error: "Unknown action" });

  } catch (error) {
    return jsonResponse({
      error: error.message
    });
  }
}


function markAttendance(registrationIds, present) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const values = sheet.getDataRange().getValues();

  if (values.length < 1) {
    return jsonResponse({ error: "Sheet is empty" });
  }

  const headers = values[0].map(h => String(h).trim());

  let statusCol = findColumn(headers, [
    "ATTENDANCE STATUS",
    "Status"
  ]);

  let timeCol = findColumn(headers, [
    "ATTENDANCE TIME",
    "Attendance Time"
  ]);

  if (statusCol === -1) {
    statusCol = headers.length;
    sheet.getRange(1, statusCol + 1).setValue("ATTENDANCE STATUS");
  }

  if (timeCol === -1) {
    timeCol = headers.length + (statusCol === headers.length ? 1 : 0);
    sheet.getRange(1, timeCol + 1).setValue("ATTENDANCE TIME");
  }

  const now = new Date();

  registrationIds.forEach(id => {
    const match = String(id).match(/^row-(\d+)-member-(\d+)$/);

    if (!match) return;

    const rowNumber = Number(match[1]);

    if (present) {
      sheet.getRange(rowNumber, statusCol + 1).setValue("Present");
      sheet.getRange(rowNumber, timeCol + 1).setValue(now);
    } else {
      sheet.getRange(rowNumber, statusCol + 1).clearContent();
      sheet.getRange(rowNumber, timeCol + 1).clearContent();
    }
  });

  return jsonResponse({ success: true });
}


function findColumn(headers, possibleNames) {
  const normalizedHeaders = headers.map(h =>
    String(h).trim().toLowerCase()
  );

  for (const name of possibleNames) {
    const index = normalizedHeaders.indexOf(
      String(name).trim().toLowerCase()
    );

    if (index !== -1) return index;
  }

  return -1;
}


function jsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
