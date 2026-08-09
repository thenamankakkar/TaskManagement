# TaskFlow

TaskFlow is a MEAN task-management application built with Angular, Express, MongoDB, and Socket.IO. It supports JWT login, role-based task access, team assignments, task filters, and real-time updates.

## Roles

- **Manager:** can view users, assign employees to Team Leads, and manage all visible tasks.
- **Team Lead:** can manage their own tasks and tasks assigned to their team members.
- **Employee:** can create and manage their own tasks. New tasks are assigned to themselves automatically.

## Requirements

- Node.js 20 or newer
- npm
- A MongoDB Atlas connection string or a local MongoDB server

## Install dependencies

From the project root:

```powershell
npm.cmd install
```

## Configure the backend

Create `server/.env`:

```env
PORT=3000
MONGODB_URI=mongodb+srv://USERNAME:PASSWORD@CLUSTER.mongodb.net/taskflow
JWT_SECRET=replace-this-with-a-long-random-secret
CLIENT_ORIGIN=http://localhost:4200
```

If the MongoDB password contains characters such as `@`, `/`, `:` or `#`, URL-encode the password.

Never commit `server/.env`.

## Run frontend and backend together

From the project root:

```powershell
npm.cmd run dev
```

Open:

- Frontend: `http://localhost:4200`
- Backend: `http://localhost:3000`
- Health check: `http://localhost:3000/api/health`

The backend root should display:

```json
{
  "message": "TaskFlow API is running.",
  "status": "ok"
}
```

## Run backend and frontend separately

Backend terminal:

```powershell
npm.cmd run dev --workspace=server
```

Frontend terminal:

```powershell
npm.cmd start --workspace=client
```

To make the local frontend use the local backend, set `serverUrl` in `client/src/app/api.service.ts` to:

```ts
private readonly serverUrl = 'http://localhost:3000';
```

For deployment, change it back to the deployed backend URL.

## Production URLs

- Frontend: <https://taskmanagement-agca.onrender.com/>
- Backend: <https://taskflowbackend-1uo3.onrender.com/>
- API health: <https://taskflowbackend-1uo3.onrender.com/api/health>

The backend Render service must have these environment variables:

```env
MONGODB_URI=your-mongodb-atlas-connection-string
JWT_SECRET=your-long-random-production-secret
CLIENT_ORIGIN=https://taskmanagement-agca.onrender.com
NODE_ENV=production
```

Do not add `/api` or a trailing slash to `CLIENT_ORIGIN`.

## Build and test

Build the Angular frontend:

```powershell
npm.cmd run build
```

Run backend tests:

```powershell
npm.cmd run test --workspace=server
```

Run all tests:

```powershell
npm.cmd test
```

## Main API routes

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/users`
- `POST /api/users`
- `PATCH /api/users/:id`
- `GET /api/tasks`
- `POST /api/tasks`
- `PATCH /api/tasks/:id`
- `DELETE /api/tasks/:id`

Protected endpoints require an authorization header:

```text
Authorization: Bearer YOUR_JWT_TOKEN
```

Socket.IO events keep user assignments and task changes synchronized between connected Managers, Team Leads, and Employees.

## Common deployment issues

- **CORS error:** confirm `CLIENT_ORIGIN` exactly matches the frontend origin.
- **No real-time updates:** confirm Socket.IO uses the deployed backend URL, not localhost.
- **Slow first request:** Render free services sleep when inactive and can take some time to start again.
- **MongoDB connection error:** check the Atlas connection string, database user, and Network Access rules.
