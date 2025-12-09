# Wallet Integration Guide

This document explains how the wallet collection and Google Sheets sync system works.

## Overview

After users join a narrative/campaign, they can enter their Solana wallet address. These wallets are stored in the database and can be exported to Google Sheets for reward distribution.

---

## User Flow

1. User visits a narrative page (e.g., `/narrative/solana-push`)
2. User clicks "Amplify Now" to join the campaign
3. After joining, a **Reward Wallet** input appears
4. User enters their Solana wallet address and clicks "Save Wallet"
5. Wallet is stored in the `participants` table

---

## API Endpoints

### Save/Get User Wallet
```
GET  /api/campaigns/[campaignId]/wallet
POST /api/campaigns/[campaignId]/wallet
```
- Requires authentication (x-hive-user header)
- POST body: `{ "walletAddress": "..." }`

### Export Campaign Wallets (Admin)
```
GET /api/campaigns/[campaignId]/wallets
GET /api/campaigns/[campaignId]/wallets?format=csv
```
- Requires `x-cron-secret` header
- Returns JSON or CSV format

### Export All Wallets (Admin)
```
GET /api/wallets/export
GET /api/wallets/export?format=csv
GET /api/wallets/export?campaignId=xxx
```
- Requires `x-cron-secret` header
- Groups wallets by campaign

### Sync to Google Sheets (Admin)
```
POST /api/wallets/sheets-sync
```
- Requires `x-cron-secret` header
- Requires `GOOGLE_SHEETS_WEBHOOK_URL` env var

---

## Google Sheets Setup

### Step 1: Create Google Sheet
1. Go to [Google Sheets](https://sheets.google.com)
2. Create a new spreadsheet
3. Name it "HiveAI Wallets" (or any name)

### Step 2: Add Apps Script
1. In your sheet, go to **Extensions > Apps Script**
2. Delete any existing code
3. Copy the contents of `scripts/google-apps-script-wallet-sync.js`
4. Paste into the Apps Script editor
5. Save (Ctrl+S)

### Step 3: Deploy Web App
1. Click **Deploy > New deployment**
2. Click the gear icon, select **Web app**
3. Set:
   - Description: "HiveAI Wallet Sync"
   - Execute as: **Me**
   - Who has access: **Anyone**
4. Click **Deploy**
5. Authorize the app when prompted
6. Copy the **Web app URL**

### Step 4: Configure Environment
Add to your `.env.local`:
```
GOOGLE_SHEETS_WEBHOOK_URL=https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec
```

### Step 5: Test the Sync
```powershell
Invoke-RestMethod `
  -Method POST `
  -Uri "https://your-app.ngrok-free.dev/api/wallets/sheets-sync" `
  -Headers @{ "x-cron-secret" = "your-cron-secret" }
```

---

## Manual Export (Without Google Sheets)

### Export as JSON
```powershell
Invoke-RestMethod `
  -Method GET `
  -Uri "https://your-app.ngrok-free.dev/api/wallets/export" `
  -Headers @{ "x-cron-secret" = "your-cron-secret" }
```

### Export as CSV
```powershell
Invoke-RestMethod `
  -Method GET `
  -Uri "https://your-app.ngrok-free.dev/api/wallets/export?format=csv" `
  -Headers @{ "x-cron-secret" = "your-cron-secret" } `
  -OutFile "wallets.csv"
```

---

## Database Schema

The `wallet_address` column was added to the `participants` table:

```sql
-- Migration: 0015_add_wallet_to_participants.sql
ALTER TABLE participants
  ADD COLUMN wallet_address TEXT;

CREATE INDEX idx_participants_wallet
  ON participants (campaign_id, wallet_address)
  WHERE wallet_address IS NOT NULL;
```

Run the migration:
```bash
npx supabase db push
```

---

## Automation (Optional)

To automatically sync wallets on a schedule, you can:

1. **Use Vercel Cron** (if deployed on Vercel):
   Add to `vercel.json`:
   ```json
   {
     "crons": [{
       "path": "/api/wallets/sheets-sync",
       "schedule": "0 */6 * * *"
     }]
   }
   ```

2. **Use external cron service** (e.g., cron-job.org):
   - Set up a POST request to `/api/wallets/sheets-sync`
   - Include `x-cron-secret` header
   - Run every 6 hours or as needed

---

## Troubleshooting

### Wallet not saving
- Check browser console for errors
- Verify user is authenticated
- Verify user has joined the campaign

### Google Sheets not updating
- Verify `GOOGLE_SHEETS_WEBHOOK_URL` is set
- Check Apps Script execution logs
- Ensure web app is deployed with "Anyone" access

### CSV export issues
- Ensure `x-cron-secret` header is correct
- Check server logs for errors
