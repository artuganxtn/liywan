# LIYWAN Backend Setup

## Quick Start

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Configure Environment Variables**
   - Copy `.env` file and update with your values
   - Required variables:
     - `DB_URL` - MongoDB connection string
     - `JWT_SECRET` - Secret key for JWT tokens (min 32 characters)

3. **Start MongoDB** (if using local MongoDB)
   - Make sure MongoDB is running on `localhost:27017`
   - Or update `DB_URL` in `.env` to point to your MongoDB instance

4. **Start the Backend Server**
   ```bash
   npm run dev    # Development mode with auto-reload
   # or
   npm start     # Production mode
   ```

5. **Verify Backend is Running**
   - Health check: http://localhost:8000/health
   - API base: http://localhost:8000/api

## Environment Variables

### Required
- `DB_URL` - MongoDB connection string
- `JWT_SECRET` - JWT secret key (min 32 characters)

### Optional
- `PORT` - Server port (default: 8000)
- `NODE_ENV` - Environment (development/production)
- `FRONTEND_URL` - Frontend URL for CORS
- `SENTRY_DSN` - Sentry error tracking
- `GEMINI_API_KEY` - Google Gemini API key
- `CLOUDINARY_*` - Cloudinary configuration
- `EMAIL_*` - Email service configuration

## API Endpoints

- `/api/health` - Health check
- `/api/auth/*` - Authentication routes
- `/api/events/*` - Event management
- `/api/staff/*` - Staff management
- `/api/applications/*` - Job applications
- `/api/bookings/*` - Booking management
- `/api/shifts/*` - Shift management
- `/api/payroll/*` - Payroll management
- `/api/incidents/*` - Incident reporting
- `/api/upload/*` - File uploads
- `/api/ai/*` - AI features
- `/api/notifications/*` - Notifications

## MongoDB Setup

### Local MongoDB
1. Install MongoDB: https://www.mongodb.com/try/download/community
2. Start MongoDB service
3. Use connection string: `mongodb://localhost:27017/liywan`

### MongoDB Atlas (Cloud)
1. Create account at https://www.mongodb.com/cloud/atlas
2. Create cluster and get connection string
3. Update `DB_URL` in `.env`

## Development

The backend runs on port 8000 by default. The frontend (Vite) proxies `/api` requests to `http://localhost:8000`.

## Troubleshooting

- **Port already in use**: Change `PORT` in `.env` or stop the process using port 8000
- **MongoDB connection failed**: Check if MongoDB is running and `DB_URL` is correct
- **CORS errors**: Verify `FRONTEND_URL` matches your frontend URL

