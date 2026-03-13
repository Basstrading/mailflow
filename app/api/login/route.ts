import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { encode } from "next-auth/jwt";

export async function POST(req: NextRequest) {
  const contentType = req.headers.get("content-type") || "";

  let email: string;
  let password: string;

  if (contentType.includes("application/x-www-form-urlencoded") || contentType.includes("multipart/form-data")) {
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

  // Verify credentials against database
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return NextResponse.redirect(new URL("/login?error=credentials", req.url));
  }

  const isValid = await bcrypt.compare(password, user.password);
  if (!isValid) {
    return NextResponse.redirect(new URL("/login?error=credentials", req.url));
  }

  // Create JWT token directly (same format as NextAuth)
  const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET;
  if (!secret) {
    return NextResponse.redirect(new URL("/login?error=config", req.url));
  }

  const isSecure = req.url.startsWith("https");
  const cookieName = isSecure
    ? "__Secure-authjs.session-token"
    : "authjs.session-token";

  const token = await encode({
    token: {
      name: user.name,
      email: user.email,
      sub: user.id,
      id: user.id,
      role: user.role,
    },
    secret,
    salt: cookieName,
    maxAge: 30 * 24 * 60 * 60, // 30 days
  });

  // Create redirect response
  const response = NextResponse.redirect(new URL("/", req.url));

  response.cookies.set(cookieName, token, {
    httpOnly: true,
    secure: isSecure,
    sameSite: "lax",
    path: "/",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  });

  return response;
}
