function doGet(e) {
  return getStudents();
}

function getStudents() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const values = sheet.getDataRange().getValues();

  if (values.length < 2) {
    return jsonResponse({ students: [] });
  }

  const headers = values[0].map(h => String(h).trim());
  const teamCol = findColumn(headers, [
    "TEAM NAME",
    "Team Name",
    "teamName"
  ]);

  const students = [];

  for (let r = 1; r < values.length; r++) {
    const row = values[r];

    const teamName =
      teamCol >= 0
        ? String(row[teamCol] || "").trim()
        : "UNASSIGNED";

    // Find MEMBER 1, MEMBER 2, MEMBER 3, etc.
    for (let c = 0; c < headers.length; c++) {
      const header = String(headers[c]).trim();
      const match = header.match(/^MEMBER\s*(\d+)\s*NAME$/i);

      if (!match) continue;

      const memberNumber = match[1];
      const studentName = String(row[c] || "").trim();

      if (!studentName) continue;

      const emailCol = findColumn(headers, [
        `MEMBER ${memberNumber} EMAIL ID`,
        `MEMBER ${memberNumber} EMAIL`
      ]);

      const rollCol = findColumn(headers, [
        `MEMBER ${memberNumber} ROLL NO`,
        `MEMBER ${memberNumber} ROLL NUMBER`,
        `ROLL NO MEMBER ${memberNumber}`,
        `ROLL NUMBER MEMBER ${memberNumber}`
      ]);

      const statusHeader = `MEMBER ${memberNumber} ATTENDANCE STATUS`;
      const timeHeader = `MEMBER ${memberNumber} ATTENDANCE TIME`;

      let statusCol = findColumn(headers, [statusHeader]);
      let timeCol = findColumn(headers, [timeHeader]);

      // Create attendance columns if they don't exist
      if (statusCol === -1) {
        statusCol = headers.length;
        sheet.getRange(1, statusCol + 1).setValue(statusHeader);
        headers.push(statusHeader);
      }

      if (timeCol === -1) {
        timeCol = headers.length;
        sheet.getRange(1, timeCol + 1).setValue(timeHeader);
        headers.push(timeHeader);
      }

      const email =
        emailCol >= 0
          ? String(row[emailCol] || "").trim()
          : "";

      const rollNumber =
        rollCol >= 0
          ? String(row[rollCol] || "").trim()
          : "";

      const status =
        String(row[statusCol] || "").trim().toLowerCase();

      const attendanceTime =
        String(row[timeCol] || "").trim();

      students.push({
        registrationId: `row-${r + 1}-member-${memberNumber}`,
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
    const data = JSON.parse(e.postData.contents || "{}");

    if (data.action === "mark") {
      return markAttendance(
        data.registrationIds || [],
        data.present === true
      );
    }

    return jsonResponse({
      error: "Unknown action"
    });

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
    return jsonResponse({
      error: "Sheet is empty"
    });
  }

  const headers = values[0].map(h => String(h).trim());
  const now = new Date();

  registrationIds.forEach(id => {

    const match = String(id).match(
      /^row-(\d+)-member-(\d+)$/
    );

    if (!match) return;

    const rowNumber = Number(match[1]);
    const memberNumber = match[2];

    const statusHeader =
      `MEMBER ${memberNumber} ATTENDANCE STATUS`;

    const timeHeader =
      `MEMBER ${memberNumber} ATTENDANCE TIME`;

    let statusCol = findColumn(headers, [statusHeader]);
    let timeCol = findColumn(headers, [timeHeader]);

    // Create columns if necessary
    if (statusCol === -1) {
      statusCol = headers.length;
      sheet
        .getRange(1, statusCol + 1)
        .setValue(statusHeader);
      headers.push(statusHeader);
    }

    if (timeCol === -1) {
      timeCol = headers.length;
      sheet
        .getRange(1, timeCol + 1)
        .setValue(timeHeader);
      headers.push(timeHeader);
    }

    if (present) {

      sheet
        .getRange(rowNumber, statusCol + 1)
        .setValue("Present");

      sheet
        .getRange(rowNumber, timeCol + 1)
        .setValue(now);

    } else {

      sheet
        .getRange(rowNumber, statusCol + 1)
        .clearContent();

      sheet
        .getRange(rowNumber, timeCol + 1)
        .clearContent();
    }
  });

  return jsonResponse({
    success: true
  });
}


function findColumn(headers, possibleNames) {

  const normalizedHeaders = headers.map(h =>
    String(h).trim().toLowerCase()
  );

  for (const name of possibleNames) {

    const index = normalizedHeaders.indexOf(
      String(name).trim().toLowerCase()
    );

    if (index !== -1) {
      return index;
    }
  }

  return -1;
}


function jsonResponse(data) {

  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
