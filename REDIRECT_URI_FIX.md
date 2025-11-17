# 🔧 Fix Redirect URI Mismatch - Step by Step

## The Problem
Google OAuth requires the **exact** redirect URI to be registered in Google Cloud Console. Even a small difference (like a trailing slash) will cause this error.

## ✅ Solution

### Step 1: Find Your Exact Redirect URI

1. Open your app: http://localhost:5173
2. Open Browser Console (F12 or Cmd+Option+I)
3. Look for the log message that shows: `Redirect URI: http://localhost:5173`
4. **Copy this EXACT value** (including http:// and port number)

### Step 2: Add to Google Cloud Console

1. **Go to Google Cloud Console**
   - Visit: https://console.cloud.google.com/apis/credentials
   - Make sure you're in the correct project

2. **Find Your OAuth Client**
   - Look for: `80421421905-cc2uvrbmops3idg2m6n46i33odfbke2p.apps.googleusercontent.com`
   - Click the **Edit** icon (pencil) next to it

3. **Add Redirect URIs**
   - Scroll down to **"Authorized redirect URIs"**
   - Click **"+ ADD URI"**
   - Add **ALL** of these (one per line):
     ```
     http://localhost:5173
     http://localhost:5173/
     http://127.0.0.1:5173
     http://127.0.0.1:5173/
     ```
   - **Important**: Include both with and without trailing slash `/`

4. **Save**
   - Click **"SAVE"** at the bottom
   - Wait **2-3 minutes** for Google to update (this is important!)

### Step 3: Verify and Test

1. **Clear Browser Cache**
   - Press `Ctrl+Shift+Delete` (Windows) or `Cmd+Shift+Delete` (Mac)
   - Clear cached images and files

2. **Hard Refresh**
   - Press `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)

3. **Try Again**
   - Click "Continue with Google"
   - It should work now!

## 🐛 Still Not Working?

### Check These:

1. **Wait Longer**: Google can take up to 5 minutes to propagate changes
2. **Check Console**: Look for the exact redirect URI in browser console
3. **Verify Client ID**: Make sure you're editing the correct OAuth client
4. **No Typos**: The URI must match EXACTLY (case-sensitive, no extra spaces)

### Alternative: Check What Google Received

If you see the error page, it might show what redirect URI Google received. Compare that with what you added in the console.

## 📝 Common Mistakes

❌ **Wrong**: `https://localhost:5173` (should be `http://`)  
❌ **Wrong**: `localhost:5173` (missing `http://`)  
❌ **Wrong**: `http://localhost` (missing port `:5173`)  
✅ **Correct**: `http://localhost:5173`

## 💡 Pro Tip

The app now shows the exact redirect URI in the error message if there's a mismatch. Use that value!



