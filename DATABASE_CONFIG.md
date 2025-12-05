## Database Configuration

The app now supports both mock (local) and Azure database backends with a single unified API.

### How to Switch Between Databases

Edit `config/database.ts`:

```typescript
// For testing/development - uses local AsyncStorage
export const DATABASE_MODE: 'mock' | 'azure' = 'mock';

// For production - uses Azure backend
export const DATABASE_MODE: 'mock' | 'azure' = 'azure';
```

That's it! The entire app will automatically use the selected database.

### Configuration Options

**`config/database.ts`**

```typescript
// Which database to use
DATABASE_MODE: 'mock' | 'azure'

// Azure backend URL (only used when DATABASE_MODE is 'azure')
AZURE_API_URL: string

// Enable debug logging
DEBUG: boolean
```

### API Architecture

All database operations go through a single unified API in `lib/api.ts`:

- `sendVerificationCode(email)` - Send verification code
- `verifyCode(email, code)` - Verify the code
- `getOrCreateUser(email)` - Get or create user account
- `getUserProfile(userId)` - Fetch user details

### How It Works

1. **When DATABASE_MODE = 'mock':**
   - Data is stored in React Native's AsyncStorage
   - Codes expire after 10 minutes (local only)
   - All operations are instant (with simulated network delay)
   - Perfect for testing and development

2. **When DATABASE_MODE = 'azure':**
   - Requests go to Azure Functions backend
   - Data stored in Azure SQL Database
   - Uses real email service (SendGrid/Azure Communications)
   - Requires backend deployment

### Mock Database Features

**Included Sample Users:**
- alice@example.com → Alice Johnson
- bob@example.com → Bob Smith

**Testing Tips:**
- Verification codes print to console: `[DB] Verification code sent to...`
- Copy the code from console and paste it into the app
- Reset database with `resetDatabase()` from `lib/mockDatabase.ts`

### Usage in Components

All components use the Auth context, which automatically uses the configured database:

```typescript
import { useAuth } from '../context/AuthContext';

const { user, sendCode, verifyAndLogin, logout } = useAuth();

// These automatically use mock or Azure based on DATABASE_MODE
await sendCode('user@example.com');
await verifyAndLogin('user@example.com', '123456');
```

### For Production

1. Change `DATABASE_MODE` to `'azure'`
2. Update `AZURE_API_URL` with your deployed Function App URL
3. Ensure Azure backend is deployed with auth functions
4. Database will automatically switch to Azure
