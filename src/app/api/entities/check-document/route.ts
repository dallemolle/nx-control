import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/database/prisma';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const document = searchParams.get('document');
  const tenantId = searchParams.get('tenantId');
  const excludeId = searchParams.get('excludeId');

  if (!document || !tenantId) {
    return NextResponse.json({ error: 'Parâmetros inválidos' }, { status: 400 });
  }

  const existing = await prisma.entity.findFirst({
    where: {
      documentNumber: document,
      tenantId,
      ...(excludeId ? { id: { not: excludeId } } : {}),
      deletedAt: null,
    },
    select: { id: true, fullName: true, status: true },
  });

  return NextResponse.json({
    exists: !!existing,
    entity: existing || null,
  });
}