import { Pool } from "pg";

const DATABASE_SCHEMA = `
  CREATE TABLE IF NOT EXISTS bb_users (
    id uuid PRIMARY KEY,
    email text NOT NULL UNIQUE,
    password_hash text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now()
  );

  CREATE TABLE IF NOT EXISTS bb_sessions (
    token_hash text PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES bb_users(id) ON DELETE CASCADE,
    expires_at timestamptz NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now()
  );
  CREATE INDEX IF NOT EXISTS bb_sessions_user_id_idx ON bb_sessions(user_id);
  CREATE INDEX IF NOT EXISTS bb_sessions_expires_at_idx ON bb_sessions(expires_at);

  CREATE TABLE IF NOT EXISTS bb_learner_journals (
    user_id uuid PRIMARY KEY REFERENCES bb_users(id) ON DELETE CASCADE,
    state jsonb NOT NULL,
    updated_at timestamptz NOT NULL DEFAULT now()
  );

  CREATE TABLE IF NOT EXISTS bb_conversation_memories (
    user_id uuid NOT NULL REFERENCES bb_users(id) ON DELETE CASCADE,
    language_code text NOT NULL,
    scenario_slug text NOT NULL,
    messages jsonb NOT NULL,
    updated_at timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (user_id, language_code, scenario_slug)
  );
`;

type DatabaseGlobal = typeof globalThis & {
  bhashaBuddyPool?: Pool;
  bhashaBuddySchema?: Promise<void>;
};

const databaseGlobal = globalThis as DatabaseGlobal;

export function isDatabaseConfigured() {
  return Boolean(process.env.DATABASE_URL?.trim());
}

export function getPool() {
  const connectionString = process.env.DATABASE_URL?.trim();
  if (!connectionString) throw new Error("Account storage is not configured. Set DATABASE_URL on the server.");

  if (!databaseGlobal.bhashaBuddyPool) {
    databaseGlobal.bhashaBuddyPool = new Pool({
      connectionString,
      max: 2,
      idleTimeoutMillis: 10_000,
      connectionTimeoutMillis: 5_000,
      allowExitOnIdle: true,
    });
  }
  return databaseGlobal.bhashaBuddyPool;
}

export async function getDatabase() {
  const pool = getPool();
  if (!databaseGlobal.bhashaBuddySchema) {
    databaseGlobal.bhashaBuddySchema = pool.query(DATABASE_SCHEMA).then(() => undefined).catch((error: unknown) => {
      databaseGlobal.bhashaBuddySchema = undefined;
      throw error;
    });
  }
  await databaseGlobal.bhashaBuddySchema;
  return pool;
}
