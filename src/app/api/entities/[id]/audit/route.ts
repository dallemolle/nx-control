import { NextRequest, NextResponse } from 'next/server';
import { entityService } from '@/services/entity/EntityService';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { searchParams } = new URL(request.url);
  const tenantId = searchParams.get('tenantId');

  if (!tenantId) {
    return NextResponse.json({ error: 'tenantId required' }, { status: 400 });
  }

  try {
    const auditLog = await entityService.getAuditLog(params.id, tenantId);
    return NextResponse.json({ auditLog });
  } catch (error) {
    console.error('Failed to fetch audit log:', error);
    return NextResponse.json({ error: 'Failed to fetch audit log' }, { status: 500 });
  }
}