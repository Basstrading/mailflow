"use client";

import { useFormStatus } from "react-dom";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      style={{
        width: "100%",
        padding: "10px",
        background: pending ? "#999" : "#111",
        color: "white",
        border: "none",
        borderRadius: 6,
        fontSize: 14,
        fontWeight: 500,
        cursor: pending ? "not-allowed" : "pointer",
      }}
    >
      {pending ? "Connexion..." : "Se connecter"}
    </button>
  );
}

export function LoginForm({ action }: { action: (formData: FormData) => Promise<void> }) {
  return (
    <form action={action}>
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
      <SubmitButton />
    </form>
  );
}
