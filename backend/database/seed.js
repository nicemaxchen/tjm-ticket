import { dbRun, dbGet } from './init.js';

// 初始化資料
export async function seedDatabase() {
  try {
    // 建立預設管理員帳戶（開發環境）
    const adminCheck = await dbGet('SELECT * FROM admins WHERE username = ?', ['admin']);
    
    if (!adminCheck) {
      await dbRun(
        'INSERT INTO admins (username, password, name) VALUES (?, ?, ?)',
        ['admin', 'admin123', '系統管理員']
      );
      console.log('✅ 預設管理員帳戶已建立 (使用者名稱: admin, 密碼: admin123)');
    } else {
      console.log('ℹ️  管理員帳戶已存在');
    }

    // 建立範例活動
    const eventCheck = await dbGet('SELECT * FROM events LIMIT 1');
    
    if (!eventCheck) {
      const now = new Date();
      const eventDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7天后
      const collectionStart = new Date(now.getTime() + 1 * 60 * 60 * 1000); // 1小时后开始
      const collectionEnd = new Date(eventDate.getTime() - 1 * 24 * 60 * 60 * 1000); // 活动前1天结束
      
      const eventResult = await dbRun(
        `INSERT INTO events 
         (name, description, event_date, ticket_collection_start, 
          ticket_collection_end, checkin_start, checkin_end, allow_web_collection)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          '示例活动',
          '這是一個範例活動，用於測試系統功能',
          eventDate.toISOString(),
          collectionStart.toISOString(),
          collectionEnd.toISOString(),
          new Date(eventDate.getTime() - 1 * 60 * 60 * 1000).toISOString(), // 活动前1小时开始报到
          eventDate.toISOString(),
          1 // 允许Web取票
        ]
      );
      
      console.log('✅ 範例活動已建立');
    }

    // 建立範例票券類別
    const categoryCheck = await dbGet('SELECT * FROM ticket_categories LIMIT 1');
    
    if (!categoryCheck) {
      await dbRun(
        'INSERT INTO ticket_categories (name, description, total_limit, per_phone_limit) VALUES (?, ?, ?, ?)',
        ['普通票', '普通票券類別', 100, 2]
      );
      
      await dbRun(
        'INSERT INTO ticket_categories (name, description, total_limit, per_phone_limit) VALUES (?, ?, ?, ?)',
        ['VIP票', 'VIP票券类别', 50, 1]
      );
      
      console.log('✅ 範例票券類別已建立');
    }

    console.log('✅ 資料庫初始化完成');
  } catch (error) {
    console.error('❌ 資料庫初始化失敗:', error);
  }
}

// 如果直接執行此檔案，執行初始化
if (import.meta.url === `file://${process.argv[1]}`) {
  import('./init.js').then(() => {
    seedDatabase().then(() => {
      process.exit(0);
    });
  });
}