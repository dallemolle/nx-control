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

function validateCpf(cpf: string): boolean {
  const cleanCpf = cpf.replace(/\D/g, '');
  if (cleanCpf.length !== 11) return false;
  if (/^(\d)\1+$/.test(cleanCpf)) return false;

  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleanCpf[i]) * (10 - i);
  }
  let remainder = sum % 11;
  const digit1 = remainder < 2 ? 0 : 11 - remainder;
  if (parseInt(cleanCpf[9]) !== digit1) return false;

  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleanCpf[i]) * (11 - i);
  }
  remainder = sum % 11;
  const digit2 = remainder < 2 ? 0 : 11 - remainder;
  return parseInt(cleanCpf[10]) === digit2;
}

function validateCnpj(cnpj: string): boolean {
  const cleanCnpj = cnpj.replace(/\D/g, '');
  if (cleanCnpj.length !== 14) return false;
  if (/^(\d)\1+$/.test(cleanCnpj)) return false;

  const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];

  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += parseInt(cleanCnpj[i]) * weights1[i];
  }
  let remainder = sum % 11;
  const digit1 = remainder < 2 ? 0 : 11 - remainder;
  if (parseInt(cleanCnpj[12]) !== digit1) return false;

  sum = 0;
  for (let i = 0; i < 13; i++) {
    sum += parseInt(cleanCnpj[i]) * weights2[i];
  }
  remainder = sum % 11;
  const digit2 = remainder < 2 ? 0 : 11 - remainder;
  return parseInt(cleanCnpj[13]) === digit2;
}

export function validateDocument(document: string): boolean {
  const cleanDoc = document.replace(/\D/g, '');
  if (cleanDoc.length === 11) return validateCpf(cleanDoc);
  if (cleanDoc.length === 14) return validateCnpj(cleanDoc);
  return false;
}

export function detectPersonType(document: string): 'PF' | 'PJ' {
  const cleanDoc = document.replace(/\D/g, '');
  return cleanDoc.length <= 11 ? 'PF' : 'PJ';
}

export function formatDocument(document: string): string {
  const cleanDoc = document.replace(/\D/g, '');
  if (cleanDoc.length === 11) {
    return cleanDoc.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  }
  if (cleanDoc.length === 14) {
    return cleanDoc.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
  }
  return document;
}

export function formatPhone(phone: string): string {
  const cleanPhone = phone.replace(/\D/g, '');
  if (cleanPhone.length === 10) {
    return cleanPhone.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
  }
  if (cleanPhone.length === 11) {
    return cleanPhone.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  }
  return phone;
}

export function formatZipCode(zipCode: string): string {
  const clean = zipCode.replace(/\D/g, '');
  if (clean.length === 8) {
    return clean.replace(/(\d{5})(\d{3})/, '$1-$2');
  }
  return zipCode;
}

export const createEntitySchema = z.object({
  isCustomer: z.boolean().default(false),
  isSupplier: z.boolean().default(false),
  isCarrier: z.boolean().default(false),
  personType: z.enum(['PF', 'PJ']),
  fullName: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres'),
  tradeName: z.string().optional(),
  documentNumber: z.string().min(11, 'CPF/CNPJ inválido').refine(
    (doc) => validateDocument(doc),
    { message: 'CPF ou CNPJ inválido' }
  ),
  stateRegistration: z.string().optional(),
  municipalRegistration: z.string().optional(),
  taxRegimeCode: z.number().int().min(1).max(6).default(1),
  street: z.string().optional(),
  streetNumber: z.string().optional(),
  complement: z.string().optional(),
  district: z.string().optional(),
  cityCode: z.string().optional(),
  cityName: z.string().optional(),
  stateUf: z.string().min(0).max(2, 'UF deve ter no máximo 2 caracteres').optional().or(z.literal('')),
  zipCode: z.string().optional(),
  email: z.string().email('Email inválido').or(z.literal('')).optional(),
  phone: z.string().optional(),
  whatsapp: z.string().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']).default('ACTIVE'),
});

export const updateEntitySchema = createEntitySchema.partial().extend({
  documentNumber: z.string().min(11, 'CPF/CNPJ inválido').refine(
    (doc) => validateDocument(doc),
    { message: 'CPF ou CNPJ inválido' }
  ).optional(),
});

export const entityQuerySchema = z.object({
  type: z.enum(['customer', 'supplier', 'carrier', 'all']).default('all'),
  search: z.string().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'all']).default('all'),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
});

export type CreateEntityInput = z.infer<typeof createEntitySchema>;
export type UpdateEntityInput = z.infer<typeof updateEntitySchema>;
export type EntityQueryInput = z.infer<typeof entityQuerySchema>;