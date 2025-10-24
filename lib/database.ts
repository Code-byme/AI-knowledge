import { Pool } from 'pg';

// PostgreSQL Database Configuration
// Direct database connection without ORM
const dbConfig = {
  host: process.env.POSTGRES_HOST || 'localhost',
  port: parseInt(process.env.POSTGRES_PORT || '5432'),
  database: process.env.POSTGRES_DB || 'ai_knowledge_db',
  user: process.env.POSTGRES_USER || 'postgres',
  password: process.env.POSTGRES_PASSWORD || 'postgres',
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
};

// Create a connection pool
const pool = new Pool(dbConfig);

// Handle pool errors
pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

// Execute a query
export const query = async (text: string, params?: any[]) => {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('Executed query', { text, duration, rows: res.rowCount });
    return res;
  } catch (err) {
    console.error('Query error:', err);
    throw err;
  }
};

// Get a client from the pool
export const getClient = async () => {
  return await pool.connect();
};

// Close the pool
export const closePool = async () => {
  await pool.end();
};

// Test the connection
export const testConnection = async () => {
  try {
    const client = await pool.connect();
    console.log('✅ PostgreSQL connection successful');
    client.release();
    return true;
  } catch (err) {
    console.error('❌ PostgreSQL connection failed:', err);
    return false;
  }
};

export default pool;
