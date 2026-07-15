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
  console.log('Starting ChapterText orderIndex migration...');

  try {
    // Get all ChapterText records grouped by chapterId
    const allTexts = await prisma.chapterText.findMany({
      orderBy: [
        { chapterId: 'asc' },
        { createdAt: 'asc' },
      ],
    });

    console.log(`Found ${allTexts.length} ChapterText records to process`);

    // Group by chapterId
    const textsByChapter = new Map<string, any[]>();
    
    for (const text of allTexts) {
      if (!textsByChapter.has(text.chapterId)) {
        textsByChapter.set(text.chapterId, []);
      }
      textsByChapter.get(text.chapterId)!.push(text);
    }

    console.log(`Processing ${textsByChapter.size} chapters...`);

    let updatedCount = 0;

    // Update each chapter's texts with proper orderIndex
    for (const [chapterId, texts] of textsByChapter.entries()) {
      console.log(`  Chapter ${chapterId}: ${texts.length} text(s)`);
      
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

    console.log(`✅ Successfully updated ${updatedCount} ChapterText records`);
    console.log('Migration complete!');

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
