import { NextRequest, NextResponse } from 'next/server';
import { authService } from '@/services/auth/AuthService';
import { logAudit } from '@/services/audit/AuditService';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    const result = await authService.login({ email, password });

    await logAudit({
      action: 'LOGIN',
      entity: 'User',
      entityId: result.user.id,
      userId: result.user.id,
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
      userAgent: request.headers.get('user-agent') || undefined,
    });

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao fazer login';
    return NextResponse.json({ error: message }, { status: 401 });
  }
}