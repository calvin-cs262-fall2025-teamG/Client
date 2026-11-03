# Client
Mobile application client built with React Native and Expo.

## 2025 Tech Stack

- React Native
- Expo
- TypeScript
- Azure (data service)

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### Run Tests

```bash
npm test
```

### Supabase Image Storage

Add the Supabase publishable key to `.env.local`:

```env
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
```

The project URL is configured in `services/api.ts`. Images are stored in the
`profile-pictures`, `community-images`, and `item-images` buckets. These buckets
are private; configure Storage access policies for the app's requests. The
current app login is handled by the Azure service, not Supabase Auth, so do not
use a Supabase service-role key in the client. For user-scoped access, use a
trusted server or Edge Function to authorize uploads and sign URLs.

### 2. Start the Client

```bash
npx expo start
```

Then press `w` for web, `i` for iOS simulator, `a` for Android simulator, or scan the QR code with the Expo Go app on a physical device.

## Other Repos

* [Project](https://github.com/calvin-cs262-fall2025-teamG/Project)
* [Service](https://github.com/calvin-cs262-fall2025-teamG/Service)