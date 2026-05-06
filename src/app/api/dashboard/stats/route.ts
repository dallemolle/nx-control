import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/database/prisma';
import { withAuth } from '@/middleware/auth';

export const GET = withAuth(async (req: NextRequest) => {
  try {
    const user = (req as { user?: { role: string; tenantId: string | null } }).user!;

    const whereClause = user.role === 'ROOT' 
      ? {} 
      : { tenantId: user.tenantId || '' };

    const whereClauseWithOrder = user.role === 'ROOT'
      ? {}
      : { order: { tenantId: user.tenantId || '' } };

    const [totalClients, totalProducts, totalOrders, totalRevenue, pendingPayments, lowStockProducts] = await Promise.all([
      prisma.client.count({ where: { ...whereClause, deletedAt: null } }),
      prisma.product.count({ where: { ...whereClause, deletedAt: null } }),
      prisma.order.count({ where: { ...whereClause } }),
      prisma.order.aggregate({
        where: { ...whereClause, status: { not: 'CANCELLED' } },
        _sum: { total: true },
      }),
      prisma.payment.count({
        where: {
          ...whereClauseWithOrder,
          status: 'PENDING',
        },
      }),
      prisma.product.count({
        where: {
          ...whereClause,
          deletedAt: null,
          stock: {
            some: {
              quantity: { lt: 10 },
            },
          },
        },
      }),
    ]);

    return NextResponse.json({
      totalClients,
      totalProducts,
      totalOrders,
      totalRevenue: totalRevenue._sum.total || 0,
      pendingPayments,
      lowStockProducts,
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    return NextResponse.json({ error: 'Erro ao carregar estatísticas' }, { status: 500 });
  }
});