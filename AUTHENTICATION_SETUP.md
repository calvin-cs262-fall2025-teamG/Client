# Authentication Setup Guide

## Overview
This guide explains the email-based authentication system implemented in the Hey Neighbor app. Users can log in via email verification codes without passwords.

## Architecture

### Frontend Components

#### 1. **AuthContext** (`context/AuthContext.tsx`)
Manages authentication state globally across the app.

**Key Features:**
- Stores user data (user_id, email, name, profile_picture)
- Persists auth state to AsyncStorage for automatic login
- Provides hooks for sending codes, verifying codes, and logging out

**Key Methods:**
- `sendCode(email)` - Sends verification code to user's email
- `verifyAndLogin(email, code)` - Verifies code and creates/fetches user
- `logout()` - Clears auth state

**Usage:**
```typescript
const { user, isAuthenticated, sendCode, verifyAndLogin, logout } = useAuth();
```

#### 2. **Login Screen** (`app/login.tsx`)
Email entry screen where users input their email address.

**Features:**
- Email validation
- Loading state
- Error handling with alerts
- Navigation to verification screen on success

#### 3. **Verification Screen** (`app/verify.tsx`)
Code verification screen where users enter the 6-digit code.

**Features:**
- 10-minute countdown timer
- Resend code functionality
- Code validation
- Automatic login on successful verification

#### 4. **Root Layout** (`app/_layout.tsx`)
Conditionally displays login flow or app tabs based on authentication state.

**Logic:**
- Show loading spinner while checking auth state
- If not authenticated → show login/verification flow
- If authenticated → show app tabs

#### 5. **Profile Page** (`app/(tabs)/profile.tsx`)
Updated to show user info and logout button.

**Features:**
- Display user name and email
- Logout button (red icon, top right)
- Request new verification code button
- Confirmation dialog before logout

### API Utilities (`lib/api.ts`)

Three main endpoints your Azure backend needs to implement:

#### 1. **Send Verification Code**
```
POST /api/auth/send-verification-code
Body: { email: string }
```
- Generate a random 6-digit code
- Store in database with email and 10-minute expiration
- Send code to user's email (using SendGrid, Twilio, etc.)

#### 2. **Verify Code**
```
POST /api/auth/verify-code
Body: { email: string, code: string }
```
- Look up code by email
- Check if code matches and hasn't expired
- Return error if invalid/expired

#### 3. **Get or Create User**
```
POST /api/auth/get-or-create-user
Body: { email: string }
```
- Check if user exists with this email
- If exists → return user data
- If not → create new user with name extracted from email (or require name input)
- Return user object: `{ user_id, email, name, profile_picture? }`

## Database Schema Addition
First, we need to exppand out `Users` table:
```sql
-- Users
CREATE TABLE app_user (
    user_id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    profile_picture VARCHAR(255)
    email VARCHAR(255) NOT NULL UNIQUE,
    code_id INT,
    FOREIGN KEY (code_id) REFERENCES verification_code(code_id),
);
```

Then we should add this table to our `heyneighbor_schema.sql`:
```sql
-- Authentication Verification Codes
CREATE TABLE verification_code (
    code_id SERIAL PRIMARY KEY,
    code VARCHAR(6) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    verified BOOLEAN DEFAULT FALSE
);
```

Apparently we can automate the cleanup process if we want to.
```sql
-- Cleanup stored procedure for expired codes (optional but recommended)
CREATE PROCEDURE sp_cleanup_expired_codes
AS
BEGIN
    DELETE FROM VerificationCode 
    WHERE expires_at < CURRENT_TIMESTAMP 
    AND verified = FALSE
    AND DATEDIFF(HOUR, expires_at, CURRENT_TIMESTAMP) > 24;
END;

-- Schedule this to run daily using Azure SQL Agent or Azure Automation
-- EXEC sp_cleanup_expired_codes;
```

## Setup Instructions
### 1. Update API Base URL
In `lib/api.ts`, replace:
```typescript
const API_BASE_URL = "https://your-azure-function-app.azurewebsites.net/api";
```
with your actual Azure Function App URL.

### 2. Create Azure Function App (Backend)

You'll need to create three Azure Functions:

**Function 1: SendVerificationCode**
```csharp
[FunctionName("SendVerificationCode")]
public static async Task<IActionResult> SendVerificationCode(
    [HttpTrigger(AuthorizationLevel.Anonymous, "post", Route = "auth/send-verification-code")] 
    HttpRequest req)
{
    // 1. Extract email from request body
    // 2. Generate random 6-digit code
    // 3. Store in database with 10-min expiration
    // 4. Send email via SendGrid/Twilio
    // 5. Return success/error
}
```

