import { NextRequest, NextResponse } from 'next/server';
import { withTenant } from '@/middleware/auth';
import { clientService } from '@/services/client/ClientService';

export const GET = withTenant(async (req: NextRequest) => {
  try {
    const tenantId = (req as { tenantId?: string }).tenantId!;
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || undefined;

    const result = await clientService.findAll(tenantId, page, limit, search);
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao listar clientes';
    return NextResponse.json({ error: message }, { status: 500 });
  }
});

export const POST = withTenant(async (req: NextRequest) => {
  try {
    const user = (req as { user?: { userId: string } }).user;
    const tenantId = (req as { tenantId?: string }).tenantId!;
    const body = await req.json();

    const client = await clientService.create(tenantId, body, user?.userId);
    return NextResponse.json(client, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao criar cliente';
    return NextResponse.json({ error: message }, { status: 400 });
  }
});