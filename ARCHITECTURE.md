# TeamSync AI - Architecture & Data Flow

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          CLIENT BROWSER                                  │
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │              Next.js Frontend (Vercel)                           │  │
│  │                                                                  │  │
│  │  ┌────────────────┐  ┌──────────────┐  ┌─────────────────┐    │  │
│  │  │  Auth Pages    │  │  Dashboard   │  │ Project Board   │    │  │
│  │  │ • Login        │  │ • Analytics  │  │ • Kanban Tasks  │    │  │
│  │  │ • Signup       │  │ • Metrics    │  │ • Create Tasks  │    │  │
│  │  └────────────────┘  └──────────────┘  └─────────────────┘    │  │
│  │         │                   │                   │              │  │
│  │         └───────────────────┴───────────────────┘              │  │
│  │                     │                                           │  │
│  │            ┌────────▼────────┐                                  │  │
│  │            │ AuthContext     │                                  │  │
│  │            │ (User State)    │                                  │  │
│  │            └────────┬────────┘                                  │  │
│  │                     │                                           │  │
│  │  ┌──────────────────┴──────────────────┐                        │  │
│  │  │                                     │                        │  │
│  │  ▼                                     ▼                        │  │
│  │ Firebase SDK                    API Client                      │  │
│  │ (Real-time listeners)           (Axios)                        │  │
│  │                                                                  │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                       │                          │                     │
└───────────────────────┼──────────────────────────┼─────────────────────┘
                        │                          │
           ┌────────────┴──────────────┐          │
           │                           │          │
           ▼                           ▼          │
    ┌────────────────┐        ┌─────────────┐    │
    │  Firebase      │        │   Express   │    │
    │  (Firestore)   │        │   Backend   │    │
    │                │        │ (Railway)   │    │
    │ • Database     │        │             │    │
    │ • Auth         │        │ ┌─────────┐ │    │
    │ • Realtime     │        │ │Middleware│ │    │
    │   Updates      │        │ │ • Auth   │ │    │
    │                │        │ └─────────┘ │    │
    │ Security Rules │        │             │    │
    │ • RBAC         │        │ ┌─────────┐ │    │
    │ • Data Access  │        │ │Routes   │ │    │
    │   Control      │        │ │ • /api/ │ │    │
    │                │        │ └─────────┘ │    │
    │                │        │             │    │
    │                │        │ ┌─────────┐ │    │
    │                │        │ │Handlers │ │    │
    │                │        │ │ • AI    │ │    │
    │                │        │ │ • Tasks │ │    │
    │                │        │ └─────────┘ │    │
    │                │        │             │    │
    │                │        │ ┌─────────┐ │    │
    │                │        │ │Firebase │ │    │
    │                │        │ │ Admin   │ │    │
    │                │        │ └─────────┘ │    │
    └────────────────┘        └─────────────┘    │
           │                           │          │
           │      ┌────────────────────┴──────────┘
           │      │
           └──────┴─────┐
                        │
                        ▼
             ┌──────────────────┐
             │   OpenAI API     │
             │  (GPT-3.5-turbo) │
             │                  │
             │ • Task Analysis  │
             │ • Priority       │
             │   Suggestion     │
             │ • Summary        │
             │   Generation     │
             └──────────────────┘
```

## Data Flow Diagrams

### Authentication Flow

```
User
  │
  ├─ Signup/Login Form
  │     │
  │     ▼
  │ Firebase Auth
  │     │
  │     ├─ Verify Email/Password
  │     ├─ Generate ID Token
  │     │
  │     ▼
  │ Create/Update User Doc in Firestore
  │     │
  │     ▼
  │ Store Token in Browser
  │     │
  │     ▼
  │ AuthContext (App State)
  │     │
  │     ▼
  │ Redirect to Dashboard
```

### Task Creation with AI Flow

```
User Creates Task
         │
         ▼
Task Form (Title + Description)
         │
         ├─ Store in Component State
         │
         ▼
Click "AI Suggest"
         │
         ▼
Prepare Request
         │
         ├─ Get Firebase ID Token
         ├─ Include Task Title & Description
         │
         ▼
POST /api/ai/analyze-task
         │
         ├─ Backend receives request
         │
         ├─ Verify Firebase ID Token
         │
         ├─ Extract User ID
         │
         ├─ Create OpenAI Prompt
         │
         ├─ Call OpenAI API (GPT-3.5-turbo)
         │
         ├─ Parse AI Response
         │
         ├─ Validate priority & hours
         │
         ▼
Return Response
         │
         ├─ Summary (string)
         ├─ Suggested Priority
         ├─ Estimated Hours
         │
         ▼
