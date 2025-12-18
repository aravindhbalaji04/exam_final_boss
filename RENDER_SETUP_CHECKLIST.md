# Render Deployment Checklist

Use this checklist to ensure everything is set up correctly for Render deployment.

## Pre-Deployment

- [ ] Code is pushed to GitHub repository
- [ ] `.gitignore` is configured (prevents committing sensitive files)
- [ ] `backend/uploads/.gitkeep` exists (ensures directory is tracked)
- [ ] All hardcoded URLs are replaced with environment variables (or will be updated)

## Backend Deployment

- [ ] Created Render account
- [ ] Created new Web Service in Render
- [ ] Connected GitHub repository
- [ ] Set Root Directory: `backend`
- [ ] Set Build Command: `pip install -r requirements.txt`
- [ ] Set Start Command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
- [ ] Added environment variable: `JWT_SECRET` (secure random string)
- [ ] Added environment variable: `CORS_ORIGINS` (will update after frontend deploy)
- [ ] Backend deployed successfully
- [ ] Backend URL noted: `https://________________.onrender.com`
- [ ] Health check works: `GET /health` returns `{"status": "ok"}`
- [ ] API docs accessible: `/docs` endpoint works

## Frontend Deployment

- [ ] Created new Static Site in Render
- [ ] Connected same GitHub repository
- [ ] Set Root Directory: `frontend`
- [ ] Set Build Command: `npm install && npm run build`
- [ ] Set Publish Directory: `dist`
- [ ] Added environment variable: `VITE_API_URL` (backend URL from above)
- [ ] Frontend deployed successfully
- [ ] Frontend URL noted: `https://________________.onrender.com`

## Post-Deployment

- [ ] Updated `CORS_ORIGINS` in backend with frontend URL
- [ ] Backend redeployed after CORS update
- [ ] Frontend can access backend API (no CORS errors)
- [ ] Registered teacher account via `/docs` endpoint
- [ ] Can login at frontend: `/#/teacher/login`
- [ ] Can create exam
- [ ] Can add questions
- [ ] Students can access exam selection
- [ ] Students can take exam

## Important Notes

⚠️ **Free Tier Limitations:**
- Services sleep after 15 minutes of inactivity
- First request after sleep takes ~30 seconds (cold start)
- Database (SQLite) is NOT persisted - resets on redeploy
- File uploads are NOT persisted - lost on redeploy

💡 **For Production:**
- Consider upgrading to paid plan for always-on service
- Use Render PostgreSQL for persistent database
- Use cloud storage (S3, Cloudinary) for file uploads

## Troubleshooting

- [ ] Backend build fails → Check `requirements.txt` and Python version
- [ ] Frontend build fails → Check Node.js version (18+)
- [ ] CORS errors → Verify `CORS_ORIGINS` includes frontend URL
- [ ] API not accessible → Check backend is running (not sleeping)
- [ ] Database resets → Expected on free tier, consider PostgreSQL

## Next Steps

- [ ] Set up custom domain (optional)
- [ ] Configure database persistence (PostgreSQL)
- [ ] Set up file upload to cloud storage
- [ ] Set up monitoring/alerts
- [ ] Configure backups

