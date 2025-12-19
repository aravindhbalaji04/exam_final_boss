# Fix Backend Sleep Issue - Quick Guide

Your backend is turning off because Render's free tier spins down after 15 minutes of inactivity. Here are your options:

## 🚀 Quick Fix (5 minutes) - Keep Render Alive

**Use UptimeRobot** (Recommended - Easiest):
1. Sign up at https://uptimerobot.com (free)
2. Add monitor: HTTP(s) → `https://your-backend.onrender.com/health`
3. Set interval: 5 minutes
4. Done! Backend stays awake 24/7

See `KEEP_ALIVE_SOLUTION.md` for more options.

## 🎯 Best Long-term Solution - Migrate to Railway

Railway's free tier **doesn't sleep**, so your backend stays awake 24/7 automatically.

**Benefits:**
- ✅ No sleep issues
- ✅ Persistent storage (SQLite database persists)
- ✅ Easy deployment
- ✅ Free tier: $5 credit/month (usually enough)

**Steps:**
1. Follow `RAILWAY_DEPLOY.md` for detailed instructions
2. Takes ~10 minutes to migrate
3. Update frontend `VITE_API_URL` to Railway backend URL
4. Done!

## 📋 All Solutions

| Solution | Time | Cost | Persistence | Recommendation |
|----------|------|------|-------------|----------------|
| **UptimeRobot** | 2 min | Free | ✅ | Quick fix |
| **Railway** | 10 min | Free* | ✅ | Best long-term |
| **GitHub Actions** | 5 min | Free | ✅ | If you use GitHub |
| **cron-job.org** | 3 min | Free | ✅ | Alternative |

*Railway free tier: $5 credit/month, usually enough for small apps

## 🎨 Recommended Setup

**Best Performance:**
- **Backend**: Railway (always awake, persistent storage)
- **Frontend**: Vercel (fast CDN, great performance)

This gives you:
- ✅ No sleep issues
- ✅ Fast frontend delivery
- ✅ Persistent database
- ✅ Best user experience

## 📚 Documentation

- `KEEP_ALIVE_SOLUTION.md` - Keep Render alive (quick fixes)
- `RAILWAY_DEPLOY.md` - Migrate to Railway (recommended)
- `VERCEL_SERVERLESS_SETUP.md` - Vercel info (not recommended for backend)

## ⚡ Quick Start

**Option 1: Quick Fix (2 minutes)**
```bash
# Use UptimeRobot - see KEEP_ALIVE_SOLUTION.md
```

**Option 2: Best Solution (10 minutes)**
```bash
# Follow RAILWAY_DEPLOY.md
# 1. Sign up at railway.app
# 2. Deploy backend
# 3. Update frontend VITE_API_URL
# 4. Done!
```

## 🔧 Current Issue

- **Problem**: Render free tier sleeps after 15 min inactivity
- **Symptom**: "Invalid token" errors when backend is down
- **Solution**: Keep it awake OR migrate to Railway

Choose the solution that works best for you!

