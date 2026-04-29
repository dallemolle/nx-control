import { prisma } from '@/database/prisma';
import { AuditLog, User } from '@prisma/client';

type AuditAction = 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'LOGOUT' | 'ACCESS';

interface AuditLogData {
  action: AuditAction;
  entity: string;
  entityId: string;
  oldValue?: Record<string, unknown>;
  newValue?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  userId?: string;
}

export class AuditService {
  async create(data: AuditLogData) {
    return prisma.auditLog.create({
      data: {
        action: data.action,
        entity: data.entity,
        entityId: data.entityId,
        oldValue: data.oldValue as AuditLog['oldValue'],
        newValue: data.newValue as AuditLog['newValue'],
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
        userId: data.userId,
      },
    });
  }

  async findByEntity(entity: string, entityId: string, limit = 50) {
    return prisma.auditLog.findMany({
      where: { entity, entityId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  async findByUser(userId: string, limit = 100) {
    return prisma.auditLog.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  async findByTenant(tenantId: string, limit = 100) {
    const users = await prisma.user.findMany({
      where: { tenantId },
      select: { id: true },
    });

    return prisma.auditLog.findMany({
      where: { userId: { in: users.map(u => u.id) } },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  async findRecent(tenantId: string, limit = 50) {
    const users = await prisma.user.findMany({
      where: { tenantId },
      select: { id: true },
    });

    return prisma.auditLog.findMany({
      where: { userId: { in: users.map(u => u.id) } },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }
}

export const auditService = new AuditService();

export async function logAudit(data: AuditLogData) {
  return auditService.create(data);
}