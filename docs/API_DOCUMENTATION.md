# API Documentation (base: http://localhost:5000/api)
Errors: `{ "error": "...", "details": [{field,msg}] }` — 400 validation, 401 unauthorized, 404 not found, 429 rate limit, 500 server.

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | /auth/login | No | Body `{email,password}` → `{token}` |
| POST | /enquiries | No | Create. Body `{name,email,phone?,interest?,message,source?}` → 201 `{id}` |
| GET | /enquiries | Bearer | List. Query: `q,status,user_type,interest,page,limit` → `{data,total,page,limit}` |
| GET | /enquiries/:id | Bearer | Single enquiry |
| PUT | /enquiries/:id | Bearer | Update `status`, `interest`, `message` |
| DELETE | /enquiries/:id | Bearer | Delete |

Enums — status: new, contacted, in_progress, closed · user_type: student, customer, other · interest: drone_training, drone_services, content_media, other

## User accounts
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | /users/register | No | Body `{name,email,password(8-72)}` → 201 `{token,name}`; 409 if email exists |
| POST | /users/login | No | Body `{email,password}` → `{token,name}` |
| GET | /my/enquiries | User Bearer | Enquiries submitted by the logged-in user, with status |

POST /enquiries links the enquiry to the user automatically if a valid user token is sent. Admin and user tokens carry a `role` claim; user tokens are rejected on admin routes.
