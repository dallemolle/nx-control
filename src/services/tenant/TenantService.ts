import { prisma } from '@/database/prisma';
import { createTenantSchema } from '@/lib/validations';
import type { CreateTenantInput } from '@/lib/validations';
import bcrypt from 'bcryptjs';

export class TenantService {
  async create(data: CreateTenantInput, rootUserEmail: string, rootUserPassword: string) {
    const validated = createTenantSchema.parse(data);

    const existingTenant = await prisma.tenant.findUnique({
      where: { slug: validated.slug },
    });

    if (existingTenant) {
      throw new Error('Tenant já existe com este slug');
    }

    const tenant = await prisma.tenant.create({
      data: {
        name: validated.name,
        slug: validated.slug,
        domain: validated.domain || null,
      },
    });

    const hashedPassword = await bcrypt.hash(rootUserPassword, 10);

    await prisma.user.create({
      data: {
        email: rootUserEmail,
        password: hashedPassword,
        name: 'Administrador',
        role: 'ADMIN',
        tenantId: tenant.id,
      },
    });

    await this.createDefaultUnits(tenant.id);
    await this.createDefaultChartOfAccounts(tenant.id);

    return tenant;
  }

  async findAll() {
    return prisma.tenant.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        slug: true,
        domain: true,
        createdAt: true,
        _count: {
          select: {
            users: true,
            clients: true,
            products: true,
          },
        },
      },
    });
  }

  async findById(id: string) {
    return prisma.tenant.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            users: true,
            clients: true,
            products: true,
            orders: true,
          },
        },
      },
    });
  }

  async findBySlug(slug: string) {
    return prisma.tenant.findUnique({
      where: { slug },
    });
  }

  async update(id: string, data: Partial<CreateTenantInput>) {
    return prisma.tenant.update({
      where: { id },
      data: {
        name: data.name,
        domain: data.domain,
      },
    });
  }

  async deactivate(id: string) {
    return prisma.tenant.update({
      where: { id },
      data: { isActive: false },
    });
  }

  private async createDefaultUnits(tenantId: string) {
    const units = [
      { code: 'UN', name: 'Unidade', abbreviation: 'UN' },
      { code: 'KG', name: 'Quilograma', abbreviation: 'KG' },
      { code: 'G', name: 'Grama', abbreviation: 'G' },
      { code: 'L', name: 'Litro', abbreviation: 'L' },
      { code: 'ML', name: 'Mililitro', abbreviation: 'ML' },
      { code: 'M', name: 'Metro', abbreviation: 'M' },
      { code: 'CM', name: 'Centímetro', abbreviation: 'CM' },
      { code: 'PC', name: 'Peça', abbreviation: 'PC' },
      { code: 'CX', name: 'Caixa', abbreviation: 'CX' },
      { code: 'PCT', name: 'Pacote', abbreviation: 'PCT' },
    ];

    await prisma.unit.createMany({
      data: units.map(unit => ({ ...unit, tenantId })),
    });
  }

  private async createDefaultChartOfAccounts(tenantId: string) {
    const accounts: Array<{ code: string; name: string; type: 'ASSET' | 'LIABILITY' | 'EQUITY' | 'REVENUE' | 'EXPENSE' }> = [
      { code: '1', name: 'Ativo', type: 'ASSET' },
      { code: '1.1', name: 'Ativo Circulante', type: 'ASSET' },
      { code: '1.1.01', name: 'Caixa', type: 'ASSET' },
      { code: '1.1.02', name: 'Bancos', type: 'ASSET' },
      { code: '1.1.03', name: 'Clientes', type: 'ASSET' },
      { code: '1.1.04', name: 'Estoque', type: 'ASSET' },
      { code: '1.2', name: 'Ativo Não Circulante', type: 'ASSET' },
      { code: '2', name: 'Passivo', type: 'LIABILITY' },
      { code: '2.1', name: 'Passivo Circulante', type: 'LIABILITY' },
      { code: '2.1.01', name: 'Fornecedores', type: 'LIABILITY' },
      { code: '2.1.02', name: 'Obrigações Fiscais', type: 'LIABILITY' },
      { code: '2.1.03', name: 'Obrigações Trabalhistas', type: 'LIABILITY' },
      { code: '2.2', name: 'Passivo Não Circulante', type: 'LIABILITY' },
      { code: '3', name: 'Patrimônio Líquido', type: 'EQUITY' },
      { code: '3.1', name: 'Capital Social', type: 'EQUITY' },
      { code: '3.2', name: 'Reservas', type: 'EQUITY' },
      { code: '4', name: 'Receitas', type: 'REVENUE' },
      { code: '4.1', name: 'Receita de Vendas', type: 'REVENUE' },
      { code: '4.2', name: 'Receita de Serviços', type: 'REVENUE' },
      { code: '5', name: 'Despesas', type: 'EXPENSE' },
      { code: '5.1', name: 'Despesas Operacionais', type: 'EXPENSE' },
      { code: '5.2', name: 'Despesas Administrativas', type: 'EXPENSE' },
      { code: '5.3', name: 'Despesas Financeiras', type: 'EXPENSE' },
    ];

    await prisma.account.createMany({
      data: accounts.map(account => ({ ...account, tenantId })),
    });
  }
}

export const tenantService = new TenantService();