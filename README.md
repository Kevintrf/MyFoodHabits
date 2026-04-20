# MyFoodHabits

The goal of MyFoodHabits is to create an easy to use calorie tracker. The main purpose is to make calorie and macro tracking easy by having an easy to use UI where adding foods is easy and not a chore. The major feature helping with this is constant predictions based on previous usage which allows you to simply accept an input based on a very small or simply no input.

Everything that can be predicted should be predicted and asked to the user rather than forcing the user to prompt it.

The app should work quickly and do expected tasks and load thigns in advance so things load "instantly" for the user.

The app should follow the SLC model "Simple, Loveable, Complete" and focus on doing it's core features well rather than doing many features poorly.

## Getting Started

### Prerequisites

- Node.js
- Android Studio (for the emulator or to provide the Android SDK for physical device builds)

### Running on a physical phone (Expo Go)

```bash
cd frontend && npx expo start --clear
```

Scan the QR code with the Expo Go app on your phone.

> **Tip:** If the app fails to load (e.g. "Failed to download remote update"), UFW may be blocking Metro. Run once to open the port:
> ```bash
> sudo ufw allow 8081/tcp
> ```
> As a fallback, tunnel mode also works:
> ```bash
> cd frontend && npx expo start --tunnel --clear
> ```

### Running on an Android emulator

1. Open Android Studio → **Device Manager** → create a virtual device (e.g. Pixel 8, API 35) if you don't have one
2. Start the emulator from Device Manager (or via the AVD Manager)
3. Start Metro:
   ```bash
   cd frontend && npx expo start --clear
   ```
4. Press `a` in the Metro terminal to open the app in the running emulator

The first launch installs the Expo Go app automatically into the emulator.

### Building a standalone APK (no Metro required)

A release build bundles the JavaScript directly into the APK so the app runs fully standalone — no computer, no Metro needed. Requires a connected physical device or a running emulator.

```bash
cd frontend
npx expo run:android --variant release
```

The APK is built and installed directly on the connected device. The first build takes a few minutes; subsequent builds are faster due to Gradle's cache.

---

## Technology stack

### Frontend

Needs to be an app and work on phones. Needs to be able to use the camera and scan barcodes.

### Backend

Mostly just CRUD. Saves and collects data stored in the database.

### Database

Database containing user info as well as a list of 