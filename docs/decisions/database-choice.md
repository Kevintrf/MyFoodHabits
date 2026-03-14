# Decision: Database — PostgreSQL

## Decision

Use **PostgreSQL** as the primary database.

## Reasoning

- Relational data model is a natural fit — foods, servings, meals, log entries, and users are all strongly relational
- Strong support for joins, which are needed to calculate macros across log items
- Mature ecosystem with excellent Node.js drivers (`pg`, `node-postgres`)
- Easy to run locally via Docker during development
- Handles the expected query patterns well: user-scoped reads by date, food search by name, barcode lookup

## Alternatives Considered

**SQLite** — simpler setup, but doesn't scale beyond a single server and lacks some features needed for concurrent multi-user access.

**MongoDB** — flexible schema is appealing early on, but the data here is inherently relational and the joins required (food + serving + log item) are awkward in a document model.

**Supabase / managed Postgres** — good option later. Avoided now to keep infrastructure simple and free.

## Consequences

- Need to manage migrations as the schema evolves — will use a migration tool (e.g. `node-pg-migrate` or `drizzle`)
- Local dev requires Docker or a local Postgres install
- Schema changes require coordination between DB and API — both will need to be updated together
