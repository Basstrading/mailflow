import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { signIn } from "@/lib/auth";
import { AuthError } from "next-auth";

export async function POST(req: NextRequest) {
  const contentType = req.headers.get("content-type") || "";

  let email: string;
  let password: string;

  if (contentType.includes("application/x-www-form-urlencoded")) {
    const formData = await req.formData();
    email = formData.get("email") as string;
    password = formData.get("password") as string;
  } else {
    const body = await req.json();
    email = body.email;
    password = body.password;
  }

  if (!email || !password) {
    return NextResponse.redirect(new URL("/login?error=missing", req.url));
  }

  // Verify credentials directly
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return NextResponse.redirect(new URL("/login?error=credentials", req.url));
  }

  const isValid = await bcrypt.compare(password, user.password);
  if (!isValid) {
    return NextResponse.redirect(new URL("/login?error=credentials", req.url));
  }

  // Use NextAuth signIn server-side
  try {
    await signIn("credentials", {
      email,
      password,
      redirect: false,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.redirect(new URL("/login?error=credentials", req.url));
    }
    // NEXT_REDIRECT is thrown by signIn on success in some cases
    throw error;
  }

  return NextResponse.redirect(new URL("/", req.url));
}
