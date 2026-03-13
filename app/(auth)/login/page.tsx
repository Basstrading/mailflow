import Link from "next/link";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const params = await searchParams;

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f5f5f5" }}>
      <div style={{ width: "100%", maxWidth: 400, background: "white", borderRadius: 12, padding: 32, boxShadow: "0 2px 10px rgba(0,0,0,0.1)" }}>
        <h1 style={{ fontSize: 24, fontWeight: "bold", textAlign: "center", marginBottom: 4 }}>MailFlow</h1>
        <p style={{ textAlign: "center", color: "#666", marginBottom: 24, fontSize: 14 }}>Connectez-vous pour accéder au dashboard</p>
        {params?.error && (
          <p style={{ color: "red", fontSize: 14, marginBottom: 12, textAlign: "center" }}>
            Email ou mot de passe incorrect
          </p>
        )}
        <form method="POST" action="/api/login">
          <div style={{ marginBottom: 16 }}>
            <label htmlFor="email" style={{ display: "block", marginBottom: 4, fontSize: 14, fontWeight: 500 }}>Email</label>
            <input
              id="email"
              name="email"
              type="email"
              placeholder="vous@exemple.com"
              required
              style={{ width: "100%", padding: "8px 12px", border: "1px solid #ddd", borderRadius: 6, fontSize: 14, boxSizing: "border-box" }}
            />
          </div>
          <div style={{ marginBottom: 16 }}>
            <label htmlFor="password" style={{ display: "block", marginBottom: 4, fontSize: 14, fontWeight: 500 }}>Mot de passe</label>
            <input
              id="password"
              name="password"
              type="password"
              required
              style={{ width: "100%", padding: "8px 12px", border: "1px solid #ddd", borderRadius: 6, fontSize: 14, boxSizing: "border-box" }}
            />
          </div>
          <button
            type="submit"
            style={{ width: "100%", padding: "10px", background: "#111", color: "white", border: "none", borderRadius: 6, fontSize: 14, fontWeight: 500, cursor: "pointer" }}
          >
            Se connecter
          </button>
        </form>
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
