import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Create SuperAdmin account
  const hashedPassword = await bcrypt.hash('admin123', 12);
  
  const superAdmin = await prisma.user.upsert({
    where: { email: 'admin@bookstore.com' },
    update: {},
    create: {
      email: 'admin@bookstore.com',
      name: 'Super Admin',
      password: hashedPassword,
      role: 'SUPER_ADMIN',
      isActive: true,
    },
  });

  // Create a demo author account
  const authorPassword = await bcrypt.hash('author123', 12);
  
  const author = await prisma.user.upsert({
    where: { email: 'author@bookstore.com' },
    update: {},
    create: {
      email: 'author@bookstore.com',
      name: 'Demo Author',
      password: authorPassword,
      role: 'AUTHOR',
      isActive: true,
    },
  });

  // Create a demo book
  const book = await prisma.book.create({
    data: {
      title: 'My First Book',
      description: 'This is a demo book to get you started',
      type: 'TEXT',
      status: 'DRAFT',
      authorId: author.id,
    },
  });

  // Create a demo chapter
  const chapter = await prisma.chapter.create({
    data: {
      title: 'Chapter 1: Introduction',
      bookId: book.id,
      authorId: author.id,
      orderIndex: 0,
    },
  });

  // Add text content to the chapter
  await prisma.chapterText.create({
    data: {
      chapterId: chapter.id,
      authorId: author.id,
      content: 'Welcome to your first book! This is where your story begins...',
    },
  });
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
