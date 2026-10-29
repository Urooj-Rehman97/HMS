# LuxuryStay — Hotel Management System

A full-stack MERN (MongoDB, Express, React, Node.js) application for managing hotel operations: a public website plus a role-based portal for **Admin, Manager, Receptionist, Housekeeping and Guest users.

---

## Features

- Public website: Home, Rooms, Room details, About, Gallery, Contact, guest Reserve page
- Authentication: register, login, forgot/reset password, staff invitation setup
- Room types, rooms, room status and room image upload
- Availability, reservations, confirmation, room assignment
- Check-in, check-out and walk-in
- Billing, charges, payments and refunds
- Services and service requests
- Housekeeping tasks and maintenance requests
- Feedback, notifications, gallery management, reports and settings

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | React, Vite, React Router DOM |
| Backend | Node.js, Express (ES modules `.mjs`) |
| Database | MongoDB with Mongoose |
| Auth | JWT bearer tokens, role-based access |
| Uploads | Multer, served from `/uploads` |

## Project structure

LuxuryStay/
├── frontend/   React + Vite client (src/pages, components, routes, services, context, hooks)
└── server/     Express API (src/routes, controllers, services, models, middleware, validations, uploads, tests)

## Prerequisites

- Node.js (current LTS) and npm
- MongoDB (local or MongoDB Atlas)
- Git

## Installation

```bash
# 1. Backend
cd server
npm install
cp .env.example .env    
npm run dev           

# 2. Frontend (new terminal)
cd frontend
npm install
cp .env.example .env    
npm run dev             
```

The API runs at `http://localhost:5000` by default. Health check: `GET http://localhost:5000/api/health`.

## Environment variables

> Names below are illustrative except `NODE_ENV` and `CLIENT_URL`. Copy the real names from `server/src/config/env.mjs` and `.env.example`.

server/.env

```env
NODE_ENV=development
PORT=5000
MONGODB_URI=<your-mongodb-connection-string>
JWT_SECRET=<long-random-secret>
JWT_EXPIRES_IN=<for example 1d>
CLIENT_URL=http://localhost:5173

# Email (password reset and staff invitations)
SMTP_HOST=<smtp-host>
SMTP_PORT=<port>
SMTP_USER=<smtp-username>
SMTP_PASS=<smtp-password>
EMAIL_FROM="LuxuryStay <no-reply@example.com>"
```

frontend/.env

```env
VITE_API_URL=http://localhost:5000/api
```

## Accounts and credentials 

Public registration creates Guest accounts only. Staff accounts are created by an Admin/Manager through a staff invitation. The first Admin must be created with the project's bootstrap/seed procedure.

| Role | Email | Password | Notes |
|---|---|---|---|
| Admin | lsadmin@gmail.com | LuxuryStay@123 | First account, created via seed/bootstrap |
| Manager | aliajmeri425@gmail.com | Manager@123 | Invited by Admin |
| Receptionist | alizahajmeri1@gmail.com | Alizah@123 | Invited by Admin/Manager |
| Housekeeping | givehub67@gmail.com | Zain@123 | Invited by Admin/Manager |
| Guest | yusra@gmail.com | Yusra@123 | Self-registered |

| Service | Where to keep it |
|---|---|
| MongoDB URI / DB user | `server/.env` → `MONGODB_URI` |
| JWT secret | `server/.env` |
| SMTP username / password | `server/.env` |
| Hosting / Atlas / domain logins | A password manager — not this repository |

## Roles at a glance

| Role | Main areas |
|---|---|
| Admin | Everything, including settings |
| Manager | Operations, reports, gallery, users and staff |
| Receptionist | Guests, reservations, check-in/out, billing |
| Housekeeping | Rooms, cleaning tasks, maintenance |
| Guest | Reserve, own reservations, services, feedback, profile |

## Testing

```bash
cd server
npm test                
```

Backend tests exist for authentication, billing, reservations and rooms (`server/src/tests/`). Use a separate database such as `luxurystay_test`, never production.

## Documentation

- `HMS_Project_Documentation.docx` — requirements, architecture, database design, testing, limitations
- `HMS_User_Guide.docx` — how guests and staff use the system
- `HMS_Developer_Guide.docx` — architecture, API reference, setup and maintenance

## Troubleshooting

| Problem | Check |
|---|---|
| CORS error | `CLIENT_URL` must exactly match the frontend origin (scheme, host, port) |
| 401 Unauthorized | Token missing/expired; confirm login and API base URL |
| 403 Forbidden | User role vs. route's allowed roles |
| Image not loading | File exists in `server/src/uploads`; `/uploads` static mount |
| Email not received | SMTP settings, spam folder, token expiry |

## Before pushing to GitHub

- [ ] `.env` and `server/src/uploads/` private files are in `.gitignore`
- [ ] No real passwords, tokens or connection strings in code, README or screenshots
- [ ] Any secret that was ever committed has been rotated

