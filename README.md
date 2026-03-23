# Velozity Global Solutions — Real-Time Client Project Dashboard

## Live Demo
- **Frontend:** https://velozity-global-solutions-assignmen.vercel.app
- **Backend:** https://velozity-global-solutions-assignment.onrender.com

## Seed Accounts

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@velozity.com | admin123 |
| PM 1 | pm1@velozity.com | pm123 |
| PM 2 | pm2@velozity.com | pm123 |
| Dev 1 | dev1@velozity.com | dev123 |
| Dev 2 | dev2@velozity.com | dev123 |
| Dev 3 | dev3@velozity.com | dev123 |
| Dev 4 | dev4@velozity.com | dev123 |

---

## Local Setup

### Prerequisites
- Node.js 18+
- npm

### Backend
```bash
cd Backend
npm install
```

Create `.env` file in Backend/:
```env
DATABASE_URL=your_neon_postgresql_url
JWT_SECRET=your_secret
JWT_REFRESH_SECRET=your_refresh_secret
PORT=5000
FRONTEND_URL=http://localhost:5173
```
```bash
npx prisma migrate dev
npx prisma db seed
npm run dev
```

### Frontend
```bash
cd Frontend
npm install
```

Create `.env` file in Frontend/:
```env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```
```bash
npm run dev
```

---

## Database Schema

- **User** — id, name, email, password, role (ADMIN/PM/DEVELOPER), refreshToken
- **Client** — id, name, email
- **Project** — id, name, description, clientId (FK), managerId (FK → User)
- **Task** — id, title, description, status (TODO/IN_PROGRESS/IN_REVIEW/DONE/OVERDUE), priority (LOW/MEDIUM/HIGH/CRITICAL), dueDate, projectId (FK), assigneeId (FK → User)
- **ActivityLog** — id, message, fromStatus, toStatus, userId (FK), projectId (FK), taskId (FK), createdAt
- **Notification** — id, message, read, userId (FK), taskId (FK, optional), createdAt

---

## Architecture

### Tech Stack
| Layer | Technology |
|-------|-----------|
| Frontend | React + TypeScript + Vite |
| Backend | Express + TypeScript |
| Database | PostgreSQL (Neon) |
| ORM | Prisma |
| Real-time | Socket.io |
| Auth | JWT + HttpOnly Cookie |
| Background Job | node-cron |
| Deployment | Vercel (Frontend) + Render (Backend) |

### Role-Based Access

| Feature | Admin | PM | Developer |
|---------|-------|----|-----------|
| View all projects | ✅ | ❌ | ❌ |
| View own projects | ✅ | ✅ | ❌ |
| Create project | ✅ | ✅ | ❌ |
| Delete project | ✅ | ✅ (own only) | ❌ |
| Create task | ✅ | ✅ | ❌ |
| Update task status | ✅ | ✅ | ✅ (assigned only) |
| View activity feed | ✅ (global) | ✅ (own projects) | ✅ (assigned tasks) |

### WebSocket Room Strategy
On connection, users are placed into rooms based on role:
- **Admin** → joins all project rooms + global feed
- **PM** → joins only their managed project rooms
- **Developer** → joins rooms for each assigned task + project

When a task status changes, the server emits to the specific project room — only permitted users receive it. This enforces the same access rules at the real-time layer that the REST API enforces at the HTTP layer.

### Token Strategy
- Access token (15min expiry) stored in localStorage
- Refresh token (7 days) stored in HttpOnly cookie — inaccessible to JavaScript, protected against XSS
- Axios interceptor silently refreshes on 401 without user intervention

### Background Job
node-cron runs every hour to mark tasks with `dueDate < now` as OVERDUE. Chosen over Bull queue because no Redis or distributed processing is needed at this scale.

---

## Architectural Decisions

### Why Socket.io over native WebSocket?
Built-in room support enables precise role-filtered delivery without server-side filtering on every emit.

### Why node-cron over Bull?
No Redis dependency required. A simple hourly scheduler is sufficient for overdue task detection at this scale.

### Why Prisma over raw SQL?
Type-safe schema-first ORM with migration history tracking. The `@prisma/adapter-neon` enables serverless PostgreSQL compatibility with Neon.

### Why Neon PostgreSQL?
Serverless PostgreSQL with instant provisioning. No local database setup required, works seamlessly with Prisma adapter.

---

## Known Limitations
- Developer activity feed shows all project activity, not just their tasks
- New task assignments require socket reconnect for live updates on that specific task
- No pagination on task lists
- Project notifications to offline PMs are delivered on next login via DB, but project assignment notifications are real-time only

---

## Project Structure
```
Velozity-Assignment/
├── Backend/
│   ├── prisma/
│   │   ├── schema.prisma
│   │   ├── seed.ts
│   │   └── migrations/
│   ├── src/
│   │   ├── index.ts
│   │   ├── prisma.ts
│   │   ├── controller/
│   │   │   ├── authController.ts
│   │   │   ├── projectController.ts
│   │   │   ├── taskController.ts
│   │   │   └── notificationController.ts
│   │   ├── middleware/
│   │   │   └── auth.ts
│   │   ├── routes/
│   │   │   ├── auth.ts
│   │   │   ├── project.ts
│   │   │   ├── task.ts
│   │   │   └── notification.ts
│   │   ├── sockets/
│   │   │   └── index.ts
│   │   └── jobs/
│   │       └── overdueTask.ts
│   ├── tsconfig.json
│   └── package.json
└── Frontend/
    ├── src/
    │   ├── api/
    │   │   └── axios.ts
    │   ├── context/
    │   │   └── AuthContext.tsx
    │   ├── socket/
    │   │   └── socket.ts
    │   ├── pages/
    │   │   ├── Login.tsx
    │   │   ├── AdminDashboard.tsx
    │   │   ├── PMDashboard.tsx
    │   │   └── DevDashboard.tsx
    │   ├── components/
    │   │   ├── Navbar.tsx
    │   │   ├── TaskCard.tsx
    │   │   ├── ActivityFeed.tsx
    │   │   └── NotificationBell.tsx
    │   └── App.tsx
    └── package.json
```
