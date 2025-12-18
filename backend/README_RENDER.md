# Render Deployment - Backend Configuration

This backend is configured for Render deployment.

## Quick Setup

1. **Create Web Service in Render**
   - Connect your GitHub repository
   - Set Root Directory: `backend`
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `uvicorn main:app --host 0.0.0.0 --port $PORT`

2. **Required Environment Variables**
   ```
   JWT_SECRET=your-secure-random-string-32-chars-minimum
   CORS_ORIGINS=https://your-frontend-url.onrender.com
   PORT=10000
   ```

3. **Deploy**
   - Render will automatically build and deploy
   - Your backend will be available at: `https://your-service.onrender.com`

## Important Notes

- **Database**: SQLite files are NOT persisted on free tier. Consider PostgreSQL for production.
- **Uploads**: File uploads directory is created automatically on startup.
- **Port**: Render sets `$PORT` automatically - use it in start command.

## Health Check

After deployment, verify it's working:
```
GET https://your-service.onrender.com/health
```

Should return: `{"status": "ok"}`

## API Documentation

Once deployed, access Swagger UI at:
```
https://your-service.onrender.com/docs
```

