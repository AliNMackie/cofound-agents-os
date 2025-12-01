function sendInvoice() {
  var sheet = SpreadsheetApp.getActiveSheet();
  var row = sheet.getActiveRange().getRow();
  
  // Skip header or invalid rows
  if (row <= 1) return;

  // Read Columns A-D: Name, Email, Amount, Desc
  var clientName = sheet.getRange(row, 1).getValue();
  var email = sheet.getRange(row, 2).getValue();
  var amount = sheet.getRange(row, 3).getValue();
  var description = sheet.getRange(row, 4).getValue();

  if (!clientName || !email || !amount) {
    Browser.msgBox("Please select a row with valid data (Name, Email, Amount).");
    return;
  }

  // Generate OIDC Token
  // Note: This requires the script to be attached to a GCP project with OAuth configured.
  // The user running the script must have permissions to invoke the Cloud Run service.
  var token = ScriptApp.getIdentityToken();
  if (!token) {
    Logger.log("Could not generate Identity Token. Ensure the script is linked to a GCP Project.");
    // For local testing or if not linked, you might fail here.
    // Proceeding without token or with a dummy might be an option depending on dev env.
  }

  // Replace with your actual Cloud Run URL
  var url = "https://[YOUR_CLOUD_RUN_URL]/enqueue";
  
  var payload = {
    "client_name": clientName,
    "email": email,
    "amount": parseFloat(amount),
    "description": description
  };

  var options = {
    "method": "post",
    "contentType": "application/json",
    "payload": JSON.stringify(payload),
    "headers": {
      "Authorization": "Bearer " + token
    },
    "muteHttpExceptions": true
  };

  try {
    var response = UrlFetchApp.fetch(url, options);
    var responseCode = response.getResponseCode();
    var responseBody = response.getContentText();

    if (responseCode >= 200 && responseCode < 300) {
      // Success
      sheet.getRange(row, 5).setValue("QUEUED");
      SpreadsheetApp.getUi().alert("Invoice queued successfully!");
    } else {
      // Error
      Logger.log("Error: " + responseCode + " - " + responseBody);
      sheet.getRange(row, 5).setValue("ERROR: " + responseCode);
      SpreadsheetApp.getUi().alert("Failed to queue invoice. Check logs.");
    }
  } catch (e) {
    Logger.log("Exception: " + e.toString());
    sheet.getRange(row, 5).setValue("ERROR: Exception");
    SpreadsheetApp.getUi().alert("Exception occurred: " + e.toString());
  }
}
