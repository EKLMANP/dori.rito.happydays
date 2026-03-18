import { NextResponse } from 'next/server';

export async function POST(request) {
    try {
        const { pin } = await request.json();
        const expectedPin = process.env.ADMIN_PIN;

        if (!expectedPin) {
            return NextResponse.json(
                { error: 'ADMIN_PIN not configured' },
                { status: 500 }
            );
        }

        const valid = pin === expectedPin;
        return NextResponse.json({ valid });
    } catch {
        return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }
}
