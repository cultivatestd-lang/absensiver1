# Google Apps Script for Attendance App (Updated with Geolocation & Notes)

Copy and paste this code into your Google Apps Script editor (Extensions > Apps Script in your Spreadsheet).

```javascript
/**
 * Google Apps Script for Aesthetic Attendance App
 * 
 * Instructions:
 * 1. Open your Spreadsheet: https://docs.google.com/spreadsheets/d/12Ipi9kxCzI0rh4yu-EX2UKxjqOyvO8x4k3Xii4dQNgk/edit
 * 2. Go to Extensions > Apps Script.
 * 3. Replace the code in Code.gs with this script.
 * 4. Update FOLDER_ID with your Drive folder ID: 1olTYrh4EwJRlRUnAndRMYGzE1xbwWx1k
 * 5. Click 'Deploy' > 'New Deployment'.
 * 6. Select 'Web App'.
 * 7. Set 'Execute as' to 'Me'.
 * 8. Set 'Who has access' to 'Anyone'.
 * 9. Copy the Web App URL and paste it into your app's VITE_GOOGLE_SCRIPT_URL secret.
 */

const FOLDER_ID = '1olTYrh4EwJRlRUnAndRMYGzE1xbwWx1k';

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheets()[0]; // Use the first sheet
    
    // 1. Save Image to Drive (if exists)
    let fileUrl = "";
    if (data.image) {
      const folder = DriveApp.getFolderById(FOLDER_ID);
      const contentType = data.image.split(',')[0].split(':')[1].split(';')[0];
      const bytes = Utilities.base64Decode(data.image.split(',')[1]);
      const blob = Utilities.newBlob(bytes, contentType, `attendance_${data.name}_${new Date().getTime()}.jpg`);
      const file = folder.createFile(blob);
      fileUrl = file.getUrl();
    }
    
    // 2. Append to Spreadsheet
    const now = new Date();
    const dateStr = Utilities.formatDate(now, Session.getScriptTimeZone(), "dd/MM/yyyy");
    const timeStr = Utilities.formatDate(now, Session.getScriptTimeZone(), "HH:mm:ss");
    
    // Format location as Google Maps link
    const mapsUrl = data.location ? `https://www.google.com/maps?q=${data.location.latitude},${data.location.longitude}` : '-';
    
    sheet.appendRow([
      dateStr,
      timeStr,
      data.name,
      data.status,
      data.notes || '-',
      mapsUrl,
      fileUrl
    ]);
    
    return ContentService.createTextOutput(JSON.stringify({
      status: 'success',
      message: 'Attendance recorded successfully'
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}
```
