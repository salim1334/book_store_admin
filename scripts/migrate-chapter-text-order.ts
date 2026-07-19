/**
 * Data Migration Script: Add orderIndex to existing ChapterText records
 * 
 * This script updates all existing ChapterText records to have an orderIndex value.
 * Since these are legacy records created before multi-page support, they all get orderIndex = 0.
 * 
 * Run this script once after deploying the schema migration.
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    // Get all ChapterText records grouped by chapterId
    const allTexts = await prisma.chapterText.findMany({
      orderBy: [
        { chapterId: 'asc' },
        { createdAt: 'asc' },
      ],
    });

    // Group by chapterId
    const textsByChapter = new Map<string, any[]>();
    
    for (const text of allTexts) {
      if (!textsByChapter.has(text.chapterId)) {
        textsByChapter.set(text.chapterId, []);
      }
      textsByChapter.get(text.chapterId)!.push(text);
    }

    let updatedCount = 0;

    // Update each chapter's texts with proper orderIndex
    for (const [chapterId, texts] of textsByChapter.entries()) {      
      for (let i = 0; i < texts.length; i++) {
        const text = texts[i];
        
        // Update orderIndex
        await prisma.chapterText.update({
          where: { id: text.id },
          data: { orderIndex: i },
        });
        
        updatedCount++;
      }
    }

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
