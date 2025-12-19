# Deploy Backend to Railway (No Sleep Issues!)

Railway's free tier **doesn't sleep**, making it perfect for keeping your backend always available.

## Why Railway?

- ✅ **No sleep** - Services stay awake 24/7 on free tier
- ✅ **Easy deployment** - Just connect GitHub repo
- ✅ **Free tier** - $5 free credit monthly (usually enough for small apps)
- ✅ **Automatic HTTPS** - SSL certificates included
- ✅ **Environment variables** - Easy to configure
- ✅ **Persistent storage** - SQLite database persists

## Step-by-Step Deployment

### 1. Create Railway Account

1. Go to https://railway.app
2. Click "Start a New Project"
3. Sign up with GitHub (recommended)

### 2. Deploy Backend

1. **New Project**
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your repository

2. **Configure Service**
   - Railway will auto-detect Python
   - If not, click "Settings" → "Source" → Set root directory to `backend`
   - Railway will automatically detect `requirements.txt`

3. **Set Start Command** (if needed)
   - Go to "Settings" → "Deploy"
   - Start Command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
   - Railway sets `$PORT` automatically

4. **Add Environment Variables**
   - Go to "Variables" tab
   - Add these variables:
     ```
     JWT_SECRET=your-very-secure-random-string-min-32-chars
     CORS_ORIGINS=https://your-frontend-url.vercel.app
     ```
   - Generate JWT_SECRET: `python -c "import secrets; print(secrets.token_urlsafe(32))"`

5. **Deploy**
   - Railway will automatically deploy
   - Wait 2-3 minutes for first deployment
   - Your backend URL will be: `https://your-app-name.up.railway.app`

### 3. Get Your Backend URL

1. Go to your service in Railway dashboard
2. Click "Settings" → "Networking"
3. Click "Generate Domain" if not already generated
4. Copy the URL (e.g., `https://exam-platform-production.up.railway.app`)

### 4. Update Frontend

1. **If using Vercel:**
   - Go to your Vercel project
   - Settings → Environment Variables
   - Update `VITE_API_URL` to your Railway backend URL

2. **If using Render:**
   - Go to your Render static site
   - Environment tab
   - Update `VITE_API_URL` to your Railway backend URL

### 5. Update CORS in Backend

1. Go back to Railway dashboard
2. Variables tab
3. Update `CORS_ORIGINS` to include your frontend URL:
   ```
   CORS_ORIGINS=https://your-frontend.vercel.app,https://your-frontend.onrender.com
   ```
4. Railway will automatically redeploy

## Railway Configuration File (Optional)

Create `railway.json` in your `backend` folder for advanced configuration:

```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "uvicorn main:app --host 0.0.0.0 --port $PORT",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

## Environment Variables Summary

### Required Variables:
```
JWT_SECRET=your-secure-random-string
CORS_ORIGINS=https://your-frontend-url.com
```

### Optional Variables:
```
PORT=4000  # Railway sets this automatically
DB_PATH=data.sqlite
UPLOAD_DIR=uploads
```

## Database Persistence

- Railway provides **persistent disk storage** on free tier
- Your SQLite database (`data.sqlite`) will persist between deployments
- File uploads in `uploads/` directory will also persist

## Cost

- **Free Tier**: $5 credit/month
- **Usage**: ~$0.01/hour for a small Python app
- **Monthly**: Usually stays within free tier for small apps
- **No sleep**: Services run 24/7

## Custom Domain (Optional)

1. Go to Settings → Networking
2. Click "Custom Domain"
3. Add your domain
4. Follow DNS instructions

## Monitoring

Railway provides:
- Real-time logs
- Metrics (CPU, Memory, Network)
- Deployment history
- Automatic rollback on failure

## Troubleshooting

### Build Fails
- Check that `requirements.txt` is in `backend/` directory
- Verify Python version (Railway auto-detects, but you can specify in `runtime.txt`)

### Service Won't Start
- Check logs in Railway dashboard
- Verify start command is correct
- Ensure `PORT` environment variable is used (Railway sets this automatically)

### CORS Errors
- Make sure `CORS_ORIGINS` includes your frontend URL
- No trailing slashes in URLs
- Include protocol (https://)

### Database Issues
- SQLite file persists in Railway's filesystem
- If you need to reset, you can delete the service and redeploy

## Migration from Render

1. Deploy to Railway (follow steps above)
2. Update frontend `VITE_API_URL` to Railway backend URL
3. Update Railway `CORS_ORIGINS` with frontend URL
4. Test everything works
5. You can keep Render service as backup or delete it

## Next Steps

1. ✅ Backend is now always awake on Railway
2. ✅ Update frontend to use Railway backend URL
3. ✅ Test all functionality
4. ✅ Monitor usage in Railway dashboard

## Support

- Railway Docs: https://docs.railway.app
- Railway Discord: https://discord.gg/railway