Frontend Updates Form
         │
         ├─ Display AI summary
         ├─ Update priority dropdown
         ├─ Fill estimated hours
         │
         ▼
User Submits Task
         │
         ├─ Firestore Security Rules check
         │
         ├─ Add to /tasks collection
         │
         ├─ Trigger real-time listeners
         │
         ▼
All Users See Update (Real-time)
```

### Real-time Updates Flow

```
User A Updates Task Status
         │
         ▼
Update /tasks/{taskId} in Firestore
         │
         ├─ Firestore triggers update event
         │
         ├─ Broadcast to all listeners
         │
         ▼
Firestore Listeners (User B, C, D)
         │
         ├─ useProjectTasks Hook triggered
         │
         ├─ Update local state
         │
         ├─ Re-render component
         │
         ▼
All Users See Same View (Instantly)
```

## Component Hierarchy

```
RootLayout
├─ AuthProvider (Auth Context)
│  └─ Page Components
│     ├─ PublicPages
│     │  ├─ Home
│     │  ├─ Login
│     │  └─ Signup
│     │
│     └─ ProtectedRoute
│        └─ DashboardLayout
│           ├─ Sidebar
│           │  ├─ Navigation Links
│           │  ├─ User Profile
│           │  └─ Logout Button
│           │
│           └─ Content Area
│              ├─ Dashboard Page
│              │  ├─ Welcome Message
│              │  ├─ Metrics Cards
│              │  └─ Projects List
│              │
│              ├─ Project Page
│              │  ├─ Project Header
│              │  ├─ Team Members
│              │  └─ KanbanBoard
│              │     ├─ Column (TODO)
│              │     ├─ Column (IN_PROGRESS)
│              │     └─ Column (DONE)
│              │        └─ TaskCard
│              │           ├─ Title
│              │           ├─ Priority Badge
│              │           └─ Status Selector
│              │
│              ├─ TaskCreation Page
│              │  ├─ Form Inputs
│              │  ├─ AI Suggest Button
│              │  └─ Submit Button
│              │
│              └─ Analytics Page
│                 ├─ Metrics Cards
│                 ├─ StatusChart (Pie)
│                 ├─ PriorityChart (Bar)
│                 ├─ ProjectChart (Bar)
│                 └─ Progress Bars
```

## Firestore Collections Schema

```
Firestore Database
│
├─ users/{userId}                   [O(n) read complexity]
│  ├─ id: string (= userId)
│  ├─ email: string
│  ├─ displayName: string
│  ├─ photoURL?: string
│  ├─ role: "ADMIN" | "PROJECT_MANAGER" | "DEVELOPER"
│  ├─ createdAt: timestamp
│  ├─ updatedAt: timestamp
│  └─ isActive: boolean
│
├─ projects/{projectId}             [O(b) read complexity]
│  ├─ id: string (= projectId)
│  ├─ name: string
│  ├─ description: string
│  ├─ ownerId: string (reference to user)
│  ├─ members: array<{            [Max 20MB per document]
│  │    userId: string
│  │    email: string
│  │    displayName: string
│  │    role: "OWNER" | "MANAGER" | "MEMBER"
│  │    joinedAt: timestamp
│  │  }>
│  ├─ status: "ACTIVE" | "ARCHIVED"
│  ├─ createdAt: timestamp
│  └─ updatedAt: timestamp
│
└─ tasks/{taskId}                   [O(a) read complexity]
   ├─ id: string (= taskId)
   ├─ projectId: string (reference)
   ├─ title: string
   ├─ description: string
   ├─ assigneeId?: string (reference to user)
   ├─ status: "TODO" | "IN_PROGRESS" | "DONE"
   ├─ priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT"
   ├─ aiSummary?: string
   ├─ estimatedHours?: number
   ├─ createdById: string (reference)
   ├─ createdAt: timestamp
   ├─ updatedAt: timestamp
   ├─ updatedById: string
   ├─ dueDate?: timestamp
   └─ labels?: array<string>
```

## Security Model

```
┌─────────────────────────────────────┐
│     Authentication Layer            │
│  (Firebase ID Token Verification)   │
└────────────────┬────────────────────┘
                 │
      ┌──────────┴──────────┐
      │                     │
      ▼                     ▼
  Frontend            Backend
  (Client            (Express
   Side)               Middleware)
      │                     │
      ├─ JWT in             ├─ Verify JWT
      │  LocalStorage        ├─ Extract UID
      │                      ├─ Attach to req
      └─ Auto-retry         │
         on 401              │
      │                     │
      └─────┬───────────────┘
            │
            ▼
     Firestore Security Rules
            │
     ┌──────┴──────┐
     │             │
     ▼             ▼
  Read Check   Write Check
  (RBAC)       (Ownership)
     │             │
     └──────┬──────┘
            │
            ▼
    ┌───────────────┐
    │ Allow/Deny    │
    │ Document      │
    │ Access        │
    └───────────────┘
