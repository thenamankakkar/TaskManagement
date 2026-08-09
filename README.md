# TaskFlow — MEAN Task Management

TaskFlow is a role-aware task application built for the machine test. It has JWT authentication, task CRUD, MongoDB persistence, Angular reactive-form validation, clear API errors, and Socket.IO refreshes for connected users.

## Roles

- **Manager:** sees every user/task and can assign or reassign to anyone.
- **Team Lead:** sees their own work and their team’s work; can assign within that group.
- **Employee:** creates and manages only their own tasks; tasks are always assigned to themselves.

Team membership is represented by the optional `manager` and `teamLead` user references. Add these when provisioning users (for example through an admin API or seed script) so team leads can access their employees’ tasks.

## Run locally

1. Copy `server/.env.example` to `server/.env`.
2. Fill `MONGODB_URI` and use a long, unique `JWT_SECRET`. Never commit this file. If the password in a MongoDB URI contains special characters, URL-encode it.
3. Install dependencies: `npm.cmd install`
4. Start both applications: `npm.cmd run dev`
5. Open `http://localhost:4200`.

The API runs on port 3000. `GET /api/health` is available as a quick health check.

## Test and build

```powershell
npm.cmd test
npm.cmd run build
```

The server test covers invalid registration and route protection. The Angular test verifies the root component bootstraps. The API also validates every auth/task input at runtime and returns safe client-facing errors.

## API overview

- `POST /api/auth/register`, `POST /api/auth/login`
- `GET /api/users` (scoped by role)
- `GET|POST /api/tasks`, `PATCH|DELETE /api/tasks/:id`

Protected calls require `Authorization: Bearer <JWT>`. Socket events named `task:changed` keep lists current after creates, updates, and deletes.
