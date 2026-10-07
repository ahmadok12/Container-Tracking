/**
 * Tracktainer Google Sheets Sync Script
 * ----------------------------------------------------
 * Instructions:
 * 1. Open your Google Sheet (e.g. "Tracktainer Shipments").
 * 2. Click "Extensions" -> "Apps Script".
 * 3. Delete everything in Code.gs and paste this entire code.
 * 4. Click "Deploy" (top right blue button) -> "New deployment".
 * 5. Select type: "Web app".
 * 6. Under "Execute as": "Me".
 * 7. Under "Who has access": "Anyone" (allows app to sync securely).
 * 8. Click "Deploy", copy the Web App URL, and paste it into the app's Google Sheets settings!
 */

function doGet(e) {
  var sheet = getOrCreateShipmentsSheet();
  var data = getShipmentsData(sheet);
  return ContentService.createTextOutput(JSON.stringify({
    success: true,
    shipments: data,
    timestamp: new Date().toISOString()
  })).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    var payload = JSON.parse(e.postData.contents);
    var sheet = getOrCreateShipmentsSheet();

    if (payload.action === "sync_shipments" || payload.shipments) {
      var shipments = payload.shipments || [payload.shipment];
      saveShipmentsToSheet(sheet, shipments);
      return ContentService.createTextOutput(JSON.stringify({
        success: true,
        message: "Successfully synchronized " + shipments.length + " shipment(s) to Google Sheets",
        updatedAt: new Date().toISOString()
      })).setMimeType(ContentService.MimeType.JSON);
    }

    if (payload.action === "update_status" && payload.containerNumber) {
      updateSingleShipmentStatus(sheet, payload);
      return ContentService.createTextOutput(JSON.stringify({
        success: true,
        message: "Updated container " + payload.containerNumber,
        updatedAt: new Date().toISOString()
      })).setMimeType(ContentService.MimeType.JSON);
    }

    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      message: "Unknown action"
    })).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function getOrCreateShipmentsSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("Shipments");
  if (!sheet) {
    sheet = ss.insertSheet("Shipments");
    var headers = [
      "Container No", "Carrier", "Vessel Name", "Voyage", "Status", 
      "Delay", "POL (Origin)", "POD (Destination)", "Departure Date", 
      "ETA", "ATA", "Transit Days", "Last Updated", "Shipment JSON"
    ];
    sheet.appendRow(headers);
    var headerRange = sheet.getRange(1, 1, 1, headers.length);
    headerRange.setFontWeight("bold");
    headerRange.setBackground("#0284c7");
    headerRange.setFontColor("#ffffff");
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function getShipmentsData(sheet) {
  var values = sheet.getDataRange().getValues();
  if (values.length <= 1) return [];

  var list = [];
  for (var i = 1; i < values.length; i++) {
    var row = values[i];
    var rawJson = row[13];
    if (rawJson) {
      try {
        list.push(JSON.parse(rawJson));
        continue;
      } catch (err) {}
    }
    // Fallback if raw JSON is missing
    list.push({
      containerNumber: row[0],
      carrier: row[1],
      vesselName: row[2],
      voyage: row[3],
      status: row[4],
      statusBadge: row[5],
      pol: { name: row[6], date: row[8] },
      pod: { name: row[7], date: row[9] },
      timeline: { eta: row[9], ata: row[10] },
      transitDays: row[11],
      lastSyncedAt: row[12]
    });
  }
  return list;
}

function saveShipmentsToSheet(sheet, shipments) {
  var data = sheet.getDataRange().getValues();
  var containerRowMap = {};
  for (var i = 1; i < data.length; i++) {
    var cNum = String(data[i][0]).trim().toUpperCase();
    if (cNum) {
      containerRowMap[cNum] = i + 1; // 1-based row index
    }
  }

  for (var s = 0; s < shipments.length; s++) {
    var item = shipments[s];
    var cNo = String(item.containerNumber || "").trim().toUpperCase();
    var rowValues = [
      cNo,
      item.carrier || "Tracktainer",
      item.vesselName || "",
      item.voyage || "",
      item.status || "In Transit",
      item.statusBadge || item.timeline?.delayText || "On Schedule",
      (item.pol?.name || "") + " (" + (item.pol?.code || "") + ")",
      (item.pod?.name || "") + " (" + (item.pod?.code || "") + ")",
      item.pol?.date || item.timeline?.departureActual || "",
      item.timeline?.eta || item.pod?.date || "",
      item.timeline?.ata || "-",
      item.transitDays || 0,
      new Date().toLocaleString(),
      JSON.stringify(item)
    ];

    if (containerRowMap[cNo]) {
      // update row
      sheet.getRange(containerRowMap[cNo], 1, 1, rowValues.length).setValues([rowValues]);
    } else {
      // append new row
      sheet.appendRow(rowValues);
      containerRowMap[cNo] = sheet.getLastRow();
    }
  }
}

function updateSingleShipmentStatus(sheet, payload) {
  var data = sheet.getDataRange().getValues();
  var cNo = String(payload.containerNumber).trim().toUpperCase();
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0]).trim().toUpperCase() === cNo) {
      sheet.getRange(i + 1, 5).setValue(payload.status);
      if (payload.delayBadge) {
        sheet.getRange(i + 1, 6).setValue(payload.delayBadge);
      }
      sheet.getRange(i + 1, 13).setValue(new Date().toLocaleString());
      if (payload.fullShipment) {
        sheet.getRange(i + 1, 14).setValue(JSON.stringify(payload.fullShipment));
      }
      break;
    }
  }
}
