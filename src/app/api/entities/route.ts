import { NextRequest, NextResponse } from 'next/server';
import { withTenant } from '@/middleware/auth';
import { entityService } from '@/services/entity/EntityService';

export const GET = withTenant(async (req: NextRequest) => {
  try {
    const tenantId = (req as { tenantId?: string }).tenantId!;
    const { searchParams } = new URL(req.url);
    
    const params = {
      type: searchParams.get('type') as 'customer' | 'supplier' | 'carrier' | 'all' || 'all',
      search: searchParams.get('search') || undefined,
      status: searchParams.get('status') as 'ACTIVE' | 'INACTIVE' | 'all' || 'all',
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '20'),
    };

    const result = await entityService.findAll(tenantId, params);
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao listar entidades';
    return NextResponse.json({ error: message }, { status: 500 });
  }
});

export const POST = withTenant(async (req: NextRequest) => {
  try {
    const user = (req as { user?: { userId: string } }).user;
    const tenantId = (req as { tenantId?: string }).tenantId!;
    const body = await req.json();

    const entity = await entityService.create(tenantId, body, user?.userId);
    return NextResponse.json(entity, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao criar entidade';
    return NextResponse.json({ error: message }, { status: 400 });
  }
});