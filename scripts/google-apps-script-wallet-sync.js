/**
 * Google Apps Script for HiveAI Wallet Sync
 * 
 * SETUP INSTRUCTIONS:
 * 1. Create a new Google Sheet
 * 2. Go to Extensions > Apps Script
 * 3. Paste this entire script
 * 4. Deploy as Web App:
 *    - Click Deploy > New deployment
 *    - Select type: Web app
 *    - Execute as: Me
 *    - Who has access: Anyone
 * 5. Copy the Web App URL
 * 6. Add to your .env.local: GOOGLE_SHEETS_WEBHOOK_URL=<your-web-app-url>
 * 
 * The script will:
 * - Create/update a "Wallets" sheet with all wallet data
 * - Auto-format headers and columns
 * - Preserve data history in a "Sync Log" sheet
 */

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    
    if (data.action === 'sync_wallets') {
      return syncWallets(data);
    }
    
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: 'Unknown action'
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function syncWallets(data) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // Get or create Wallets sheet
  let walletsSheet = ss.getSheetByName('Wallets');
  if (!walletsSheet) {
    walletsSheet = ss.insertSheet('Wallets');
  }
  
  // Clear existing data
  walletsSheet.clear();
  
  // Set headers
  const headers = data.headers || ['#', 'Campaign', 'Tag', 'Username', 'Display Name', 'Wallet Address', 'MSP', 'Rank', 'Synced At'];
  walletsSheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  
  // Format headers
  const headerRange = walletsSheet.getRange(1, 1, 1, headers.length);
  headerRange.setFontWeight('bold');
  headerRange.setBackground('#1a1a2e');
  headerRange.setFontColor('#00d9ff');
  
  // Add data rows
  if (data.rows && data.rows.length > 0) {
    walletsSheet.getRange(2, 1, data.rows.length, data.rows[0].length).setValues(data.rows);
  }
  
  // Auto-resize columns
  for (let i = 1; i <= headers.length; i++) {
    walletsSheet.autoResizeColumn(i);
  }
  
  // Set column widths for wallet addresses (column 6)
  walletsSheet.setColumnWidth(6, 400);
  
  // Add alternating row colors
  if (data.rows && data.rows.length > 0) {
    const dataRange = walletsSheet.getRange(2, 1, data.rows.length, headers.length);
    dataRange.applyRowBanding(SpreadsheetApp.BandingTheme.DARK);
  }
  
  // Log sync to Sync Log sheet
  logSync(ss, data.rows ? data.rows.length : 0, data.timestamp);
  
  return ContentService.createTextOutput(JSON.stringify({
    success: true,
    rowsUpdated: data.rows ? data.rows.length : 0,
    timestamp: new Date().toISOString()
  })).setMimeType(ContentService.MimeType.JSON);
}

function logSync(ss, rowCount, timestamp) {
  let logSheet = ss.getSheetByName('Sync Log');
  if (!logSheet) {
    logSheet = ss.insertSheet('Sync Log');
    logSheet.getRange(1, 1, 1, 3).setValues([['Timestamp', 'Rows Synced', 'Status']]);
    logSheet.getRange(1, 1, 1, 3).setFontWeight('bold');
  }
  
  logSheet.appendRow([timestamp || new Date().toISOString(), rowCount, 'Success']);
}

// Test function - run this to verify setup
function testSetup() {
  const testData = {
    action: 'sync_wallets',
    headers: ['#', 'Campaign', 'Tag', 'Username', 'Display Name', 'Wallet Address', 'MSP', 'Rank', 'Synced At'],
    rows: [
      [1, 'Test Campaign', 'TEST', 'testuser', 'Test User', 'TestWalletAddress123456789012345678901234', 100, 1, new Date().toISOString()]
    ],
    timestamp: new Date().toISOString()
  };
  
  syncWallets(testData);
  Logger.log('Test sync completed. Check the Wallets sheet.');
}
