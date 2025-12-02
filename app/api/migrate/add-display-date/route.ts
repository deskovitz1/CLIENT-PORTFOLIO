import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// POST - Add display_date column if it doesn't exist
export async function POST() {
  try {
    console.log("[migrate/add-display-date] Starting migration...");
    
    // First, check if column exists by querying the information_schema
    try {
      const columnCheck = await prisma.$queryRawUnsafe<Array<{ column_name: string }>>(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'videos' 
        AND column_name = 'display_date'
        LIMIT 1;
      `);
      
      if (Array.isArray(columnCheck) && columnCheck.length > 0) {
        console.log("[migrate/add-display-date] Column already exists");
        return NextResponse.json({ 
          success: true, 
          message: "display_date column already exists" 
        });
      }
    } catch (checkError: any) {
      console.log("[migrate/add-display-date] Could not check column existence, will attempt to add:", checkError?.message);
    }
    
    // Column doesn't exist, add it
    console.log("[migrate/add-display-date] Column doesn't exist, adding it...");
    
    try {
      // Try with IF NOT EXISTS first (PostgreSQL 9.6+)
      await prisma.$executeRawUnsafe(`
        ALTER TABLE videos 
        ADD COLUMN IF NOT EXISTS display_date TIMESTAMP;
      `);
      console.log("[migrate/add-display-date] Column added successfully (with IF NOT EXISTS)");
    } catch (addError: any) {
      const errorMsg = addError?.message?.toLowerCase() || '';
      
      // If IF NOT EXISTS is not supported, try without it
      if (errorMsg.includes('syntax error') || errorMsg.includes('unexpected')) {
        console.log("[migrate/add-display-date] IF NOT EXISTS not supported, trying without it...");
        try {
          // Check if column exists first to avoid duplicate column error
          const existsCheck = await prisma.$queryRawUnsafe<Array<{ column_name: string }>>(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'videos' 
            AND column_name = 'display_date'
            LIMIT 1;
          `);
          
          if (Array.isArray(existsCheck) && existsCheck.length === 0) {
            await prisma.$executeRawUnsafe(`
              ALTER TABLE videos 
              ADD COLUMN display_date TIMESTAMP;
            `);
            console.log("[migrate/add-display-date] Column added successfully (without IF NOT EXISTS)");
          } else {
            console.log("[migrate/add-display-date] Column already exists (checked via information_schema)");
            return NextResponse.json({ 
              success: true, 
              message: "display_date column already exists" 
            });
          }
        } catch (fallbackError: any) {
          console.error("[migrate/add-display-date] Fallback add failed:", fallbackError);
          throw fallbackError;
        }
      } else {
        // Some other error occurred
        throw addError;
      }
    }
    
    // Add index (this can fail if index already exists, but that's okay)
    try {
      await prisma.$executeRawUnsafe(`
        CREATE INDEX IF NOT EXISTS idx_videos_display_date 
        ON videos(display_date DESC NULLS LAST);
      `);
      console.log("[migrate/add-display-date] Index created successfully");
    } catch (indexError: any) {
      // Index creation failure is not critical
      console.warn("[migrate/add-display-date] Index creation failed (non-critical):", indexError?.message);
    }
    
    // Verify the column was added
    try {
      await prisma.$queryRawUnsafe(`SELECT display_date FROM videos LIMIT 1`);
      console.log("[migrate/add-display-date] Column verified successfully");
    } catch (verifyError: any) {
      console.error("[migrate/add-display-date] Column verification failed:", verifyError);
      throw new Error(`Column was added but verification failed: ${verifyError?.message}`);
    }
    
    return NextResponse.json({ 
      success: true, 
      message: "display_date column added successfully" 
    });
  } catch (error: any) {
    console.error("[migrate/add-display-date] Fatal error:", error);
    console.error("[migrate/add-display-date] Error details:", {
      message: error?.message,
      code: error?.code,
      meta: error?.meta,
      stack: error?.stack,
    });
    
    // Check if it's a permissions error
    const errorMsg = error instanceof Error ? error.message : String(error);
    const isPermissionError = errorMsg.includes('must be owner') || errorMsg.includes('permission denied') || errorMsg.includes('42501');
    
    let userMessage = "Failed to add display_date column automatically.";
    if (isPermissionError) {
      userMessage += "\n\n⚠️ PERMISSIONS ISSUE: Your database connection doesn't have permission to alter tables.\n\n" +
        "✅ SOLUTION: Run this SQL manually in Vercel Postgres SQL Editor (it has full permissions):\n\n" +
        "ALTER TABLE videos ADD COLUMN IF NOT EXISTS display_date TIMESTAMP;\n" +
        "CREATE INDEX IF NOT EXISTS idx_videos_display_date ON videos(display_date DESC NULLS LAST);\n\n" +
        "📖 Steps:\n" +
        "1. Go to https://vercel.com/dashboard\n" +
        "2. Your Project → Storage → Postgres → SQL Editor\n" +
        "3. Paste the SQL above and click 'Run'";
    } else {
      userMessage += `\n\nError: ${errorMsg}\n\nPlease run this SQL manually in Vercel Postgres SQL Editor:\n\n` +
        "ALTER TABLE videos ADD COLUMN IF NOT EXISTS display_date TIMESTAMP;";
    }
    
    return NextResponse.json(
      { 
        success: false,
        error: errorMsg,
        errorCode: error?.code,
        errorMeta: error?.meta,
        message: userMessage,
        isPermissionError
      },
      { status: 500 }
    );
  }
}

