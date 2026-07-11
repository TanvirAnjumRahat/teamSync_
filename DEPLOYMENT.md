# TeamSync AI - Deployment Guide

This guide walks through deploying TeamSync AI to production.

## Prerequisites

- ✅ Frontend and backend running locally
- ✅ All environment variables configured
- ✅ Firebase project set up
- ✅ GitHub repository (recommended)
- ✅ OpenAI API key with credits

## Architecture Overview

```
┌─────────────────────────────────────────────┐
│         Client Browser (User)               │
└────────────────┬────────────────────────────┘
                 │
    ┌────────────┴────────────┬─────────────┐
    │                         │             │
    ▼                         ▼             ▼
┌────────────┐         ┌────────────┐ ┌─────────┐
│   Vercel   │         │  Railway/  │ │Firebase │
│(Frontend)  │◄───────►│  Render    │ │(DB/Auth)│
│ Next.js    │         │(Backend)   │ └─────────┘
│            │         │ Express    │      │
└────────────┘         └────────────┘      │
                              │            │
                              ▼            │
                       ┌────────────┐      │
                       │ OpenAI API │      │
                       └────────────┘      │
                                           ▼
                                    ┌────────────┐
                                    │ Firestore  │
                                    │  Database  │
                                    └────────────┘
```

## Step 1: Prepare GitHub Repository

### Create GitHub Repository

```bash
cd TeamSync

# Initialize git (if not already done)
git init

# Create .gitignore
cat > .gitignore << 'EOF'
# Dependencies
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Environment variables (NEVER commit these!)
.env
.env.local
.env.*.local

# Build outputs
dist/
build/
.next/
out/

# IDE
.vscode/
.idea/
*.swp
*.swo
*~

# OS
.DS_Store
Thumbs.db

# Logs
logs/
*.log
EOF

# Add and commit
git add .
git commit -m "Initial commit: TeamSync AI full-stack app"

# Create GitHub repository and push
# (Use GitHub's web interface or gh CLI)
git remote add origin https://github.com/yourusername/teamsync-ai.git
git branch -M main
git push -u origin main
```

## Step 2: Deploy Frontend to Vercel

### Option A: Using Vercel CLI

```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Navigate to frontend
cd frontend

# Deploy
vercel

# Follow the prompts:
# - Scope: Select your Vercel account
# - Project name: teamsync-ai
# - Directory: ./
# - Build command: npm run build
# - Output directory: .next
```

### Option B: Using GitHub Integration (Recommended)

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **"Add New..."** → **"Project"**
3. Import your GitHub repository
4. Select the `frontend` directory as root
5. Configure environment variables (see Step 2b)
6. Click **"Deploy"**

### Step 2b: Configure Environment Variables on Vercel

1. In Vercel dashboard, select your project
2. Go to **Settings** → **Environment Variables**
3. Add all variables from `frontend/.env.local`:
   - `NEXT_PUBLIC_FIREBASE_API_KEY`
   - `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
   - `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
   - `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
   - `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
   - `NEXT_PUBLIC_FIREBASE_APP_ID`
   - `NEXT_PUBLIC_API_URL` (set after backend deployment)
4. Click **"Save"**
5. Trigger redeploy
6. Get your Vercel URL (something like `https://teamsync-ai.vercel.app`)

## Step 3: Deploy Backend to Railway

### Step 3a: Create Railway Account

