const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

function parseArgs() {
  const args = {};
  const argv = process.argv.slice(2);

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg.startsWith('--')) {
      const key = arg.slice(2);
      const nextArg = argv[i + 1];
      if (nextArg && !nextArg.startsWith('--')) {
        args[key] = nextArg;
        i++;
      } else {
        args[key] = true;
      }
    }
  }

  return args;
}

function validateInput(args) {
  const errors = [];

  if (!args.name) errors.push('--name é obrigatório');
  if (!args.slug) errors.push('--slug é obrigatório');
  if (!args.email) errors.push('--email é obrigatório');
  if (!args.password) errors.push('--password é obrigatório');

  if (args.password && args.password.length < 6) {
    errors.push('--password deve ter no mínimo 6 caracteres');
  }

  if (args.slug && !/^[a-z0-9-]+$/.test(args.slug)) {
    errors.push('--slug deve conter apenas letras minúsculas, números e hifens');
  }

  return errors;
}

async function main() {
  console.log('\n🔧 NEXO CONTROL - Setup Inicial\n');
  console.log('═'.repeat(50) + '\n');

  const args = parseArgs();

  const errors = validateInput(args);
  if (errors.length > 0) {
    console.log('❌ Erros encontrados:\n');
    errors.forEach(e => console.log('  - ' + e));
    console.log('\n📝 Uso: node scripts/setup.js --name "Empresa" --slug "empresa --email "leandro.dalle@nxcontrol.com.br" --password "@nAl21ndr4060809"');
    process.exit(1);
  }

  console.log('📦 Verificando conexão com banco...');

  try {
    await prisma.$connect();
    console.log('✅ Conexão com banco: OK\n');
  } catch (error) {
    console.log('❌ Erro ao conectar com banco de dados');
    console.log('   Verifique se o PostgreSQL está rodando e o .env está configurado');
    process.exit(1);
  }

  console.log('🏢 Verificando se tenant já existe...');

  const existingTenant = await prisma.tenant.findUnique({
    where: { slug: args.slug }
  });

  if (existingTenant) {
    console.log('❌ Tenant com slug "' + args.slug + '" já existe!\n');
    await prisma.$disconnect();
    process.exit(1);
  }

  console.log('✅ Tenant não existe. Criando...\n');

  console.log('📝 Dados:');
  console.log('   - Nome: ' + args.name);
  console.log('   - Slug: ' + args.slug);
  console.log('   - Email Admin: ' + args.email + '\n');

  console.log('🔒 Criptografando senha...');

  const hashedPassword = await bcrypt.hash(args.password, 10);

  console.log('✅ Senha criptografada\n');

  console.log('📦 Criando tenant e usuário admin...');

  const tenant = await prisma.tenant.create({
    data: {
      name: args.name,
      slug: args.slug,
    }
  });

  console.log('✅ Tenant criado: ' + tenant.name + ' (ID: ' + tenant.id + ')\n');

  const admin = await prisma.user.create({
    data: {
      email: args.email,
      password: hashedPassword,
      name: 'Administrador',
      role: 'ADMIN',
      tenantId: tenant.id,
    }
  });

  console.log('✅ Admin criado: ' + admin.email + '\n');

  await prisma.$disconnect();

  console.log('═'.repeat(50));
  console.log('\n✅ SETUP CONCLUÍDO!\n');
  console.log('📍 Login: http://localhost:3000/login');
  console.log('📧 Email: ' + args.email);
  console.log('🔑 Senha: ' + args.password + '\n');
  console.log('⚠️  IMPORTANTE: Delete o arquivo scripts/setup.js após usar!\n');
  console.log('═'.repeat(50) + '\n');
}

main().catch((error) => {
  console.error('\n❌ Erro:', error.message);
  process.exit(1);
});