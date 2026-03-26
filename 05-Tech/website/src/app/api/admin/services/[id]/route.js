import { NextResponse } from 'next/server';
import { getService, updateService, archiveService } from '@/lib/notion';
import { writeLog, computeChanges } from '@/lib/admin-log';

/** GET /api/admin/services/[id] */
export async function GET(request, { params }) {
    try {
        const { id } = await params;
        const service = await getService(id);
        return NextResponse.json(service);
    } catch (err) {
        console.error('Get service error:', err);
        if (err.code === 'object_not_found') {
            return NextResponse.json({ error: '找不到服務' }, { status: 404 });
        }
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

/** PATCH /api/admin/services/[id] { ...updates, notes } */
export async function PATCH(request, { params }) {
    try {
        const { id } = await params;
        const { notes, ...updates } = await request.json();
        const before = await getService(id);
        const service = await updateService(id, updates);
        const changes = computeChanges(before, service, Object.keys(updates));
        await writeLog({
            action: 'update',
            entityType: 'service',
            entityId: id,
            entityName: service.name,
            changes,
            notes,
        });
        return NextResponse.json(service);
    } catch (err) {
        console.error('Update service error:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

/** DELETE /api/admin/services/[id] */
export async function DELETE(req, { params }) {
    try {
        const { id } = await params;
        const body = await req.json().catch(() => ({}));
        const service = await getService(id);
        await archiveService(id);
        await writeLog({
            action: 'archive',
            entityType: 'service',
            entityId: id,
            entityName: service.name,
            notes: body.notes,
        });
        return Response.json({ success: true });
    } catch (err) {
        return Response.json({ error: err.message }, { status: 500 });
    }
}
