# Client
Mobile application client built with React Native and Expo.

## Other Repos

* [Project](https://github.com/calvin-cs262-fall2025-teamG/Project)
* [Service](https://github.com/calvin-cs262-fall2025-teamG/Service)

## Tech Stack

- React Native
- Expo
- TypeScript
- Azure (data service)

## Setup Instructions

## 1. Install Dependencies

```bash
npm install
```
## 2. API Configuration
The client is preconfigured to use the shared Azure API. No backend setup is required.

## 3. Make Sure the Service is Running

```bash
cd ../Service
npm run dev
```

## 4. Start the Client

```bash
npx expo start
```
## Common Issue

"Unable to connect to development server"

- Try restarting the Expo dev server
- Clear Expo cache: npx expo start -c
