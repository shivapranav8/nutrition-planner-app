# Google OAuth Setup Instructions

## Fix Redirect URI Mismatch Error

The error "redirect_uri_mismatch" occurs when the redirect URI in your Google Cloud Console doesn't match what the app is sending.

### Steps to Fix:

1. **Go to Google Cloud Console**
   - Visit: https://console.cloud.google.com/
   - Select your project (or create one)

2. **Navigate to OAuth Credentials**
   - Go to **APIs & Services** > **Credentials**
   - Find your OAuth 2.0 Client ID (the one ending in `.apps.googleusercontent.com`)
   - Click on it to edit

3. **Add Authorized Redirect URIs**
   Add these exact URIs (one per line):
   ```
   http://localhost:5173
   http://localhost:5173/
   http://127.0.0.1:5173
   http://127.0.0.1:5173/
   ```

   **Important Notes:**
   - Include both with and without trailing slash
   - Use `http://` (not `https://`) for local development
   - Include the port number `:5173`
   - If testing on mobile/network, also add: `http://192.168.0.105:5173` (replace with your IP)

4. **Save Changes**
   - Click **Save**
   - Wait 1-2 minutes for changes to propagate

5. **Restart Your App**
   - Stop and restart both frontend and backend servers
   - Clear browser cache if needed

### For Production:

When deploying, add your production URL:
```
https://yourdomain.com
https://yourdomain.com/
```

### Current Client ID:
```
80421421905-cc2uvrbmops3idg2m6n46i33odfbke2p.apps.googleusercontent.com
```

### Testing:

After adding the redirect URIs, try signing in with Google again. The error should be resolved.



