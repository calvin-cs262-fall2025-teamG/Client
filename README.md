# Client
Mobile application client built with React Native and Expo (SDK 57).

## Other Repos

* [Project](https://github.com/calvin-cs262-fall2025-teamG/Project)
* [Service](https://github.com/calvin-cs262-fall2025-teamG/Service)

## Tech Stack

- React Native
- Expo (SDK 57)
- TypeScript
- Azure (data service)

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Choose a backend

Open `services/api.ts` and find the `USE_DEPLOYED_BACKEND` flag near the top:

```ts
const USE_DEPLOYED_BACKEND = false;
```

- **`true`** — the client talks directly to the shared, always-on Azure deployment. No backend setup needed on your machine at all. Good for quickly running the app or testing against real shared data.
- **`false`** — the client talks to a Service running on your own machine (see step 3). Good for developing/testing backend changes before they're deployed.

### 3. If using a local backend, start the Service

```bash
cd ../Service
npm install
npm start
```

See the Service README for `.env` setup — the local Service needs real database credentials to run.

### 4. Start the Client

```bash
npx expo start
```

Then press `w` for web, `i` for iOS simulator, `a` for Android simulator, or scan the QR code with the Expo Go app on a physical device.

## Common Issues

**"Unable to connect to development server"**
- Try restarting the Expo dev server
- Clear the Expo cache: `npx expo start -c`

**"Project is incompatible with this version of Expo Go"**
- Expo Go on your phone only supports the single most recent Expo SDK version, and updates itself automatically. If this project's SDK falls behind, either upgrade the project (`npx expo install expo@latest --fix`, then `npx expo-doctor` to check for anything else needed) or use a simulator/web instead until it's upgraded.

**Image uploads (profile picture, item photos) throwing "Unsupported FormDataPart implementation"**
- As of SDK 56+, manually constructing `FormData` with a plain `{uri, name, type}` object no longer works reliably. Use `expo-file-system/legacy`'s `uploadAsync` instead — see `app/edit-profile.tsx` or `app/(tabs)/list.tsx` for a working example.