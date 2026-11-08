import mysql from 'mysql2/promise';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

export function createDatabasePool(env = process.env) {
  const port = Number(env.DB_PORT || 3306);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('DB_PORT phải là số nguyên từ 1 đến 65535.');
  }
  if (!env.DB_USER || !env.DB_NAME) {
    throw new Error('Cần điền DB_USER và DB_NAME trong .env.');
  }
  return mysql.createPool({
    host: env.DB_HOST || '127.0.0.1',
    port,
    user: env.DB_USER,
    password: env.DB_PASSWORD || '',
    database: env.DB_NAME,
    charset: 'utf8mb4',
    waitForConnections: true,
    connectionLimit: 5,
    queueLimit: 20,
    connectTimeout: 5000,
    supportBigNumbers: true,
    bigNumberStrings: true,
    multipleStatements: false,
  });
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  let pool;
  try {
    pool = createDatabasePool();
    const [[row]] = await pool.query('SELECT DATABASE() AS ten_database');
    console.log(`Kết nối MySQL thành công: ${row.ten_database}`);
  } catch (error) {
    const messages = {
      ER_ACCESS_DENIED_ERROR: 'Kiểm tra DB_USER và DB_PASSWORD trong .env.',
      ER_BAD_DB_ERROR: 'Hãy tạo database anonymous_resys bằng schema trong Workbench trước.',
      ECONNREFUSED: 'Kiểm tra MySQL Server đã chạy và DB_HOST/DB_PORT.',
    };
    console.error(`Kết nối MySQL thất bại: ${messages[error.code] || error.code || error.message}`);
    process.exitCode = 1;
  } finally {
    if (pool) await pool.end();
  }
}
