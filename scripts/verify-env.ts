#!/usr/bin/env tsx
/**
 * Environment Variables Verification Script
 * 
 * This script verifies that all required environment variables are set
 * for both local development and Vercel deployment.
 * 
 * Run with: pnpm tsx scripts/verify-env.ts
 */

const requiredEnvVars = {
  // Vercel Blob Storage
  BLOB_READ_WRITE_TOKEN: {
    description: "Vercel Blob Storage read/write token",
    required: true,
    getFrom: "Vercel Dashboard → Storage → Blob → Settings → Tokens",
  },
  
  // Prisma Database
  DATABASE_URL: {
    description: "Prisma Accelerate connection URL",
    required: true,
    getFrom: "Prisma Dashboard → Your Database → Connection String",
  },
};

function verifyEnvironment() {
  console.log("🔍 Verifying Environment Variables...\n");
  
  const missing: string[] = [];
  const present: string[] = [];
  const optional: string[] = [];
  
  for (const [key, config] of Object.entries(requiredEnvVars)) {
    const value = process.env[key];
    
    if (value) {
      // Mask sensitive values
      const masked = key.includes("TOKEN") || key.includes("URL") 
        ? `${value.substring(0, 10)}...${value.substring(value.length - 4)}`
        : value;
      present.push(`✅ ${key}: ${masked}`);
      
      // Validate format for specific vars
      if (key === "BLOB_READ_WRITE_TOKEN" && !value.startsWith("vercel_blob_rw_")) {
        console.warn(`⚠️  ${key} may have incorrect format (should start with 'vercel_blob_rw_')`);
      }
      
      if (key === "DATABASE_URL" && !value.startsWith("prisma+postgres://")) {
        console.warn(`⚠️  ${key} may have incorrect format (should start with 'prisma+postgres://' for Prisma Accelerate)`);
      }
    } else {
      if (config.required) {
        missing.push(`❌ ${key}: MISSING - ${config.description}`);
      } else {
        optional.push(`⚠️  ${key}: OPTIONAL - ${config.description}`);
      }
    }
  }
  
  console.log("📋 Status:\n");
  
  if (present.length > 0) {
    console.log("✅ Present:");
    present.forEach(item => console.log(`   ${item}`));
    console.log();
  }
  
  if (missing.length > 0) {
    console.log("❌ Missing (Required):");
    missing.forEach(item => console.log(`   ${item}`));
    console.log();
  }
  
  if (optional.length > 0) {
    console.log("⚠️  Optional (Recommended):");
    optional.forEach(item => console.log(`   ${item}`));
    console.log();
  }
  
  // Show where to get missing vars
  if (missing.length > 0) {
    console.log("📖 How to get missing variables:\n");
    missing.forEach(key => {
      const config = requiredEnvVars[key as keyof typeof requiredEnvVars];
      console.log(`   ${key}:`);
      console.log(`   → ${config.getFrom}\n`);
    });
  }
  
  // Final status
  if (missing.length === 0) {
    console.log("✅ All required environment variables are set!\n");
    return true;
  } else {
    console.log("❌ Some required environment variables are missing.\n");
    console.log("💡 For local development:");
    console.log("   Create a .env.local file with the missing variables.\n");
    console.log("💡 For Vercel deployment:");
    console.log("   Add them in Vercel Dashboard → Settings → Environment Variables\n");
    return false;
  }
}

// Test database connection
async function testDatabaseConnection() {
  if (!process.env.DATABASE_URL) {
    console.log("⏭️  Skipping database connection test (DATABASE_URL not set)\n");
    return;
  }
  
  console.log("🔌 Testing database connection...\n");
  
  try {
    const { prisma } = await import("../lib/prisma");
    
    // Test connection with a simple query
    const result = await prisma.$queryRaw`SELECT NOW() as current_time, version() as pg_version`;
    const row = Array.isArray(result) ? result[0] : result;
    console.log("✅ Database connection successful!");
    console.log(`   PostgreSQL version: ${(row as any).pg_version}`);
    console.log(`   Current time: ${(row as any).current_time}\n`);
    
    // Check if videos table exists by trying to count
    const videoCount = await prisma.video.count();
    console.log(`✅ Videos table exists (${videoCount} video(s) found)\n`);
    
    return true;
  } catch (error) {
    console.error("❌ Database connection failed:");
    console.error(`   ${error instanceof Error ? error.message : String(error)}\n`);
    return false;
  }
}

// Test blob storage connection
async function testBlobConnection() {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    console.log("⏭️  Skipping blob storage test (BLOB_READ_WRITE_TOKEN not set)\n");
    return;
  }
  
  console.log("☁️  Testing blob storage connection...\n");
  
  try {
    const { list } = await import("@vercel/blob");
    const { blobs } = await list();
    console.log("✅ Blob storage connection successful!");
    console.log(`   Found ${blobs.length} blob(s) in storage\n`);
    return true;
  } catch (error) {
    console.error("❌ Blob storage connection failed:");
    console.error(`   ${error instanceof Error ? error.message : String(error)}\n`);
    console.log("💡 Make sure:");
    console.log("   - BLOB_READ_WRITE_TOKEN is correct");
    console.log("   - Blob store is created in Vercel Dashboard\n");
    return false;
  }
}

async function main() {
  const envOk = verifyEnvironment();
  
  if (!envOk) {
    process.exit(1);
  }
  
  const dbOk = await testDatabaseConnection();
  const blobOk = await testBlobConnection();
  
  if (dbOk && blobOk) {
    console.log("🎉 All systems operational!\n");
    process.exit(0);
  } else {
    console.log("⚠️  Some connections failed. Please check the errors above.\n");
    process.exit(1);
  }
}

main().catch(console.error);

