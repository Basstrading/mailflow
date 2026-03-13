"use client";

import { useState } from "react";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Get CSRF token first
      const csrfRes = await fetch("/api/auth/csrf");
      const { csrfToken } = await csrfRes.json();

      const res = await fetch("/api/auth/callback/credentials", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          email,
          password,
          redirect: "false",
          callbackUrl: "/",
          json: "true",
          csrfToken,
        }),
      });

      if (res.ok) {
        window.location.href = "/";
      } else {
        setError("Identifiants incorrects");
        setLoading(false);
      }
    } catch (err) {
      console.error("Login error:", err);
      setError("Erreur de connexion");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "#f5f5f5" }}>
      <div style={{ width: "100%", maxWidth: 400, background: "white", borderRadius: 12, padding: 32, boxShadow: "0 2px 10px rgba(0,0,0,0.1)" }}>
        <h1 style={{ fontSize: 24, fontWeight: "bold", textAlign: "center", marginBottom: 4 }}>MailFlow</h1>
        <p style={{ textAlign: "center", color: "#666", marginBottom: 24, fontSize: 14 }}>Connectez-vous pour accéder au dashboard</p>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 16 }}>
            <label htmlFor="email" style={{ display: "block", marginBottom: 4, fontSize: 14, fontWeight: 500 }}>Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="vous@exemple.com"
              required
              style={{ width: "100%", padding: "8px 12px", border: "1px solid #ddd", borderRadius: 6, fontSize: 14, boxSizing: "border-box" }}
            />
          </div>
          <div style={{ marginBottom: 16 }}>
            <label htmlFor="password" style={{ display: "block", marginBottom: 4, fontSize: 14, fontWeight: 500 }}>Mot de passe</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{ width: "100%", padding: "8px 12px", border: "1px solid #ddd", borderRadius: 6, fontSize: 14, boxSizing: "border-box" }}
            />
          </div>
          {error && (
            <p style={{ color: "red", fontSize: 14, marginBottom: 12 }}>{error}</p>
          )}
          <button
            type="submit"
            disabled={loading}
            style={{ width: "100%", padding: "10px", background: loading ? "#999" : "#111", color: "white", border: "none", borderRadius: 6, fontSize: 14, fontWeight: 500, cursor: loading ? "not-allowed" : "pointer" }}
          >
            {loading ? "Connexion..." : "Se connecter"}
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