**Function 2: VerifyCode**
```csharp
[FunctionName("VerifyCode")]
public static async Task<IActionResult> VerifyCode(
    [HttpTrigger(AuthorizationLevel.Anonymous, "post", Route = "auth/verify-code")] 
    HttpRequest req)
{
    // 1. Extract email and code from request
    // 2. Query database for matching code
    // 3. Check if not expired and matches
    // 4. Mark as verified if valid
    // 5. Return success/error
}
```

**Function 3: GetOrCreateUser**
```csharp
[FunctionName("GetOrCreateUser")]
public static async Task<IActionResult> GetOrCreateUser(
    [HttpTrigger(AuthorizationLevel.Anonymous, "post", Route = "auth/get-or-create-user")] 
    HttpRequest req)
{
    // 1. Extract email from request
    // 2. Query app_user table by email
    // 3. If exists → return user data
    // 4. If not → create new user with default name
    // 5. Return { user_id, email, name, profile_picture }
}
```

### 3. Email Service Setup

You'll need an email service provider:

**Option A: SendGrid**
1. Create SendGrid account: https://sendgrid.com
2. Get API key
3. Use in Azure Function to send emails

**Option B: Azure Communication Services**
1. Create resource in Azure Portal
2. Configure SMTP or REST API
3. Use in Azure Function

**Sample Email Template:**
```
Subject: Your Hey Neighbor Verification Code

Hi there!

Your verification code is: [CODE]

This code will expire in 10 minutes.

If you didn't request this code, you can safely ignore this email.

Best regards,
The Hey Neighbor Team
```

### 4. CORS Configuration

Make sure your Azure Function App has CORS enabled for your app domain(s):
- For development: Add `http://localhost` and `http://localhost:8081`
- For production: Add your actual domain

## User Flow

1. **Unauthenticated User Opens App**
   - AuthContext checks AsyncStorage for saved user
   - If none found → show Login screen

2. **User Enters Email**
   - Validation checks email format
   - Frontend calls `/api/auth/send-verification-code`
   - Backend sends code to email
   - Frontend navigates to Verification screen

3. **User Enters Code**
   - Frontend calls `/api/auth/verify-code` to validate
   - If valid → calls `/api/auth/get-or-create-user`
   - User data saved to AsyncStorage
   - AuthContext updated
   - User redirected to app tabs

4. **Authenticated User Uses App**
   - Auth state persists across app restarts
   - User data available via `useAuth()` hook

5. **User Logs Out**
   - Logout button in profile → confirmation dialog
   - AsyncStorage cleared
   - AuthContext reset
   - User redirected to login screen

## Accessing User Data

From any component, use the `useAuth()` hook:

```typescript
import { useAuth } from '../context/AuthContext';

export default function MyComponent() {
  const { user, isAuthenticated, logout } = useAuth();

  if (!isAuthenticated) return <Text>Not logged in</Text>;

  return (
    <View>
      <Text>Welcome, {user?.name}!</Text>
      <Text>Email: {user?.email}</Text>
      <Text>User ID: {user?.user_id}</Text>
    </View>
  );
}
```

## Security Considerations

1. **Verification Code Storage**
   - Use short expiration (10 minutes recommended)
   - Hash codes before storing in database
   - Delete expired codes regularly

2. **Rate Limiting**
   - Limit code requests per email (e.g., 3 per hour)
   - Limit verification attempts (e.g., 5 per code)
   - Return generic "too many requests" message

3. **HTTPS**
   - All API calls must use HTTPS
   - Use secure AsyncStorage for sensitive data

4. **Email Validation**
   - Verify email ownership before allowing new accounts
   - Consider email domain blocklists (spam services)

## Testing

**Test Email Services (Development Only)**
- Mailtrap: https://mailtrap.io (free tier available)
- Ethereal: https://ethereal.email
- Temp Mail: Use temporary email for testing

**Manual Testing Flow:**
1. Open app (should show login)
2. Enter test email
3. Check email for code
4. Enter code
5. Should see app tabs with your user info

## Environment Variables

Add these to your Azure Function App configuration:

```
SendGridApiKey=<your-sendgrid-key>
DatabaseConnection=<your-azure-sql-connection-string>
VerificationCodeExpiryMinutes=10
CodeLength=6
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "Failed to send verification code" | Check Azure Function is deployed and API_BASE_URL is correct |
| Code never arrives in email | Check SendGrid/email service credentials and spam folder |
| "Invalid verification code" | Ensure code hasn't expired (10 min window) or was typed correctly |
| User data not persisting | Check AsyncStorage has read/write permissions and STORAGE_KEY constant |
| App crashes on startup | Ensure AuthProvider wraps entire app in _layout.tsx |

## Next Steps

1. Create Azure SQL database with updated schema
2. Deploy three Azure Functions for authentication
3. Set up email service (SendGrid or Azure Communications)
4. Update `lib/api.ts` with your API endpoint
5. Test full flow locally with test email
6. Deploy to production
