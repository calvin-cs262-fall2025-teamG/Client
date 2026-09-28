# Client
Mobile application client built with React Native and Expo (SDK 57).

## Tech Stack

- React Native
- Expo (SDK 57)
- TypeScript
- Azure (data service)

## Other Repos

* [Project](https://github.com/calvin-cs262-fall2025-teamG/Project)
* [Service](https://github.com/calvin-cs262-fall2025-teamG/Service)

# 2025 Setup Instructions

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