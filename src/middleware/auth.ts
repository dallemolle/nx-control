import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { prisma } from '@/database/prisma';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

export interface AuthUser {
  userId: string;
  email: string;
  role: string;
  tenantId: string | null;
}

export interface TenantRequest extends NextRequest {
  user?: AuthUser;
  tenantId?: string;
}

export function withAuth(handler: (req: TenantRequest) => Promise<NextResponse>) {
  return async (req: TenantRequest) => {
    const token = req.headers.get('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json({ error: 'Token não fornecido' }, { status: 401 });
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET) as AuthUser;

      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
      });

      if (!user || !user.isActive || user.deletedAt) {
        return NextResponse.json({ error: 'Usuário inativo ou não encontrado' }, { status: 401 });
      }

      req.user = {
        userId: decoded.userId,
        email: decoded.email,
        role: decoded.role,
        tenantId: decoded.tenantId,
      };

      if (decoded.tenantId) {
        req.headers.set('x-tenant-id', decoded.tenantId);
        req.tenantId = decoded.tenantId;
      }

      return handler(req);
    } catch {
      return NextResponse.json({ error: 'Token inválido ou expirado' }, { status: 401 });
    }
  };
}

export function requireRole(...roles: string[]) {
  return (handler: (req: TenantRequest) => Promise<NextResponse>) => {
    return async (req: TenantRequest) => {
      if (!req.user) {
        return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
      }

      if (!roles.includes(req.user.role)) {
        return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
      }

      return handler(req);
    };
  };
}

export function withTenant(handler: (req: TenantRequest) => Promise<NextResponse>) {
  return withAuth(async (req: TenantRequest) => {
    if (!req.tenantId) {
      return NextResponse.json({ error: 'Tenant não especificado' }, { status: 400 });
    }

    const tenant = await prisma.tenant.findUnique({
      where: { id: req.tenantId },
    });

    if (!tenant || !tenant.isActive) {
      return NextResponse.json({ error: 'Tenant inativo ou não encontrado' }, { status: 400 });
    }

    return handler(req);
  });
}