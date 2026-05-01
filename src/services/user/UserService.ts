import { prisma } from '@/database/prisma';
import { updateUserSchema } from '@/lib/validations';
import { logAudit } from '@/services/audit/AuditService';
import bcrypt from 'bcryptjs';
import type { UpdateUserInput } from '@/lib/validations';

export class UserService {
  async findAll(tenantId: string) {
    return prisma.user.findMany({
      where: {
        tenantId,
        deletedAt: null,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async findById(id: string, tenantId: string) {
    return prisma.user.findFirst({
      where: {
        id,
        tenantId,
        deletedAt: null,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async create(data: {
    email: string;
    password: string;
    name: string;
    role: string;
    tenantId: string;
  }) {
    const hashedPassword = await bcrypt.hash(data.password, 10);

    const user = await prisma.user.create({
      data: {
        email: data.email,
        password: hashedPassword,
        name: data.name,
        role: data.role as 'ROOT' | 'ADMIN' | 'MANAGER' | 'USER' | 'ACCOUNTANT' | 'SELLER',
        tenantId: data.tenantId,
      },
    });

    await logAudit({
      action: 'CREATE',
      entity: 'User',
      entityId: user.id,
      newValue: { email: user.email, name: user.name, role: user.role },
      userId: user.id,
    });

    return user;
  }

  async update(id: string, tenantId: string, data: UpdateUserInput, userId?: string) {
    const validated = updateUserSchema.parse(data);

    const user = await prisma.user.findFirst({
      where: { id, tenantId, deletedAt: null },
    });

    if (!user) {
      throw new Error('Usuário não encontrado');
    }

    const oldValue = {
      email: user.email,
      name: user.name,
      role: user.role,
      isActive: user.isActive,
    };

    const updated = await prisma.user.update({
      where: { id },
      data: {
        email: validated.email,
        name: validated.name,
        role: validated.role,
        isActive: validated.isActive,
      },
    });

    await logAudit({
      action: 'UPDATE',
      entity: 'User',
      entityId: id,
      oldValue,
      newValue: {
        email: updated.email,
        name: updated.name,
        role: updated.role,
        isActive: updated.isActive,
      },
      userId,
    });

    return updated;
  }

  async deactivate(id: string, tenantId: string) {
    const user = await prisma.user.findFirst({
      where: { id, tenantId, deletedAt: null },
    });

    if (!user) {
      throw new Error('Usuário não encontrado');
    }

    const updated = await prisma.user.update({
      where: { id },
      data: { isActive: false },
    });

    await logAudit({
      action: 'DELETE',
      entity: 'User',
      entityId: id,
      oldValue: { isActive: true },
      newValue: { isActive: false },
    });

    return updated;
  }

  async changePassword(id: string, tenantId: string, newPassword: string) {
    const user = await prisma.user.findFirst({
      where: { id, tenantId, deletedAt: null },
    });

    if (!user) {
      throw new Error('Usuário não encontrado');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id },
      data: { password: hashedPassword },
    });

    await logAudit({
      action: 'UPDATE',
      entity: 'User',
      entityId: id,
      oldValue: { password: '***' },
      newValue: { password: '***' },
    });

    return { success: true };
  }
}

export const userService = new UserService();