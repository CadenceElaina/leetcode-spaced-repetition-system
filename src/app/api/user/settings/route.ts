import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { dailyTimeBudgetMinutes } = body;

  if (
    !Number.isInteger(dailyTimeBudgetMinutes) ||
    dailyTimeBudgetMinutes < 15 ||
    dailyTimeBudgetMinutes > 480
  ) {
    return NextResponse.json(
      { error: "dailyTimeBudgetMinutes must be an integer between 15 and 480" },
      { status: 400 },
    );
  }

  await db
    .update(users)
    .set({ dailyTimeBudgetMinutes })
    .where(eq(users.id, session.user.id));

  return NextResponse.json({ dailyTimeBudgetMinutes });
}