```

## API Request/Response Flow

```
Frontend                    Backend                 Firebase & OpenAI
   │                           │                          │
   ├─ GET ID Token             │                          │
   │  from Firebase             │                          │
   │                            │                          │
   ├─ POST /api/ai/analyze-task│                          │
   │  with Bearer Token         │                          │
   │                    ┌───────▼─────────────────┐       │
   │                    │ Middleware:             │       │
   │                    │ Verify Token            │       │
   │                    └───────┬─────────────────┘       │
   │                            │                         │
   │                    ┌───────▼──────────────────┐      │
   │                    │ Controller:              │      │
   │                    │ Parse Request Body       │      │
   │                    │ Create OpenAI Prompt     │      │
   │                    └───────┬──────────────────┘      │
   │                            │          ┌──────────────▼────┐
   │                            │          │ OpenAI GPT API    │
   │                            │          │ Process Request   │
   │                            │          │ Return Analysis   │
   │                            │          └─────────┬────────┘
   │                            │                    │
   │                    ┌───────▼────────────────────┘
   │                    │ Parse & Validate Response │
   │                    └───────┬────────────────────┘
   │                            │
   │◄───────── Response ────────┤
   │  Success: 200              │
   │  {                          │
   │    summary: string          │
   │    suggestedPriority: str   │
   │    estimatedHours: number   │
   │  }                          │
   │                            │
   ├─ Save to Component State   │
   │                           │
   ├─ Display in UI            │
   │                           │
   ├─ User Submits Form        │
   │                           │
   ├─ POST /tasks to Firestore │
```

## Deployment Architecture

```
                        ┌─────────────┐
                        │  GitHub     │
                        │ Repository  │
                        └────┬────┬───┘
                             │    │
                    ┌────────┘    └────────┐
                    │                     │
                    ▼                     ▼
              ┌──────────┐          ┌──────────┐
              │  Vercel  │          │  Railway │
              │          │          │          │
              │Frontend  │          │  Backend │
              │ Deploy   │          │ Deploy   │
              └─────┬────┘          └────┬─────┘
                    │                    │
                    │    Firestore       │
                    │    (Shared)        │
                    │         ▲          │
                    │         │          │
                    └────┬────┴────┬─────┘
                         │         │
                         ▼         ▼
                    ┌──────────────────┐
                    │Cloud Firestore   │
                    │                  │
                    │ • Database       │
                    │ • Auth           │
                    │ • Real-time      │
                    └──────────────────┘

CDN Network:
┌──────────────────────────────┐
│  Vercel Global CDN           │
│  (Caches Frontend Static)    │
└──────────────────────────────┘

API Endpoints:
┌──────────────────────────────┐
│  Railway (or Render)         │
│  Geographic Redundancy        │
└──────────────────────────────┘
```

## Performance Considerations

### Frontend Optimization
- Code splitting (Next.js automatic)
- Image optimization (Vercel)
- CSS-in-JS (Tailwind)
- Lazy loading of components
- Real-time updates with listeners (not polling)

### Backend Optimization
- Stateless design (easy scaling)
- Token verification via middleware
- Error handling and logging
- Response caching (implementable)

### Database Optimization
- Denormalized data (members array in projects)
- Indexed queries (projectId on tasks)
- Security rules prevent N+1 queries
- Batch operations for bulk updates

## Scalability Path

```
Single Developer
      │
      ▼
Development Setup
├─ localhost:3000 (Frontend)
└─ localhost:5000 (Backend)
      │
      ▼
Initial Deployment
├─ Vercel (Frontend)
├─ Railway (Backend)
└─ Firebase (Database)
      │
      ▼
Growth Phase
├─ Add caching (Redis)
├─ Implement rate limiting
├─ Monitor with Sentry
└─ Scale to multiple backends
      │
      ▼
Enterprise Scale
├─ Multi-region deployment
├─ Load balancing
├─ Database replication
├─ Advanced analytics
└─ Customer support systems
```

---

This architecture supports:
- ✅ Real-time collaboration
- ✅ Secure access control
- ✅ Horizontal scalability
- ✅ High availability
- ✅ Cost efficiency (Firebase free tier for small teams)
