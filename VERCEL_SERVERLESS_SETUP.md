# Deploy Backend to Vercel (Serverless)

**Note**: Vercel is primarily designed for serverless functions. This requires adapting your FastAPI app to work as serverless functions. This is more complex than Railway but possible.

## Important Considerations

⚠️ **Challenges with Vercel Serverless:**
- SQLite database won't persist (serverless functions are stateless)
- File uploads won't persist (need external storage like S3/Cloudinary)
- Cold starts on first request
- More complex setup

**Recommendation**: Use Railway instead (see `RAILWAY_DEPLOY.md`) unless you specifically need Vercel.

## If You Still Want Vercel...

### Option 1: Use Vercel with External Database

You'll need to:
1. Use PostgreSQL (Vercel Postgres, Supabase, or Railway Postgres)
2. Use external storage for uploads (AWS S3, Cloudinary, etc.)
3. Adapt FastAPI to work with serverless

### Option 2: Use Vercel Edge Functions (Limited)

Edge functions have limitations and may not work well with FastAPI.

### Option 3: Hybrid Approach

- Keep backend on Railway (recommended)
- Deploy frontend to Vercel
- This gives you the best of both worlds

## Recommended: Railway + Vercel Frontend

This is the best setup:

1. **Backend on Railway** (always awake, persistent storage)
   - Follow `RAILWAY_DEPLOY.md`
   
2. **Frontend on Vercel** (fast CDN, great for static sites)
   - Deploy frontend to Vercel
   - Set `VITE_API_URL` to Railway backend URL
   - Best performance and reliability

## Quick Vercel Frontend Deployment

1. Go to https://vercel.com
2. Sign up with GitHub
3. Click "New Project" → Import your repository
4. **Settings:**
   - Root Directory: `frontend`
   - Framework Preset: Vite
   - Build Command: `npm run build`
   - Output Directory: `dist`
5. **Environment Variables:**
   - `VITE_API_URL`: Your Railway backend URL
6. Deploy!

This gives you:
- ✅ Fast frontend on Vercel CDN
- ✅ Always-awake backend on Railway
- ✅ No sleep issues
- ✅ Best performance

## Conclusion

For your use case, **Railway for backend + Vercel for frontend** is the best solution. It avoids all the complexity of serverless while giving you the benefits of both platforms.

