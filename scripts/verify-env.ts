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
  
  // Vercel Postgres (auto-added by Vercel, but needed for local dev)
  POSTGRES_URL: {
    description: "Vercel Postgres connection URL",
    required: true,
    getFrom: "Vercel Dashboard → Storage → Postgres → Connection String",
  },
  
  POSTGRES_PRISMA_URL: {
    description: "Vercel Postgres Prisma connection URL",
    required: false, // Optional, but recommended
    getFrom: "Vercel Dashboard → Storage → Postgres → Connection String",
  },
  
  POSTGRES_URL_NON_POOLING: {
    description: "Vercel Postgres non-pooling connection URL",
    required: false, // Optional, but recommended
    getFrom: "Vercel Dashboard → Storage → Postgres → Connection String",
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
      
      if (key.includes("POSTGRES_URL") && !value.includes("postgres://")) {
        console.warn(`⚠️  ${key} may have incorrect format (should be a postgres:// URL)`);
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
  if (!process.env.POSTGRES_URL) {
    console.log("⏭️  Skipping database connection test (POSTGRES_URL not set)\n");
    return;
  }
  
  console.log("🔌 Testing database connection...\n");
  
  try {
    const { sql } = await import("@vercel/postgres");
    const result = await sql`SELECT NOW() as current_time, version() as pg_version`;
    console.log("✅ Database connection successful!");
    console.log(`   PostgreSQL version: ${result.rows[0].pg_version}`);
    console.log(`   Current time: ${result.rows[0].current_time}\n`);
    
    // Check if videos table exists
    const tableCheck = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'videos'
      ) as table_exists
    `;
    
    if (tableCheck.rows[0].table_exists) {
      console.log("✅ Videos table exists\n");
    } else {
      console.log("⚠️  Videos table does not exist. Run the migration from lib/db/schema.sql\n");
    }
    
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

