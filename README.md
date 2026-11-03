# Client
Mobile application client built with React Native and Expo.

## 2025 Tech Stack

- React Native
- Expo
- TypeScript
- Supabase (authentication, database, and storage)

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

Add the Supabase project URL and publishable key to `.env.local`:

```env
EXPO_PUBLIC_SUPABASE_URL=https://bhrqwrzwjcrfalqjlmrn.supabase.co
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
```

Images use the `profile-pictures`, `community-images`, and `item-images`
buckets. Keep these buckets private and configure Storage policies for
authenticated users. The app uses Supabase Auth; never put a service-role key in
the client.

### 2. Start the Client

```bash
npx expo start
```

Then press `w` for web, `i` for iOS simulator, `a` for Android simulator, or scan the QR code with the Expo Go app on a physical device.

## Other Repos

* [Project](https://github.com/calvin-cs262-fall2025-teamG/Project)
* [Service](https://github.com/calvin-cs262-fall2025-teamG/Service)