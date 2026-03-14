/**
 * @param {import('node-pg-migrate').MigrationBuilder} pgm
 */
exports.up = async (pgm) => {
  pgm.sql(`
    CREATE TYPE food_source AS ENUM ('USER', 'VERIFIED', 'OPENFOODFACTS');
    CREATE TYPE meal_category AS ENUM ('BREAKFAST', 'LUNCH', 'DINNER', 'SNACK');

    CREATE TABLE users (
      id               SERIAL PRIMARY KEY,
      name             TEXT NOT NULL,
      email            TEXT UNIQUE NOT NULL,
      target_calories  INT,
      target_protein_g INT,
      created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE foods (
      id                  SERIAL PRIMARY KEY,
      name                TEXT NOT NULL,
      barcode             TEXT UNIQUE,
      source              food_source NOT NULL DEFAULT 'USER',
      version             INT NOT NULL DEFAULT 1,
      created_by_user_id  INT REFERENCES users(id) ON DELETE SET NULL,
      liquid              BOOLEAN NOT NULL DEFAULT FALSE,
      calories_per_100g   NUMERIC(8,2) NOT NULL,
      protein_per_100g    NUMERIC(8,2) NOT NULL DEFAULT 0,
      carbs_per_100g      NUMERIC(8,2) NOT NULL DEFAULT 0,
      fat_per_100g        NUMERIC(8,2) NOT NULL DEFAULT 0,
      created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE food_servings (
      id         SERIAL PRIMARY KEY,
      food_id    INT NOT NULL REFERENCES foods(id) ON DELETE CASCADE,
      name       TEXT NOT NULL,
      grams      NUMERIC(8,2) NOT NULL,
      is_default BOOLEAN NOT NULL DEFAULT FALSE
    );

    CREATE TABLE meals (
      id         SERIAL PRIMARY KEY,
      user_id    INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      name       TEXT NOT NULL,
      category   meal_category,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE meal_items (
      id         SERIAL PRIMARY KEY,
      meal_id    INT NOT NULL REFERENCES meals(id) ON DELETE CASCADE,
      food_id    INT NOT NULL REFERENCES foods(id),
      serving_id INT REFERENCES food_servings(id) ON DELETE SET NULL,
      quantity   NUMERIC(8,3) NOT NULL DEFAULT 1
    );

    CREATE TABLE day_logs (
      id      SERIAL PRIMARY KEY,
      user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      date    DATE NOT NULL,
      UNIQUE (user_id, date)
    );

    CREATE TABLE log_items (
      id          SERIAL PRIMARY KEY,
      day_log_id  INT NOT NULL REFERENCES day_logs(id) ON DELETE CASCADE,
      food_id     INT NOT NULL REFERENCES foods(id),
      serving_id  INT REFERENCES food_servings(id) ON DELETE SET NULL,
      quantity    NUMERIC(8,3) NOT NULL DEFAULT 1,
      meal_slot   meal_category NOT NULL,
      logged_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE weights (
      id         SERIAL PRIMARY KEY,
      user_id    INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      weight_kg  NUMERIC(5,2) NOT NULL,
      logged_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    -- Indexes for common queries
    CREATE INDEX idx_foods_name ON foods USING gin(to_tsvector('english', name));
    CREATE INDEX idx_foods_barcode ON foods(barcode) WHERE barcode IS NOT NULL;
    CREATE INDEX idx_log_items_day_log_id ON log_items(day_log_id);
    CREATE INDEX idx_day_logs_user_date ON day_logs(user_id, date);
  `);
};

/**
 * @param {import('node-pg-migrate').MigrationBuilder} pgm
 */
exports.down = async (pgm) => {
  pgm.sql(`
    DROP TABLE IF EXISTS weights;
    DROP TABLE IF EXISTS log_items;
    DROP TABLE IF EXISTS day_logs;
    DROP TABLE IF EXISTS meal_items;
    DROP TABLE IF EXISTS meals;
    DROP TABLE IF EXISTS food_servings;
    DROP TABLE IF EXISTS foods;
    DROP TABLE IF EXISTS users;
    DROP TYPE IF EXISTS meal_category;
    DROP TYPE IF EXISTS food_source;
  `);
};
