# FullStack_Chatbot_Task_Samay_Masram
DroneTV AI Support & Lead Assistant - a responsive full-stack web app with a rule-based chatbot, enquiry collection and admin dashboard.

## Features
- Home, Services, Courses/Training, Contact form, Chatbot, Admin dashboard (responsive)
- Rule-based chatbot: predefined questions, session history, fallback reply, clear chat, lead capture
- Enquiry fields: name, email, phone, user type (Student/Customer/Other), interest, message
- User accounts: register/login, "My Enquiries" page with a status tracker
- Admin: login, search, filter (type/status), view details, change status (New/Contacted/In Progress/Closed), delete, pagination
- Validation on frontend AND backend; generic error messages (no technical details exposed)

## Tech
React 18 + TypeScript (Vite), Node.js + Express, MySQL (mysql2), JWT, bcrypt, helmet, express-rate-limit, express-validator

## Structure
```
backend/   server.js, schema.sql, migration.sql, .env.example
frontend/  src/ (App, Chatbot, EnquiryForm, Admin, Sections, api.ts)
docs/      API_DOCUMENTATION.md
```
Architecture: React frontend -> REST API (Express) -> MySQL

## Setup
1. Database: `mysql -u root -p < backend/schema.sql`
2. Backend: `cd backend && cp .env.example .env` (edit values) `&& npm install && npm start` (http://localhost:5000)
3. Frontend: `cd frontend && npm install && npm run dev` (http://localhost:5173)

## Environment variables (backend/.env)
PORT, CLIENT_URL, DB_HOST, DB_USER, DB_PASSWORD, DB_NAME, JWT_SECRET, ADMIN_EMAIL, ADMIN_PASSWORD (admin is seeded on first start)

## API endpoints
See docs/API_DOCUMENTATION.md. POST /api/enquiries is public; GET/PUT/DELETE require `Authorization: Bearer <token>` from POST /api/auth/login.

## Security
Parameterized SQL, input sanitization (< > stripped) + React output escaping, helmet, CORS allow-list, rate limiting, bcrypt, JWT (2h), body size limit, secrets in .env (never committed)

## Screenshots
(add images here)

## Live demo
(link if available)
