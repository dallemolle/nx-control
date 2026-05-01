import { NextRequest, NextResponse } from 'next/server';
import { withTenant } from '@/middleware/auth';
import { entityService } from '@/services/entity/EntityService';

export const GET = withTenant(async (req: NextRequest) => {
  try {
    const tenantId = (req as { tenantId?: string }).tenantId!;
    const stats = await entityService.getStats(tenantId);
    return NextResponse.json(stats);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao buscar estatísticas';
    return NextResponse.json({ error: message }, { status: 500 });
  }
});