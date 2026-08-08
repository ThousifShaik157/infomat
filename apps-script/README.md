# Google Sheets backend

`Code.gs` is the Google Apps Script Web App that connects this website to your
Google Form responses.

1. Open your Form response spreadsheet → **Extensions → Apps Script**.
2. Replace the contents of `Code.gs` with this file.
3. Edit the constants at the top:
   - `REGISTRATIONS_SHEET` — the tab holding Form responses (default `Form Responses 1`).
   - `COL` — the exact header names for Team Name, Student Name, Roll Number, Email, Registration ID.
4. **Deploy → New deployment → Web app**, execute as *Me*, access *Anyone*.
5. Copy the `/exec` URL and paste it into the website (settings button next to the search bar).

Notes
- The registration sheet is only read, never written.
- Attendance is written to a separate `Attendance` tab, one row per Registration ID
  (updated in place, so no duplicates).
- Students that do not exist in the Form response sheet are ignored.
