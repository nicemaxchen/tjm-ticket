import sqlite3 from 'sqlite3';
import { promisify } from 'util';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dbPath = join(__dirname, 'ticket.db');

// 建立資料庫連線
export const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ Database connection error:', err);
  } else {
    console.log('✅ Connected to SQLite database');
  }
});

// Promisify資料庫方法
export function dbRun(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) reject(err);
      else resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
}

export function dbGet(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

export function dbAll(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows || []);
    });
  });
}

// 初始化資料庫表
export function initDatabase() {
  const tables = [
    // 使用者表
    `CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      liff_user_id TEXT,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT NOT NULL UNIQUE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    
    // 票券類別表
    `CREATE TABLE IF NOT EXISTS ticket_categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      total_limit INTEGER NOT NULL DEFAULT 0,
      daily_limit INTEGER DEFAULT 0,
      per_phone_limit INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    
    // 報名場次表
    `CREATE TABLE IF NOT EXISTS events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      event_date DATETIME,
      ticket_collection_start DATETIME,
      ticket_collection_end DATETIME,
      checkin_start DATETIME,
      checkin_end DATETIME,
      allow_web_collection BOOLEAN DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    
    // 報名記錄表
    `CREATE TABLE IF NOT EXISTS registrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      event_id INTEGER NOT NULL,
      ticket_category_id INTEGER NOT NULL,
      phone TEXT NOT NULL,
      status TEXT DEFAULT 'pending',
      is_from_liff BOOLEAN DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (event_id) REFERENCES events(id),
      FOREIGN KEY (ticket_category_id) REFERENCES ticket_categories(id)
    )`,
    
    // 票券表
    `CREATE TABLE IF NOT EXISTS tickets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      token_id TEXT UNIQUE NOT NULL,
      registration_id INTEGER NOT NULL,
      user_id INTEGER,
      event_id INTEGER NOT NULL,
      ticket_category_id INTEGER NOT NULL,
      phone TEXT NOT NULL,
      barcode TEXT UNIQUE,
      checkin_status TEXT DEFAULT 'unchecked',
      checkin_time DATETIME,
      collection_method TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (registration_id) REFERENCES registrations(id),
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (event_id) REFERENCES events(id),
      FOREIGN KEY (ticket_category_id) REFERENCES ticket_categories(id)
    )`,
    
    // 簡訊驗證表
    `CREATE TABLE IF NOT EXISTS sms_verifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      phone TEXT NOT NULL,
      code TEXT NOT NULL,
      verified BOOLEAN DEFAULT 0,
      expires_at DATETIME NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    
    // 非既有名單表（待審核）
    `CREATE TABLE IF NOT EXISTS pending_list (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      registration_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT NOT NULL,
      event_id INTEGER NOT NULL,
      ticket_category_id INTEGER NOT NULL,
      status TEXT DEFAULT 'pending',
      admin_notes TEXT,
      reviewed_by INTEGER,
      reviewed_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (registration_id) REFERENCES registrations(id),
      FOREIGN KEY (event_id) REFERENCES events(id),
      FOREIGN KEY (ticket_category_id) REFERENCES ticket_categories(id)
    )`,
    
    // 管理員表
    `CREATE TABLE IF NOT EXISTS admins (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      name TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`
  ];

  tables.forEach((sql) => {
    db.run(sql, (err) => {
      if (err) {
        console.error('❌ Table creation error:', err);
      }
    });
  });

  // 建立索引
  const indexes = [
    'CREATE INDEX IF NOT EXISTS idx_tickets_token ON tickets(token_id)',
    'CREATE INDEX IF NOT EXISTS idx_tickets_barcode ON tickets(barcode)',
    'CREATE INDEX IF NOT EXISTS idx_tickets_phone ON tickets(phone)',
    'CREATE INDEX IF NOT EXISTS idx_registrations_phone ON registrations(phone)',
    'CREATE INDEX IF NOT EXISTS idx_sms_phone ON sms_verifications(phone)',
  ];

  indexes.forEach((sql) => {
    db.run(sql, (err) => {
      if (err) {
        console.error('❌ Index creation error:', err);
      }
    });
  });

  console.log('✅ Database tables initialized');
}