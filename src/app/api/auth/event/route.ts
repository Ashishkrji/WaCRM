import { NextResponse } from 'next/server';
import { dbService } from '@/services/db';
import { headers } from 'next/headers';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { event, email, userId, status, error, fullName } = body;

    if (!event || !email) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    const headerList = await headers();
    
    const ipAddress = headerList.get('x-forwarded-for') || '127.0.0.1';
    const userAgent = headerList.get('user-agent') || 'unknown';

    // 1. Log the audit event via dbService
    await dbService.ai.logAuthEvent({
      userId: userId || null,
      email,
      eventType: event, // 'login' | 'signup'
      status, // 'success' | 'failed'
      ipAddress,
      userAgent,
      errorMessage: error || null,
    });

    // 2. If it is a successful login or signup and userId is present, upsert user account info via dbService
    if (status === 'success' && userId) {
      await dbService.ai.upsertUser(userId, {
        email,
        fullName: fullName || null,
      });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err: any) {
    console.error('[API/auth/event] Error logging auth event:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
