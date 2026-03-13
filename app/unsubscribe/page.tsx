"use client";

import { useSearchParams } from "next/navigation";
import { useState, Suspense } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function UnsubscribeContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<"pending" | "success" | "error">("pending");
  const [loading, setLoading] = useState(false);

  async function handleUnsubscribe() {
    setLoading(true);
    const res = await fetch("/api/unsubscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    });

    setStatus(res.ok ? "success" : "error");
    setLoading(false);
  }

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <p className="text-destructive">Lien de désabonnement invalide.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle>Désabonnement</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          {status === "pending" && (
            <>
              <p className="text-muted-foreground">
                Voulez-vous vous désabonner de cette liste de diffusion ?
              </p>
              <Button onClick={handleUnsubscribe} disabled={loading}>
                {loading ? "Traitement..." : "Se désabonner"}
              </Button>
            </>
          )}
          {status === "success" && (
            <p className="text-green-600">
              Vous avez été désabonné avec succès. Vous ne recevrez plus d&apos;emails de cette liste.
            </p>
          )}
          {status === "error" && (
            <p className="text-destructive">
              Une erreur est survenue. Le lien est peut-être expiré ou invalide.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function UnsubscribePage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Chargement...</div>}>
      <UnsubscribeContent />
    </Suspense>
  );
}
