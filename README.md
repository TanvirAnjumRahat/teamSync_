# TeamSync AI - Smart IT Productivity & Issue Tracker

[![MIT License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-14+-black?logo=next.js)](https://nextjs.org/)
[![Firebase](https://img.shields.io/badge/Firebase-Latest-orange?logo=firebase)](https://firebase.google.com/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green?logo=node.js)](https://nodejs.org/)
[![OpenAI](https://img.shields.io/badge/OpenAI-GPT--3.5+-412991?logo=openai)](https://openai.com/)

A complete full-stack web application for smart project and issue tracking with AI-powered features, real-time collaboration, and comprehensive analytics.

## ✨ Features

### Core Features
- ✅ **User Authentication** - Email/Password signup and login with role-based access (ADMIN, PROJECT_MANAGER, DEVELOPER)
- ✅ **Project Management** - Create, read, update, delete projects with team member management
- ✅ **Task/Issue Tracking** - Full-featured task management with status (TODO, IN_PROGRESS, DONE) and priority (LOW, MEDIUM, HIGH, URGENT)
- ✅ **AI Integration** - OpenAI GPT API for smart task analysis, summary generation, and priority suggestions
- ✅ **Real-Time Updates** - Firestore listeners for instant task board updates across team members
- ✅ **Analytics Dashboard** - Beautiful charts showing task metrics, team workload, and productivity trends
- ✅ **Responsive Design** - Mobile-friendly interface with Tailwind CSS

### Tech Stack

**Frontend**
- Next.js 14+ with App Router
- TypeScript for type safety
- Tailwind CSS for styling
- Firebase SDK for real-time database
- Recharts for analytics visualizations
- Zustand for state management (optional)

**Backend**
- Node.js with Express
- Firebase Admin SDK
- OpenAI API for AI features
- CORS and security headers (Helmet)

**Database & Auth**
- Firebase Authentication (Email/Password)
- Firestore NoSQL database
- Real-time listeners for live updates

**Deployment**
- Frontend: Vercel
- Backend: Railway or Render
- Database: Firebase (fully managed)

## 🚀 Quick Start

### Prerequisites
- Node.js 16+
- Firebase account (free)
- OpenAI API key

### Installation (5 minutes)

1. **Clone or download this project**
```bash
cd TeamSync
```

2. **Firebase Setup** (see detailed guide in SETUP_GUIDE.md)
   - Create Firebase project
   - Enable Authentication (Email/Password)
   - Create Firestore Database
   - Get Firebase config
   - Create Service Account for backend

3. **Frontend Setup**
```bash
cd frontend
npm install
cp .env.local.example .env.local
# Edit .env.local with your Firebase config
npm run dev
```

4. **Backend Setup** (in new terminal)
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with Firebase Admin credentials and OpenAI key
npm run dev
```

5. **Open Application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000/api

### First Time Setup

1. Sign up with email and password
2. Create your first project
3. Create a task and use the "🤖 AI Suggest" button
4. See real-time updates as tasks status changes
5. Check analytics dashboard for insights

## 📁 Project Structure

```
TeamSync/
├── frontend/                      # Next.js 14 frontend
│   ├── app/                       # App Router pages
│   │   ├── auth/                  # Authentication pages
│   │   ├── dashboard/             # Main dashboard
│   │   ├── projects/              # Project pages
│   │   ├── analytics/             # Analytics dashboard
│   │   └── layout.tsx             # Root layout
│   ├── components/                # Reusable components
│   │   ├── auth/                  # Auth components
│   │   ├── dashboard/             # Dashboard components
│   │   ├── projects/              # Project components
│   │   └── tasks/                 # Task components
│   ├── contexts/                  # React contexts
│   │   └── AuthContext.tsx        # Authentication context
│   ├── hooks/                     # Custom hooks
│   │   └── useFirestore.ts        # Firestore real-time hooks
│   ├── lib/                       # Utility libraries
│   │   ├── firebase.ts            # Firebase configuration
│   │   └── api.ts                 # API client
│   ├── types/                     # TypeScript types
│   │   └── index.ts               # Shared type definitions
│   └── package.json
│
├── backend/                       # Express.js backend
│   ├── src/
│   │   ├── index.ts               # Express server entry point
│   │   ├── middleware/
│   │   │   └── auth.ts            # Firebase token verification
│   │   ├── routes/
│   │   │   └── index.ts           # API routes
│   │   └── controllers/
│   │       └── aiController.ts    # AI analysis endpoints
│   ├── config/
│   │   ├── firebase.ts            # Firebase Admin SDK setup
│   │   └── openai.ts              # OpenAI client setup
│   ├── firestore.rules            # Firestore security rules
│   └── package.json
│
├── SETUP_GUIDE.md                 # Detailed setup instructions
└── README.md                      # This file
```

## 🔐 Security Features

- ✅ Firebase Authentication with secure tokens
- ✅ Firestore Security Rules for data access control
- ✅ Role-based access control (RBAC)
- ✅ CORS protection
- ✅ Helmet for security headers
- ✅ Private key management via environment variables

## 📊 API Endpoints

### Health Check
```
GET /api/health
Response: { success: true, message: "Server is running" }
```

### AI Analysis
```
POST /api/ai/analyze-task
Headers: Authorization: Bearer {firebaseIdToken}
Body: { title: string, description: string }
Response: { 
  summary: string, 
  suggestedPriority: "LOW|MEDIUM|HIGH|URGENT", 
  estimatedHours?: number 
}
```

### Project Metrics
```
GET /api/projects/{projectId}/metrics
Headers: Authorization: Bearer {firebaseIdToken}
Response: { 
  total: number, 
  completed: number, 
  inProgress: number, 
  todo: number, 
  completionRate: number 
}
```

## 🌐 Deployment

### Frontend to Vercel
```bash
cd frontend
npm run build
vercel deploy
# Add environment variables in Vercel dashboard
```

### Backend to Railway/Render
- Push to GitHub
- Connect repository to Railway or Render
- Add environment variables
- Auto-deploy on push

See detailed deployment steps in [SETUP_GUIDE.md](SETUP_GUIDE.md#deployment)

## 📚 Firestore Data Schema

```javascript
// Users collection
users/{userId}
  - id: string
  - email: string
  - displayName: string
  - role: "ADMIN" | "PROJECT_MANAGER" | "DEVELOPER"
  - createdAt: timestamp
  - isActive: boolean

// Projects collection
projects/{projectId}
  - name: string
  - description: string
  - ownerId: string
  - members: [{userId, email, displayName, role, joinedAt}]
  - status: "ACTIVE" | "ARCHIVED"
  - createdAt: timestamp

// Tasks collection
tasks/{taskId}
  - projectId: string
  - title: string
  - description: string
  - assigneeId: string (optional)
  - status: "TODO" | "IN_PROGRESS" | "DONE"
  - priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT"
  - aiSummary: string (from OpenAI)
  - estimatedHours: number (optional)
  - createdById: string
  - createdAt: timestamp
  - labels: [string]
```

## 🛠️ Development

### Frontend Development
```bash
cd frontend

# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build

# Run linter
npm run lint
```

### Backend Development
```bash
cd backend

# Install dependencies
npm install

# Start dev server with hot reload
npm run dev

# Build TypeScript
npm run build

# Start production server
npm start
```

## 📖 Documentation

- [SETUP_GUIDE.md](SETUP_GUIDE.md) - Complete setup instructions
- [DEPLOYMENT.md](DEPLOYMENT.md) - Detailed deployment guide (create this)
- [API.md](API.md) - API documentation (create this)

## 🐛 Troubleshooting

### Backend can't connect to Firebase
- Check `FIREBASE_PROJECT_ID`, `FIREBASE_PRIVATE_KEY`, and `FIREBASE_CLIENT_EMAIL` in `.env`
- Ensure private key has proper line breaks

### Frontend can't reach backend API
- Check backend is running on `localhost:5000`
- Verify `NEXT_PUBLIC_API_URL` in `.env.local`
- Check CORS settings in backend

### OpenAI API returning errors
- Verify API key is valid and has credits
- Check error message in backend console
- Review OpenAI usage at https://platform.openai.com/account/billing

See more troubleshooting in [SETUP_GUIDE.md](SETUP_GUIDE.md#troubleshooting)

## 📝 Environment Variables Reference

### Frontend (.env.local)
```env
NEXT_PUBLIC_FIREBASE_API_KEY
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
NEXT_PUBLIC_FIREBASE_PROJECT_ID
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
NEXT_PUBLIC_FIREBASE_APP_ID
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

### Backend (.env)
```env
FIREBASE_PROJECT_ID
FIREBASE_PRIVATE_KEY
FIREBASE_CLIENT_EMAIL
OPENAI_API_KEY
PORT=5000
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000
```

## 🎯 Future Enhancements

- [ ] Email notifications for task updates
- [ ] File attachments for tasks
- [ ] Team collaboration chat
- [ ] Advanced reporting and exports
- [ ] Mobile app (React Native)
- [ ] Dark mode
- [ ] Progressive Web App (PWA)
- [ ] Custom filters and search
- [ ] Time tracking integration
- [ ] Calendar view for tasks

## 📄 License

MIT License - feel free to use this project for personal or commercial use.

## 🤝 Contributing

Contributions are welcome! Feel free to:
1. Fork the project
2. Create a feature branch
3. Submit a pull request

## 💬 Support

For help:
1. Read [SETUP_GUIDE.md](SETUP_GUIDE.md)
2. Check troubleshooting section
3. Review Firebase documentation
4. Check OpenAI API docs

## 👨‍💻 Author

Created as a complete full-stack example for learning Next.js, Firebase, and API integration.

---

**Happy building! 🚀**

If you find this helpful, please give it a ⭐ and share with others!
#   T e a m S y n c  
 