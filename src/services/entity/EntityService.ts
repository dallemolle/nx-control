import { prisma } from '@/database/prisma';
import { createEntitySchema, updateEntitySchema, entityQuerySchema } from '@/lib/validations';
import { logAudit } from '@/services/audit/AuditService';
import type { CreateEntityInput, EntityQueryInput } from '@/lib/validations';

const SENSITIVE_FIELDS = ['documentNumber', 'stateRegistration', 'municipalRegistration'];

export class EntityService {
  async findAll(tenantId: string, params: EntityQueryInput) {
    const validated = entityQuerySchema.parse(params);
    const { type, search, status, page, limit } = validated;

    const skip = (page - 1) * limit;

    const where: any = {
      tenantId,
      deletedAt: status === 'all' ? undefined : status === 'ACTIVE' ? null : { not: null },
    };

    if (type === 'customer') where.isCustomer = true;
    else if (type === 'supplier') where.isSupplier = true;
    else if (type === 'carrier') where.isCarrier = true;

    if (search) {
      where.OR = [
        { fullName: { contains: search, mode: 'insensitive' } },
        { tradeName: { contains: search, mode: 'insensitive' } },
        { documentNumber: { contains: search } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [entities, total] = await Promise.all([
      prisma.entity.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.entity.count({ where }),
    ]);

    return { entities, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findById(id: string, tenantId: string) {
    return prisma.entity.findFirst({
      where: { id, tenantId, deletedAt: null },
    });
  }

  async create(tenantId: string, data: CreateEntityInput, userId?: string) {
    const validated = createEntitySchema.parse(data);

    const existing = await prisma.entity.findFirst({
      where: { documentNumber: validated.documentNumber, tenantId },
    });

    if (existing) {
      throw new Error('Ops! Parece que este CPF/CNPJ já foi adicionado anteriormente.');
    }

    const entity = await prisma.entity.create({
      data: {
        ...validated,
        tenantId,
      },
    });

    await logAudit({
      action: 'CREATE',
      entity: 'Entity',
      entityId: entity.id,
      newValue: { fullName: entity.fullName, documentNumber: entity.documentNumber },
      userId,
    });

    await this.logEntityAudit(entity.id, tenantId, 'documentNumber', null, validated.documentNumber, userId || 'system', 'CREATE');

    return entity;
  }

  async update(id: string, tenantId: string, data: Partial<CreateEntityInput>, userId?: string) {
    const entity = await prisma.entity.findFirst({
      where: { id, tenantId, deletedAt: null },
    });

    if (!entity) {
      throw new Error('Entidade não encontrada');
    }

    const validated = updateEntitySchema.parse(data);

    const updates: any = { ...validated };

    if (validated.documentNumber && validated.documentNumber !== entity.documentNumber) {
      const existing = await prisma.entity.findFirst({
        where: { documentNumber: validated.documentNumber, tenantId, id: { not: id } },
      });

      if (existing) {
        throw new Error('CPF/CNPJ já cadastrado para outro registro');
      }
    }

    for (const field of SENSITIVE_FIELDS) {
      const oldValue = entity[field as keyof typeof entity];
      const newValue = validated[field as keyof typeof validated];

      if (newValue && oldValue !== newValue) {
        await this.logEntityAudit(id, tenantId, field, oldValue as string, newValue as string, userId || 'system', 'UPDATE');
      }
    }

    const updated = await prisma.entity.update({
      where: { id },
      data: updates,
    });

    await logAudit({
      action: 'UPDATE',
      entity: 'Entity',
      entityId: id,
      oldValue: { fullName: entity.fullName },
      newValue: { fullName: updated.fullName },
      userId,
    });

    return updated;
  }

  async deactivate(id: string, tenantId: string, userId?: string) {
    const entity = await prisma.entity.findFirst({
      where: { id, tenantId, deletedAt: null },
    });

    if (!entity) {
      throw new Error('Entidade não encontrada');
    }

    await prisma.entity.update({
      where: { id },
      data: { deletedAt: new Date(), status: 'INACTIVE' },
    });

    await logAudit({
      action: 'DELETE',
      entity: 'Entity',
      entityId: id,
      oldValue: { fullName: entity.fullName },
      userId,
    });

    await this.logEntityAudit(id, tenantId, 'status', 'ACTIVE', 'INACTIVE', userId || 'system', 'DELETE');

    return { success: true };
  }

  async activate(id: string, tenantId: string, userId?: string) {
    const entity = await prisma.entity.findFirst({
      where: { id, tenantId, deletedAt: { not: null } },
    });

    if (!entity) {
      throw new Error('Entidade não encontrada ou já ativa');
    }

    await prisma.entity.update({
      where: { id },
      data: { deletedAt: null, status: 'ACTIVE' },
    });

    await this.logEntityAudit(id, tenantId, 'status', 'INACTIVE', 'ACTIVE', userId || 'system', 'UPDATE');

    return { success: true };
  }

  private async logEntityAudit(
    entityId: string,
    tenantId: string,
    field: string,
    oldValue: string | null,
    newValue: string | null,
    changedBy: string,
    changeType: 'CREATE' | 'UPDATE' | 'DELETE'
  ) {
    await prisma.entityAudit.create({
      data: {
        entityId,
        tenantId,
        field,
        oldValue,
        newValue,
        changedBy,
        changeType,
      },
    });
  }

  async getAuditLog(entityId: string, tenantId: string) {
    return prisma.entityAudit.findMany({
      where: { entityId, tenantId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async getStats(tenantId: string) {
    const [customerOnly, supplierOnly, carrierOnly, both, activeCustomers, activeSuppliers, incompleteTax] = await Promise.all([
      prisma.entity.count({
        where: { tenantId, isCustomer: true, isSupplier: false, deletedAt: null },
      }),
      prisma.entity.count({
        where: { tenantId, isCustomer: false, isSupplier: true, deletedAt: null },
      }),
      prisma.entity.count({
        where: { tenantId, isCustomer: false, isSupplier: false, isCarrier: true, deletedAt: null },
      }),
      prisma.entity.count({
        where: { tenantId, isCustomer: true, isSupplier: true, deletedAt: null },
      }),
      prisma.entity.count({
        where: { tenantId, isCustomer: true, status: 'ACTIVE', deletedAt: null },
      }),
      prisma.entity.count({
        where: { tenantId, isSupplier: true, status: 'ACTIVE', deletedAt: null },
      }),
      prisma.entity.count({
        where: {
          tenantId,
          OR: [
            { taxRegimeCode: undefined },
            { taxRegimeCode: 1 },
          ],
          deletedAt: null,
          isCustomer: true,
        },
      }),
    ]);

    const totalEntities = customerOnly + supplierOnly + carrierOnly + both;
    const incompletePercentage = totalEntities > 0 ? ((incompleteTax / totalEntities) * 100).toFixed(1) : '0';

    return {
      customerOnly,
      supplierOnly,
      carrierOnly,
      both,
      activeCustomers,
      activeSuppliers,
      total: totalEntities,
      incompleteTaxPercentage: incompletePercentage,
    };
  }
}

export const entityService = new EntityService();