import { neon } from '@neondatabase/serverless';

// Create a SQL tagged template function from the connection string
// Usage: const rows = await sql`SELECT * FROM services WHERE is_active = true`;
export function getDb() {
    if (!process.env.DATABASE_URL) {
        throw new Error('DATABASE_URL environment variable is not set');
    }
    return neon(process.env.DATABASE_URL);
}

// Singleton for convenience in API routes
let _sql = null;
export function sql(...args) {
    if (!_sql) {
        _sql = getDb();
    }
    return _sql(...args);
}
