# Fix Google OAuth Redirect URI Mismatch

## Quick Fix Steps

### 1. Check Your Current Redirect URI

The app is using: **`http://localhost:5173`** (or your current origin)

### 2. Add to Google Cloud Console

1. Go to: https://console.cloud.google.com/apis/credentials
2. Find your OAuth 2.0 Client ID: `80421421905-cc2uvrbmops3idg2m6n46i33odfbke2p.apps.googleusercontent.com`
3. Click **Edit** (pencil icon)
4. Under **Authorized redirect URIs**, click **+ ADD URI**
5. Add **ALL** of these (one per line):

```
http://localhost:5173
http://localhost:5173/
http://127.0.0.1:5173
http://127.0.0.1:5173/
http://localhost
http://localhost/
```

6. Click **SAVE**
7. Wait 2-3 minutes for changes to propagate

### 3. Important Notes

- **Exact match required**: The URI must match EXACTLY (including trailing slashes)
- **Case sensitive**: Use lowercase
- **Protocol matters**: Use `http://` for localhost (not `https://`)
- **Port number**: Must include `:5173` if your app runs on that port

### 4. Verify Your App's Origin

Open browser console and run:
```javascript
console.log(window.location.origin);
```

This will show the exact redirect URI your app is using. Make sure this EXACT value is in Google Cloud Console.

### 5. Alternative: Use PostMessage (No Redirect URI needed)

If you want to avoid redirect URI issues entirely, we can switch to a popup-based flow. Let me know if you want this option.

### 6. After Adding URIs

1. **Clear browser cache** (Ctrl+Shift+Delete or Cmd+Shift+Delete)
2. **Restart your dev server**
3. **Try Google sign-in again**

### Still Not Working?

Check the browser console for the exact error message. The error will show what redirect URI Google received vs what's configured.



