// One-time script to set all videos to visible=true
// Run with: npx tsx scripts/set-all-visible.ts

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Setting all videos to visible=true...');
  
  const result = await prisma.video.updateMany({
    data: { visible: true },
  });
  
  console.log(`Updated ${result.count} videos to visible=true`);
}

main()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

