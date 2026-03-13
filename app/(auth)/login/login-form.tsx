"use client";

import { useEffect, useState } from "react";

export function LoginForm({ csrfToken: initialCsrf }: { csrfToken: string }) {
  const [csrfToken, setCsrfToken] = useState(initialCsrf);

  useEffect(() => {
    // Fetch CSRF client-side to ensure it matches the cookie
    fetch("/api/auth/csrf")
      .then(r => r.json())
      .then(data => setCsrfToken(data.csrfToken))
      .catch(() => {});
  }, []);

  return (
    <form method="POST" action="/api/auth/callback/credentials">
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
        style={{ width: "100%", padding: "10px", background: "#111", color: "white", border: "none", borderRadius: 6, fontSize: 14, fontWeight: 500, cursor: "pointer" }}
      >
        Se connecter
      </button>
    </form>
  );
}
