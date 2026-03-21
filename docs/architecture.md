# Architecture

## System Design

The system is a standard client-server architecture. The Expo mobile app communicates with an Express REST API, which reads and writes to a PostgreSQL database. External food data is fetched from Open Food Facts for barcode lookups and cached locally.

```text
[Expo App]  <-->  [Express API]  <-->  [PostgreSQL]
                       |
                [Open Food Facts API]
```

## Frontend

**Technology:** Expo (React Native)

### Screens

| Screen            | Purpose                                                            |
|-------------------|--------------------------------------------------------------------|
| TodayScreen       | Main dashboard — calories, macros, today's log                     |
| SearchScreen      | Food search with recent foods, barcode scanner                     |
| PortionScreen     | Portion selection after choosing a food                            |
| MealsScreen       | Saved meals — view and log whole meals with scale picker           |
| CreateMealScreen  | Create a new saved meal with food search and ±quantity draft list  |
| WeightScreen      | Log and view body weight history                                   |
| SettingsScreen    | Set calorie and protein targets                                    |
| CreateFoodScreen  | Create a custom food (name, macros per 100g, liquid flag, servings)|
| EditFoodScreen    | Edit a user-created food; saves as a new versioned row             |

### State Management

- React Context API for global state (current user, today's log, macro targets, weight logged today)
- Local component state for everything else
- No Redux — keep it simple until complexity demands otherwise

### Key Principles

- Debounce search input at 250ms to avoid hammering the backend
- Pre-load today's log and recent foods on app open
- Keep components under ~200 lines; extract a component before it grows past that
- Separate API calls into a `/services` layer — no `fetch()` calls inside components

## Backend

**Technology:** Express (Node.js)

### API Structure

```text
/foods
  GET  /search?q=        Search foods by name
  GET  /recent           Top 10 most recently logged distinct foods for the user
  GET  /barcode/:barcode Look up food by barcode (checks DB first, then Open Food Facts)
  GET  /:id              Get a single food with its servings
  POST /                 Create a new food (with optional custom servings)
  PATCH /:id             Edit a food — inserts a new versioned row (immutability)

/log
  GET  /:date            Get all log items for a given date (YYYY-MM-DD)
  POST /                 Add a food to today's log
  DELETE /items/:id      Delete a log item
  PATCH /items/:id       Update a log item's quantity or meal slot

/meals
  GET  /                 List all saved meals for the user
  POST /                 Create a new meal (items included in body)
  POST /:id/log          Log an entire meal; accepts optional scale param (0.5, 1, 2)

/users
  GET  /me               Get the current user's macro targets
  PATCH /me              Update macro targets (partial update supported)

/weight
  GET  /                 Get weight history
  POST /                 Log a weight entry
```

### Backend Principles

- Thin API layer over the database — business logic lives in the DB schema and service functions, not in route handlers
- Store all nutrition values per 100g, convert to servings at read time
- Foods are immutable once created — changes create a new version

## Database

**Technology:** PostgreSQL

See [../database/schema.md](../database/schema.md) for the full schema and ER diagram.

### Key Design Decisions

- All nutrition values stored per 100g for consistency
- `food_servings` table allows custom units (slice, piece, tbsp) per food
- `foods.source` enum distinguishes user-created vs. verified vs. Open Food Facts data
- `log_items` links to both a food and optionally a serving unit for flexible portion tracking

## External APIs

**Open Food Facts** — free, open food database

- Used for barcode scanning lookups
- Results are cached in the local `foods` table on first lookup to avoid repeated API calls
- Marked with `source = 'OPENFOODFACTS'`

## Deployment

Initially: single VPS running both the Express API and PostgreSQL. Simple, cheap, easy to reason about. Scale when there's a reason to.
