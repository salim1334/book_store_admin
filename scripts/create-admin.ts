import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function createAdmin() {
  const email = 'admin@bookstore.com';
  const password = 'admin123';
  const name = 'Super Admin';

  console.log('🔧 Creating SuperAdmin account...\n');

  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    console.log('⚠️  User already exists!');
    console.log('📧 Email:', existingUser.email);
    console.log('👤 Name:', existingUser.name);
    console.log('🔐 Role:', existingUser.role);
    console.log('✅ Active:', existingUser.isActive);
    console.log('\nℹ️  Use these credentials to login:');
    console.log('   Email: admin@bookstore.com');
    console.log('   Password: admin123\n');
    return;
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 12);

  // Create user
  const user = await prisma.user.create({
    data: {
      email,
      name,
      password: hashedPassword,
      role: 'SUPER_ADMIN',
      isActive: true,
    },
  });

  console.log('✅ SuperAdmin account created successfully!\n');
  console.log('📧 Email:', user.email);
  console.log('👤 Name:', user.name);
  console.log('🔐 Role:', user.role);
  console.log('✅ Active:', user.isActive);
  console.log('\n🎉 You can now login with:');
  console.log('   Email: admin@bookstore.com');
  console.log('   Password: admin123\n');
}

createAdmin()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
