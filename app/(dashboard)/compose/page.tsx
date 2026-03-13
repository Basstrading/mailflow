"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

interface Entity {
  id: string;
  name: string;
  fromEmail: string;
  fromName: string;
  isVerified: boolean;
}

const VARIABLES = [
  { key: "{{prenom}}", label: "Prénom", desc: "Prénom du destinataire" },
  { key: "{{nom}}", label: "Nom", desc: "Nom du destinataire" },
  { key: "{{email}}", label: "Email", desc: "Email du destinataire" },
];

export default function ComposePage() {
  const [entities, setEntities] = useState<Entity[]>([]);
  const [sending, setSending] = useState(false);
  const [form, setForm] = useState({
    entityId: "",
    to: "",
    firstName: "",
    lastName: "",
    subject: "",
    html: "",
  });

  useEffect(() => {
    fetch("/api/entities")
      .then((r) => r.json())
      .then((data) => {
        const verified = data.filter((e: Entity) => e.isVerified);
        setEntities(verified);
        if (verified.length === 1) {
          setForm((f) => ({ ...f, entityId: verified[0].id }));
        }
      });
  }, []);

  function insertVariable(variable: string, field: "subject" | "html") {
    setForm((f) => ({ ...f, [field]: f[field] + variable }));
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!form.entityId || !form.to || !form.subject || !form.html) {
      toast.error("Veuillez remplir tous les champs");
      return;
    }

    setSending(true);
    try {
      const res = await fetch("/api/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entityId: form.entityId,
          to: form.to,
          firstName: form.firstName,
          lastName: form.lastName,
          subject: form.subject,
          html: form.html,
        }),
      });

      if (res.ok) {
        toast.success("Email envoyé !");
        setForm((f) => ({
          ...f,
          to: "",
          firstName: "",
          lastName: "",
          subject: "",
          html: "",
        }));
      } else {
        const data = await res.json();
        toast.error(data.error || "Erreur lors de l'envoi");
      }
    } catch {
      toast.error("Erreur réseau");
    }
    setSending(false);
  }

  const selectedEntity = entities.find((e) => e.id === form.entityId);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <h1 className="text-3xl font-bold">Envoyer un email</h1>

      <Card>
        <CardHeader>
          <CardTitle>Nouvel email</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSend} className="space-y-4">
            <div className="space-y-2">
              <Label>Expéditeur</Label>
              <Select
                value={form.entityId}
                onValueChange={(v: string | null) =>
                  setForm({ ...form, entityId: v ?? "" })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner une entité" />
                </SelectTrigger>
                <SelectContent>
                  {entities.map((e) => (
                    <SelectItem key={e.id} value={e.id}>
                      {e.fromName} &lt;{e.fromEmail}&gt;
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {entities.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  Aucune entité vérifiée. Configurez d&apos;abord un domaine
                  dans Entités.
                </p>
              )}
              {selectedEntity && (
                <p className="text-xs text-muted-foreground">
                  Envoi depuis : {selectedEntity.fromName} &lt;
                  {selectedEntity.fromEmail}&gt;
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Destinataire</Label>
              <Input
                type="email"
                value={form.to}
                onChange={(e) => setForm({ ...form, to: e.target.value })}
                placeholder="destinataire@exemple.com"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Prénom (optionnel)</Label>
                <Input
                  value={form.firstName}
                  onChange={(e) =>
                    setForm({ ...form, firstName: e.target.value })
                  }
                  placeholder="Jean"
                />
              </div>
              <div className="space-y-2">
                <Label>Nom (optionnel)</Label>
                <Input
                  value={form.lastName}
                  onChange={(e) =>
                    setForm({ ...form, lastName: e.target.value })
                  }
                  placeholder="Dupont"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Objet</Label>
                <div className="flex gap-1">
                  {VARIABLES.map((v) => (
                    <Badge
                      key={v.key}
                      variant="outline"
                      className="cursor-pointer text-xs hover:bg-primary hover:text-primary-foreground"
                      onClick={() => insertVariable(v.key, "subject")}
                    >
                      {v.label}
                    </Badge>
                  ))}
                </div>
              </div>
              <Input
                value={form.subject}
                onChange={(e) => setForm({ ...form, subject: e.target.value })}
                placeholder="Ex: Bonjour {{prenom}}, votre devis"
                required
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Contenu</Label>
                <div className="flex gap-1">
                  {VARIABLES.map((v) => (
                    <Badge
                      key={v.key}
                      variant="outline"
                      className="cursor-pointer text-xs hover:bg-primary hover:text-primary-foreground"
                      onClick={() => insertVariable(v.key, "html")}
                    >
                      {v.label}
                    </Badge>
                  ))}
                </div>
              </div>
              <textarea
                className="flex min-h-[200px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                value={form.html}
                onChange={(e) => setForm({ ...form, html: e.target.value })}
                placeholder={"Bonjour {{prenom}},\n\nVotre contenu ici...\n\nCordialement,\n{{nom_expediteur}}"}
                required
              />
              <p className="text-xs text-muted-foreground">
                Variables disponibles : <code>{"{{prenom}}"}</code>{" "}
                <code>{"{{nom}}"}</code> <code>{"{{email}}"}</code> — Vous
                pouvez écrire du texte simple ou du HTML.
              </p>
            </div>

            <Button type="submit" className="w-full" disabled={sending}>
              {sending ? "Envoi en cours..." : "Envoyer"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