1. Go to [Railway.app](https://railway.app)
2. Sign up with GitHub
3. Authorize Railway

### Step 3b: Deploy Backend

**Option 1: Using Railway CLI**

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Navigate to backend
cd backend

# Initialize Railway project
railway init

# Deploy
railway up
```

**Option 2: Using Railway Dashboard (Recommended)**

1. Go to [Railway Dashboard](https://railway.app/dashboard)
2. Click **"New Project"** → **"Deploy from GitHub repo"**
3. Select your repository
4. Select `backend` directory as root
5. Configure settings:
   - **Start Command**: `npm start`
   - **Build Command**: `npm install && npm run build`
6. Continue

### Step 3c: Set Environment Variables on Railway

1. In Railway project dashboard
2. Go to **Variables**
3. Add environment variables from `backend/.env`:
   - `FIREBASE_PROJECT_ID`
   - `FIREBASE_PRIVATE_KEY` (paste the full key, Railway handles newlines)
   - `FIREBASE_CLIENT_EMAIL`
   - `OPENAI_API_KEY`
   - `PORT` (set to `5000`)
   - `NODE_ENV` (set to `production`)
   - `CORS_ORIGIN` (set to your Vercel URL: `https://teamsync-ai.vercel.app`)
4. Click **"Save"**
5. Railway will auto-redeploy with new variables

### Step 3d: Get Production Backend URL

1. In Railway dashboard, click on "backend" service
2. Go to **Settings** → **Public Networking**
3. Copy the public URL (something like `https://teamsync-ai-backend-prod.railway.app`)
4. This is your `NEXT_PUBLIC_API_URL`

## Step 4: Update Frontend with Backend URL

1. Go to Vercel dashboard
2. Select your frontend project
3. Go to **Settings** → **Environment Variables**
4. Find `NEXT_PUBLIC_API_URL` and update it with Railway URL
5. Set it to: `https://your-backend-railway-url/api`
6. Click **"Save"**
7. Trigger redeploy

## Step 5: Update CORS on Backend

1. Go to Railway dashboard
2. Select backend project
3. Go to **Variables**
4. Update `CORS_ORIGIN` if needed (should be your Vercel URL)
5. Save and redeploy

## Step 6: Test Production Deployment

### Frontend
1. Go to your Vercel URL
2. Try to sign up and log in
3. Create a project and task
4. Check if AI "Suggest" button works

### Backend
```bash
# Test health endpoint
curl https://your-backend.railway.app/api/health

# Response should be:
# {"success":true,"message":"Server is running",...}
```

### Firestore
Make sure Firestore security rules are published:
1. Go to Firebase Console
2. Firestore Database → Rules
3. Verify rules are set correctly
4. Publish if needed

## Alternative Backend Deployment: Render.com

If you prefer Render instead of Railway:

### Step 1: Create Render Account
1. Go to [Render.com](https://render.com)
2. Sign up with GitHub
3. Authorize Render

### Step 2: Deploy Backend

1. Click **"New"** → **"Web Service"**
2. Connect your GitHub repository
3. Configure:
   - **Name**: `teamsync-ai-backend`
   - **Root Directory**: `backend`
   - **Environment**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
4. Select a region (closest to you)
5. Click **"Create Web Service"**

### Step 3: Set Environment Variables
1. In Render dashboard, go to **Environment**
2. Add all variables from `backend/.env`
3. Save
4. Render will auto-deploy

### Step 4: Get Production URL
1. Go to your service page
2. Copy the public URL under service name
3. Use this for `NEXT_PUBLIC_API_URL` on frontend

## Monitoring & Maintenance

### Check Logs

**Vercel Frontend**
1. Go to Vercel dashboard
2. Click project
3. Go to **Deployments** → select deployment → **Logs**

**Railway Backend**
1. Go to Railway dashboard
2. Click backend service
3. Go to **Logs** tab

### Monitor API Usage

**OpenAI**
1. Go to [OpenAI Platform](https://platform.openai.com/account/usage/overview)
2. Check API usage and costs
3. Set usage limits if needed

**Firebase**
1. Go to Firebase Console
2. Go to **Firestore** → **Usage**
3. Monitor read/write operations
4. Check Database size

### Enable HTTPS
- Vercel: Automatic (HTTPS enabled by default)
- Railway/Render: Automatic (HTTPS enabled by default)

## Troubleshooting

### Frontend can't connect to backend
- Check `NEXT_PUBLIC_API_URL` is correct
- Check CORS is enabled on backend
- Check backend is running and accessible
- Look for errors in browser console

### Backend returning 401 errors
- Check Firebase Admin SDK credentials are correct
- Verify `FIREBASE_PRIVATE_KEY` format (should have `\n` for newlines)
- Check `FIRESTORE_PROJECT_ID` matches Firebase project

### OpenAI API errors
- Check API key is valid
- Verify you have API credits at https://platform.openai.com/account/billing
- Check current rate limits

### Firestore errors
- Make sure Firestore security rules are published
- Check user has proper permissions
- Verify CORS_ORIGIN includes your frontend URL

## Performance Optimization

### Frontend (Vercel)
- ✅ Automatic code splitting
- ✅ Image optimization
- ✅ CDN caching
- Add: Analytics to monitor performance

### Backend (Railway/Render)
- ✅ Auto-scaling (premium tier)
- Add: Caching layer (Redis)
- Add: Rate limiting
- Add: Request logging

## Security Checklist

- [ ] All environment variables are secret (not in git)
- [ ] Firebase security rules are restrictive
- [ ] CORS_ORIGIN is set correctly
- [ ] API key rotated regularly
- [ ] HTTPS enabled
- [ ] Helmet security headers enabled
- [ ] Rate limiting configured
- [ ] Error messages don't expose sensitive info

## Scaling for Production

1. **Database**
   - Firebase handles auto-scaling
   - Monitor Firestore usage

2. **Backend**
   - Railway: Upgrade to paid tier for auto-scaling
   - Render: Similar auto-scaling options

3. **Frontend**
   - Vercel: Already global CDN
   - Enable edge middleware for faster responses

4. **Monitoring**
   - Add Sentry for error tracking
   - Add Datadog for performance monitoring
   - Add LogRocket for frontend debugging

## CI/CD Pipeline

For automated deployments with GitHub:

**Vercel** - Automatic:
- Every push to `main` deploys frontend
- Every pull request gets preview URL

**Railway/Render** - Automatic:
- Changes to `backend/` directory trigger rebuild
- Deployment happens automatically after build succeeds

## Backup & Recovery

**Firestore**
1. Go to Firebase Console
2. Firestore Database → Manage Imports/Exports
3. Click **Export Collections**
4. Store backup in Google Cloud Storage

**Code**
- GitHub is your backup
- All code changes are tracked
- Can revert to any previous commit

## Next Steps

1. ✅ Monitor production for errors
2. ✅ Collect user feedback
3. ✅ Add more features based on feedback
4. ✅ Optimize based on analytics
5. ✅ Scale infrastructure as needed

---

**Congratulations! TeamSync AI is now live! 🎉**

Your application is accessible at your Vercel URL.
Backend API is running on Railway/Render.
Database is managed by Firebase.

For questions, refer to the main [README.md](README.md) and [SETUP_GUIDE.md](SETUP_GUIDE.md).
