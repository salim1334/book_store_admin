import bcrypt from 'bcryptjs';
import { prisma } from './db';
import { UserRole } from '@/types';

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

export async function createUser(data: {
  email: string;
  name: string;
  password?: string;
  role: UserRole;
}) {
  const hashedPassword = data.password ? await hashPassword(data.password) : null;
  
  return prisma.user.create({
    data: {
      email: data.email,
      name: data.name,
      password: hashedPassword,
      role: data.role,
    },
  });
}

export async function getUserByEmail(email: string) {
  return prisma.user.findUnique({
    where: { email },
  });
}

export async function getUserById(id: string) {
  return prisma.user.findUnique({
    where: { id },
  });
}

export async function updateUserPassword(userId: string, newPassword: string) {
  const hashedPassword = await hashPassword(newPassword);
  
  return prisma.user.update({
    where: { id: userId },
    data: { password: hashedPassword },
  });
}
