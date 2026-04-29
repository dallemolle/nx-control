import { NextRequest, NextResponse } from 'next/server';
import { withAuth, withTenant } from '@/middleware/auth';
import { userService } from '@/services/user/UserService';

export const GET = withTenant(async (req: NextRequest) => {
  try {
    const tenantId = (req as { tenantId?: string }).tenantId!;
    const users = await userService.findAll(tenantId);
    return NextResponse.json(users);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao listar usuários';
    return NextResponse.json({ error: message }, { status: 500 });
  }
});

export const POST = withAuth(async (req: NextRequest) => {
  try {
    const user = (req as { user?: { userId: string; role: string } }).user!;
    
    if (user.role !== 'ADMIN' && user.role !== 'ROOT') {
      return NextResponse.json({ error: 'Apenas administradores podem criar usuários' }, { status: 403 });
    }

    const tenantId = (req as { tenantId?: string }).tenantId!;
    const body = await req.json();

    const newUser = await userService.create({
      ...body,
      tenantId,
    });

    return NextResponse.json(newUser, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao criar usuário';
    return NextResponse.json({ error: message }, { status: 400 });
  }
});