import mysql from 'mysql2/promise'

let pool: mysql.Pool | null = null

export function getMySQLPool() {
  if (!pool) {
    pool = mysql.createPool({
      host: process.env.MYSQL_HOST || '127.0.0.1',
      port: parseInt(process.env.MYSQL_PORT || '3307'),
      user: process.env.MYSQL_USER || 'gtf_user',
      password: process.env.MYSQL_PASSWORD || '',
      database: process.env.MYSQL_DATABASE || 'gtf_db',
      waitForConnections: true,
      connectionLimit: 5,
      queueLimit: 0,
      connectTimeout: 10000,
    })
  }
  return pool
}

export async function testMySQLConnection(): Promise<{ success: boolean; error?: string; info?: string }> {
  try {
    const pool = getMySQLPool()
    const connection = await pool.getConnection()
    const [rows] = await connection.query('SELECT DATABASE() as db, VERSION() as version')
    connection.release()
    const result = rows as Array<{ db: string; version: string }>
    return {
      success: true,
      info: `Connected to ${result[0].db} (MySQL ${result[0].version})`
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

export async function queryMySQL<T>(sql: string, params?: unknown[]): Promise<T[]> {
  const pool = getMySQLPool()
  const [rows] = await pool.query(sql, params)
  return rows as T[]
}

export async function countMySQL(table: string): Promise<number> {
  const rows = await queryMySQL<{ count: number }>(`SELECT COUNT(*) as count FROM ${table}`)
  return rows[0].count
}
