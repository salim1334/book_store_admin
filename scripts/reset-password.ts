import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function resetPassword() {
  const email = 'admin2@bookstore.com'; // Change this to your email
  const newPassword = 'admin123'; // Change this to your desired password

  // Find user
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    const allUsers = await prisma.user.findMany({
      select: { email: true, name: true, role: true },
    });
    allUsers.forEach(u => {
    });
    return;
  }

  // Hash new password
  const hashedPassword = await bcrypt.hash(newPassword, 12);

  // Update password
  await prisma.user.update({
    where: { email },
    data: { password: hashedPassword },
  });
}

resetPassword()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
