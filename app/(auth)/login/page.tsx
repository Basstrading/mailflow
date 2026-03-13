import { signIn } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AuthError } from "next-auth";
import Link from "next/link";
import { LoginForm } from "./login-form";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const params = await searchParams;

  async function login(formData: FormData) {
    "use server";
    try {
      await signIn("credentials", {
        email: formData.get("email") as string,
        password: formData.get("password") as string,
        redirect: false,
      });
    } catch (error) {
      if (error instanceof AuthError) {
        return redirect("/login?error=credentials");
      }
      throw error;
    }
    redirect("/");
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f5f5f5" }}>
      <div style={{ width: "100%", maxWidth: 400, background: "white", borderRadius: 12, padding: 32, boxShadow: "0 2px 10px rgba(0,0,0,0.1)" }}>
        <h1 style={{ fontSize: 24, fontWeight: "bold", textAlign: "center", marginBottom: 4 }}>MailFlow</h1>
        <p style={{ textAlign: "center", color: "#666", marginBottom: 24, fontSize: 14 }}>Connectez-vous pour accéder au dashboard</p>
        {params?.error && (
          <p style={{ color: "red", fontSize: 14, marginBottom: 12, textAlign: "center" }}>Identifiants incorrects</p>
        )}
        <LoginForm action={login} />
        <p style={{ textAlign: "center", marginTop: 16, fontSize: 14, color: "#666" }}>
          Pas encore de compte ?{" "}
          <Link href="/register" style={{ color: "#111", textDecoration: "underline" }}>
            Créer un compte
          </Link>
        </p>
      </div>
    </div>
  );
}
