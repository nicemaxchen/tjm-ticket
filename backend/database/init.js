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
      event_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      total_limit INTEGER NOT NULL DEFAULT 0,
      daily_limit INTEGER DEFAULT 0,
      per_phone_limit INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
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
      max_attendees INTEGER DEFAULT 0,
      location TEXT,
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

  // 檢查並添加新欄位（用於已存在的資料庫）
  db.run(`ALTER TABLE events ADD COLUMN max_attendees INTEGER DEFAULT 0`, (err) => {
    if (err && !err.message.includes('duplicate column')) {
      console.error('❌ Add max_attendees column error:', err);
    }
  });

  db.run(`ALTER TABLE events ADD COLUMN location TEXT`, (err) => {
    if (err && !err.message.includes('duplicate column')) {
      console.error('❌ Add location column error:', err);
    }
  });

  // 為 ticket_categories 表添加 event_id 欄位（遷移）
  db.run(`ALTER TABLE ticket_categories ADD COLUMN event_id INTEGER`, (err) => {
    if (err && !err.message.includes('duplicate column')) {
      console.error('❌ Add event_id column error:', err);
    } else {
      // 如果欄位已存在，檢查是否有舊資料需要遷移
      db.get('SELECT COUNT(*) as count FROM ticket_categories WHERE event_id IS NULL', (err, row) => {
        if (!err && row && row.count > 0) {
          // 如果有舊資料且沒有 event_id，嘗試關聯到第一個活動
          db.get('SELECT id FROM events ORDER BY id LIMIT 1', (err, eventRow) => {
            if (!err && eventRow) {
              db.run('UPDATE ticket_categories SET event_id = ? WHERE event_id IS NULL', [eventRow.id], (err) => {
                if (err) {
                  console.error('❌ Migrate categories to event error:', err);
                } else {
                  console.log('✅ Migrated existing categories to first event');
                }
              });
            }
          });
        }
      });
    }
  });

  // 為 ticket_categories 表添加 requires_review 欄位
  db.run(`ALTER TABLE ticket_categories ADD COLUMN requires_review BOOLEAN DEFAULT 0`, (err) => {
    if (err && !err.message.includes('duplicate column')) {
      console.error('❌ Add requires_review column error:', err);
    }
  });

  // 為 ticket_categories 表添加 sort_order 欄位
  db.run(`ALTER TABLE ticket_categories ADD COLUMN sort_order INTEGER DEFAULT 0`, (err) => {
    if (err && !err.message.includes('duplicate column')) {
      console.error('❌ Add sort_order column error:', err);
    } else {
      // 如果欄位已添加，為現有記錄設置初始排序值
      db.run(`UPDATE ticket_categories SET sort_order = id WHERE sort_order = 0 OR sort_order IS NULL`, (err) => {
        if (err) {
          console.error('❌ Initialize sort_order error:', err);
        }
      });
    }
  });

  // 為 ticket_categories 表添加 allow_collection 欄位
  db.run(`ALTER TABLE ticket_categories ADD COLUMN allow_collection BOOLEAN DEFAULT 1`, (err) => {
    if (err && !err.message.includes('duplicate column')) {
      console.error('❌ Add allow_collection column error:', err);
    }
  });

  // 為 events 表添加 vip_per_phone_limit 和 general_per_phone_limit 欄位
  db.run(`ALTER TABLE events ADD COLUMN vip_per_phone_limit INTEGER DEFAULT 0`, (err) => {
    if (err && !err.message.includes('duplicate column')) {
      console.error('❌ Add vip_per_phone_limit column error:', err);
    }
  });

  db.run(`ALTER TABLE events ADD COLUMN general_per_phone_limit INTEGER DEFAULT 0`, (err) => {
    if (err && !err.message.includes('duplicate column')) {
      console.error('❌ Add general_per_phone_limit column error:', err);
    }
  });

  // 為 ticket_categories 表添加 identity_type 欄位（將 per_phone_limit 改為身份類別）
  db.run(`ALTER TABLE ticket_categories ADD COLUMN identity_type TEXT DEFAULT 'general'`, (err) => {
    if (err && !err.message.includes('duplicate column')) {
      console.error('❌ Add identity_type column error:', err);
    } else {
      // 如果欄位已添加，將現有的 per_phone_limit > 1 的類別設為 'vip'（可選的遷移邏輯）
      // 這裡我們保持默認為 'general'，讓管理員手動設置
    }
  });

  console.log('✅ Database tables initialized');
}