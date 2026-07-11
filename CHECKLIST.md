# TeamSync AI - Complete Setup Checklist

A comprehensive checklist to ensure you've set up everything correctly.

## Pre-Setup Requirements

- [ ] Node.js 16+ installed (`node --version`)
- [ ] npm installed (`npm --version`)
- [ ] Git installed
- [ ] GitHub account created
- [ ] Firebase account created (free tier available)
- [ ] OpenAI account with API credits
- [ ] Text editor (VS Code recommended)

---

## Firebase Setup

### Create Firebase Project

- [ ] Go to [Firebase Console](https://console.firebase.google.com/)
- [ ] Click "Add project"
- [ ] Enter project name: `teamsync-ai` (or your preferred name)
- [ ] Accept terms and create project
- [ ] Wait for project creation (2-3 minutes)

### Enable Authentication

- [ ] In Firebase Console, go to **Authentication**
- [ ] Click **Get Started** or **Create project**
- [ ] Click **Email/Password** provider
- [ ] Enable **Email/Password**
- [ ] Click **Save**
- [ ] Go to **Settings** tab
- [ ] Disable **Sign-in with one-tap prompt**

### Create Firestore Database

- [ ] Go to **Firestore Database**
- [ ] Click **Create database**
- [ ] Select **Start in test mode** (for development)
- [ ] Choose closest region
- [ ] Click **Create**
- [ ] Wait for database creation

### Get Firebase Configuration

- [ ] Go to **Project Settings** (gear icon)
- [ ] Under "Your apps", click **Web** icon (looks like: `</>`)`
- [ ] Enter app name: `TeamSync AI`
- [ ] Check "Also set up Firebase Hosting" (optional)
- [ ] Click **Register app**
- [ ] Copy the Firebase config object
- [ ] Save the config for later

Configuration should look like:
```javascript
const firebaseConfig = {
  apiKey: "AIzaSyD...",
  authDomain: "yourproject.firebaseapp.com",
  projectId: "yourproject",
  storageBucket: "yourproject.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123..."
};
```

### Create Firebase Service Account

- [ ] In **Project Settings**, go to **Service Accounts** tab
- [ ] Click **Generate New Private Key**
- [ ] A JSON file downloads automatically
- [ ] Keep this file safe (DO NOT commit to Git!)
- [ ] Extract these values:
  - `project_id` → Copy to `.env` as `FIREBASE_PROJECT_ID`
  - `private_key` → Copy to `.env` as `FIREBASE_PRIVATE_KEY`
  - `client_email` → Copy to `.env` as `FIREBASE_CLIENT_EMAIL`

### Set Firestore Security Rules

- [ ] Go to **Firestore Database** → **Rules** tab
- [ ] Replace existing rules with content from `backend/firestore.rules`
- [ ] Click **Publish**
- [ ] Confirm publishing

---

## Get OpenAI API Key

- [ ] Go to [OpenAI Platform](https://platform.openai.com/)
- [ ] Sign up or log in
- [ ] Go to **API keys** section
- [ ] Click **Create new secret key**
- [ ] Copy the key (save immediately, won't show again)
- [ ] Store safely (DO NOT commit to Git!)
- [ ] Add to `backend/.env` as `OPENAI_API_KEY`

#### Check API Credits
- [ ] Go to [Billing Overview](https://platform.openai.com/account/billing/overview)
- [ ] Verify you have credits available
- [ ] Set usage limits if needed

---

## Frontend Setup

### Initialize Project

- [ ] Navigate to `frontend` folder:
  ```bash
  cd frontend
  ```
- [ ] Install dependencies:
  ```bash
  npm install
  ```

### Configure Environment

- [ ] Create `.env.local` file in `frontend/` folder
- [ ] Copy from `.env.local.example`:
  ```
  NEXT_PUBLIC_FIREBASE_API_KEY=
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
  NEXT_PUBLIC_FIREBASE_PROJECT_ID=
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
  NEXT_PUBLIC_FIREBASE_APP_ID=
  NEXT_PUBLIC_API_URL=http://localhost:5000/api
  ```
- [ ] Fill in Firebase config values from Step 1

### Test Frontend

- [ ] Start development server:
  ```bash
  npm run dev
  ```
- [ ] Open http://localhost:3000
- [ ] Verify home page loads
- [ ] Stop server (Ctrl+C)

---

## Backend Setup

### Initialize Project

- [ ] Navigate to `backend` folder:
  ```bash
  cd ../backend
  ```
- [ ] Install dependencies:
  ```bash
  npm install
  ```

### Configure Environment

- [ ] Create `.env` file in `backend/` folder
- [ ] Copy from `.env.example`:
  ```
  FIREBASE_PROJECT_ID=
  FIREBASE_PRIVATE_KEY=
  FIREBASE_CLIENT_EMAIL=
  OPENAI_API_KEY=
  PORT=5000
  NODE_ENV=development
  CORS_ORIGIN=http://localhost:3000
  ```
- [ ] Fill in values from Firebase service account and OpenAI

### Build TypeScript

- [ ] Build TypeScript to JavaScript:
  ```bash
  npm run build
  ```
- [ ] Verify `dist/` folder is created
- [ ] Verify no build errors

### Test Backend

- [ ] Start development server:
  ```bash
  npm run dev
  ```
- [ ] Verify server starts:
  ```
  ╔════════════════════════════════════════╗
  ║     TeamSync AI Backend Server          ║
  ║     Running on port 5000                ║
  ```
- [ ] Test health endpoint in another terminal:
  ```bash
  curl http://localhost:5000/api/health
  ```
- [ ] Verify response:
  ```json
  {"success":true,"message":"Server is running"...}
  ```
- [ ] Stop server (Ctrl+C)

---

## Local Development - Full Test

### Terminal 1 - Frontend
```bash
cd frontend
npm run dev
# Should see:
# > ready - started server on 0.0.0.0:3000, url: http://localhost:3000
```

### Terminal 2 - Backend
```bash
cd backend
npm run dev
# Should see:
# ╔════════════════════════════════════════╗
# ║     TeamSync AI Backend Server          ║
# ║     Running on port 5000                ║
```

### Test Application

- [ ] Open http://localhost:3000 in browser
- [ ] See landing page with Login/Signup buttons
- [ ] Click **Sign Up**
- [ ] Create account with email and password
- [ ] Verify you're redirected to dashboard
- [ ] Verify welcome message appears
- [ ] Click **+ New Project**
- [ ] Create a project
- [ ] Click **+ New Task**
- [ ] Enter task title and description
- [ ] Click **🤖 AI Suggest Priority & Summary**
- [ ] Verify AI suggestion appears
- [ ] Complete task creation
- [ ] Verify task appears on board
- [ ] Test task status changes
- [ ] Check analytics page

---

## Git & Version Control

- [ ] Initialize git:
  ```bash
  git init
  git add .
  git commit -m "Initial commit: TeamSync AI"
  ```

- [ ] Create `.gitignore` (already should be there)
- [ ] Verify `.env` and `.env.local` are in `.gitignore`
- [ ] Verify `node_modules/` is in `.gitignore`

### GitHub Setup
- [ ] Create GitHub repository
- [ ] Add remote:
  ```bash
  git remote add origin https://github.com/yourusername/teamsync-ai.git
  git branch -M main
  git push -u origin main
  ```

---

## Deployment - Pre-Production

### Frontend - Vercel

- [ ] Create Vercel account (vercel.com)
- [ ] Import GitHub repository
- [ ] Configure:
  - [ ] Framework: Next.js
  - [ ] Root directory: `frontend`
  - [ ] Build command: `npm run build`
- [ ] Add environment variables:
  - [ ] All `NEXT_PUBLIC_*` variables from `.env.local`
- [ ] Deploy by pushing to `main`
- [ ] Verify deployment:
  - [ ] Visit your Vercel URL
  - [ ] Check home page loads
  - [ ] Note the URL (e.g., `https://teamsync-ai.vercel.app`)

### Backend - Railway

- [ ] Create Railway account (railway.app)
- [ ] Import GitHub repository
- [ ] Configure:
  - [ ] Root directory: `backend`
  - [ ] Start command: `npm start`
  - [ ] Build command: `npm install && npm run build`
- [ ] Add environment variables:
  - [ ] All variables from `backend/.env`
- [ ] Deploy
- [ ] Verify deployment:
  - [ ] Get Railway URL
  - [ ] Test: `curl {railway-url}/api/health`
  - [ ] Should return success response

### Update Frontend with Backend URL

- [ ] In Vercel dashboard
- [ ] Go to **Settings** → **Environment Variables**
- [ ] Update `NEXT_PUBLIC_API_URL=https://{railway-url}/api`
- [ ] Redeploy frontend
- [ ] Test AI features on production

---

## Security Checklist

- [ ] `.env` files are in `.gitignore`
- [ ] Firebase private key is NOT in git
- [ ] OpenAI API key is NOT in git
- [ ] Firestore security rules are published
- [ ] CORS_ORIGIN is set to frontend URL
- [ ] HTTPS enabled on both frontend and backend
- [ ] Rate limiting considered for production
- [ ] Error messages don't expose sensitive info

---

## Performance Verification

### Frontend
- [ ] Page loads in < 3 seconds
- [ ] Interactions are responsive (< 100ms)
- [ ] Images load properly
- [ ] No console errors

### Backend
- [ ] Health check responds < 100ms
- [ ] AI analysis completes < 5 seconds
- [ ] Metrics endpoint responds < 500ms

### Database
- [ ] Firestore writes are instant
- [ ] Real-time updates appear < 1 second
- [ ] No timeout errors

---

## Final Verification

### Feature Testing

- [ ] ✅ User can sign up
- [ ] ✅ User can log in
- [ ] ✅ User can create project
- [ ] ✅ User can add team members
- [ ] ✅ User can create tasks
- [ ] ✅ AI suggests priority
- [ ] ✅ AI generates summary
- [ ] ✅ Task status updates in real-time
- [ ] ✅ All users see task updates
- [ ] ✅ Analytics show correct metrics
- [ ] ✅ Kanban board displays tasks
- [ ] ✅ User can filter by project
- [ ] ✅ User can logout

### Data Verification

- [ ] Firestore has users collection
- [ ] Firestore has projects collection
- [ ] Firestore has tasks collection
- [ ] Users can see their data only
- [ ] Project members can see project tasks
- [ ] Data persists after logout/login

### Error Handling

- [ ] Invalid login shows error message
- [ ] Missing task fields shows validation error
- [ ] API errors are handled gracefully
- [ ] Network errors show retry option
- [ ] 401 errors redirect to login

---

## Documentation

- [ ] [ ] README.md is comprehensive
- [ ] README.md has all setup steps
- [ ] SETUP_GUIDE.md is detailed
- [ ] DEPLOYMENT.md covers all platforms
- [ ] API.md documents all endpoints
- [ ] ARCHITECTURE.md explains system design
- [ ] Code comments are clear
- [ ] TypeScript types are properly defined

---

## Optimization (Optional)

- [ ] [ ] Code splitting working
- [ ] Frontend is minified
- [ ] Backend has error logging
- [ ] Firebase indexes are created
- [ ] CDN caching is enabled
- [ ] Images are optimized
- [ ] Database queries are efficient

---

## Team Handoff

- [ ] [ ] Code is commented
- [ ] README is easy to follow
- [ ] Setup takes < 30 minutes
- [ ] Deploy takes < 10 minutes
- [ ] All team members can run locally
- [ ] All team members can deploy

---

## Post-Launch Monitoring

### Daily
- [ ] Check Firebase usage
- [ ] Monitor error logs
- [ ] Verify backups

### Weekly
- [ ] Review user feedback
- [ ] Check OpenAI usage costs
- [ ] Monitor performance metrics

### Monthly
- [ ] Review analytics
- [ ] Update dependencies
- [ ] Plan features

---

## Success Criteria

✅ **Development**
- Both frontend and backend run locally
- Real-time features work
- AI features produce correct output

✅ **Deployment**
- Frontend deployed to Vercel
- Backend deployed to Railway
- Both are publicly accessible
- Frontend connects to backend

✅ **Security**
- Data access is controlled
- Credentials are not exposed
- HTTPS is enabled

✅ **Performance**
- Pages load quickly
- Real-time updates are instant
- No error spikes

✅ **Documentation**
- Setup instructions are clear
- Code is well-commented
- Team can maintain it

---

## Troubleshooting Reference

| Issue | Solution |
|-------|----------|
| Port 3000 already in use | `lsof -i :3000` then `kill -9 <PID>` |
| Port 5000 already in use | `lsof -i :5000` then `kill -9 <PID>` |
| Firebase won't connect | Check .env.local with correct values |
| Backend returns 401 | Verify Firebase Admin SDK config |
| AI not working | Check OpenAI API key and credits |
| Tasks not syncing | Check Firestore rules are published |
| CORS errors | Verify CORS_ORIGIN in backend .env |

---

## Success! 🎉

If you've checked all boxes, your TeamSync AI application is:
- ✅ Fully functional locally
- ✅ Deployed to production
- ✅ Ready for team use
- ✅ Scalable and maintainable
- ✅ Well documented

**Time to celebrate and start using it! 🚀**

---

## Next Steps

1. Invite team members to Firebase project
2. Create first projects and tasks
3. Monitor usage and gather feedback
4. Plan features for v2
5. Celebrate your full-stack success! 🎊

---

**Created:** 2024
**Last Updated:** 2024
**Status:** Production Ready
