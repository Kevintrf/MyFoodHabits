import { db } from './client';

// Bump this when adding new tables or columns and add a migration below.
const SCHEMA_VERSION = 2;

// ---------------------------------------------------------------------------
// Table definitions
// ---------------------------------------------------------------------------
// SQLite adaptations from the PostgreSQL schema:
//   - SERIAL / BIGSERIAL  → INTEGER PRIMARY KEY  (auto-increments)
//   - BOOLEAN             → INTEGER              (0 = false, 1 = true)
//   - FLOAT / NUMERIC     → REAL
//   - ENUM                → TEXT CHECK (col IN (...))
//   - DEFAULT NOW()       → DEFAULT (datetime('now'))
//   - Timestamps          → TEXT stored as ISO-8601 strings

const CREATE_TABLES = `
  CREATE TABLE IF NOT EXISTS user_settings (
    id                INTEGER PRIMARY KEY NOT NULL DEFAULT 1,
    name              TEXT,
    target_calories   INTEGER NOT NULL DEFAULT 2000,
    target_protein_g  INTEGER NOT NULL DEFAULT 150,
    schema_version    INTEGER NOT NULL DEFAULT 1
  );

  CREATE TABLE IF NOT EXISTS foods (
    id                   INTEGER PRIMARY KEY NOT NULL,
    name                 TEXT NOT NULL,
    barcode              TEXT,
    source               TEXT NOT NULL DEFAULT 'USER'
                           CHECK (source IN ('USER', 'VERIFIED', 'OPENFOODFACTS')),
    version              INTEGER NOT NULL DEFAULT 1,
    created_by_user_id   INTEGER,
    liquid               INTEGER NOT NULL DEFAULT 0,
    calories_per_100g    REAL NOT NULL,
    protein_per_100g     REAL NOT NULL DEFAULT 0,
    carbs_per_100g       REAL NOT NULL DEFAULT 0,
    fat_per_100g         REAL NOT NULL DEFAULT 0,
    locally_modified     INTEGER NOT NULL DEFAULT 0,
    created_at           TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS food_servings (
    id          INTEGER PRIMARY KEY NOT NULL,
    food_id     INTEGER NOT NULL REFERENCES foods(id),
    name        TEXT NOT NULL,
    grams       REAL NOT NULL,
    is_default  INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS meals (
    id          INTEGER PRIMARY KEY NOT NULL,
    user_id     INTEGER NOT NULL DEFAULT 1,
    name        TEXT NOT NULL,
    category    TEXT CHECK (category IN ('BREAKFAST', 'LUNCH', 'DINNER', 'SNACK')),
    created_at  TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS meal_items (
    id          INTEGER PRIMARY KEY NOT NULL,
    meal_id     INTEGER NOT NULL REFERENCES meals(id) ON DELETE CASCADE,
    food_id     INTEGER NOT NULL REFERENCES foods(id),
    serving_id  INTEGER REFERENCES food_servings(id),
    quantity    REAL NOT NULL
  );

  CREATE TABLE IF NOT EXISTS day_logs (
    id       INTEGER PRIMARY KEY NOT NULL,
    user_id  INTEGER NOT NULL DEFAULT 1,
    date     TEXT NOT NULL,
    UNIQUE(user_id, date)
  );

  CREATE TABLE IF NOT EXISTS log_items (
    id          INTEGER PRIMARY KEY NOT NULL,
    day_log_id  INTEGER NOT NULL REFERENCES day_logs(id),
    food_id     INTEGER NOT NULL REFERENCES foods(id),
    serving_id  INTEGER REFERENCES food_servings(id),
    quantity    REAL NOT NULL,
    meal_slot   TEXT NOT NULL
                  CHECK (meal_slot IN ('BREAKFAST', 'LUNCH', 'DINNER', 'SNACK')),
    logged_at   TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS weights (
    id         INTEGER PRIMARY KEY NOT NULL,
    user_id    INTEGER NOT NULL DEFAULT 1,
    weight_kg  REAL NOT NULL,
    logged_at  TEXT NOT NULL DEFAULT (datetime('now'))
  );
`;

// ---------------------------------------------------------------------------
// Indexes
// ---------------------------------------------------------------------------

const CREATE_INDEXES = `
  CREATE INDEX IF NOT EXISTS idx_foods_name
    ON foods(name);

  CREATE INDEX IF NOT EXISTS idx_foods_barcode
    ON foods(barcode);

  CREATE INDEX IF NOT EXISTS idx_log_items_day_log_id
    ON log_items(day_log_id);

  CREATE INDEX IF NOT EXISTS idx_log_items_food_id
    ON log_items(food_id);

  CREATE INDEX IF NOT EXISTS idx_day_logs_user_date
    ON day_logs(user_id, date);

  CREATE INDEX IF NOT EXISTS idx_weights_user_logged
    ON weights(user_id, logged_at);
`;

// ---------------------------------------------------------------------------
// initSchema — call once on app start, before any queries are made
// ---------------------------------------------------------------------------

export function initSchema(): void {
  // WAL mode improves concurrent read performance and crash safety
  db.execSync('PRAGMA journal_mode = WAL;');

  db.withTransactionSync(() => {
    db.execSync(CREATE_TABLES);
    db.execSync(CREATE_INDEXES);

    // Seed the single user_settings row on first install
    db.runSync(
      `INSERT OR IGNORE INTO user_settings (id, target_calories, target_protein_g, schema_version)
       VALUES (1, 2000, 150, 1)`,
    );

    // Run migrations for existing installs
    const row = db.getFirstSync<{ schema_version: number }>(
      'SELECT schema_version FROM user_settings WHERE id = 1',
    );
    const currentVersion = row?.schema_version ?? 1;

    if (currentVersion < 2) {
      try {
        db.execSync('ALTER TABLE foods ADD COLUMN locally_modified INTEGER NOT NULL DEFAULT 0;');
      } catch {
        // Column already exists (fresh install from updated CREATE TABLE)
      }
      db.runSync('UPDATE user_settings SET schema_version = 2 WHERE id = 1');
    }
  });
}
