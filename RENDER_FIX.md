# Fix for NetworkError on Render

## Problem
The frontend was using hardcoded `http://127.0.0.1:4000` URLs instead of the environment variable, causing NetworkError when deployed.

## Solution Applied
✅ All frontend files now use `API_ENDPOINTS` from `config.ts` which reads from `VITE_API_URL` environment variable.

## Next Steps to Fix Your Deployment

### 1. Commit and Push Changes
```bash
git add .
git commit -m "Fix: Use environment variables for API URLs"
git push origin main
```

### 2. Verify Frontend Environment Variable in Render

1. Go to your Render dashboard
2. Select your **Frontend Static Site**
3. Go to **Environment** tab
4. Verify `VITE_API_URL` is set to your backend URL:
   ```
   VITE_API_URL=https://your-backend-service.onrender.com
   ```
   (Replace with your actual backend URL)

### 3. Rebuild Frontend

Render should auto-redeploy after you push, but if not:
1. Go to your Frontend service in Render
2. Click **Manual Deploy** → **Deploy latest commit**
3. Wait for build to complete

### 4. Verify Backend CORS

1. Go to your **Backend Web Service** in Render
2. Go to **Environment** tab
3. Verify `CORS_ORIGINS` includes your frontend URL:
   ```
   CORS_ORIGINS=https://your-frontend-service.onrender.com
   ```
4. If changed, click **Save Changes** (will auto-redeploy)

### 5. Test

1. Open your frontend URL
2. Check browser console (F12) for any errors
3. Try logging in as teacher
4. Try accessing exam selection as student

## Troubleshooting

### Still Getting NetworkError?

1. **Check Environment Variable**
   - Frontend must have `VITE_API_URL` set
   - Value must be your backend URL (with https://)
   - No trailing slash

2. **Check CORS**
   - Backend `CORS_ORIGINS` must include frontend URL
   - Exact match (including https://)
   - No trailing slash

3. **Check Backend is Running**
   - Visit: `https://your-backend.onrender.com/health`
   - Should return: `{"status": "ok"}`
   - If 404 or error, backend isn't running

4. **Check Browser Console**
   - Open DevTools (F12)
   - Look for CORS errors or network errors
   - Check what URL it's trying to fetch

5. **Rebuild Frontend**
   - Sometimes Vite cache causes issues
   - In Render, trigger manual rebuild
   - Or add to build command: `rm -rf node_modules dist && npm install && npm run build`

## Quick Test

After redeploy, test these URLs in your browser:

1. Backend health: `https://your-backend.onrender.com/health`
2. Backend docs: `https://your-backend.onrender.com/docs`
3. Frontend: `https://your-frontend.onrender.com`

All should work without errors!

