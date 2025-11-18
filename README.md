# Neybr - Client

A React Native mobile app built with Expo and Expo Router for community connection.

## Related Repositories

* [Project](https://github.com/calvin-cs262-fall2025-teamG/Project)
* [Service](https://github.com/calvin-cs262-fall2025-teamG/Service)

## Setup

### Prerequisites
- Node.js (v18 or later)
- npm or yarn
- Expo CLI: `npm install -g expo-cli`
- Supabase account (create at https://supabase.com)

### 1. Create Supabase Project

1. Go to [Supabase Dashboard](https://supabase.com)
2. Create a new project (free tier is fine for development)
3. Wait for the project to initialize
4. Copy your **Project URL** and **Anon Key** from Settings > API

### 2. Create Users Table in Supabase

In your Supabase project, go to the SQL Editor and run this query:

```sql
CREATE TABLE IF NOT EXISTS users (
  id BIGSERIAL PRIMARY KEY,
  username VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX idx_users_username ON users(username);
```

### 3. Configure Environment Variables

1. Copy the example environment file:
   ```bash
   cp .env.local.example .env.local
   ```

2. Edit `.env.local` and add your Supabase credentials:
   ```
   EXPO_PUBLIC_SUPABASE_URL=YOUR_SUPABASE_URL
   EXPO_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
   ```

### 4. Install Dependencies

```bash
npm install
```

### 5. Run the App

**On your machine (web preview):**
```bash
npm start
```
Then press `w` to open in web browser.

**On Android Emulator:**
```bash
npm run android
```

**On iOS Simulator (macOS only):**
```bash
npm run ios
```

**On physical device:**
1. Install Expo Go app from your app store
2. Run `npm start`
3. Scan the QR code with your device

## Authentication

### Login
- Navigate to the login screen
- Enter your username and password
- Session is stored securely locally

### Register
- Tap "Don't have an account? Sign up"
- Create a new account with username and password
- Password must be at least 6 characters
- Your password is hashed using bcryptjs before being sent to Supabase

## Project Structure

```
app/
├── _layout.tsx        # Navigation setup
├── login.tsx          # Login screen
├── register.tsx       # Registration screen
├── home.tsx           # Home screen
├── browse.tsx         # Browse screen
├── cart.tsx           # Cart screen
├── chat.tsx           # Chat screen
├── chat-thread.tsx    # Chat thread screen
├── profile.tsx        # Profile screen
└── index.tsx          # Splash/entry screen

lib/
└── supabase.ts        # Supabase client and auth functions

assets/
└── images/            # App images and icons
```

## Notes

- All API calls are made to Supabase via REST API
- Passwords are hashed with bcryptjs (10 salt rounds) on the client before storage
- User sessions are stored in secure storage using `expo-secure-store`
- No backend server required—Supabase handles all database operations

## Troubleshooting

### "Cannot find module '@supabase/supabase-js'"
Run `npm install` to install all dependencies.

### "Invalid or missing Supabase URL/Key"
Check your `.env.local` file has the correct credentials from your Supabase project.

### "Username already exists"
Try registering with a different username.

### Port/Connection Issues
Ensure your device/emulator can reach Supabase (check internet connection and firewall).

