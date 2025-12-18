# Deploy to Render - Step by Step Guide

This guide will help you deploy your Exam Platform to Render.

## Prerequisites

- GitHub account
- Render account (sign up at https://render.com - free tier available)

## Step 1: Push Code to GitHub

1. Initialize git (if not already done):
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   ```

2. Create a GitHub repository and push:
   ```bash
   git remote add origin https://github.com/yourusername/exam-platform.git
   git branch -M main
   git push -u origin main
   ```

## Step 2: Deploy Backend to Render

1. **Go to Render Dashboard**
   - Visit https://dashboard.render.com
   - Sign in or create account

2. **Create New Web Service**
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Select the repository

3. **Configure Backend Service**
   - **Name**: `exam-platform-backend` (or your preferred name)
   - **Region**: Choose closest to your users
   - **Branch**: `main` (or your default branch)
   - **Root Directory**: `backend`
   - **Environment**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`

4. **Add Environment Variables**
   Click "Advanced" → "Add Environment Variable" and add:
   
   ```
   JWT_SECRET=your-very-secure-random-string-min-32-characters
   ```
   (Generate a secure random string - you can use: `python -c "import secrets; print(secrets.token_urlsafe(32))"`)
   
   ```
   CORS_ORIGINS=https://exam-platform-frontend.onrender.com
   ```
   (We'll update this after deploying frontend)
   
   ```
   PORT=10000
   ```
   (Render sets this automatically, but good to have)

5. **Create Web Service**
   - Click "Create Web Service"
   - Render will start building and deploying
   - Wait for deployment to complete (usually 2-5 minutes)
   - Note your backend URL: `https://exam-platform-backend.onrender.com`

## Step 3: Deploy Frontend to Render

1. **Create New Static Site**
   - In Render dashboard, click "New +" → "Static Site"
   - Connect the same GitHub repository

2. **Configure Frontend Service**
   - **Name**: `exam-platform-frontend` (or your preferred name)
   - **Branch**: `main`
   - **Root Directory**: `frontend`
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `dist`

3. **Add Environment Variable**
   - Click "Environment" tab
   - Add environment variable:
     ```
     VITE_API_URL=https://exam-platform-backend.onrender.com
     ```
     (Use your actual backend URL from Step 2)

4. **Create Static Site**
   - Click "Create Static Site"
   - Render will build and deploy
   - Wait for deployment (usually 3-5 minutes)
   - Note your frontend URL: `https://exam-platform-frontend.onrender.com`

## Step 4: Update CORS in Backend

1. **Go back to Backend Service**
   - In Render dashboard, go to your backend service
   - Click "Environment" tab
   - Update `CORS_ORIGINS` to:
     ```
     CORS_ORIGINS=https://exam-platform-frontend.onrender.com
     ```
     (Use your actual frontend URL)

2. **Redeploy**
   - Click "Manual Deploy" → "Deploy latest commit"
   - Wait for redeployment

## Step 5: Create .gitkeep for Uploads

1. **Create uploads directory placeholder**
   ```bash
   cd backend
   touch uploads/.gitkeep
   git add uploads/.gitkeep
   git commit -m "Add uploads directory"
   git push
   ```

## Step 6: First Time Setup

1. **Register a Teacher Account**
   - Go to your backend URL: `https://exam-platform-backend.onrender.com/docs`
   - Use POST `/auth/register` endpoint
   - Body:
     ```json
     {
       "name": "Your Name",
       "email": "teacher@example.com",
       "password": "yourpassword",
       "role": "TEACHER"
     }
     ```

2. **Access the Application**
   - Frontend: `https://exam-platform-frontend.onrender.com`
   - Login at: `https://exam-platform-frontend.onrender.com/#/teacher/login`
   - Use your registered credentials

3. **Create Your First Exam**
   - Click "Create New Exam"
   - Add questions
   - Students can now access it!

## Important Notes

### Database Persistence
- Render's free tier **does NOT persist disk storage** between deployments
- Your SQLite database will be reset on each deploy
- **Solutions**:
  1. Use Render PostgreSQL (free tier available) - requires code changes
  2. Use external database service (Supabase, Railway, etc.)
  3. Upgrade to paid Render plan for persistent disk

### File Uploads
- Uploaded images are stored in `backend/uploads/`
- On free tier, these will be lost on redeploy
- Consider using cloud storage (AWS S3, Cloudinary, etc.) for production

### Auto-Deploy
- Render automatically deploys on every push to your main branch
- You can disable this in service settings if needed

### Custom Domain
- Render allows custom domains on free tier
- Go to service settings → "Custom Domains"
- Add your domain and follow DNS instructions

## Environment Variables Summary

### Backend
```
JWT_SECRET=your-secure-random-string
CORS_ORIGINS=https://your-frontend-url.onrender.com
PORT=10000
```

### Frontend
```
VITE_API_URL=https://your-backend-url.onrender.com
```

## Troubleshooting

### Backend won't start
- Check build logs in Render dashboard
- Ensure `requirements.txt` is correct
- Verify Python version (3.11+)

### CORS errors
- Make sure `CORS_ORIGINS` includes your frontend URL
- Check for trailing slashes
- Redeploy backend after changing CORS

### Frontend can't connect to backend
- Verify `VITE_API_URL` is set correctly
- Check backend is running (visit `/health` endpoint)
- Ensure backend URL is accessible

### Database resets
- This is expected on free tier
- Consider upgrading or using external database

## Cost

- **Free Tier**: 
  - 750 hours/month per service
  - Services sleep after 15 minutes of inactivity
  - Perfect for development/testing
- **Paid Plans**: Start at $7/month per service for always-on

## Next Steps

1. Set up database persistence (PostgreSQL or external)
2. Configure custom domain
3. Set up monitoring/alerts
4. Configure backups
5. Add SSL (automatically provided by Render)

## Support

- Render Docs: https://render.com/docs
- Render Community: https://community.render.com

