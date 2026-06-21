import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { headers } from 'next/headers';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { event, email, userId, status, error, fullName } = body;

    if (!event || !email) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    const { db } = await connectToDatabase();
    const headerList = await headers();
    
    const ipAddress = headerList.get('x-forwarded-for') || '127.0.0.1';
    const userAgent = headerList.get('user-agent') || 'unknown';

    // 1. Log the audit event in auth_events
    await db.collection('auth_events').insertOne({
      user_id: userId || null,
      email,
      event_type: event, // 'login' | 'signup'
      status, // 'success' | 'failed'
      ip_address: ipAddress,
      user_agent: userAgent,
      error_message: error || null,
      created_at: new Date(),
    });

    // 2. If it is a successful login or signup and userId is present, upsert user account info
    if (status === 'success' && userId) {
      const userDoc: any = {
        id: userId,
        email: email,
        updated_at: new Date(),
      };
      if (fullName) {
        userDoc.full_name = fullName;
      }
      await db.collection('users').updateOne(
        { id: userId },
        {
          $set: userDoc,
          $setOnInsert: {
            created_at: new Date(),
          }
        },
        { upsert: true }
      );
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err: any) {
    console.error('[API/auth/event] Error logging auth event:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
