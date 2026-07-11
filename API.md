# TeamSync AI - API Documentation

Complete REST API reference for TeamSync AI backend.

## Base URL

**Development:** `http://localhost:5000/api`

**Production:** `https://your-backend.railway.app/api`

## Authentication

All endpoints (except `/health`) require Firebase ID token in the Authorization header:

```bash
Authorization: Bearer {firebaseIdToken}
```

### Getting Firebase ID Token (Frontend)

```typescript
import { auth } from '@/lib/firebase';

const token = await auth.currentUser?.getIdToken();
```

The token is automatically added by the API client in `lib/api.ts`.

---

## Endpoints

### 1. Health Check

Check if the API is running. No authentication required.

**Request**
```
GET /api/health
```

**Response** (200 OK)
```json
{
  "success": true,
  "message": "Server is running",
  "timestamp": "2024-01-15T10:30:45.123Z"
}
```

---

### 2. Analyze Task with AI

Generate a summary and suggest priority for a task using OpenAI.

**Request**
```
POST /api/ai/analyze-task
Content-Type: application/json
Authorization: Bearer {firebaseIdToken}

{
  "title": "Implement user authentication",
  "description": "Add email/password login and signup flows. Include password reset functionality."
}
```

**Request Body**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `title` | string | ✅ | Task title (max 200 chars) |
| `description` | string | ✅ | Task description (max 2000 chars) |

**Response** (200 OK)
```json
{
  "success": true,
  "data": {
    "summary": "Implement complete authentication system with login, signup, and password reset using Firebase or similar service.",
    "suggestedPriority": "HIGH",
    "estimatedHours": 16
  }
}
```

**Response Fields**

| Field | Type | Description |
|-------|------|-------------|
| `success` | boolean | Always `true` for successful response |
| `data.summary` | string | AI-generated summary of the task |
| `data.suggestedPriority` | string | Suggested priority: `LOW`, `MEDIUM`, `HIGH`, or `URGENT` |
| `data.estimatedHours` | number | Optional estimated hours to complete |

**Error Responses**

```json
// 400 Bad Request - Missing fields
{
  "success": false,
  "error": "Title and description are required"
}

// 401 Unauthorized - Invalid token
{
  "success": false,
  "error": "Invalid or expired token"
}

// 500 Internal Server Error
{
  "success": false,
  "error": "Failed to analyze task"
}
```

**Example Usage (Frontend)**

```typescript
import { api } from '@/lib/api';

const handleAnalyze = async () => {
  try {
    const result = await api.analyzeTaskWithAI({
      title: "Add user profile page",
      description: "Create a user profile page with edit capabilities"
    });
    
    console.log(result.suggestedPriority); // "MEDIUM"
    console.log(result.summary); // AI summary
    
    setPriority(result.suggestedPriority);
    setAiSummary(result.summary);
  } catch (error) {
    console.error("AI analysis failed:", error);
  }
};
```

**Costs**

- OpenAI API call: ~0.001-0.002 USD per request
- Rate limit: Depends on your OpenAI plan (development: 3 requests/min)

---

### 3. Get Project Metrics

Get analytics and statistics for a project.

**Request**
```
GET /api/projects/{projectId}/metrics
Authorization: Bearer {firebaseIdToken}
```

**URL Parameters**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `projectId` | string | ✅ | Firebase Firestore project document ID |

**Response** (200 OK)
```json
{
  "success": true,
  "data": {
    "total": 25,
    "completed": 12,
    "inProgress": 8,
    "todo": 5,
    "completionRate": 48
  }
}
```

**Response Fields**

| Field | Type | Description |
|-------|------|-------------|
| `total` | number | Total number of tasks in project |
| `completed` | number | Number of completed tasks (status = DONE) |
| `inProgress` | number | Number of tasks in progress (status = IN_PROGRESS) |
| `todo` | number | Number of tasks to do (status = TODO) |
| `completionRate` | number | Percentage of completed tasks (0-100) |

**Error Responses**

```json
// 400 Bad Request
{
  "success": false,
  "error": "Project ID is required"
}

// 401 Unauthorized
{
  "success": false,
  "error": "Invalid or expired token"
}

// 500 Internal Server Error
{
  "success": false,
  "error": "Failed to fetch metrics"
}
```

**Example Usage (Frontend)**

```typescript
import { api } from '@/lib/api';

const fetchMetrics = async (projectId: string) => {
  try {
    const metrics = await api.getProjectMetrics(projectId);
    
    console.log(`Completion: ${metrics.completionRate}%`);
    console.log(`Done: ${metrics.completed}/${metrics.total}`);
    
    setMetrics(metrics);
  } catch (error) {
    console.error("Failed to fetch metrics:", error);
  }
};
```

