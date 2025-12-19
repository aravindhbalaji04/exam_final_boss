# Keep Backend Alive - Quick Fix for Render

Render's free tier spins down after 15 minutes of inactivity. Here are several ways to keep your backend alive:

## Option 1: Use UptimeRobot (Recommended - Easiest)

1. **Sign up for UptimeRobot** (free)
   - Go to https://uptimerobot.com
   - Create a free account

2. **Add a Monitor**
   - Click "Add New Monitor"
   - **Monitor Type**: HTTP(s)
   - **Friendly Name**: Exam Platform Backend
   - **URL**: `https://your-backend.onrender.com/health`
   - **Monitoring Interval**: 5 minutes (free tier allows this)
   - Click "Create Monitor"

3. **Done!** 
   - UptimeRobot will ping your backend every 5 minutes
   - This keeps it awake and prevents spin-down

## Option 2: Use cron-job.org (Free)

1. **Sign up** at https://cron-job.org (free)

2. **Create a Cron Job**
   - **Title**: Keep Backend Alive
   - **Address**: `https://your-backend.onrender.com/health`
   - **Schedule**: Every 10 minutes
   - **Activate**: Yes
   - Save

## Option 3: Use GitHub Actions (Free)

Create `.github/workflows/keep-alive.yml`:

```yaml
name: Keep Backend Alive

on:
  schedule:
    - cron: '*/10 * * * *'  # Every 10 minutes
  workflow_dispatch:  # Allow manual trigger

jobs:
  ping:
    runs-on: ubuntu-latest
    steps:
      - name: Ping Backend
        run: |
          curl -f https://your-backend.onrender.com/health || exit 1
```

**Note**: Replace `your-backend.onrender.com` with your actual backend URL.

## Option 4: Use a Simple Script (Local)

If you have a computer that's always on, you can run this script:

**Windows (PowerShell)** - Save as `keep-alive.ps1`:
```powershell
while ($true) {
    try {
        Invoke-WebRequest -Uri "https://your-backend.onrender.com/health" -UseBasicParsing
        Write-Host "$(Get-Date): Backend is alive"
    } catch {
        Write-Host "$(Get-Date): Error: $_"
    }
    Start-Sleep -Seconds 600  # Wait 10 minutes
}
```

Run with: `powershell -ExecutionPolicy Bypass -File keep-alive.ps1`

**Linux/Mac** - Save as `keep-alive.sh`:
```bash
#!/bin/bash
while true; do
    curl -f https://your-backend.onrender.com/health
    echo "$(date): Backend pinged"
    sleep 600  # Wait 10 minutes
done
```

Run with: `chmod +x keep-alive.sh && ./keep-alive.sh`

## Recommendation

**Use UptimeRobot** - It's the easiest, most reliable, and completely free. It will keep your backend alive 24/7.

## Important Notes

- These solutions ping your `/health` endpoint to prevent spin-down
- Render free tier allows services to sleep, but pinging keeps them awake
- The first request after sleep may take 30-60 seconds (cold start)
- For production, consider upgrading to a paid plan or migrating to Railway/Fly.io

