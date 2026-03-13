import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export async function getAuthUserId(): Promise<string | null> {
  const session = await auth();
  return (session?.user as { id?: string })?.id ?? null;
}

export function unauthorized() {
  return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
}
