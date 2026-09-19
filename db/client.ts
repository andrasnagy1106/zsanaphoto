import { Pool } from "pg";
import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import * as schema from "./schema";

declare global {
  var __zsanaphotoPool: Pool | undefined;
}

function createPool() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error(
      "DATABASE_URL  is not set. Configure it in .env.local (see .env.example).",
    );
  }
  return new Pool({ connectionString });
}

type Db = NodePgDatabase<typeof schema>;

let cachedDb: Db | undefined;

function getDb(): Db {
  if (cachedDb) return cachedDb;

  // Reuse the pool across hot reloads in development to avoid exhausting connections.
  const pool = globalThis.__zsanaphotoPool ?? createPool();
  if (process.env.NODE_ENV !== "production") {
    globalThis.__zsanaphotoPool = pool;
  }

  cachedDb = drizzle(pool, { schema });
  return cachedDb;
}

// Lazily initialized so importing this module (e.g. transitively in unit tests
// that only exercise pure helper functions) never requires DATABASE_URL to be set.
export const db: Db = new Proxy({} as Db, {
  get(_target, prop, receiver) {
    return Reflect.get(getDb() as object, prop, receiver);
  },
});
