# TeamSync AI - Complete Setup Guide

A complete guide to set up the TeamSync AI application from scratch.

## 📋 Table of Contents
1. [Prerequisites](#prerequisites)
2. [Firebase Project Setup](#firebase-project-setup)
3. [Frontend Setup](#frontend-setup)
4. [Backend Setup](#backend-setup)
5. [Running Locally](#running-locally)
6. [Deployment](#deployment)

---

## Prerequisites

You'll need:
- **Node.js** 16+ and npm
- **Git** for version control
- **Firebase Account** (free tier is sufficient)
- **OpenAI API Key** (for AI features)

### Install Node.js
Download from https://nodejs.org/

### Verify Installation
```bash
node --version  # Should be v16 or higher
npm --version
```

---

## Firebase Project Setup

### Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project"
3. Enter project name (e.g., "TeamSync AI")
4. Accept the terms and create project
5. Wait for project creation (2-3 minutes)

### Step 2: Enable Authentication

1. In Firebase Console, go to **Authentication**
2. Click **Get Started**
3. Select **Email/Password**
4. Enable **Email/Password**
5. Go to **Settings** tab
6. Disable **Sign in with one-tap prompt** (for simplicity)

### Step 3: Create Firestore Database

1. Go to **Firestore Database**
2. Click **Create database**
3. Select **Start in test mode** (for development)
4. Choose your region (closest to you)
5. Create database

### Step 4: Get Firebase Config

1. Go to **Project Settings** (gear icon)
2. Under "Your apps", click on icon to add Web app
3. Enter app name: "TeamSync AI"
4. Check "Also set up Firebase Hosting" (optional)
5. Click **Register app**
6. Copy the Firebase config object (you'll need this)

Your config will look like:
```javascript
{
  apiKey: "AIzaSyD...",
  authDomain: "yourproject.firebaseapp.com",
  projectId: "yourproject",
  storageBucket: "yourproject.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123..."
}
```

### Step 5: Create Firebase Service Account (for Backend)

1. In **Project Settings**, scroll down
2. Go to **Service Accounts** tab
3. Click **Generate New Private Key**
4. A JSON file downloads - keep it safe!
5. Extract these fields from the downloaded JSON:
   - `project_id` → `FIREBASE_PROJECT_ID`
   - `private_key` → `FIREBASE_PRIVATE_KEY`
   - `client_email` → `FIREBASE_CLIENT_EMAIL`

### Step 6: Set Firestore Security Rules

1. Go to **Firestore Database** → **Rules** tab
2. Replace the existing rules with the content from `backend/firestore.rules`
3. Click **Publish**

---

## Frontend Setup

### Step 1: Navigate to Frontend Directory
```bash
cd frontend
```

### Step 2: Install Dependencies
```bash
npm install
```

### Step 3: Configure Environment Variables

Create `.env.local` file in the `frontend` folder and add:

```env
# From Firebase
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Backend API URL
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

**Important**: Replace the values with your actual Firebase configuration from Step 4

### Step 4: Test Frontend Locally
```bash
npm run dev
```

Visit http://localhost:3000 - you should see the landing page!

---

## Backend Setup

### Step 1: Navigate to Backend Directory
```bash
cd backend
```

### Step 2: Install Dependencies
```bash
npm install
```

### Step 3: Configure Environment Variables

Create `.env` file in the `backend` folder:

```env
# Firebase Admin SDK
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_PRIVATE_KEY=your_private_key_from_service_account
FIREBASE_CLIENT_EMAIL=your_service_account_email

# OpenAI API Key
# Get from https://platform.openai.com/api-keys
OPENAI_API_KEY=sk-your_openai_key_here

# Server Configuration
PORT=5000
NODE_ENV=development

# CORS - allows requests from frontend
CORS_ORIGIN=http://localhost:3000
```

### Step 4: Get OpenAI API Key

1. Go to [OpenAI API Keys](https://platform.openai.com/api-keys)
2. Sign up or log in
3. Click **New secret key**
4. Copy the key and paste in `.env`

⚠️ **Important**: Keep this key secret! Never commit it to version control.

### Step 5: Build TypeScript
```bash
npm run build
```

### Step 6: Test Backend Locally
```bash
npm run dev
```

You should see:
```
╔════════════════════════════════════════╗
║     TeamSync AI Backend Server          ║
║     Running on port 5000                ║
║     Environment: development            ║
╚════════════════════════════════════════╝
```

Test the health endpoint:
```bash
curl http://localhost:5000/api/health
```

---

## Running Locally

### Terminal 1 - Backend
```bash
cd backend
npm run dev
```

### Terminal 2 - Frontend
```bash
cd frontend
npm run dev
```

### Access the App
- Frontend: http://localhost:3000
- Backend: http://localhost:5000/api

### First Test
1. Sign up with any email
2. Create a project
3. Create a task and click "🤖 AI Suggest Priority & Summary"
4. Create more tasks and see real-time updates

---

## Deployment

### Frontend Deployment (Vercel)

#### Step 1: Prepare for Deployment
```bash
cd frontend
npm run build
```

#### Step 2: Create Vercel Account
1. Go to [Vercel](https://vercel.com)
2. Sign up with GitHub
3. Authorize Vercel

#### Step 3: Deploy
```bash
npm install -g vercel
vercel
```

#### Step 4: Configure Environment Variables
1. In Vercel dashboard, select your project
2. Go to **Settings** → **Environment Variables**
3. Add all variables from `.env.local`
4. Redeploy

#### Access
Your app will be at `https://your-project.vercel.app`

---

### Backend Deployment (Railway or Render)

#### Option A: Railway.app

##### Step 1: Prepare Backend
```bash
cd backend
npm run build
```

##### Step 2: Create Railway Account
1. Go to [Railway](https://railway.app)
2. Sign up with GitHub
3. Authorize Railway

##### Step 3: Deploy
```bash
npm install -g railway
railway login
railway init
railway up
```

##### Step 4: Set Environment Variables
1. In Railway dashboard
2. Click **Variables**
3. Add all `.env` variables
4. Redeploy

##### Step 5: Get Production URL
```bash
railway open
```

---

#### Option B: Render.com

##### Step 1: Connect GitHub
1. Go to [Render](https://render.com)
2. Sign up with GitHub
3. Authorize Render

##### Step 2: Create New Web Service
1. Click **New** → **Web Service**
2. Select your repository
3. Configure:
   - Name: `teamsync-ai-backend`
   - Environment: **Node**
   - Build Command: `npm install && npm run build`
   - Start Command: `npm start`

##### Step 3: Add Environment Variables
1. In Settings, scroll to **Environment**
2. Add all variables from `.env`
3. Click **Create Web Service**

---

### Update Frontend with Production Backend URL

After deploying backend, update frontend:

1. In Vercel dashboard
2. **Settings** → **Environment Variables**
3. Update `NEXT_PUBLIC_API_URL` to your backend URL (e.g., `https://your-backend.railway.app/api`)
4. Redeploy frontend

---

## Firestore Data Structure

Your Firestore will automatically create these collections:

```
Firestore Database
├── users/
│   └── {userId}
│       ├── email: string
│       ├── displayName: string
│       ├── role: "ADMIN" | "PROJECT_MANAGER" | "DEVELOPER"
│       ├── createdAt: timestamp
│       └── isActive: boolean
│
├── projects/
│   └── {projectId}
│       ├── name: string
│       ├── description: string
│       ├── ownerId: string
│       ├── members: [{userId, email, role, joinedAt}]
│       ├── status: "ACTIVE" | "ARCHIVED"
│       └── createdAt: timestamp
│
└── tasks/
    └── {taskId}
        ├── projectId: string
        ├── title: string
        ├── description: string
        ├── assigneeId: string
        ├── status: "TODO" | "IN_PROGRESS" | "DONE"
        ├── priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT"
        ├── aiSummary: string
        ├── estimatedHours: number
        ├── createdAt: timestamp
        └── labels: [string]
```

---

## Troubleshooting

### Frontend can't connect to backend
- Check backend is running on `localhost:5000`
- Check `NEXT_PUBLIC_API_URL` in frontend `.env.local`
- Check CORS is enabled in backend

### AI endpoint returns 401 Unauthorized
- Check Firebase Admin SDK configuration
- Verify `FIREBASE_PRIVATE_KEY` format (should preserve `\n`)
- Make sure user is authenticated

### OpenAI API errors
- Check API key is valid
- Check you have API credits
- Monitor usage at https://platform.openai.com/account/billing/overview

### Tasks not showing real-time updates
- Check Firestore Rules are published
- Check user has read permissions (is project member)
- Check browser console for errors

---

## Next Steps

1. **Add More Features**:
   - Email notifications for task updates
   - File attachments for tasks
   - Team collaboration chat
   - Advanced reporting

2. **Scale the Backend**:
   - Add database seeding
   - Implement caching with Redis
   - Add rate limiting

3. **Improve Frontend**:
   - Add dark mode
   - Mobile app with React Native
   - Progressive Web App (PWA)

4. **Monitoring**:
   - Set up error tracking (Sentry)
   - Add analytics (Google Analytics)
   - Monitor API performance

---

## Support

For issues:
1. Check the troubleshooting section
2. Review Firebase documentation
3. Check OpenAI API documentation
4. Search existing issues on GitHub

---

**Happy coding! 🚀**
