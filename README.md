# SalonGo Backend

Production-ready REST backend for **SalonGo**, a salon booking and live queue tracking app by **ASRVTech**.

## Stack

- Node.js, Express.js
- MongoDB Atlas, Mongoose
- JWT access tokens and refresh tokens
- Bcrypt password hashing
- Brevo email API with Nodemailer SMTP fallback
- Cloudinary image and document storage
- Multer uploads
- Helmet, CORS, Morgan, rate limiting, Mongo sanitization, XSS sanitization

## Project Structure

```text
src/
  config/         Database, env, Cloudinary config
  constants/      Roles and status constants
  controllers/    Route handlers
  middlewares/    Auth, role, upload, validation, errors
  models/         Mongoose schemas
  routes/         REST route modules
  services/       Email, OTP, upload, notifications, audit logs
  templates/      Responsive HTML email templates
  utils/          Tokens, responses, app errors
netlify/functions Netlify serverless adapter
scripts/          Local maintenance scripts
```

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create `.env` from `.env.example`:

```bash
cp .env.example .env
```

3. Fill required values:

```env
MONGODB_URI=mongodb+srv://...
JWT_SECRET=long-random-secret
JWT_REFRESH_SECRET=another-long-random-secret
BREVO_API_KEY=...
CLOUDINARY_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_SECRET=...
```

4. Start development server:

```bash
npm run dev
```

5. Check health:

```http
GET http://localhost:5000/health
```

## Admin Bootstrap

Set these env vars:

```env
ADMIN_EMAIL=admin@asrvtech.com
ADMIN_PASSWORD=ChangeMe123!
```

Then call once:

```http
POST /api/v1/admin/bootstrap
```

Admins log in through:

```http
POST /api/v1/auth/login
{
  "email": "admin@asrvtech.com",
  "password": "ChangeMe123!",
  "role": "ADMIN"
}
```

Protect this bootstrap endpoint at infrastructure level or remove it after first admin creation.

## Core API

All responses follow:

```json
{
  "success": true,
  "message": "Action completed",
  "data": {}
}
```

Use:

```http
Authorization: Bearer <accessToken>
```

### Auth

| Method | Endpoint | Description |
| --- | --- | --- |
| POST | `/api/v1/auth/register` | Customer registration |
| POST | `/api/v1/auth/login` | Login customer, salon owner, or admin |
| POST | `/api/v1/auth/refresh-token` | Rotate refresh token |
| POST | `/api/v1/auth/logout` | Logout current account |
| POST | `/api/v1/auth/verify-otp` | Verify email OTP |
| POST | `/api/v1/auth/resend-otp` | Resend email OTP or password reset link |
| POST | `/api/v1/auth/forgot-password` | Send password reset link |
| POST | `/api/v1/auth/reset-password` | Reset password with token |
| GET | `/reset-password` | Backend-hosted password reset form |

### Customer

| Method | Endpoint | Description |
| --- | --- | --- |
| GET | `/api/v1/customer/profile` | Current customer profile |
| PUT | `/api/v1/customer/update` | Update profile, supports `profileImage` upload |
| POST | `/api/v1/customer/favorites/:salonId` | Save favorite salon |
| DELETE | `/api/v1/customer/favorites/:salonId` | Remove favorite salon |

### Salon Owner

| Method | Endpoint | Description |
| --- | --- | --- |
| POST | `/api/v1/salon/register` | Register salon owner request |
| POST | `/api/v1/salon/upload-documents` | Upload `salonImages`, `businessLicense`, `ownerIdProof` |
| GET | `/api/v1/salon/status` | Verification status |
| GET | `/api/v1/salon/me` | Approved salon profile |
| PUT | `/api/v1/salon/me` | Update salon profile |
| GET | `/api/v1/salon/bookings` | Owner booking list |
| PUT | `/api/v1/salon/bookings/:id/status` | Update booking status |
| GET | `/api/v1/salon/queue` | Owner queue |
| PUT | `/api/v1/salon/queue/seats` | Update occupied seats and wait time |
| PUT | `/api/v1/salon/queue/entries/:bookingId` | Update live queue entry |

### Public Salons and Queue

| Method | Endpoint | Description |
| --- | --- | --- |
| GET | `/api/v1/salon/public` | Search/list active salons |
| GET | `/api/v1/salon/public/:slug` | Public salon detail with queue |
| GET | `/api/v1/queue/:salonId` | Live queue detail |

### Admin

| Method | Endpoint | Description |
| --- | --- | --- |
| GET | `/api/v1/admin/pending-salons` | Pending and under-review salons |
| PUT | `/api/v1/admin/approve/:id` | Approve salon |
| PUT | `/api/v1/admin/reject/:id` | Reject salon |
| PUT | `/api/v1/admin/suspend/:id` | Suspend salon |
| GET | `/api/v1/admin/users` | Customer and salon owner list |
| GET | `/api/v1/admin/bookings` | Booking list |
| GET | `/api/v1/admin/reports` | Basic reports |

### Booking

| Method | Endpoint | Description |
| --- | --- | --- |
| POST | `/api/v1/booking/create` | Customer creates booking |
| GET | `/api/v1/booking/history` | Customer booking history |

### Notifications

| Method | Endpoint | Description |
| --- | --- | --- |
| GET | `/api/v1/notifications` | Current account notifications |
| PUT | `/api/v1/notifications/:id/read` | Mark notification read |

## Salon Verification Flow

1. Owner registers with `/api/v1/salon/register`.
2. Owner verifies email with OTP.
3. Owner uploads salon images and documents.
4. `verificationStatus` becomes `under_review`.
5. Admin approves or rejects.
6. Approval creates an active `Salon` and `Queue`.
7. Approved owner can manage bookings and live queue.

## Deployment

### Render

1. Create a new Web Service.
2. Connect this repository.
3. Build command:

```bash
npm install
```

4. Start command:

```bash
npm start
```

5. Add environment variables from `.env.example`.

### Netlify Functions

This repo includes:

- `netlify/functions/api.js`
- `netlify.toml`

Set Netlify environment variables from `.env.example`. API routes are available under:

```http
/api/v1/...
```

## Production Notes

- Use long random JWT secrets.
- Keep MongoDB Atlas IP access and database users locked down.
- Remove or firewall `/api/v1/admin/bootstrap` after first admin creation.
- Configure Brevo domain authentication for reliable email delivery.
- Keep Cloudinary upload presets/private folders scoped to SalonGo.
- Add Socket.IO, Pusher, or Ably for push-based live queue updates when mobile apps need real-time subscriptions. The current API is structured so queue state can be polled or broadcast from the queue controller layer.
