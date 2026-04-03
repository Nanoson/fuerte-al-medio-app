import pg from 'pg';
import bcryptjs from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { randomUUID } from 'crypto';

const { Pool } = pg;
const JWT_SECRET = process.env.JWT_SECRET || 'fuerte-al-medio-dev-secret-key-2026';

export function getPool() {
  return new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    max: 1,
    idleTimeoutMillis: 10000,
    connectionTimeoutMillis: 8000,
  });
}

export async function ensureTables(pool) {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      username TEXT,
      password_hash TEXT,
      role TEXT DEFAULT 'user',
      profile_public JSONB DEFAULT '{}',
      reputation_score INTEGER DEFAULT 0,
      prediction_accuracy DECIMAL DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS fam_credits (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      balance INTEGER DEFAULT 5,
      earned_from TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS reactions (
      id TEXT PRIMARY KEY,
      article_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      reaction_type TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(article_id, user_id)
    )
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS shares (
      id TEXT PRIMARY KEY,
      article_id TEXT NOT NULL,
      user_id TEXT,
      platform TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
}

export function generateId() {
  return randomUUID();
}

export function signToken(userId, email) {
  return jwt.sign({ id: userId, email }, JWT_SECRET, { expiresIn: '30d' });
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}

export const bcrypt = bcryptjs;
