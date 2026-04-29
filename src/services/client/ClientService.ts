import { prisma } from '@/database/prisma';
import { createClientSchema } from '@/lib/validations';
import { logAudit } from './audit/AuditService';
import type { CreateClientInput } from '@/lib/validations';

export class ClientService {
  async findAll(tenantId: string, page = 1, limit = 20, search?: string) {
    const skip = (page - 1) * limit;

    const where = {
      tenantId,
      deletedAt: null,
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' as const } },
          { document: { contains: search } },
          { email: { contains: search, mode: 'insensitive' as const } },
        ],
      }),
    };

    const [clients, total] = await Promise.all([
      prisma.client.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.client.count({ where }),
    ]);

    return { clients, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findById(id: string, tenantId: string) {
    return prisma.client.findFirst({
      where: { id, tenantId, deletedAt: null },
      include: {
        orders: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            orderNumber: true,
            total: true,
            status: true,
            createdAt: true,
          },
        },
      },
    });
  }

  async create(tenantId: string, data: CreateClientInput, userId?: string) {
    const validated = createClientSchema.parse(data);

    const client = await prisma.client.create({
      data: {
        ...validated,
        tenantId,
      },
    });

    await logAudit({
      action: 'CREATE',
      entity: 'Client',
      entityId: client.id,
      newValue: { name: client.name, document: client.document },
      userId,
    });

    return client;
  }

  async update(id: string, tenantId: string, data: Partial<CreateClientInput>, userId?: string) {
    const client = await prisma.client.findFirst({
      where: { id, tenantId, deletedAt: null },
    });

    if (!client) {
      throw new Error('Cliente não encontrado');
    }

    const updated = await prisma.client.update({
      where: { id },
      data,
    });

    await logAudit({
      action: 'UPDATE',
      entity: 'Client',
      entityId: id,
      oldValue: { name: client.name },
      newValue: { name: updated.name },
      userId,
    });

    return updated;
  }

  async deactivate(id: string, tenantId: string) {
    return prisma.client.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}

export const clientService = new ClientService();