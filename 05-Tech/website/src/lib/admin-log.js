/**
 * Admin operation logging — records all CRM actions to Neon PostgreSQL.
 * Tracks create/update/delete/archive with before/after diffs and notes.
 */

import { getDb } from './db';

/** Initialize admin_logs table (called once on first use) */
let tableInitialized = false;
async function ensureTable() {
    if (tableInitialized) return;
    const sql = getDb();
    await sql`
        CREATE TABLE IF NOT EXISTS admin_logs (
            id SERIAL PRIMARY KEY,
            action VARCHAR(20) NOT NULL,
            entity_type VARCHAR(20) NOT NULL,
            entity_id VARCHAR(100) NOT NULL,
            entity_name VARCHAR(200),
            changes JSONB,
            notes TEXT,
            operator VARCHAR(100) DEFAULT 'admin',
            created_at TIMESTAMPTZ DEFAULT NOW()
        )
    `;
    tableInitialized = true;
}

/**
 * Write a log entry.
 */
export async function writeLog({ action, entityType, entityId, entityName, changes, notes, operator = 'admin' }) {
    try {
        await ensureTable();
        const sql = getDb();
        const changesJson = changes ? JSON.stringify(changes) : null;
        await sql`
            INSERT INTO admin_logs (action, entity_type, entity_id, entity_name, changes, notes, operator)
            VALUES (${action}, ${entityType}, ${entityId}, ${entityName || ''}, ${changesJson}::jsonb, ${notes || null}, ${operator})
        `;
    } catch (err) {
        console.error('Failed to write admin log:', err);
    }
}

/**
 * Query log entries with optional filters.
 * Uses tagged template literals (required by @neondatabase/serverless).
 */
export async function queryLogs({ action, entityType, entityId, startDate, endDate, limit = 50, offset = 0 } = {}) {
    await ensureTable();
    const sql = getDb();

    // Build query using tagged templates with conditional fragments
    // neon's sql tagged template doesn't support dynamic WHERE, so we query all and filter
    // For small log tables this is fine; for scale, switch to a query builder

    let rows;
    let countResult;

    // Use the broadest applicable query pattern
    if (action && entityType && startDate && endDate) {
        rows = await sql`
            SELECT * FROM admin_logs
            WHERE action = ${action} AND entity_type = ${entityType}
            AND created_at >= ${startDate} AND created_at <= ${endDate + 'T23:59:59Z'}
            ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}
        `;
        countResult = await sql`
            SELECT COUNT(*)::int as total FROM admin_logs
            WHERE action = ${action} AND entity_type = ${entityType}
            AND created_at >= ${startDate} AND created_at <= ${endDate + 'T23:59:59Z'}
        `;
    } else if (action && entityType) {
        rows = await sql`
            SELECT * FROM admin_logs
            WHERE action = ${action} AND entity_type = ${entityType}
            ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}
        `;
        countResult = await sql`
            SELECT COUNT(*)::int as total FROM admin_logs
            WHERE action = ${action} AND entity_type = ${entityType}
        `;
    } else if (action) {
        rows = await sql`
            SELECT * FROM admin_logs
            WHERE action = ${action}
            ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}
        `;
        countResult = await sql`
            SELECT COUNT(*)::int as total FROM admin_logs WHERE action = ${action}
        `;
    } else if (entityType) {
        rows = await sql`
            SELECT * FROM admin_logs
            WHERE entity_type = ${entityType}
            ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}
        `;
        countResult = await sql`
            SELECT COUNT(*)::int as total FROM admin_logs WHERE entity_type = ${entityType}
        `;
    } else if (startDate && endDate) {
        rows = await sql`
            SELECT * FROM admin_logs
            WHERE created_at >= ${startDate} AND created_at <= ${endDate + 'T23:59:59Z'}
            ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}
        `;
        countResult = await sql`
            SELECT COUNT(*)::int as total FROM admin_logs
            WHERE created_at >= ${startDate} AND created_at <= ${endDate + 'T23:59:59Z'}
        `;
    } else {
        rows = await sql`
            SELECT * FROM admin_logs
            ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}
        `;
        countResult = await sql`SELECT COUNT(*)::int as total FROM admin_logs`;
    }

    return {
        logs: rows,
        total: countResult[0]?.total || 0,
    };
}

/**
 * Compute a diff between old and new objects for change logging.
 */
export function computeChanges(oldObj, newObj, fields) {
    const changes = {};
    for (const field of fields) {
        const oldVal = oldObj?.[field] ?? null;
        const newVal = newObj?.[field] ?? null;
        if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
            changes[field] = { old: oldVal, new: newVal };
        }
    }
    return Object.keys(changes).length > 0 ? changes : null;
}
