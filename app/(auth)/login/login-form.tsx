"use client";

import { useEffect, useRef, useState } from "react";

export function LoginForm() {
  const [csrfToken, setCsrfToken] = useState("");
  const [loading, setLoading] = useState(true);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    fetch("/api/auth/csrf", { credentials: "include" })
      .then(r => r.json())
      .then(data => {
        setCsrfToken(data.csrfToken);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <form ref={formRef} method="POST" action="/api/auth/callback/credentials">
      <input type="hidden" name="csrfToken" value={csrfToken} />
      <input type="hidden" name="callbackUrl" value="/" />
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
        disabled={loading}
        style={{
          width: "100%",
          padding: "10px",
          background: loading ? "#999" : "#111",
          color: "white",
          border: "none",
          borderRadius: 6,
          fontSize: 14,
          fontWeight: 500,
          cursor: loading ? "wait" : "pointer",
        }}
      >
        {loading ? "Chargement..." : "Se connecter"}
      </button>
    </form>
  );
}
