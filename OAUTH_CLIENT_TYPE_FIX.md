# Fix: "Invalid Redirect: must use a domain that is a valid"

## The Problem
This error occurs when your OAuth 2.0 Client in Google Cloud Console is not configured correctly for localhost development.

## ✅ Solution

### Step 1: Check OAuth Client Type

1. **Go to**: https://console.cloud.google.com/apis/credentials

2. **Find your OAuth Client ID**: `80421421905-cc2uvrbmops3idg2m6n46i33odfbke2p`

3. **Check the "Application type"**:
   - It should be **"Web application"**
   - If it's "Desktop app" or something else, you need to change it

### Step 2: Configure for Web Application

1. **Click Edit** (pencil icon) on your OAuth Client

2. **Application type**: Make sure it's set to **"Web application"**

3. **Authorized JavaScript origins**:
   - Click "+ ADD URI"
   - Add: `http://localhost:5173`
   - Add: `http://127.0.0.1:5173`
   - **NO trailing slashes** for JavaScript origins

4. **Authorized redirect URIs**:
   - Click "+ ADD URI"
   - Add: `http://localhost:5173`
   - Add: `http://localhost:5173/`
   - Add: `http://127.0.0.1:5173`
   - Add: `http://127.0.0.1:5173/`
   - **NO spaces, NO quotes**

5. **Click SAVE**

### Step 3: If Still Not Working - Create New OAuth Client

If the above doesn't work, create a new OAuth 2.0 Client:

1. **Go to**: https://console.cloud.google.com/apis/credentials

2. **Click "+ CREATE CREDENTIALS"** > **"OAuth client ID"**

3. **Application type**: Select **"Web application"**

4. **Name**: "NutriPlan Local Development"

5. **Authorized JavaScript origins**:
   ```
   http://localhost:5173
   http://127.0.0.1:5173
   ```

6. **Authorized redirect URIs**:
   ```
   http://localhost:5173
   http://localhost:5173/
   http://127.0.0.1:5173
   http://127.0.0.1:5173/
   ```

7. **Click CREATE**

8. **Copy the new Client ID** and update your `.env` file:
   ```
   VITE_GOOGLE_CLIENT_ID=your-new-client-id-here
   ```

9. **Restart your dev server**

### Step 4: Alternative - Use PostMessage Flow

If localhost still doesn't work, the library uses a popup-based flow. Make sure:

1. **Authorized JavaScript origins** includes your origin
2. **No redirect URIs needed** for popup flow (but add them anyway to be safe)

### Important Notes

- **JavaScript origins** = where the app runs (no trailing slash)
- **Redirect URIs** = where Google sends the response (can have trailing slash)
- **Application type** must be "Web application" for localhost
- **Wait 2-3 minutes** after saving for changes to propagate

### Still Not Working?

Check the browser console for the exact error. The error message will show what Google received vs what's configured.



