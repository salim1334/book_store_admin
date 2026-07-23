const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

prisma.book.findMany({
  where: {
    authorId: 'cmroh7yas000gbjo8apaz4lm3',
    deletedAt: null,
    status: 'PUBLISHED',
    isHidden: false,
  },
  include: {
    author: {
      select: {
        id: true,
        name: true,
      },
    },
    _count: {
      select: {
        chapters: {
          where: {
            deletedAt: null,
          },
        },
      },
    },
  },
  orderBy: { updatedAt: 'desc' },
}).then(books => {
  console.log('OK');
  console.log(JSON.stringify(books, null, 2));
  return prisma.$disconnect().then(() => process.exit(0));
}).catch(err => {
  console.error(err);
  return prisma.$disconnect().then(() => process.exit(1));
});
