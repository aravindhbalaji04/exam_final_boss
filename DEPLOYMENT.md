# Deployment Guide

This guide will help you deploy the Exam Platform to production.

## Prerequisites

- Python 3.11+ installed
- Node.js 18+ installed
- A hosting service account (Railway, Render, Vercel, etc.)

## Option 1: Deploy to Railway (Recommended - Easy)

### Backend Deployment

1. **Create Railway Account**
   - Go to https://railway.app
   - Sign up with GitHub

2. **Deploy Backend**
   - Click "New Project" → "Deploy from GitHub repo"
   - Select your repository
   - Railway will auto-detect Python
   - Set root directory to `backend`
   - Add environment variables:
     ```
     JWT_SECRET=your-very-secure-secret-key-here
     CORS_ORIGINS=https://your-frontend-url.vercel.app
     PORT=4000
     ```
   - Railway will automatically deploy

3. **Get Backend URL**
   - Railway will provide a URL like: `https://your-app.railway.app`
   - Note this URL for frontend configuration

### Frontend Deployment

1. **Deploy to Vercel**
   - Go to https://vercel.com
   - Sign up with GitHub
   - Click "New Project" → Import your repository
   - Set root directory to `frontend`
   - Add environment variable:
     ```
     VITE_API_URL=https://your-backend.railway.app
     ```
   - Deploy

2. **Update Frontend API URLs**
   - After deployment, update all API calls in frontend to use the backend URL
   - Or use environment variable: `import.meta.env.VITE_API_URL`

## Option 2: Deploy to Render

### Backend Deployment

1. **Create Render Account**
   - Go to https://render.com
   - Sign up

2. **Deploy Backend**
   - Click "New" → "Web Service"
   - Connect your GitHub repository
   - Settings:
     - **Name**: exam-platform-backend
     - **Root Directory**: backend
     - **Environment**: Python 3
     - **Build Command**: `pip install -r requirements.txt`
     - **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
   - Add environment variables:
     ```
     JWT_SECRET=your-secret-key
     CORS_ORIGINS=https://your-frontend.onrender.com
     ```
   - Deploy

### Frontend Deployment

1. **Deploy to Render**
   - Click "New" → "Static Site"
   - Connect repository
   - Settings:
     - **Root Directory**: frontend
     - **Build Command**: `npm install && npm run build`
     - **Publish Directory**: `dist`
   - Add environment variable:
     ```
     VITE_API_URL=https://your-backend.onrender.com
     ```

## Option 3: Self-Hosted (VPS)

### Backend Setup

1. **SSH into your server**
   ```bash
   ssh user@your-server-ip
   ```

2. **Install dependencies**
   ```bash
   sudo apt update
   sudo apt install python3-pip python3-venv nginx
   ```

3. **Clone repository**
   ```bash
   git clone your-repo-url
   cd exam_final_boss/backend
   ```

4. **Setup virtual environment**
   ```bash
   python3 -m venv .venv
   source .venv/bin/activate
   pip install -r requirements.txt
   ```

5. **Create .env file**
   ```bash
   nano .env
   ```
   Add:
   ```
   JWT_SECRET=your-secret-key
   CORS_ORIGINS=https://your-domain.com
   PORT=4000
   ```

6. **Run with systemd**
   ```bash
   sudo nano /etc/systemd/system/exam-backend.service
   ```
   Add:
   ```ini
   [Unit]
   Description=Exam Platform Backend
   After=network.target

   [Service]
   User=your-user
   WorkingDirectory=/path/to/exam_final_boss/backend
   Environment="PATH=/path/to/exam_final_boss/backend/.venv/bin"
   ExecStart=/path/to/exam_final_boss/backend/.venv/bin/uvicorn main:app --host 0.0.0.0 --port 4000
   Restart=always

   [Install]
   WantedBy=multi-user.target
   ```
   ```bash
   sudo systemctl enable exam-backend
   sudo systemctl start exam-backend
   ```

7. **Setup Nginx reverse proxy**
   ```bash
   sudo nano /etc/nginx/sites-available/exam-backend
   ```
   Add:
   ```nginx
   server {
       listen 80;
       server_name api.your-domain.com;

       location / {
           proxy_pass http://127.0.0.1:4000;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
       }
   }
   ```
   ```bash
   sudo ln -s /etc/nginx/sites-available/exam-backend /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl reload nginx
   ```

### Frontend Setup

1. **Build frontend**
   ```bash
   cd frontend
   npm install
   npm run build
   ```

2. **Setup Nginx for frontend**
   ```bash
   sudo nano /etc/nginx/sites-available/exam-frontend
   ```
   Add:
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;

       root /path/to/exam_final_boss/frontend/dist;
       index index.html;

       location / {
           try_files $uri $uri/ /index.html;
       }
   }
   ```
   ```bash
   sudo ln -s /etc/nginx/sites-available/exam-frontend /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl reload nginx
   ```

3. **Setup SSL with Let's Encrypt**
   ```bash
   sudo apt install certbot python3-certbot-nginx
   sudo certbot --nginx -d your-domain.com -d api.your-domain.com
   ```

## Environment Variables

### Backend (.env)
```
JWT_SECRET=your-very-secure-secret-key-min-32-chars
CORS_ORIGINS=https://your-frontend-domain.com
PORT=4000
ENVIRONMENT=production
```

### Frontend (.env)
```
VITE_API_URL=https://your-backend-domain.com
```

## Important Notes

1. **Change JWT_SECRET**: Use a strong, random secret key in production
2. **Update CORS**: Add your frontend URL to CORS_ORIGINS
3. **Database**: SQLite works for small scale. For production, consider PostgreSQL
4. **File Uploads**: Ensure `uploads/` directory has write permissions
5. **HTTPS**: Always use HTTPS in production
6. **Backup**: Regularly backup `data.sqlite` database

## Quick Start (Development)

```bash
# Backend
cd backend
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 4000

# Frontend (new terminal)
cd frontend
npm install
npm run dev
```

## Troubleshooting

- **CORS errors**: Check CORS_ORIGINS includes your frontend URL
- **Database errors**: Ensure SQLite file has write permissions
- **Upload errors**: Check uploads/ directory exists and is writable
- **Port conflicts**: Change PORT in .env if 4000 is taken

