# Quick Deployment Guide

## 🚀 Deployment Options

### Option 1: Render (All-in-One) - Easiest
See [RENDER_DEPLOY.md](./RENDER_DEPLOY.md) for detailed Render deployment instructions.

### Option 2: Railway + Vercel (Recommended for Production)

### Step 1: Deploy Backend to Railway (5 minutes)

1. Go to https://railway.app and sign up with GitHub
2. Click "New Project" → "Deploy from GitHub repo"
3. Select your repository
4. Railway will auto-detect Python
5. In project settings:
   - Set **Root Directory** to `backend`
   - Add environment variables:
     ```
     JWT_SECRET=generate-a-random-32-char-string-here
     CORS_ORIGINS=https://your-app.vercel.app
     PORT=4000
     ```
6. Railway will deploy automatically
7. Copy your Railway URL (e.g., `https://your-app.railway.app`)

### Step 2: Deploy Frontend to Vercel (5 minutes)

1. Go to https://vercel.com and sign up with GitHub
2. Click "New Project" → Import your repository
3. Configure:
   - **Root Directory**: `frontend`
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. Add environment variable:
   ```
   VITE_API_URL=https://your-app.railway.app
   ```
   (Use the Railway URL from Step 1)
5. Deploy!

### Step 3: Update CORS

1. Go back to Railway project settings
2. Update `CORS_ORIGINS` to include your Vercel URL:
   ```
   CORS_ORIGINS=https://your-app.vercel.app
   ```
3. Redeploy backend

### Step 4: Update Frontend API URLs

The frontend is already configured to use `VITE_API_URL` environment variable. Just make sure it's set in Vercel!

## ✅ Done!

Your app is now live:
- Frontend: `https://your-app.vercel.app`
- Backend: `https://your-app.railway.app`
- API Docs: `https://your-app.railway.app/docs`

## 🔧 First Time Setup

1. Register a teacher account:
   - Go to `https://your-app.railway.app/docs`
   - Use POST `/auth/register`
   - Body:
     ```json
     {
       "name": "Teacher Name",
       "email": "teacher@example.com",
       "password": "securepassword",
       "role": "TEACHER"
     }
     ```

2. Login at `https://your-app.vercel.app/#/teacher/login`

3. Create exams and start using!

## 📝 Important Notes

- **JWT_SECRET**: Generate a secure random string (32+ characters)
- **Database**: SQLite file persists on Railway
- **Uploads**: Images are stored in `uploads/` directory
- **HTTPS**: Both Railway and Vercel provide HTTPS automatically

## 🆘 Troubleshooting

- **CORS errors**: Make sure `CORS_ORIGINS` includes your Vercel URL
- **API not working**: Check `VITE_API_URL` in Vercel environment variables
- **Database issues**: Railway persists SQLite, but consider PostgreSQL for production

## 💰 Cost

- **Railway**: Free tier available (500 hours/month)
- **Vercel**: Free tier available (unlimited for personal projects)
- **Total**: $0/month for small scale usage!

