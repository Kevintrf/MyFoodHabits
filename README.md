# MyFoodHabits

The goal of MyFoodHabits is to create an easy to use calorie tracker. The main purpose is to make calorie and macro tracking easy by having an easy to use UI where adding foods is easy and not a chore. The major feature helping with this is constant predictions based on previous usage which allows you to simply accept an input based on a very small or simply no input.

Everything that can be predicted should be predicted and asked to the user rather than forcing the user to prompt it.

The app should work quickly and do expected tasks and load thigns in advance so things load "instantly" for the user.

The app should follow the SLC model "Simple, Loveable, Complete" and focus on doing it's core features well rather than doing many features poorly.

## Getting Started

### Prerequisites

- Docker (for the local PostgreSQL database)
- Node.js
- Expo Go app on your phone

### First-time setup

```bash
# 1. Start the database
docker compose up -d

# 2. Apply schema migrations
cd backend && npm run migrate:up

# 3. Seed the default dev user
npm run seed

# 4. Set your machine's LAN IP in the frontend env
cp frontend/.env.example frontend/.env
# Edit frontend/.env and set: EXPO_PUBLIC_API_URL=http://<your-machine-ip>:3000
```

### Starting the app

```bash
# Terminal 1 — make sure the database is running
docker compose up -d

# Terminal 2 — start the backend
cd backend && npm run dev

# Terminal 3 — start the frontend
cd frontend && npx expo start --clear
```

Scan the QR code with Expo Go on your phone.

---

## Technology stack

### Frontend

Needs to be an app and work on phones. Needs to be able to use the camera and scan barcodes.

### Backend

Mostly just CRUD. Saves and collects data stored in the database.

### Database

Database containing user info as well as a list of 