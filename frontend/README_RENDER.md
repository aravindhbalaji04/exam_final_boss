# Render Deployment - Frontend Configuration

This frontend is configured for Render Static Site deployment.

## Quick Setup

1. **Create Static Site in Render**
   - Connect your GitHub repository
   - Set Root Directory: `frontend`
   - Build Command: `npm install && npm run build`
   - Publish Directory: `dist`

2. **Required Environment Variable**
   ```
   VITE_API_URL=https://your-backend-url.onrender.com
   ```
   (Replace with your actual backend URL)

3. **Deploy**
   - Render will build and deploy automatically
   - Your frontend will be available at: `https://your-site.onrender.com`

## Build Process

1. Install dependencies: `npm install`
2. Build for production: `npm run build`
3. Output directory: `dist/`

## Environment Variables

- `VITE_API_URL`: Your backend API URL (required)
- This is used in `src/config.ts` to configure all API endpoints

## Troubleshooting

- **Build fails**: Check Node.js version (18+ required)
- **API not working**: Verify `VITE_API_URL` is set correctly
- **404 errors**: Ensure `dist/` is set as publish directory

