# Deploying to Vercel - Complete Guide

This guide will help you deploy your Nutrition Planner App to Vercel.

## 📋 Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com) (free)
2. **Git Repository**: Your code should be in GitHub, GitLab, or Bitbucket
3. **Node.js**: Installed locally (for testing)

## 🚀 Quick Deployment (3 Methods)

### Method 1: Vercel CLI (Recommended for First Time)

1. **Install Vercel CLI**:
   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel**:
   ```bash
   vercel login
   ```

3. **Deploy**:
   ```bash
   vercel
   ```
   
   Follow the prompts:
   - Set up and deploy? → **Yes**
   - Which scope? → Select your account
   - Link to existing project? → **No** (first time)
   - Project name? → Press Enter or type a name
   - Directory? → Press Enter (current directory)
   - Override settings? → **No**

4. **Deploy to Production**:
   ```bash
   vercel --prod
   ```

### Method 2: Vercel Dashboard (Easiest)

1. **Push code to Git**:
   ```bash
   git add .
   git commit -m "Update project"
   git push
   ```

2. **Import Project**:
   - Go to [vercel.com/new](https://vercel.com/new)
   - Click "Import Git Repository"
   - Select your repository
   - Vercel will auto-detect Vite
   - Click "Deploy"

### Method 3: GitHub Integration

1. **Connect GitHub**:
   - Go to Vercel Dashboard → Settings → Git
   - Connect your GitHub account
   - Select repository

2. **Auto-Deploy**:
   - Every push to `main` branch auto-deploys
   - Pull requests get preview deployments

## ⚙️ Configuration

### Build Settings (Auto-detected)

- **Framework Preset**: Vite
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`
- **Node Version**: 18.x (default)

### Project Structure

```
├── api/
│   └── index.js          # Serverless function (handles all API routes)
├── src/                  # React frontend
├── dist/                 # Build output (generated)
├── vercel.json          # Vercel configuration
└── package.json         # Dependencies
```

## 🔧 Important Notes

### ⚠️ Data Storage Limitation

**Current Implementation**: Uses `/tmp/user-data.json` (ephemeral storage)

**What this means**:
- ✅ Works for development/testing
- ❌ Data is **NOT persisted** between function invocations
- ❌ User data will be lost when functions restart
- ❌ **NOT suitable for production**

### 💾 For Production: Use a Database

**Recommended Options**:

1. **Vercel KV** (Redis) - Best for Vercel
   ```bash
   npm install @vercel/kv
   ```
   - Fast, simple, built for Vercel
   - Free tier: 256 MB storage

2. **MongoDB Atlas** - Popular choice
   - Free tier: 512 MB storage
   - Easy to set up

3. **Supabase** - PostgreSQL
   - Free tier: 500 MB database
   - Great for structured data

4. **PlanetScale** - MySQL
   - Free tier available
   - Serverless MySQL

### Environment Variables

**No environment variables needed!** 

Since you're using BYOK (Bring Your Own Key), users provide their own API keys through the UI. No server-side keys required.

## 📝 Deployment Checklist

- [ ] Code pushed to Git repository
- [ ] `vercel.json` exists in project root
- [ ] `api/index.js` exists (serverless function)
- [ ] `package.json` has all dependencies
- [ ] Build command works locally (`npm run build`)
- [ ] API routes tested locally (if possible)

## 🧪 Testing After Deployment

1. **Check Frontend**:
   - Visit your Vercel URL
   - Verify the app loads

2. **Test API**:
   - Visit `https://your-app.vercel.app/api/health`
   - Should return: `{"status":"OK","timestamp":"..."}`

3. **Test Features**:
   - Add API key in Settings
   - Test meal suggestions
   - Verify data persistence (note: ephemeral in current setup)

## 🐛 Troubleshooting

### Build Fails

**Issue**: Build command fails
**Solution**:
- Check `package.json` has all dependencies
- Ensure Node.js version is compatible (18+)
- Check Vercel build logs for specific errors

### API Routes Return 404

**Issue**: `/api/*` routes not working
**Solution**:
- Verify `api/index.js` exists
- Check `vercel.json` rewrites configuration
- Ensure Express app is properly exported

### CORS Errors

**Issue**: CORS errors in browser
**Solution**:
- CORS is already configured in the serverless function
- Check browser console for specific errors
- Verify API base URL is correct

### Data Not Persisting

**Issue**: User data disappears
**Solution**:
- This is expected with current file-based storage
- Migrate to a database (see above)
- `/tmp` directory is ephemeral in serverless functions

## 📚 Next Steps

1. **Set up Database** (for production)
   - Choose a database provider
   - Update `api/index.js` to use database
   - Test data persistence

2. **Custom Domain** (optional)
   - Go to Vercel Dashboard → Settings → Domains
   - Add your custom domain
   - Configure DNS

3. **Environment Variables** (if needed later)
   - Vercel Dashboard → Settings → Environment Variables
   - Add variables for different environments

4. **Monitoring**
   - Enable Vercel Analytics
   - Set up error tracking (Sentry, etc.)

## 🔗 Useful Links

- [Vercel Documentation](https://vercel.com/docs)
- [Vercel Serverless Functions](https://vercel.com/docs/functions)
- [Vercel KV Documentation](https://vercel.com/docs/storage/vercel-kv)
- [Vercel Community](https://github.com/vercel/vercel/discussions)

## 📞 Support

For issues:
1. Check Vercel deployment logs
2. Review function logs in Vercel Dashboard
3. Check [Vercel Status](https://www.vercel-status.com/)

---

**Note**: The current setup works for development and testing. For production use, please migrate to a persistent database solution.
