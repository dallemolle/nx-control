const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const rootTenant = await prisma.tenant.upsert({
    where: { slug: 'root' },
    update: {},
    create: {
      name: 'Sistema Root',
      slug: 'root',
      domain: 'root',
      isActive: true,
    },
  });

  const tenant = await prisma.tenant.upsert({
    where: { slug: 'nxcontrol' },
    update: {},
    create: {
      name: 'NXControl',
      slug: 'nxcontrol',
      domain: 'localhost',
      isActive: true,
    },
  });

  const hashedPassword = await bcrypt.hash('admin123', 10);

  await prisma.user.upsert({
    where: { email_tenantId: { email: 'admin@nxcontrol.com', tenantId: rootTenant.id } },
    update: {},
    create: {
      email: 'admin@nxcontrol.com',
      password: hashedPassword,
      name: 'Administrador Root',
      role: 'ROOT',
      tenantId: rootTenant.id,
    },
  });

  await prisma.user.upsert({
    where: { email_tenantId: { email: 'admin@nxcontrol.com.br', tenantId: tenant.id } },
    update: {},
    create: {
      email: 'admin@nxcontrol.com.br',
      password: hashedPassword,
      name: 'Admin NXControl',
      role: 'ADMIN',
      tenantId: tenant.id,
    },
  });

  console.log('Seed completed!');
  console.log('Root User: admin@nxcontrol.com / admin123');
  console.log('Admin User: admin@nxcontrol.com.br / admin123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });