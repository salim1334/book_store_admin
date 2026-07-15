import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function resetPassword() {
  const email = 'admin2@bookstore.com'; // Change this to your email
  const newPassword = 'admin123'; // Change this to your desired password

  console.log('🔧 Resetting password...\n');

  // Find user
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    console.log('❌ User not found with email:', email);
    console.log('\nAvailable users:');
    const allUsers = await prisma.user.findMany({
      select: { email: true, name: true, role: true },
    });
    allUsers.forEach(u => {
      console.log(`  - ${u.email} (${u.name}) - ${u.role}`);
    });
    return;
  }

  console.log('✅ User found:', user.email);
  console.log('👤 Name:', user.name);
  console.log('🔐 Role:', user.role);

  // Hash new password
  console.log('\n🔑 Hashing new password...');
  const hashedPassword = await bcrypt.hash(newPassword, 12);

  // Update password
  await prisma.user.update({
    where: { email },
    data: { password: hashedPassword },
  });

  console.log('✅ Password reset successfully!\n');
  console.log('🎉 You can now login with:');
  console.log(`   Email: ${email}`);
  console.log(`   Password: ${newPassword}\n`);
}

resetPassword()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
