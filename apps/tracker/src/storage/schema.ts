import type Database from "better-sqlite3";

/**
 * Local database migrations, applied in order; `user_version` remembers the last one.
 * Never edit an applied migration: add a new one.
 */
const MIGRATIONS: readonly string[] = [
  `
  CREATE TABLE sessions (
    flight_id TEXT PRIMARY KEY,
    state TEXT NOT NULL CHECK (state IN ('flying', 'closed')),
    aircraft_title TEXT NOT NULL,
    opened_at TEXT NOT NULL,
    closed_at TEXT,
    close_reason TEXT,
    last_seq INTEGER NOT NULL DEFAULT 0,
    last_position_seq INTEGER NOT NULL DEFAULT 0,
    last_phase TEXT,
    last_lat REAL,
    last_lon REAL,
    last_at TEXT
  );
  CREATE TABLE samples (
    flight_id TEXT NOT NULL REFERENCES sessions (flight_id),
    t INTEGER NOT NULL,
    data TEXT NOT NULL
  );
  CREATE INDEX samples_flight ON samples (flight_id, t);
  CREATE TABLE events (
    flight_id TEXT NOT NULL REFERENCES sessions (flight_id),
    seq INTEGER NOT NULL,
    data TEXT NOT NULL,
    PRIMARY KEY (flight_id, seq)
  );
  CREATE TABLE outbox (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    flight_id TEXT NOT NULL,
    kind TEXT NOT NULL CHECK (kind IN ('open', 'events', 'close')),
    payload TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'parked')),
    attempts INTEGER NOT NULL DEFAULT 0,
    next_attempt_at INTEGER NOT NULL DEFAULT 0,
    last_error TEXT
  );
  CREATE TABLE settings (key TEXT PRIMARY KEY, value TEXT NOT NULL);
  `,
  // J2: UTC time of each sample (for the trajectory) and the "track" message.
  `
  ALTER TABLE samples ADD COLUMN at TEXT;
  CREATE TABLE outbox_v2 (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    flight_id TEXT NOT NULL,
    kind TEXT NOT NULL CHECK (kind IN ('open', 'events', 'close', 'track')),
    payload TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'parked')),
    attempts INTEGER NOT NULL DEFAULT 0,
    next_attempt_at INTEGER NOT NULL DEFAULT 0,
    last_error TEXT
  );
  INSERT INTO outbox_v2 SELECT * FROM outbox;
  DROP TABLE outbox;
  ALTER TABLE outbox_v2 RENAME TO outbox;
  `,
];

export function migrate(db: Database.Database): void {
  const current = db.pragma("user_version", { simple: true }) as number;
  MIGRATIONS.slice(current).forEach((sql, index) => {
    db.transaction(() => {
      db.exec(sql);
      db.pragma(`user_version = ${current + index + 1}`);
    })();
  });
}
