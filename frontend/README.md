# Statement Analyzer Mobile (Expo React Native)

This is the mobile frontend for the Statement Analyzer project, built with Expo and React Native.

## Getting Started

1. **Install dependencies:**
   ```sh
   cd frontend
   npm install
   # or
   yarn
   ```

2. **Start the Expo app:**
   ```sh
   npm start
   # or
   yarn start
   ```

3. **Run on your device:**
   - Use the Expo Go app (Android/iOS) to scan the QR code.
   - Or run on an emulator with `npm run android` or `npm run ios`.

## Features
- Upload PDF bank statements
- Analyze statements via backend API
- View results in the app

## Requirements
- Node.js (v16+ recommended)
- Expo CLI (`npm install -g expo-cli`)

## Backend
Make sure your backend API is running and accessible. Update the backend URL in `App.js` if needed. 