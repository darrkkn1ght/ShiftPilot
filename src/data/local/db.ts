import * as SQLite from 'expo-sqlite';

export const db = SQLite.openDatabaseSync('shiftpilot.db');

export const initDatabase = () => {
  try {
    db.execSync(`
      PRAGMA journal_mode = WAL;
      PRAGMA foreign_keys = ON;
      
      CREATE TABLE IF NOT EXISTS migrations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        executed_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    runMigrations();
    console.log('Local SQLite database initialized.');
  } catch (error) {
    console.error('Failed to initialize local database:', error);
  }
};

const migrations = [
  {
    name: '001_initial_schema',
    sql: `
      -- Business
      CREATE TABLE IF NOT EXISTS businesses (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        timezone TEXT DEFAULT 'UTC',
        late_threshold_minutes INTEGER DEFAULT 10,
        settings_json TEXT, -- Store extra settings objects
        created_at TEXT,
        updated_at TEXT,
        deleted_at TEXT,
        sync_status TEXT DEFAULT 'synced' -- synced, pending, error
      );

      -- Business Members
      CREATE TABLE IF NOT EXISTS business_members (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        business_id TEXT NOT NULL,
        role TEXT NOT NULL, -- admin, staff
        created_at TEXT,
        updated_at TEXT,
        deleted_at TEXT,
        sync_status TEXT DEFAULT 'synced',
        FOREIGN KEY (business_id) REFERENCES businesses (id) ON DELETE CASCADE,
        UNIQUE(user_id, business_id)
      );

      -- Staff
      CREATE TABLE IF NOT EXISTS staff (
        id TEXT PRIMARY KEY,
        business_id TEXT NOT NULL,
        user_id TEXT, -- Link to auth user
        name TEXT NOT NULL,
        role TEXT NOT NULL, -- admin, staff
        hourly_rate REAL DEFAULT 0,
        active INTEGER DEFAULT 1, -- boolean 0/1
        created_at TEXT,
        updated_at TEXT,
        deleted_at TEXT,
        sync_status TEXT DEFAULT 'synced',
        FOREIGN KEY (business_id) REFERENCES businesses (id) ON DELETE CASCADE
      );

      -- Shifts
      CREATE TABLE IF NOT EXISTS shifts (
        id TEXT PRIMARY KEY NOT NULL,
        business_id TEXT NOT NULL,
        staff_id TEXT,
        date TEXT NOT NULL, -- YYYY-MM-DD
        start_time TEXT NOT NULL, -- HH:MM
        end_time TEXT NOT NULL, -- HH:MM
        status TEXT NOT NULL, -- draft, published, canceled
        needs_coverage BOOLEAN DEFAULT 0,
        notes TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        deleted_at TEXT,
        sync_status TEXT DEFAULT 'synced', -- pending, synced
        FOREIGN KEY (business_id) REFERENCES businesses (id) ON DELETE CASCADE,
        FOREIGN KEY (staff_id) REFERENCES staff (id) ON DELETE CASCADE
      );

      -- Time Entries
      CREATE TABLE IF NOT EXISTS time_entries (
        id TEXT PRIMARY KEY,
        shift_id TEXT NOT NULL,
        staff_id TEXT NOT NULL,
        clock_in TEXT NOT NULL, -- ISO Timestamp
        clock_out TEXT,
        minutes_late INTEGER DEFAULT 0,
        total_minutes INTEGER DEFAULT 0,
        source TEXT DEFAULT 'mobile',
        created_at TEXT,
        updated_at TEXT,
        deleted_at TEXT,
        sync_status TEXT DEFAULT 'synced',
        FOREIGN KEY (shift_id) REFERENCES shifts (id) ON DELETE CASCADE,
        FOREIGN KEY (staff_id) REFERENCES staff (id) ON DELETE CASCADE
      );
      
      -- Requests
      CREATE TABLE IF NOT EXISTS requests (
        id TEXT PRIMARY KEY,
        business_id TEXT NOT NULL,
        staff_id TEXT NOT NULL,
        type TEXT NOT NULL, -- time_off
        start_date TEXT NOT NULL,
        end_date TEXT NOT NULL,
        reason TEXT,
        status TEXT DEFAULT 'pending', -- pending, approved, declined
        created_at TEXT,
        updated_at TEXT,
        deleted_at TEXT,
        sync_status TEXT DEFAULT 'synced',
        FOREIGN KEY (business_id) REFERENCES businesses (id) ON DELETE CASCADE,
        FOREIGN KEY (staff_id) REFERENCES staff (id) ON DELETE CASCADE
      );
    `
  }
];

const runMigrations = () => {
  const executed = db.getAllSync<{ name: string }>('SELECT name FROM migrations');
  const executedNames = new Set(executed.map(api => api.name));

  for (const migration of migrations) {
    if (!executedNames.has(migration.name)) {
      console.log(`Running migration: ${migration.name}`);
      db.execSync(migration.sql);
      db.runSync('INSERT INTO migrations (name) VALUES (?)', [migration.name]);
    }
  }
};

export const seedDatabase = () => {
  // Check if data exists
  const existing = db.getFirstSync<{ count: number }>('SELECT count(*) as count FROM businesses');
  if (existing && existing.count > 0) return;

  console.log('Seeding database...');
  const now = new Date().toISOString();

  // Seed Business
  db.runSync(`INSERT INTO businesses (id, name, timezone, created_at, updated_at, sync_status) VALUES (?, ?, ?, ?, ?, ?)`,
    ['biz_1', 'Demo Salon', 'UTC', now, now, 'pending']);

  // Seed Staff
  db.runSync(`INSERT INTO staff (id, business_id, name, role, hourly_rate, active, created_at, updated_at, sync_status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ['staff_1', 'biz_1', 'Alice Owner', 'admin', 50.0, 1, now, now, 'pending']);

  db.runSync(`INSERT INTO staff (id, business_id, name, role, hourly_rate, active, created_at, updated_at, sync_status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ['staff_2', 'biz_1', 'Bob Stylist', 'staff', 25.0, 1, now, now, 'pending']);

  console.log('Database seeded.');
};
