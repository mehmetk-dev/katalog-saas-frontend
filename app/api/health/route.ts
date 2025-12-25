// app/api/health/route.ts
import { NextResponse } from 'next/server';

export async function GET() {
    return NextResponse.json(
        {
            status: 'ok',
            uptime: process.uptime(),
            timestamp: new Date().toISOString(),
            service: 'frontend'
        },
        { status: 200 }
    );
}
