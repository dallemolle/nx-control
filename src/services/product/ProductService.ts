import { prisma } from '@/database/prisma';
import { createProductSchema } from '@/lib/validations';
import { logAudit } from '@/services/audit/AuditService';
import type { CreateProductInput } from '@/lib/validations';

function toDecimal(value: number): string {
  return value.toString();
}

export class ProductService {
  async findAll(tenantId: string, page = 1, limit = 20, search?: string, categoryId?: string) {
    const skip = (page - 1) * limit;

    const where = {
      tenantId,
      deletedAt: null,
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' as const } },
          { sku: { contains: search, mode: 'insensitive' as const } },
          { barCode: { contains: search } },
        ],
      }),
      ...(categoryId && { categoryId }),
    };

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take: limit,
        include: {
          category: { select: { id: true, name: true } },
          unit: { select: { id: true, code: true, name: true } },
          stock: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.product.count({ where }),
    ]);

    return { products, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findById(id: string, tenantId: string) {
    return prisma.product.findFirst({
      where: { id, tenantId, deletedAt: null },
      include: {
        category: true,
        unit: true,
        stock: {
          include: { warehouse: { select: { id: true, name: true } } },
        },
        productTaxes: true,
      },
    });
  }

  async create(tenantId: string, data: CreateProductInput, userId?: string) {
    const validated = createProductSchema.parse(data);

    const product = await prisma.product.create({
      data: {
        sku: validated.sku,
        name: validated.name,
        description: validated.description,
        ncm: validated.ncm,
        barCode: validated.barCode,
        unitPrice: toDecimal(validated.unitPrice),
        costPrice: toDecimal(validated.costPrice),
        stockMin: validated.stockMin,
        stockMax: validated.stockMax,
        categoryId: validated.categoryId,
        unitId: validated.unitId,
        tenantId,
      },
    });

    await logAudit({
      action: 'CREATE',
      entity: 'Product',
      entityId: product.id,
      newValue: { sku: product.sku, name: product.name },
      userId,
    });

    return product;
  }

  async update(id: string, tenantId: string, data: Partial<CreateProductInput>, userId?: string) {
    const product = await prisma.product.findFirst({
      where: { id, tenantId, deletedAt: null },
    });

    if (!product) {
      throw new Error('Produto não encontrado');
    }

    const updateData: Record<string, unknown> = {};
    if (data.name) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.ncm !== undefined) updateData.ncm = data.ncm;
    if (data.barCode !== undefined) updateData.barCode = data.barCode;
    if (data.unitPrice !== undefined) updateData.unitPrice = toDecimal(data.unitPrice);
    if (data.costPrice !== undefined) updateData.costPrice = toDecimal(data.costPrice);
    if (data.stockMin !== undefined) updateData.stockMin = data.stockMin;
    if (data.stockMax !== undefined) updateData.stockMax = data.stockMax;
    if (data.categoryId !== undefined) updateData.categoryId = data.categoryId;
    if (data.unitId !== undefined) updateData.unitId = data.unitId;

    const updated = await prisma.product.update({
      where: { id },
      data: updateData,
    });

    await logAudit({
      action: 'UPDATE',
      entity: 'Product',
      entityId: id,
      oldValue: { name: product.name, sku: product.sku },
      newValue: { name: updated.name, sku: updated.sku },
      userId,
    });

    return updated;
  }

  async deactivate(id: string, tenantId: string) {
    return prisma.product.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async getLowStock(tenantId: string) {
    return prisma.stock.findMany({
      where: {
        product: { tenantId, deletedAt: null },
        quantity: { lt: prisma.stock.fields.productId ? 0 : 0 },
      },
      include: {
        product: {
          select: { id: true, name: true, sku: true, stockMin: true },
        },
        warehouse: { select: { id: true, name: true } },
      },
    });
  }
}

export const productService = new ProductService();