---

## Request/Response Format

### Success Response
```json
{
  "success": true,
  "data": { ... },
  "message": "Optional success message"
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error message describing what went wrong"
}
```

---

## Error Codes

| Code | Meaning | Solution |
|------|---------|----------|
| 200 | OK | Request successful |
| 400 | Bad Request | Check request body and parameters |
| 401 | Unauthorized | Make sure Firebase token is valid and included |
| 404 | Not Found | Check endpoint URL and parameters |
| 429 | Too Many Requests | Rate limit exceeded, wait before retrying |
| 500 | Server Error | Server error, check backend logs |

---

## Rate Limiting

To prevent abuse:

- ✅ 100 requests per minute per user (Firebase UID)
- ✅ OpenAI rate limits apply (depends on plan)
- ✅ Firestore limits apply (50 reads/writes per second per user)

Implement exponential backoff if rate limited:

```typescript
async function retryWithBackoff(fn: () => Promise<any>, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (error.status === 429 && i < maxRetries - 1) {
        const delay = Math.pow(2, i) * 1000; // 1s, 2s, 4s
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        throw error;
      }
    }
  }
}
```

---

## CORS Headers

All responses include CORS headers:

```
Access-Control-Allow-Origin: {CORS_ORIGIN}
Access-Control-Allow-Methods: GET, POST, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization
Access-Control-Allow-Credentials: true
```

---

## Security Best Practices

1. **Never expose API keys** in frontend code
2. **Always include token** in Authorization header
3. **Validate token** on backend (handled by middleware)
4. **Use HTTPS** in production
5. **Rotate tokens** periodically (Firebase handles this)
6. **Log all API calls** for debugging
7. **Implement rate limiting** for production

---

## Future API Endpoints (To Implement)

```
# Project Management
POST   /api/projects                 # Create project
GET    /api/projects/{id}            # Get project details
PATCH  /api/projects/{id}            # Update project
DELETE /api/projects/{id}            # Delete project
GET    /api/projects/{id}/members    # Get project members
POST   /api/projects/{id}/members    # Add team member
DELETE /api/projects/{id}/members/{userId} # Remove member

# Task Management
POST   /api/tasks                    # Create task
GET    /api/tasks/{id}               # Get task details
PATCH  /api/tasks/{id}               # Update task
DELETE /api/tasks/{id}               # Delete task
PATCH  /api/tasks/{id}/status        # Update task status
PATCH  /api/tasks/{id}/assign        # Assign task to user

# User Management
GET    /api/users/me                 # Get current user
PATCH  /api/users/me                 # Update user profile
GET    /api/users/{id}               # Get user details

# Analytics
GET    /api/analytics/dashboard      # Get dashboard analytics
GET    /api/analytics/team           # Get team analytics
GET    /api/analytics/export         # Export analytics as CSV

# Notifications (if adding real-time notifications)
GET    /api/notifications            # Get user notifications
PATCH  /api/notifications/{id}/read  # Mark notification as read
```

---

## Integration Examples

### Using the API Client

```typescript
import { api } from '@/lib/api';

// Analyze task
const analysis = await api.analyzeTaskWithAI({
  title: "Build API",
  description: "Create REST API with Express..."
});

// Get metrics
const metrics = await api.getProjectMetrics('project-123');
```

### Using Fetch API

```typescript
const token = await auth.currentUser?.getIdToken();

const response = await fetch('http://localhost:5000/api/ai/analyze-task', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    title: "My task",
    description: "Task description..."
  })
});

const result = await response.json();
```

### Using cURL

```bash
curl -X POST http://localhost:5000/api/ai/analyze-task \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "title": "My task",
    "description": "Task description..."
  }'
```

---

## Monitoring & Debugging

### Check Backend Logs

```bash
# Development
npm run dev  # Logs will appear in terminal

# Production (Railway)
railway logs

# Production (Render)
# Check in dashboard under Logs tab
```

### Test Health Endpoint

```bash
curl http://localhost:5000/api/health
# Should return: {"success":true,"message":"Server is running"...}
```

### Monitor OpenAI Usage

Go to https://platform.openai.com/account/usage/overview

### Monitor Firestore Usage

Go to Firebase Console > Firestore > Usage

---

## Support

For API issues:
1. Check error message and error code
2. Review backend logs
3. Verify Firebase token is valid
4. Check endpoint URL and parameters
5. Review rate limiting
6. Check OpenAI API status

---

**Last Updated:** 2024
**API Version:** 1.0.0
