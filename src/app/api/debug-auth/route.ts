import { NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { sql } from "drizzle-orm";

export async function GET() {
  const results: Record<string, unknown> = {};

  // 1. Test basic connectivity
  try {
    await db.execute(sql`SELECT 1 as ok`);
    results.connection = "OK";
  } catch (e: any) {
    results.connection = { error: e.message };
  }

  // 2. Check tables exist
  try {
    const tables = await db.execute(
      sql`SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename`
    );
    results.tables = [...tables].map((r) => r.tablename);
  } catch (e: any) {
    results.tables = { error: e.message };
  }

  // 3. Check RLS status on auth tables
  try {
    const rls = await db.execute(
      sql`SELECT relname, relrowsecurity, relforcerowsecurity
          FROM pg_class
          WHERE relname IN ('user','account','session','verification_token')
          ORDER BY relname`
    );
    results.rls = [...rls];
  } catch (e: any) {
    results.rls = { error: e.message };
  }

  // 4. Check RLS policies
  try {
    const policies = await db.execute(
      sql`SELECT tablename, policyname, permissive, cmd
          FROM pg_policies
          WHERE tablename IN ('user','account','session','verification_token')
          ORDER BY tablename, policyname`
    );
    results.policies = [...policies];
  } catch (e: any) {
    results.policies = { error: e.message };
  }

  // 5. Test INSERT into "user" table (what Auth.js does on first sign-in)
  try {
    const testUser = await db
      .insert(users)
      .values({
        name: "__debug_test__",
        email: "__debug_test__@test.invalid",
      })
      .returning({ id: users.id });

    // Clean up immediately
    if (testUser[0]?.id) {
      await db.execute(
        sql`DELETE FROM "user" WHERE id = ${testUser[0].id}`
      );
    }
    results.insertUser = "OK (inserted and cleaned up)";
  } catch (e: any) {
    results.insertUser = { error: e.message, code: e.code, detail: e.detail };
  }

  // 6. Check current role
  try {
    const role = await db.execute(sql`SELECT current_user, current_setting('role') as role`);
    results.currentRole = [...role][0];
  } catch (e: any) {
    results.currentRole = { error: e.message };
  }

  // 7. Check column names match expected Auth.js adapter columns
  try {
    const cols = await db.execute(
      sql`SELECT table_name, column_name, data_type
          FROM information_schema.columns
          WHERE table_schema = 'public'
            AND table_name IN ('user','account','session')
          ORDER BY table_name, ordinal_position`
    );
    results.columns = [...cols];
  } catch (e: any) {
    results.columns = { error: e.message };
  }

  // 8. Check env vars are set (not their values)
  results.envCheck = {
    DATABASE_URL: !!process.env.DATABASE_URL,
    AUTH_SECRET: !!process.env.AUTH_SECRET,
    AUTH_GITHUB_ID: !!process.env.AUTH_GITHUB_ID,
    AUTH_GITHUB_SECRET: !!process.env.AUTH_GITHUB_SECRET,
  };

  return NextResponse.json(results, { status: 200 });
}
