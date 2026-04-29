import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
});

export const registerUserSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
  name: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres'),
  tenantId: z.string().uuid().optional(),
  role: z.enum(['ROOT', 'ADMIN', 'MANAGER', 'USER', 'ACCOUNTANT', 'SELLER']).default('USER'),
});

export const createTenantSchema = z.object({
  name: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres'),
  slug: z.string().min(2, 'Slug deve ter no mínimo 2 caracteres').regex(/^[a-z0-9-]+$/, 'Slug deve conter apenas letras minúsculas, números e hífens'),
  domain: z.string().url('Domínio inválido').optional().or(z.literal('')),
});

export const updateUserSchema = z.object({
  email: z.string().email('Email inválido').optional(),
  name: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres').optional(),
  role: z.enum(['ROOT', 'ADMIN', 'MANAGER', 'USER', 'ACCOUNTANT', 'SELLER']).optional(),
  isActive: z.boolean().optional(),
});

export const createClientSchema = z.object({
  document: z.string().min(11, 'CPF/CNPJ inválido'),
  name: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres'),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
});

export const createSupplierSchema = z.object({
  document: z.string().min(11, 'CPF/CNPJ inválido'),
  name: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres'),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
});

export const createProductSchema = z.object({
  sku: z.string().min(3, 'SKU deve ter no mínimo 3 caracteres'),
  name: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres'),
  description: z.string().optional(),
  ncm: z.string().optional(),
  barCode: z.string().optional(),
  unitPrice: z.number().positive('Preço unitário deve ser positivo'),
  costPrice: z.number().positive('Preço de custo deve ser positivo'),
  stockMin: z.number().int().min(0).default(0),
  stockMax: z.number().int().min(0).default(0),
  categoryId: z.string().uuid().optional(),
  unitId: z.string().uuid(),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterUserInput = z.infer<typeof registerUserSchema>;
export type CreateTenantInput = z.infer<typeof createTenantSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type CreateClientInput = z.infer<typeof createClientSchema>;
export type CreateSupplierInput = z.infer<typeof createSupplierSchema>;
export type CreateProductInput = z.infer<typeof createProductSchema>;