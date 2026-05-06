import { NextRequest, NextResponse } from 'next/server';
import { withTenant } from '@/middleware/auth';
import { entityService } from '@/services/entity/EntityService';

function getIdFromUrl(url: string): string | null {
  const match = url.match(/\/api\/entities\/([^/]+)$/);
  return match ? match[1] : null;
}

export const GET = withTenant(async (req: NextRequest) => {
  try {
    const tenantId = (req as { tenantId?: string }).tenantId!;
    const id = getIdFromUrl(req.url);

    if (!id) {
      return NextResponse.json({ error: 'ID não especificado' }, { status: 400 });
    }

    const entity = await entityService.findById(id, tenantId);
    if (!entity) {
      return NextResponse.json({ error: 'Entidade não encontrada' }, { status: 404 });
    }

    const auditLog = await entityService.getAuditLog(id, tenantId);
    return NextResponse.json({ ...entity, auditLog });
  } catch (error) {
    console.error('Error:', error);
    const message = error instanceof Error ? error.message : 'Erro ao buscar entidade';
    return NextResponse.json({ error: message }, { status: 500 });
  }
});

export const PUT = withTenant(async (req: NextRequest) => {
  try {
    const user = (req as { user?: { userId: string } }).user;
    const tenantId = (req as { tenantId?: string }).tenantId!;
    const id = getIdFromUrl(req.url);

    if (!id) {
      return NextResponse.json({ error: 'ID não especificado' }, { status: 400 });
    }

    const body = await req.json();
    const entity = await entityService.update(id, tenantId, body, user?.userId);
    return NextResponse.json(entity);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao atualizar entidade';
    return NextResponse.json({ error: message }, { status: 400 });
  }
});

export const PATCH = withTenant(async (req: NextRequest) => {
  try {
    const user = (req as { user?: { userId: string } }).user;
    const tenantId = (req as { tenantId?: string }).tenantId!;
    const id = getIdFromUrl(req.url);

    if (!id) {
      return NextResponse.json({ error: 'ID não especificado' }, { status: 400 });
    }

    const body = await req.json();

    if (body.action === 'deactivate') {
      await entityService.deactivate(id, tenantId, user?.userId);
      return NextResponse.json({ message: 'Entidade desativada com sucesso' });
    }

    if (body.action === 'activate') {
      await entityService.activate(id, tenantId, user?.userId);
      return NextResponse.json({ message: 'Entidade ativada com sucesso' });
    }

    return NextResponse.json({ error: 'Ação inválida' }, { status: 400 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao processar ação';
    return NextResponse.json({ error: message }, { status: 400 });
  }
});