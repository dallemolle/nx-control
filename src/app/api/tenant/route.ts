import { NextRequest, NextResponse } from 'next/server';
import { tenantService } from '@/services/tenant/TenantService';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, slug, domain, email, password } = body;

    if (!name || !slug || !email || !password) {
      return NextResponse.json(
        { error: 'Nome, slug, email e senha são obrigatórios' },
        { status: 400 }
      );
    }

    const tenant = await tenantService.create({ name, slug, domain }, email, password);

    return NextResponse.json({
      message: 'Tenant criado com sucesso',
      tenant: {
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
      },
    }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao criar tenant';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function GET() {
  try {
    const tenants = await tenantService.findAll();
    return NextResponse.json(tenants);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao listar tenants';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}