import pg from 'pg';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  max: 30,
  min: 5,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
  allowExitOnIdle: true,
  ssl: false,
});

const adapter = new PrismaPg(pool as any);
const prisma = new PrismaClient({ adapter });

async function verifyConnection() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    console.log('🐘 PostgreSQL Connection: Success (via Prisma)');
  } catch (err) {
    console.error('❌ PostgreSQL Connection: Failed!');
    if (err instanceof Error) console.error(err.message);
  }
}

verifyConnection();

export default prisma;